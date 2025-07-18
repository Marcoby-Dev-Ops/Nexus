/**
 * React Hook for Data Service
 * Provides access to centralized data fetching with caching and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { dataService } from '@/core/services/dataService';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { logger } from '@/core/auth/logger';

export interface UseDataServiceOptions {
  enabled?: boolean;
  refetchInterval?: number;
  cacheTime?: number;
}

export interface UseDataServiceReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

export function useDataService<T>(
  fetchFn: () => Promise<T>,
  options: UseDataServiceOptions = {}
): UseDataServiceReturn<T> {
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    enabled = true,
    refetchInterval,
    cacheTime = 60000
  } = options;

  const fetchData = useCallback(async () => {
    if (!enabled || !user?.id) {
      setData(null);
      setError(null);
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFn();
      
      if (!abortControllerRef.current.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        logger.error({ error }, 'Data service fetch failed');
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [fetchFn, enabled, user?.id]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const clearCache = useCallback(() => {
    dataService.clearCache();
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchData, refetchInterval, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache
  };
}

// Specific hooks for common data fetching patterns

export function useUserProfile() {
  const { user } = useAuth();
  
  return useDataService(
    () => dataService.fetchUserProfile(user!.id),
    { enabled: !!user?.id }
  );
}

export function useUserIntegrations() {
  const { user } = useAuth();
  
  return useDataService(
    () => dataService.fetchUserIntegrations(user!.id),
    { enabled: !!user?.id }
  );
}

export function useNotifications(limit = 10) {
  const { user } = useAuth();
  
  return useDataService(
    () => dataService.fetchNotifications(user!.id, limit),
    { 
      enabled: !!user?.id,
      refetchInterval: 30000 // Refetch every 30 seconds
    }
  );
}

export function useInboxItems(filters: any = {}, limit = 50, offset = 0) {
  const { user } = useAuth();
  
  return useDataService(
    () => dataService.fetchInboxItems(user!.id, filters, limit, offset),
    { enabled: !!user?.id }
  );
}

export function useDashboardMetrics() {
  const { user } = useAuth();
  
  return useDataService(
    () => dataService.fetchDashboardMetrics(user!.id),
    { 
      enabled: !!user?.id,
      refetchInterval: 60000 // Refetch every minute
    }
  );
}

export function useRecentActivities(limit = 20) {
  const { user } = useAuth();
  
  return useDataService(
    () => dataService.fetchRecentActivities(user!.id, limit),
    { 
      enabled: !!user?.id,
      refetchInterval: 30000 // Refetch every 30 seconds
    }
  );
}

export function useBusinessHealth() {
  return useDataService(
    () => dataService.fetchBusinessHealth(),
    { 
      refetchInterval: 60000 // Refetch every minute
    }
  );
} 