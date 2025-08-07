import { useState, useCallback } from 'react';

export interface ServiceConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export const useService = (config: ServiceConfig = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = useCallback(async <T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ServiceResponse<T>> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
          ...options.headers,
        },
        timeout: config.timeout || 10000,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const get = useCallback(async <T>(url: string): Promise<ServiceResponse<T>> => {
    return makeRequest<T>(url, { method: 'GET' });
  }, [makeRequest]);

  const post = useCallback(async <T>(
    url: string,
    data: unknown
  ): Promise<ServiceResponse<T>> => {
    return makeRequest<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  const put = useCallback(async <T>(
    url: string,
    data: unknown
  ): Promise<ServiceResponse<T>> => {
    return makeRequest<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  const patch = useCallback(async <T>(
    url: string,
    data: unknown
  ): Promise<ServiceResponse<T>> => {
    return makeRequest<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  const del = useCallback(async <T>(url: string): Promise<ServiceResponse<T>> => {
    return makeRequest<T>(url, { method: 'DELETE' });
  }, [makeRequest]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    makeRequest,
    get,
    post,
    put,
    patch,
    delete: del,
    clearError,
  };
}; 