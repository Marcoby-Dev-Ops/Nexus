import { useState, useCallback } from 'react';
import { selectData as select, selectOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface FeatureFlag {
  id: string;
  user_id: string;
  feature_name: string;
  enabled: boolean;
  config: any;
  created_at: string;
  updated_at: string;
}

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await select('feature_flags', '*', { user_id: userId });
      if (error) {
        logger.error({ error }, 'Failed to fetch feature flags');
        setError('Failed to fetch flags');
        return;
      }
      setFlags(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching feature flags');
      setError('Error fetching flags');
    } finally {
      setLoading(false);
    }
  }, []);

  const isFeatureEnabled = useCallback((featureName: string): boolean => {
    const flag = flags.find(f => f.feature_name === featureName);
    return flag?.enabled || false;
  }, [flags]);

  const getFeatureConfig = useCallback((featureName: string): any => {
    const flag = flags.find(f => f.feature_name === featureName);
    return flag?.config || {};
  }, [flags]);

  return {
    flags,
    loading,
    error,
    fetchFlags,
    isFeatureEnabled,
    getFeatureConfig,
  };
}; 
