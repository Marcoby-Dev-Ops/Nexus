import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/core/supabase';
import type { Session, User as SupabaseUser, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/lib/core/database.types';
import { Button } from '@/components/ui/Button';
import { useLocation } from 'react-router-dom';

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
  initialized: boolean;
  timeoutWarning: boolean;
  status: 'idle'|'loading'|'success'|'timeout'|'error';
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

// Timeout constants for auth and profile fetch
const AUTH_CHANGE_TIMEOUT_MS = 60000; // 60 seconds
const PROFILE_FETCH_TIMEOUT_MS = 60000; // 60 seconds

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [integrations, setIntegrations] = useState<UserIntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle'|'loading'|'success'|'timeout'|'error'>('idle');
  const [initialized, setInitialized] = useState(false);
  
  // Refs for cleanup and preventing race conditions
  const mountedRef = useRef(true);
  const processingRef = useRef(false);

  const location = useLocation();
  const publicRoutes = ['/login', '/signup', '/password-reset'];
  const isPublic = publicRoutes.includes(location.pathname);

  // Helper: retry getSession up to 3 times
  const getSessionWithRetry = async (retries = 3, delayMs = 500): Promise<{ session: Session | null, error: any }> => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`[AuthContext] getSessionWithRetry: Attempt ${i + 1}`);
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[AuthContext] getSessionWithRetry: Result', { session, error });
        if (session || error) return { session, error };
      } catch (err) {
        console.error(`[AuthContext] getSessionWithRetry: Exception on attempt ${i + 1}`, err);
        if (i === retries - 1) return { session: null, error: err };
      }
      await new Promise(res => setTimeout(res, delayMs));
    }
    return { session: null, error: new Error('Session fetch failed after retries') };
  };

  const handleAuthChange = useCallback(async (session: Session | null) => {
    // Prevent multiple simultaneous auth changes
    if (!mountedRef.current || processingRef.current) {
      console.log('[AuthContext] handleAuthChange: Skipping due to unmounted or processingRef');
      return;
    }
    
    processingRef.current = true;
    setLoading(true);
    console.log('[AuthContext] handleAuthChange: session', session);
    
    // Set a timeout for this auth change
    const authChangeTimeout = setTimeout(() => {
      if (mountedRef.current && processingRef.current) {
        console.warn('[AuthContext] Auth change timeout - forcing completion');
        setLoading(false);
        processingRef.current = false;
      }
    }, AUTH_CHANGE_TIMEOUT_MS); // Increased to 60 seconds
    
    try {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      setError(null);
      
      if (session?.user) {
        let finalProfile: UserProfileRow | null = null;
        let companyData: CompanyRow | null = null;
        let integrationsData: UserIntegrationRow[] = [];
        try {
          console.log('[AuthContext] Fetching profile for user:', session.user.id);
          const timerId = `Profile fetch ${Date.now()}`;
          console.time(timerId);
          
          // First try to fetch just the profile without joins for speed
          console.log('[AuthContext] Querying user_profiles for id', session.user.id);
          const profilePromise = supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          console.log('[AuthContext] Querying user_integrations for user_id', session.user.id);
          const integrationsPromise = supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', session.user.id);

          console.log('[AuthContext] Profile and integrations queries sent');

          // Add timeout to prevent hanging - increased to 60 seconds
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database query timeout')), PROFILE_FETCH_TIMEOUT_MS);
          });

          console.log('[AuthContext] Awaiting profile and integrations results...');
          const [profileResult, integrationsResult] = await Promise.race([
            Promise.all([profilePromise, integrationsPromise]),
            timeoutPromise
          ]) as [any, any];

          console.timeEnd(timerId);
          console.log('[AuthContext] Profile query result:', profileResult);
          console.log('[AuthContext] Integrations query result:', integrationsResult);

          finalProfile = profileResult.data as UserProfileRow | null;
          integrationsData = integrationsResult.data || [];

          // If we have a profile with company_id, fetch the company separately
          if (finalProfile?.company_id) {
            console.log('[AuthContext] Fetching company data for company_id:', finalProfile.company_id);
            try {
              console.log('[AuthContext] Querying companies for id', finalProfile.company_id);
              const { data: company, error: cError } = await supabase
                .from('companies')
                .select('*')
                .eq('id', finalProfile.company_id)
                .maybeSingle();
              console.log('[AuthContext] Company query result:', { company, cError });
              companyData = company;
              if (cError) {
                console.warn('[AuthContext] Company fetch error:', cError);
              } else {
                console.log('[AuthContext] Company data fetched:', company);
              }
            } catch (companyErr) {
              console.warn('[AuthContext] Company fetch failed:', companyErr);
            }
          }

          // If no profile exists for a verified user, create one (but don't block on it)
          if (!finalProfile && session.user.email_confirmed_at) {
            console.log('[AuthContext] No profile found for verified user, creating one...');
            const displayName = session.user.user_metadata?.full_name || 
                               session.user.email?.split('@')[0] || 
                               'User';
            console.log('[AuthContext] Inserting new user_profiles row:', {
              id: session.user.id,
              display_name: displayName,
              first_name: session.user.user_metadata?.first_name || null,
              last_name: session.user.user_metadata?.last_name || null,
            });
            // Await the insert and re-fetch
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: session.user.id,
                display_name: displayName,
                first_name: session.user.user_metadata?.first_name || null,
                last_name: session.user.user_metadata?.last_name || null,
              })
              .select()
              .single();
            if (createError) {
              console.error('[AuthContext] Failed to create user profile:', createError);
            } else {
              console.log('[AuthContext] Created profile for verified user:', newProfile);
              finalProfile = newProfile as UserProfileRow;
            }
          } else if (!finalProfile && !session.user.email_confirmed_at) {
            console.log('[AuthContext] User email not verified yet, skipping profile creation');
          }
        } catch (err) {
          console.error('[AuthContext] Error during profile/integrations/company fetch:', err);
          if (err instanceof Error && err.message.includes('timeout')) {
            console.warn('[AuthContext] Profile fetch timed out, continuing without profile');
          }
          finalProfile = null;
          companyData = null;
          integrationsData = [];
        }
        // Only update state if still mounted
        if (mountedRef.current) {
          console.log('[AuthContext] Setting profile, company, integrations:', { finalProfile, companyData, integrationsData });
          setProfile(finalProfile);
          setCompany(companyData);
          setIntegrations(integrationsData);
        }
      } else {
        // No session - clear all data
        if (mountedRef.current) {
          console.log('[AuthContext] No session: clearing profile, company, integrations');
          setProfile(null);
          setCompany(null);
          setIntegrations([]);
          console.log('[AuthContext] No session: cleared profile, company, integrations');
        }
      }
    } catch (err) {
      console.error('[AuthContext] Outer error in handleAuthChange:', err);
      if (mountedRef.current) {
        setError(err as Error);
      }
    } finally {
      clearTimeout(authChangeTimeout);
      if (mountedRef.current) {
        setLoading(false);
        console.log('[AuthContext] setLoading(false)');
      }
      processingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (isPublic) return; // Don't do session polling on public routes
    mountedRef.current = true;
    console.log('[AuthContext] useEffect: mounted');
    
    // Set a maximum timeout for initialization
    const initTimeout = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn('[AuthContext] Initialization timeout - still trying');
        setTimeoutWarning(true); // Set warning, not error
        // Do NOT setError here
      }
    }, 60000); // 60 second timeout
    
    const initAuth = async () => {
      try {
        // Try to get session with retry
        const { session, error: sessionError } = await getSessionWithRetry();
        console.log('[AuthContext] initAuth: session', session, 'error', sessionError);
        
        if (sessionError) {
          console.error('[AuthContext] Session error:', sessionError);
          if (mountedRef.current) {
            setError(sessionError);
            setLoading(false); // Ensure loading is set to false on error
          }
          return;
        }
        
        if (mountedRef.current) {
          // If session is missing, try to refresh session before logging out
          if (!session && supabase.auth && typeof supabase.auth.refreshSession === 'function') {
            try {
              const { data, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                console.warn('[AuthContext] Session refresh failed:', refreshError);
                setError(refreshError);
                setLoading(false); // Ensure loading is set to false on refresh error
                return;
              }
              await handleAuthChange(data?.session || null);
            } catch (refreshErr) {
              console.error('[AuthContext] Session refresh threw:', refreshErr);
              setError(refreshErr as Error);
              setLoading(false); // Ensure loading is set to false on refresh error
              return;
            }
          } else {
            await handleAuthChange(session);
          }
        }
        // If we get here, initialization succeeded
        setTimeoutWarning(false); // Clear warning
        setError(null); // Clear any previous error
      } catch (err) {
        console.error('[AuthContext] Init auth error:', err);
        if (mountedRef.current) {
          setError(err as Error);
          setLoading(false); // Ensure loading is set to false on error
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false); // Final fallback to ensure loading is always set to false
        }
        clearTimeout(initTimeout); // Clear the timeout since we're done
      }
    };

    initAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mountedRef.current) {
        console.log('[AuthContext] Auth state change detected:', event, session);
        await handleAuthChange(session);
      }
    });

    // Listen for storage events (e.g., localStorage cleared)
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.includes('supabase')) {
        console.warn('[AuthContext] Storage event detected:', e);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
      clearTimeout(initTimeout);
      console.log('[AuthContext] useEffect: unmounted');
    };
  }, [handleAuthChange, loading, isPublic]);

  useEffect(() => {
    // If user and session are both present, clear loading and timeoutWarning immediately
    if (session && supabaseUser && loading) {
      setLoading(false);
      setTimeoutWarning(false);
    }
  }, [session, supabaseUser, loading]);

  // After all session/profile fetch logic (success, error, or timeout), set initialized to true
  useEffect(() => {
    if (!loading && (profile !== undefined || error || timeoutWarning)) {
      setInitialized(true);
    }
  }, [loading, profile, error, timeoutWarning]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { error };
    }

    // If user is returned, create a profile immediately
    const user = data?.user;
    if (user) {
      const userId = user.id;
      const userMeta = user.user_metadata || {};
      const firstName = userMeta.first_name || null;
      const lastName = userMeta.last_name || null;
      const displayName = userMeta.full_name || email.split('@')[0] || 'User';
      // Insert profile row
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          display_name: displayName,
          first_name: firstName,
          last_name: lastName,
          email: email,
        });
      if (profileError) {
        // Optionally log or handle profile creation error
        console.error('[AuthContext] Failed to create user profile on sign up:', profileError);
        // Still return success for sign up, but you may want to surface this error
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    try {
      // Clear local state immediately
      setSession(null);
      setSupabaseUser(null);
      setProfile(null);
      setCompany(null);
      setIntegrations([]);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        // Even if signOut fails, we've cleared local state
      }
      
      // Clear any cached data
      localStorage.removeItem('supabase.auth.token');
      
      // Redirect to login
      window.location.href = '/login';
    } catch (err) {
      console.error('Unexpected sign out error:', err);
      // Force redirect even on error
      window.location.href = '/login';
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ?? null };
  };

  const updateProfile = async (updates: Partial<UserProfileRow>) => {
    if (!supabaseUser) {
      throw new Error('No authenticated user found');
    }
    
    if (!profile) {
      throw new Error('User profile not found. Please verify your email address first.');
    }
    
    // Update the existing profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .maybeSingle();
      
    if (updateError) {
      console.error('[AuthContext] Failed to update profile:', updateError);
      throw updateError;
    }
    
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
    if (loading || timeoutWarning || authStatus === 'loading' || authStatus === 'timeout') return null;
    if (!supabaseUser) return null;
    
    // Create a basic user object even if profile is not loaded yet
    const displayName = profile?.display_name || 
                       (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : null) ||
                       supabaseUser.email?.split('@')[0] || 
                       'User';
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      created_at: supabaseUser.created_at,
      last_sign_in_at: supabaseUser.last_sign_in_at,
      role: profile?.role || null,
      department: profile?.department || null,
      company_id: profile?.company_id || null,
      onboardingCompleted: profile?.onboarding_completed || false,
      profile,
      company,
      integrations,
      name: displayName,
      full_name: displayName,
      initials: displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?',
      avatar_url: profile?.avatar_url || null,
    };
  }, [supabaseUser, profile, company, integrations, loading, timeoutWarning, authStatus]);

  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    loading,
    error,
    integrations,
    activeOrgId: profile?.company_id || null,
    initialized,
    timeoutWarning,
    status: authStatus,
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
    completeOnboarding,
    timeoutWarning,
    updateCompany,
    updateProfile,
    authStatus,
    initialized
  ]);

  // Custom error UI for session expired
  if (error && error.message && error.message.toLowerCase().includes('session')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-destructive mb-4">
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