/**
 * useOnboarding.ts
 * React hook for managing onboarding state and user n8n configuration
 * Provides easy integration of onboarding flow into the main app
 */
import { useState, useEffect, useCallback } from 'react';
import { safeGetLocalStorage, safeSetLocalStorage } from '@/shared/utils/storageUtils';

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
 * Main onboarding hook - MODIFIED TO DISABLE ONBOARDING
 */
export function useOnboarding(): UseOnboardingReturn {
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [userN8nConfig, setUserN8nConfig] = useState<UserN8nConfig | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load onboarding status from localStorage
  useEffect(() => {
    const loadStatus = async () => {
      const completed = safeGetLocalStorage<boolean>('nexus_onboarding_complete', false);
      setNeedsOnboarding(!completed);
      setIsLoading(false);
    };
    loadStatus();
  }, []);

  const startOnboarding = useCallback(() => {
    setNeedsOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    safeSetLocalStorage('nexus_onboarding_complete', true);
    setNeedsOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    safeSetLocalStorage('nexus_onboarding_complete', false);
    setNeedsOnboarding(true);
  }, []);

  const checkOnboardingStatus = useCallback(async () => {
    setIsLoading(true);
    const completed = safeGetLocalStorage<boolean>('nexus_onboarding_complete', false);
    setNeedsOnboarding(!completed);
    setIsLoading(false);
  }, []);

  const testN8nConnection = useCallback(async (baseUrl: string, apiKey: string) => {
    return { success: true };
  }, []);

  return {
    onboardingState,
    needsOnboarding,
    isLoading,
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
        console.error('Failed to load n8n config:', error);
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
      console.error('Failed to refresh n8n config:', error);
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
        console.error('Failed to check onboarding status:', error);
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