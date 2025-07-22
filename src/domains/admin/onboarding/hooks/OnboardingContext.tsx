import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { useOnboardingStore } from '@/shared/stores/onboardingStore';

type OnboardingStep = 
  | 'welcome'
  | 'company_profile'
  | 'connect_source'
  | 'ask_ai';

interface OnboardingState {
  steps: Record<OnboardingStep, boolean>;
  isOpen: boolean;
  isCompleted: boolean;
}

interface OnboardingContextType extends OnboardingState {
  completeStep: (step: OnboardingStep) => void;
  toggleChecklist: () => void;
  closeChecklist: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialSteps: Record<OnboardingStep, boolean> = {
  welcome: true, // The welcome screen is the first thing they see
  company_profile: false,
  connect_source: false,
  ask_ai: false,
};

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthContext();
  const { isCompleted: storeIsCompleted, setCompleted } = useOnboardingStore();
  
  const [steps, setSteps] = useState<Record<OnboardingStep, boolean>>(initialSteps);
  const [isOpen, setIsOpen] = useState(true);
  
  const isCompleted = Object.values(steps).every(Boolean);

  // Initialize store for user
  useEffect(() => {
    if (user?.id) {
      useOnboardingStore.getState().initializeForUser(user.id);
    }
  }, [user?.id]);

  // Sync with database onboarding status
  useEffect(() => {
    if (user?.onboardingCompleted !== undefined && user.onboardingCompleted !== null) {
      setCompleted(user.onboardingCompleted);
      if (user.onboardingCompleted) {
        setIsOpen(false);
      }
    }
  }, [user?.onboardingCompleted, setCompleted]);

  // Update store when steps are completed
  useEffect(() => {
    if (isCompleted) {
      setCompleted(true);
      setIsOpen(false);
    }
  }, [isCompleted, setCompleted]);

  const completeStep = useCallback((step: OnboardingStep) => {
    setSteps(prev => ({ ...prev, [step]: true }));
    // Also update the store
    useOnboardingStore.getState().completeStep(step);
  }, []);

  const toggleChecklist = () => setIsOpen(prev => !prev);
  const closeChecklist = () => setIsOpen(false);

  // Do not render the provider content if the user has completed onboarding
  if (user?.onboardingCompleted || storeIsCompleted) {
    return <>{children}</>;
  }

  const value = {
    steps,
    isOpen,
    isCompleted,
    completeStep,
    toggleChecklist,
    closeChecklist,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    // Return a default/mock state for users who have completed onboarding
    // This prevents errors when the provider is not rendered.
    return {
      steps: initialSteps,
      isOpen: false,
      isCompleted: true,
      completeStep: () => {},
      toggleChecklist: () => {},
      closeChecklist: () => {},
    };
  }
  return context;
}; 