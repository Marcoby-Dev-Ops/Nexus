import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';

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
  const { user } = useAuth();
  const [steps, setSteps] = useState<Record<OnboardingStep, boolean>>(() => {
    try {
      const savedState = localStorage.getItem(`onboarding_steps_${user?.id}`);
      return savedState ? JSON.parse(savedState) : initialSteps;
    } catch {
      return initialSteps;
    }
  });

  const [isOpen, setIsOpen] = useState(true);
  
  const isCompleted = Object.values(steps).every(Boolean);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`onboarding_steps_${user.id}`, JSON.stringify(steps));
    }
    if (isCompleted) {
      setIsOpen(false);
    }
  }, [steps, user?.id, isCompleted]);

  const completeStep = useCallback((step: OnboardingStep) => {
    setSteps(prev => ({ ...prev, [step]: true }));
  }, []);

  const toggleChecklist = () => setIsOpen(prev => !prev);
  const closeChecklist = () => setIsOpen(false);

  // Do not render the provider content if the user has completed onboarding
  if (user?.onboardingCompleted) {
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