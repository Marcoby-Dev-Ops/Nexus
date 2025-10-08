/**
 * Audit Log Service
 * Handles audit logging for security and compliance tracking
 */

import { selectData, insertOne, updateOne, deleteOne } from '@/lib/api-client';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';

// ============================================================================
// INTERFACES
// ============================================================================

export interface AuditLogEntry {
  id?: string;
  userid: string;
  action: string;
  resourcetype: string;
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

// ============================================================================
// AUDIT LOG SERVICE CLASS
// ============================================================================

export class AuditLogService extends BaseService {
  constructor() {
    super('AuditLogService');
  }

  /**
   * Send audit log entry
   */
  async sendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('sendAuditLog', { 
        action: entry.action, 
        resourceType: entry.resourcetype,
        severity: entry.severity 
      });

      const { error } = await this.supabase
        .from('audit_logs')
        .insert({
          ...entry,
          timestamp: new Date().toISOString()
        });

      if (error) {
        this.logFailure('sendAuditLog', error, { entry });
        return { data: null, error };
      }

      this.logSuccess('sendAuditLog', { 
        action: entry.action, 
        resourceType: entry.resourcetype 
      });
      return { data: true, error: null };
    }, 'sendAuditLog');
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filter: AuditLogFilter = {}, limit = 100): Promise<ServiceResponse<AuditLogEntry[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getAuditLogs', { filter, limit });

      try {
        let query = this.supabase
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
          this.logFailure('getAuditLogs', error, { filter });
          return { data: null, error };
        }

        this.logSuccess('getAuditLogs', { 
          count: data?.length || 0,
          filter 
        });

        return { data: data as AuditLogEntry[] || [], error: null };
      } catch (error) {
        this.logFailure('getAuditLogs', error, { filter });
        return { data: null, error };
      }
    }, 'getAuditLogs');
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
  ): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('logUserAction', { 
        userId, 
        action, 
        resourceType, 
        resourceId,
        severity 
      });

      const logEntry: Omit<AuditLogEntry, 'id' | 'timestamp'> = {
        userid: userId,
        action,
        resourcetype: resourceType,
        resource_id: resourceId,
        details,
        ip_address: this.getClientIP(),
        user_agent: this.getUserAgent(),
        severity
      };

      const result = await this.sendAuditLog(logEntry);
      
      if (!result.success) {
        this.logFailure('logUserAction', result.error, { 
          userId, 
          action, 
          resourceType 
        });
        return { data: null, error: result.error };
      }

      this.logSuccess('logUserAction', { 
        userId, 
        action, 
        resourceType 
      });
      return { data: true, error: null };
    }, 'logUserAction');
  }

  /**
   * Log system event
   */
  async logSystemEvent(
    action: string,
    resourceType: string,
    details: Record<string, any> = {},
    severity: AuditLogEntry['severity'] = 'info'
  ): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('logSystemEvent', { 
        action, 
        resourceType, 
        severity 
      });

      const logEntry: Omit<AuditLogEntry, 'id' | 'timestamp'> = {
        userid: 'system',
        action,
        resourcetype: resourceType,
        details,
        ip_address: this.getClientIP(),
        user_agent: this.getUserAgent(),
        severity
      };

      const result = await this.sendAuditLog(logEntry);
      
      if (!result.success) {
        this.logFailure('logSystemEvent', result.error, { 
          action, 
          resourceType 
        });
        return { data: null, error: result.error };
      }

      this.logSuccess('logSystemEvent', { 
        action, 
        resourceType 
      });
      return { data: true, error: null };
    }, 'logSystemEvent');
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: string, 
    limit = 50
  ): Promise<ServiceResponse<AuditLogEntry[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getUserAuditLogs', { userId, limit });

      const result = await this.getAuditLogs({ user_id: userId }, limit);
      
      if (!result.success) {
        this.logFailure('getUserAuditLogs', result.error, { userId });
        return { data: null, error: result.error };
      }

      this.logSuccess('getUserAuditLogs', { 
        userId, 
        count: result.data?.length || 0 
      });
      return result;
    }, 'getUserAuditLogs');
  }

  /**
   * Get audit logs by severity
   */
  async getAuditLogsBySeverity(
    severity: AuditLogEntry['severity'],
    limit = 100
  ): Promise<ServiceResponse<AuditLogEntry[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getAuditLogsBySeverity', { severity, limit });

      const result = await this.getAuditLogs({ severity }, limit);
      
      if (!result.success) {
        this.logFailure('getAuditLogsBySeverity', result.error, { severity });
        return { data: null, error: result.error };
      }

      this.logSuccess('getAuditLogsBySeverity', { 
        severity, 
        count: result.data?.length || 0 
      });
      return result;
    }, 'getAuditLogsBySeverity');
  }

  /**
   * Get audit logs by date range
   */
  async getAuditLogsByDateRange(
    dateFrom: string,
    dateTo: string,
    limit = 100
  ): Promise<ServiceResponse<AuditLogEntry[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getAuditLogsByDateRange', { dateFrom, dateTo, limit });

      const result = await this.getAuditLogs({ 
        date_from: dateFrom, 
        date_to: dateTo 
      }, limit);
      
      if (!result.success) {
        this.logFailure('getAuditLogsByDateRange', result.error, { 
          dateFrom, 
          dateTo 
        });
        return { data: null, error: result.error };
      }

      this.logSuccess('getAuditLogsByDateRange', { 
        dateFrom, 
        dateTo, 
        count: result.data?.length || 0 
      });
      return result;
    }, 'getAuditLogsByDateRange');
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(): Promise<ServiceResponse<{
    totalLogs: number;
    bySeverity: Record<string, number>;
    byAction: Record<string, number>;
    byResourceType: Record<string, number>;
    recentActivity: number;
  }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getAuditStatistics', {});

      try {
        // Get total count
        const { count: totalLogs } = await this.supabase
          .from('audit_logs')
          .select('*', { count: 'exact', head: true });

        // Get logs for analysis
        const { data: logs, error } = await this.supabase
          .from('audit_logs')
          .select('severity, action, resourcetype, timestamp')
          .order('timestamp', { ascending: false })
          .limit(1000);

        if (error) {
          this.logFailure('getAuditStatistics', error);
          return { data: null, error };
        }

        // Calculate statistics
        const bySeverity: Record<string, number> = {};
        const byAction: Record<string, number> = {};
        const byResourceType: Record<string, number> = {};
        let recentActivity = 0;

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        logs?.forEach(log => {
          // Count by severity
          bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
          
          // Count by action
          byAction[log.action] = (byAction[log.action] || 0) + 1;
          
          // Count by resource type
          byResourceType[log.resourcetype] = (byResourceType[log.resourcetype] || 0) + 1;
          
          // Count recent activity
          if (new Date(log.timestamp) > oneDayAgo) {
            recentActivity++;
          }
        });

        const statistics = {
          totalLogs: totalLogs || 0,
          bySeverity,
          byAction,
          byResourceType,
          recentActivity
        };

        this.logSuccess('getAuditStatistics', statistics);
        return { data: statistics, error: null };
      } catch (error) {
        this.logFailure('getAuditStatistics', error);
        return { data: null, error };
      }
    }, 'getAuditStatistics');
  }

  /**
   * Clear old audit logs
   */
  async clearOldAuditLogs(daysOld: number = 90): Promise<ServiceResponse<number>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('clearOldAuditLogs', { daysOld });

      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const { error, count } = await this.supabase
          .from('audit_logs')
          .delete()
          .lt('timestamp', cutoffDate.toISOString());

        if (error) {
          this.logFailure('clearOldAuditLogs', error, { daysOld });
          return { data: null, error };
        }

        this.logSuccess('clearOldAuditLogs', { 
          daysOld, 
          deletedCount: count || 0 
        });
        return { data: count || 0, error: null };
      } catch (error) {
        this.logFailure('clearOldAuditLogs', error, { daysOld });
        return { data: null, error };
      }
    }, 'clearOldAuditLogs');
  }

  /**
   * Get client IP address
   */
  private getClientIP(): string {
    // In a real implementation, this would extract from request headers
    // For now, return a placeholder
    return '127.0.0.1';
  }

  /**
   * Get user agent string
   */
  private getUserAgent(): string {
    // In a real implementation, this would extract from request headers
    // For now, return a placeholder
    return 'Nexus-Audit-Service/1.0';
  }
}

// Export singleton instance
export const auditLogService = new AuditLogService();

// Legacy function exports for backward compatibility
export const sendAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => 
  auditLogService.sendAuditLog(entry);

export const getAuditLogs = async (userId: string) => {
  const result = await auditLogService.getUserAuditLogs(userId);
  return result.success ? result.data : [];
};

export const addAuditLog = async (userId: string, log: any) => {
  const result = await auditLogService.logUserAction(
    userId,
    log.action || 'unknown',
    log.resourcetype || 'unknown',
    log.resource_id,
    log.details || {},
    log.severity || 'info'
  );
  return result.success;
}; 
