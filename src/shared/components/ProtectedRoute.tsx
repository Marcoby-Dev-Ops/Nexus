import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/index';
import { useRedirectManager } from '@/shared/hooks/useRedirectManager.ts';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { loading, initialized } = useAuth();
  const { redirectInProgress } = useRedirectManager();

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

  // Let the redirect manager handle the redirect logic
  // This component just renders children or shows loading
  return <>{children}</>;
} 