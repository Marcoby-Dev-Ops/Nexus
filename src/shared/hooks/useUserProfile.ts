/**
 * User Profile Management Hook
 * Provides comprehensive user profile management functionality
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth.ts';
import { userProfileService, CreateUserProfileParams, UpdateUserProfileParams } from '@/core/services/userProfileService';
import { logger } from '@/shared/utils/logger.ts';

export interface UseUserProfileReturn {
  // State
  profile: any | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  completionPercentage: number;
  
  // Actions
  createProfile: (params: CreateUserProfileParams) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: UpdateUserProfileParams) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: (companyData?: any) => Promise<{ success: boolean; error?: string }>;
  validateProfile: (data: any) => { isValid: boolean; errors: string[] };
  
  // Utilities
  clearError: () => void;
}

export function useUserProfile(): UseUserProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Load profile when user changes
  useEffect(() => {
    if (user?.id) {
      refreshProfile();
    } else {
      setProfile(null);
      setCompletionPercentage(0);
    }
  }, [user?.id]);

  // Calculate completion percentage when profile changes
  useEffect(() => {
    if (profile) {
      const percentage = userProfileService.calculateProfileCompletion(profile);
      setCompletionPercentage(percentage);
    }
  }, [profile]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await userProfileService.getUserProfile(user.id);
      
      if (error) {
        setError(error.message || 'Failed to load profile');
        return;
      }

      setProfile(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      logger.error('Error refreshing profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const createProfile = useCallback(async (params: CreateUserProfileParams) => {
    setIsUpdating(true);
    setError(null);

    try {
      // Validate profile data
      const validation = userProfileService.validateProfileData(params);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      const { data, error } = await userProfileService.createUserProfile(params);
      
      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create profile';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      setProfile(data);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
      setError(errorMessage);
      logger.error('Error creating profile:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: UpdateUserProfileParams) => {
    if (!user?.id) {
      return { success: false, error: 'No authenticated user' };
    }

    setIsUpdating(true);
    setError(null);

    try {
      // Validate updates
      const validation = userProfileService.validateProfileData({ id: user.id, ...updates });
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      const { data, error } = await userProfileService.updateUserProfile(user.id, updates);
      
      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      setProfile(data);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      logger.error('Error updating profile:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id]);

  const completeOnboarding = useCallback(async (companyData?: any) => {
    if (!user?.id) {
      return { success: false, error: 'No authenticated user' };
    }

    setIsUpdating(true);
    setError(null);

    try {
      const { data, error } = await userProfileService.completeOnboarding(user.id, companyData);
      
      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to complete onboarding';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      setProfile(data);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete onboarding';
      setError(errorMessage);
      logger.error('Error completing onboarding:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id]);

  const validateProfile = useCallback((data: any) => {
    return userProfileService.validateProfileData(data);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    profile,
    isLoading,
    isUpdating,
    error,
    completionPercentage,
    
    // Actions
    createProfile,
    updateProfile,
    refreshProfile,
    completeOnboarding,
    validateProfile,
    
    // Utilities
    clearError
  };
} 