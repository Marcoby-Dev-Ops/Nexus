/**
 * Service Hooks for React Integration
 * 
 * Provides React hooks for easy integration with the service layer.
 * Includes loading states, error handling, and caching.
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceFactory } from '@/core/services/ServiceFactory';
import type { ServiceResponse } from '@/core/services/BaseService';

/**
 * Service hook configuration
 */
export interface ServiceHookConfig {
  /** Enable caching */
  cacheEnabled?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Enable background refetching */
  refetchOnWindowFocus?: boolean;
  /** Retry attempts on failure */
  retryAttempts?: number;
  /** Show loading states */
  showLoading?: boolean;
}

/**
 * Service operation result
 */
export interface ServiceOperationResult<T> {
  /** The data payload */
  data: T | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Whether the operation was successful */
  success: boolean;
  /** Refresh function */
  refetch: () => void;
}

/**
 * Service mutation result
 */
export interface ServiceMutationResult<T, V> {
  /** The data payload */
  data: T | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Whether the operation was successful */
  success: boolean;
  /** Execute the mutation */
  mutate: (variables: V) => void;
  /** Execute the mutation and wait for result */
  mutateAsync: (variables: V) => Promise<ServiceResponse<T>>;
  /** Reset the mutation state */
  reset: () => void;
}

/**
 * Get a service by name
 */
const getServiceByName = (serviceName: string) => {
  try {
    return serviceFactory.get(serviceName);
  } catch (error) {
    // Service error logging removed for production
    throw error;
  }
};

/**
 * Hook for getting a single item by ID
 */
export const useServiceGet = <T>(
  serviceName: string,
  id: string,
  config: ServiceHookConfig = {}
): ServiceOperationResult<T> => {
  const service = getServiceByName(serviceName);

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [serviceName, 'get', id],
    queryFn: async (): Promise<T> => {
      const result = await (service as any).get(id);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: config.cacheTTL || 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: config.refetchOnWindowFocus ?? true,
    retry: config.retryAttempts ?? 3,
  });

  return {
    data: data || null,
    isLoading,
    error: error?.message || null,
    success: !error && !!data,
    refetch,
  };
};

/**
 * Hook for listing items with filters
 */
export const useServiceList = <T>(
  serviceName: string,
  filters?: Record<string, any>,
  config: ServiceHookConfig = {}
): ServiceOperationResult<T[]> => {
  const service = getServiceByName(serviceName);

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [serviceName, 'list', filters],
    queryFn: async (): Promise<T[]> => {
      const result = await (service as any).list(filters);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      return result.data;
    },
    staleTime: config.cacheTTL || 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: config.refetchOnWindowFocus ?? true,
    retry: config.retryAttempts ?? 3,
  });

  return {
    data: data || [],
    isLoading,
    error: error?.message || null,
    success: !error && !!data,
    refetch,
  };
};

/**
 * Hook for creating items
 */
export const useServiceCreate = <T>(
  serviceName: string,
  config: ServiceHookConfig = {}
): ServiceMutationResult<T, Partial<T>> => {
  const service = getServiceByName(serviceName);
  const queryClient = useQueryClient();

  const {
    data,
    isPending,
    error,
    mutate,
    mutateAsync,
    reset
  } = useMutation({
    mutationFn: async (variables: Partial<T>): Promise<T> => {
      const result = await (service as any).create(variables);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create item');
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [serviceName] });
    },
  });

  return {
    data: data || null,
    isLoading: isPending,
    error: error?.message || null,
    success: !error && !!data,
    mutate,
    mutateAsync: async (variables: Partial<T>) => {
      try {
        const result = await mutateAsync(variables);
        return { success: true, data: result, error: null };
      } catch (err) {
        return { success: false, data: null, error: err instanceof Error ? err.message : String(err) };
      }
    },
    reset,
  };
};

/**
 * Hook for updating items
 */
