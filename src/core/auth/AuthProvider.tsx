import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/core/supabase';
import { useNavigate } from 'react-router-dom';

// Types
interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface AuthContextType {
  // State
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  
  // Computed
  isAuthenticated: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  
  // Session management
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  // Transform Supabase user to our AuthUser format
  const transformUser = useCallback((supabaseUser: User | null): AuthUser | null => {
    if (!supabaseUser) return null;
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      created_at: supabaseUser.created_at,
      last_sign_in_at: supabaseUser.last_sign_in_at,
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session - this is a lightweight call that doesn't hit the database
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Failed to get initial session:', error);
          if (mounted) {
            setInitialized(true);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          if (session) {
            setSession(session);
            setUser(transformUser(session.user));
          }
          setInitialized(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Only log important auth events in development
        if (import.meta.env.DEV && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
          console.log('Auth state changed:', event, session?.user?.email);
        }

        if (event === 'SIGNED_IN' && session) {
          setSession(session);
          setUser(transformUser(session.user));
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session);
          setUser(transformUser(session.user));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [transformUser, navigate]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        return { error: error.message };
      }

      if (data.session) {
        if (import.meta.env.DEV) {
          console.log('✅ Sign in successful for:', email);
        }
        setSession(data.session);
        setUser(transformUser(data.session.user));
        return {};
      }

      console.error('❌ No session returned from sign in');
      return { error: 'No session returned' };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { error: error instanceof Error ? error.message : 'Sign in failed' };
    } finally {
      setLoading(false);
    }
  }, [transformUser]);

  // Sign up
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        // Create user profile automatically
        try {
          const { userProfileService } = await import('@/core/services/userProfileService');
          await userProfileService.createUserProfile({
            id: data.session.user.id,
            email: data.session.user.email || email,
            role: 'user'
          });
        } catch (profileError) {
          console.warn('Failed to create user profile during signup:', profileError);
          // Don't fail signup if profile creation fails
        }

        setSession(data.session);
        setUser(transformUser(data.session.user));
        return {};
      }

      // If no session, user needs to confirm email
      return { error: 'Please check your email to confirm your account' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Sign up failed' };
    } finally {
      setLoading(false);
    }
  }, [transformUser]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      console.log('🔄 Sending password reset email to:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        return { error: error.message };
      }

      console.log('✅ Password reset email sent successfully');
      return {};
    } catch (error) {
      console.error('❌ Password reset exception:', error);
      return { error: error instanceof Error ? error.message : 'Password reset failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error);
        return;
      }

      if (data.session) {
        setSession(data.session);
        setUser(transformUser(data.session.user));
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  }, [transformUser]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    initialized,
    isAuthenticated: !!session && !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 