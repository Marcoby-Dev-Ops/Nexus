import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';

interface UseAuthGuardOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  onUnauthorized?: () => void;
  onAuthorized?: () => void;
}

/**
 * useAuthGuard Hook
 * 
 * A custom hook that provides authentication guard functionality.
 * Can be used in components to ensure proper authentication state.
 */
export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const {
    requireAuth = true,
    redirectTo = '/login',
    onUnauthorized,
    onAuthorized
  } = options;

  const { user, session, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't do anything while still loading
    if (!initialized || loading) {
      return;
    }

    const isAuthenticated = !!(user && session);

    if (requireAuth && !isAuthenticated) {
      // User is not authenticated but route requires auth
      const searchParams = new URLSearchParams();
      searchParams.set('redirect', location.pathname + location.search);
      
      navigate(`${redirectTo}?${searchParams.toString()}`, { replace: true });
      onUnauthorized?.();
    } else if (!requireAuth && isAuthenticated) {
      // User is authenticated but route is public (like login/signup)
      navigate('/home', { replace: true });
      onAuthorized?.();
    } else if (requireAuth && isAuthenticated) {
      // User is authenticated and route requires auth - this is good
      onAuthorized?.();
    }
  }, [user, session, loading, initialized, requireAuth, redirectTo, navigate, location, onUnauthorized, onAuthorized]);

  return {
    isAuthenticated: !!(user && session),
    isLoading: loading || !initialized,
    user,
    session
  };
};

/**
 * useRequireAuth Hook
 * 
 * A simplified hook for routes that require authentication.
 * Automatically redirects to login if not authenticated.
 */
export const useRequireAuth = (redirectTo?: string) => {
  return useAuthGuard({
    requireAuth: true,
    redirectTo: redirectTo || '/login'
  });
};

/**
 * useRequireGuest Hook
 * 
 * A hook for public routes that should redirect authenticated users.
 * Useful for login/signup pages.
 */
export const useRequireGuest = (redirectTo?: string) => {
  return useAuthGuard({
    requireAuth: false,
    redirectTo: redirectTo || '/home'
  });
};

/**
 * useOptionalAuth Hook
 * 
 * A hook that provides authentication state without redirects.
 * Useful for components that need to know auth state but don't require it.
 */
export const useOptionalAuth = () => {
  const { user, session, loading, initialized } = useAuth();
  
  return {
    isAuthenticated: !!(user && session),
    isLoading: loading || !initialized,
    user,
    session
  };
}; 