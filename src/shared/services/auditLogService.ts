/**
 * Audit Log Service
 * Handles logging of user actions and system events for compliance and debugging
 */

import { supabase } from '@/core/supabase';

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface AuditLogFilter {
  user_id?: string;
  action?: string;
  resource_type?: string;
  severity?: string;
  date_from?: string;
  date_to?: string;
}

export class AuditLogService {
  
  /**
   * Send audit log entry
   */
  async sendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          ...entry,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to send audit log:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Audit log service error:', error);
      return false;
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filter: AuditLogFilter = {}, limit = 100): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      if (filter.action) {
        query = query.eq('action', filter.action);
      }
      if (filter.resource_type) {
        query = query.eq('resource_type', filter.resource_type);
      }
      if (filter.severity) {
        query = query.eq('severity', filter.severity);
      }
      if (filter.date_from) {
        query = query.gte('timestamp', filter.date_from);
      }
      if (filter.date_to) {
        query = query.lte('timestamp', filter.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Audit log service error:', error);
      return [];
    }
  }

  /**
   * Log user action
   */
  async logUserAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details: Record<string, any> = {},
    severity: AuditLogEntry['severity'] = 'info'
  ): Promise<boolean> {
    return this.sendAuditLog({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      severity,
      ip_address: this.getClientIP(),
      user_agent: this.getUserAgent()
    });
  }

  /**
   * Log system event
   */
  async logSystemEvent(
    action: string,
    resourceType: string,
    details: Record<string, any> = {},
    severity: AuditLogEntry['severity'] = 'info'
  ): Promise<boolean> {
    return this.sendAuditLog({
      user_id: 'system',
      action,
      resource_type: resourceType,
      details,
      severity,
      ip_address: 'system',
      user_agent: 'system'
    });
  }

  /**
   * Get client IP address (mock implementation)
   */
  private getClientIP(): string {
    // In a real implementation, this would get the actual client IP
    return '127.0.0.1';
  }

  /**
   * Get user agent (mock implementation)
   */
  private getUserAgent(): string {
    // In a real implementation, this would get the actual user agent
    return 'Nexus-Dashboard/1.0';
  }
}

export const auditLogService = new AuditLogService();

// Convenience function for backward compatibility
export const sendAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => 
  auditLogService.sendAuditLog(entry); 