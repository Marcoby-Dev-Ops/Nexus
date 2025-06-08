import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface SupabaseContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 SupabaseProvider: Initializing auth state...');
    console.log('📍 Current pathname:', window.location.pathname);
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting initial session:', error);
      } else if (session) {
        console.log('✅ Initial session found:', session.user?.email);
        console.log('🔍 Session details:', {
          userId: session.user?.id,
          email: session.user?.email,
          provider: session.user?.app_metadata?.provider,
          expiresAt: new Date(session.expires_at! * 1000).toISOString()
        });
      } else {
        console.log('ℹ️ No initial session');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state change:', event, session?.user?.email || 'No user');
      console.log('📍 Current pathname during auth change:', window.location.pathname);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle successful login with improved redirect logic
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in successfully:', session.user.email);
        console.log('🔍 Sign-in session details:', {
          userId: session.user?.id,
          email: session.user?.email,
          provider: session.user?.app_metadata?.provider,
          currentPath: window.location.pathname
        });
        
        // Only redirect if we're on auth-related pages
        const authPages = ['/login', '/signup', '/auth/callback'];
        const currentPath = window.location.pathname;
        
        if (authPages.includes(currentPath)) {
          console.log('🚀 On auth page, redirecting to dashboard...');
          
          // Use replace instead of href to avoid page reload and ensure proper navigation
          setTimeout(() => {
            window.history.replaceState(null, '', '/dashboard');
            // Trigger a popstate event to make React Router handle the navigation
            window.dispatchEvent(new PopStateEvent('popstate'));
          }, 200);
        } else {
          console.log('ℹ️ Not on auth page, staying on current page:', currentPath);
        }
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
      }
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed for user:', session?.user?.email);
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('👋 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('✅ Sign out successful');
      // The session and user will be automatically cleared by the auth state change listener
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  };

  const value = {
    session,
    user,
    loading,
    signOut,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}; 