/**
 * Onboarding Configuration
 * 
 * Centralized configuration for onboarding behavior across the application.
 * This provides a single source of truth for onboarding rules and settings.
 */

export interface OnboardingConfig {
  // Core Settings
  enabled: boolean;
  skipForPublicRoutes: boolean;
  skipForAuthenticatedUsers: boolean;
  skipForCompletedUsers: boolean;
  
  // Route Settings
  publicRoutes: string[];
  protectedRoutes: string[];
  onboardingRoutes: string[];
  
  // User Settings
  requireAuthentication: boolean;
  requireSession: boolean;
  requireInitialization: boolean;
  
  // Behavior Settings
  showLoadingDuringCheck: boolean;
  gracefulFallback: boolean;
  debugMode: boolean;
  
  // Storage Settings
  storageKey: string;
  storagePrefix: string;
}

export const onboardingConfig: OnboardingConfig = {
  // Core Settings
  enabled: true, // Re-enable onboarding for user info collection
  skipForPublicRoutes: true,
  skipForAuthenticatedUsers: false,
  skipForCompletedUsers: true,
  
  // Route Settings
  publicRoutes: [
    '/',
    '/login',
    '/signup',
    '/reset-password',
    '/waitlist',
    '/marketing',
    '/pricing',
    '/help',
    '/auth/callback',
    '/auth/google-analytics-callback',
    '/integrations/:integration/callback',
    '/email-not-verified'
  ],
  protectedRoutes: [
    '/dashboard',
    '/workspace',
    '/ai-hub',
    '/chat',
    '/ai-performance',
    '/business-setup',
    '/business-chat',
    '/analytics',
    '/data-warehouse',
    '/assessment',
    '/company-status',
    '/think',
    '/see',
    '/act',
    '/sales',
    '/finance',
    '/marketing',
    '/operations',
    '/support',
    '/hr',
    '/it',
    '/product',
    '/customer-success',
    '/legal',
    '/maturity',
    '/sales-performance',
    '/financial-operations',
    '/integrations',
    '/settings',
    '/profile',
    '/onboarding/company-profile',
    '/documents',
    '/admin',
    '/component/',
    '/home',
    '/knowledge'
  ],
  onboardingRoutes: [
    '/onboarding',
    '/onboarding/company-profile',
    '/onboarding/setup'
  ],
  
  // User Settings
  requireAuthentication: true,
  requireSession: true,
  requireInitialization: true,
  
  // Behavior Settings
  showLoadingDuringCheck: false, // Disable loading check
  gracefulFallback: true,
  debugMode: import.meta.env.DEV,
  
  // Storage Settings
  storageKey: 'nexus_onboarding_complete',
  storagePrefix: 'nexus_onboarding'
};

/**
 * Get onboarding configuration with environment-specific overrides
 */
export const getOnboardingConfig = (): OnboardingConfig => {
  const config = { ...onboardingConfig };
  
  // Development overrides
  if (import.meta.env.DEV) {
    config.debugMode = true;
  }
  
  // Production overrides
  if (import.meta.env.PROD) {
    config.debugMode = false;
  }
  
  return config;
};

/**
 * Check if onboarding should be shown for a specific route and user state
 */
export const shouldShowOnboarding = (
  pathname: string,
  user: any,
  session: any,
  initialized: boolean,
  needsOnboarding: boolean,
  isLoading: boolean
): boolean => {
  const config = getOnboardingConfig();
  
  // If onboarding is disabled globally, never show it
  if (!config.enabled) {
    return false;
  }
  
  // Check if we're on a public route
  const isPublicRoute = config.publicRoutes.some(route => {
    if (route.includes(':')) {
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
  
  // Check if we're on a protected route
  const isProtectedRoute = config.protectedRoutes.some(route => {
    if (route.includes(':')) {
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
  
  // Skip for public routes if configured
  if (config.skipForPublicRoutes && isPublicRoute) {
    return false;
  }
  
  // Only show on protected routes
  if (!isProtectedRoute) {
    return false;
  }
  
  // Check authentication requirements
  if (config.requireAuthentication && !user) {
    return false;
  }
  
  if (config.requireSession && !session) {
    return false;
  }
  
  if (config.requireInitialization && !initialized) {
    return false;
  }
  
  // Skip if user doesn't need onboarding
  if (!needsOnboarding) {
    return false;
  }
  
  // Skip if still loading
  if (isLoading) {
    return false;
  }
  
  return true;
};

/**
 * Check if loading should be shown during onboarding check
 */
export const shouldShowOnboardingLoading = (
  pathname: string,
  initialized: boolean,
  isLoading: boolean
): boolean => {
  const config = getOnboardingConfig();
  
  // Check if we're on a public route
  const isPublicRoute = config.publicRoutes.some(route => {
    if (route.includes(':')) {
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
  
  // Check if we're on a protected route
  const isProtectedRoute = config.protectedRoutes.some(route => {
    if (route.includes(':')) {
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
  
  // Only show loading for protected routes during initialization
  return config.showLoadingDuringCheck && 
         !isPublicRoute && 
         isProtectedRoute && 
         (!initialized || isLoading);
}; 