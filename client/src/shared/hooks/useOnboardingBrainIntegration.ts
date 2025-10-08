/**
 * useOnboardingBrainIntegration Hook
 * 
 * Provides easy access to onboarding brain integration functionality.
 * This hook manages the transformation of onboarding data into unified brain system state
 * for personalized chat experiences.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { onboardingBrainIntegration, type BrainContextData, type ChatContextEnhancement } from '@/shared/services/OnboardingBrainIntegrationService';
import { logger } from '@/shared/utils/logger';

interface UseOnboardingBrainIntegrationReturn {
  // State
  brainContext: BrainContextData | null;
  chatEnhancement: ChatContextEnhancement | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshBrainContext: () => Promise<void>;
  getPersonalizedPrompt: (agentType?: string) => Promise<string>;
  enhanceChatContext: (basePrompt?: string) => Promise<ChatContextEnhancement | null>;
  clearCache: () => void;
}

/**
 * Hook for integrating onboarding data with the brain system
 */
export function useOnboardingBrainIntegration(): UseOnboardingBrainIntegrationReturn {
  const { user } = useAuth();
  const [brainContext, setBrainContext] = useState<BrainContextData | null>(null);
  const [chatEnhancement, setChatEnhancement] = useState<ChatContextEnhancement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load brain context when user changes
  useEffect(() => {
    if (user?.id) {
      loadBrainContext();
    } else {
      setBrainContext(null);
      setChatEnhancement(null);
    }
  }, [user?.id]);

  /**
   * Load brain context from onboarding data
   */
  const loadBrainContext = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await onboardingBrainIntegration.getOnboardingContext(user.id);
      
      if (response.success && response.data) {
        setBrainContext(response.data);
        
        // Also create chat enhancement
        const enhancementResponse = await onboardingBrainIntegration.enhanceChatContext(user.id);
        if (enhancementResponse.success && enhancementResponse.data) {
          setChatEnhancement(enhancementResponse.data);
        }
        
        logger.info('Successfully loaded brain context', { 
          userId: user.id,
          hasBusinessContext: !!response.data.businessContext,
          hasGoals: response.data.goals.primary.length > 0
        });
      } else {
        setError(response.error || 'Failed to load brain context');
        logger.warn('Failed to load brain context', { userId: user.id, error: response.error });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading brain context';
      setError(errorMessage);
      logger.error('Error loading brain context', { userId: user.id, error: err });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Refresh brain context (useful after onboarding updates)
   */
  const refreshBrainContext = useCallback(async () => {
    if (!user?.id) return;
    
    // Clear cache first
    onboardingBrainIntegration.clearUserCache(user.id);
    
    // Reload
    await loadBrainContext();
  }, [user?.id, loadBrainContext]);

  /**
   * Get personalized system prompt for specific agent type
   */
  const getPersonalizedPrompt = useCallback(async (agentType: string = 'executive'): Promise<string> => {
    if (!user?.id) {
      return 'You are an AI assistant helping with business operations.';
    }

    try {
      const response = await onboardingBrainIntegration.getPersonalizedSystemPrompt(user.id, agentType);
      return response.success ? response.data : 'You are an AI assistant helping with business operations.';
    } catch (err) {
      logger.error('Error getting personalized prompt', { userId: user.id, error: err });
      return 'You are an AI assistant helping with business operations.';
    }
  }, [user?.id]);

  /**
   * Enhance chat context with onboarding data
   */
  const enhanceChatContext = useCallback(async (basePrompt?: string): Promise<ChatContextEnhancement | null> => {
    if (!user?.id) return null;

    try {
      const response = await onboardingBrainIntegration.enhanceChatContext(user.id, basePrompt);
      return response.success ? response.data : null;
    } catch (err) {
      logger.error('Error enhancing chat context', { userId: user.id, error: err });
      return null;
    }
  }, [user?.id]);

  /**
   * Clear local cache
   */
  const clearCache = useCallback(() => {
    if (user?.id) {
      onboardingBrainIntegration.clearUserCache(user.id);
    }
    setBrainContext(null);
    setChatEnhancement(null);
  }, [user?.id]);

  return {
    // State
    brainContext,
    chatEnhancement,
    loading,
    error,
    
    // Actions
    refreshBrainContext,
    getPersonalizedPrompt,
    enhanceChatContext,
    clearCache
  };
}
