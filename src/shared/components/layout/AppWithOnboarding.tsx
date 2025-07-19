import React from 'react';
import { useLocation } from 'react-router-dom';
import { OnboardingFlow } from '@/domains/admin/onboarding/components/OnboardingFlow';
import { useOnboarding } from '@/domains/admin/onboarding/hooks/useOnboarding';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { 
  shouldShowOnboarding, 
  shouldShowOnboardingLoading,
  getOnboardingConfig 
} from '@/shared/config/onboardingConfig';

interface AppWithOnboardingProps {
  children: React.ReactNode;
}

/**
 * AppWithOnboarding
 * 
 * Permanent solution using centralized configuration:
 * - Uses onboardingConfig for all decision logic
 * - Graceful handling of all edge cases
 * - Comprehensive debugging in development
 * - No temporary fixes or workarounds
 */
export const AppWithOnboarding: React.FC<AppWithOnboardingProps> = ({ children }) => {
  const { needsOnboarding, isLoading, completeOnboarding } = useOnboarding();
  const { user, session, initialized } = useAuth();
  const location = useLocation();
  const config = getOnboardingConfig();

  // Use centralized configuration for all decisions
  const shouldShowOnboardingFlow = shouldShowOnboarding(
    location.pathname,
    user,
    session,
    initialized,
    needsOnboarding,
    isLoading
  );

  const shouldShowLoading = shouldShowOnboardingLoading(
    location.pathname,
    initialized,
    isLoading
  );

  // Debug logging in development
  if (config.debugMode) {
    console.log('AppWithOnboarding Debug:', {
      pathname: location.pathname,
      hasUser: !!user,
      hasSession: !!session,
      initialized,
      isLoading,
      needsOnboarding,
      shouldShowOnboardingFlow,
      shouldShowLoading,
      config: {
        enabled: config.enabled,
        skipForPublicRoutes: config.skipForPublicRoutes,
        requireAuthentication: config.requireAuthentication,
        requireSession: config.requireSession,
        requireInitialization: config.requireInitialization
      }
    });
  }

  // Show loading for protected routes during initialization
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding for eligible users
  if (shouldShowOnboardingFlow) {
    return (
      <OnboardingFlow onComplete={completeOnboarding} />
    );
  }

  // Show main app for all other cases
  return <>{children}</>;
}; 