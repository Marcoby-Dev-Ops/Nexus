import React from 'react';
import { useUserContextReady } from '@/shared/hooks/useUserContextReady';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface UserMappingGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

/**
 * UserMappingGuard component
 * Prevents child components from rendering until user mapping is ready
 * This prevents race conditions where components try to access data before user mapping is established
 */
export const UserMappingGuard: React.FC<UserMappingGuardProps> = ({ 
  children, 
  fallback,
  showLoading = true 
}) => {
  const { isReady, retryCount, maxRetries, error } = useUserContextReady();

  // If mapping is ready, render children
  if (isReady) {
    return <>{children}</>;
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If there's an error, show error state
  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">User Mapping Error</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error}
          </p>
          <p className="text-xs text-muted-foreground">
            Please refresh the page or contact support if the problem persists.
          </p>
        </CardContent>
      </Card>
    );
  }

  // If max retries exceeded, show error
  if (retryCount >= maxRetries) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Connection Timeout</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Failed to establish user mapping after {maxRetries} attempts.
          </p>
          <p className="text-xs text-muted-foreground">
            Please refresh the page or check your connection.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (showLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Initializing User Session</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Setting up your user mapping...
          </p>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Attempt {retryCount} of {maxRetries}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Don't render anything if loading is disabled
  return null;
};

export default UserMappingGuard;
