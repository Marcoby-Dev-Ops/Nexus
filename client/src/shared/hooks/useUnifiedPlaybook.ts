/**
 * Unified Playbook Hook
 * 
 * Single hook for all playbook functionality:
 * - Playbook templates (blueprints)
 * - User journeys (active instances)
 * - Onboarding (specialized playbook type)
 * 
 * Replaces: useOnboardingService, useOnboardingProgress, useJourney, etc.
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/shared/hooks/useUser';
import { unifiedPlaybookService, type PlaybookTemplate, type UserJourney } from '@/services/playbook/UnifiedPlaybookService';
import { logger } from '@/shared/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface UseUnifiedPlaybookOptions {
  playbookId?: string;
  autoStart?: boolean;
  onComplete?: (journey: UserJourney) => void;
  onError?: (error: string) => void;
}

export interface PlaybookState {
  // Template data
  template: PlaybookTemplate | null;
  
  // User journey data
  journey: UserJourney | null;
  
  // Loading states
  loadingTemplate: boolean;
  loadingJourney: boolean;
  saving: boolean;
  
  // Error states
  error: string | null;
  
  // Computed values
  currentStep: number;
  totalSteps: number;
  progressPercentage: number;
  isCompleted: boolean;
  isStarted: boolean;
}

export interface PlaybookActions {
  // Template operations
  loadTemplate: (playbookId: string) => Promise<void>;
  
  // Journey operations
  startJourney: (playbookId?: string, metadata?: Record<string, any>) => Promise<void>;
  completeStep: (stepId: string, response: Record<string, any>) => Promise<void>;
  updateJourney: (updates: Partial<UserJourney>) => Promise<void>;
  pauseJourney: () => Promise<void>;
  resumeJourney: () => Promise<void>;
  resetJourney: () => Promise<void>;
  
  // Onboarding shortcuts
  startOnboarding: () => Promise<void>;
  completeOnboardingStep: (stepId: string, data: Record<string, any>) => Promise<void>;
  getOnboardingStatus: () => Promise<{
    isCompleted: boolean;
    progressPercentage: number;
    currentStep: number;
    totalSteps: number;
  }>;
  
  // Utility operations
  getJourneyAnalytics: () => Promise<{
    totalJourneys: number;
    completedJourneys: number;
    activeJourneys: number;
    averageProgress: number;
  }>;
  
  // Error handling
  clearError: () => void;
}

// ============================================================================
// UNIFIED PLAYBOOK HOOK
// ============================================================================

export function useUnifiedPlaybook(options: UseUnifiedPlaybookOptions = {}): PlaybookState & PlaybookActions {
  const { user } = useUser();
  const { playbookId, autoStart = false, onComplete, onError } = options;

  // State
  const [template, setTemplate] = useState<PlaybookTemplate | null>(null);
  const [journey, setJourney] = useState<UserJourney | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadingJourney, setLoadingJourney] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const currentStep = journey?.currentStep || 0;
  const totalSteps = template?.steps.length || 0;
  const progressPercentage = journey?.progressPercentage || 0;
  const isCompleted = journey?.status === 'completed';
  const isStarted = journey?.status === 'in_progress' || journey?.status === 'completed';

  // ============================================================================
  // TEMPLATE OPERATIONS
  // ============================================================================

  const loadTemplate = useCallback(async (templateId: string) => {
    if (!user?.id) return;

    setLoadingTemplate(true);
    setError(null);

    try {
      const response = await unifiedPlaybookService.getPlaybookTemplate(templateId);
      
      if (!response.success || !response.data) {
        throw new Error(`Template ${templateId} not found`);
      }

      setTemplate(response.data);
      logger.info('Template loaded successfully', { templateId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load template';
      setError(errorMessage);
      onError?.(errorMessage);
      logger.error('Failed to load template:', err);
    } finally {
      setLoadingTemplate(false);
    }
  }, [user?.id, onError]);

  // ============================================================================
  // JOURNEY OPERATIONS
  // ============================================================================

  const startJourney = useCallback(async (journeyPlaybookId?: string, metadata?: Record<string, any>) => {
    if (!user?.id) return;

    const targetPlaybookId = journeyPlaybookId || playbookId;
    if (!targetPlaybookId) {
      throw new Error('No playbook ID provided');
    }

    setLoadingJourney(true);
    setError(null);

    try {
      const response = await unifiedPlaybookService.startJourney(user.id, targetPlaybookId, metadata);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to start journey');
      }

      setJourney(response.data);
      logger.info('Journey started successfully', { playbookId: targetPlaybookId, journeyId: response.data.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start journey';
      setError(errorMessage);
      onError?.(errorMessage);
      logger.error('Failed to start journey:', err);
    } finally {
      setLoadingJourney(false);
    }
  }, [user?.id, playbookId, onError]);

  const completeStep = useCallback(async (stepId: string, response: Record<string, any>) => {
    if (!user?.id || !journey?.id) return;

    setSaving(true);
    setError(null);

    try {
      const result = await unifiedPlaybookService.completeStep(journey.id, stepId, response);
      
      if (!result.success || !result.data) {
        throw new Error('Failed to complete step');
      }

      setJourney(result.data);
      logger.info('Step completed successfully', { stepId, journeyId: journey.id });

      // Check if journey is completed
      if (result.data.status === 'completed') {
        onComplete?.(result.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete step';
      setError(errorMessage);
      onError?.(errorMessage);
      logger.error('Failed to complete step:', err);
    } finally {
      setSaving(false);
    }
  }, [user?.id, journey?.id, onComplete, onError]);

  const updateJourney = useCallback(async (updates: Partial<UserJourney>) => {
    if (!journey?.id) return;

    setSaving(true);
    setError(null);

    try {
      const result = await unifiedPlaybookService.updateJourneyProgress(journey.id, updates);
      
      if (!result.success || !result.data) {
        throw new Error('Failed to update journey');
      }

      setJourney(result.data);
      logger.info('Journey updated successfully', { journeyId: journey.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update journey';
      setError(errorMessage);
      onError?.(errorMessage);
      logger.error('Failed to update journey:', err);
    } finally {
      setSaving(false);
    }
  }, [journey?.id, onError]);

  const pauseJourney = useCallback(async () => {
    await updateJourney({ status: 'paused' });
  }, [updateJourney]);

  const resumeJourney = useCallback(async () => {
    await updateJourney({ status: 'in_progress' });
  }, [updateJourney]);

  const resetJourney = useCallback(async () => {
    if (!journey?.id) return;

    setSaving(true);
    setError(null);

    try {
      // Delete current journey and start fresh
      // TODO: Implement journey deletion in service
      setJourney(null);
      logger.info('Journey reset successfully', { journeyId: journey.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset journey';
      setError(errorMessage);
      onError?.(errorMessage);
      logger.error('Failed to reset journey:', err);
    } finally {
      setSaving(false);
    }
  }, [journey?.id, onError]);

  // ============================================================================
  // ONBOARDING SHORTCUTS
  // ============================================================================

  const startOnboarding = useCallback(async () => {
    if (!user?.id) return;

    setLoadingJourney(true);
    setError(null);

    try {
      const response = await unifiedPlaybookService.startOnboarding(user.id);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to start onboarding');
      }

      setJourney(response.data);
      logger.info('Onboarding started successfully', { userId: user.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start onboarding';
      setError(errorMessage);
      onError?.(errorMessage);
      logger.error('Failed to start onboarding:', err);
    } finally {
      setLoadingJourney(false);
    }
  }, [user?.id, onError]);

  const completeOnboardingStep = useCallback(async (stepId: string, data: Record<string, any>) => {
    if (!user?.id) return;

    setSaving(true);
    setError(null);

    try {
      const result = await unifiedPlaybookService.completeOnboardingStep(user.id, stepId, data);
      
      if (!result.success || !result.data) {
        throw new Error('Failed to complete onboarding step');
      }

      setJourney(result.data);
      logger.info('Onboarding step completed', { stepId, userId: user.id });

      if (result.data.status === 'completed') {
        onComplete?.(result.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete onboarding step';
      setError(errorMessage);
      onError?.(errorMessage);
      logger.error('Failed to complete onboarding step:', err);
    } finally {
      setSaving(false);
    }
  }, [user?.id, onComplete, onError]);

  const getOnboardingStatus = useCallback(async () => {
    if (!user?.id) {
      return {
        isCompleted: false,
        progressPercentage: 0,
        currentStep: 0,
        totalSteps: 0
      };
    }

    try {
      const response = await unifiedPlaybookService.getOnboardingStatus(user.id);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to get onboarding status');
      }

      return response.data;
    } catch (err) {
      logger.error('Failed to get onboarding status:', err);
      return {
        isCompleted: false,
        progressPercentage: 0,
        currentStep: 0,
        totalSteps: 0
      };
    }
  }, [user?.id]);

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  const getJourneyAnalytics = useCallback(async () => {
    if (!user?.id) {
      return {
        totalJourneys: 0,
        completedJourneys: 0,
        activeJourneys: 0,
        averageProgress: 0
      };
    }

    try {
      const response = await unifiedPlaybookService.getJourneyAnalytics(user.id);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to get journey analytics');
      }

      return response.data;
    } catch (err) {
      logger.error('Failed to get journey analytics:', err);
      return {
        totalJourneys: 0,
        completedJourneys: 0,
        activeJourneys: 0,
        averageProgress: 0
      };
    }
  }, [user?.id]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load template if playbookId is provided
  useEffect(() => {
    if (playbookId && user?.id) {
      loadTemplate(playbookId);
    }
  }, [playbookId, user?.id, loadTemplate]);

  // Auto-start journey if enabled
  useEffect(() => {
    if (autoStart && playbookId && user?.id && template && !journey) {
      startJourney();
    }
  }, [autoStart, playbookId, user?.id, template, journey, startJourney]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    template,
    journey,
    loadingTemplate,
    loadingJourney,
    saving,
    error,
    currentStep,
    totalSteps,
    progressPercentage,
    isCompleted,
    isStarted,

    // Actions
    loadTemplate,
    startJourney,
    completeStep,
    updateJourney,
    pauseJourney,
    resumeJourney,
    resetJourney,
    startOnboarding,
    completeOnboardingStep,
    getOnboardingStatus,
    getJourneyAnalytics,
    clearError
  };
}

// ============================================================================
// LEGACY EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Legacy onboarding hook
export const useOnboardingService = (options?: UseUnifiedPlaybookOptions) => {
  const hook = useUnifiedPlaybook({ ...options, playbookId: 'onboarding-v1' });
  
  return {
    ...hook,
    // Legacy method names
    saveStep: hook.completeStep,
    saveOnboardingStep: hook.completeOnboardingStep,
    getOnboardingProgress: hook.getOnboardingStatus,
    completeOnboarding: hook.completeStep
  };
};

// Legacy journey hook
export const useJourney = (playbookId?: string, options?: UseUnifiedPlaybookOptions) => {
  return useUnifiedPlaybook({ ...options, playbookId });
};

// Legacy playbook hook
export const usePlaybook = (playbookId?: string, options?: UseUnifiedPlaybookOptions) => {
  return useUnifiedPlaybook({ ...options, playbookId });
};
