import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/core/auth';
import type { AuthUser, AuthSession } from '@/core/auth';
import { performSignOut } from '@/shared/utils/signOut';

// Simple logger for auth events
const authLogger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development' && process.env.VITE_ENABLE_AUTH_LOGS === 'true') {
      console.log(`[AuthContext] ${message}`, data);
    }
  },
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[AuthContext Error] ${message}`, error);
    }
  }
};

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  initialized: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; data?: AuthUser }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; error?: string; data?: AuthUser }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (userId: string, data: Partial<AuthUser>) => Promise<{ success: boolean; error?: string; data?: AuthUser }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs to prevent stale closures and track component lifecycle
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);
  const initializingRef = useRef(false);
  const loadingRef = useRef(false);
  const authListenerRef = useRef<any>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    mountedRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    if (authListenerRef.current) {
      authListenerRef.current.unsubscribe();
      authListenerRef.current = null;
    }
  }, []);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    if (initializingRef.current || !mountedRef.current) return;
    
    initializingRef.current = true;
    loadingRef.current = true;
    
    try {
      // Set up timeout for session retrieval (increased to 15 seconds to accommodate retry logic)
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current && loadingRef.current) {
          authLogger.error('Authentication timeout - proceeding without session');
          setError(new Error('Authentication timeout - session retrieval took too long'));
          setLoading(false);
          setInitialized(true);
          setUser(null);
          setSession(null);
          loadingRef.current = false;
        }
      }, 15000); // 15 second timeout to accommodate retry logic

      // Get initial session
      const result = await authService.getSession();
      
      if (!mountedRef.current) return;
      
      // Clear timeout if we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (!result.success) {
        authLogger.error('Failed to get initial session', result.error);
        setError(new Error(result.error || 'Failed to get session'));
        setSession(null);
        setUser(null);
      } else if (result.data?.user) {
        authLogger.info('Initial session loaded', { userId: result.data.user.id });
        setSession(result.data);
        setUser(result.data.user);
        setError(null); // Clear any previous errors
      } else {
        authLogger.info('No initial session found');
        setSession(result.data);
        setUser(null);
        setError(null); // Clear any previous errors
      }
      
      setLoading(false);
      setInitialized(true);
      loadingRef.current = false;
    } catch (error) {
      if (mountedRef.current) {
        authLogger.error('Unexpected error during auth initialization', error);
        setError(new Error('Unexpected authentication error'));
        setLoading(false);
        setInitialized(true);
        setUser(null);
        setSession(null);
        loadingRef.current = false;
      }
    } finally {
      initializingRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    initializingRef.current = false;
    
    // Initialize auth state
    initializeAuth();

    // Only set up auth listener if one doesn't already exist
    if (!authListenerRef.current) {
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, supabaseSession) => {
          if (!mountedRef.current) return;
          
          authLogger.info('Auth state changed', { event, userId: supabaseSession?.user?.id });
          
          // Clear any existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          // Prevent multiple simultaneous calls
          if (loadingRef.current) {
            authLogger.info('Auth state change ignored - already processing');
            return;
          }
          
          loadingRef.current = true;
          
          // Handle auth state change based on event type
          try {
            if (event === 'SIGNED_OUT') {
              // Clear session immediately for sign out
              setSession(null);
              setUser(null);
              setError(null);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              // Get updated session data from our service
              const sessionResult = await authService.getSession();
              if (sessionResult.success) {
                setSession(sessionResult.data);
                setUser(sessionResult.data?.user ?? null);
                setError(null); // Clear any previous errors
              } else {
                // Clear session on auth errors
                setSession(null);
                setUser(null);
                setError(new Error(sessionResult.error || 'Auth state change failed'));
              }
            } else {
              // For other events, just update based on the provided session
              if (supabaseSession) {
                const authUser: AuthUser = {
                  id: supabaseSession.user.id,
                  email: supabaseSession.user.email || '',
                  firstName: supabaseSession.user.user_metadata?.firstName,
                  lastName: supabaseSession.user.user_metadata?.lastName,
                  createdAt: supabaseSession.user.created_at,
                  updatedAt: supabaseSession.user.updated_at,
                };
                setSession({ user: authUser, session: supabaseSession });
                setUser(authUser);
                setError(null);
              } else {
                setSession(null);
                setUser(null);
                setError(null);
              }
            }
          } catch (error) {
            authLogger.error('Error during auth state change', error);
            setSession(null);
            setUser(null);
            setError(new Error('Auth state change failed'));
          } finally {
            setLoading(false);
            setInitialized(true);
            loadingRef.current = false;
          }
        }
      );

      authListenerRef.current = subscription;
    }

    // Return cleanup function
    return cleanup;
  }, [initializeAuth, cleanup]);

  const signIn = async (email: string, password: string) => {
    authLogger.info('Sign in attempt', { email });
    setLoading(true);
    setError(null);

    try {
      const result = await authService.signIn({ email, password });
      
      if (!result.success) {
        setError(new Error(result.error || 'Sign in failed'));
        setLoading(false);
        return { success: false, error: result.error };
      }

      // Auth state change listener will handle updating user/session
      return { success: true, data: result.data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setError(new Error(errorMessage));
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    authLogger.info('Sign up attempt', { email });
    setLoading(true);
    setError(null);

    try {
      const result = await authService.signUp({ email, password, firstName, lastName });
      
      if (!result.success) {
        setError(new Error(result.error || 'Sign up failed'));
        setLoading(false);
        return { success: false, error: result.error };
      }

      // Auth state change listener will handle updating user/session
      return { success: true, data: result.data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setError(new Error(errorMessage));
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    authLogger.info('Sign out attempt');
    setLoading(true);
    setError(null);

    try {
      // Use the comprehensive sign out utility
      await performSignOut();
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setLoading(false);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setError(new Error(errorMessage));
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string) => {
    authLogger.info('Password reset attempt', { email });
    setError(null);

    try {
      const result = await authService.resetPassword(email);
      
      if (!result.success) {
        setError(new Error(result.error || 'Password reset failed'));
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setError(new Error(errorMessage));
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (userId: string, data: Partial<AuthUser>) => {
    authLogger.info('Profile update attempt', { userId });
    setError(null);

    try {
      const result = await authService.updateProfile(userId, data);
      
      if (!result.success) {
        setError(new Error(result.error || 'Profile update failed'));
        return { success: false, error: result.error };
      }

      // Update local user state
      setUser(result.data);
      return { success: true, data: result.data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setError(new Error(errorMessage));
      return { success: false, error: errorMessage };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    initialized,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
