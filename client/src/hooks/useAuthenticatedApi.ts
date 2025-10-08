import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { postgres } from '@/lib/postgres';

interface UseAuthenticatedApiOptions {
  /** Delay in milliseconds to wait after auth is ready before allowing API calls */
  delay?: number;
  /** Maximum number of retries for authentication check */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
}

interface UseAuthenticatedApiReturn {
  /** Whether the API is ready to make authenticated calls */
  isReady: boolean;
  /** Whether authentication is being checked */
  isChecking: boolean;
  /** Error message if authentication check failed */
  error: string | null;
  /** Function to manually check authentication */
  checkAuth: () => Promise<boolean>;
  /** Function to wait for authentication to be ready */
  waitForAuth: () => Promise<boolean>;
}

/**
 * Hook to ensure Supabase client is properly authenticated before making API calls
 * 
 * This hook addresses the timing issue where components try to make API calls
 * before the Supabase client's internal session is properly initialized.
 */
export function useAuthenticatedApi(options: UseAuthenticatedApiOptions = {}): UseAuthenticatedApiReturn {
  const {
    delay = 100,
    maxRetries = 5,
    retryDelay = 200
  } = options;

  const { user, loading: authLoading, initialized: authInitialized, session } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if Supabase client is properly authenticated
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setIsChecking(true);
      setError(null);

      if (!session) {
        setError('Authentication required - no valid session found');
        setIsReady(false);
        return false;
      }

      setIsReady(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication check failed';
      setError(errorMessage);
      setIsReady(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Wait for authentication to be ready with retries
   */
  const waitForAuth = useCallback(async (): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        return true;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return false;
  }, [checkAuth, maxRetries, retryDelay]);

  // Check authentication when auth context changes
  useEffect(() => {
    if (user?.id && authInitialized && !authLoading) {
      const timer = setTimeout(async () => {
        await checkAuth();
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
      setError(null);
    }
  }, [user?.id, authInitialized, authLoading, delay, checkAuth]);

  return {
    isReady,
    isChecking,
    error,
    checkAuth,
    waitForAuth
  };
}
