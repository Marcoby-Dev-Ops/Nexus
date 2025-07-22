import React, { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/shared/stores/authStore';
import { performSignOut } from '@/shared/utils/signOut';
import type { Session } from '@supabase/supabase-js';
import type { Database } from '@/core/types/database.types';

// Simple logging utility for AuthContext
const logAuth = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logData = data ? ` | Data: ${JSON.stringify(data)}` : '';
  console.log(`[AuthContext:${timestamp}] ${level.toUpperCase()}: ${message}${logData}`);
};

// Extract the correct types from the Database type
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type CompanyRow = Database['public']['Tables']['companies']['Row'];
type UserIntegrationRow = Database['public']['Tables']['user_integrations']['Row'];

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  full_name?: string | null;
  initials?: string;
  avatar_url?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  role?: string | null;
  department?: string | null;
  company_id?: string | null;
  company?: CompanyRow | null;
  integrations?: UserIntegrationRow[];
  onboardingCompleted?: boolean | null;
  profile?: UserProfileRow | null;
}

interface AuthContextType {
  user: AuthUser | null;
  integrations: UserIntegrationRow[];
  session: Session | null;
  loading: boolean;
  error: Error | null;
  activeOrgId: string | null;
  initialized: boolean;
  status: 'idle'|'loading'|'success'|'timeout'|'error';
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfileRow>) => Promise<void>;
  updateCompany: (updates: Partial<CompanyRow>) => Promise<void>;
  refreshIntegrations: (forceRefresh?: boolean) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  retrySessionFetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
            const {
            session,
            user: supabaseUser,
            profile,
            company,
            integrations,
            loading,
            error,
            initialized,
            status,
            signIn: authSignIn,
            signUp: authSignUp,
            resetPassword: authResetPassword,
            fetchIntegrations,
            updateProfile: authUpdateProfile
          } = useAuthStore();

  // Transform Zustand state to match AuthContext interface
  const user: AuthUser | null = useMemo(() => {
    if (!supabaseUser) return null;
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profile?.full_name || supabaseUser.user_metadata?.full_name,
      full_name: profile?.full_name,
      initials: profile?.full_name?.split(' ').map(n => n[0]).join('') || supabaseUser.email?.substring(0, 2).toUpperCase(),
      avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
      created_at: supabaseUser.created_at,
      last_sign_in_at: supabaseUser.last_sign_in_at,
      role: profile?.role,
      department: profile?.department,
      company_id: profile?.company_id,
      company,
      integrations,
      onboardingCompleted: profile?.onboarding_completed,
      profile
    };
  }, [supabaseUser, profile, company, integrations]);

  // Wrapper functions to match AuthContext interface
  const signIn = async (email: string, password: string) => {
    const result = await authSignIn(email, password);
    return { error: result.error ? new Error(result.error) : null };
  };

  const signUp = async (email: string, password: string, _metadata: Record<string, any> = {}) => {
    const result = await authSignUp(email, password);
    return { error: result.error ? new Error(result.error) : null };
  };

            const signOut = async () => {
            try {
              logAuth('info', 'AuthContext sign out called');
              await performSignOut();
              logAuth('info', 'AuthContext sign out completed');
            } catch (error) {
              logAuth('error', 'AuthContext sign out error', { error: (error as Error).message });
            }
          };

  const resetPassword = async (email: string) => {
    const result = await authResetPassword(email);
    return { error: result.error ? new Error(result.error) : null };
  };

  const updateProfile = async (updates: Partial<UserProfileRow>) => {
    await authUpdateProfile(updates);
  };

  const updateCompany = async (_updates: Partial<CompanyRow>) => {
    // This would need to be implemented in the Zustand store
    console.warn('updateCompany not implemented in Zustand store yet');
  };

  const refreshIntegrations = async (forceRefresh = false) => {
    if (user?.id) {
      await fetchIntegrations(user.id, forceRefresh);
    }
  };

  const completeOnboarding = async () => {
    if (user?.id) {
      await updateProfile({ onboarding_completed: true });
    }
  };

  const retrySessionFetch = async () => {
    // This would need to be implemented in the Zustand store
    console.warn('retrySessionFetch not implemented in Zustand store yet');
  };

  const contextValue: AuthContextType = {
    user,
    integrations,
    session,
    loading,
    error,
    activeOrgId: company?.id || null,
    initialized,
    status,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updateCompany,
    refreshIntegrations,
    completeOnboarding,
    retrySessionFetch
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Export useAuth as an alias for useAuthContext for compatibility
export const useAuth = useAuthContext; 