import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { financialDataService, type FinancialData, type FinancialMetrics, type FinancialHealthScore, type FinancialIntegrationStatus } from '@/services/business/financialDataService';

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

      // Load all data in parallel
      await Promise.all([
        refreshFinancialData(),
        refreshMetrics(),
        refreshHealthScore(),
        refreshIntegrationStatus(),
      ]);
    } catch (err) {
      console.error('Error loading initial financial data:', err);
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refreshFinancialData = useCallback(async (filters?: {
    integration_type?: 'quickbooks' | 'paypal' | 'stripe';
    data_type?: 'revenue' | 'expense' | 'transaction' | 'invoice' | 'payment';
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => {
    if (!user?.id) return;

    try {
      const result = await financialDataService.getFinancialData(user.id, filters);
      
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
      
      const result = await financialDataService.getFinancialHealthScore(user.id);
      
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
      
      const result = await financialDataService.calculateFinancialMetrics(user.id, date);
      
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
  const totalRevenue = financialData
    .filter(d => d.data_type === 'revenue')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalExpenses = financialData
    .filter(d => d.data_type === 'expense')
    .reduce((sum, d) => sum + d.amount, 0);

  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

  const cashFlow = totalRevenue - totalExpenses;

  const connectedIntegrations = integrationStatus
    .filter(status => status.status === 'connected')
    .map(status => status.integration_type);

  const hasFinancialData = financialData.length > 0 || financialMetrics.length > 0;

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
