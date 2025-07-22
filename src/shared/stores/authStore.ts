import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';
import { supabase } from '@/core/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/core/types/database.types';

// Extract the correct types from the Database type
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type CompanyRow = Database['public']['Tables']['companies']['Row'];
type UserIntegrationRow = Database['public']['Tables']['user_integrations']['Row'];

interface AuthState {
  // Core authentication state
  session: Session | null;
  user: User | null;
  profile: UserProfileRow | null;
  company: CompanyRow | null;
  integrations: UserIntegrationRow[];
  
  // Loading and error states
  loading: boolean;
  error: Error | null;
  initialized: boolean;
  status: 'idle' | 'loading' | 'success' | 'error' | 'timeout';
  
  // Enhanced state tracking
  lastActivity: number;
  sessionExpiry: number | null;
  refreshAttempts: number;
  maxRefreshAttempts: number;
  
  // Simple computed values
  isAuthenticated: boolean;
  isSessionValid: boolean;
  isSessionExpiring: boolean;
  
  // Actions
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfileRow | null) => void;
  setCompany: (company: CompanyRow | null) => void;
  setIntegrations: (integrations: UserIntegrationRow[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setInitialized: (initialized: boolean) => void;
  setStatus: (status: 'idle' | 'loading' | 'success' | 'error' | 'timeout') => void;
  setLastActivity: (timestamp: number) => void;
  setSessionExpiry: (expiry: number | null) => void;
  incrementRefreshAttempts: () => void;
  resetRefreshAttempts: () => void;
  
  // Authentication actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  
  // Data fetching actions
  fetchProfile: (userId: string) => Promise<void>;
  fetchIntegrations: (userId: string, forceRefresh?: boolean) => Promise<void>;
  fetchCompany: (companyId: string) => Promise<void>;
  
  // Profile management
  updateProfile: (updates: Partial<UserProfileRow>) => Promise<void>;
  updateCompany: (updates: Partial<CompanyRow>) => Promise<void>;
  
  // Utility actions
  refreshSession: () => Promise<void>;
  clearAuth: () => void;
  validateSession: () => Promise<boolean>;
  retrySessionFetch: () => Promise<void>;
  
  // Simple validation
  isValid: () => boolean;
  
  // Session management
  checkSessionHealth: () => Promise<{
    isValid: boolean;
    isExpiring: boolean;
    timeUntilExpiry: number;
    needsRefresh: boolean;
  }>;
}

// Enhanced logging utility
const logAuth = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logData = data ? ` | Data: ${JSON.stringify(data)}` : '';
  console.log(`[AuthStore:${timestamp}] ${level.toUpperCase()}: ${message}${logData}`);
};

// Session validation utilities
const isSessionExpiring = (session: Session | null, thresholdMinutes = 10): boolean => {
  if (!session?.expires_at) return false;
  const expiryTime = new Date(session.expires_at).getTime();
  const thresholdMs = thresholdMinutes * 60 * 1000;
  return Date.now() + thresholdMs >= expiryTime;
};

const getTimeUntilExpiry = (session: Session | null): number => {
  if (!session?.expires_at) return 0;
  return new Date(session.expires_at).getTime() - Date.now();
};

