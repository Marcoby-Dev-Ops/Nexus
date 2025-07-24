/**
 * React hook for authentication state and methods
 * 
 * Provides a clean interface to the AuthManager singleton.
 */

import { useState, useEffect, useCallback } from 'react';
import { authManager, type AuthState } from './AuthManager';
import type { User, Session } from '@supabase/supabase-js';

export interface UseAuthManagerReturn {
  // State
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Methods
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  ensureValidSession: () => Promise<Session>;
}

export function useAuthManager(): UseAuthManagerReturn {
  const [state, setState] = useState<AuthState>(authManager.getState());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authManager.subscribe(setState);
    
    // Initialize auth manager if not already done
    authManager.initialize().catch(error => {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to initialize auth manager: ', error);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    return authManager.signIn(email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    return authManager.signUp(email, password);
  }, []);

  const signOut = useCallback(async () => {
    return authManager.signOut();
  }, []);

  const refreshSession = useCallback(async () => {
    return authManager.refreshSession();
  }, []);

  const ensureValidSession = useCallback(async () => {
    return authManager.ensureValidSession();
  }, []);

  return {
    // State
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    session: state.session,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,
    
    // Methods
    signIn,
    signUp,
    signOut,
    refreshSession,
    ensureValidSession,
  };
} 