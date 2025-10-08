import { useState, useCallback } from 'react';
import { selectData as select, insertOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface DataExport {
  id: string;
  user_id: string;
  export_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export const useDataExport = () => {
  const [exports, setExports] = useState<DataExport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExports = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await select('data_exports', '*', { user_id: userId });
      if (error) {
        logger.error({ error }, 'Failed to fetch data exports');
        setError('Failed to fetch exports');
        return;
      }
      setExports(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching data exports');
      setError('Error fetching exports');
    } finally {
      setLoading(false);
    }
  }, []);

  const createExport = useCallback(async (userId: string, exportType: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await insertOne('data_exports', {
        user_id: userId,
        export_type: exportType,
        status: 'pending',
      });
      if (error) {
        logger.error({ error }, 'Failed to create data export');
        setError('Failed to create export');
        return null;
      }
      setExports(prev => [...prev, data]);
      return data;
    } catch (err) {
      logger.error({ err }, 'Error creating data export');
      setError('Error creating export');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    exports,
    loading,
    error,
    fetchExports,
    createExport,
  };
}; 