export const useAuthStore = create<AuthState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // Initial state
          session: null,
          user: null,
          profile: null,
          company: null,
          integrations: [],
          loading: true,
          error: null,
          initialized: false,
          status: 'idle',
          isAuthenticated: false,
          isSessionValid: false,
          isSessionExpiring: false,
          lastActivity: Date.now(),
          sessionExpiry: null,
          refreshAttempts: 0,
          maxRefreshAttempts: 3,
          
          // State setters with enhanced logging
                      setSession: (session) => {
              const isAuthenticated = !!(session && session.user);
              const isSessionValid = !!(session && session.access_token);
              const isExpiring = isSessionExpiring(session, 10);
              const sessionExpiry = session?.expires_at ? new Date(session.expires_at).getTime() : null;
            
            logAuth('info', 'Setting session', {
              hasSession: !!session,
              userId: session?.user?.id,
              isAuthenticated,
              isSessionValid,
              isSessionExpiring,
              expiresAt: session?.expires_at
            });
            
                          set({ 
                session,
                user: session?.user ?? null,
                isAuthenticated,
                isSessionValid,
                isSessionExpiring: isExpiring,
                sessionExpiry,
                lastActivity: Date.now()
              });
          },
          
          setUser: (user) => {
            const state = get();
            const isAuthenticated = !!(state.session && user);
            
            logAuth('info', 'Setting user', {
              hasUser: !!user,
              userId: user?.id,
              isAuthenticated
            });
            
            set({ 
              user,
              isAuthenticated,
              lastActivity: Date.now()
            });
          },
          
          setProfile: (profile) => {
            logAuth('info', 'Setting profile', { hasProfile: !!profile, profileId: profile?.id });
            set({ profile, lastActivity: Date.now() });
          },
          
          setCompany: (company) => {
            logAuth('info', 'Setting company', { hasCompany: !!company, companyId: company?.id });
            set({ company, lastActivity: Date.now() });
          },
          
          setIntegrations: (integrations) => {
            logAuth('info', 'Setting integrations', { count: integrations.length });
            set({ integrations, lastActivity: Date.now() });
          },
          
          setLoading: (loading) => {
            logAuth('info', 'Setting loading', { loading });
            set({ loading });
          },
          
          setError: (error) => {
            logAuth('error', 'Setting error', { error: error?.message });
            set({ error, status: error ? 'error' : 'idle' });
          },
          
          setInitialized: (initialized) => {
            logAuth('info', 'Setting initialized', { initialized });
            set({ initialized });
          },
          
          setStatus: (status) => {
            logAuth('info', 'Setting status', { status });
            set({ status });
          },
          
          setLastActivity: (timestamp) => set({ lastActivity: timestamp }),
          setSessionExpiry: (expiry) => set({ sessionExpiry: expiry }),
          
          incrementRefreshAttempts: () => {
            const state = get();
            const newAttempts = state.refreshAttempts + 1;
            logAuth('warn', 'Incrementing refresh attempts', { attempts: newAttempts, max: state.maxRefreshAttempts });
            set({ refreshAttempts: newAttempts });
          },
          
          resetRefreshAttempts: () => {
            logAuth('info', 'Resetting refresh attempts');
            set({ refreshAttempts: 0 });
          },
          
          // Enhanced authentication actions
          signIn: async (email, password) => {
            try {
              logAuth('info', 'Signing in', { email });
              set({ loading: true, error: null, status: 'loading' });
              
              const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              
              if (error) {
                logAuth('error', 'Sign in failed', { error: error.message });
                set({ error: error as Error, status: 'error', loading: false });
                return { success: false, error: error.message };
              }
              
              if (data.session && data.user) {
                logAuth('info', 'Sign in successful', { userId: data.user.id });
                set({ 
                  session: data.session, 
                  user: data.user, 
                  status: 'success', 
                  loading: false,
                  lastActivity: Date.now()
                });
                
                // Fetch user data asynchronously
                get().fetchProfile(data.user.id).catch(error => {
                  logAuth('error', 'Error fetching profile after sign in', { error: error.message });
                });
                get().fetchIntegrations(data.user.id).catch(error => {
                  logAuth('error', 'Error fetching integrations after sign in', { error: error.message });
                });
                
                return { success: true };
              }
              
              set({ status: 'error', loading: false });
              return { success: false, error: 'Sign in failed' };
            } catch (error) {
              const err = error as Error;
              logAuth('error', 'Sign in exception', { error: err.message });
              set({ error: err, status: 'error', loading: false });
              return { success: false, error: err.message };
            }
          },
          
          signUp: async (email, password) => {
            try {
              logAuth('info', 'Signing up', { email });
              set({ loading: true, error: null, status: 'loading' });
              
              const { data, error } = await supabase.auth.signUp({
                email,
                password,
              });
              
              if (error) {
                logAuth('error', 'Sign up failed', { error: error.message });
                set({ error: error as Error, status: 'error', loading: false });
                return { success: false, error: error.message };
              }
              
              if (data.session && data.user) {
                logAuth('info', 'Sign up successful', { userId: data.user.id });
                set({ 
                  session: data.session, 
                  user: data.user, 
                  status: 'success', 
                  loading: false,
                  lastActivity: Date.now()
                });
                
                return { success: true };
              }
              
              set({ status: 'error', loading: false });
              return { success: false, error: 'Sign up failed' };
            } catch (error) {
              const err = error as Error;
              logAuth('error', 'Sign up exception', { error: err.message });
              set({ error: err, status: 'error', loading: false });
              return { success: false, error: err.message };
            }
          },
          
          signOut: async () => {
            try {
              logAuth('info', 'Signing out from store');
              set({ loading: true, error: null, status: 'loading' });
              
              // Clear all state immediately
              set({ 
                session: null,
                user: null,
                profile: null,
                company: null,
                integrations: [],
                isAuthenticated: false,
                isSessionValid: false,
                isSessionExpiring: false,
                sessionExpiry: null,
                refreshAttempts: 0,
                lastActivity: Date.now(),
                status: 'success',
                loading: false
              });
              
              // Call Supabase sign out
              const { error } = await supabase.auth.signOut();
              
              if (error) {
                logAuth('error', 'Supabase sign out failed', { error: error.message });
                return { success: false, error: error.message };
              }
              
              logAuth('info', 'Store sign out successful');
              return { success: true };
            } catch (error) {
              const err = error as Error;
              logAuth('error', 'Store sign out exception', { error: err.message });
              set({ error: err, status: 'error', loading: false });
              return { success: false, error: err.message };
            }
          },
          
          resetPassword: async (email) => {
            try {
              logAuth('info', 'Resetting password', { email });
              set({ loading: true, error: null, status: 'loading' });
              
              const { error } = await supabase.auth.resetPasswordForEmail(email);
              
              if (error) {
                logAuth('error', 'Password reset failed', { error: error.message });
                set({ error: error as Error, status: 'error', loading: false });
                return { success: false, error: error.message };
              }
              
              logAuth('info', 'Password reset email sent');
              set({ status: 'success', loading: false });
              return { success: true };
            } catch (error) {
              const err = error as Error;
              logAuth('error', 'Password reset exception', { error: err.message });
              set({ error: err, status: 'error', loading: false });
              return { success: false, error: err.message };
            }
          },
          
          // Enhanced data fetching with retry logic
          fetchProfile: async (userId) => {
            try {
              const state = get();
              if (state.profile && state.profile.id === userId) {
                logAuth('info', 'Profile already loaded, skipping fetch');
                return;
              }
              
              logAuth('info', 'Fetching profile', { userId });
              
              const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();
              
              if (error) {
                if (error.code === 'PGRST116') {
                  // Profile not found, create new one
                  logAuth('info', 'Profile not found, creating new profile', { userId });
                  
                  const newProfile = {
                    id: userId,
                    full_name: state.user?.user_metadata?.full_name || null,
                    avatar_url: state.user?.user_metadata?.avatar_url || null,
                    role: 'user',
                    department: null,
                    company_id: null,
                    onboarding_completed: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };
                  
                  const { data: createdProfile, error: createError } = await supabase
                    .from('user_profiles')
                    .insert(newProfile)
                    .select()
                    .single();
                  
                  if (createError) {
                    logAuth('error', 'Failed to create profile', { error: createError.message });
                    throw createError;
                  }
                  
                  logAuth('info', 'Created new profile', { profileId: createdProfile.id });
                  set({ profile: createdProfile, lastActivity: Date.now() });
                } else {
                  logAuth('error', 'Failed to fetch profile', { error: error.message });
                  throw error;
                }
              } else {
                logAuth('info', 'Found existing profile', { profileId: data.id });
                set({ profile: data, lastActivity: Date.now() });
              }
            } catch (error) {
              logAuth('error', 'Profile fetch error', { error: (error as Error).message });
              throw error;
            }
          },
          
          fetchIntegrations: async (userId, forceRefresh = false) => {
            try {
              const state = get();
              if (state.integrations.length > 0 && !forceRefresh) {
                logAuth('info', 'Integrations already loaded, skipping fetch');
                return;
              }
              
              logAuth('info', 'Fetching integrations', { userId, forceRefresh });
              
              const { data, error } = await supabase
                .from('user_integrations')
                .select('*')
                .eq('user_id', userId);
              
              if (error) {
                logAuth('error', 'Failed to fetch integrations', { error: error.message });
                throw error;
              }
              
              logAuth('info', 'Successfully fetched integrations', { count: data?.length || 0 });
              set({ integrations: data || [], lastActivity: Date.now() });
            } catch (error) {
              logAuth('error', 'Integrations fetch error', { error: (error as Error).message });
              throw error;
            }
          },
          
          fetchCompany: async (companyId) => {
            try {
              logAuth('info', 'Fetching company', { companyId });
              
              const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('id', companyId)
                .single();
              
              if (error) {
                logAuth('error', 'Failed to fetch company', { error: error.message });
                throw error;
              }
              
              logAuth('info', 'Successfully fetched company', { companyId: data.id });
              set({ company: data, lastActivity: Date.now() });
            } catch (error) {
              logAuth('error', 'Company fetch error', { error: (error as Error).message });
              throw error;
            }
          },
          
          updateProfile: async (updates) => {
            try {
              const state = get();
              if (!state.user?.id) {
                throw new Error('No user ID available for profile update');
              }
              
              logAuth('info', 'Updating profile', { updates });
              
              const { data, error } = await supabase
                .from('user_profiles')
                .update({
                  ...updates,
                  updated_at: new Date().toISOString()
                })
                .eq('id', state.user.id)
                .select()
                .single();
              
              if (error) {
                logAuth('error', 'Failed to update profile', { error: error.message });
                throw error;
              }
              
              logAuth('info', 'Profile updated successfully');
              set({ profile: data, lastActivity: Date.now() });
            } catch (error) {
              logAuth('error', 'Profile update error', { error: (error as Error).message });
              throw error;
            }
          },
          
          updateCompany: async (updates) => {
            try {
              const state = get();
              if (!state.company?.id) {
                throw new Error('No company ID available for company update');
              }
              
              logAuth('info', 'Updating company', { updates });
              
              const { data, error } = await supabase
                .from('companies')
                .update({
                  ...updates,
                  updated_at: new Date().toISOString()
                })
                .eq('id', state.company.id)
                .select()
                .single();
              
              if (error) {
                logAuth('error', 'Failed to update company', { error: error.message });
                throw error;
              }
              
              logAuth('info', 'Company updated successfully');
              set({ company: data, lastActivity: Date.now() });
            } catch (error) {
              logAuth('error', 'Company update error', { error: (error as Error).message });
              throw error;
            }
          },
          
          refreshSession: async () => {
            try {
              const state = get();
              if (!state.session) {
                logAuth('warn', 'No session to refresh');
                return;
              }
              
              if (state.refreshAttempts >= state.maxRefreshAttempts) {
                logAuth('error', 'Max refresh attempts reached, signing out');
                await get().signOut();
                return;
              }
              
              logAuth('info', 'Refreshing session', { attempts: state.refreshAttempts + 1 });
              get().incrementRefreshAttempts();
              
              const { data, error } = await supabase.auth.refreshSession();
              
              if (error) {
                logAuth('error', 'Session refresh failed', { error: error.message });
                throw error;
              }
              
              if (data.session) {
                logAuth('info', 'Session refreshed successfully');
                set({ 
                  session: data.session,
                  user: data.user,
                  isAuthenticated: true,
                  isSessionValid: true,
                  isSessionExpiring: isSessionExpiring(data.session, 10),
                  sessionExpiry: data.session.expires_at ? new Date(data.session.expires_at).getTime() : null,
                  refreshAttempts: 0,
                  lastActivity: Date.now()
                });
              } else {
                logAuth('warn', 'No session returned from refresh');
                throw new Error('No session returned from refresh');
              }
            } catch (error) {
              logAuth('error', 'Session refresh error', { error: (error as Error).message });
              throw error;
            }
          },
          
          clearAuth: () => {
            logAuth('info', 'Clearing auth state');
            set({
              session: null,
              user: null,
              profile: null,
              company: null,
              integrations: [],
              isAuthenticated: false,
              isSessionValid: false,
              isSessionExpiring: false,
              sessionExpiry: null,
              refreshAttempts: 0,
              error: null,
              status: 'idle',
              loading: false
            });
          },
          
          validateSession: async () => {
            try {
              const state = get();
              if (!state.session) {
                logAuth('warn', 'No session to validate');
                return false;
              }
              
              const timeUntilExpiry = getTimeUntilExpiry(state.session);
              const isValid = timeUntilExpiry > 0;
              
              logAuth('info', 'Session validation', {
                isValid,
                timeUntilExpiry,
                isExpiring: isSessionExpiring(state.session, 10)
              });
              
              return isValid;
            } catch (error) {
              logAuth('error', 'Session validation error', { error: (error as Error).message });
              return false;
            }
          },
          
          retrySessionFetch: async () => {
            try {
              logAuth('info', 'Retrying session fetch');
              set({ loading: true, error: null, status: 'loading' });
              
              const { data: { session }, error } = await supabase.auth.getSession();
              
              if (error) {
                logAuth('error', 'Session fetch failed', { error: error.message });
                set({ error: error as Error, status: 'error', loading: false });
                return;
              }
              
              if (session) {
                logAuth('info', 'Session fetch successful', { userId: session.user.id });
                set({ 
                  session,
                  user: session.user,
                  isAuthenticated: true,
                  isSessionValid: true,
                  isSessionExpiring: isSessionExpiring(session, 10),
                  sessionExpiry: session.expires_at ? new Date(session.expires_at).getTime() : null,
                  status: 'success',
                  loading: false,
                  lastActivity: Date.now()
                });
                
                // Fetch user data
                get().fetchProfile(session.user.id).catch(error => {
                  logAuth('error', 'Error fetching profile after session fetch', { error: error.message });
                });
                get().fetchIntegrations(session.user.id).catch(error => {
                  logAuth('error', 'Error fetching integrations after session fetch', { error: error.message });
                });
              } else {
                logAuth('info', 'No session found');
                set({ 
                  session: null,
                  user: null,
                  isAuthenticated: false,
                  isSessionValid: false,
                  isSessionExpiring: false,
                  sessionExpiry: null,
                  status: 'idle',
                  loading: false
                });
              }
            } catch (error) {
              logAuth('error', 'Session fetch retry error', { error: (error as Error).message });
              set({ error: error as Error, status: 'error', loading: false });
            }
          },
          
          isValid: () => {
            const state = get();
            return !!(state.session && state.user && state.profile);
          },
          
          checkSessionHealth: async () => {
            const state = get();
            if (!state.session) {
              return {
                isValid: false,
                isExpiring: false,
                timeUntilExpiry: 0,
                needsRefresh: false
              };
            }
            
            const timeUntilExpiry = getTimeUntilExpiry(state.session);
            const isValid = timeUntilExpiry > 0;
            const isExpiring = isSessionExpiring(state.session, 10);
            const needsRefresh = isExpiring && state.refreshAttempts < state.maxRefreshAttempts;
            
            logAuth('info', 'Session health check', {
              isValid,
              isExpiring,
              timeUntilExpiry,
              needsRefresh,
              refreshAttempts: state.refreshAttempts
            });
            
            return {
              isValid,
              isExpiring,
              timeUntilExpiry,
              needsRefresh
            };
          }
        }),
        {
          name: 'nexus-auth-store',
          partialize: (state) => ({
            session: state.session,
            user: state.user,
            profile: state.profile,
            company: state.company,
            integrations: state.integrations,
            lastActivity: state.lastActivity,
            sessionExpiry: state.sessionExpiry
          })
        }
      )
    )
  )
);

