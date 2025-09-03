import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/index';
import { useRedirectManager } from '@/shared/hooks/useRedirectManager';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  fallback,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { loading, initialized, isAuthenticated, error } = useAuth();
  const { redirectInProgress } = useRedirectManager();
  const navigate = useNavigate();

  // Add timeout fallback for stuck loading states
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading && !initialized) {
        console.log('🔒 [ProtectedRoute] Auth loading timeout, redirecting to login');
        navigate(redirectTo, { replace: true });
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeoutId);
  }, [loading, initialized, navigate, redirectTo]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    // If auth failed to initialize or user is not authenticated, redirect to login
    if ((initialized && !loading && !isAuthenticated && !redirectInProgress) || 
        (initialized && error && !redirectInProgress)) {
      console.log('🔒 [ProtectedRoute] Redirecting to login:', {
        initialized,
        loading,
        isAuthenticated,
        error: error?.message,
        redirectInProgress,
        redirectTo
      });
      navigate(redirectTo, { replace: true });
    }
  }, [initialized, loading, isAuthenticated, error, redirectInProgress, navigate, redirectTo]);

  // Show loading state while auth is initializing
  if (!initialized || loading || redirectInProgress) {
    console.log('🔒 [ProtectedRoute] Showing loading state:', {
      initialized,
      loading,
      redirectInProgress
    });
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {redirectInProgress ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!isAuthenticated) {
    console.log('🔒 [ProtectedRoute] User not authenticated, showing redirect state');
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
} 
