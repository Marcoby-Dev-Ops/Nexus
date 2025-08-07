/**
 * User Profile Management Hook
 * Provides comprehensive user profile management functionality
 */

import { useState, useCallback, useEffect } from 'react';
import { selectOne, updateOne } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  department?: string;
  company_id?: string;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = (userId: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await selectOne('user_profiles', userId);
      if (error) {
        logger.error({ error }, 'Failed to fetch user profile');
        setError('Failed to fetch profile');
        return;
      }
      setProfile(data);
    } catch (err) {
      logger.error({ err }, 'Error fetching user profile');
      setError('Error fetching profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await updateOne('user_profiles', userId, updates);
      if (error) {
        logger.error({ error }, 'Failed to update user profile');
        setError('Failed to update profile');
        return null;
      }
      setProfile(data);
      return data;
    } catch (err) {
      logger.error({ err }, 'Error updating user profile');
      setError('Error updating profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
  };
}; 