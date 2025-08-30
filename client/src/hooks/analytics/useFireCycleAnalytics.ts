import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { analyticsService } from '@/services/analytics';

export interface FireCycleMetrics {
  totalCycles: number;
  activeCycles: number;
  completedCycles: number;
  averageCycleDuration: number;
  successRate: number;
  topPerformingAreas: string[];
  areasForImprovement: string[];
}

export interface FireCycleFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  cycleType?: string;
  department?: string;
}

export const useFireCycleAnalytics = (filters?: FireCycleFilters) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<FireCycleMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFireCycleMetrics = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get Fire Cycle metrics from the service
      const result = await analyticsService.getFireCycleMetrics(user.id, filters);
      
      if (result.success && result.data) {
        setMetrics(result.data);
      } else {
        setError(result.error || 'Failed to fetch Fire Cycle metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user?.id, filters]);

  const refreshMetrics = useCallback(() => {
    fetchFireCycleMetrics();
  }, [fetchFireCycleMetrics]);

  useEffect(() => {
    fetchFireCycleMetrics();
  }, [fetchFireCycleMetrics]);

  return {
    metrics,
    loading,
    error,
    refreshMetrics,
  };
}; 
