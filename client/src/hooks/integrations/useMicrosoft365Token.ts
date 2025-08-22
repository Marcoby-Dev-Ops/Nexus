import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks';
import { microsoft365TokenService, type Microsoft365Token } from '@/services/integrations/Microsoft365TokenService';
import { logger } from '@/shared/utils/logger';

interface UseMicrosoft365TokenReturn {
  token: Microsoft365Token | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  forceReauthentication: () => Promise<void>;
  isValid: boolean;
}

export const useMicrosoft365Token = (): UseMicrosoft365TokenReturn => {
  const [token, setToken] = useState<Microsoft365Token | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const { user } = useAuth();

  // Load token on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadToken();
    } else {
      setToken(null);
      setIsValid(false);
      setError(null);
    }
  }, [user?.id]);

  // Check token validity periodically
  useEffect(() => {
    if (!token || !user?.id) return;

    const checkValidity = () => {
      const isValidToken = !microsoft365TokenService.isTokenExpired(token);
      setIsValid(isValidToken);
      
      if (!isValidToken) {
        logger.info('Token expired, attempting automatic refresh', { userId: user.id });
        refreshToken();
      }
    };

    // Check immediately
    checkValidity();

    // Check every 10 minutes in development, 5 minutes in production
    const checkInterval = process.env.NODE_ENV === 'development' ? 10 * 60 * 1000 : 5 * 60 * 1000;
    const interval = setInterval(checkValidity, checkInterval);

    return () => clearInterval(interval);
  }, [token, user?.id]);

  const loadToken = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await microsoft365TokenService.getValidToken(user.id);
      
      if (result.success && result.data) {
        setToken(result.data);
        setIsValid(true);
        logger.info('Microsoft 365 token loaded successfully', { userId: user.id });
      } else {
        setToken(null);
        setIsValid(false);
        setError(result.error || 'Failed to load token');
        logger.error('Failed to load Microsoft 365 token', { error: result.error, userId: user.id });
      }
    } catch (err) {
      setToken(null);
      setIsValid(false);
      setError(err instanceof Error ? err.message : 'Unknown error');
      logger.error('Error loading Microsoft 365 token', { error: err, userId: user.id });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const refreshToken = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await microsoft365TokenService.refreshToken(user.id);
      
      if (result.success && result.data) {
        setToken(result.data);
        setIsValid(true);
        logger.info('Microsoft 365 token refreshed successfully', { userId: user.id });
      } else {
        // If refresh fails, check if we need to force reauthentication
        if (result.error?.includes('No refresh token available') || 
            result.error?.includes('reconnect')) {
          logger.warn('Refresh token unavailable, forcing reauthentication', { userId: user.id });
          await forceReauthentication();
        } else {
          setError(result.error || 'Failed to refresh token');
          logger.error('Failed to refresh Microsoft 365 token', { error: result.error, userId: user.id });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      logger.error('Error refreshing Microsoft 365 token', { error: err, userId: user.id });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const forceReauthentication = useCallback(async () => {
    if (!user?.id) return;

    try {
      logger.info('Forcing Microsoft 365 reauthentication', { userId: user.id });
      
      const result = await microsoft365TokenService.forceReauthentication(user.id);
      
      if (!result.success) {
        setError(result.error || 'Failed to force reauthentication');
        logger.error('Failed to force Microsoft 365 reauthentication', { error: result.error, userId: user.id });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      logger.error('Error forcing Microsoft 365 reauthentication', { error: err, userId: user.id });
    }
  }, [user?.id]);

  return {
    token,
    isLoading,
    error,
    refreshToken,
    forceReauthentication,
    isValid,
  };
};
