/**
 * Authentik Auth Context
 *
 * Provides authentication state and helpers backed by Authentik OAuth2.
 */

import React, { createContext, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import { authentikAuthService, type AuthUser, type AuthSession } from '@/core/auth/authentikAuthServiceInstance';
import { useAuthStore } from '@/core/auth/authStore';
import { logger } from '@/shared/utils/logger';

const AUTH_LOGS_ENABLED = (import.meta as any)?.env?.VITE_ENABLE_AUTH_LOGS === 'true' || import.meta.env.DEV;
const authLogger = {
  info: (message: string, data?: unknown) => {
    if (AUTH_LOGS_ENABLED) logger.info(`[MarcobyIAMContext] ${message}`, data);
  },
  error: (message: string, error?: unknown) => {
    if (AUTH_LOGS_ENABLED) logger.error(`[MarcobyIAMContext Error] ${message}`, error);
  },
};

interface AuthentikAuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  initialized: boolean;
  error: Error | null;
  signIn: (additionalParams?: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  refreshAuth: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthentikAuthContext = createContext<AuthentikAuthContextType | undefined>(undefined);

export function AuthentikAuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);
  const error = useAuthStore((state) => state.error);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const setAuthState = useAuthStore((state) => state.setAuthState);
  const clearAuthState = useAuthStore((state) => state.clearAuthState);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setError = useAuthStore((state) => state.setError);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  const mountedRef = useRef(true);
  const initializingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const hydrateSession = useCallback(async () => {
    try {
      authLogger.info('Starting session hydration...');
      const authResult = await authentikAuthService.isAuthenticated();

      if (authResult.success && authResult.data) {
        authLogger.info('User appears authenticated, getting session...');
        const sessionResult = await authentikAuthService.getSession();
        if (sessionResult.success && sessionResult.data) {
          setAuthState(sessionResult.data);
          authLogger.info('User authenticated successfully', { userId: sessionResult.data.user.id });
          return;
        }
        authLogger.info('No valid session found during hydration');
      } else {
        authLogger.info('User not authenticated during hydration');
      }

      authLogger.info('Clearing auth state - no valid session');
      clearAuthState(true);
    } catch (error) {
      authLogger.error('Error during session hydration', error);
      clearAuthState(true);
    }
  }, [clearAuthState, setAuthState]);

  const initializeAuth = useCallback(async () => {
    if (initializingRef.current || hasInitializedRef.current) {
      authLogger.info('Auth initialization already in progress or completed');
      return;
    }

    initializingRef.current = true;
    setLoading(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      if (mountedRef.current && initializingRef.current) {
        authLogger.error('Auth initialization timed out - forcing completion');
        setError(new Error('Authentication initialization timed out'));
        setLoading(false);
        setInitialized(true);
        hasInitializedRef.current = true;
        initializingRef.current = false;
      }
    }, 15000); // Increased timeout to 15 seconds

    try {
      authLogger.info('Initializing Marcoby IAM auth...');
      await hydrateSession();
      authLogger.info('Auth initialization completed successfully');
    } catch (error) {
      if (mountedRef.current) {
        authLogger.error('Unexpected error during auth initialization', error);
        setError(new Error('Unexpected authentication error'));
        clearAuthState(true);
      }
    } finally {
      clearTimeout(timeoutId);
      if (mountedRef.current) {
        setLoading(false);
        setInitialized(true);
        hasInitializedRef.current = true;
        authLogger.info('Auth initialization finalized', {
          initialized: true,
          loading: false,
          hasUser: !!user,
          isAuthenticated
        });
      }
      initializingRef.current = false;
    }
  }, [clearAuthState, hydrateSession, setError, setInitialized, setLoading, user, isAuthenticated]);

  useEffect(() => {
    mountedRef.current = true;

    if (!hasInitializedRef.current) {
      if (AUTH_LOGS_ENABLED) {
        console.log('🔍 [AuthentikAuthContext] Starting auth initialization');
      }
      initializeAuth();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [initializeAuth]);

  const signIn = useCallback(
    async (additionalParams?: Record<string, string>): Promise<{ success: boolean; error?: string }> => {
      authLogger.info('Sign in initiated');
      setLoading(true);
      setError(null);

      try {
        const result = await authentikAuthService.initiateOAuthFlow(undefined, additionalParams);

        if (!result.success || !result.data) {
          const errorMessage = result.error || 'Failed to initiate authentication';
          setError(new Error(errorMessage));
          setLoading(false);
          return { success: false, error: errorMessage };
        }

        try {
          window.location.replace(result.data);
        } catch (_redirectError) {
          window.location.href = result.data;
        }

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
        setError(new Error(errorMessage));
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    [setError, setLoading]
  );

  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    authLogger.info('Sign out initiated');
    setLoading(true);
    setError(null);

    try {
      const result = await authentikAuthService.signOut();

      if (!result.success) {
        const errorMessage = result.error || 'Sign out failed';
        setError(new Error(errorMessage));
        setLoading(false);
        return { success: false, error: errorMessage };
      }

      clearAuthState(true);
      setLoading(false);
      authLogger.info('User signed out successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setError(new Error(errorMessage));
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [clearAuthState, setError, setLoading]);

  const refreshAuth = useCallback(async () => {
    authLogger.info('Refreshing authentication state...');
    setLoading(true);
    setError(null);

    try {
      await hydrateSession();
    } catch (error) {
      if (mountedRef.current) {
        authLogger.error('Unexpected error during auth refresh', error);
        setError(new Error('Unexpected authentication error during refresh'));
        clearAuthState(true);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [clearAuthState, hydrateSession, setError, setLoading]);

  const value = useMemo<AuthentikAuthContextType>(
    () => ({ user, session, loading, initialized, error, signIn, signOut, refreshAuth, isAuthenticated }),
    [error, initialized, isAuthenticated, loading, refreshAuth, session, signIn, signOut, user]
  );

  return <AuthentikAuthContext.Provider value={value}>{children}</AuthentikAuthContext.Provider>;
}

export function useAuthentikAuth(): AuthentikAuthContextType {
  const context = useContext(AuthentikAuthContext);
  if (context === undefined) {
    throw new Error('useAuthentikAuth must be used within an AuthentikAuthProvider');
  }
  return context;
}
