import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/index';

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
  const location = useLocation();

  // Show loading state while auth is initializing
  if (!initialized || loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to dashboard (or intended destination)
  if (isAuthenticated) {
    console.log('🔓 [PublicRoute] Redirecting authenticated user to dashboard');
    
    // Check if there's a redirect destination from login flow
    const from = location.state?.from?.pathname;
    const redirectDestination = from && from !== '/login' ? from : redirectTo;
    
    return (
      <Navigate 
        to={redirectDestination} 
        replace 
      />
    );
  }

  // User is not authenticated, render children
  return <>{children}</>;
}
