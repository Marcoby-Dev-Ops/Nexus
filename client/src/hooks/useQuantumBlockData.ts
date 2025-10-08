/**
 * React Hook for Quantum Block Data
 * 
 * Provides real data for the 7 quantum building blocks with loading states,
 * error handling, and automatic refresh capabilities.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { quantumBlockDataService } from '@/services/quantum/QuantumBlockDataService';
import type { 
  RevenueMetrics, 
  CashMetrics, 
  DeliveryMetrics, 
  QuantumBlockData 
} from '@/services/quantum/QuantumBlockDataService';

// ============================================================================
// TYPES
// ============================================================================

export interface QuantumBlockDataState {
  data: QuantumBlockData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface UseQuantumBlockDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  enabled?: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useQuantumBlockData(options: UseQuantumBlockDataOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enabled = true,
  } = options;

  const { user, company } = useAuth();
  const [state, setState] = useState<QuantumBlockDataState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchData = useCallback(async () => {
    if (!enabled || !company?.id) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await quantumBlockDataService.getAllQuantumBlockData(company.id);

      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Failed to fetch quantum block data',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [company?.id, enabled]);

  // ============================================================================
  // INDIVIDUAL BLOCK DATA
  // ============================================================================

  const fetchRevenueMetrics = useCallback(async (): Promise<RevenueMetrics | null> => {
    if (!company?.id) return null;

    try {
      const response = await quantumBlockDataService.getRevenueMetrics(company.id);
      return response.success ? response.data : null;
    } catch (error) {
      // Error logging removed for production
      return null;
    }
  }, [company?.id]);

  const fetchCashMetrics = useCallback(async (): Promise<CashMetrics | null> => {
    if (!company?.id) return null;

    try {
      const response = await quantumBlockDataService.getCashMetrics(company.id);
      return response.success ? response.data : null;
    } catch (error) {
      // Error logging removed for production
      return null;
    }
  }, [company?.id]);

  const fetchDeliveryMetrics = useCallback(async (): Promise<DeliveryMetrics | null> => {
    if (!company?.id) return null;

    try {
      const response = await quantumBlockDataService.getDeliveryMetrics(company.id);
      return response.success ? response.data : null;
    } catch (error) {
      // Error logging removed for production
      return null;
    }
  }, [company?.id]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !enabled || !company?.id) {
      return;
    }

    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, enabled, company?.id, refreshInterval, fetchData]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const getBlockData = useCallback((blockName: string) => {
    if (!state.data) return null;

    switch (blockName.toLowerCase()) {
      case 'revenue':
        return state.data.revenue;
      case 'cash':
        return state.data.cash;
      case 'delivery':
        return state.data.delivery;
      default:
        return null;
    }
  }, [state.data]);

  const hasData = useCallback((blockName: string) => {
    const blockData = getBlockData(blockName);
    return blockData && Object.keys(blockData).length > 1; // More than just lastUpdated
  }, [getBlockData]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    data: state.data,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,

    // Actions
    refresh,
    fetchRevenueMetrics,
    fetchCashMetrics,
    fetchDeliveryMetrics,

    // Utilities
    getBlockData,
    hasData,

    // Individual block data (for convenience)
    revenue: state.data?.revenue || null,
    cash: state.data?.cash || null,
    delivery: state.data?.delivery || null,
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for revenue block data only
 */
export function useRevenueData(options: UseQuantumBlockDataOptions = {}) {
  const { data, loading, error, refresh, revenue } = useQuantumBlockData(options);
  
  return {
    data: revenue,
    loading,
    error,
    refresh,
    hasData: revenue && Object.keys(revenue).length > 1,
  };
}

/**
 * Hook for cash block data only
 */
export function useCashData(options: UseQuantumBlockDataOptions = {}) {
  const { data, loading, error, refresh, cash } = useQuantumBlockData(options);
  
  return {
    data: cash,
    loading,
    error,
    refresh,
    hasData: cash && Object.keys(cash).length > 1,
  };
}

/**
 * Hook for delivery block data only
 */
export function useDeliveryData(options: UseQuantumBlockDataOptions = {}) {
  const { data, loading, error, refresh, delivery } = useQuantumBlockData(options);
  
  return {
    data: delivery,
    loading,
    error,
    refresh,
    hasData: delivery && Object.keys(delivery).length > 1,
  };
}
