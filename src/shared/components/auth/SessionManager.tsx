import React, { useState, useEffect } from 'react';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { persistentAuthService } from '@/shared/services/persistentAuthService';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  LogOut,
  Shield,
  User
} from 'lucide-react';

interface SessionManagerProps {
  showDetails?: boolean;
  className?: string;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const { user, session, signOut } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);

  useEffect(() => {
    const updateSessionInfo = async () => {
      try {
        const info = await persistentAuthService.getCurrentSession();
        setSessionInfo(info);
        
        if (info.timeUntilExpiry) {
          setTimeUntilExpiry(info.timeUntilExpiry);
        }
      } catch (error) {
        console.error('Failed to get session info:', error);
      }
    };

    updateSessionInfo();
    
    // Update session info every minute
    const interval = setInterval(updateSessionInfo, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeUntilExpiry !== null && timeUntilExpiry > 0) {
      const timer = setTimeout(() => {
        setTimeUntilExpiry(prev => prev ? prev - 1000 : null);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [timeUntilExpiry]);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      await persistentAuthService.validateAndRefreshSession();
      // Update session info after refresh
      const info = await persistentAuthService.getCurrentSession();
      setSessionInfo(info);
      if (info.timeUntilExpiry) {
        setTimeUntilExpiry(info.timeUntilExpiry);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const getSessionStatus = () => {
    if (!session || !sessionInfo) {
      return { status: 'disconnected', icon: <AlertCircle className="w-4 h-4" />, color: 'text-destructive' };
    }

    if (!sessionInfo.isValid) {
      return { status: 'expired', icon: <AlertCircle className="w-4 h-4" />, color: 'text-destructive' };
    }

    if (timeUntilExpiry && timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes
      return { status: 'expiring', icon: <Clock className="w-4 h-4" />, color: 'text-warning' };
    }

    return { status: 'active', icon: <CheckCircle className="w-4 h-4" />, color: 'text-success' };
  };

  const getTimeRemaining = () => {
    if (!timeUntilExpiry || timeUntilExpiry <= 0) {
      return 'Expired';
    }

    const minutes = Math.floor(timeUntilExpiry / 60000);
    const seconds = Math.floor((timeUntilExpiry % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    
    return `${seconds}s`;
  };

  const getSessionProgress = () => {
    if (!sessionInfo?.expiresAt || !timeUntilExpiry) {
      return 0;
    }

    const totalDuration = sessionInfo.expiresAt - (sessionInfo.expiresAt - timeUntilExpiry);
    const remaining = timeUntilExpiry;
    
    return Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
  };

  const sessionStatus = getSessionStatus();

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {sessionStatus.icon}
        <Badge variant="outline" className={sessionStatus.color}>
          {sessionStatus.status}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Session Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {sessionStatus.icon}
            <span className="font-medium">Status</span>
          </div>
          <Badge variant="outline" className={sessionStatus.color}>
            {sessionStatus.status}
          </Badge>
        </div>

        {/* User Info */}
        {user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium">User</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
          </div>
        )}

        {/* Session Progress */}
        {sessionInfo?.isValid && timeUntilExpiry && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Time Remaining</span>
              </div>
              <span className="text-sm font-mono">
                {getTimeRemaining()}
              </span>
            </div>
            
            <Progress value={getSessionProgress()} className="w-full" />
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSession}
            disabled={isRefreshing || !sessionInfo?.isValid}
            className="flex-1"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex-1"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Session Info */}
        {sessionInfo && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Session ID: {sessionInfo.user?.id?.slice(0, 8)}...</div>
            <div>Last Activity: {new Date().toLocaleTimeString()}</div>
            {sessionInfo.expiresAt && (
              <div>Expires: {new Date(sessionInfo.expiresAt).toLocaleString()}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 