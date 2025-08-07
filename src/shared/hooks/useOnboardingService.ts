/**
 * Onboarding Service Hook
 * 
 * React hook for managing onboarding data collection and persistence
 * Uses the OnboardingService for all database operations
 */

import { useState, useCallback } from 'react';
import { onboardingService, type OnboardingData, type OnboardingResult } from '@/shared/services/OnboardingService';
import { logger } from '@/shared/utils/logger';

export interface UseOnboardingServiceReturn {
  // Existing methods
  saveStep: (stepId: string, data: Partial<OnboardingData>) => Promise<boolean>;
  completeOnboarding: (data: OnboardingData) => Promise<boolean>;
  getOnboardingStatus: (userId: string) => Promise<any>;
  resetOnboarding: (userId: string) => Promise<boolean>;
  
  // New 5-phase orchestration methods
  getOnboardingProgress: (userId: string) => Promise<any>;
  completeOnboardingPhase: (userId: string, phaseId: string, phaseData: any) => Promise<any>;
  getPhaseConfiguration: (phaseId: string) => Promise<any>;
  validateStepData: (stepId: string, data: any) => Promise<any>;
  
  // State
  isProcessing: boolean;
  error: string | null;
  progress: any;
  currentPhase: string | null;
  currentStep: string | null;
}

export function useOnboardingService(): UseOnboardingServiceReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const saveStep = useCallback(async (stepId: string, data: Partial<OnboardingData>): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    try {
      logger.info('Attempting to save step', { stepId, data });
      
      const result = await onboardingService.saveOnboardingStep(
        data.userId || '',
        stepId,
        data
      );

      if (!result.success) {
        logger.error('Step save failed', { stepId, data, error: result.error });
        setError(result.error || 'Failed to save step');
        return false;
      }

      logger.info('Step saved successfully', { stepId, userId: data.userId });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Failed to save step:', err);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const completeOnboarding = useCallback(async (data: OnboardingData): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await onboardingService.completeOnboarding(
        data.userId,
        data
      );

      if (!result.success) {
        setError(result.error || 'Failed to complete onboarding');
        return false;
      }

      logger.info('Onboarding completed successfully', { userId: data.userId });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Failed to complete onboarding:', err);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const getOnboardingStatus = useCallback(async (userId: string): Promise<any> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await onboardingService.getOnboardingStatus(userId);

      if (!result.success) {
        setError(result.error || 'Failed to get onboarding status');
        return null;
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Failed to get onboarding status:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const resetOnboarding = useCallback(async (userId: string): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await onboardingService.resetOnboarding(userId);

      if (!result.success) {
        setError(result.error || 'Failed to reset onboarding');
        return false;
      }

      logger.info('Onboarding reset successfully', { userId });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Failed to reset onboarding:', err);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // New 5-phase orchestration methods
  const getOnboardingProgress = useCallback(async (userId: string): Promise<any> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await onboardingService.getOnboardingProgress(userId);

      if (!result.success) {
        setError(result.error || 'Failed to get onboarding progress');
        return null;
      }

      setProgress(result.data);
      setCurrentPhase(result.data.currentPhase);
      setCurrentStep(result.data.currentStep);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Failed to get onboarding progress:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const completeOnboardingPhase = useCallback(async (
    userId: string, 
    phaseId: string, 
    phaseData: any
  ): Promise<any> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await onboardingService.completeOnboardingPhase(
        userId,
        phaseId,
        phaseData
      );

      if (!result.success) {
        setError(result.error || 'Failed to complete onboarding phase');
        return null;
      }

      logger.info('Onboarding phase completed successfully', { userId, phaseId });
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Failed to complete onboarding phase:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const getPhaseConfiguration = useCallback(async (phaseId: string): Promise<any> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await onboardingService.getPhaseConfiguration(phaseId);

      if (!result.success) {
        setError(result.error || 'Failed to get phase configuration');
        return null;
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Failed to get phase configuration:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const validateStepData = useCallback(async (stepId: string, data: any): Promise<any> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await onboardingService.validateStepData(stepId, data);

      if (!result.success) {
        setError(result.error || 'Failed to validate step data');
        return null;
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Failed to validate step data:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    saveStep,
    completeOnboarding,
    getOnboardingStatus,
    resetOnboarding,
    getOnboardingProgress,
    completeOnboardingPhase,
    getPhaseConfiguration,
    validateStepData,
    isProcessing,
    error,
    progress,
    currentPhase,
    currentStep
  };
} 