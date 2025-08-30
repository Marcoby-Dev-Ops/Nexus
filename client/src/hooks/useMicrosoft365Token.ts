import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { microsoft365Service } from '@/services/integrations/Microsoft365Service';
import { logger } from '@/shared/utils/logger';

interface UseMicrosoft365TokenReturn {
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  isConnected: boolean;
}

export const useMicrosoft365Token = (): UseMicrosoft365TokenReturn => {
  const { user } = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchToken = useCallback(async () => {
    if (!user?.id) {
      setAccessToken(null);
      setIsConnected(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await microsoft365Service.getValidAccessToken(user.id);
      
      if (result.success && result.data) {
        setAccessToken(result.data);
        setIsConnected(true);
        logger.info('Successfully retrieved Microsoft 365 access token', { userId: user.id });
      } else {
        setAccessToken(null);
        setIsConnected(false);
        setError(result.error || 'Failed to get access token');
        logger.warn('Failed to get Microsoft 365 access token', { 
          userId: user.id, 
          error: result.error 
        });
      }
    } catch (err) {
      setAccessToken(null);
      setIsConnected(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Error fetching Microsoft 365 access token', { 
        userId: user.id, 
        error: err 
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const refreshToken = useCallback(async () => {
    await fetchToken();
  }, [fetchToken]);

  // Fetch token on mount and when user changes
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return {
    accessToken,
    isLoading,
    error,
    refreshToken,
    isConnected,
  };
};
