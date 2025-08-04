import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  job_title?: string | null;
  company?: string | null;
  role?: string | null;
  department?: string | null;
  business_email?: string | null;
  personal_email?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  company_id?: string | null;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Mock profile data - replace with actual API call
      const mockProfile: UserProfile = {
        id: user.id,
        user_id: user.id,
        email: user.email || '',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        display_name: 'John',
        avatar_url: null,
        bio: 'Entrepreneur and business enthusiast',
        job_title: 'CEO',
        company: 'Nexus Inc',
        role: 'admin',
        department: 'Executive',
        business_email: 'john@nexus.com',
        personal_email: 'john.doe@email.com',
        location: 'San Francisco, CA',
        linkedin_url: 'https://linkedin.com/in/johndoe',
        phone: '+1 (555) 123-4567',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setProfile(mockProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id || !profile) {
      throw new Error('User not authenticated or profile not loaded');
    }

    try {
      setLoading(true);
      setError(null);

      // Mock update - replace with actual API call
      console.log('Updating profile:', updates);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedProfile = {
        ...profile,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
  };
} 