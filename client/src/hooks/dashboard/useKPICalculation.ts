/**
 * KPI Calculation Hook
 * React hook that provides real-time business health scoring using the KPI calculation service
 * Implements the get_business_health_score() function with live data processing
 */

import { useState, useEffect, useCallback } from 'react';
import { kpiCalculationService, type BusinessHealthScore } from '@/services/business/kpiCalculationService';
import { useAuth } from '@/hooks';
import { logger } from '@/shared/utils/logger';

interface UseKPICalculationResult {
  healthScore: BusinessHealthScore | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refresh: () => Promise<void>;
  refreshRealTime: () => Promise<void>;
  isLiveDataActive: boolean;
  dataQuality: number;
  recommendations: string[];
  trends: {
    overall: 'up' | 'down' | 'stable';
    monthlyChange: number;
    weeklyChange: number;
  };
}

export const useKPICalculation = (): UseKPICalculationResult => {
  const { user } = useAuth();
  const [healthScore, setHealthScore] = useState<BusinessHealthScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLiveDataActive, setIsLiveDataActive] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchHealthScore = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info('Fetching business health score', { userId: user.id });
      
      const result = await kpiCalculationService.getBusinessHealthScore(user.id);
      
      if (result.success && result.data) {
        setHealthScore(result.data);
        setLastUpdated(result.data.lastCalculated);
        setError(null);
        logger.info('Successfully fetched business health score', { 
          overallScore: result.data.overallScore,
          dataQuality: result.data.dataQuality 
        });
      } else {
        setError(result.error || 'Failed to fetch business health score');
        logger.error('Failed to fetch business health score', { error: result.error });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Error in fetchHealthScore', { error: err });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    await fetchHealthScore();
  }, [fetchHealthScore]);

  const refreshRealTime = useCallback(async () => {
    setIsLiveDataActive(true);
    await fetchHealthScore();
  }, [fetchHealthScore]);

  // Start auto-refresh when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchHealthScore();
      
      // Set up auto-refresh - longer intervals in development
      const refreshInterval = process.env.NODE_ENV === 'development' ? 10 * 60 * 1000 : 5 * 60 * 1000; // 10min dev, 5min prod
      const interval = setInterval(() => {
        if (isLiveDataActive) {
          fetchHealthScore();
        }
      }, refreshInterval);

      setRefreshInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [user?.id, fetchHealthScore, isLiveDataActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  return {
    healthScore,
    loading,
    error,
    lastUpdated,
    refresh,
    refreshRealTime,
    isLiveDataActive,
    dataQuality: healthScore?.dataQuality || 0,
    recommendations: healthScore?.recommendations || [],
    trends: healthScore?.trends || {
      overall: 'stable',
      monthlyChange: 0,
      weeklyChange: 0
    }
  };
};
