import { useState, useCallback } from 'react';
import { selectData as select, insertOne, updateOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface FireCycleLog {
  id: string;
  user_id: string;
  cycle_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useFireCycleLogs = () => {
  const [logs, setLogs] = useState<FireCycleLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await select('fire_cycle_logs', '*', { user_id: userId });
      if (error) {
        logger.error({ error }, 'Failed to fetch fire cycle logs');
        setError('Failed to fetch logs');
        setLogs([]);
        return;
      }
      setLogs(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching fire cycle logs');
      setError('Error fetching logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addLog = useCallback(async (log: Omit<FireCycleLog, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await insertOne('fire_cycle_logs', log);
      if (error) {
        logger.error({ error }, 'Failed to add fire cycle log');
        setError('Failed to add log');
        return;
      }
      setLogs(prev => [...prev, data]);
    } catch (err) {
      logger.error({ err }, 'Error adding fire cycle log');
      setError('Error adding log');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLog = useCallback(async (id: string, updates: Partial<FireCycleLog>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await updateOne('fire_cycle_logs', id, updates);
      if (error) {
        logger.error({ error }, 'Failed to update fire cycle log');
        setError('Failed to update log');
        return;
      }
      setLogs(prev => prev.map(log => (log.id === id ? { ...log, ...updates } : log)));
    } catch (err) {
      logger.error({ err }, 'Error updating fire cycle log');
      setError('Error updating log');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logs,
    loading,
    error,
    fetchLogs,
    addLog,
    updateLog,
  };
}; 
