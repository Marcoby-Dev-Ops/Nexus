import { useOnboardingStore } from '@/shared/stores/onboardingStore';
import { logger } from '@/shared/utils/logger';

/**
 * Trigger onboarding flow
 */
export const triggerOnboarding = (): void => {
  try {
    const store = useOnboardingStore.getState();
    store.setCompleted(false);
    store.setCurrentStep(0);
    logger.info('Onboarding flow triggered');
  } catch (error) {
    logger.error('Failed to trigger onboarding flow:', error);
  }
};

/**
 * Complete onboarding step
 */
export const completeOnboardingStep = (stepId: string): void => {
  // Validate required parameters
  if (!stepId || typeof stepId !== 'string') {
    logger.error('Step ID is required and must be a string');
    return;
  }

  try {
    const store = useOnboardingStore.getState();
    store.completeStep(stepId);
    logger.info('Onboarding step completed', { stepId });
  } catch (error) {
    logger.error('Failed to complete onboarding step:', error);
  }
};

/**
 * Reset onboarding
 */
export const resetOnboarding = (): void => {
  try {
    const store = useOnboardingStore.getState();
    store.resetOnboarding();
    logger.info('Onboarding reset');
  } catch (error) {
    logger.error('Failed to reset onboarding:', error);
  }
};

/**
 * Get onboarding status
 */
export const getOnboardingStatus = (): { isCompleted: boolean; currentStep: number } => {
  try {
    const store = useOnboardingStore.getState();
    return {
      isCompleted: store.isCompleted,
      currentStep: store.currentStep
    };
  } catch (error) {
    logger.error('Failed to get onboarding status:', error);
    return { isCompleted: false, currentStep: 0 };
  }
};

/**
 * Set onboarding completed status
 */
export const setOnboardingCompleted = (completed: boolean): void => {
  // Validate required parameters
  if (typeof completed !== 'boolean') {
    logger.error('Completed status must be a boolean');
    return;
  }

  try {
    const store = useOnboardingStore.getState();
    store.setCompleted(completed);
    logger.info('Onboarding completion status updated', { completed });
  } catch (error) {
    logger.error('Failed to set onboarding completion status:', error);
  }
};

/**
 * Get onboarding data
 */
export const getOnboardingData = (): any => {
  try {
    const store = useOnboardingStore.getState();
    return {
      isCompleted: store.isCompleted,
      currentStep: store.currentStep,
      totalSteps: store.totalSteps,
      completedSteps: store.completedSteps,
      userId: store.userId
    };
  } catch (error) {
    logger.error('Failed to get onboarding data:', error);
    return null;
  }
}; 
