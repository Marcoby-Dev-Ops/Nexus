import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/index';
import { authErrorHandler } from '@/core/services/authErrorHandler';
import { logger } from '@/shared/utils/logger.ts';

export interface FireCycleLog {
  id: string;
  userid: string;
  phase: 'focus' | 'insight' | 'roadmap' | 'execute';
  insights: unknown[];
  actions: unknown[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  createdat: Date;
  updatedat: Date;
}

export interface CreateFireCycleLogRequest {
  phase: FireCycleLog['phase'];
  insights?: unknown[];
  actions?: unknown[];
  priority?: 'critical' | 'high' | 'medium' | 'low';
  confidence?: number;
}

export interface UpdateFireCycleLogRequest {
  phase?: FireCycleLog['phase'];
  insights?: unknown[];
  actions?: unknown[];
  priority?: 'critical' | 'high' | 'medium' | 'low';
  confidence?: number;
}

export interface FireCycleLogFilters {
  phase?: FireCycleLog['phase'];
  priority?: 'critical' | 'high' | 'medium' | 'low';
  user_id?: string;
  date_from?: Date;
  date_to?: Date;
}

export interface FireCycleLogsResponse {
  logs: FireCycleLog[];
  totalcount: number;
  hasmore: boolean;
}

export interface FireCycleLogMetrics {
  totallogs: number;
  byphase: Record<string, number>;
  bypriority: Record<string, number>;
  averageconfidence: number;
  recentactivity: number;
  phaseprogression: Record<string, number>;
}

export const useFireCycleLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<FireCycleLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FireCycleLogMetrics | null>(null);

