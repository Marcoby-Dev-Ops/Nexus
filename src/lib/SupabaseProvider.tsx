'use client';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

interface SupabaseContextType {
  user: User | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    // Fetch initial user on mount
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        // Attempt silent refresh – useful in dev after hard reloads
        const { data: refreshed } = await supabase.auth.refreshSession();
        setUser(refreshed?.user ?? null);
      } else {
        setUser(user);
      }
      setInitialised(true);
    }).catch(() => {
      setInitialised(true);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (!initialised) return null; // Optional: splash screen could be placed here

  return (
    <SupabaseContext.Provider value={{ user }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = (): SupabaseContextType => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }
  return context;
}; 