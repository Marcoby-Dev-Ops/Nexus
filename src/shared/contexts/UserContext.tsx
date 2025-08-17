import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { userService } from '@/services/business/UserService';
import { companyService } from '@/services/business/CompanyService';
import { logger } from '@/shared/utils/logger';
import { userMappingService } from '@/shared/services/UserMappingService';
import type { UserProfile as ComprehensiveUserProfile } from '@/core/types/userProfile';


// Types
export interface UserProfile extends Omit<ComprehensiveUserProfile, 'company' | 'company_id'> {
  // Override company field to be compatible with service layer
  company?: string | null;
  // Override company_id to be compatible with service layer
  company_id?: string | null;
}

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

  // Load user profile with proper error handling
  const loadProfile = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // First, ensure we have the internal user ID
      const mappingResult = await userMappingService.getInternalUserId(userId);
      
      if (!mappingResult.success || !mappingResult.data) {
        logger.warn('No user mapping found, user may be new', { userId });
        setProfile(null);
        setInternalUserId(null);
        setMappingReady(false);
        return;
      }

      const resolvedInternalUserId = mappingResult.data;
      setInternalUserId(resolvedInternalUserId);
      setMappingReady(true);

      // Now try to get the user profile using the service
      const result = await userService.getByExternalId(userId);

      if (!result.success) {
        // Don't log this as an error since it's expected for new users
        logger.info('No user profile found, will create one on first interaction', { userId });
        setProfile(null);
        return;
      }

      setProfile(result.data as UserProfile);
      logger.info('User profile loaded successfully', { userId, internalUserId: resolvedInternalUserId });
    } catch (error) {
      logger.error('Failed to load user profile', { userId, error });
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, [profile?.company_id]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const userId = typeof user.id === 'string' ? user.id : String(user.id);
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
      const updateResult = await userService.updateByExternalId(targetUserId, updates);
      if (updateResult.success && updateResult.data) {
        setProfile(updateResult.data as UserProfile);
        logger.info('User profile updated successfully', { userId: targetUserId });
        return { success: true, data: updateResult.data as UserProfile };
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
    if (user?.id && isAuthenticated) {
      const userId = typeof user.id === 'string' ? user.id : String(user.id);
      // Validate userId before loading profile
      if (userId && userId !== 'undefined' && userId !== 'null') {
        loadProfile(userId);
      } else {
        console.warn('UserContext: Invalid user ID, skipping profile load', { userId });
        setProfile(null);
        setCompany(null);
        setError('Invalid user ID');
        setMappingReady(false);
        setInternalUserId(null);
      }
    } else {
      setProfile(null);
      setCompany(null);
      setError(null);
      setMappingReady(false);
      setInternalUserId(null);
    }
  }, [user?.id, isAuthenticated, loadProfile]);

  // Load company when profile changes
  useEffect(() => {
    if (profile?.company_id) {
      loadCompany();
    } else {
      setCompany(null);
    }
  }, [profile?.company_id, loadCompany]);

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
