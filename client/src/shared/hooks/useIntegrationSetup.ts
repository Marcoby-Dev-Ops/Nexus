import { useState, useCallback } from 'react';
import { selectData as select, insertOne, updateOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface IntegrationSetup {
  id: string;
  user_id: string;
  integration_type: string;
  status: 'pending' | 'active' | 'failed';
  config: any;
  created_at: string;
  updated_at: string;
}

export const useIntegrationSetup = () => {
  const [setups, setSetups] = useState<IntegrationSetup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSetups = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await select('integration_setups', '*', { user_id: userId });
      if (error) {
        logger.error({ error }, 'Failed to fetch integration setups');
        setError('Failed to fetch setups');
        return;
      }
      setSetups(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching integration setups');
      setError('Error fetching setups');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSetup = useCallback(async (setupData: Omit<IntegrationSetup, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await insertOne('integration_setups', setupData);
      if (error) {
        logger.error({ error }, 'Failed to create integration setup');
        setError('Failed to create setup');
        return null;
      }
      setSetups(prev => [...prev, data]);
      return data;
    } catch (err) {
      logger.error({ err }, 'Error creating integration setup');
      setError('Error creating setup');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetup = useCallback(async (id: string, updates: Partial<IntegrationSetup>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await updateOne('integration_setups', id, updates);
      if (error) {
        logger.error({ error }, 'Failed to update integration setup');
        setError('Failed to update setup');
        return null;
      }
      setSetups(prev => prev.map(setup => (setup.id === id ? { ...setup, ...updates } : setup)));
      return data;
    } catch (err) {
      logger.error({ err }, 'Error updating integration setup');
      setError('Error updating setup');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    setups,
    loading,
    error,
    fetchSetups,
    createSetup,
    updateSetup,
  };
}; 
