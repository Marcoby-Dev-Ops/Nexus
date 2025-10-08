import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { analyticsService } from '@/services/analytics';

export interface IntegrationAnalytics {
  totalIntegrations: number;
  activeIntegrations: number;
  totalDataPoints: number;
  lastSync: string | null;
  avgSyncDuration: number;
  syncSuccessRate: number;
  topIntegrations: Array<{
    name: string;
    dataPoints: number;
    lastSync: string;
    status: string;
  }>;
}

export interface IntegrationFilters {
  status?: 'active' | 'inactive' | 'error';
  category?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export const useIntegrationAnalytics = (filters?: IntegrationFilters) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<IntegrationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrationAnalytics = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get integration analytics from the service
      const result = await analyticsService.getIntegrationAnalytics(user.id, filters);
      
      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        setError(result.error || 'Failed to fetch integration analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user?.id, filters]);

  const refreshAnalytics = useCallback(() => {
    fetchIntegrationAnalytics();
  }, [fetchIntegrationAnalytics]);

  useEffect(() => {
    fetchIntegrationAnalytics();
  }, [fetchIntegrationAnalytics]);

  return {
    analytics,
    loading,
    error,
    refreshAnalytics,
  };
}; 
