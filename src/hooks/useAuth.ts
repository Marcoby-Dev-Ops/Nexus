import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services';
import type { User, Session } from '@supabase/supabase-js';

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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isActive = true; // Track if the effect is still active
    
    // Set up timeout for session retrieval
    const timeoutId = setTimeout(() => {
      if (isActive && loading) {
        authLogger.error('Authentication timeout');
        setError(new Error('Authentication timeout'));
        setLoading(false);
        setInitialized(true);
      }
    }, 10000); // 10 second timeout

    // Get initial session
    authService.getSession().then(({ session, error }) => {
      if (!isActive) return; // Don't update state if effect is cleaned up
      
      clearTimeout(timeoutId);
      
      if (error) {
        authLogger.error('Failed to get initial session', error);
        setError(error instanceof Error ? error : new Error(error?.message || 'Unknown error'));
      } else if (session) {
        authLogger.info('Initial session loaded', { userId: session.user.id });
      } else {
        authLogger.info('No initial session found');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isActive) return; // Don't update state if effect is cleaned up
        
        authLogger.info('Auth state changed', { event, userId: session?.user?.id });
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setInitialized(true);
      }
    );

    // Return cleanup function that clears timeout and unsubscribes
    return () => {
      isActive = false; // Mark as inactive
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    authLogger.info('Sign in attempt', { email });
    const result = await authService.signIn(email, password);
    
    if (result.error) {
      authLogger.error('Sign in failed', result.error);
      setError(result.error instanceof Error ? result.error : new Error(result.error?.message || 'Sign in failed'));
    } else {
      authLogger.info('Sign in successful', { userId: result.session?.user?.id });
      setError(null); // Clear any previous errors
    }
    
    return result;
  };

  const signUp = async (email: string, password: string) => {
    authLogger.info('Sign up attempt', { email });
    const result = await authService.signUp(email, password);
    
    if (result.error) {
      authLogger.error('Sign up failed', result.error);
      setError(result.error instanceof Error ? result.error : new Error(result.error?.message || 'Sign up failed'));
    } else {
      authLogger.info('Sign up successful', { userId: result.session?.user?.id });
      setError(null); // Clear any previous errors
    }
    
    return result;
  };

  const signOut = async () => {
    authLogger.info('Sign out attempt');
    const result = await authService.signOut();
    
    if (result.error) {
      authLogger.error('Sign out failed', result.error);
      setError(result.error instanceof Error ? result.error : new Error(result.error?.message || 'Sign out failed'));
    } else {
      authLogger.info('Sign out successful');
      setError(null); // Clear any previous errors
    }
    
    return result;
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
    isAuthenticated: !!user,
  };
} 