import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
        set({ isCompleted: completed });
      },

      setCurrentStep: (step: number) => {
        set({ currentStep: step });
      },

      completeStep: (stepId: string) => {
        const { completedSteps } = get();
        if (!completedSteps.includes(stepId)) {
          const newCompletedSteps = [...completedSteps, stepId];
          set({ completedSteps: newCompletedSteps });
          
          // Check if all steps are complete
          if (newCompletedSteps.length >= get().totalSteps) {
            set({ isCompleted: true });
          }
        }
      },

      resetOnboarding: () => {
        set({
          isCompleted: false,
          currentStep: 0,
          completedSteps: [],
        });
      },

      initializeForUser: (userId: string) => {
        set({ userId });
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

// Utility functions for backward compatibility
export const clearAllOnboardingState = () => {
  // Clear all possible onboarding keys
  const keysToClear = [
    'nexus_onboarding_complete',
    'nexus_onboarding_step',
    'nexus_onboarding_state',
    'nexus_user_onboarding',
    'nexus_founder_profile',
    'nexus_user_context',
    'nexus_n8n_config',
    'nexus-onboarding-state', // Our new key
  ];

  keysToClear.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  // Clear any user-specific keys
  Object.keys(localStorage).forEach(key => {
    if (key.includes('onboarding_steps_') || key.includes('nexus_onboarding_steps_')) {
      localStorage.removeItem(key);
    }
  });

  // Reset the store
  useOnboardingStore.getState().resetOnboarding();
};

export const setOnboardingCompleted = (completed: boolean) => {
  useOnboardingStore.getState().setCompleted(completed);
  
  // Also set the legacy key for backward compatibility
  if (completed) {
    localStorage.setItem('nexus_onboarding_complete', 'true');
  } else {
    localStorage.removeItem('nexus_onboarding_complete');
  }
};

export const getOnboardingStatus = () => {
  const store = useOnboardingStore.getState();
  return {
    isCompleted: store.isCompleted,
    currentStep: store.currentStep,
    completedSteps: store.completedSteps,
  };
}; 