/**
 * Data Connectivity Health Hook
 * React hook that provides business health data based on connected and verified data sources
 * Higher scores for verified/connected data vs. self-reported data
 */

import { useState, useEffect, useCallback } from 'react';
import { businessHealthService, type BusinessHealthSnapshot } from '@/core/services/BusinessHealthService';
import { useAuth } from '@/hooks';
import { logger } from '@/shared/utils/logger';
import { demoDataService } from '@/services/demo/DemoDataService';

interface UseDataConnectivityHealthResult {
  healthData: (BusinessHealthSnapshot & { overallScore?: number; completionPercentage?: number; dataQualityScore?: number }) | null;
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
  const [healthData, setHealthData] = useState<UseDataConnectivityHealthResult['healthData']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch connectivity health data
  const fetchHealthData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Check if this is a demo user
      const isDemoUser = demoDataService.isDemoUser(user.id);

      if (isDemoUser) {
        // Use demo data for demo users
        const demoHealth = demoDataService.getBusinessHealthData(user.id);
        
        const demoSnapshot: BusinessHealthSnapshot = {
          id: 'demo-health-1',
          user_id: user.id,
          overall_score: demoHealth.overall,
          sales_score: demoHealth.sales,
          marketing_score: demoHealth.marketing,
          operations_score: demoHealth.operations,
          finance_score: demoHealth.finance,
          customer_satisfaction: demoHealth.customerSatisfaction,
          employee_satisfaction: demoHealth.employeeSatisfaction,
          process_efficiency: demoHealth.processEfficiency,
          connected_sources: 6, // Demo integrations
          completion_percentage: 75,
          data_quality_score: 85,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const adapted = {
          ...demoSnapshot,
          overallScore: demoSnapshot.overall_score,
          completionPercentage: demoSnapshot.completion_percentage,
          dataQualityScore: demoSnapshot.data_quality_score,
          connectedSources: new Array(demoSnapshot.connected_sources).fill(0).map((_, i) => ({ 
            id: String(i + 1), 
            name: `Demo Integration ${i + 1}`, 
            type: 'demo', 
            status: 'active' as const, 
            lastSync: new Date().toISOString(), 
            dataQuality: 85, 
            verificationStatus: 'verified' as const 
          })),
          unconnectedSources: new Array(Math.max(0, 0)).fill(0),
        };
        
        setHealthData(adapted);
      } else {
        // Use real data for regular users
        const result = await businessHealthService.readLatest();
        if (result.success) {
          const snapshot = result.data;
          const adapted = snapshot
            ? {
                ...snapshot,
                overallScore: snapshot.overall_score,
                completionPercentage: snapshot.completion_percentage,
                dataQualityScore: snapshot.data_quality_score,
                connectedSources: new Array(snapshot.connected_sources).fill(0).map((_, i) => ({ id: String(i + 1), name: '', type: '', status: 'active' as const, lastSync: '', dataQuality: 0, verificationStatus: 'verified' as const })),
                unconnectedSources: new Array(Math.max(0, 0)).fill(0),
              }
            : null;
          setHealthData(adapted);
        } else {
          throw new Error(result.error || 'Failed to fetch');
        }
      }
      
      setLastUpdated(new Date().toISOString());

      if (healthData) {
        logger.info({ 
          overallScore: healthData.overallScore ?? healthData.overall_score,
          connectedSources: (healthData as any).connectedSources?.length ?? healthData.connected_sources,
          completionPercentage: healthData.completionPercentage ?? healthData.completion_percentage,
          dataQualityScore: healthData.dataQualityScore ?? healthData.data_quality_score
        }, 'Fetched business health');
      }

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
    isLiveDataActive: ((healthData as any)?.connectedSources?.length || healthData?.connected_sources || 0) > 0,
    dataCompletion: (healthData?.completionPercentage ?? healthData?.completion_percentage) || 0,
    connectedCount: ((healthData as any)?.connectedSources?.length ?? healthData?.connected_sources) || 0,
    totalCount: (((healthData as any)?.connectedSources?.length ?? healthData?.connected_sources) || 0)
  };
} 
