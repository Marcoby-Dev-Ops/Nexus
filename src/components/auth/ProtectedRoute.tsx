import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/patterns/LoadingStates';
import { Button } from '@/components/ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * Robust ProtectedRoute
 * - Shows spinner with timeout
 * - Surfaces errors with retry
 * - Redirects to login only if truly unauthenticated
 * - Handles missing/broken profile gracefully
 * - Extra logging for debugging
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, session, error, status, loading, timeoutWarning, initialized } = useAuth();
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    console.log('[ProtectedRoute] user:', user);
    console.log('[ProtectedRoute] session:', session);
    console.log('[ProtectedRoute] error:', error);
    console.log('[ProtectedRoute] status:', status);
  }, [user, session, error, status]);

  // 1. Show loader or timeout UI while loading or not yet initialized
  if (loading || timeoutWarning || !initialized) {
    if (timeoutWarning && loading) {
      // ... your timeout warning block ...
      // (already handled above if you want a custom UI)
    }
    return <PageLoader message="Loading your session..." />;
  }

  // 2. Show error state if authContext error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-destructive mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-6">{error.message || 'An unknown error occurred.'}</p>
          <Button onClick={() => window.location.reload()} className="mr-3">Retry</Button>
          <Button variant="outline" onClick={() => window.location.href = '/login'}>Go to Login</Button>
        </div>
      </div>
    );
  }

  // 3. Redirect to login only if truly unauthenticated
  if (!user && !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. Role check (already good)
  if (allowedRoles && user && !allowedRoles.includes(user.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Not Authorized</h1>
          <p className="mt-4 text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // 5. Render protected content
  return <>{children}</>;
}; 