import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/shared/utils/logger';

export interface OnboardingState {
  // Core onboarding status
  isCompleted: boolean;
  
  // Current step tracking
  currentStep: number;
  totalSteps: number;
  
  // Step completion status
  completedSteps: string[];
  
  // User-specific data
  userId?: string;
  
  // Actions
  setCompleted: (completed: boolean) => void;
  setCurrentStep: (step: number) => void;
  completeStep: (stepId: string) => void;
  resetOnboarding: () => void;
  initializeForUser: (userId: string) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      isCompleted: false,
      currentStep: 0,
      totalSteps: 4,
      completedSteps: [],
      userId: undefined,

      // Actions
      setCompleted: (completed: boolean) => {
        // Validate required parameters
        if (typeof completed !== 'boolean') {
          logger.error('Completed status must be a boolean');
          return;
        }

        try {
          set({ isCompleted: completed });
          logger.info('Onboarding completion status updated', { completed });
        } catch (error) {
          logger.error('Failed to set onboarding completion status:', error);
        }
      },

      setCurrentStep: (step: number) => {
        // Validate required parameters
        if (typeof step !== 'number' || step < 0) {
          logger.error('Step must be a non-negative number');
          return;
        }

        try {
          set({ currentStep: step });
          logger.info('Onboarding current step updated', { step });
        } catch (error) {
          logger.error('Failed to set onboarding current step:', error);
        }
      },

      completeStep: (stepId: string) => {
        // Validate required parameters
        if (!stepId || typeof stepId !== 'string') {
          logger.error('Step ID is required and must be a string');
          return;
        }

        try {
          const { completedSteps } = get();
          if (!completedSteps.includes(stepId)) {
            const newCompletedSteps = [...completedSteps, stepId];
            set({ completedSteps: newCompletedSteps });
            
            // Check if all steps are complete
            if (newCompletedSteps.length >= get().totalSteps) {
              set({ isCompleted: true });
              logger.info('All onboarding steps completed');
            }
            
            logger.info('Onboarding step completed', { stepId, totalCompleted: newCompletedSteps.length });
          } else {
            logger.warn('Step already completed', { stepId });
          }
        } catch (error) {
          logger.error('Failed to complete onboarding step:', error);
        }
      },

      resetOnboarding: () => {
        try {
          set({
            isCompleted: false,
            currentStep: 0,
            completedSteps: [],
          });
          logger.info('Onboarding reset');
        } catch (error) {
          logger.error('Failed to reset onboarding:', error);
        }
      },

      initializeForUser: (userId: string) => {
        // Validate required parameters
        if (!userId || typeof userId !== 'string') {
          logger.error('User ID is required and must be a string');
          return;
        }

        try {
          set({ userId });
          logger.info('Onboarding initialized for user', { userId });
        } catch (error) {
          logger.error('Failed to initialize onboarding for user:', error);
        }
      },
    }),
    {
      name: 'nexus-onboarding-state', // Single localStorage key
      partialize: (state) => ({
        isCompleted: state.isCompleted,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        userId: state.userId,
      }),
    }
  )
);

// Utility functions for external access
export const clearAllOnboardingState = () => {
  try {
    useOnboardingStore.getState().resetOnboarding();
    logger.info('All onboarding state cleared');
  } catch (error) {
    logger.error('Failed to clear onboarding state:', error);
  }
};

export const getOnboardingState = () => {
  try {
    return useOnboardingStore.getState();
  } catch (error) {
    logger.error('Failed to get onboarding state:', error);
    return null;
  }
};

export const setOnboardingCompleted = (completed: boolean) => {
  // Validate required parameters
  if (typeof completed !== 'boolean') {
    logger.error('Completed status must be a boolean');
    return;
  }

  try {
    useOnboardingStore.getState().setCompleted(completed);
  } catch (error) {
    logger.error('Failed to set onboarding completed status:', error);
  }
}; 
