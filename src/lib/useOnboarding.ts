/**
 * useOnboarding.ts
 * React hook for managing onboarding state and user n8n configuration
 * Provides easy integration of onboarding flow into the main app
 */
import { useState, useEffect, useCallback } from 'react';
import { n8nOnboardingManager } from './n8nOnboardingManager';
import { userN8nConfigService } from './userN8nConfig';
import type { OnboardingState } from './n8nOnboardingManager';
import type { UserN8nConfig } from './userN8nConfig';

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
 * Main onboarding hook
 */
export function useOnboarding(): UseOnboardingReturn {
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userN8nConfig, setUserN8nConfig] = useState<UserN8nConfig | null>(null);

  // Load initial state
  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        setIsLoading(true);
        
        // Initialize onboarding manager
        await n8nOnboardingManager.initialize();
        
        // Get current state
        const state = await n8nOnboardingManager.getOnboardingState();
        setOnboardingState(state);
        setNeedsOnboarding(!state.isComplete);
        
        // Load user n8n config
        const config = await userN8nConfigService.getCurrentUserConfig();
        setUserN8nConfig(config);
        
      } catch (error) {
        console.error('Failed to initialize onboarding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeOnboarding();

    // Subscribe to onboarding state changes
    const unsubscribe = n8nOnboardingManager.subscribe((state) => {
      setOnboardingState(state);
      setNeedsOnboarding(!state.isComplete);
    });

    return unsubscribe;
  }, []);

  const checkOnboardingStatus = useCallback(async () => {
    const state = await n8nOnboardingManager.getOnboardingState();
    setOnboardingState(state);
    setNeedsOnboarding(!state.isComplete);
    
    const config = await userN8nConfigService.getCurrentUserConfig();
    setUserN8nConfig(config);
  }, []);

  const startOnboarding = useCallback(() => {
    setNeedsOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await n8nOnboardingManager.completeStep('complete');
    setNeedsOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await n8nOnboardingManager.resetOnboarding();
    setNeedsOnboarding(true);
  }, []);

  const testN8nConnection = useCallback(async (baseUrl: string, apiKey: string) => {
    return await userN8nConfigService.testConnection(baseUrl, apiKey);
  }, []);

  return {
    // State
    onboardingState,
    needsOnboarding,
    isLoading,
    userN8nConfig,
    
    // Actions
    startOnboarding,
    completeOnboarding,
    resetOnboarding,
    checkOnboardingStatus,
    
    // n8n specific
    hasN8nConfig: userN8nConfig !== null,
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
        if (userN8nConfigService.isEnabled()) {
          const userConfig = await userN8nConfigService.getCurrentUserConfig();
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
      userN8nConfigService.clearCache();
      // Only load config if n8n integration is enabled
      if (userN8nConfigService.isEnabled()) {
        const userConfig = await userN8nConfigService.getCurrentUserConfig();
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
    userN8nConfigService.enableN8nIntegration();
    await refreshConfig();
  }, [refreshConfig]);

  const disableN8nIntegration = useCallback(() => {
    userN8nConfigService.disableN8nIntegration();
    setConfig(null);
  }, []);

  return {
    config,
    isConfigured: config !== null,
    isN8nEnabled: userN8nConfigService.isEnabled(),
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
        const needs = await n8nOnboardingManager.needsOnboarding();
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