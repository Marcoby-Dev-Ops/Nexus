import React from 'react';
import { OnboardingFlow } from '@/domains/admin/onboarding/components/OnboardingFlow';
import { useOnboarding } from '@/domains/admin/onboarding/hooks/useOnboarding';

interface AppWithOnboardingProps {
  children: React.ReactNode;
}

/**
 * AppWithOnboarding
 * Wrap your app with this to enforce onboarding for new users.
 * Shows the onboarding flow if needed, otherwise renders the main app.
 */
export const AppWithOnboarding: React.FC<AppWithOnboardingProps> = ({ children }) => {
  const { needsOnboarding, isLoading, completeOnboarding } = useOnboarding();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (needsOnboarding) {
    return (
      <OnboardingFlow onComplete={completeOnboarding} />
    );
  }

  return <>{children}</>;
}; 