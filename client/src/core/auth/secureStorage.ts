/**
 * Secure Storage Utilities
 * @description Encrypted localStorage wrapper for sensitive data
 * Updated to use helper functions from src/lib/supabase.ts
 */

import { STORAGE_CONFIG } from '@/core/constants/security';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

// Simple encryption/decryption using Web Crypto API
class SecureStorage {
  private static instance: SecureStorage;
  private key: CryptoKey | null = null;

  private constructor() {}

  public static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * Log storage operation for security audit
   */
  private async logStorageOperation(operation: string, key: string, success: boolean, error?: any): Promise<void> {
    try {
      // Get current session context
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      
      const logData = {
        operation,
        key: key.startsWith('secure_') ? key.substring(8) : key, // Remove secure_ prefix for logging
        success,
        userId: session?.user?.id || 'anonymous',
        timestamp: new Date().toISOString(),
        error: error?.message || null
      };

      // Send to security log via edge function
      await supabaseService.callEdgeFunction('security_log', {
        type: 'STORAGE_OPERATION',
        message: `Storage ${operation}: ${key}`,
        details: logData
      });
    } catch (error) {
      // Silent fail for logging - don't break storage operations
      console.warn('Failed to log storage operation:', error);
    }
  }

  /**
   * Validate user session before sensitive operations
   */
  private async validateSession(): Promise<boolean> {
    try {
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      
      if (sessionResult.error || !session) {
        return false;
      }

      return authentikAuthService.isSessionValid(session);
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize encryption key
   */
  private async initializeKey(): Promise<void> {
    if (this.key) return;

    try {
      // Generate a key based on user session or use a default
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('nexus-secure-storage-key-v1'),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      this.key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('nexus-salt'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to initialize encryption key: ', error);
      this.key = null;
    }
  }

  /**
   * Encrypt data
   */
  private async encrypt(data: string): Promise<string> {
    if (!this.key) {
      await this.initializeKey();
    }

    if (!this.key) {
      // Fallback to base64 encoding if encryption fails
      return btoa(data);
    }

    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(data);
      
      const encryptedData = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.key,
        encodedData
      );

      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Encryption failed, using base64: ', error);
      return btoa(data);
    }
  }

  /**
   * Decrypt data
   */
  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.key) {
      await this.initializeKey();
    }