  // Validate authentication before operations
  const validateAuth = useCallback(async (): Promise<string> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    // Check authentication status with more detailed logging
    const authStatus = await authErrorHandler.getAuthStatus();
    logger.debug('Auth status check', { 
      userId: user.id, 
      authStatus,
      sessionExpires: authStatus.sessionExpires,
      currentTime: new Date().toISOString()
    });

    // Be more lenient - only check if we have a session and user
    if (!authStatus.hasSession || !authStatus.hasUser) {
      throw new Error('Authentication session invalid or expired');
    }

    return user.id;
  }, [user?.id]);

  // Safe database operation with error handling
  const safeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> => {
    return authErrorHandler.handleWithRetry(
      operation,
      {
        operation: context,
        table: 'fire_cycle_logs',
        userId: user?.id
      }
    );
  }, [user?.id]);

  // Fetch FIRE cycle logs with filters
  const fetchLogs = useCallback(async (
    filters: Partial<FireCycleLogFilters> = {},
    limit = 100,
    offset = 0
  ): Promise<FireCycleLogsResponse> => {
    setLoading(true);
    setError(null);

    try {
      const userId = await validateAuth();

      const response = await safeOperation(async () => {
        let query = supabase
          .from('fire_cycle_logs')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters.phase) {
          query = query.eq('phase', filters.phase);
        }
        if (filters.priority) {
          query = query.eq('priority', filters.priority);
        }
        if (filters.date_from) {
          query = query.gte('created_at', filters.date_from.toISOString());
        }
        if (filters.date_to) {
          query = query.lte('created_at', filters.date_to.toISOString());
        }

        // Apply pagination
        if (limit) {
          query = query.limit(limit);
        }
        if (offset) {
          query = query.range(offset, offset + limit - 1);
        }

        const { data, count, error } = await query;

        if (error) {
          throw error;
        }

        return {
          logs: (data as FireCycleLog[]) || [],
          totalcount: count || 0,
          hasmore: !!(count && offset + limit < count)
        };
      }, 'fetchLogs');

      setLogs(response.logs);
      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch FIRE cycle logs';
      setError(errorMessage);
      logger.error('Error fetching FIRE cycle logs', { error: err, filters });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [validateAuth, safeOperation]);

  // Fetch metrics - moved after fetchLogs to avoid circular dependency
  const fetchMetrics = useCallback(async (): Promise<FireCycleLogMetrics> => {
    try {
      const userId = await validateAuth();

      const metrics = await safeOperation(async () => {
        const { data, error } = await supabase
          .from('fire_cycle_logs')
          .select('phase, priority, confidence, created_at')
          .eq('user_id', userId);

        if (error) {
          throw error;
        }

        const logs = data as FireCycleLog[];
        
        // Calculate metrics
        const byphase: Record<string, number> = {};
        const bypriority: Record<string, number> = {};
        let total_confidence = 0;
        
        logs.forEach(log => {
          byphase[log.phase] = (byphase[log.phase] || 0) + 1;
          bypriority[log.priority] = (bypriority[log.priority] || 0) + 1;
          total_confidence += log.confidence;
        });

        // Calculate recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recent_activity = logs.filter(log => 
          new Date(log.created_at) > sevenDaysAgo
        ).length;

        // Calculate average confidence
        const average_confidence = logs.length > 0 ? total_confidence / logs.length : 0;

        // Calculate phase progression (how many times each phase was completed)
        const phaseprogression: Record<string, number> = {};
        logs.forEach(log => {
          phaseprogression[log.phase] = (phaseprogression[log.phase] || 0) + 1;
        });

        return {
          totallogs: logs.length,
          byphase,
          bypriority,
          average_confidence,
          recent_activity,
          phaseprogression
        };
      }, 'fetchMetrics');

      setMetrics(metrics);
      return metrics;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics';
      setError(errorMessage);
      logger.error('Error fetching metrics', { error: err });
      throw err;
    }
  }, [validateAuth, safeOperation]);

  // Create a new FIRE cycle log
  const createLog = useCallback(async (logData: CreateFireCycleLogRequest): Promise<FireCycleLog> => {
    setLoading(true);
    setError(null);

    try {
      const userId = await validateAuth();

      const createdLog = await safeOperation(async () => {
        const newLog = {
          ...logData,
          userid: userId,
          insights: logData.insights || [],
          actions: logData.actions || [],
          priority: logData.priority || 'medium',
          confidence: logData.confidence || 0.5
        };

        const { data, error } = await supabase
          .from('fire_cycle_logs')
          .insert(newLog)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return data as FireCycleLog;
      }, 'createLog');

      setLogs(prev => [createdLog, ...prev]);
      
      // Refresh metrics
      await fetchMetrics();
      
      return createdLog;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create FIRE cycle log';
      setError(errorMessage);
      logger.error('Error creating FIRE cycle log', { error: err, logData });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [validateAuth, safeOperation]);

  // Update a FIRE cycle log
  const updateLog = useCallback(async (logId: string, updates: UpdateFireCycleLogRequest): Promise<FireCycleLog> => {
    setLoading(true);
    setError(null);

    try {
      const userId = await validateAuth();

      const updatedLog = await safeOperation(async () => {
        const { data, error } = await supabase
          .from('fire_cycle_logs')
          .update(updates)
          .eq('id', logId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return data as FireCycleLog;
      }, 'updateLog');

      setLogs(prev => prev.map(log => 
        log.id === logId ? updatedLog : log
      ));
      
      // Refresh metrics
      await fetchMetrics();
      
      return updatedLog;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update FIRE cycle log';
      setError(errorMessage);
      logger.error('Error updating FIRE cycle log', { error: err, logId, updates });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [validateAuth, safeOperation]);

  // Delete a FIRE cycle log
  const deleteLog = useCallback(async (logId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const userId = await validateAuth();

      await safeOperation(async () => {
        const { error } = await supabase
          .from('fire_cycle_logs')
          .delete()
          .eq('id', logId)
          .eq('user_id', userId);

        if (error) {
          throw error;
        }
      }, 'deleteLog');

      setLogs(prev => prev.filter(log => log.id !== logId));
      
      // Refresh metrics
      await fetchMetrics();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete FIRE cycle log';
      setError(errorMessage);
      logger.error('Error deleting FIRE cycle log', { error: err, logId });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [validateAuth, safeOperation]);

  // Get current phase log
  const getCurrentPhaseLog = useCallback(async (): Promise<FireCycleLog | null> => {
    try {
      const userId = await validateAuth();

      const currentLog = await safeOperation(async () => {
        const { data, error } = await supabase
          .from('fire_cycle_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        return data as FireCycleLog || null;
      }, 'getCurrentPhaseLog');

      return currentLog;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get current phase log';
      setError(errorMessage);
      logger.error('Error getting current phase log', { error: err });
      throw err;
    }
  }, [validateAuth, safeOperation]);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      fetchLogs();
      fetchMetrics();
    }
  }, [user?.id, fetchLogs]);

  return {
    // State
    logs,
    loading,
    error,
    metrics,
    
    // Actions
    fetchLogs,
    createLog,
    updateLog,
    deleteLog,
    getCurrentPhaseLog,
    fetchMetrics,
    
    // Utilities
    refetch: () => {
      fetchLogs();
      fetchMetrics();
    },
    clearError: () => setError(null)
  };
}; 