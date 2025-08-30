import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { analyticsService } from '@/services/analytics';

export interface AnalyticsData {
  totalDataSources: number;
  activeIntegrations: number;
  crossPlatformInsights: number;
  actionableRecommendations: number;
  dataFreshness: 'real-time' | 'recent' | 'stale';
  overallHealthScore: number;
}

export interface AnalyticsFilters {
  department?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  dataSource?: string;
  metricType?: string;
}

export const useAnalyticsData = (filters?: AnalyticsFilters) => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get analytics data from the service
      const result = await analyticsService.getBusinessMetrics(user.id);
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user?.id, filters]);

  const refreshData = useCallback(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return {
    data,
    loading,
    error,
    refreshData,
  };
}; 
