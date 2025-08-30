/**
 * Admin Services - Main Index
 * Exports all admin domain services
 */

export { FinancialService } from '@/services/core';
export { securityManager } from './security';
export { aiUsageMonitoringService } from './AIUsageMonitoringService';

// Security types
export interface SecurityEvent {
  id?: string;
  userId: string;
  eventType: 'login' | 'logout' | 'password_change' | 'permission_change' | 'data_access' | 'suspicious_activity';
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityManager {
  logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void>;
  validatePassword(password: string): boolean;
  encryptData(data: string): string;
  secureDataExport(data: any): string;
} 
