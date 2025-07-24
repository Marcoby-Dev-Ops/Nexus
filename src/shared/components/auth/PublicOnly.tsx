import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';

interface PublicOnlyProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Standard React Component for Public-Only Routes
 * 
 * Redirects authenticated users away from public routes (like login, signup)
 * This is the standard pattern used by React Router and most auth libraries.
 */
export function PublicOnly({ children, redirectTo = '/dashboard/home' }: PublicOnlyProps) {
  const { isAuthenticated, loading, initialized } = useAuth();

  // Show loading while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users away from public routes
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render children for unauthenticated users
  return <>{children}</>;
} 