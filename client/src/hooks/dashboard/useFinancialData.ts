import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { financialService, type FinancialData, type FinancialMetrics, type FinancialHealthScore, type FinancialIntegrationStatus } from '@/services/core';
import { demoDataService } from '@/services/demo/DemoDataService';

interface UseFinancialDataReturn {
  // Data
  financialData: FinancialData[];
  financialMetrics: FinancialMetrics[];
  financialHealthScore: FinancialHealthScore | null;
  integrationStatus: FinancialIntegrationStatus[];
  
  // Loading states
  loading: boolean;
  loadingMetrics: boolean;
  loadingHealthScore: boolean;
  loadingIntegrationStatus: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  refreshFinancialData: (filters?: {
    integration_type?: 'quickbooks' | 'paypal' | 'stripe';
    data_type?: 'revenue' | 'expense' | 'transaction' | 'invoice' | 'payment';
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => Promise<void>;
  refreshMetrics: (period?: 'month' | 'quarter' | 'year') => Promise<void>;
  refreshHealthScore: () => Promise<void>;
  refreshIntegrationStatus: () => Promise<void>;
  calculateMetrics: (date: string) => Promise<void>;
  calculateHealthScore: () => Promise<void>;
  
  // Computed values
  totalRevenue: number;
  totalExpenses: number;
  profitMargin: number;
  cashFlow: number;
  connectedIntegrations: string[];
  hasFinancialData: boolean;
}

export const useFinancialData = (): UseFinancialDataReturn => {
  const { user } = useAuth();
  
  // State
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics[]>([]);
  const [financialHealthScore, setFinancialHealthScore] = useState<FinancialHealthScore | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<FinancialIntegrationStatus[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingHealthScore, setLoadingHealthScore] = useState(false);
  const [loadingIntegrationStatus, setLoadingIntegrationStatus] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadInitialData();
    }
  }, [user?.id]);

  // Check if this is a demo user
  const isDemoUser = user?.id ? demoDataService.isDemoUser(user.id) : false;

  // Auto-refresh - longer intervals in development
  useEffect(() => {
    if (!user?.id) return;

    const refreshInterval = process.env.NODE_ENV === 'development' ? 10 * 60 * 1000 : 5 * 60 * 1000; // 10min dev, 5min prod
    const interval = setInterval(() => {
      refreshIntegrationStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [user?.id]);

  const loadInitialData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      if (isDemoUser) {
        // Use demo data for demo users
        const demoFinancial = demoDataService.getFinancialData(user.id);
        
        // Set demo financial data
        setFinancialData([{
          id: 'demo-financial-1',
          user_id: user.id,
          data_type: 'revenue',
          amount: demoFinancial.totalRevenue,
          date: new Date().toISOString(),
          description: 'Demo monthly revenue',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

        // Set demo metrics
        setFinancialMetrics([{
          id: 'demo-metrics-1',
          user_id: user.id,
          metric_type: 'revenue',
          value: demoFinancial.totalRevenue,
          period: 'month',
          date: new Date().toISOString(),
          created_at: new Date().toISOString()
        }]);

        // Set demo health score
        setFinancialHealthScore({
          id: 'demo-health-1',
          user_id: user.id,
          overall_score: demoFinancial.profitMargin > 20 ? 85 : demoFinancial.profitMargin > 10 ? 70 : 55,
          revenue_score: demoFinancial.monthlyGrowth > 0 ? 80 : 60,
          profit_score: demoFinancial.profitMargin > 15 ? 85 : 65,
          cash_flow_score: demoFinancial.cashFlow > 0 ? 80 : 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Set demo integration status
        setIntegrationStatus([{
          id: 'demo-integration-1',
          user_id: user.id,
          integration_type: 'stripe',
          status: 'active',
          last_sync: new Date().toISOString(),
          data_points: 890,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      } else {
        // Load real data for regular users
        await Promise.all([
          refreshFinancialData(),
          refreshMetrics(),
          refreshHealthScore(),
          refreshIntegrationStatus(),
        ]);
      }
    } catch (err) {
      console.error('Error loading initial financial data:', err);
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isDemoUser]);

  const refreshFinancialData = useCallback(async (filters?: {
    integration_type?: 'quickbooks' | 'paypal' | 'stripe';
    data_type?: 'revenue' | 'expense' | 'transaction' | 'invoice' | 'payment';
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => {
    if (!user?.id) return;

    try {
      const result = await financialService.getFinancialData(user.id, filters);
      
      if (result.success && result.data) {
        setFinancialData(result.data);
      } else {
        console.error('Failed to get financial data:', result.error);
        setError(result.error || 'Failed to load financial data');
      }
    } catch (err) {
      console.error('Error refreshing financial data:', err);
      setError('Failed to refresh financial data');
    }
  }, [user?.id]);

  const refreshMetrics = useCallback(async (period: 'month' | 'quarter' | 'year' = 'month') => {
    if (!user?.id) return;

    try {
      setLoadingMetrics(true);
      
      const result = await financialDataService.getFinancialMetrics(user.id, period);
      
      if (result.success && result.data) {
        setFinancialMetrics(result.data);
      } else {
        console.error('Failed to get financial metrics:', result.error);
        setError(result.error || 'Failed to load financial metrics');
      }
    } catch (err) {
      console.error('Error refreshing financial metrics:', err);
      setError('Failed to refresh financial metrics');
    } finally {
      setLoadingMetrics(false);
    }
  }, [user?.id]);

  const refreshHealthScore = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingHealthScore(true);
      
      const result = await financialService.getFinancialHealthScore(user.id);
      
      if (result.success) {
        setFinancialHealthScore(result.data);
      } else {
        console.error('Failed to get financial health score:', result.error);
        setError(result.error || 'Failed to load financial health score');
      }
    } catch (err) {
      console.error('Error refreshing financial health score:', err);
      setError('Failed to refresh financial health score');
    } finally {
      setLoadingHealthScore(false);
    }
  }, [user?.id]);

  const refreshIntegrationStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingIntegrationStatus(true);
      
      const result = await financialDataService.getIntegrationStatus(user.id);
      
      if (result.success && result.data) {
        setIntegrationStatus(result.data);
      } else {
        console.error('Failed to get integration status:', result.error);
        setError(result.error || 'Failed to load integration status');
      }
    } catch (err) {
      console.error('Error refreshing integration status:', err);
      setError('Failed to refresh integration status');
    } finally {
      setLoadingIntegrationStatus(false);
    }
  }, [user?.id]);

  const calculateMetrics = useCallback(async (date: string) => {
    if (!user?.id) return;

    try {
      setLoadingMetrics(true);
      
      const result = await financialService.calculateFinancialMetrics(user.id, date);
      
      if (result.success && result.data) {
        // Refresh metrics after calculation
        await refreshMetrics();
      } else {
        console.error('Failed to calculate financial metrics:', result.error);
        setError(result.error || 'Failed to calculate financial metrics');
      }
    } catch (err) {
      console.error('Error calculating financial metrics:', err);
      setError('Failed to calculate financial metrics');
    } finally {
      setLoadingMetrics(false);
    }
  }, [user?.id, refreshMetrics]);

  const calculateHealthScore = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingHealthScore(true);
      
      const result = await financialDataService.calculateFinancialHealthScore(user.id);
      
      if (result.success && result.data) {
        setFinancialHealthScore(result.data);
      } else {
        console.error('Failed to calculate financial health score:', result.error);
        setError(result.error || 'Failed to calculate financial health score');
      }
    } catch (err) {
      console.error('Error calculating financial health score:', err);
      setError('Failed to calculate financial health score');
    } finally {
      setLoadingHealthScore(false);
    }
  }, [user?.id]);

  // Computed values
  const totalRevenue = isDemoUser && user?.id 
    ? demoDataService.getFinancialData(user.id).totalRevenue
    : financialData
        .filter(d => d.data_type === 'revenue')
        .reduce((sum, d) => sum + d.amount, 0);

  const totalExpenses = isDemoUser && user?.id
    ? demoDataService.getFinancialData(user.id).totalExpenses
    : financialData
        .filter(d => d.data_type === 'expense')
        .reduce((sum, d) => sum + d.amount, 0);

  const profitMargin = isDemoUser && user?.id
    ? demoDataService.getFinancialData(user.id).profitMargin
    : totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

  const cashFlow = isDemoUser && user?.id
    ? demoDataService.getFinancialData(user.id).cashFlow
    : totalRevenue - totalExpenses;

  const connectedIntegrations = integrationStatus
    .filter(status => status.status === 'connected')
    .map(status => status.integration_type);

  const hasFinancialData = isDemoUser || financialData.length > 0 || financialMetrics.length > 0;

  return {
    // Data
    financialData,
    financialMetrics,
    financialHealthScore,
    integrationStatus,
    
    // Loading states
    loading,
    loadingMetrics,
    loadingHealthScore,
    loadingIntegrationStatus,
    
    // Error state
    error,
    
    // Actions
    refreshFinancialData,
    refreshMetrics,
    refreshHealthScore,
    refreshIntegrationStatus,
    calculateMetrics,
    calculateHealthScore,
    
    // Computed values
    totalRevenue,
    totalExpenses,
    profitMargin,
    cashFlow,
    connectedIntegrations,
    hasFinancialData,
  };
};
