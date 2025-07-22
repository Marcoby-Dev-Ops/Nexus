import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * ProtectedRoute Component
 * 
 * Ensures users are authenticated before accessing protected routes.
 * Handles loading states, authentication checks, and redirects.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo = '/login',
  requireAuth = true
}) => {
  const { user, session, loading, initialized } = useAuthContext();
  const location = useLocation();

  // Show loading state while authentication is initializing
  if (!initialized || loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If user is not authenticated, redirect to login
  if (!user || !session) {
    // Save the attempted URL to redirect back after login
    const searchParams = new URLSearchParams();
    searchParams.set('redirect', location.pathname + location.search);
    
    return <Navigate to={`${redirectTo}?${searchParams.toString()}`} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

/**
 * PublicRoute Component
 * 
 * Redirects authenticated users away from public routes (like login/signup)
 * to prevent them from accessing these pages when already logged in.
 */
export const PublicRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo = '/home'
}) => {
  const { user, session, loading, initialized } = useAuthContext();

  // Show loading state while authentication is initializing
  if (!initialized || loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to home
  if (user && session) {
    return <Navigate to={redirectTo} replace />;
  }

  // User is not authenticated, render the public content
  return <>{children}</>;
};

/**
 * RoleBasedRoute Component
 * 
 * Protects routes based on user roles and permissions.
 */
interface RoleBasedRouteProps extends ProtectedRouteProps {
  requiredRoles?: string[];
  requiredDepartments?: string[];
  fallbackMessage?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredDepartments = [],
  fallbackMessage = "You don't have permission to access this page.",
  fallback,
  ...props
}) => {
  const { user } = useAuthContext();

  // First check if user is authenticated
  if (!user) {
    return <ProtectedRoute {...props}>{children}</ProtectedRoute>;
  }

  // Check role-based access
  const hasRequiredRole = requiredRoles.length === 0 || 
    (user.role && requiredRoles.includes(user.role));

  // Check department-based access
  const hasRequiredDepartment = requiredDepartments.length === 0 || 
    (user.department && requiredDepartments.includes(user.department));

  // If user doesn't have required permissions
  if (!hasRequiredRole || !hasRequiredDepartment) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-destructive mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">{fallbackMessage}</p>
        </div>
      </div>
    );
  }

  // User has required permissions
  return <>{children}</>;
}; 