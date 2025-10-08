import { useEffect, useRef } from 'react';
import { performanceOptimizer } from '@/shared/utils/performanceOptimizer';
import { getEnvVar } from '@/lib/env-utils';

interface UseOptimizedIntervalOptions {
  enabled?: boolean;
  developmentInterval?: number;
  productionInterval?: number;
  immediate?: boolean;
}

/**
 * Hook for optimized intervals that automatically adjust based on environment
 * Uses longer intervals in development to reduce resource usage
 */
export function useOptimizedInterval(
  callback: () => void,
  options: UseOptimizedIntervalOptions = {}
) {
  const {
    enabled = true,
    developmentInterval = 120000, // 2 minutes default for dev
    productionInterval = 30000,   // 30 seconds default for prod
    immediate = false
  } = options;

  const intervalIdRef = useRef<string | null>(null);
  const isDevelopment = getEnvVar('NODE_ENV') === 'development';

  useEffect(() => {
    if (!enabled) {
      if (intervalIdRef.current) {
        performanceOptimizer.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    const interval = isDevelopment ? developmentInterval : productionInterval;
    const intervalId = `optimized-interval-${Date.now()}-${Math.random()}`;

    // Run immediately if requested
    if (immediate) {
      try {
        callback();
      } catch (error) {
        // Error logging removed for production
      }
    }

    // Set up the interval
    performanceOptimizer.setInterval(intervalId, callback, interval);
    intervalIdRef.current = intervalId;

    // Cleanup on unmount
    return () => {
      if (intervalIdRef.current) {
        performanceOptimizer.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [callback, enabled, developmentInterval, productionInterval, immediate, isDevelopment]);

  // Return cleanup function
  const clearInterval = () => {
    if (intervalIdRef.current) {
      performanceOptimizer.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  return { clearInterval };
}

/**
 * Hook for optimized timeouts that automatically adjust based on environment
 */
export function useOptimizedTimeout(
  callback: () => void,
  options: UseOptimizedIntervalOptions = {}
) {
  const {
    enabled = true,
    developmentInterval = 60000, // 1 minute default for dev
    productionInterval = 30000,  // 30 seconds default for prod
    immediate = false
  } = options;

  const timeoutIdRef = useRef<string | null>(null);
  const isDevelopment = getEnvVar('NODE_ENV') === 'development';

  useEffect(() => {
    if (!enabled) {
      if (timeoutIdRef.current) {
        performanceOptimizer.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      return;
    }

    const timeout = isDevelopment ? developmentInterval : productionInterval;
    const timeoutId = `optimized-timeout-${Date.now()}-${Math.random()}`;

    // Run immediately if requested
    if (immediate) {
      try {
        callback();
      } catch (error) {
        // Error logging removed for production
      }
    }

    // Set up the timeout
    performanceOptimizer.setTimeout(timeoutId, callback, timeout);
    timeoutIdRef.current = timeoutId;

    // Cleanup on unmount
    return () => {
      if (timeoutIdRef.current) {
        performanceOptimizer.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [callback, enabled, developmentInterval, productionInterval, immediate, isDevelopment]);

  // Return cleanup function
  const clearTimeout = () => {
    if (timeoutIdRef.current) {
      performanceOptimizer.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  };

  return { clearTimeout };
}
