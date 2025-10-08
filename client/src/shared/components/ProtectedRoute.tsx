import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/index';

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
  const navigate = useNavigate();
  const location = useLocation();


  // Add timeout fallback for stuck loading states - increased timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading && !initialized) {
        
        navigate(redirectTo, { 
          state: { from: location },
          replace: true 
        });
      }
    }, 30000); // 30 second timeout - increased from 15s

    return () => clearTimeout(timeoutId);
  }, [loading, initialized, redirectTo, navigate, location]);

  // Ensure redirect effect is always registered (hooks must be called in same order)
  useEffect(() => {
    // Only act when initialization/loading is finished
    if (!initialized || loading) return;

    if (!isAuthenticated || error) {
      navigate(redirectTo, {
        state: { from: location },
        replace: true,
      });
    }
  }, [initialized, loading, isAuthenticated, error, navigate, redirectTo, location]);

  // Show loading state while auth is initializing
  if (!initialized || loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
          <p className="text-xs text-muted-foreground">
            {!initialized ? 'Initializing authentication...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated or there's an error, redirect to login with current location
  if (!isAuthenticated || error) {
    // Show loading state while redirecting (the redirect effect above will run after render)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}