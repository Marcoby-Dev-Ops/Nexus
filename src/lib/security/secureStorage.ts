/**
 * Secure Storage Utilities
 * @description Encrypted localStorage wrapper for sensitive data
 */

import { STORAGE_CONFIG } from '@/lib/constants/security';

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
      console.warn('Failed to initialize encryption key:', error);
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
      console.warn('Encryption failed, using base64:', error);
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
      console.warn('Decryption failed, trying base64:', error);
      try {
        return atob(encryptedData);
      } catch {
        return encryptedData;
      }
    }
  }

  /**
   * Securely store data
   */
  public async setItem(key: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        version: '1.0',
      });

             const shouldEncrypt = STORAGE_CONFIG.SENSITIVE_KEYS.includes(key as any);
       const finalValue = shouldEncrypt 
         ? await this.encrypt(serializedValue)
         : serializedValue;

      localStorage.setItem(
        shouldEncrypt ? `secure_${key}` : key,
        finalValue
      );
    } catch (error) {
      console.error(`Failed to store ${key}:`, error);
      throw new Error(`Storage failed for key: ${key}`);
    }
  }

  /**
   * Securely retrieve data
   */
     public async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
     try {
       const shouldEncrypt = STORAGE_CONFIG.SENSITIVE_KEYS.includes(key as any);
       const storageKey = shouldEncrypt ? `secure_${key}` : key;
      const storedValue = localStorage.getItem(storageKey);

      if (!storedValue) {
        return defaultValue ?? null;
      }

      const rawValue = shouldEncrypt 
        ? await this.decrypt(storedValue)
        : storedValue;

      const parsed = JSON.parse(rawValue);

      // Check if data is expired
      if (parsed.timestamp && Date.now() - parsed.timestamp > STORAGE_CONFIG.MAX_AGE) {
        this.removeItem(key);
        return defaultValue ?? null;
      }

      return parsed.data;
    } catch (error) {
      console.warn(`Failed to retrieve ${key}:`, error);
      // Clean up corrupted data
      this.removeItem(key);
      return defaultValue ?? null;
    }
  }

  /**
   * Remove stored data
   */
     public removeItem(key: string): void {
     const shouldEncrypt = STORAGE_CONFIG.SENSITIVE_KEYS.includes(key as any);
     const storageKey = shouldEncrypt ? `secure_${key}` : key;
     localStorage.removeItem(storageKey);
   }

  /**
   * Clear all secure storage
   */
  public clearSecureStorage(): void {
    const keys = Object.keys(localStorage);
         keys.forEach(key => {
       if (key.startsWith('secure_') || STORAGE_CONFIG.SENSITIVE_KEYS.includes(key as any)) {
         localStorage.removeItem(key);
       }
     });
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
}

// Export singleton instance
export const secureStorage = SecureStorage.getInstance();

// Convenience functions
export const setSecureItem = (key: string, value: any) => secureStorage.setItem(key, value);
export const getSecureItem = <T>(key: string, defaultValue?: T) => secureStorage.getItem<T>(key, defaultValue);
export const removeSecureItem = (key: string) => secureStorage.removeItem(key);
export const clearAllSecureData = () => secureStorage.clearSecureStorage(); 