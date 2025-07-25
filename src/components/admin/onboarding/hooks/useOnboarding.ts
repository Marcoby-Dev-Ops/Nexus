import { useCallback } from 'react';

interface UseOnboardingReturn {
  completeStep: (step: string) => void;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const completeStep = useCallback((step: string) => {
    // TODO: Implement actual onboarding step completion logic
    // For now, just log the step completion
    console.log(`Onboarding step completed: ${step}`);
  }, []);

  return {
    completeStep,
  };
}; 