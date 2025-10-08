/**
 * Database Hook
 * 
 * Provides React hooks for database operations using the unified database service.
 */

import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '@/core/services/DatabaseService';
import { logger } from '@/shared/utils/logger';

/**
 * Database health status
 */
export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  type: 'postgres';
  connection: boolean;
  vectorSupport: boolean;
  error?: string;
}

/**
 * Hook for checking database health
 */
export function useDatabaseHealth() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!databaseService) {
        setError('Database service not available in browser environment');
        return;
      }
      
      const result = await databaseService.healthCheck();
      setHealth(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Database health check failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    health,
    loading,
    error,
    refetch: checkHealth
  };
}

/**
 * Hook for executing database queries
 */
export function useDatabaseQuery<T = any>(
  query: string,
  params?: any[],
  enabled: boolean = true
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await databaseService.query<T>(query, params);
      
      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result.data);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setData(null);
      logger.error('Database query failed:', err);
    } finally {
      setLoading(false);
    }
  }, [query, params, enabled]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  return {
    data,
    loading,
    error,
    refetch: executeQuery
  };
}

/**
 * Hook for database transactions
 */
export function useDatabaseTransaction<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeTransaction = useCallback(async (
    callback: (client: any) => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await databaseService.transaction(callback);
      
      if (result.error) {
        setError(result.error);
        return null;
      } else {
        setError(null);
        return result.data;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Database transaction failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    executeTransaction,
    loading,
    error
  };
}

/**
 * Hook for getting database configuration
 */
export function useDatabaseConfig() {
  const [config, setConfig] = useState(() => {
    try {
      return databaseService?.getConfig() || { type: 'postgres', url: '' };
    } catch (error) {
      logger.error('Failed to get database config:', error);
      return { type: 'postgres', url: '' };
    }
  });
  const [isPostgres, setIsPostgres] = useState(() => {
    try {
      return databaseService?.isUsingPostgres() || false;
    } catch (error) {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (databaseService) {
        setConfig(databaseService.getConfig());
        setIsPostgres(databaseService.isUsingPostgres());
      }
    } catch (error) {
      logger.error('Failed to update database config:', error);
    }
  }, []);

  return {
    config,
    isPostgres,
    databaseType: config.type
  };
}

export function useDatabaseClient() {
  const [client, setClient] = useState(() => {
    try {
      return databaseService.getClient();
    } catch (error) {
      logger.error('Failed to get database client:', error);
      return null;
    }
  });

  useEffect(() => {
    try {
      setClient(databaseService.getClient());
    } catch (error) {
      logger.error('Failed to update database client:', error);
    }
  }, []);

  return client;
}

/**
 * Hook for testing database connection
 */
export function useDatabaseConnection() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = useCallback(async () => {
    try {
      setTesting(true);
      setError(null);
      
      const health = await databaseService.healthCheck();
      setConnected(health.connection);
      
      if (!health.connection) {
        setError(health.error || 'Database connection failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setConnected(false);
      logger.error('Database connection test failed:', err);
    } finally {
      setTesting(false);
    }
  }, []);

  useEffect(() => {
    testConnection();
  }, [testConnection]);

  return {
    connected,
    testing,
    error,
    testConnection
  };
}

/**
 * Hook for vector operations (if using PostgreSQL with pgvector)
 */
export function useVectorOperations() {
  const [vectorSupport, setVectorSupport] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testVectorSupport = useCallback(async () => {
    try {
      setTesting(true);
      setError(null);
      
      const health = await databaseService.healthCheck();
      setVectorSupport(health.vectorSupport);
      
      if (!health.vectorSupport) {
        setError('Vector operations not supported');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setVectorSupport(false);
      logger.error('Vector support test failed:', err);
    } finally {
      setTesting(false);
    }
  }, []);

  useEffect(() => {
    testVectorSupport();
  }, [testVectorSupport]);

  return {
    vectorSupport,
    testing,
    error,
    testVectorSupport
  };
}
