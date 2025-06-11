import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Company, UserProfile } from '@prisma/client';

interface EnhancedUserContextType {
  user: User | null;
  profile: UserProfile | null;
  company: Company | null;
  loading: boolean;
  error: Error | null;
  updateCompany: (updates: Partial<Company>) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const EnhancedUserContext = createContext<EnhancedUserContextType | undefined>(undefined);

export const useEnhancedUser = () => {
  const context = useContext(EnhancedUserContext);
  if (!context) {
    throw new Error('useEnhancedUser must be used within an EnhancedUserProvider');
  }
  return context;
};

export const EnhancedUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchUserData(user.id);
      }
    };
    getUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserData(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setCompany(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profile as UserProfile);

      // Fetch company data if we have a company_id
      if (profile.company_id) {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();

        if (companyError) throw companyError;
        setCompany(company as Company);
      }
    } catch (error) {
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (updates: Partial<Company>) => {
    if (!company) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .upsert({
          id: company.id,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setCompany(data as Company);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: profile.id,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(data as UserProfile);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  return (
    <EnhancedUserContext.Provider
      value={{
        user,
        profile,
        company,
        loading,
        error,
        updateCompany,
        updateProfile,
      }}
    >
      {children}
    </EnhancedUserContext.Provider>
  );
}; 