import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { 
  User, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  LogOut,
  Settings
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthStatusInfo {
  isAuthenticated: boolean;
  user: any;
  session: any;
  lastSignIn: string | null;
  provider: string | null;
  emailVerified: boolean;
  sessionExpiry: string | null;
}

export const AuthStatus: React.FC = () => {
  const { user, signOut } = useAuth();
  const [statusInfo, setStatusInfo] = useState<AuthStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAuthStatus();
  }, [user]);

  const loadAuthStatus = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const info: AuthStatusInfo = {
        isAuthenticated: !!session,
        user: currentUser,
        session: session,
        lastSignIn: session?.user?.last_sign_in_at || null,
        provider: session?.user?.app_metadata?.provider || null,
        emailVerified: session?.user?.email_confirmed_at ? true : false,
        sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      };

      setStatusInfo(info);
    } catch (error) {
      console.error('Error loading auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error);
      } else {
        await loadAuthStatus();
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getStatusBadge = (isAuthenticated: boolean) => {
    return isAuthenticated ? (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Authenticated
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Not Authenticated
      </Badge>
    );
  };

  const getSessionStatus = (expiry: string | null) => {
    if (!expiry) return { status: 'No Expiry', color: 'text-warning' };
    
    const now = new Date();
    const expiryDate = new Date(expiry);
    
    if (expiryDate > now) {
      const timeLeft = Math.floor((expiryDate.getTime() - now.getTime()) / 1000 / 60);
      return { 
        status: `Valid (${timeLeft}m left)`, 
        color: timeLeft > 10 ? 'text-success' : 'text-warning' 
      };
    } else {
      return { status: 'Expired', color: 'text-destructive' };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Auth Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Status
          </CardTitle>
          <CardDescription>
            Current authentication state and session information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusInfo && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium">Status</span>
                {getStatusBadge(statusInfo.isAuthenticated)}
              </div>

              {statusInfo.user && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">User ID</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {statusInfo.user.id}
                    </code>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm">{statusInfo.user.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Provider</span>
                    <Badge variant="outline">{statusInfo.provider || 'email'}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email Verified</span>
                    <Badge variant={statusInfo.emailVerified ? 'default' : 'destructive'}>
                      {statusInfo.emailVerified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Session Status</span>
                  <span className={`text-sm ${getSessionStatus(statusInfo.sessionExpiry).color}`}>
                    {getSessionStatus(statusInfo.sessionExpiry).status}
                  </span>
                </div>
                
                {statusInfo.lastSignIn && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Sign In</span>
                    <span className="text-sm">
                      {new Date(statusInfo.lastSignIn).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {!statusInfo.isAuthenticated && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You are not currently authenticated. Please sign in to access the application.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={refreshSession} 
              variant="outline" 
              size="sm"
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh Session
            </Button>
            
            {statusInfo?.isAuthenticated && (
              <Button 
                onClick={handleSignOut} 
                variant="destructive" 
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 