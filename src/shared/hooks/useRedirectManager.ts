import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/index';

interface RedirectConfig {
  // Auth redirects
  redirectToLogin: string;
  redirectToDashboard: string;
  redirectToHome: string;
  
  // Public routes that don't require auth
  publicRoutes: string[];
  
  // Protected routes that require auth
  protectedRoutes: string[];
  
  // Debug mode
  debug: boolean;
}

const defaultConfig: RedirectConfig = {
  redirectToLogin: '/login',
  redirectToDashboard: '/dashboard/home',
  redirectToHome: '/home',
  publicRoutes: [
    '/',
    '/login',
    '/signup',
    '/reset-password',
    '/auth/callback',
    '/features',
    '/help',
    '/legal',
    '/password-reset',
    '/email-not-verified',
    '/waitlist',
    '/marketing',
    '/pricing'
  ],
  protectedRoutes: [
    '/dashboard',
    '/workspace',
    '/ai-hub',
    '/chat',
    '/integrations',
    '/settings',
    '/profile',
    '/admin',
    '/home'
  ],
  debug: import.meta.env.DEV
};

export function useRedirectManager(config: Partial<RedirectConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, loading, initialized, isAuthenticated } = useAuth();
  const isAuthenticatedUser = !!user;
  const redirectInProgress = useRef(false);

  // Check if current route is public
  const isPublicRoute = useCallback(() => {
    return finalConfig.publicRoutes.some(route => 
      location.pathname === route || 
      (route !== '/' && location.pathname.startsWith(route))
    );
  }, [location.pathname, finalConfig.publicRoutes]);

  // Check if current route is protected
  const isProtectedRoute = useCallback(() => {
    return finalConfig.protectedRoutes.some(route => 
      location.pathname === route || 
      (route !== '/' && location.pathname.startsWith(route))
    );
  }, [location.pathname, finalConfig.protectedRoutes]);

  // Redirect to login
  const redirectToLogin = useCallback((replace = true) => {
    if (redirectInProgress.current) return;
    
    redirectInProgress.current = true;
    if (finalConfig.debug) {
      console.log('[RedirectManager] Redirecting to login');
    }
    
    navigate(finalConfig.redirectToLogin, { replace });
    
    // Reset flag after navigation
    setTimeout(() => {
      redirectInProgress.current = false;
    }, 100);
  }, [navigate, finalConfig.redirectToLogin, finalConfig.debug]);

  // Redirect to dashboard
  const redirectToDashboard = useCallback((replace = true) => {
    if (redirectInProgress.current) return;
    
    redirectInProgress.current = true;
    if (finalConfig.debug) {
      console.log('[RedirectManager] Redirecting to dashboard');
    }
    
    navigate(finalConfig.redirectToDashboard, { replace });
    
    // Reset flag after navigation
    setTimeout(() => {
      redirectInProgress.current = false;
    }, 100);
  }, [navigate, finalConfig.redirectToDashboard, finalConfig.debug]);

  // Redirect to home
  const redirectToHome = useCallback((replace = true) => {
    if (redirectInProgress.current) return;
    
    redirectInProgress.current = true;
    if (finalConfig.debug) {
      console.log('[RedirectManager] Redirecting to home');
    }
    
    navigate(finalConfig.redirectToHome, { replace });
    
    // Reset flag after navigation
    setTimeout(() => {
      redirectInProgress.current = false;
    }, 100);
  }, [navigate, finalConfig.redirectToHome, finalConfig.debug]);

  // Handle auth state changes
  useEffect(() => {
    if (loading || !initialized) return;

    // If user is authenticated and on a public route, redirect to dashboard
    if (isAuthenticatedUser && isPublicRoute() && location.pathname !== '/') {
      if (finalConfig.debug) {
        console.log('[RedirectManager] Authenticated user on public route, redirecting to dashboard');
      }
      redirectToDashboard();
      return;
    }

    // If user is not authenticated and on a protected route, redirect to login
    if (!isAuthenticatedUser && isProtectedRoute()) {
      if (finalConfig.debug) {
        console.log('[RedirectManager] Unauthenticated user on protected route, redirecting to login');
      }
      redirectToLogin();
      return;
    }
  }, [
    isAuthenticatedUser,
    loading,
    initialized,
    location.pathname,
    isPublicRoute,
    isProtectedRoute,
    redirectToDashboard,
    redirectToLogin,
    finalConfig.debug
  ]);

  return {
    // State
    isPublicRoute,
    isProtectedRoute,
    redirectInProgress: redirectInProgress.current,
    
    // Actions
    redirectToLogin,
    redirectToDashboard,
    redirectToHome,
    
    // Utilities
    shouldShowAuthUI: isProtectedRoute(),
    shouldShowPublicUI: isPublicRoute(),
  };
} 