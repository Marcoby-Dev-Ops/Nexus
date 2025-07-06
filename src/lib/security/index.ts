/**
 * Security Foundation Library
 * Comprehensive frontend security utilities for Nexus
 */

import { supabase } from '@/lib/core/supabase';

// Types
export interface SecurityEvent {
  eventType: 'login' | 'logout' | 'data_access' | 'integration_added' | 
             'integration_removed' | 'permission_change' | 'data_export' |
             'suspicious_activity' | 'failed_login' | 'data_modification';
  eventDetails: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityConfig {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
  sessionTimeout: { hours: number };
  maxFailedLogins: { attempts: number; lockoutMinutes: number };
}

// Security utilities class
export class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig | null = null;

  private constructor() {}

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Load security configuration from database
   */
  async loadConfig(): Promise<SecurityConfig | null> {
    try {
      const { data, error } = await supabase
        .from('security_config')
        .select('config_key, config_value')
        .in('config_key', ['password_policy', 'session_timeout', 'max_failed_logins']);

      if (error) throw error;

      const configMap = data.reduce((acc, item) => {
        acc[item.config_key] = item.config_value;
        return acc;
      }, {} as Record<string, any>);

      this.config = {
        passwordPolicy: configMap.password_policy || {
          minLength: 12,
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: true,
        },
        sessionTimeout: configMap.session_timeout || { hours: 24 },
        maxFailedLogins: configMap.max_failed_logins || { attempts: 5, lockoutMinutes: 30 },
      };

      return this.config;
    } catch (error) {
      console.error('Failed to load security config:', error);
      return null;
    }
  }

  /**
   * Log security events to audit trail
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.rpc('log_security_event', {
        p_user_id: user?.id || null,
        p_event_type: event.eventType,
        p_event_details: event.eventDetails,
        p_ip_address: event.ipAddress || await this.getClientIP(),
        p_user_agent: event.userAgent || navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Encrypt sensitive data using Web Crypto API
   */
  async encryptData(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );

      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt sensitive data using Web Crypto API
   */
  async decryptData(encryptedData: string): Promise<string> {
    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Validate password strength according to policy
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const policy = this.config?.passwordPolicy;

    if (!policy) {
      return { isValid: false, errors: ['Security policy not loaded'] };
    }

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Monitor for suspicious activity patterns
   */
  async detectSuspiciousActivity(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: failedLogins } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_type', 'failed_login')
        .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());

      if (failedLogins && failedLogins.length >= 3) {
        await this.logSecurityEvent({
          eventType: 'suspicious_activity',
          eventDetails: {
            description: 'Multiple failed login attempts detected',
            failedAttempts: failedLogins.length,
          },
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Suspicious activity detection failed:', error);
      return false;
    }
  }

  /**
   * Check session validity and auto-logout if expired
   */
  async checkSessionValidity(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const config = this.config || await this.loadConfig();
      if (!config) return true; // Allow if config can't be loaded

      const sessionStart = new Date(session.user.created_at);
      const now = new Date();
      const sessionAge = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);

      if (sessionAge > config.sessionTimeout.hours) {
        await supabase.auth.signOut();
        await this.logSecurityEvent({
          eventType: 'logout',
          eventDetails: {
            description: 'Session automatically expired',
            sessionAge: `${sessionAge.toFixed(2)} hours`,
          },
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  /**
   * Secure data export with audit logging
   */
  async secureDataExport(data: any, filename: string): Promise<void> {
    try {
      // Log the export event
      await this.logSecurityEvent({
        eventType: 'data_export',
        eventDetails: {
          description: `Data exported to ${filename}`,
          dataSize: JSON.stringify(data).length,
          exportTime: new Date().toISOString(),
        },
      });

      // Create and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Secure data export failed:', error);
      throw error;
    }
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return null;
    }
  }

  /**
   * Initialize security monitoring
   */
  async initializeSecurity(): Promise<void> {
    try {
      // Load configuration
      await this.loadConfig();

      // Set up suspicious activity monitoring
      setInterval(() => {
        this.detectSuspiciousActivity();
      }, 10 * 60 * 1000); // Check every 10 minutes

      // Log initialization
      await this.logSecurityEvent({
        eventType: 'login',
        eventDetails: {
          description: 'Security monitoring initialized',
          timestamp: new Date().toISOString(),
        },
      });

      console.log('🔒 Security monitoring initialized successfully');
    } catch (error) {
      console.error('Security initialization failed:', error);
    }
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();

// Utility functions
export const validatePassword = (password: string) => securityManager.validatePassword(password);
export const logSecurityEvent = (event: SecurityEvent) => securityManager.logSecurityEvent(event);
export const encryptData = (data: string) => securityManager.encryptData(data);
export const secureDataExport = (data: any, filename: string) => securityManager.secureDataExport(data, filename);

// Auto-initialize security when module is imported
if (typeof window !== 'undefined') {
  securityManager.initializeSecurity();
} 