import { useContext, useEffect, useState } from 'react';
import { UserContext } from '@/shared/contexts/UserContext';
import { logger } from '@/shared/utils/logger';

/**
 * Hook to ensure user context is ready before making API calls
 * Prevents race conditions where components try to access data before user mapping is established
 */
export const useUserContextReady = () => {
  const userContext = useContext(UserContext);
  const [isReady, setIsReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10; // Maximum number of retries
  const retryDelay = 500; // 500ms between retries

  useEffect(() => {
    if (!userContext) {
      logger.warn('useUserContextReady: UserContext not available');
      return;
    }

    // If mapping is already ready, set ready immediately
    if (userContext.mappingReady) {
      setIsReady(true);
      setRetryCount(0);
      return;
    }

    // If user is not authenticated, don't retry
    if (!userContext.profile && !userContext.loading) {
      setIsReady(false);
      return;
    }

    // If we've exceeded max retries, give up
    if (retryCount >= maxRetries) {
      logger.error('useUserContextReady: Max retries exceeded', { 
        retryCount, 
        maxRetries,
        userId: userContext.profile?.id 
      });
      setIsReady(false);
      return;
    }

    // Retry logic with exponential backoff
    const timer = setTimeout(() => {
      if (userContext.mappingReady) {
        setIsReady(true);
        setRetryCount(0);
        logger.info('useUserContextReady: Mapping is now ready', { 
          retryCount,
          userId: userContext.profile?.id 
        });
      } else {
        setRetryCount(prev => prev + 1);
        logger.warn('useUserContextReady: Mapping not ready, retrying', { 
          retryCount: retryCount + 1,
          maxRetries,
          userId: userContext.profile?.id 
        });
      }
    }, retryDelay * Math.pow(2, retryCount));

    return () => clearTimeout(timer);
  }, [userContext?.mappingReady, userContext?.profile, userContext?.loading, retryCount, maxRetries, retryDelay]);

  return {
    isReady,
    retryCount,
    maxRetries,
    userContext: userContext || null,
    // Convenience getters
    profile: userContext?.profile || null,
    loading: userContext?.loading || false,
    error: userContext?.error || null,
    internalUserId: userContext?.internalUserId || null,
  };
};
