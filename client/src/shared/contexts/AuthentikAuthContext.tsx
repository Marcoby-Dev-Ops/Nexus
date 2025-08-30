/**
 * Authentik Auth Context
 * 
 * This context provides authentication state and methods using Authentik OAuth2.
 * Replaces the Supabase AuthContext for the migration to Authentik.
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { authentikAuthService, type AuthUser, type AuthSession } from '@/core/auth/authentikAuthServiceInstance';
import { logger } from '@/shared/utils/logger';


// Simple logger for auth events
const authLogger = {
  info: (message: string, data?: unknown) => {
    logger.info(`[MarcobyIAMContext] ${message}`, data);
  },
  error: (message: string, error?: unknown) => {
    logger.error(`[MarcobyIAMContext Error] ${message}`, error);
  }
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const mountedRef = useRef(true);
  const initializingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const initializeAuth = useCallback(async () => {
    // Prevent multiple initializations in React StrictMode
    if (initializingRef.current || hasInitializedRef.current) {
      authLogger.info('Auth initialization already in progress or completed');
      return;
    }

    initializingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      authLogger.info('Initializing Marcoby IAM auth...');

      // Check if user is authenticated
      const authResult = await authentikAuthService.isAuthenticated();
      
      if (authResult.success && authResult.data) {
        // User is authenticated, get session
        const sessionResult = await authentikAuthService.getSession();
        
        if (sessionResult.success && sessionResult.data) {
          setSession(sessionResult.data);
          setUser(sessionResult.data.user);
          setIsAuthenticated(true);
          authLogger.info('User authenticated', { userId: sessionResult.data.user.id });
          

          
          // Debug logging removed for security
          
          // Manually store session in localStorage if it's not already there
          if (sessionResult.data.session?.accessToken) {
            try {
              const existingSession = localStorage.getItem('authentik_session');
              if (!existingSession) {
                localStorage.setItem('authentik_session', JSON.stringify(sessionResult.data.session));
                // Debug logging removed
              } else {
                // Debug logging removed
              }
            } catch (error) {
              // Error logging removed for production
            }
          }
        } else {
          authLogger.info('No valid session found');
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        authLogger.info('User not authenticated');
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      if (mountedRef.current) {
        authLogger.error('Unexpected error during auth initialization', error);
        setError(new Error('Unexpected authentication error'));
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setInitialized(true);
        hasInitializedRef.current = true;
      }
      initializingRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Only initialize if not already initialized
    if (!hasInitializedRef.current) {
      initializeAuth();
    }

    // Return cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, []); // Remove initializeAuth from dependencies

  // Add effect to handle unauthenticated users
  useEffect(() => {
    if (initialized && !loading && !isAuthenticated) {
      // Check if we're not already on an auth page
      const currentPath = window.location.pathname;
      const authPaths = ['/auth/callback', '/auth/test', '/auth/signup', '/admin/auth-callback', '/admin/auth-status', '/admin/email-not-verified', '/admin/waitlist', '/login', '/signup', '/privacy', '/terms', '/cookies', '/security', '/pricing', '/', '/onboarding'];
      const isAuthPath = authPaths.some(path => currentPath.startsWith(path));
      
      if (!isAuthPath) {
        authLogger.info('User not authenticated, redirecting to login');
        window.location.href = '/login';
      }
    }
  }, [initialized, loading, isAuthenticated]);

  const signIn = async (additionalParams?: Record<string, string>): Promise<{ success: boolean; error?: string }> => {
    authLogger.info('Sign in initiated');
    setLoading(true);
    setError(null);

    try {
      // Initiate OAuth flow
      const result = await authentikAuthService.initiateOAuthFlow(undefined, additionalParams);
      
      if (!result.success || !result.data) {
        const errorMessage = result.error || 'Failed to initiate authentication';
        // Error logging removed for production
        setError(new Error(errorMessage));
        setLoading(false);
        return { success: false, error: errorMessage };
      }

      // Redirect to Authentik
      authLogger.info('Redirecting to Marcoby IAM');
      
      // Try using replace instead of href for more reliable redirect
      try {
        window.location.replace(result.data);
      } catch (redirectError) {
        // Error logging removed for production
        // Fallback to href
        window.location.href = result.data;
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setError(new Error(errorMessage));
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
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

      // Clear state
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setLoading(false);
      
      authLogger.info('User signed out successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setError(new Error(errorMessage));
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const refreshAuth = useCallback(async () => {
    authLogger.info('Refreshing authentication state...');
    setLoading(true);
    setError(null);

    try {
      const authResult = await authentikAuthService.isAuthenticated();
      if (authResult.success && authResult.data) {
        const sessionResult = await authentikAuthService.getSession();
        if (sessionResult.success && sessionResult.data) {
          setSession(sessionResult.data);
          setUser(sessionResult.data.user);
          setIsAuthenticated(true);
          authLogger.info('Authentication state refreshed', { userId: sessionResult.data.user.id });
        } else {
          authLogger.info('No valid session found after refresh');
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        authLogger.info('User not authenticated after refresh');
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      if (mountedRef.current) {
        authLogger.error('Unexpected error during auth refresh', error);
        setError(new Error('Unexpected authentication error during refresh'));
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const value: AuthentikAuthContextType = {
    user,
    session,
    loading,
    initialized,
    error,
    signIn,
    signOut,
    refreshAuth,
    isAuthenticated,
  };

  return (
    <AuthentikAuthContext.Provider value={value}>
      {children}
    </AuthentikAuthContext.Provider>
  );
}

export function useAuthentikAuth(): AuthentikAuthContextType {
  const context = useContext(AuthentikAuthContext);
  if (context === undefined) {
    throw new Error('useAuthentikAuth must be used within an AuthentikAuthProvider');
  }
  return context;
}
