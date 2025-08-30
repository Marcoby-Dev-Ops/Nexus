import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';
import type { AuthUser, AuthSession } from '@/core/auth/authentikAuthServiceInstance';

// Compatibility interface that matches the old AuthContext
export interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  initialized: boolean;
  error: Error | null;
  signIn: (email?: string, password?: string) => Promise<{ success: boolean; error?: string; data?: AuthUser }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; error?: string; data?: AuthUser }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (userId: string, data: Partial<AuthUser>) => Promise<{ success: boolean; error?: string; data?: AuthUser }>;
  refreshAuth: () => Promise<void>;
  isAuthenticated: boolean;
}

/**
 * Compatibility hook that provides the same interface as the old useAuth hook
 * but uses the new AuthentikAuthContext internally
 */
export function useAuth(): AuthContextType {
  const authentikAuth = useAuthentikAuth();

  // Create compatibility methods that match the old interface
  const signIn = async (email?: string, password?: string): Promise<{ success: boolean; error?: string; data?: AuthUser }> => {
    const result = await authentikAuth.signIn();
    return {
      success: result.success,
      error: result.error,
      data: result.success ? authentikAuth.user : undefined
    };
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string): Promise<{ success: boolean; error?: string; data?: AuthUser }> => {
    // For Authentik, sign up is typically handled through the OAuth flow
    // This is a placeholder that redirects to sign in
    const result = await authentikAuth.signIn();
    return {
      success: result.success,
      error: result.error || 'Sign up not available through this method',
      data: result.success ? authentikAuth.user : undefined
    };
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    // Password reset would need to be handled through Authentik's interface
    return {
      success: false,
      error: 'Password reset not available through this method'
    };
  };

  const updateProfile = async (userId: string, data: Partial<AuthUser>): Promise<{ success: boolean; error?: string; data?: AuthUser }> => {
    // Profile updates would need to be handled through Authentik's interface
    return {
      success: false,
      error: 'Profile updates not available through this method',
      data: undefined
    };
  };

  return {
    user: authentikAuth.user,
    session: authentikAuth.session,
    loading: authentikAuth.loading,
    initialized: authentikAuth.initialized,
    error: authentikAuth.error,
    signIn,
    signUp,
    signOut: authentikAuth.signOut,
    resetPassword,
    updateProfile,
    refreshAuth: authentikAuth.refreshAuth,
    isAuthenticated: authentikAuth.isAuthenticated,
  };
}
