/**
 * useUnifiedAuth Hook
 * React hook for accessing the unified authentication service
 */

import { useState, useEffect } from 'react';
import { unifiedAuthService, type AuthState, type UnifiedUser } from '../unifiedAuthService';

export interface UseUnifiedAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UnifiedUser>) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Hook for accessing unified authentication state and methods
 */
export function useUnifiedAuth(): UseUnifiedAuthReturn {
  const [authState, setAuthState] = useState<AuthState>(unifiedAuthService.getCurrentState());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = unifiedAuthService.subscribe(setAuthState);
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  return {
    ...authState,
    signIn: unifiedAuthService.signIn.bind(unifiedAuthService),
    signUp: unifiedAuthService.signUp.bind(unifiedAuthService),
    signOut: unifiedAuthService.signOut.bind(unifiedAuthService),
    updateProfile: unifiedAuthService.updateProfile.bind(unifiedAuthService),
    resetPassword: unifiedAuthService.resetPassword.bind(unifiedAuthService),
  };
}

/**
 * Hook for accessing just the current user
 */
export function useCurrentUser(): UnifiedUser | null {
  const { user } = useUnifiedAuth();
  return user;
}

/**
 * Hook for checking authentication status
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useUnifiedAuth();
  return isAuthenticated;
} 