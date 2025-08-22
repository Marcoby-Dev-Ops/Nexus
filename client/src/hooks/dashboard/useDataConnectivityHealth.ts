/**
 * Data Connectivity Health Hook
 * React hook that provides real-time business health data based on connected and verified data sources
 * Uses the updated DataConnectivityHealthService with real database queries
 */

import { useState, useEffect, useCallback } from 'react';
import { dataConnectivityHealthService, type ConnectivityHealthData } from '@/services/business/dataConnectivityHealthService';
import { useAuth } from '@/hooks';
import { logger } from '@/shared/utils/logger';

interface UseDataConnectivityHealthResult {
  healthData: ConnectivityHealthData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refresh: () => Promise<void>;
  refreshRealTime: () => Promise<void>;
  isLiveDataActive: boolean;
  dataCompletion: number;
  connectedCount: number;
  totalCount: number;
  hasConnectedSources: boolean;
  hasUnconnectedSources: boolean;
}

export function useDataConnectivityHealth(): UseDataConnectivityHealthResult {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<ConnectivityHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch connectivity health data
  const fetchHealthData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const result = await dataConnectivityHealthService.getConnectivityStatus(user.id);
      if (result.success && result.data) {
        setHealthData(result.data);
        setLastUpdated(result.data.lastUpdated);
        
        logger.info({ 
          userId: user.id,
          overallScore: result.data.overallScore,
          connectedCount: result.data.connectedSources.length,
          unconnectedCount: result.data.unconnectedSources.length,
          completionPercentage: result.data.completionPercentage,
          dataQualityScore: result.data.dataQualityScore
        }, 'Fetched data connectivity health');
      } else {
        throw new Error(result.error || 'Failed to fetch connectivity health data');
      }
    } catch (error: any) {
      logger.error({ error, userId: user.id }, 'Failed to fetch data connectivity health');
      setError(error.message || 'Failed to fetch connectivity health data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch real-time connectivity health data
  const fetchRealTimeHealthData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const result = await dataConnectivityHealthService.getRealTimeConnectivityStatus(user.id);
      if (result.success && result.data) {
        setHealthData(result.data);
        setLastUpdated(result.data.lastUpdated);
        
        logger.info({ 
          userId: user.id,
          overallScore: result.data.overallScore,
          connectedCount: result.data.connectedSources.length,
          unconnectedCount: result.data.unconnectedSources.length,
          completionPercentage: result.data.completionPercentage,
          dataQualityScore: result.data.dataQualityScore
        }, 'Fetched real-time data connectivity health');
      } else {
        throw new Error(result.error || 'Failed to fetch real-time connectivity health data');
      }
    } catch (error: any) {
      logger.error({ error, userId: user.id }, 'Failed to fetch real-time data connectivity health');
      setError(error.message || 'Failed to fetch real-time connectivity health data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Refresh data manually
  const refresh = useCallback(async () => {
    await fetchHealthData();
  }, [fetchHealthData]);

  // Refresh real-time data manually
  const refreshRealTime = useCallback(async () => {
    await fetchRealTimeHealthData();
  }, [fetchRealTimeHealthData]);

  // Initial data fetch
  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  // Auto-refresh - longer intervals in development
  useEffect(() => {
    const refreshInterval = process.env.NODE_ENV === 'development' ? 120 * 1000 : 30 * 1000; // 2min dev, 30s prod
    const interval = setInterval(() => {
      fetchRealTimeHealthData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchRealTimeHealthData]);

  return {
    healthData,
    loading,
    error,
    lastUpdated,
    refresh,
    refreshRealTime,
    isLiveDataActive: (healthData?.connectedSources.length || 0) > 0,
    dataCompletion: healthData?.completionPercentage || 0,
    connectedCount: healthData?.connectedSources.length || 0,
    totalCount: (healthData?.connectedSources.length || 0) + (healthData?.unconnectedSources.length || 0),
    hasConnectedSources: (healthData?.connectedSources.length || 0) > 0,
    hasUnconnectedSources: (healthData?.unconnectedSources.length || 0) > 0
  };
}
