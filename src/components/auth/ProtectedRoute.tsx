import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import EmailNotVerified from '@/pages/EmailNotVerified';
import { Button } from '@/components/ui/Button';
import React, { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session, loading, error } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoadingTimeout(true), 10000); // 10 seconds
    return () => clearTimeout(timer);
  }, [loading]);

  // Show error state if there's an auth error
  if (error) {
    console.error('Auth error in ProtectedRoute:', error);
    
    // If it's a timeout error, show a retry option
    if (error.message.includes('timeout')) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Timeout</h2>
            <p className="text-muted-foreground mb-6">
              The authentication process is taking longer than expected. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()} className="mr-3">
              Refresh Page
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </div>
        </div>
      );
    }
    
    // For other errors, redirect to login with error message
    return <Navigate to="/login" state={{ from: location, error: error.message }} replace />;
  }

  // Show loading spinner while auth is initializing or loading
  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner size={32} />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading...
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            This usually takes just a moment
          </p>
        </div>
      </div>
    );
  }

  // Timeout fallback if loading takes too long
  if (loading && loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-yellow-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Timeout</h2>
          <p className="text-muted-foreground mb-6">
            The authentication process is taking longer than expected. Please try refreshing the page or check your network connection.
          </p>
          <Button onClick={() => window.location.reload()} className="mr-3">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Check email verification
  if (session && !session.user.email_confirmed_at) {
    return <EmailNotVerified />;
  }

  // Redirect to login if loading is finished and there's no user or session.
  // This is more robust against HMR issues in development.
  if (!loading && !user && !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we have a session but the user profile is still loading,
  // it's better to keep showing the loading spinner than to redirect.
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner size={32} />
          <p className="mt-4 text-sm text-muted-foreground">
            Initializing Session...
          </p>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}; 