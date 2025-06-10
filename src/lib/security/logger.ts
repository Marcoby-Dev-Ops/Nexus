/**
 * Secure Logger
 * @description Production-safe logging with sensitive data filtering
 */

import { SECURITY_CHECKS } from '@/lib/constants/security';

// Sensitive patterns to filter from logs
const SENSITIVE_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /\b(?:sk_live_|sk_test_|pk_live_|pk_test_)[A-Za-z0-9]{24,}\b/g, // Stripe keys
  /\b(?:pat-|ghp_|gho_|ghu_|ghs_)[A-Za-z0-9_-]{20,}\b/g, // GitHub/HubSpot tokens
  /\b[A-Za-z0-9+/]{40,}={0,2}\b/g, // Base64 encoded tokens (40+ chars)
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card numbers
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\bpassword["\s]*[:=]["\s]*[^"\s,}]+/gi, // Password fields
  /\btoken["\s]*[:=]["\s]*[^"\s,}]+/gi, // Token fields
  /\bkey["\s]*[:=]["\s]*[^"\s,}]+/gi, // Key fields
];

class SecureLogger {
  private static instance: SecureLogger;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  public static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  /**
   * Filter sensitive data from log messages
   */
  private filterSensitiveData(message: any): any {
    if (typeof message === 'string') {
      let filtered = message;
      SENSITIVE_PATTERNS.forEach(pattern => {
        filtered = filtered.replace(pattern, '[REDACTED]');
      });
      return filtered;
    }

    if (typeof message === 'object' && message !== null) {
      try {
        const stringified = JSON.stringify(message, null, 2);
        let filtered = stringified;
        SENSITIVE_PATTERNS.forEach(pattern => {
          filtered = filtered.replace(pattern, '[REDACTED]');
        });
        return JSON.parse(filtered);
      } catch {
        return '[OBJECT - COULD NOT SERIALIZE]';
      }
    }

    return message;
  }

  /**
   * Safe console.log replacement
   */
  public log(...args: any[]): void {
    if (this.isProduction && SECURITY_CHECKS.DISABLE_CONSOLE_IN_PROD) {
      return; // Disable logging in production
    }

    const filteredArgs = args.map(arg => this.filterSensitiveData(arg));
    console.log(...filteredArgs);
  }

  /**
   * Safe console.warn replacement
   */
  public warn(...args: any[]): void {
    const filteredArgs = args.map(arg => this.filterSensitiveData(arg));
    console.warn(...filteredArgs);
  }

  /**
   * Safe console.error replacement
   */
  public error(...args: any[]): void {
    const filteredArgs = args.map(arg => this.filterSensitiveData(arg));
    console.error(...filteredArgs);
  }

  /**
   * Debug logging (only in development)
   */
  public debug(...args: any[]): void {
    if (!this.isProduction) {
      const filteredArgs = args.map(arg => this.filterSensitiveData(arg));
      console.debug('🐛 DEBUG:', ...filteredArgs);
    }
  }

  /**
   * Info logging with emoji
   */
  public info(...args: any[]): void {
    if (!this.isProduction || !SECURITY_CHECKS.DISABLE_CONSOLE_IN_PROD) {
      const filteredArgs = args.map(arg => this.filterSensitiveData(arg));
      console.info('ℹ️ INFO:', ...filteredArgs);
    }
  }

  /**
   * Success logging with emoji
   */
  public success(...args: any[]): void {
    if (!this.isProduction || !SECURITY_CHECKS.DISABLE_CONSOLE_IN_PROD) {
      const filteredArgs = args.map(arg => this.filterSensitiveData(arg));
      console.log('✅ SUCCESS:', ...filteredArgs);
    }
  }

  /**
   * Security-specific logging
   */
  public security(message: string, details?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type: 'SECURITY',
      message,
      details: details ? this.filterSensitiveData(details) : undefined,
    };

    // Always log security events, even in production
    console.warn('🔒 SECURITY:', logEntry);

    // In production, you might want to send this to a security monitoring service
    if (this.isProduction) {
      // TODO: Send to security monitoring service
      // securityMonitoringService.log(logEntry);
    }
  }
}

// Export singleton instance
export const logger = SecureLogger.getInstance();

// Convenience functions
export const log = (...args: any[]) => logger.log(...args);
export const warn = (...args: any[]) => logger.warn(...args);
export const error = (...args: any[]) => logger.error(...args);
export const debug = (...args: any[]) => logger.debug(...args);
export const info = (...args: any[]) => logger.info(...args);
export const success = (...args: any[]) => logger.success(...args);
export const securityLog = (message: string, details?: any) => logger.security(message, details); 