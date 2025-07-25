/**
 * Supabase Debug Service
 * Provides debugging utilities for Supabase operations
 */

import { supabase } from '@/lib/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger.ts';

export interface DebugInfo {
  connectionStatus: 'connected' | 'error';
  lastError?: string;
  tables: string[];
  userCount: number;
  sessionInfo?: {
    userId: string;
    email: string;
    role?: string;
  };
}

export interface DebugLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: Record<string, any>;
  user_id?: string;
  session_id?: string;
  timestamp: Date;
  source: string;
}

class SupabaseDebugService {
  private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Get debug information about Supabase connection
   */
  async getDebugInfo(): Promise<DebugInfo> {
    try {
      // Test connection using enhanced utilities
      const { error: testError } = await this.queryWrapper.query(
        async () => supabase
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
        async () => supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true }),
        { context: 'debug-user-count' }
      );

      const userCount = userData?.length || 0;

      // Get session info
      const { data: { user } } = await supabase.auth.getUser();
      const sessionInfo = user ? {
        userId: user.id,
        email: user.email,
        role: user.user_metadata?.role
      } : undefined;

      return {
        connectionStatus,
        lastError: testError?.message,
        tables,
        userCount: userCount || 0,
        sessionInfo
      };
    } catch (error) {
      return {
        connectionStatus: 'error',
        lastError: error instanceof Error ? error.message : 'Unknown error',
        tables: [],
        userCount: 0
      };
    }
  }

  /**
   * Test authentication flow
   */
  async testAuthFlow(): Promise<any> {
    try {
      const sessionManager = await import('@/core/auth/sessionManager').then(m => m.SessionManager.getInstance());
      const session = await sessionManager.ensureSession();
      
      return {
        success: true,
        session: {
          userId: session.user.id,
          email: session.user.email,
          hasAccessToken: !!session.access_token
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test database queries with authentication
   */
  async testDatabaseQueries(): Promise<any> {
    try {
      const { data: profile, error: profileError } = await this.queryWrapper.query(
        async () => supabase
          .from('user_profiles')
          .select('id, email')
          .limit(1),
        { context: 'debug-db-test' }
      );

      if (profileError) {
        return {
          success: false,
          error: profileError.message,
          test: 'profile-query'
        };
      }

      return {
        success: true,
        data: profile,
        test: 'profile-query'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        test: 'profile-query'
      };
    }
  }

  /**
   * Get detailed connection information
   */
  async getConnectionDetails(): Promise<any> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      return {
        hasSession: !!session,
        sessionValid: session ? !!session.access_token : false,
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at,
        tokenLength: session?.access_token?.length || 0
      };
    } catch (error) {
      return {
        hasSession: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Log debug information
   */
  async logDebug(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    try {
      const logEntry = {
        level,
        message,
        context,
        userid: userId,
        sessionid: this.generateSessionId(),
        timestamp: new Date().toISOString(),
        source: 'debug_service'
      };

      const { error } = await supabase
        .from('debug_logs')
        .insert(logEntry);

      if (error) {
        logger.error({ error, message }, 'Failed to log debug entry');
      } else {
        logger.debug({ level, message }, 'Debug log entry created');
      }
    } catch (error) {
      logger.error({ error, message }, 'Failed to create debug log entry');
    }
  }

  /**
   * Get debug logs for a user
   */
  async getDebugLogs(
    userId?: string,
    level?: 'debug' | 'info' | 'warn' | 'error',
    limit: number = 100
  ): Promise<DebugLog[]> {
    try {
      let query = supabase
        .from('debug_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (level) {
        query = query.eq('level', level);
      }

      const { data: logs, error } = await query;

      if (error) {
        logger.error({ userId, error }, 'Failed to fetch debug logs');
        return [];
      }

      return (logs || []).map(log => ({
        id: log.id,
        level: log.level,
        message: log.message,
        context: log.context || {},
        userid: log.user_id,
        sessionid: log.session_id,
        timestamp: new Date(log.timestamp),
        source: log.source
      }));
    } catch (error) {
      logger.error({ userId, error }, 'Failed to get debug logs');
      return [];
    }
  }

  /**
   * Clear old debug logs
   */
  async clearOldDebugLogs(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error, count } = await supabase
        .from('debug_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) {
        logger.error({ error, daysOld }, 'Failed to clear old debug logs');
        return 0;
      }

      logger.info({ count, daysOld }, 'Cleared old debug logs');
      return count || 0;
    } catch (error) {
      logger.error({ error, daysOld }, 'Failed to clear old debug logs');
      return 0;
    }
  }

  /**
   * Generate a session ID for debugging
   */
  private generateSessionId(): string {
    return `debug_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<{
    database: boolean;
    auth: boolean;
    storage: boolean;
    realtime: boolean;
    lastCheck: Date;
  }> {
    const health = {
      database: false,
      auth: false,
      storage: false,
      realtime: false,
      lastCheck: new Date()
    };

    try {
      // Test database
      const { error: dbError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      health.database = !dbError;

      // Test auth
      await supabase.auth.getUser();
      health.auth = true; // Auth service is working if we can call it

      // Test storage (if available)
      try {
        await supabase.storage.listBuckets();
        health.storage = true;
      } catch {
        health.storage = false;
      }

      // Test realtime (if available)
      try {
        supabase.channel('health_check');
        health.realtime = true;
      } catch {
        health.realtime = false;
      }

      // Log health status
      await this.logDebug('info', 'System health check completed', health);

    } catch (error) {
      logger.error({ error }, 'System health check failed');
      await this.logDebug('error', 'System health check failed', { error: error instanceof Error ? error.message : String(error) });
    }

    return health;
  }
}

export const supabaseDebugService = new SupabaseDebugService(); 