import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  user_id: string;
  company_id: string;
  role?: string;
  industry?: string;
  company_size?: string;
  created_at: string;
  updated_at: string;
}

interface UserInfo {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

export const useUser = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial user
    const user = supabase.auth.getUser();
    if (user) {
      fetchUserProfile(user.id);
    }

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserInfo(prev => ({ ...prev, user: null, profile: null }));
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      setUserInfo(prev => ({
        ...prev,
        profile,
        loading: false,
      }));
    } catch (error) {
      setUserInfo(prev => ({
        ...prev,
        error: error as Error,
        loading: false,
      }));
    }
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!userInfo.user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userInfo.user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setUserInfo(prev => ({
        ...prev,
        profile: data,
      }));

      return data;
    } catch (error) {
      setUserInfo(prev => ({
        ...prev,
        error: error as Error,
      }));
      throw error;
    }
  };

  return {
    ...userInfo,
    updateUser,
  };
}; 