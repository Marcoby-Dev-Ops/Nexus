/**
 * Data Connectivity Health Hook
 * React hook that provides business health data based on connected and verified data sources
 * Higher scores for verified/connected data vs. self-reported data
 */

import { useState, useEffect, useCallback } from 'react';
import { dataConnectivityHealthService, type ConnectivityHealthData } from '../lib/services/dataConnectivityHealthService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../lib/security/logger';

interface UseDataConnectivityHealthResult {
  healthData: ConnectivityHealthData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refresh: () => Promise<void>;
  isLiveDataActive: boolean;
  dataCompletion: number;
  connectedCount: number;
  totalCount: number;
}

export function useLiveBusinessHealth(): UseDataConnectivityHealthResult {
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

      const data = await dataConnectivityHealthService.getConnectivityStatus(user.id);
      
      setHealthData(data);
      setLastUpdated(new Date().toISOString());

      logger.info({ 
        overallScore: data.overallScore,
        connectedSources: data.connectedSources.length,
        completionPercentage: data.completionPercentage,
        dataQualityScore: data.dataQualityScore
      }, 'Fetched data connectivity health');

    } catch (error: any) {
      logger.error({ error }, 'Failed to fetch data connectivity health');
      setError(error.message || 'Failed to fetch business health data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Refresh data manually
  const refresh = useCallback(async () => {
    await fetchHealthData();
  }, [fetchHealthData]);

  // Initial data fetch
  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  // Auto-refresh every 30 seconds (data connectivity changes frequently)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHealthData();
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [fetchHealthData]);

  return {
    healthData,
    loading,
    error,
    lastUpdated,
    refresh,
    isLiveDataActive: (healthData?.connectedSources.length || 0) > 0,
    dataCompletion: healthData?.completionPercentage || 0,
    connectedCount: healthData?.connectedSources.length || 0,
    totalCount: (healthData?.connectedSources.length || 0) + (healthData?.unconnectedSources.length || 0)
  };
} 