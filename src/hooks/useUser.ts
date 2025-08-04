import { useAuth } from '@/hooks/useAuth';
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  role?: 'owner' | 'admin' | 'manager' | 'user';
  department?: string;
  job_title?: string;
  company_id?: string;
  business_email?: string;
  personal_email?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UseUserReturn {
  // Basic user data
  user: any;
  session: any;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Profile data
  profile: UserProfile | null;
  company: Company | null;
  
  // Actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  updateCompany: (updates: Partial<Company>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  refreshCompany: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
}

export function useUser(): UseUserReturn {
  const { user, session, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load profile when user changes
  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // Handle 403 Forbidden or table not found gracefully
        if (profileError.code === 'PGRST116' || profileError.message.includes('403')) {
          logger.warn('User profile table not accessible, using auth user data');
          // Create a basic profile from auth user data
          const basicProfile: UserProfile = {
            id: user.id,
            email: user.email || '',
            first_name: (user as any).user_metadata?.first_name || user.email?.split('@')[0] || '',
            last_name: (user as any).user_metadata?.last_name || '',
            full_name: (user as any).user_metadata?.full_name || user.email?.split('@')[0] || '',
            display_name: (user as any).user_metadata?.full_name || user.email?.split('@')[0] || '',
            avatar_url: (user as any).user_metadata?.avatar_url || (user as any).user_metadata?.picture,
            role: 'user',
            created_at: (user as any).created_at || new Date().toISOString(),
            updated_at: (user as any).updated_at || new Date().toISOString()
          };
          setProfile(basicProfile);
          return;
        }
        throw new Error(profileError.message);
      }

      // Ensure the data matches UserProfile interface
      const profileData: UserProfile = {
        id: data.id,
        email: data.email || user.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        full_name: data.full_name || '',
        display_name: data.display_name || '',
        avatar_url: data.avatar_url || '',
        role: (data.role as 'owner' | 'admin' | 'manager' | 'user') || 'user',
        department: data.department || '',
        job_title: data.job_title || '',
        company_id: data.company_id || '',
        business_email: data.business_email || '',
        personal_email: data.personal_email || '',
        phone: data.phone || '',
        location: data.location || '',
        timezone: data.timezone || '',
        onboarding_completed: data.onboarding_completed || false,
        created_at: data.created_at || '',
        updated_at: data.updated_at || ''
      };
      
      setProfile(profileData);
      
      // Load company if user has one
      if (data?.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', data.company_id)
          .single();

        if (!companyError && companyData) {
          const company: Company = {
            id: companyData.id,
            name: companyData.name || '',
            industry: companyData.industry || '',
            size: companyData.size || '',
            website: companyData.website || '',
            description: companyData.description || '',
            logo_url: companyData.logo_url || '',
            created_at: companyData.created_at || '',
            updated_at: companyData.updated_at || ''
          };
          setCompany(company);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      logger.error('Error refreshing profile:', err);
      
      // Set a basic profile on error to prevent crashes
      const basicProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        first_name: (user as any).user_metadata?.first_name || user.email?.split('@')[0] || '',
        last_name: (user as any).user_metadata?.last_name || '',
        full_name: (user as any).user_metadata?.full_name || user.email?.split('@')[0] || '',
        display_name: (user as any).user_metadata?.full_name || user.email?.split('@')[0] || '',
        avatar_url: (user as any).user_metadata?.avatar_url || (user as any).user_metadata?.picture,
        role: 'user',
        created_at: (user as any).created_at || new Date().toISOString(),
        updated_at: (user as any).updated_at || new Date().toISOString()
      };
      setProfile(basicProfile);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id) {
      return { success: false, error: 'No authenticated user' };
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate full_name if first_name or last_name are updated
      let full_name = updates.full_name;
      if (updates.first_name || updates.last_name) {
        const firstName = updates.first_name || profile?.first_name;
        const lastName = updates.last_name || profile?.last_name;
        
        if (firstName && lastName) {
          full_name = `${firstName} ${lastName}`.trim();
        } else {
          full_name = firstName || lastName || full_name;
        }
      }

      const updateData = {
        ...updates,
        full_name,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        // Handle 403 Forbidden or table not found gracefully
        if (error.code === 'PGRST116' || error.message.includes('403')) {
          logger.warn('User profile table not accessible, updating local profile only');
          // Update local profile without database
          const updatedProfile = {
            ...profile,
            ...updates,
            full_name,
            updated_at: new Date().toISOString()
          } as UserProfile;
          setProfile(updatedProfile);
          return { success: true };
        }
        throw new Error(error.message);
      }

      setProfile(data);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile]);

  // Update company
  const updateCompany = useCallback(async (updates: Partial<Company>) => {
    if (!company?.id) {
      return { success: false, error: 'No company available' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('companies')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setCompany(data);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update company';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  // Refresh company data
  const refreshCompany = useCallback(async () => {
    if (!profile?.company_id) {
      setCompany(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setCompany(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load company';
      setError(errorMessage);
      logger.error('Error refreshing company:', err);
    }
  }, [profile?.company_id]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-refresh profile when user changes
  useEffect(() => {
    if (user?.id) {
      refreshProfile();
    } else {
      setProfile(null);
      setCompany(null);
    }
  }, [user?.id, refreshProfile]);

  return {
    // Basic user data
    user,
    session,
    isAuthenticated: !!user,
    loading: authLoading || loading,
    error,
    
    // Profile data
    profile,
    company,
    
    // Actions
    updateProfile,
    updateCompany,
    refreshProfile,
    refreshCompany,
    
    // Utilities
    clearError
  };
} 