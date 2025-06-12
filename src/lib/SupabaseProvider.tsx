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

  useEffect(() => {
    // Fetch initial user on mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    }).catch(() => {});

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

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