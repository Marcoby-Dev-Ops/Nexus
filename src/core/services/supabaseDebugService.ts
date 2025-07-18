/**
 * Supabase Debug Service
 * Provides debugging utilities for Supabase operations
 */

import { supabase } from '../supabase';
import { logger } from '@/core/auth/logger';

export interface DebugInfo {
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastError?: string;
  tables: string[];
  userCount: number;
  sessionInfo?: {
    userId?: string;
    email?: string;
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
  /**
   * Get debug information about Supabase connection
   */
  async getDebugInfo(): Promise<DebugInfo> {
    try {
      // Test connection
      const { error: testError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      const connectionStatus = testError ? 'error' : 'connected';

      // Get available tables (this is a simplified approach)
      const tables = ['user_profiles', 'companies', 'user_activity', 'chat_conversations'];

      // Get user count
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

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
   * Test database operations
   */
  async testDatabaseOperations(): Promise<{
    read: boolean;
    write: boolean;
    auth: boolean;
  }> {
    const results = {
      read: false,
      write: false,
      auth: false
    };

    try {
      // Test read operation
      const { error: readError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      results.read = !readError;

      // Test write operation (create a test record)
      const { error: writeError } = await supabase
        .from('debug_logs')
        .insert({
          level: 'info',
          message: 'Debug test',
          context: { test: true },
          timestamp: new Date().toISOString(),
          source: 'debug_service'
        });
      results.write = !writeError;

      // Test auth operation
      const { data: { user } } = await supabase.auth.getUser();
      results.auth = !!user;

    } catch (error) {
      logger.error({ error }, 'Database operation test failed');
    }

    return results;
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
        user_id: userId,
        session_id: this.generateSessionId(),
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
        user_id: log.user_id,
        session_id: log.session_id,
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