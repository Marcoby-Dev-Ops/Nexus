import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { 
  User, 
  Shield, 
  Key, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthDebugInfo {
  isAuthenticated: boolean;
  user: any;
  session: any;
  token: string | null;
  tokenExpiry: string | null;
  lastSignIn: string | null;
  provider: string | null;
}

export const AuthDebugger: React.FC = () => {
  const { user, signOut } = useAuth();
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    loadDebugInfo();
  }, [user]);

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const info: AuthDebugInfo = {
        isAuthenticated: !!session,
        user: currentUser,
        session: session,
        token: session?.access_token || null,
        tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        lastSignIn: session?.user?.last_sign_in_at || null,
        provider: session?.user?.app_metadata?.provider || null,
      };

      setDebugInfo(info);
      addLog('Debug info loaded successfully');
    } catch (error) {
      addLog(`Error loading debug info: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const testAuthConnection = async () => {
    addLog('Testing auth connection...');
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        addLog(`Auth connection failed: ${error.message}`);
      } else {
        addLog('Auth connection successful');
      }
    } catch (error) {
      addLog(`Auth connection error: ${error}`);
    }
  };

  const refreshSession = async () => {
    addLog('Refreshing session...');
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        addLog(`Session refresh failed: ${error.message}`);
      } else {
        addLog('Session refreshed successfully');
        loadDebugInfo();
      }
    } catch (error) {
      addLog(`Session refresh error: ${error}`);
    }
  };

  const clearAuthData = async () => {
    addLog('Clearing auth data...');
    try {
      await signOut();
      addLog('Auth data cleared successfully');
      loadDebugInfo();
    } catch (error) {
      addLog(`Failed to clear auth data: ${error}`);
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

  const getTokenStatus = (token: string | null, expiry: string | null) => {
    if (!token) return { status: 'No Token', color: 'text-muted-foreground' };
    
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
            Loading Auth Debug Info...
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
            Debug authentication state and session information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {debugInfo && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium">Status</span>
                {getStatusBadge(debugInfo.isAuthenticated)}
              </div>

              {debugInfo.user && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">User ID</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {debugInfo.user.id}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm">{debugInfo.user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Provider</span>
                    <Badge variant="outline">{debugInfo.provider || 'email'}</Badge>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Token Status</span>
                  <span className={`text-sm ${getTokenStatus(debugInfo.token, debugInfo.tokenExpiry).color}`}>
                    {getTokenStatus(debugInfo.token, debugInfo.tokenExpiry).status}
                  </span>
                </div>
                {debugInfo.lastSignIn && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Sign In</span>
                    <span className="text-sm">
                      {new Date(debugInfo.lastSignIn).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {showSensitiveData && debugInfo.token && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Access Token</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSensitiveData(false)}
                        >
                          <EyeOff className="w-4 h-4" />
                        </Button>
                      </div>
                      <code className="text-xs bg-muted p-2 rounded block break-all">
                        {debugInfo.token}
                      </code>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {!showSensitiveData && debugInfo.token && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSensitiveData(true)}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Show Token
                </Button>
              )}
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={testAuthConnection} variant="outline" size="sm">
              Test Connection
            </Button>
            <Button onClick={refreshSession} variant="outline" size="sm">
              Refresh Session
            </Button>
            <Button onClick={clearAuthData} variant="destructive" size="sm">
              Clear Auth Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Debug Logs
          </CardTitle>
          <CardDescription>
            Recent authentication debug events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No logs yet</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-xs font-mono bg-muted p-2 rounded">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 