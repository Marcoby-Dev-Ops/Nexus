import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/index';
import { useRedirectManager } from '@/shared/hooks/useRedirectManager';

interface PublicRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function PublicRoute({ 
  children, 
  fallback,
  redirectTo = '/dashboard'
}: PublicRouteProps) {
  const { loading, initialized, isAuthenticated } = useAuth();
  const { redirectInProgress } = useRedirectManager();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (initialized && !loading && isAuthenticated && !redirectInProgress) {
      navigate(redirectTo, { replace: true });
    }
  }, [initialized, loading, isAuthenticated, redirectInProgress, navigate, redirectTo]);

  // Show loading state while auth is initializing
  if (!initialized || loading || redirectInProgress) {
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

  // If authenticated, don't render children (redirect will happen)
  if (isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // User is not authenticated, render children
  return <>{children}</>;
}
