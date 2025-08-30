import { useState, useCallback } from 'react';
import { selectData as select, selectOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface BusinessHealth {
  id: string;
  company_id: string;
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  metrics: {
    user_engagement: number;
    data_quality: number;
    system_uptime: number;
    security_score: number;
  };
  created_at: string;
  updated_at: string;
}

export const useBusinessHealth = () => {
  const [health, setHealth] = useState<BusinessHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinessHealth = useCallback(async (companyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await select('business_health', '*', { company_id: companyId });
      if (error) {
        logger.error({ error }, 'Failed to fetch business health');
        setError('Failed to fetch business health');
        return;
      }
      setHealth(data && data.length > 0 ? data[0] : null);
    } catch (err) {
      logger.error({ err }, 'Error fetching business health');
      setError('Error fetching business health');
    } finally {
      setLoading(false);
    }
  }, []);

  const getHealthById = useCallback(async (id: string) => {
    try {
      const { data, error } = await selectOne('business_health', id);
      if (error) {
        logger.error({ error }, 'Failed to fetch business health by ID');
        return null;
      }
      return data;
    } catch (err) {
      logger.error({ err }, 'Error fetching business health by ID');
      return null;
    }
  }, []);

  return {
    health,
    loading,
    error,
    fetchBusinessHealth,
    getHealthById,
  };
}; 
