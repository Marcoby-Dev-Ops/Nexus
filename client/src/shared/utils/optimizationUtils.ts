/**
 * Optimization utilities to prevent unnecessary re-renders and database calls
 */

import { useCallback, useRef } from 'react';

/**
 * Creates a stable callback that only changes when dependencies actually change
 * This prevents unnecessary useEffect re-runs
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
): T {
  const callbackRef = useRef<T>(callback);
  callbackRef.current = callback;

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, dependencies) as T;
}

/**
 * Debounces a function to prevent rapid successive calls
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  dependencies: any[] = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay, ...dependencies]) as T;
}

/**
 * Prevents multiple rapid calls to the same function
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  dependencies: any[] = []
): T {
  const lastCallRef = useRef<number>(0);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay, ...dependencies]) as T;
}

/**
 * Creates a stable session token for dependency arrays
 * This prevents unnecessary re-renders when session object changes but token doesn't
 */
export function useSessionToken(session: any): string | null {
  return session?.access_token || null;
}

/**
 * Creates a stable user ID for dependency arrays
 * This prevents unnecessary re-renders when user object changes but ID doesn't
 */
export function useUserId(user: any): string | null {
  return user?.id || null;
} 