    if (!this.key) {
      // Fallback to base64 decoding
      try {
        return atob(encryptedData);
      } catch {
        return encryptedData;
      }
    }

    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decryptedData = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.key,
        data
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Decryption failed, trying base64: ', error);
      try {
        return atob(encryptedData);
      } catch {
        return encryptedData;
      }
    }
  }

  /**
   * Securely store data with session validation and logging
   */
  public async setItem(key: string, value: any): Promise<void> {
    try {
      // Validate input value
      if (value === undefined) {
        // eslint-disable-next-line no-console
        console.warn(`Attempting to store undefined value for key: ${key}`);
        await this.logStorageOperation('set', key, false, new Error('Undefined value'));
        return;
      }

      // Validate session for sensitive keys
      const shouldEncrypt = STORAGE_CONFIG.SENSITIVEKEYS.includes(key as any);
      if (shouldEncrypt) {
        const isValidSession = await this.validateSession();
        if (!isValidSession) {
          const error = new Error('Invalid session for sensitive storage operation');
          await this.logStorageOperation('set', key, false, error);
          throw error;
        }
      }

      // Ensure we don't store functions or other non-serializable values
      let serializableValue;
      try {
        serializableValue = JSON.parse(JSON.stringify(value));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Value for ${key} is not serializable: `, error);
        await this.logStorageOperation('set', key, false, error);
        throw new Error(`Cannot store non-serializable value for key: ${key}`);
      }

      const serializedValue = JSON.stringify({
        data: serializableValue,
        timestamp: Date.now(),
        version: '1.0',
      });

      const finalValue = shouldEncrypt 
        ? await this.encrypt(serializedValue)
        : serializedValue;

      // Validate final value before storing
      if (typeof finalValue !== 'string') {
        const error = new Error(`Final value for ${key} is not a string: ${typeof finalValue}`);
        await this.logStorageOperation('set', key, false, error);
        throw error;
      }

      localStorage.setItem(
        shouldEncrypt ? `secure_${key}` : key,
        finalValue
      );

      // Log successful operation
      await this.logStorageOperation('set', key, true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to store ${key}:`, error);
      await this.logStorageOperation('set', key, false, error);
      throw new Error(`Storage failed for key: ${key}`);
    }
  }

  /**
   * Securely retrieve data with session validation and logging
   */
  public async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const shouldEncrypt = STORAGE_CONFIG.SENSITIVEKEYS.includes(key as any);
      
      // Validate session for sensitive keys
      if (shouldEncrypt) {
        const isValidSession = await this.validateSession();
        if (!isValidSession) {
          const error = new Error('Invalid session for sensitive storage retrieval');
          await this.logStorageOperation('get', key, false, error);
          return defaultValue ?? null;
        }
      }

      const storageKey = shouldEncrypt ? `secure_${key}` : key;
      const storedValue = localStorage.getItem(storageKey);

      if (!storedValue) {
        await this.logStorageOperation('get', key, true, null);
        return defaultValue ?? null;
      }

      // Handle cases where the stored value is not a string or is corrupted
      if (typeof storedValue !== 'string') {
        // eslint-disable-next-line no-console
        console.warn(`Invalid stored value type for ${key}:`, typeof storedValue);
        this.removeItem(key);
        await this.logStorageOperation('get', key, false, new Error('Invalid value type'));
        return defaultValue ?? null;
      }

      // Check for obvious corruption (e.g., "[object Object]")
      if (storedValue === '[object Object]' || storedValue.startsWith('[object ')) {
        // eslint-disable-next-line no-console
        console.warn(`Corrupted stored value detected for ${key}:`, storedValue);
        this.removeItem(key);
        await this.logStorageOperation('get', key, false, new Error('Corrupted value'));
        return defaultValue ?? null;
      }

      const rawValue = shouldEncrypt 
        ? await this.decrypt(storedValue)
        : storedValue;

      // Validate that rawValue is a string before parsing
      if (typeof rawValue !== 'string') {
        // eslint-disable-next-line no-console
        console.warn(`Decrypted value is not a string for ${key}:`, typeof rawValue);
        this.removeItem(key);
        await this.logStorageOperation('get', key, false, new Error('Invalid decrypted value'));
        return defaultValue ?? null;
      }

      let parsed;
      try {
        parsed = JSON.parse(rawValue);
      } catch (parseError) {
        // eslint-disable-next-line no-console
        console.warn(`JSON parse error for ${key}:`, parseError, 'Raw value: ', rawValue);
        this.removeItem(key);
        await this.logStorageOperation('get', key, false, parseError);
        return defaultValue ?? null;
      }

      // Validate parsed structure
      if (!parsed || typeof parsed !== 'object') {
        // eslint-disable-next-line no-console
        console.warn(`Invalid parsed structure for ${key}:`, parsed);
        this.removeItem(key);
        await this.logStorageOperation('get', key, false, new Error('Invalid parsed structure'));
        return defaultValue ?? null;
      }

      // Check if data is expired
      if (parsed.timestamp && Date.now() - parsed.timestamp > STORAGE_CONFIG.MAXAGE) {
        this.removeItem(key);
        await this.logStorageOperation('get', key, false, new Error('Data expired'));
        return defaultValue ?? null;
      }

      await this.logStorageOperation('get', key, true);
      return parsed.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to retrieve ${key}:`, error);
      // Clean up corrupted data
      this.removeItem(key);
      await this.logStorageOperation('get', key, false, error);
      return defaultValue ?? null;
    }
  }

  /**
   * Remove stored data with logging
   */
  public async removeItem(key: string): Promise<void> {
    try {
      const shouldEncrypt = STORAGE_CONFIG.SENSITIVEKEYS.includes(key as any);
      const storageKey = shouldEncrypt ? `secure_${key}` : key;
      
      const existed = localStorage.getItem(storageKey) !== null;
      localStorage.removeItem(storageKey);
      
      await this.logStorageOperation('remove', key, true, null);
    } catch (error) {
      await this.logStorageOperation('remove', key, false, error);
      throw error;
    }
  }

  /**
   * Clear all secure storage with logging
   */
  public async clearSecureStorage(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const removedKeys: string[] = [];
      
      keys.forEach(key => {
        if (key.startsWith('secure_') || STORAGE_CONFIG.SENSITIVEKEYS.includes(key as any)) {
          localStorage.removeItem(key);
          removedKeys.push(key);
        }
      });

      // Log the bulk operation
      await supabaseService.callEdgeFunction('security_log', {
        type: 'STORAGE_OPERATION',
        message: 'Bulk storage clear',
        details: {
          operation: 'clear',
          keysRemoved: removedKeys.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Failed to log storage clear operation:', error);
    }
  }

  /**
   * Check if Web Crypto API is available
   */
  public static isSecureStorageAvailable(): boolean {
    return typeof window !== 'undefined' && 
           window.crypto && 
           window.crypto.subtle &&
           typeof localStorage !== 'undefined';
  }

  /**
   * Clean up corrupted localStorage entries with logging
   */
  public async cleanupCorruptedEntries(): Promise<void> {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      try {
        const value = localStorage.getItem(key);
        if (value === '[object Object]' || (value && value.startsWith('[object '))) {
          // eslint-disable-next-line no-console
          console.warn(`Found corrupted entry: ${key} = ${value}`);
          keysToRemove.push(key);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Error checking key ${key}:`, error);
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      // eslint-disable-next-line no-console
      console.log(`Removing corrupted entry: ${key}`);
      localStorage.removeItem(key);
    });
    
    if (keysToRemove.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`Cleaned up ${keysToRemove.length} corrupted localStorage entries`);
      
      // Log the cleanup operation
      await supabaseService.callEdgeFunction('security_log', {
        type: 'STORAGE_OPERATION',
        message: 'Storage cleanup completed',
        details: {
          operation: 'cleanup',
          keysRemoved: keysToRemove.length,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get storage statistics for audit
   */
  public async getStorageStats(): Promise<{
    totalKeys: number;
    secureKeys: number;
    regularKeys: number;
    totalSize: number;
  }> {
    const keys = Object.keys(localStorage);
    let totalSize = 0;
    let secureKeys = 0;
    let regularKeys = 0;

    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length;
        if (key.startsWith('secure_') || STORAGE_CONFIG.SENSITIVEKEYS.includes(key as any)) {
          secureKeys++;
        } else {
          regularKeys++;
        }
      }
    });

    return {
      totalKeys: keys.length,
      secureKeys,
      regularKeys,
      totalSize
    };
  }

  /**
   * Sync storage metadata with Supabase for audit purposes
   */
  public async syncStorageMetadata(): Promise<void> {
    try {
      const stats = await this.getStorageStats();
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      
      await supabaseService.callEdgeFunction('store_storage_metadata', {
        userId: session?.user?.id || 'anonymous',
        stats,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
      });
    } catch (error) {
      console.warn('Failed to sync storage metadata:', error);
    }
  }
}

// Export singleton instance
export const secureStorage = SecureStorage.getInstance();

// Convenience functions
export const setSecureItem = (key: string, value: any) => secureStorage.setItem(key, value);
export const getSecureItem = <T>(key: string, defaultValue?: T) => secureStorage.getItem<T>(key, defaultValue);
export const removeSecureItem = (key: string) => secureStorage.removeItem(key);
export const clearAllSecureData = () => secureStorage.clearSecureStorage();
export const cleanupCorruptedStorage = () => secureStorage.cleanupCorruptedEntries();
export const getStorageStats = () => secureStorage.getStorageStats();
export const syncStorageMetadata = () => secureStorage.syncStorageMetadata(); 
