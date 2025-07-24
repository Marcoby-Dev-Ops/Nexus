import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/core/supabase';
import { useAuth } from '@/core/auth/AuthProvider';

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

  // Fetch FIRE cycle logs with filters
  const fetchLogs = useCallback(async (
    filters: Partial<FireCycleLogFilters> = {},
    limit = 100,
    offset = 0
  ): Promise<FireCycleLogsResponse> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('fire_cycle_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
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

      const { data, count, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      const response: FireCycleLogsResponse = {
        logs: (data as FireCycleLog[]) || [],
        totalcount: count || 0,
        hasmore: !!(count && offset + limit < count)
      };

      setLogs(response.logs);
      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to fetch FIRE cycle logs';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create a new FIRE cycle log
  const createLog = useCallback(async (logData: CreateFireCycleLogRequest): Promise<FireCycleLog> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const newLog = {
        ...logData,
        userid: user.id,
        insights: logData.insights || [],
        actions: logData.actions || [],
        priority: logData.priority || 'medium',
        confidence: logData.confidence || 0.5
      };

      const { data, error: insertError } = await supabase
        .from('fire_cycle_logs')
        .insert(newLog)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const createdLog = data as FireCycleLog;
      setLogs(prev => [createdLog, ...prev]);
      
      // Refresh metrics
      await fetchMetrics();
      
      return createdLog;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to create FIRE cycle log';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update a FIRE cycle log
  const updateLog = useCallback(async (logId: string, updates: UpdateFireCycleLogRequest): Promise<FireCycleLog> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('fire_cycle_logs')
        .update(updates)
        .eq('id', logId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedLog = data as FireCycleLog;
      setLogs(prev => prev.map(log => 
        log.id === logId ? updatedLog: log
      ));
      
      // Refresh metrics
      await fetchMetrics();
      
      return updatedLog;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to update FIRE cycle log';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Delete a FIRE cycle log
  const deleteLog = useCallback(async (logId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('fire_cycle_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      setLogs(prev => prev.filter(log => log.id !== logId));
      
      // Refresh metrics
      await fetchMetrics();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to delete FIRE cycle log';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Get current phase log
  const getCurrentPhaseLog = useCallback(async (): Promise<FireCycleLog | null> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('fire_cycle_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as FireCycleLog || null;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to get current phase log';
      setError(errorMessage);
      throw err;
    }
  }, [user?.id]);

  // Fetch metrics
  const fetchMetrics = useCallback(async (): Promise<FireCycleLogMetrics> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('fire_cycle_logs')
        .select('phase, priority, confidence, created_at')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      const logs = data as FireCycleLog[];
      
      // Calculate metrics
      const byphase: Record<string, number> = {};
      const bypriority: Record<string, number> = {};
      let total_confidence = 0;
      
      logs.forEach(log => {
        by_phase[log.phase] = (by_phase[log.phase] || 0) + 1;
        by_priority[log.priority] = (by_priority[log.priority] || 0) + 1;
        total_confidence += log.confidence;
      });

      // Calculate recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent_activity = logs.filter(log => 
        new Date(log.created_at) > sevenDaysAgo
      ).length;

      // Calculate average confidence
      const average_confidence = logs.length > 0 ? total_confidence / logs.length: 0;

      // Calculate phase progression (how many times each phase was completed)
      const phaseprogression: Record<string, number> = {};
      logs.forEach(log => {
        phase_progression[log.phase] = (phase_progression[log.phase] || 0) + 1;
      });

      const metrics: FireCycleLogMetrics = {
        totallogs: logs.length,
        by_phase,
        by_priority,
        average_confidence,
        recent_activity,
        phase_progression
      };

      setMetrics(metrics);
      return metrics;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to fetch metrics';
      setError(errorMessage);
      throw err;
    }
  }, [user?.id]);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      fetchLogs();
      fetchMetrics();
    }
  }, [user?.id, fetchLogs, fetchMetrics]);

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