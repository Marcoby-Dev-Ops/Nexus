/**
 * React Hook for Backend Connector
 * Provides access to backend services with real-time health monitoring
 */

import { useState, useEffect, useCallback } from 'react';
import { backendConnector, type BackendService } from '../core/backendConnector';
import { logger } from '../security/logger';

export interface UseBackendConnectorReturn {
  services: BackendService[];
  isSystemHealthy: boolean;
  isLoading: boolean;
  error: Error | null;
  request: <T>(serviceName: string, endpoint: string, options?: RequestInit) => Promise<T>;
  refreshHealth: () => Promise<void>;
}

export function useBackendConnector(): UseBackendConnectorReturn {
  const [services, setServices] = useState<BackendService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to backend service updates
  useEffect(() => {
    const unsubscribe = backendConnector.subscribe((updatedServices) => {
      setServices(updatedServices);
      setIsLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, []);

  // Check if system is healthy
  const isSystemHealthy = useCallback(() => {
    return backendConnector.isSystemHealthy();
  }, []);

  // Make authenticated request to backend service
  const request = useCallback(async <T>(
    serviceName: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    try {
      setError(null);
      return await backendConnector.request<T>(serviceName, endpoint, options);
    } catch (err) {
      const error = err instanceof Error ? err: new Error('Unknown error');
      setError(error);
      logger.error({ serviceName, endpoint, error }, 'Backend request failed');
      throw error;
    }
  }, []);

  // Refresh health status
  const refreshHealth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Trigger health check by making a simple request
      await backendConnector.request('supabase', '/health');
    } catch (err) {
      const error = err instanceof Error ? err: new Error('Health check failed');
      setError(error);
      logger.error({ error }, 'Health check failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    services,
    isSystemHealthy: isSystemHealthy(),
    isLoading,
    error,
    request,
    refreshHealth
  };
} 