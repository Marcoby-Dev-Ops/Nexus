/**
 * Demo Data Hook
 * Provides realistic demo data for demo accounts and organizations
 * Integrates with existing dashboard hooks to provide seamless demo experience
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { demoDataService, type DemoFinancialData, type DemoIntegrationData, type DemoBusinessHealthData, type DemoKPIData, type DemoActivityData, type DemoNextBestAction, type DemoMetricsData } from '@/services/demo/DemoDataService';

interface UseDemoDataReturn {
  // Data
  financialData: DemoFinancialData | null;
  integrationData: DemoIntegrationData[];
  healthData: DemoBusinessHealthData | null;
  kpiData: DemoKPIData[];
  activityData: DemoActivityData[];
  nextBestActions: DemoNextBestAction[];
  metricsData: DemoMetricsData | null;
  
  // Loading states
  loading: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  refreshData: () => void;
  clearCache: () => void;
  
  // Computed values
  isDemoUser: boolean;
  hasData: boolean;
}

export const useDemoData = (): UseDemoDataReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    financial: DemoFinancialData | null;
    integrations: DemoIntegrationData[];
    health: DemoBusinessHealthData | null;
    kpis: DemoKPIData[];
    activities: DemoActivityData[];
    actions: DemoNextBestAction[];
    metrics: DemoMetricsData | null;
  }>({
    financial: null,
    integrations: [],
    health: null,
    kpis: [],
    activities: [],
    actions: [],
    metrics: null
  });

  const isDemoUser = user?.id ? demoDataService.isDemoUser(user.id) : false;

  useEffect(() => {
    if (!user?.id || !isDemoUser) {
      setLoading(false);
      return;
    }

    loadDemoData();
  }, [user?.id, isDemoUser]);

  const loadDemoData = async () => {
    if (!user?.id || !isDemoUser) return;

    try {
      setLoading(true);
      setError(null);

      // Load all demo data
      const demoData = demoDataService.getAllDemoData(user.id);
      
      setData(demoData);
    } catch (err) {
      console.error('Error loading demo data:', err);
      setError('Failed to load demo data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (user?.id && isDemoUser) {
      loadDemoData();
    }
  };

  const clearCache = () => {
    demoDataService.clearCache();
    if (user?.id && isDemoUser) {
      loadDemoData();
    }
  };

  return {
    // Data
    financialData: data.financial,
    integrationData: data.integrations,
    healthData: data.health,
    kpiData: data.kpis,
    activityData: data.activities,
    nextBestActions: data.actions,
    metricsData: data.metrics,
    
    // Loading states
    loading,
    
    // Error states
    error,
    
    // Actions
    refreshData,
    clearCache,
    
    // Computed values
    isDemoUser,
    hasData: !loading && !error && (data.financial !== null || data.integrations.length > 0)
  };
};

export default useDemoData;
