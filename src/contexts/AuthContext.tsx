import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/core/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '@/lib/core/database.types';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

// Row types for profiles, companies, and integrations
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
  
  // Refs for cleanup and preventing race conditions
  const mountedRef = useRef(true);
  const processingRef = useRef(false);

  // Helper: retry getSession up to 3 times
  const getSessionWithRetry = async (retries = 3, delayMs = 500): Promise<{ session: Session | null, error: any }> => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session || error) return { session, error };
      } catch (err) {
        console.warn(`[Auth] getSession attempt ${i + 1} failed`, err);
        if (i === retries - 1) return { session: null, error: err };
      }
      await new Promise(res => setTimeout(res, delayMs));
    }
    return { session: null, error: new Error('Session fetch failed after retries') };
  };

  const handleAuthChange = useCallback(async (session: Session | null) => {
    // Prevent multiple simultaneous auth changes
    if (!mountedRef.current || processingRef.current) {
      return;
    }
    
    processingRef.current = true;
    setLoading(true);
    
    try {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      setError(null);

      if (session?.user && mountedRef.current) {
        try {
          // Fetch profile, company, and integrations in parallel
          const [profileResult, integrationsResult] = await Promise.all([
            supabase
              .from('user_profiles')
              .select('*, company:companies(*)')
              .eq('id', session.user.id)
              .maybeSingle(),
            supabase
              .from('user_integrations')
              .select('*')
              .eq('user_id', session.user.id)
          ]);

          if (!mountedRef.current) return;
          
          let finalProfile = profileResult.data as UserProfileRow & { company: CompanyRow | null } | null;
          if (profileResult.error) {
            console.warn('Profile fetch error:', profileResult.error);
          }

          // If no profile exists for a new user, create one
          if (!finalProfile && session.user) {
            console.log('No profile found for new user, creating one...');
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: session.user.id,
                email: session.user.email,
                display_name: session.user.email?.split('@')[0],
              })
              .select()
              .single();

            if (createError) {
              console.error('Failed to create user profile:', createError);
              throw createError;
            }
            finalProfile = newProfile as UserProfileRow & { company: CompanyRow | null };
          }
          
          setProfile(finalProfile);

          // The company data is now part of the profile fetch
          setCompany(finalProfile?.company ?? null);

          // Set integrations from the parallel fetch
          if (integrationsResult.error) {
            console.warn('Integrations fetch error:', integrationsResult.error);
            setIntegrations([]);
          } else {
            setIntegrations(integrationsResult.data || []);
          }
        } catch (err) {
          console.error('Auth change error:', err);
          if (mountedRef.current) {
            setError(err as Error);
            setProfile(null);
            setCompany(null);
            setIntegrations([]);
          }
        }
      } else {
        // No session - clear all data
        setProfile(null);
        setCompany(null);
        setIntegrations([]);
      }
    } catch (err) {
      console.error('Auth change error:', err);
      if (mountedRef.current) {
        setError(err as Error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      processingRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    const initAuth = async () => {
      try {
        // Try to get session with retry
        const { session, error: sessionError } = await getSessionWithRetry();
        if (sessionError) {
          console.error('[Auth] Session error:', sessionError);
          if (mountedRef.current) setError(sessionError);
        }
        if (mountedRef.current) {
          // If session is missing, try to refresh session before logging out
          if (!session && supabase.auth && typeof supabase.auth.refreshSession === 'function') {
            try {
              const { data, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                console.warn('[Auth] Session refresh failed:', refreshError);
                setError(refreshError);
              }
              await handleAuthChange(data?.session || null);
            } catch (refreshErr) {
              console.error('[Auth] Session refresh threw:', refreshErr);
              setError(refreshErr as Error);
              await handleAuthChange(null);
            }
          } else {
            await handleAuthChange(session);
          }
        }
      } catch (err) {
        console.error('[Auth] Init auth error:', err);
        if (mountedRef.current) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mountedRef.current) {
        console.log('[Auth] Auth state change detected:', event);
        await handleAuthChange(session);
      }
    });

    // Listen for storage events (e.g., localStorage cleared)
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.includes('supabase')) {
        console.warn('[Auth] Storage event detected:', e);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [handleAuthChange]);

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
    if (mountedRef.current) {
      setProfile(updatedProfile as UserProfileRow | null);
    }
  };

  const updateCompany = async (updates: Partial<CompanyRow>) => {
    if (!profile?.company_id) return;
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', profile.company_id)
      .maybeSingle();
    if (error) throw error;
    if (mountedRef.current) {
      setCompany(data as CompanyRow | null);
    }
  };

  const refreshIntegrations = async () => {
    if (!supabaseUser) return;
    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', supabaseUser.id);
    if (error) throw error;
    if (mountedRef.current) {
      setIntegrations((data as UserIntegrationRow[]) || []);
    }
  };

  const completeOnboarding = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ onboarding_completed: true })
      .eq('id', profile.id)
      .maybeSingle();
    if (error) throw error;
    if (mountedRef.current) {
      setProfile(data as UserProfileRow | null);
    }
  };

  const user = useMemo((): AuthUser | null => {
    if (!supabaseUser || !profile) {
      return null;
    }
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      created_at: supabaseUser.created_at,
      last_sign_in_at: supabaseUser.last_sign_in_at,
      role: profile.role,
      department: profile.department,
      company_id: profile.company_id,
      onboardingCompleted: profile.onboarding_completed,
      profile,
      company,
      integrations,
      name: profile.display_name,
      full_name: profile.display_name,
      initials: profile.display_name?.split(' ').map(n => n[0]).join('') || '?',
      avatar_url: profile.avatar_url,
    };
  }, [supabaseUser, profile, company, integrations]);

  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    loading,
    error,
    integrations,
    activeOrgId: profile?.company_id || null,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updateCompany,
    refreshIntegrations,
    completeOnboarding,
  }), [
    user,
    session,
    loading,
    error,
    integrations,
    profile,
    refreshIntegrations,
    completeOnboarding
  ]);

  // Custom error UI for session expired
  if (error && error.message && error.message.toLowerCase().includes('session')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Session Expired</h2>
          <p className="text-muted-foreground mb-6">
            Your session has expired or could not be restored. Please log in again to continue.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider; 