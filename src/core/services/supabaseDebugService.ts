/**
 * Supabase Debug Service
 * Provides debugging and diagnostic capabilities for Supabase operations
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger';
import { BaseService, type ServiceResponse } from './BaseService';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DebugInfo {
  connectionStatus: 'connected' | 'error';
  lastError?: string;
  tables: string[];
  userCount: number;
  sessionInfo?: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface SystemHealth {
  database: boolean;
  auth: boolean;
  storage: boolean;
  realtime: boolean;
  lastCheck: Date;
}

export interface DebugLogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  userId?: string;
}

// ============================================================================
// SUPABASE DEBUG SERVICE CLASS
// ============================================================================

class SupabaseDebugService extends BaseService {
  private queryWrapper = new DatabaseQueryWrapper();

  constructor() {
    super('SupabaseDebugService');
  }

  /**
   * Get debug information about Supabase connection
   */
  async getDebugInfo(): Promise<ServiceResponse<DebugInfo>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getDebugInfo', {});

      // Test connection using enhanced utilities
      const { error: testError } = await this.queryWrapper.query(
        async () => this.supabase
          .from('user_profiles')
          .select('id')
          .limit(1),
        { context: 'debug-connection-test' }
      );

      const connectionStatus = testError ? 'error' : 'connected';

      // Get available tables (this is a simplified approach)
      const tables = ['user_profiles', 'companies', 'user_activity', 'chat_conversations'];

      // Get user count using enhanced utilities
      const { data: userData } = await this.queryWrapper.query(
        async () => this.supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true }),
        { context: 'debug-user-count' }
      );

      const userCount = userData?.length || 0;

      // Get session info
      const { data: { user } } = await this.supabase.auth.getUser();
      const sessionInfo = user ? {
        userId: user.id,
        email: user.email || '',
        role: user.user_metadata?.role || 'user'
      } : undefined;

      const debugInfo: DebugInfo = {
        connectionStatus,
        lastError: testError?.message,
        tables,
        userCount: userCount || 0,
        sessionInfo
      };

      this.logSuccess('getDebugInfo', { connectionStatus, userCount });
      return { data: debugInfo, error: null };
    }, 'getDebugInfo');
  }

  /**
   * Test database connection with detailed error reporting
   */
  async testDatabaseConnection(): Promise<ServiceResponse<{
    connected: boolean;
    latency: number;
    error?: string;
    details?: Record<string, any>;
  }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('testDatabaseConnection', {});

      const startTime = Date.now();
      
      try {
        const { data, error } = await this.supabase
          .from('user_profiles')
          .select('id')
          .limit(1);

        const latency = Date.now() - startTime;

        if (error) {
          this.logFailure('testDatabaseConnection', error, { latency });
          return {
            data: {
              connected: false,
              latency,
              error: error.message,
              details: {
                code: error.code,
                details: error.details,
                hint: error.hint
              }
            },
            error: null
          };
        }

        this.logSuccess('testDatabaseConnection', { latency });
        return {
          data: {
            connected: true,
            latency,
            details: {
              recordsReturned: data?.length || 0
            }
          },
          error: null
        };
      } catch (error) {
        const latency = Date.now() - startTime;
        this.logFailure('testDatabaseConnection', error, { latency });
        
        return {
          data: {
            connected: false,
            latency,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          error: null
        };
      }
    }, 'testDatabaseConnection');
  }

  /**
   * Test authentication status
   */
  async testAuthentication(): Promise<ServiceResponse<{
    authenticated: boolean;
    user?: {
      id: string;
      email: string;
      role?: string;
    };
    error?: string;
  }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('testAuthentication', {});

      try {
        const { data: { user }, error } = await this.supabase.auth.getUser();

        if (error) {
          this.logFailure('testAuthentication', error);
          return {
            data: {
              authenticated: false,
              error: error.message
            },
            error: null
          };
        }

        if (!user) {
          this.logSuccess('testAuthentication', { authenticated: false });
          return {
            data: {
              authenticated: false
            },
            error: null
          };
        }

        this.logSuccess('testAuthentication', { 
          authenticated: true, 
          userId: user.id 
        });

        return {
          data: {
            authenticated: true,
            user: {
              id: user.id,
              email: user.email || '',
              role: user.user_metadata?.role
            }
          },
          error: null
        };
      } catch (error) {
        this.logFailure('testAuthentication', error);
        return {
          data: {
            authenticated: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          error: null
        };
      }
    }, 'testAuthentication');
  }

  /**
   * Test RLS policies
   */
  async testRLSPolicies(): Promise<ServiceResponse<{
    policies: Array<{
      table: string;
      policy: string;
      enabled: boolean;
      error?: string;
    }>;
  }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('testRLSPolicies', {});

      const tables = ['user_profiles', 'companies', 'user_activity'];
      const policies: Array<{
        table: string;
        policy: string;
        enabled: boolean;
        error?: string;
      }> = [];

      for (const table of tables) {
        try {
          const { error } = await this.supabase
            .from(table)
            .select('id')
            .limit(1);

          policies.push({
            table,
            policy: 'select',
            enabled: !error,
            error: error?.message
          });
        } catch (error) {
          policies.push({
            table,
            policy: 'select',
            enabled: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      this.logSuccess('testRLSPolicies', { 
        totalPolicies: policies.length,
        enabledPolicies: policies.filter(p => p.enabled).length
      });

      return {
        data: { policies },
        error: null
      };
    }, 'testRLSPolicies');
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<ServiceResponse<SystemHealth>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getSystemHealth', {});

      const health: SystemHealth = {
        database: false,
        auth: false,
        storage: false,
        realtime: false,
        lastCheck: new Date()
      };

      try {
        // Test database
        const { error: dbError } = await this.supabase
          .from('user_profiles')
          .select('id')
          .limit(1);
        health.database = !dbError;

        // Test auth
        await this.supabase.auth.getUser();
        health.auth = true; // Auth service is working if we can call it

        // Test storage (if available)
        try {
          await this.supabase.storage.listBuckets();
          health.storage = true;
        } catch {
          health.storage = false;
        }

        // Test realtime (if available)
        try {
          this.supabase.channel('health_check');
          health.realtime = true;
        } catch {
          health.realtime = false;
        }

        // Log health status
        await this.logDebug('info', 'System health check completed', health);

        this.logSuccess('getSystemHealth', health);
        return { data: health, error: null };

      } catch (error) {
        this.logFailure('getSystemHealth', error);
        return {
          data: health,
          error: null
        };
      }
    }, 'getSystemHealth');
  }

  /**
   * Log debug information
   */
  async logDebug(
    level: DebugLogEntry['level'],
    message: string,
    context?: Record<string, any>
  ): Promise<ServiceResponse<void>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: { user } } = await this.supabase.auth.getUser();
        
        const logEntry: Omit<DebugLogEntry, 'id'> = {
          level,
          message,
          context,
          timestamp: new Date().toISOString(),
          userId: user?.id
        };

        const { error } = await this.supabase
          .from('debug_logs')
          .insert(logEntry);

        if (error) {
          this.logFailure('logDebug', error);
          return { data: null, error };
        }

        this.logSuccess('logDebug', { level, message });
        return { data: null, error: null };
      } catch (error) {
        this.logFailure('logDebug', error);
        return { data: null, error };
      }
    }, 'logDebug');
  }

  /**
   * Get debug logs
   */
  async getDebugLogs(
    limit: number = 100,
    level?: DebugLogEntry['level']
  ): Promise<ServiceResponse<DebugLogEntry[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getDebugLogs', { limit, level });

      try {
        let query = this.supabase
          .from('debug_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(limit);

        if (level) {
          query = query.eq('level', level);
        }

        const { data, error } = await query;

        if (error) {
          this.logFailure('getDebugLogs', error);
          return { data: null, error };
        }

        this.logSuccess('getDebugLogs', { 
          count: data?.length || 0 
        });

        return { 
          data: data as DebugLogEntry[] || [], 
          error: null 
        };
      } catch (error) {
        this.logFailure('getDebugLogs', error);
        return { data: null, error };
      }
    }, 'getDebugLogs');
  }

  /**
   * Clear debug logs
   */
  async clearDebugLogs(): Promise<ServiceResponse<void>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('clearDebugLogs', {});

      try {
        const { error } = await this.supabase
          .from('debug_logs')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except a dummy record

        if (error) {
          this.logFailure('clearDebugLogs', error);
          return { data: null, error };
        }

        this.logSuccess('clearDebugLogs');
        return { data: null, error: null };
      } catch (error) {
        this.logFailure('clearDebugLogs', error);
        return { data: null, error };
      }
    }, 'clearDebugLogs');
  }

  /**
   * Test specific table access
   */
  async testTableAccess(tableName: string): Promise<ServiceResponse<{
    accessible: boolean;
    error?: string;
    recordCount?: number;
  }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('testTableAccess', { tableName });

      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          this.logFailure('testTableAccess', error, { tableName });
          return {
            data: {
              accessible: false,
              error: error.message
            },
            error: null
          };
        }

        this.logSuccess('testTableAccess', { 
          tableName, 
          recordCount: data?.length || 0 
        });

        return {
          data: {
            accessible: true,
            recordCount: data?.length || 0
          },
          error: null
        };
      } catch (error) {
        this.logFailure('testTableAccess', error, { tableName });
        return {
          data: {
            accessible: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          error: null
        };
      }
    }, 'testTableAccess');
  }
}

// Export singleton instance
export const supabaseDebugService = new SupabaseDebugService(); 