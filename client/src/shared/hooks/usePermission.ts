import { useState, useCallback } from 'react';
import { selectData as select, selectOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface Permission {
  id: string;
  user_id: string;
  resource: string;
  action: string;
  granted: boolean;
  created_at: string;
  updated_at: string;
}

export const usePermission = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await select('user_permissions', '*', { user_id: userId });
      if (error) {
        logger.error({ error }, 'Failed to fetch user permissions');
        setError('Failed to fetch permissions');
        return;
      }
      setPermissions(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching user permissions');
      setError('Error fetching permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPermission = useCallback(async (userId: string, resource: string, action: string) => {
    try {
      const { data, error } = await select('user_permissions', '*', { 
        user_id: userId, 
        resource, 
        action 
      });
      if (error) {
        logger.error({ error }, 'Failed to check permission');
        return false;
      }
      return data && data.length > 0 && data[0].granted;
    } catch (err) {
      logger.error({ err }, 'Error checking permission');
      return false;
    }
  }, []);

  return {
    permissions,
    loading,
    error,
    fetchPermissions,
    checkPermission,
  };
}; 
