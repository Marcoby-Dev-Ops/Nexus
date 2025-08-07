import { useAuth } from '@/hooks/useAuth';
import { useState, useCallback, useEffect } from 'react';
import { userService } from '@/services/business/UserService';
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
  user: unknown;
  session: unknown;
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
  
  // Cache for preventing duplicate requests
  const [lastProfileRequest, setLastProfileRequest] = useState<string | null>(null);
  const [lastCompanyRequest, setLastCompanyRequest] = useState<string | null>(null);

  // Load profile when user changes
  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLastProfileRequest(null);
      return;
    }

    // Prevent duplicate requests for the same user
    const requestKey = `profile-${user.id}`;
    if (lastProfileRequest === requestKey && profile) {
      return; // Already loaded this profile
    }

    setLoading(true);
    setError(null);
    setLastProfileRequest(requestKey);

    try {
      // Use the UserService to get user profile
      const result = await userService.get(user.id);
      
      if (!result.success) {
        // Handle 403 Forbidden or table not found gracefully
        if (result.error?.includes('403') || result.error?.includes('PGRST116')) {
          logger.warn('User profile table not accessible, using auth user data');
          // Create a basic profile from auth user data
          const userMeta = (user as unknown as { user_metadata?: Record<string, unknown> })?.user_metadata;
          const basicProfile: UserProfile = {
            id: user.id,
            email: user.email || '',
            first_name: (userMeta?.first_name as string) || user.email?.split('@')[0] || '',
            last_name: (userMeta?.last_name as string) || '',
            full_name: (userMeta?.full_name as string) || user.email?.split('@')[0] || '',
            display_name: (userMeta?.full_name as string) || user.email?.split('@')[0] || '',
            avatar_url: (userMeta?.avatar_url as string) || (userMeta?.picture as string) || '',
            role: 'user',
            created_at: (user as unknown as { created_at?: string }).created_at || new Date().toISOString(),
            updated_at: (user as unknown as { updated_at?: string }).updated_at || new Date().toISOString()
          };
          setProfile(basicProfile);
          return;
        }
        throw new Error(result.error || 'Failed to load profile');
      }

      // Ensure the data matches UserProfile interface
      const profileData: UserProfile = {
        id: result.data?.id as string || user.id,
        email: result.data?.email as string || user.email || '',
        first_name: result.data?.first_name as string || '',
        last_name: result.data?.last_name as string || '',
        full_name: (result.data as any)?.full_name as string || '',
        display_name: (result.data as any)?.display_name as string || '',
        avatar_url: result.data?.avatar_url as string || '',
        role: (result.data?.role as 'owner' | 'admin' | 'manager' | 'user') || 'user',
        department: (result.data as any)?.department as string || '',
        job_title: (result.data as any)?.job_title as string || '',
        company_id: result.data?.company_id as string || '',
        business_email: (result.data as any)?.business_email as string || '',
        personal_email: (result.data as any)?.personal_email as string || '',
        phone: result.data?.phone as string || '',
        location: (result.data as any)?.location as string || '',
        timezone: (result.data as any)?.timezone as string || '',
        onboarding_completed: (result.data as any)?.onboarding_completed as boolean || false,
        created_at: result.data?.created_at as string || '',
        updated_at: result.data?.updated_at as string || ''
      };
      
      setProfile(profileData);
      
      // Load company if user has one and onboarding is completed
      // Only load company data if we're not in onboarding and user has completed onboarding
      const isOnboardingPath = window.location.pathname.includes('/onboarding') || 
                              window.location.pathname.includes('/welcome') ||
                              window.location.search.includes('force-onboarding');
      
      if (result.data?.company_id && (result.data as any)?.onboarding_completed === true && !isOnboardingPath) {
        // Prevent duplicate company requests
        const companyRequestKey = `company-${result.data.company_id}`;
        if (lastCompanyRequest === companyRequestKey && company) {
          return; // Already loaded this company
        }

        // Additional safety check - only proceed if we have a valid user session
        if (!user?.id || !session) {
          logger.warn('No valid user session, skipping company data fetch');
          return;
        }

        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
          logger.info('Attempting to fetch company data:', {
            userId: user.id,
            companyId: result.data.company_id,
            onboardingCompleted: (result.data as any)?.onboarding_completed,
            isOnboardingPath
          });
        }

        try {
          // Use the UserService to get company data
          const companyResult = await userService.getUserWithBusinessData(user.id);
          
          if (companyResult.success && companyResult.data?.company) {
            const company: Company = {
              id: companyResult.data.company.id,
              name: companyResult.data.company.name || '',
              industry: companyResult.data.company.industry || '',
              size: companyResult.data.company.size || '',
              website: companyResult.data.company.website || '',
              description: companyResult.data.company.description || '',
              logo_url: (companyResult.data.company as any)?.logo_url || '',
              created_at: companyResult.data.company.created_at || '',
              updated_at: companyResult.data.company.updated_at || ''
            };
            setCompany(company);
            setLastCompanyRequest(companyRequestKey);
          }
        } catch (companyErr) {
          const errorMessage = companyErr instanceof Error ? companyErr.message : 'Failed to load company data';
          // Handle 403 Forbidden specifically
          if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
            logger.warn('Company data not accessible due to RLS policy - this is expected during onboarding');
          } else {
            logger.warn('Error loading company data:', companyErr);
          }
          // Don't throw error, just log it and continue without company data
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      logger.error('Error refreshing profile:', err);
      
      // Set a basic profile on error to prevent crashes
      const userMeta = (user as unknown as { user_metadata?: Record<string, unknown> })?.user_metadata;
      const basicProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        first_name: (userMeta?.first_name as string) || user.email?.split('@')[0] || '',
        last_name: (userMeta?.last_name as string) || '',
        full_name: (userMeta?.full_name as string) || user.email?.split('@')[0] || '',
        display_name: (userMeta?.full_name as string) || user.email?.split('@')[0] || '',
        avatar_url: (userMeta?.avatar_url as string) || (userMeta?.picture as string) || '',
        role: 'user',
        created_at: (user as unknown as { created_at?: string }).created_at || new Date().toISOString(),
        updated_at: (user as unknown as { updated_at?: string }).updated_at || new Date().toISOString()
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

      // Use the UserService to update profile
      const result = await userService.update(user.id, updateData);

      if (!result.success) {
        // Handle 403 Forbidden or table not found gracefully
        if (result.error?.includes('403') || result.error?.includes('PGRST116')) {
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
        throw new Error(result.error || 'Failed to update profile');
      }

      setProfile(result.data as UserProfile);
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
      // For now, we'll use the compatibility layer for company updates
      // until a proper CompanyService is created
      const { data, error } = await import('@/lib/supabase-compatibility').then(m => m.updateOne('companies', company.id, {
        ...updates,
        updated_at: new Date().toISOString()
      }));

      if (error) {
        throw new Error(error.message);
      }

      setCompany(data as Company);
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
    const isOnboardingPath = window.location.pathname.includes('/onboarding') || 
                            window.location.pathname.includes('/welcome') ||
                            window.location.search.includes('force-onboarding');
    
    if (!profile?.company_id || !profile?.onboarding_completed || isOnboardingPath) {
      setCompany(null);
      setLastCompanyRequest(null);
      return;
    }

    // Prevent duplicate company requests
    const companyRequestKey = `company-${profile.company_id}`;
    if (lastCompanyRequest === companyRequestKey && company) {
      return; // Already loaded this company
    }

    // Additional safety check - only proceed if we have a valid user session
    if (!user?.id || !session) {
      logger.warn('No valid user session, skipping company data refresh');
      return;
    }

    try {
      // Use the UserService to get company data
      const result = await userService.getUserWithBusinessData(user.id);
      
      if (result.success && result.data?.company) {
        const company: Company = {
          id: result.data.company.id,
          name: result.data.company.name || '',
          industry: result.data.company.industry || '',
          size: result.data.company.size || '',
          website: result.data.company.website || '',
          description: result.data.company.description || '',
          logo_url: (result.data.company as any)?.logo_url || '',
          created_at: result.data.company.created_at || '',
          updated_at: result.data.company.updated_at || ''
        };
        setCompany(company);
        setLastCompanyRequest(companyRequestKey);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load company';
      // Handle 403 Forbidden specifically
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        logger.warn('Company data not accessible due to RLS policy - this is expected during onboarding');
      } else {
        logger.warn('Error refreshing company:', errorMessage);
      }
      // Don't set error state, just log it and continue without company data
    }
  }, [profile?.company_id, profile?.onboarding_completed, user?.id]);

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
      setLastProfileRequest(null);
      setLastCompanyRequest(null);
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