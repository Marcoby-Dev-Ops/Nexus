import { useState, useEffect } from 'react';
import { dashboardService, type DashboardData } from '@/services/dashboard/DashboardService';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/shared/utils/logger';

export interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDashboardData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      logger.info('Fetching dashboard data', { userId: user.id });
      
      const result = await dashboardService.getDashboardData(user.id);
      
      if (result.success) {
        setData(result.data);
        logger.info('Dashboard data fetched successfully', { 
          userId: user.id,
          buildingBlocksCount: result.data?.buildingBlocks.length || 0,
          overallHealth: result.data?.overallHealth || 0
        });
      } else {
        setError(result.error || 'Failed to fetch dashboard data');
        logger.error('Failed to fetch dashboard data', { 
          userId: user.id, 
          error: result.error 
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Error fetching dashboard data', { 
        userId: user.id, 
        error: errorMessage 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}







