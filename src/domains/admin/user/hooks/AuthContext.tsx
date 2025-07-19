import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/core/supabase';
import { backendConnector } from '@/core/backendConnector';
import { persistentAuthService } from '@/shared/services/persistentAuthService';
import type { Session, User as SupabaseUser, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/core/types/database.types';
import { logger } from '@/core/auth/logger';

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
  status: 'idle'|'loading'|'success'|'timeout'|'error';
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfileRow>) => Promise<void>;
  updateCompany: (updates: Partial<CompanyRow>) => Promise<void>;
  refreshIntegrations: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  retrySessionFetch: () => Promise<void>;
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
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'timeout'|'error'>('idle');
  const [initialized, setInitialized] = useState(false);
  
  // Refs for cleanup and state management
  const mountedRef = useRef(true);
  const initRef = useRef(false);
  const authListenerRef = useRef<any>(null);

  // Simple session fetch without retries
  const getSession = useCallback(async (): Promise<{ session: Session | null, error: any }> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return { session, error };
    } catch (err) {
      return { session: null, error: err };
    }
  }, []);

  // Handle auth state changes
  const handleAuthChange = useCallback(async (session: Session | null) => {
    if (!mountedRef.current) return;
    
    setSession(session);
    setSupabaseUser(session?.user ?? null);
    setError(null);
    setStatus('success');
    
    if (!session?.user) {
      setProfile(null);
      setCompany(null);
      setIntegrations([]);
    }
  }, []);

  // Initialize authentication
  const initializeAuth = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;
    
    console.log('[AuthContext] Starting authentication initialization');
    setLoading(true);
    setStatus('loading');
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn('[AuthContext] Authentication initialization timeout, forcing completion');
        setLoading(false);
        setInitialized(true);
        setStatus('timeout');
      }
    }, 5000); // 5 second timeout
    
    try {
      // Check if we're on a public page
    const currentPath = window.location.pathname;
    const publicRoutes = ['/', '/login', '/signup', '/reset-password', '/waitlist', '/marketing'];
      const isPublicPage = publicRoutes.some(route => currentPath.startsWith(route));
    
      // Only initialize persistent auth service on protected pages
      if (!isPublicPage) {
        await persistentAuthService.initialize();
    } else {
        console.log('[AuthContext] Skipping persistent auth initialization on public page');
    }

      // Get initial session
        const { session, error: sessionError } = await getSession();
        
        if (sessionError) {
          console.error('[AuthContext] Session error:', sessionError);
          setError(sessionError);
          setStatus('error');
        } else if (session) {
          await handleAuthChange(session);
        } else {
          console.log('[AuthContext] No session found, user is not authenticated');
          setStatus('success');
        }
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (mountedRef.current) {
          await handleAuthChange(session);
        }
      });
      
      authListenerRef.current = subscription;
      
    } catch (err) {
      console.error('[AuthContext] Initialization error:', err);
          setError(err as Error);
          setStatus('error');
      } finally {
      clearTimeout(timeoutId);
        if (mountedRef.current) {
          setLoading(false);
          setInitialized(true);
          console.log('[AuthContext] Authentication initialization complete');
        }
      }
  }, [getSession, handleAuthChange, loading]);

  // Initialize backend connector only when needed
  const initializeBackendConnector = useCallback(async () => {
    const currentPath = window.location.pathname;
    const publicRoutes = ['/', '/login', '/signup', '/reset-password', '/waitlist', '/marketing'];
    const isCurrentlyPublic = publicRoutes.some(route => currentPath.startsWith(route));
    
    if (!isCurrentlyPublic) {
      try {
        await backendConnector.initialize();
        logger.info('Backend connector initialized');
      } catch (error) {
        logger.error({ error }, 'Failed to initialize backend connector');
      }
    }
  }, []);

  // Main initialization effect
  useEffect(() => {
    initializeAuth();

    return () => {
      mountedRef.current = false;
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
      }
      persistentAuthService.destroy();
      backendConnector.destroy();
    };
  }, [initializeAuth]);

  // Initialize backend connector when auth is ready
  useEffect(() => {
    if (initialized && !loading) {
      initializeBackendConnector();
    }
  }, [initialized, loading, initializeBackendConnector]);

  // Fetch profile when session changes
  useEffect(() => {
    if (session && supabaseUser && !loading) {
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (error) {
            console.error('[AuthContext] Profile fetch error:', error);
          } else {
            setProfile(data as UserProfileRow | null);
          }
        } catch (err) {
          console.error('[AuthContext] Error during profile fetch:', err);
          setProfile(null);
        }
      };
      
      fetchProfile();
    } else if (!session) {
      setProfile(null);
    }
  }, [session, supabaseUser, loading]);

  // Fetch company and integrations when profile changes
  useEffect(() => {
    if (profile && supabaseUser && !loading) {
      const fetchData = async () => {
        try {
          // Fetch integrations
          const { data: integrationsData, error: integrationsError } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', supabaseUser.id);
          
          if (!integrationsError) {
            setIntegrations((integrationsData as UserIntegrationRow[]) || []);
          }
      
      // Fetch company if needed
      if (profile.company_id) {
            const { data: companyData, error: companyError } = await supabase
              .from('companies')
              .select('*')
              .eq('id', profile.company_id)
              .maybeSingle();
            
            if (!companyError) {
              setCompany(companyData as CompanyRow | null);
            }
      } else {
        setCompany(null);
      }
        } catch (err) {
          console.error('[AuthContext] Error fetching user data:', err);
        }
      };
      
      fetchData();
    } else {
      setIntegrations([]);
      setCompany(null);
    }
  }, [profile, supabaseUser, loading]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  };

  const signUp = async (email: string, password: string, metadata: Record<string, any> = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
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
        console.error('[AuthContext] Failed to create user profile on sign up:', profileError);
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
      }
      
      // Clear any cached data
      localStorage.removeItem('supabase.auth.token');
      
      // Redirect to login
      window.location.href = '/login';
    } catch (err) {
      console.error('Unexpected sign out error:', err);
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
      console.log('[AuthContext] Profile not found, creating new profile');
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: supabaseUser.id,
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) {
        console.error('[AuthContext] Failed to create profile:', createError);
        throw createError;
      }
      
      if (mountedRef.current) {
        setProfile(newProfile as UserProfileRow);
      }
      return;
    }
    
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
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId)
        .maybeSingle();
      companyData = data as CompanyRow | null;
      companyError = error;
    } else {
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
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({ 
            ...updates, 
            name: updates.name || 'Unnamed Company'
          })
          .select()
          .single();
        if (createError) throw createError;
        companyData = newCompany as CompanyRow | null;
        companyId = newCompany?.id;
      }
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ company_id: companyId })
        .eq('id', profile.id);
      if (profileError) throw profileError;
    }
    if (companyError) throw companyError;
    
    if (mountedRef.current) {
      setCompany(companyData);
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
    setIntegrations((data as UserIntegrationRow[]) || []);
  };

  const completeOnboarding = async () => {
    if (!profile) throw new Error('No profile found');
    await updateProfile({ onboarding_completed: true });
  };

  const retrySessionFetch = async () => {
    setLoading(true);
    setError(null);
    const { session, error } = await getSession();
    if (session) {
      await handleAuthChange(session);
    } else if (error) {
      setError(error);
    }
    setLoading(false);
  };

  // Memoized user object
  const user = useMemo(() => {
    if (!supabaseUser || !session) return null;
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profile?.display_name || supabaseUser.email?.split('@')[0] || 'User',
      full_name: profile?.display_name || null,
      initials: profile?.display_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                supabaseUser.email?.split('@')[0]?.substring(0, 2).toUpperCase() || 'U',
      avatar_url: supabaseUser.user_metadata?.avatar_url || null,
      created_at: supabaseUser.created_at,
      last_sign_in_at: supabaseUser.last_sign_in_at,
      role: profile?.role || null,
      department: profile?.department || null,
      company_id: profile?.company_id || null,
      company: company,
      integrations: integrations,
      onboardingCompleted: profile?.onboarding_completed || false,
      profile: profile,
    };
  }, [supabaseUser, session, profile, company, integrations]);

  const value = {
    user,
    integrations,
    session,
    loading,
    error,
    activeOrgId: null,
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
    retrySessionFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 