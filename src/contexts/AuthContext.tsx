import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Row types for profiles, companies, and integrations
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type CompanyRow = Database['public']['Tables']['companies']['Row'];
type UserIntegrationRow = Database['public']['Tables']['user_integrations']['Row'];

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  initials?: string;
  avatar_url?: string;
  created_at: string;
  last_sign_in_at?: string;
  role?: string;
  department?: string;
  company_id?: string | null;
  company?: CompanyRow | null;
  integrations?: UserIntegrationRow[];
  onboardingCompleted?: boolean;
  profile?: UserProfileRow | null;
}

interface AuthContextType {
  user: AuthUser | null;
  integrations: UserIntegrationRow[];
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfileRow>) => Promise<void>;
  updateCompany: (updates: Partial<CompanyRow>) => Promise<void>;
  refreshIntegrations: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [integrations, setIntegrations] = useState<UserIntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) setError(sessionError);
      handleAuthChange(session);
      supabase.auth.onAuthStateChange((_event, session) => handleAuthChange(session));
    };
    initAuth();
  }, []);

  // Fetch user integrations when authenticated
  useEffect(() => {
    const loadIntegrations = async () => {
      if (!supabaseUser) {
        setIntegrations([]);
        return;
      }
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', supabaseUser.id);
      if (!error && data) setIntegrations(data);
    };
    loadIntegrations();
  }, [supabaseUser]);

  const handleAuthChange = async (session: Session | null) => {
    setLoading(true);
    setSession(session);
    setSupabaseUser(session?.user ?? null);
    if (session?.user) {
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        setProfile(userProfile as UserProfileRow | null);
        if (userProfile?.company_id) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', userProfile.company_id)
            .maybeSingle();
          if (companyError) throw companyError;
          setCompany(companyData as CompanyRow | null);
        } else {
          setCompany(null);
        }
      } catch (err) {
        setError(err as Error);
      }
    } else {
      setProfile(null);
      setCompany(null);
      setIntegrations([]);
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ?? null };
  };

  const updateProfile = async (updates: Partial<UserProfileRow>) => {
    if (!profile) return;
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .maybeSingle();
    if (updateError) throw updateError;
    setProfile(updatedProfile as UserProfileRow | null);
  };

  const updateCompany = async (updates: Partial<CompanyRow>) => {
    if (!profile?.company_id) return;
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', profile.company_id)
      .maybeSingle();
    if (error) throw error;
    setCompany(data as CompanyRow | null);
  };

  const refreshIntegrations = async () => {
    if (!supabaseUser) return;
    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', supabaseUser.id);
    if (error) throw error;
    setIntegrations((data as UserIntegrationRow[]) || []);
  };

  const completeOnboarding = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ onboarding_completed: true })
      .eq('id', profile.id)
      .maybeSingle();
    if (error) throw error;
    setProfile(data as UserProfileRow | null);
  };

  const contextValue: AuthContextType = {
    user: supabaseUser
      ? {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.full_name || undefined,
          full_name: supabaseUser.user_metadata?.full_name,
          initials: supabaseUser.user_metadata?.initials,
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          created_at: supabaseUser.created_at,
          last_sign_in_at: supabaseUser.last_sign_in_at,
          role: profile?.role || undefined,
          department: profile?.department || undefined,
          company_id: profile?.company_id || undefined,
          company,
          integrations,
          onboardingCompleted: profile?.onboarding_completed ?? false,
          profile,
        }
      : null,
    integrations,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updateCompany,
    refreshIntegrations,
    completeOnboarding,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 