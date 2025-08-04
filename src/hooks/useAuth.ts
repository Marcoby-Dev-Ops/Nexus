import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/core/auth';
import type { AuthUser, AuthSession } from '@/core/auth';

// Simple logger for auth events
const authLogger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Auth] ${message}`, data);
    }
    // In production, this would send to your logging service
  },
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Auth Error] ${message}`, error);
    }
    // In production, this would send to your error tracking service
  }
};

export function useAuth() {
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
  }, []);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    if (initializingRef.current || !mountedRef.current) return;
    
    initializingRef.current = true;
    loadingRef.current = true;
    
    try {
      // Set up timeout for session retrieval (increased to 15 seconds)
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current && loadingRef.current) {
          authLogger.error('Authentication timeout - proceeding without session');
          setError(new Error('Authentication timeout'));
          setLoading(false);
          setInitialized(true);
          setUser(null);
          setSession(null);
          loadingRef.current = false;
        }
      }, 15000); // 15 second timeout

      // Get initial session
      const result = await authService.getSession();
      
      if (!mountedRef.current) return;
      
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
        
        // Get updated session data from our service
        try {
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
        } catch (error) {
          authLogger.error('Error during auth state change', error);
          setSession(null);
          setUser(null);
          setError(new Error('Auth state change failed'));
        }
        
        setLoading(false);
        setInitialized(true);
      }
    );

    subscriptionRef.current = subscription;

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
      const result = await authService.signOut();
      
      if (!result.success) {
        setError(new Error(result.error || 'Sign out failed'));
        setLoading(false);
        return { success: false, error: result.error };
      }

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

  return {
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
} 