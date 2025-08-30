import { useState, useCallback } from 'react';
import { selectData as select, insertOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface DataBackup {
  id: string;
  user_id: string;
  backup_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

export const useDataBackup = () => {
  const [backups, setBackups] = useState<DataBackup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBackups = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await select('data_backups', '*', { user_id: userId });
      if (error) {
        logger.error({ error }, 'Failed to fetch data backups');
        setError('Failed to fetch backups');
        return;
      }
      setBackups(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching data backups');
      setError('Error fetching backups');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBackup = useCallback(async (userId: string, backupType: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await insertOne('data_backups', {
        user_id: userId,
        backup_type: backupType,
        status: 'pending',
      });
      if (error) {
        logger.error({ error }, 'Failed to create data backup');
        setError('Failed to create backup');
        return null;
      }
      setBackups(prev => [...prev, data]);
      return data;
    } catch (err) {
      logger.error({ err }, 'Error creating data backup');
      setError('Error creating backup');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    backups,
    loading,
    error,
    fetchBackups,
    createBackup,
  };
}; 
