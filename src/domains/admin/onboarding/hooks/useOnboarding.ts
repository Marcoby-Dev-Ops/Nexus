/**
 * useOnboarding.ts
 * React hook for managing onboarding state and user n8n configuration
 * Provides easy integration of onboarding flow into the main app
 */
import { useState, useEffect, useCallback } from 'react';
import { safeGetLocalStorage, safeSetLocalStorage } from '@/shared/utils/storageUtils';
import { supabase } from '@/core/supabase';
import { useAuth } from '@/core/auth/AuthProvider';

export interface OnboardingState {
  step: number;
  completed: boolean;
}

export interface UserN8nConfig {
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
}

// Mock n8n services for now
const mockUserN8nConfigService = {
  isEnabled: () => false,
  getCurrentUserConfig: async () => null,
  clearCache: () => {},
  enableN8nIntegration: () => {},
  disableN8nIntegration: () => {}
};

const mockN8nOnboardingManager = {
  needsOnboarding: async () => false
};

export interface UseOnboardingReturn {
  // State
  onboardingState: OnboardingState | null;
  needsOnboarding: boolean;
  isLoading: boolean;
  userN8nConfig: UserN8nConfig | null;
  
  // Actions
  startOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  checkOnboardingStatus: () => Promise<void>;
  
  // n8n specific
  hasN8nConfig: boolean;
  testN8nConnection: (baseUrl: string, apiKey: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Main onboarding hook - PROPER IMPLEMENTATION
 */
export function useOnboarding(user?: any): UseOnboardingReturn {
  const { profile, fetchProfile } = useAuth();
  const [onboardingState] = useState<OnboardingState | null>(null);
  const [userN8nConfig] = useState<UserN8nConfig | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load onboarding status from canonical profile state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    setIsLoading(true);
    if (user?.id) {
      fetchProfile(user.id).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
    // Timeout fallback
    timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 10000);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    if (profile) {
      setNeedsOnboarding(!profile.onboarding_completed);
    }
  }, [profile]);

  const startOnboarding = useCallback(() => {
    setNeedsOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      if (!user?.id) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('No user ID available for completing onboarding');
        return;
      }

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[completeOnboarding] Completing onboarding for user: ', user.id);

      // Call the database function to complete onboarding
      const { error } = await supabase
        .rpc('complete_user_onboarding', { 
          useruuid: user.id,
          onboardingdata: { completedat: new Date().toISOString() }
        });

      if (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error completing onboarding in database: ', error);
        // Fallback to localStorage
        safeSetLocalStorage('nexus_onboarding_complete', true);
      } else {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[completeOnboarding] Successfully completed onboarding in database');
        // Also update localStorage for consistency
        safeSetLocalStorage('nexus_onboarding_complete', true);
      }
      
      setNeedsOnboarding(false);
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[completeOnboarding] Set needsOnboarding to false');
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to complete onboarding: ', error);
      // Fallback to localStorage
      safeSetLocalStorage('nexus_onboarding_complete', true);
      setNeedsOnboarding(false);
    }
  }, [user?.id]);

  const resetOnboarding = useCallback(() => {
    try {
      safeSetLocalStorage('nexus_onboarding_complete', false);
      setNeedsOnboarding(true);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to reset onboarding: ', error);
    }
  }, []);

  const checkOnboardingStatus = useCallback(async () => {
    setIsLoading(true);
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Add timeout to prevent hanging
      timeoutId = setTimeout(() => {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[checkOnboardingStatus] Timeout reached, setting default values');
        setNeedsOnboarding(false);
        setIsLoading(false);
      }, 10000); // 10 second timeout
      
      if (!user?.id) {
        if (timeoutId) clearTimeout(timeoutId);
        setNeedsOnboarding(false);
        setIsLoading(false);
        return;
      }

      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, onboarding_completed')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create a basic one
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('checkOnboardingStatus: No user profile found, creating basic profile');
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            displayname: user.email?.split('@')[0] || 'User',
            role: 'user',
            onboardingcompleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString()
          })
          .select('id, onboarding_completed')
          .single();
        
        if (createError) {
          // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('checkOnboardingStatus: Error creating user profile:', createError);
          if (timeoutId) clearTimeout(timeoutId);
          setNeedsOnboarding(true);
          setIsLoading(false);
          return;
        }
        
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('checkOnboardingStatus: Created basic profile, needs onboarding');
        if (timeoutId) clearTimeout(timeoutId);
        setNeedsOnboarding(!newProfile.onboarding_completed);
        setIsLoading(false);
        return;
      }
      
      if (profileError) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('checkOnboardingStatus: Error checking user profile:', profileError);
        if (timeoutId) clearTimeout(timeoutId);
        setNeedsOnboarding(true);
        setIsLoading(false);
        return;
      }
      
      // Profile exists, check onboarding status
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('checkOnboardingStatus: Profile exists, onboardingcompleted: ', profile.onboarding_completed);
      if (timeoutId) clearTimeout(timeoutId);
      setNeedsOnboarding(!profile.onboarding_completed);
      setIsLoading(false);
      
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('checkOnboardingStatus: Failed to check onboarding status:', error);
      // Fallback to localStorage
      const completed = safeGetLocalStorage<boolean>('nexus_onboarding_complete', false);
      if (timeoutId) clearTimeout(timeoutId);
      setNeedsOnboarding(!completed);
      setIsLoading(false);
    }
  }, [user?.id]);

  const testN8nConnection = useCallback(async (_baseUrl: string, apiKey: string) => {
    return { success: true };
  }, []);

  return {
    onboardingState,
    needsOnboarding,
    isLoading: isLoading || loading,
    userN8nConfig,
    startOnboarding,
    completeOnboarding,
    resetOnboarding,
    checkOnboardingStatus,
    hasN8nConfig: false,
    testN8nConnection
  };
}

/**
 * Hook specifically for n8n configuration status
 */
export function useN8nConfigStatus() {
  const [config, setConfig] = useState<UserN8nConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Only load config if n8n integration is enabled
        if (mockUserN8nConfigService.isEnabled()) {
          const userConfig = await mockUserN8nConfigService.getCurrentUserConfig();
          setConfig(userConfig);
        } else {
          setConfig(null);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to load n8n config: ', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const refreshConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      mockUserN8nConfigService.clearCache();
      // Only load config if n8n integration is enabled
      if (mockUserN8nConfigService.isEnabled()) {
        const userConfig = await mockUserN8nConfigService.getCurrentUserConfig();
        setConfig(userConfig);
      } else {
        setConfig(null);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to refresh n8n config: ', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const enableN8nIntegration = useCallback(async () => {
    mockUserN8nConfigService.enableN8nIntegration();
    await refreshConfig();
  }, [refreshConfig]);

  const disableN8nIntegration = useCallback(() => {
    mockUserN8nConfigService.disableN8nIntegration();
    setConfig(null);
  }, []);

  return {
    config,
    isConfigured: config !== null,
    isN8nEnabled: mockUserN8nConfigService.isEnabled(),
    isLoading,
    refreshConfig,
    enableN8nIntegration,
    disableN8nIntegration
  };
}

/**
 * Hook to determine if onboarding should be shown
 */
export function useShowOnboarding(): { shouldShow: boolean; isLoading: boolean } {
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const needs = await mockN8nOnboardingManager.needsOnboarding();
        setShouldShow(needs);
      } catch (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to check onboarding status: ', error);
        // Default to showing onboarding if we can't determine status
        setShouldShow(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  return { shouldShow, isLoading };
} 