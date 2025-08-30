/**
 * Demo Authentication Hook
 * 
 * Extends the existing auth system to support demo accounts and demo mode
 * Provides seamless switching between demo and real authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks';
import { 
  getDemoAccount, 
  isDemoAccount, 
  isDemoMode, 
  shouldShowDemoMode,
  type DemoAccount 
} from '@/shared/config/demoConfig';

export interface DemoAuthState {
  isDemoMode: boolean;
  demoUser: DemoAccount | null;
  isDemoAuthenticated: boolean;
  demoLoading: boolean;
}

export interface DemoAuthActions {
  signInDemo: (email: string, password: string) => Promise<{ error: any }>;
  signOutDemo: () => Promise<{ error: any }>;
  switchToRealAuth: () => void;
  switchToDemoAuth: () => void;
}

export function useDemoAuth() {
  const { user, session, loading, signIn, signOut, isAuthenticated } = useAuth();
  const [demoState, setDemoState] = useState<DemoAuthState>({
    isDemoMode: false,
    demoUser: null,
    isDemoAuthenticated: false,
    demoLoading: false,
  });

  // Check if current user is a demo account
  useEffect(() => {
    if (user && isDemoAccount(user.email)) {
      const demoAccount = getDemoAccount(user.email);
      setDemoState(prev => ({
        ...prev,
        isDemoMode: true,
        demoUser: demoAccount || null,
        isDemoAuthenticated: true,
      }));
    } else if (user) {
      // User is authenticated with a real account - disable demo mode
      setDemoState(prev => ({
        ...prev,
        isDemoMode: false,
        demoUser: null,
        isDemoAuthenticated: false,
      }));
    } else {
      // No user - check if demo mode should be available
      const canShowDemo = shouldShowDemoMode(null);
      setDemoState(prev => ({
        ...prev,
        isDemoMode: canShowDemo,
        demoUser: null,
        isDemoAuthenticated: false,
      }));
    }
  }, [user]);

  // Demo sign in
  const signInDemo = useCallback(async (email: string, password: string) => {
    setDemoState(prev => ({ ...prev, demoLoading: true }));

    try {
      // Check if it's a demo account
      const demoAccount = getDemoAccount(email);
      
      if (!demoAccount) {
        return { error: new Error('Invalid demo account') };
      }

      if (demoAccount.password !== password) {
        return { error: new Error('Invalid password') };
      }

      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setDemoState(prev => ({
        ...prev,
        isDemoMode: true,
        demoUser: demoAccount,
        isDemoAuthenticated: true,
        demoLoading: false,
      }));

      return { error: null };
    } catch (error) {
      setDemoState(prev => ({ ...prev, demoLoading: false }));
      return { error };
    }
  }, []);

  // Demo sign out
  const signOutDemo = useCallback(async () => {
    setDemoState(prev => ({ ...prev, demoLoading: true }));

    try {
      // Simulate sign out delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setDemoState(prev => ({
        ...prev,
        isDemoMode: false,
        demoUser: null,
        isDemoAuthenticated: false,
        demoLoading: false,
      }));

      return { error: null };
    } catch (error) {
      setDemoState(prev => ({ ...prev, demoLoading: false }));
      return { error };
    }
  }, []);

  // Switch to real authentication
  const switchToRealAuth = useCallback(() => {
    setDemoState(prev => ({
      ...prev,
      isDemoMode: false,
      demoUser: null,
      isDemoAuthenticated: false,
    }));
  }, []);

  // Switch to demo authentication
  const switchToDemoAuth = useCallback(() => {
    if (isDemoMode()) {
      setDemoState(prev => ({
        ...prev,
        isDemoMode: true,
      }));
    }
  }, []);

  // Combined authentication state
  const isAuthenticatedCombined = isAuthenticated || demoState.isDemoAuthenticated;
  const currentUser = user || demoState.demoUser;
  const isLoading = loading || demoState.demoLoading;

  return {
    // State
    user: currentUser,
    session,
    loading: isLoading,
    isAuthenticated: isAuthenticatedCombined,
    isDemoMode: demoState.isDemoMode,
    demoUser: demoState.demoUser,
    isDemoAuthenticated: demoState.isDemoAuthenticated,
    demoLoading: demoState.demoLoading,

    // Actions
    signIn,
    signOut,
    signInDemo,
    signOutDemo,
    switchToRealAuth,
    switchToDemoAuth,

    // Combined actions
    signOutCombined: async () => {
      if (demoState.isDemoAuthenticated) {
        return await signOutDemo();
      } else {
        return await signOut();
      }
    },
  };
} 