export const useServiceUpdate = <T>(
  serviceName: string,
  config: ServiceHookConfig = {}
): ServiceMutationResult<T, { id: string; data: Partial<T> }> => {
  const service = getServiceByName(serviceName);
  const queryClient = useQueryClient();

  const {
    data,
    isPending,
    error,
    mutate,
    mutateAsync,
    reset
  } = useMutation({
    mutationFn: async ({ id, data: updateData }: { id: string; data: Partial<T> }): Promise<T> => {
      const result = await (service as any).update(id, updateData);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update item');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [serviceName] });
      queryClient.invalidateQueries({ queryKey: [serviceName, 'get', variables.id] });
    },
  });

  return {
    data: data || null,
    isLoading: isPending,
    error: error?.message || null,
    success: !error && !!data,
    mutate,
    mutateAsync: async (variables: { id: string; data: Partial<T> }) => {
      try {
        const result = await mutateAsync(variables);
        return { success: true, data: result, error: null };
      } catch (err) {
        return { success: false, data: null, error: err instanceof Error ? err.message : String(err) };
      }
    },
    reset,
  };
};

/**
 * Hook for deleting items
 */
export const useServiceDelete = (
  serviceName: string,
  config: ServiceHookConfig = {}
): ServiceMutationResult<boolean, string> => {
  const service = getServiceByName(serviceName);
  const queryClient = useQueryClient();

  const {
    data,
    isPending,
    error,
    mutate,
    mutateAsync,
    reset
  } = useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const result = await (service as any).delete(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete item');
      }
      return result.data || false;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [serviceName] });
    },
  });

  return {
    data: data || null,
    isLoading: isPending,
    error: error?.message || null,
    success: !error && !!data,
    mutate,
    mutateAsync: async (id: string) => {
      try {
        const result = await mutateAsync(id);
        return { success: true, data: result, error: null };
      } catch (err) {
        return { success: false, data: null, error: err instanceof Error ? err.message : String(err) };
      }
    },
    reset,
  };
};

/**
 * Hook for searching items
 */
export const useServiceSearch = <T>(
  serviceName: string,
  query: string,
  options?: any,
  config: ServiceHookConfig = {}
): ServiceOperationResult<T[]> => {
  const service = getServiceByName(serviceName);

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [serviceName, 'search', query, options],
    queryFn: async (): Promise<T[]> => {
      const result = await (service as any).search(query, options);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to search items');
      }
      return result.data;
    },
    enabled: !!query && query.trim().length > 0,
    staleTime: config.cacheTTL || 2 * 60 * 1000, // 2 minutes for search
    refetchOnWindowFocus: config.refetchOnWindowFocus ?? false,
    retry: config.retryAttempts ?? 2,
  });

  return {
    data: data || [],
    isLoading,
    error: error?.message || null,
    success: !error && !!data,
    refetch,
  };
};

/**
 * Main service hook that provides all operations
 */
export const useService = <T>(serviceName: string, config: ServiceHookConfig = {}) => {
  return {
    useGet: (id: string) => useServiceGet<T>(serviceName, id, config),
    useList: (filters?: Record<string, any>) => useServiceList<T>(serviceName, filters, config),
    useSearch: (query: string, options?: any) => useServiceSearch<T>(serviceName, query, options, config),
    useCreate: () => useServiceCreate<T>(serviceName, config),
    useUpdate: () => useServiceUpdate<T>(serviceName, config),
    useDelete: () => useServiceDelete(serviceName, config),
  };
};

/**
 * Hook for service operations with manual control
 */
export const useServiceOperations = <T>(serviceName: string) => {
  const service = getServiceByName(serviceName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const executeOperation = useCallback(async <R>(
    operation: () => Promise<ServiceResponse<R>>
  ): Promise<ServiceResponse<R>> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      if (result.success) {
        setData(result.data as any);
      } else {
        setError(result.error || 'Operation failed');
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const get = useCallback((id: string) => {
    return executeOperation<T>(() => (service as any).get(id));
  }, [executeOperation, service]);

  const list = useCallback((filters?: Record<string, any>) => {
    return executeOperation<T[]>(() => (service as any).list(filters));
  }, [executeOperation, service]);

  const create = useCallback((data: Partial<T>) => {
    return executeOperation<T>(() => (service as any).create(data));
  }, [executeOperation, service]);

  const update = useCallback((id: string, data: Partial<T>) => {
    return executeOperation<T>(() => (service as any).update(id, data));
  }, [executeOperation, service]);

  const remove = useCallback((id: string) => {
    return executeOperation(() => (service as any).delete(id));
  }, [executeOperation, service]);

  const search = useCallback((query: string, options?: any) => {
    return executeOperation<T[]>(() => (service as any).search(query, options));
  }, [executeOperation, service]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    success: !error && !!data,
    get,
    list,
    create,
    update,
    delete: remove,
    search,
    reset,
  };
}; 
