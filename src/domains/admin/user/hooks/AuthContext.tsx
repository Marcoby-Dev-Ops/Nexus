import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/core/supabase';
import { backendConnector } from '@/core/backendConnector';
import type { Session, User as SupabaseUser, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/core/types/database.types';
import { Button } from '@/shared/components/ui/Button';
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
  retrySessionFetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Increased timeouts for better reliability
const AUTH_CHANGE_TIMEOUT_MS = 20000; // 20 seconds
const PROFILE_FETCH_TIMEOUT_MS = 25000; // 25 seconds
const SESSION_FETCH_TIMEOUT_MS = 20000; // 20 seconds
const SESSION_RETRY_DELAY_MS = 2000; // 2 seconds

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [integrations, setIntegrations] = useState<UserIntegrationRow[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'timeout'|'error'>('idle');
  const [initialized, setInitialized] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [isPublic] = useState(() => {
    // Check if we're on a public route
    const publicRoutes = ['/login', '/signup', '/reset-password', '/waitlist', '/marketing'];
    return publicRoutes.some(route => window.location.pathname.startsWith(route));
  });
  
  // Refs for cleanup and preventing race conditions
  const mountedRef = useRef(true);
  const processingRef = useRef(false);

  const location = useLocation();

  // Connection health check
  const checkConnectionHealth = async (): Promise<boolean> => {
    try {
      // Quick ping to Supabase to check connectivity
      const start = Date.now();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });
      const duration = Date.now() - start;
      console.log(`[AuthContext] Connection health check: ${response.ok ? 'OK' : 'Failed'} (${duration}ms)`);
      return response.ok && duration < 10000; // Consider healthy if response time < 10s
    } catch (err) {
      console.warn('[AuthContext] Connection health check failed:', err);
      return false;
    }
  };

    // Improved session fetching with better error handling and adaptive retries
  const getSessionWithRetry = async (retries = 3, delayMs = SESSION_RETRY_DELAY_MS): Promise<{ session: Session | null, error: any }> => {
    // Check backend connector health first
    if (!backendConnector.isSystemHealthy()) {
      console.warn('[AuthContext] Backend services unhealthy, will retry with longer timeout');
      delayMs = Math.min(delayMs * 2, 8000);
    }

    for (let i = 0; i < retries; i++) {
      try {
        console.log(`[AuthContext] getSessionWithRetry: Attempt ${i + 1}/${retries}`);
        
        // Check if we're online before attempting
        if (!navigator.onLine) {
          console.log('[AuthContext] Offline detected, skipping session fetch');
          return { session: null, error: new Error('Network offline') };
        }

        // Check connection health on first attempt
        if (i === 0) {
          const isHealthy = await checkConnectionHealth();
          if (!isHealthy) {
            console.warn('[AuthContext] Connection health check failed, will retry with longer timeout');
            // Increase timeout for unhealthy connections
            delayMs = Math.min(delayMs * 2, 8000);
          }
        }
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session fetch timeout')), SESSION_FETCH_TIMEOUT_MS);
        });

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        console.log('[AuthContext] getSessionWithRetry: Result', { 
          session: session ? 'present' : 'null', 
          error: error?.message || 'none',
          user: session?.user?.id || 'none'
        });
        
        // If we get a session, return immediately
        if (session) {
          return { session, error: null };
        }
        
        // If we get a clear error (not network-related), return it
        if (error && !error.message?.includes('network') && !error.message?.includes('fetch')) {
          return { session: null, error };
        }
        
        // If it's a network error and we have retries left, wait and try again
        if (i < retries - 1) {
          console.log(`[AuthContext] Network error, retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          // Increase delay for exponential backoff
          delayMs = Math.min(delayMs * 1.5, 5000);
        }
      } catch (err) {
        console.error(`[AuthContext] getSessionWithRetry: Exception on attempt ${i + 1}`, err);
        
        // If it's a timeout error, log it but don't treat it as fatal
        if (err instanceof Error && err.message.includes('timeout')) {
          console.warn(`[AuthContext] Session fetch timeout on attempt ${i + 1}, will retry`);
        }
        
        if (i === retries - 1) {
          // On final attempt, return timeout error but don't block the app
          if (err instanceof Error && err.message.includes('timeout')) {
            console.warn('[AuthContext] All session fetch attempts timed out, continuing without session');
            return { session: null, error: new Error('Session fetch timeout - continuing without session') };
          }
          return { session: null, error: err };
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs = Math.min(delayMs * 1.5, 5000);
      }
    }
    // If all retries failed, try one more time with a longer timeout
    console.warn('[AuthContext] All retries failed, attempting final fallback session fetch');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        console.log('[AuthContext] Fallback session fetch successful');
        return { session, error: null };
      }
      return { session: null, error: new Error('Session fetch failed after all attempts') };
    } catch (finalErr) {
      console.error('[AuthContext] Final fallback session fetch failed:', finalErr);
      return { session: null, error: new Error('Session fetch failed after all attempts') };
    }
  };

  const handleAuthChange = useCallback(async (session: Session | null) => {
    if (!mountedRef.current || processingRef.current) {
      console.log('[AuthContext] handleAuthChange: Skipping due to unmounted or processingRef');
      return;
    }
    processingRef.current = true;
    setLoading(true);
    setStatus('loading');
    console.log('[AuthContext] handleAuthChange: session', session);
    const authChangeTimeout = setTimeout(() => {
      if (mountedRef.current && processingRef.current) {
        console.warn('[AuthContext] Auth change timeout - forcing completion');
        setLoading(false);
        setStatus('timeout');
        setTimeoutWarning(true);
        processingRef.current = false;
      }
    }, AUTH_CHANGE_TIMEOUT_MS);
    try {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      setError(null);
      setStatus('success');
      // Do NOT fetch profile here
      if (!session?.user) {
        setProfile(null);
        setCompany(null);
        setIntegrations([]);
      }
    } catch (err) {
      console.error('[AuthContext] Outer error in handleAuthChange:', err);
      if (mountedRef.current) {
        setError(err as Error);
        setStatus('error');
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

  // Fetch profile only after session is set and loading is false
  useEffect(() => {
    if (session && !loading) {
      (async () => {
        try {
          const profileResult = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          setProfile(profileResult.data as UserProfileRow | null);
        } catch (err) {
          console.error('[AuthContext] Error during profile fetch:', err);
          setProfile(null);
        }
      })();
    } else if (!session) {
      setProfile(null);
    }
  }, [session, loading]);

  // Fetch company and integrations only after profile is set and loading is false
  useEffect(() => {
    if (profile && supabaseUser && !loading) {
      // Fetch integrations in background
      (async () => {
        setIntegrationsLoading(true);
        try {
          const { data, error } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', supabaseUser.id);
          if (!error) setIntegrations((data as UserIntegrationRow[]) || []);
        } finally {
          setIntegrationsLoading(false);
        }
      })();
      // Fetch company in background if needed
      if (profile.company_id) {
        (async () => {
          setCompanyLoading(true);
          try {
            const { data, error } = await supabase
              .from('companies')
              .select('*')
              .eq('id', profile.company_id)
              .maybeSingle();
            if (!error) setCompany(data as CompanyRow | null);
          } finally {
            setCompanyLoading(false);
          }
        })();
      } else {
        setCompany(null);
      }
    } else {
      setIntegrations([]);
      setCompany(null);
    }
  }, [profile, supabaseUser, loading]);

  useEffect(() => {
    if (isPublic) return; // Don't do session polling on public routes
    mountedRef.current = true;
    console.log('[AuthContext] useEffect: mounted');
    
    // Add network status listener for debugging
    const handleOnline = () => {
      console.log('[AuthContext] Network came online');
      if (mountedRef.current && !session && !loading) {
        console.log('[AuthContext] Retrying session fetch after network recovery');
        // Optionally retry session fetch when network comes back
      }
    };
    
    const handleOffline = () => {
      console.log('[AuthContext] Network went offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set a maximum timeout for initialization
    const initTimeout = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn('[AuthContext] Initialization timeout - still trying');
        setTimeoutWarning(true); // Set warning, not error
      }
    }, 30000); // 30 second timeout
    
    const initAuth = async () => {
      try {
        console.log('[AuthContext] initAuth: Starting authentication initialization');
        
        // Try to get session with retry
        const { session, error: sessionError } = await getSessionWithRetry();
        console.log('[AuthContext] initAuth: session result', { 
          hasSession: !!session, 
          error: sessionError?.message || 'none' 
        });
        
        if (sessionError) {
          console.error('[AuthContext] Session error:', sessionError);
          
          // Handle different types of errors
          if (sessionError.message?.includes('network') || 
              sessionError.message?.includes('timeout') ||
              sessionError.message?.includes('offline') ||
              sessionError.message?.includes('fetch') ||
              sessionError.message?.includes('continuing without session')) {
            // Network-related errors or timeouts - treat as success (no session) but log for debugging
            console.log('[AuthContext] Network-related session error or timeout, continuing without session');
            setStatus('success');
            setSession(null);
            setSupabaseUser(null);
            // Don't set error for timeouts, just continue
          } else {
            // Other errors - set as error state
            setError(sessionError);
            setStatus('error');
          }
        } else if (session) {
          // Handle the session change
          await handleAuthChange(session);
        } else {
          // No session and no error - this is normal for unauthenticated users
          console.log('[AuthContext] No session found, user is not authenticated');
          setStatus('success');
          setSession(null);
          setSupabaseUser(null);
        }
      } catch (err) {
        console.error('[AuthContext] initAuth error:', err);
        if (mountedRef.current) {
          setError(err as Error);
          setStatus('error');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setInitialized(true);
          console.log('[AuthContext] setLoading(false) - init complete');
        }
        clearTimeout(initTimeout);
      }
    };

    initAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state change detected:', event, session);
      if (mountedRef.current) {
        await handleAuthChange(session);
      }
    });

    return () => {
      console.log('[AuthContext] useEffect: unmounted');
      mountedRef.current = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleAuthChange, isPublic]);

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
        })
        .select()
        .single();
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
    if (!profile) throw new Error('User profile not found. Please verify your email address first.');
    let companyId = profile.company_id;
    let companyData: CompanyRow | null = null;
    let companyError: PostgrestError | null = null;

    if (companyId) {
      // Update existing company
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId)
        .maybeSingle();
      companyData = data as CompanyRow | null;
      companyError = error;
    } else {
      // Try to find an existing company by domain (if provided)
      let existingCompany: CompanyRow | null = null;
      if (updates.domain) {
        const { data: foundCompany, error: findError } = await supabase
          .from('companies')
          .select('*')
          .eq('domain', updates.domain)
          .maybeSingle();
        if (findError && findError.code !== 'PGRST116') throw findError;
        if (foundCompany) {
          existingCompany = foundCompany as CompanyRow;
        }
      }
      if (existingCompany) {
        companyData = existingCompany;
        companyId = existingCompany.id;
      } else {
        // Create new company
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({ ...updates, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .select()
          .single();
        if (createError) throw createError;
        companyData = newCompany as CompanyRow | null;
        companyId = newCompany?.id;
      }
      // Link user to the found or created company
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ company_id: companyId })
        .eq('id', profile.id);
      if (profileError) throw profileError;
    }
    if (companyError) throw companyError;
    // Refresh company and profile state
    if (mountedRef.current) {
      setCompany(companyData);
      // Fetch updated profile
      const { data: updatedProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', profile.id)
        .maybeSingle();
      setProfile(updatedProfile as UserProfileRow | null);
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

  const retrySessionFetch = async () => {
    console.log('[AuthContext] retrySessionFetch: Manual retry requested');
    setLoading(true);
    setError(null);
    setStatus('loading');
    
    try {
      const { session, error: sessionError } = await getSessionWithRetry();
      
      if (sessionError) {
        console.error('[AuthContext] retrySessionFetch: Error', sessionError);
        setError(sessionError);
        setStatus('error');
      } else if (session) {
        console.log('[AuthContext] retrySessionFetch: Session found, updating auth state');
        await handleAuthChange(session);
      } else {
        console.log('[AuthContext] retrySessionFetch: No session found');
        setStatus('success');
        setSession(null);
        setSupabaseUser(null);
      }
    } catch (err) {
      console.error('[AuthContext] retrySessionFetch: Exception', err);
      setError(err as Error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const user = useMemo((): AuthUser | null => {
    if (loading || timeoutWarning || status === 'loading' || status === 'timeout') return null;
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
  }, [supabaseUser, profile, company, integrations, loading, timeoutWarning, status]);

  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    loading,
    error,
    integrations,
    activeOrgId: profile?.company_id || null,
    initialized,
    timeoutWarning,
    status,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updateCompany,
    refreshIntegrations,
    completeOnboarding,
    retrySessionFetch,
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
    status,
    initialized,
    retrySessionFetch
  ]);

  // Temporarily disabled session expired modal to prevent navigation blocking
  // TODO: Re-enable with proper error filtering once authentication is stable
  /*
  if (error && 
      error.message && 
      error.message.toLowerCase().includes('session') && 
      !error.message.toLowerCase().includes('network') &&
      !error.message.toLowerCase().includes('timeout') &&
      !error.message.toLowerCase().includes('fetch failed')) {
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
  */

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