// Enhanced session management utilities
const getCachedSession = async (): Promise<Session | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      logAuth('error', 'Failed to get cached session', { error: error.message });
      return null;
    }
    return session;
  } catch (error) {
    logAuth('error', 'Exception getting cached session', { error: (error as Error).message });
    return null;
  }
};

const clearSessionCache = (): void => {
  try {
    localStorage.removeItem('nexus-auth-store');
    logAuth('info', 'Session cache cleared');
  } catch (error) {
    logAuth('error', 'Failed to clear session cache', { error: (error as Error).message });
  }
};

// Enhanced initialization with comprehensive error handling
export const initializeAuth = () => {
  logAuth('info', 'Initializing auth system');
  
  // Prevent multiple initializations
  if ((window as any).__authStoreInitialized) {
    logAuth('info', 'Auth store already initialized, skipping');
    return;
  }
  
  (window as any).__authStoreInitialized = true;
  
  // Set up comprehensive auth state change listener
  supabase.auth.onAuthStateChange(async (event, session) => {
    logAuth('info', 'Auth state change', { event, hasSession: !!session });
    
    if (session) {
      logAuth('info', 'Session details', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at
      });
    }
    
    // Clear cache when auth state changes
    clearSessionCache();
    
    const store = useAuthStore.getState();
    
    switch (event) {
      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
        if (session) {
          logAuth('info', 'Setting session and user', { email: session.user.email });
          store.setSession(session);
          store.setUser(session.user);
          store.setInitialized(true);
          store.setLoading(false);
          store.resetRefreshAttempts();
          
          // Fetch user data asynchronously
          try {
            logAuth('info', 'Fetching user data for', { userId: session.user.id });
            if (session.user.id) {
              await store.fetchProfile(session.user.id);
              await store.fetchIntegrations(session.user.id);
            }
          } catch (error) {
            logAuth('error', 'Error fetching user data', { error: (error as Error).message });
          }
        }
        break;
        
      case 'SIGNED_OUT':
        logAuth('info', 'User signed out, clearing auth');
        store.clearAuth();
        store.setInitialized(true);
        store.setLoading(false);
        break;
        
      case 'INITIAL_SESSION':
        logAuth('info', 'Initial session event', { hasSession: !!session });
        if (session) {
          logAuth('info', 'Setting initial session from event', { email: session.user.email });
          store.setSession(session);
          store.setUser(session.user);
          store.setInitialized(true);
          store.setLoading(false);
          store.resetRefreshAttempts();
          
          // Fetch user data asynchronously
          (async () => {
            try {
              logAuth('info', 'Fetching user data for initial session', { userId: session.user.id });
              if (session.user.id) {
                await store.fetchProfile(session.user.id);
                await store.fetchIntegrations(session.user.id);
              }
            } catch (error) {
              logAuth('error', 'Error fetching user data for initial session', { error: (error as Error).message });
            }
          })();
        } else {
          logAuth('info', 'No initial session, setting initialized to true');
          store.setInitialized(true);
          store.setLoading(false);
        }
        break;
    }
  });
  
  // Get initial session with enhanced error handling
  logAuth('info', 'Getting initial session');
  
  // Add timeout to prevent hanging
  const timeoutId = setTimeout(() => {
    logAuth('warn', 'Session retrieval timeout, setting initialized to true');
    const store = useAuthStore.getState();
    store.setInitialized(true);
    store.setLoading(false);
  }, 30000);
  
  // Enhanced session retrieval with retry logic
  const attemptSessionRetrieval = async (attempt = 1, maxAttempts = 3) => {
    try {
      const session = await getCachedSession();
      
      clearTimeout(timeoutId);
      logAuth('info', 'Initial session result', { hasSession: !!session });
      
      if (session) {
        logAuth('info', 'Session from getSession', {
          userId: session.user.id,
          email: session.user.email,
          expiresAt: session.expires_at
        });
      }
      
      const store = useAuthStore.getState();
      
      if (session) {
        logAuth('info', 'Setting initial session from getSession', { email: session.user.email });
        store.setSession(session);
        store.setUser(session.user);
        store.resetRefreshAttempts();
        
        // Fetch user data asynchronously
        (async () => {
          try {
            logAuth('info', 'Fetching user data for initial session', { userId: session.user.id });
            if (session.user.id) {
              await store.fetchProfile(session.user.id);
              await store.fetchIntegrations(session.user.id);
            }
          } catch (error) {
            logAuth('error', 'Error fetching user data for initial session', { error: (error as Error).message });
          }
        })();
      } else {
        logAuth('info', 'No initial session found');
      }
      
      logAuth('info', 'Setting initialized to true');
      store.setInitialized(true);
      store.setLoading(false);
    } catch (error) {
      logAuth('error', 'Error in session retrieval attempt', { attempt, error: (error as Error).message });
      if (attempt < maxAttempts) {
        logAuth('info', 'Retrying session retrieval in 2 seconds');
        setTimeout(() => attemptSessionRetrieval(attempt + 1, maxAttempts), 2000);
      } else {
        clearTimeout(timeoutId);
        const store = useAuthStore.getState();
        store.setError(error as Error);
        store.setInitialized(true);
        store.setLoading(false);
      }
    }
  };

  attemptSessionRetrieval();
};

