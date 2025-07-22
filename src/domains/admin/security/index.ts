/**
 * Admin Security Subdomain
 * Handles security management, authentication, and compliance
 */

// Security Components
export * from './components';

// Security Services
export * from './services';

// Security Hooks
export * from './hooks';

// Security Implementation
export { securityManager as SecurityManager } from './security';

// Security Types
export interface SecurityEvent {
  id: string;
  userId: string;
  eventType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SecurityConfig {
  enableMFA: boolean;
  enableAuditLogging: boolean;
  enablePasswordPolicy: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

export interface SecurityManager {
  logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void>;
  validatePassword(password: string): boolean;
  encryptData(data: string): string;
  secureDataExport(data: any): string;
}
