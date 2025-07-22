/**
 * useUnifiedAuth Hook
 * React hook for accessing the unified authentication service
 */

import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';

export interface UseUnifiedAuthReturn {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: any;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: any) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Hook for accessing unified authentication state and methods
 */
export function useUnifiedAuth(): UseUnifiedAuthReturn {
  const auth = useAuthContext();

  return {
    user: auth.user,
    isAuthenticated: !!auth.user,
    isLoading: auth.loading,
    session: auth.session,
    signIn: async (email: string, password: string) => {
      const result = await auth.signIn(email, password);
      return { success: !result.error, error: result.error?.message };
    },
    signUp: async (email: string, password: string) => {
      const result = await auth.signUp(email, password);
      return { success: !result.error, error: result.error?.message };
    },
    signOut: async () => {
      try {
        await auth.signOut();
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
    updateProfile: async (updates: any) => {
      try {
        await auth.updateProfile(updates);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
    resetPassword: async (email: string) => {
      const result = await auth.resetPassword(email);
      return { success: !result.error, error: result.error?.message };
    },
  };
}

/**
 * Hook for accessing just the current user
 */
export function useCurrentUser(): any {
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