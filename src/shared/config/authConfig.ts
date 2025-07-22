/**
 * Authentication Configuration
 * 
 * Centralized configuration for all authentication-related settings.
 * Modify these values to customize the authentication behavior.
 */

export interface AuthConfig {
  // Session Management
  sessionCheckInterval: number; // How often to check session validity (ms)
  tokenRefreshThreshold: number; // Refresh token when this much time is left (ms)
  sessionTimeout: number; // Session timeout in milliseconds
  maxSessionAge: number; // Maximum session age in milliseconds
  
  // Retry Settings
  maxRetries: number;
  retryDelay: number;
  retryBackoffMultiplier: number;
  
  // Storage Settings
  enableLocalStorage: boolean;
  enableSessionStorage: boolean;
  storagePrefix: string;
  
  // Security Settings
  enableAutoRefresh: boolean;
  enableSessionValidation: boolean;
  enableOfflineSupport: boolean;
  
  // UI Settings
  showSessionStatus: boolean;
  showSessionProgress: boolean;
  enableSessionNotifications: boolean;
  
  // Redirect Settings
  defaultRedirectAfterLogin: string;
  defaultRedirectAfterLogout: string;
  preserveRedirectUrl: boolean;
  
  // Development Settings
  enableDebugLogging: boolean;
  enableSessionMonitoring: boolean;
}

export const authConfig: AuthConfig = {
  // Session Management
  sessionCheckInterval: 10 * 60 * 1000, // Check every 10 minutes (reduced from 5 minutes)
  tokenRefreshThreshold: 10 * 60 * 1000, // Refresh when 10 minutes left
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxSessionAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Retry Settings
  maxRetries: 3,
  retryDelay: 2000,
  retryBackoffMultiplier: 1.5,
  
  // Storage Settings
  enableLocalStorage: true,
  enableSessionStorage: true,
  storagePrefix: 'nexus_auth',
  
  // Security Settings
  enableAutoRefresh: true,
  enableSessionValidation: true,
  enableOfflineSupport: true,
  
  // UI Settings
  showSessionStatus: true,
  showSessionProgress: true,
  enableSessionNotifications: true,
  
  // Redirect Settings
  defaultRedirectAfterLogin: '/home',
  defaultRedirectAfterLogout: '/login',
  preserveRedirectUrl: true,
  
  // Development Settings
  enableDebugLogging: import.meta.env.DEV,
  enableSessionMonitoring: import.meta.env.DEV,
};

/**
 * Get authentication configuration with environment-specific overrides
 */
export const getAuthConfig = (): AuthConfig => {
  const config = { ...authConfig };
  
  // Development overrides
  if (import.meta.env.DEV) {
    config.sessionCheckInterval = 10 * 60 * 1000; // Check every 10 minutes in dev (reduced from 2 minutes)
    config.tokenRefreshThreshold = 15 * 60 * 1000; // Refresh when 15 minutes left in dev (increased from 5 minutes)
    config.enableDebugLogging = true;
    config.enableSessionMonitoring = true;
  }
  
  // Production overrides
  if (import.meta.env.PROD) {
    config.enableDebugLogging = false;
    config.enableSessionMonitoring = false;
  }
  
  return config;
};

/**
 * Authentication routes configuration
 */
export const authRoutes = {
  // Public routes (no authentication required)
  public: [
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
  
  // Protected routes (authentication required)
  protected: [
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
  
  // Admin routes (admin role required)
  admin: [
    '/admin/users',
    '/admin/roles',
    '/admin/tenants',
    '/admin/settings'
  ]
};

/**
 * Check if a route is public
 */
export const isPublicRoute = (pathname: string): boolean => {
  return authRoutes.public.some(route => {
    if (route.includes(':')) {
      // Handle dynamic routes
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
};

/**
 * Check if a route is protected
 */
export const isProtectedRoute = (pathname: string): boolean => {
  return authRoutes.protected.some(route => {
    if (route.includes(':')) {
      // Handle dynamic routes
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
};

/**
 * Check if a route requires admin access
 */
export const isAdminRoute = (pathname: string): boolean => {
  return authRoutes.admin.some(route => {
    if (route.includes(':')) {
      // Handle dynamic routes
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
};

/**
 * Get the appropriate redirect URL based on authentication status and current route
 */
export const getRedirectUrl = (isAuthenticated: boolean, currentPath: string): string => {
  const config = getAuthConfig();
  
  if (isAuthenticated) {
    // If user is authenticated and trying to access public routes, redirect to home
    if (isPublicRoute(currentPath) && currentPath !== '/') {
      return config.defaultRedirectAfterLogin;
    }
    return currentPath;
  } else {
    // If user is not authenticated and trying to access protected routes, redirect to login
    if (isProtectedRoute(currentPath)) {
      return config.defaultRedirectAfterLogout;
    }
    return currentPath;
  }
}; 