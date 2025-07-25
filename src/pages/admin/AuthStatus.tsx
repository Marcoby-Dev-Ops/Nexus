import React from 'react';
import { useAuth } from '@/hooks/index';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { CheckCircle, XCircle, Clock, AlertCircle, User } from 'lucide-react';

interface AuthStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function AuthStatus({ showDetails = false, className = '' }: AuthStatusProps) {
  const { user, session, loading, error, isAuthenticated } = useAuth();

  const getStatusIcon = () => {
    if (loading) return <Clock className="w-4 h-4 text-primary animate-spin" />;
    if (error) return <XCircle className="w-4 h-4 text-destructive" />;
    if (isAuthenticated && user && session) return <CheckCircle className="w-4 h-4 text-success" />;
    return <User className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (loading) return 'Loading...';
    if (error) return 'Error';
    if (isAuthenticated && user && session) return 'Authenticated';
    return 'Not Authenticated';
  };

  const getStatusColor = () => {
    if (loading) return 'bg-primary/10 text-primary border-primary/20';
    if (error) return 'bg-destructive/10 text-destructive border-destructive/20';
    if (isAuthenticated && user && session) return 'bg-success/10 text-success border-success/20';
    return 'bg-muted text-muted-foreground border-muted';
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getStatusIcon()}
        <Badge variant="outline" className={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <Badge variant="outline" className={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </div>
      
      {showDetails && (
        <div className="text-xs text-muted-foreground space-y-1">
          {user && (
            <div>User: {user.email}</div>
          )}
          {error && (
            <div className="text-destructive">Error: {error.message}</div>
          )}
          <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
          <div>Has Session: {session ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
} 