// Export utilities
export const getSessionWithCache = getCachedSession;
export const clearSessionCacheExport = clearSessionCache;

// Enhanced selectors with better performance
export const useAuthState = () => {
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const company = useAuthStore((state) => state.company);
  const integrations = useAuthStore((state) => state.integrations);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const initialized = useAuthStore((state) => state.initialized);
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSessionValid = useAuthStore((state) => state.isSessionValid);
  const isSessionExpiring = useAuthStore((state) => state.isSessionExpiring);
  const lastActivity = useAuthStore((state) => state.lastActivity);
  const sessionExpiry = useAuthStore((state) => state.sessionExpiry);
  const refreshAttempts = useAuthStore((state) => state.refreshAttempts);
  
  return {
    session,
    user,
    profile,
    company,
    integrations,
    loading,
    error,
    initialized,
    status,
    isAuthenticated,
    isSessionValid,
    isSessionExpiring,
    lastActivity,
    sessionExpiry,
    refreshAttempts
  };
};

export const useAuthActions = () => {
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const signOut = useAuthStore((state) => state.signOut);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const fetchIntegrations = useAuthStore((state) => state.fetchIntegrations);
  const fetchCompany = useAuthStore((state) => state.fetchCompany);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const updateCompany = useAuthStore((state) => state.updateCompany);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const validateSession = useAuthStore((state) => state.validateSession);
  const retrySessionFetch = useAuthStore((state) => state.retrySessionFetch);
  const checkSessionHealth = useAuthStore((state) => state.checkSessionHealth);
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setCompany = useAuthStore((state) => state.setCompany);
  const setIntegrations = useAuthStore((state) => state.setIntegrations);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setError = useAuthStore((state) => state.setError);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setLastActivity = useAuthStore((state) => state.setLastActivity);
  const setSessionExpiry = useAuthStore((state) => state.setSessionExpiry);
  const incrementRefreshAttempts = useAuthStore((state) => state.incrementRefreshAttempts);
  const resetRefreshAttempts = useAuthStore((state) => state.resetRefreshAttempts);
  const isValid = useAuthStore((state) => state.isValid);
  
  return {
    signIn,
    signUp,
    signOut,
    resetPassword,
    fetchProfile,
    fetchIntegrations,
    fetchCompany,
    updateProfile,
    updateCompany,
    refreshSession,
    clearAuth,
    validateSession,
    retrySessionFetch,
    checkSessionHealth,
    setSession,
    setUser,
    setProfile,
    setCompany,
    setIntegrations,
    setLoading,
    setError,
    setInitialized,
    setStatus,
    setLastActivity,
    setSessionExpiry,
    incrementRefreshAttempts,
    resetRefreshAttempts,
    isValid
  };
}; 