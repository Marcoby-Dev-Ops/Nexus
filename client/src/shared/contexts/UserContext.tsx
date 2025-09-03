import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/index';
import { userService } from '@/services/core/UserService';
import { companyService } from '@/services/core/CompanyService';
import { logger } from '@/shared/utils/logger';

import type { UserProfile } from '@/services/core/UserService';


// Types - Use the same UserProfile type as the UserService
export type { UserProfile } from '@/services/core/UserService';

export interface CompanyProfile {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserContextType {
  // User data
  profile: UserProfile | null;
  company: CompanyProfile | null;
  
  // Loading states
  loading: boolean;
  
  // Error states
  error: string | null;
  
  // User mapping state
  mappingReady: boolean;
  internalUserId: string | null;
  
  // Actions
  refreshProfile: () => Promise<void>;
  refreshCompany: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; data?: UserProfile; error?: string }>;
  clearError: () => void;
}

// Create context
export const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // Safely access auth context with error boundary
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // If auth context is not available, provide fallback values
    authContext = {
      user: null,
      isAuthenticated: false,
      loading: true,
      initialized: false,
      error: null,
      signIn: async () => ({ success: false, error: 'Auth not available' }),
      signUp: async () => ({ success: false, error: 'Auth not available' }),
      signOut: async () => ({ success: false, error: 'Auth not available' }),
      resetPassword: async () => ({ success: false, error: 'Auth not available' }),
      updateProfile: async () => ({ success: false, error: 'Auth not available' }),
      refreshAuth: async () => {},
      session: null
    };
  }
  
  const { user, isAuthenticated } = authContext;
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappingReady, setMappingReady] = useState(false);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  // Track if we've already loaded profile for current user to prevent infinite loops
  const loadedUserIdRef = useRef<string | null>(null);

  // Load user profile with proper error handling
  const loadProfile = useCallback(async (userId: string) => {
    // Prevent loading the same user profile multiple times
    if (loadedUserIdRef.current === userId && profileLoaded) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated before making API call
      if (!isAuthenticated) {
        logger.warn('User not authenticated, skipping profile load', { userId });
        setLoading(false);
        setProfileLoaded(true);
        return;
      }

      // Use external user ID directly - no mapping needed
      setInternalUserId(userId);
      setMappingReady(true);

      // Now try to get the user profile using the service
      const result = await userService.getAuthProfile(userId);

              // Debug logging removed for security

      if (!result.success) {
        // Don't log this as an error since it's expected for new users
        logger.info('No user profile found, will create one on first interaction', { userId });
        setProfile(null);
        setProfileLoaded(true);
        loadedUserIdRef.current = userId;
        return;
      }

      setProfile(result.data as any);
      setProfileLoaded(true);
      loadedUserIdRef.current = userId;
      logger.info('User profile loaded successfully', { userId });
    } catch (error) {
      logger.error('Failed to load user profile', { userId, error });
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [userService, isAuthenticated, profileLoaded]);

  // Load company data
  const loadCompany = useCallback(async () => {
    if (!profile?.company_id) {
      setCompany(null);
      return;
    }

    try {
      const result = await companyService.get(profile.company_id);
      
      if (result.success && result.data) {
        setCompany(result.data as CompanyProfile);
        logger.info('Company profile loaded successfully', { companyId: profile.company_id });
      }
    } catch (err) {
      logger.error('Error loading company profile', { error: err, companyId: profile.company_id });
    }
  }, [profile?.company_id, companyService]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const userId = typeof user.id === 'string' ? user.id : String(user.id);
      // Reset the loaded user ID to force reload
      loadedUserIdRef.current = null;
      setProfileLoaded(false);
      await loadProfile(userId);
    }
  }, [user?.id, loadProfile]);

  // Refresh company
  const refreshCompany = useCallback(async () => {
    await loadCompany();
  }, [loadCompany]);

  // Update profile with proper error handling
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const targetUserId = user?.id;
    if (!targetUserId) {
      throw new Error('No authenticated user to update');
    }

    try {
      const updateResult = await userService.upsertAuthProfile(targetUserId, updates);
      if (updateResult.success && updateResult.data) {
        // Force refresh the profile to get the latest data from the database
        const refreshedProfile = await userService.getAuthProfile(targetUserId);
        
        // Debug logging
        logger.info('Profile refresh result:', { 
          success: refreshedProfile.success, 
          data: refreshedProfile.data,
          job_title: refreshedProfile.data?.job_title,
          company_name: refreshedProfile.data?.company_name,
          experience: refreshedProfile.data?.experience,
          location: refreshedProfile.data?.location
        });
        
        if (refreshedProfile.success && refreshedProfile.data) {
          setProfile(refreshedProfile.data as UserProfile);
          // Force a profile reload to ensure the context is updated
          loadedUserIdRef.current = null;
          setProfileLoaded(false);
          logger.info('User profile updated and refreshed successfully', { userId: targetUserId });
          return { success: true, data: refreshedProfile.data as UserProfile };
        } else {
          // Fallback to the update result if refresh fails
          setProfile(updateResult.data as UserProfile);
          logger.info('User profile updated successfully (fallback)', { userId: targetUserId });
          return { success: true, data: updateResult.data as UserProfile };
        }
      }
      throw new Error(updateResult.error || 'Failed to update profile');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      logger.error('Error updating user profile', { error: err, userId: targetUserId });
      return { success: false, error: errorMessage };
    }
  }, [user?.id]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Load data when user changes
  useEffect(() => {
    if (user?.id && isAuthenticated && !loading && !profileLoaded) {
      const userId = typeof user.id === 'string' ? user.id : String(user.id);
      // Validate userId before loading profile
      if (userId && userId !== 'undefined' && userId !== 'null') {
        loadProfile(userId);
      } else {
        // Warning logging removed for production
        setProfile(null);
        setCompany(null);
        setError('Invalid user ID');
        setMappingReady(false);
        setInternalUserId(null);
      }
    } else if (!user?.id || !isAuthenticated) {
      setProfile(null);
      setCompany(null);
      setError(null);
      setMappingReady(false);
      setInternalUserId(null);
      setProfileLoaded(false); // Reset when user logs out
      loadedUserIdRef.current = null; // Reset loaded user ID
    }
  }, [user?.id, isAuthenticated, loading, profileLoaded]); // Remove loadProfile from dependencies

  // Load company when profile changes
  useEffect(() => {
    if (profile?.company_id) {
      const loadCompanyData = async () => {
        try {
          const result = await companyService.get(profile.company_id!);
          
          if (result.success && result.data) {
            setCompany(result.data as CompanyProfile);
            logger.info('Company profile loaded successfully', { companyId: profile.company_id });
          }
        } catch (err) {
          logger.error('Error loading company profile', { error: err, companyId: profile.company_id });
        }
      };
      loadCompanyData();
    } else {
      setCompany(null);
    }
  }, [profile?.company_id]);

  const value: UserContextType = {
    profile,
    company,
    loading,
    error,
    mappingReady,
    internalUserId,
    refreshProfile,
    refreshCompany,
    updateProfile,
    clearError,
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
  const { profile, loading, error, refreshProfile, updateProfile, mappingReady } = useUserContext();
  return { profile, loading, error, refreshProfile, updateProfile, mappingReady };
};

export const useUserCompany = () => {
  const { company, refreshCompany } = useUserContext();
  return { company, refreshCompany };
};
