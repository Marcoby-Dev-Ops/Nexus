import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import EmailNotVerified from '@/pages/EmailNotVerified';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading, error } = useAuth();
  const location = useLocation();

  // Show error state if there's an auth error
  if (error) {
    console.error('Auth error in ProtectedRoute:', error);
    return <Navigate to="/login" state={{ from: location, error: error.message }} replace />;
  }

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner size={32} />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check email verification
  if (session && !session.user.email_confirmed_at) {
    return <EmailNotVerified />;
  }

  // Redirect to login if no session
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected content
  return <>{children}</>;
}; 