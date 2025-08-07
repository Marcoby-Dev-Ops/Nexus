import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { userService } from '@/services/business/UserService';
import { companyService } from '@/services/business/CompanyService';
import { logger } from '@/shared/utils/logger';

// Types
export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  role?: string;
  department?: string;
  company_id?: string;
  experience_level?: 'beginner' | 'intermediate' | 'expert';
  communication_style?: 'concise' | 'balanced' | 'detailed';
  preferences?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  stage?: 'startup' | 'growth' | 'mature';
  created_at?: string;
  updated_at?: string;
}

export interface UserContextState {
  // User data
  profile: UserProfile | null;
  company: CompanyProfile | null;
  
  // Loading states
  loading: boolean;
  profileLoading: boolean;
  companyLoading: boolean;
  
  // Error states
  error: string | null;
  profileError: string | null;
  companyError: string | null;
  
  // Cache management
  lastProfileUpdate: number | null;
  lastCompanyUpdate: number | null;
  
  // Computed values
  isProfileComplete: boolean;
  hasCompany: boolean;
  userDisplayName: string;
}

export interface UserContextActions {
  // Data refresh
  refreshProfile: () => Promise<void>;
  refreshCompany: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Profile updates
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (preferences: Record<string, any>) => Promise<void>;
  
  // Error handling
  clearError: () => void;
  clearProfileError: () => void;
  clearCompanyError: () => void;
}

export type UserContextType = UserContextState & UserContextActions;

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [lastProfileUpdate, setLastProfileUpdate] = useState<number | null>(null);
  const [lastCompanyUpdate, setLastCompanyUpdate] = useState<number | null>(null);

  // Cache duration (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Check if profile data is fresh
  const isProfileFresh = useCallback(() => {
    if (!lastProfileUpdate) return false;
    return Date.now() - lastProfileUpdate < CACHE_DURATION;
  }, [lastProfileUpdate]);

  // Check if company data is fresh
  const isCompanyFresh = useCallback(() => {
    if (!lastCompanyUpdate) return false;
    return Date.now() - lastCompanyUpdate < CACHE_DURATION;
  }, [lastCompanyUpdate]);

  // Load user profile
  const loadProfile = useCallback(async (force = false) => {
    if (!user?.id) {
      setProfile(null);
      setProfileError(null);
      return;
    }

    // Skip if data is fresh and not forcing refresh
    if (!force && isProfileFresh() && profile) {
      return;
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      const result = await userService.get(user.id);
      
      if (result.success && result.data) {
        setProfile(result.data as UserProfile);
        setLastProfileUpdate(Date.now());
        logger.info('User profile loaded successfully', { userId: user.id });
      } else {
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
            updated_at: new Date().toISOString(),
          };
          setProfile(basicProfile);
          setLastProfileUpdate(Date.now());
        } else {
          setProfileError(result.error || 'Failed to load user profile');
          logger.error('Failed to load user profile', { error: result.error, userId: user.id });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user profile';
      setProfileError(errorMessage);
      logger.error('Error loading user profile', { error: err, userId: user.id });
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id, isProfileFresh, profile]);

  // Load company data
  const loadCompany = useCallback(async (force = false) => {
    if (!profile?.company_id) {
      setCompany(null);
      setCompanyError(null);
      return;
    }

    // Skip if data is fresh and not forcing refresh
    if (!force && isCompanyFresh() && company) {
      return;
    }

    setCompanyLoading(true);
    setCompanyError(null);

    try {
      const result = await companyService.get(profile.company_id);
      
      if (result.success && result.data) {
        setCompany(result.data as CompanyProfile);
        setLastCompanyUpdate(Date.now());
        logger.info('Company profile loaded successfully', { companyId: profile.company_id });
      } else {
        setCompanyError(result.error || 'Failed to load company profile');
        logger.error('Failed to load company profile', { error: result.error, companyId: profile.company_id });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load company profile';
      setCompanyError(errorMessage);
      logger.error('Error loading company profile', { error: err, companyId: profile.company_id });
    } finally {
      setCompanyLoading(false);
    }
  }, [profile?.company_id, isCompanyFresh, company]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    await loadProfile(true);
  }, [loadProfile]);

  // Refresh company
  const refreshCompany = useCallback(async () => {
    await loadCompany(true);
  }, [loadCompany]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadProfile(true), loadCompany(true)]);
    } finally {
      setLoading(false);
    }
  }, [loadProfile, loadCompany]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile?.id) {
      throw new Error('No profile to update');
    }

    try {
      const result = await userService.update(profile.id, updates);
      
      if (result.success && result.data) {
        setProfile(result.data as UserProfile);
        setLastProfileUpdate(Date.now());
        logger.info('User profile updated successfully', { userId: profile.id });
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setProfileError(errorMessage);
      logger.error('Error updating user profile', { error: err, userId: profile.id });
      throw err;
    }
  }, [profile?.id]);

  // Update preferences
  const updatePreferences = useCallback(async (preferences: Record<string, any>) => {
    if (!profile?.id) {
      throw new Error('No profile to update');
    }

    const updatedPreferences = {
      ...profile.preferences,
      ...preferences
    };

    await updateProfile({ preferences: updatedPreferences });
  }, [profile?.id, updateProfile]);

  // Error clearing
  const clearError = useCallback(() => setError(null), []);
  const clearProfileError = useCallback(() => setProfileError(null), []);
  const clearCompanyError = useCallback(() => setCompanyError(null), []);

  // Computed values
  const isProfileComplete = Boolean(
    profile?.first_name && 
    profile?.last_name && 
    profile?.role && 
    profile?.department
  );

  const hasCompany = Boolean(company?.id);

  const userDisplayName = profile?.display_name || 
    profile?.full_name || 
    profile?.first_name || 
    profile?.email?.split('@')[0] || 
    'User';

  // Load data when user changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadProfile();
    } else {
      setProfile(null);
      setCompany(null);
      setProfileError(null);
      setCompanyError(null);
    }
  }, [isAuthenticated, user?.id, loadProfile]);

  // Load company when profile changes
  useEffect(() => {
    if (profile?.company_id) {
      loadCompany();
    } else {
      setCompany(null);
      setCompanyError(null);
    }
  }, [profile?.company_id, loadCompany]);

  // Update loading state
  useEffect(() => {
    setLoading(profileLoading || companyLoading);
  }, [profileLoading, companyLoading]);

  // Update error state
  useEffect(() => {
    setError(profileError || companyError);
  }, [profileError, companyError]);

  const value: UserContextType = {
    // State
    profile,
    company,
    loading,
    profileLoading,
    companyLoading,
    error,
    profileError,
    companyError,
    lastProfileUpdate,
    lastCompanyUpdate,
    
    // Computed values
    isProfileComplete,
    hasCompany,
    userDisplayName,
    
    // Actions
    refreshProfile,
    refreshCompany,
    refreshAll,
    updateProfile,
    updatePreferences,
    clearError,
    clearProfileError,
    clearCompanyError,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Hook to use the user context
export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

// Convenience hooks for specific data
export const useUserProfile = () => {
  const { profile, profileLoading, profileError, refreshProfile, updateProfile } = useUserContext();
  return { profile, loading: profileLoading, error: profileError, refreshProfile, updateProfile };
};

export const useUserCompany = () => {
  const { company, companyLoading, companyError, refreshCompany } = useUserContext();
  return { company, loading: companyLoading, error: companyError, refreshCompany };
};

export const useUserPreferences = () => {
  const { profile, updatePreferences } = useUserContext();
  return { 
    preferences: profile?.preferences || {}, 
    updatePreferences 
  };
};
