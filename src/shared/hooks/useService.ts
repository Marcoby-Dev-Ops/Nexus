import { useState, useCallback, useEffect } from 'react';
import { serviceFactory } from '@/core/services/ServiceFactory';
import type { ServiceResponse } from '@/core/services/interfaces';
import { useNotifications } from './NotificationContext';

/**
 * Hook for getting a single record
 */
export const useServiceGet = <T>(serviceName: string, id: string) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const service = serviceFactory.get(serviceName);
      const response: ServiceResponse<T> = await service.get(id);
      
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: response.error || 'Failed to fetch data'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [serviceName, id, addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, isLoading, refetch };
};

/**
 * Hook for listing records
 */
export const useServiceList = <T>(serviceName: string, filters?: Record<string, any>) => {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const service = serviceFactory.get(serviceName);
      const response: ServiceResponse<T[]> = await service.list(filters);
      
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: response.error || 'Failed to fetch data'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [serviceName, filters, addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, isLoading, refetch };
};

/**
 * Hook for creating records
 */
export const useServiceCreate = <T>(serviceName: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { addNotification } = useNotifications();

  const mutate = useCallback(async (data: Partial<T>) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    
    try {
      const service = serviceFactory.get(serviceName);
      const response: ServiceResponse<T> = await service.create(data);
      
      if (response.success) {
        setIsSuccess(true);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Record created successfully'
        });
      } else {
        setError(response.error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: response.error || 'Failed to create record'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [serviceName, addNotification]);

  return { mutate, isLoading, error, isSuccess };
};

/**
 * Hook for updating records
 */
export const useServiceUpdate = <T>(serviceName: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { addNotification } = useNotifications();

  const mutate = useCallback(async (id: string, data: Partial<T>) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    
    try {
      const service = serviceFactory.get(serviceName);
      const response: ServiceResponse<T> = await service.update(id, data);
      
      if (response.success) {
        setIsSuccess(true);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Record updated successfully'
        });
      } else {
        setError(response.error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: response.error || 'Failed to update record'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [serviceName, addNotification]);

  return { mutate, isLoading, error, isSuccess };
};

/**
 * Hook for deleting records
 */
export const useServiceDelete = (serviceName: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { addNotification } = useNotifications();

  const mutate = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    
    try {
      const service = serviceFactory.get(serviceName);
      const response: ServiceResponse<boolean> = await service.delete(id);
      
      if (response.success) {
        setIsSuccess(true);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Record deleted successfully'
        });
      } else {
        setError(response.error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: response.error || 'Failed to delete record'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [serviceName, addNotification]);

  return { mutate, isLoading, error, isSuccess };
};

/**
 * Main service hook that provides all operations
 */
export const useService = <T>(serviceName: string) => {
  return {
    useGet: (id: string) => useServiceGet<T>(serviceName, id),
    useList: (filters?: Record<string, any>) => useServiceList<T>(serviceName, filters),
    useCreate: () => useServiceCreate<T>(serviceName),
    useUpdate: () => useServiceUpdate<T>(serviceName),
    useDelete: () => useServiceDelete(serviceName)
  };
}; 