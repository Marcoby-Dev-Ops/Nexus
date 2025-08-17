import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useAuth } from '@/hooks/index';
import { microsoft365TokenService } from '@/services/integrations/Microsoft365TokenService';
import { logger } from '@/shared/utils/logger';
import { CheckCircle2, XCircle, RefreshCw, Building2 } from 'lucide-react';

const Microsoft365Test: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('idle');
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      checkConnection();
    }
  }, [user?.id]);

  const checkConnection = async () => {
    if (!user?.id) return;

    setStatus('loading');
    setError(null);

    try {
      const result = await microsoft365TokenService.getConnectionStatus(user.id);
      
      if (result.success && result.data) {
        setConnectionInfo(result.data);
        setStatus(result.data.connected ? 'connected' : 'error');
        
        if (!result.data.connected) {
          setError('Microsoft 365 is not connected or connection has expired');
        }
      } else {
        setStatus('error');
        setError(result.error || 'Failed to check connection status');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const testTokenRefresh = async () => {
    if (!user?.id) return;

    setStatus('loading');
    setError(null);

    try {
      const result = await microsoft365TokenService.getValidTokens(user.id);
      
      if (result.success && result.data) {
        setStatus('connected');
        setConnectionInfo({
          ...connectionInfo,
          access_token: '***REDACTED***',
          refresh_token: '***REDACTED***',
          expires_at: result.data.expires_at,
          scope: result.data.scope,
        });
        logger.info('Token refresh successful', { userId: user.id });
      } else {
        setStatus('error');
        setError(result.error || 'Failed to refresh tokens');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'loading':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Building2 className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Connected</Badge>;
      case 'error':
        return <Badge variant="secondary" className="bg-red-100 text-red-700">Error</Badge>;
      case 'loading':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Loading</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Idle</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Microsoft 365 Integration Test
        </CardTitle>
        <CardDescription>
          Test the Microsoft 365 integration and token refresh functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {connectionInfo && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Connection Information:</h4>
            <div className="text-sm space-y-1">
              <div><strong>Status:</strong> {connectionInfo.status}</div>
              {connectionInfo.lastSync && (
                <div><strong>Last Sync:</strong> {new Date(connectionInfo.lastSync).toLocaleString()}</div>
              )}
              {connectionInfo.expiresAt && (
                <div><strong>Expires At:</strong> {new Date(connectionInfo.expiresAt).toLocaleString()}</div>
              )}
              {connectionInfo.scope && (
                <div><strong>Scopes:</strong> {connectionInfo.scope}</div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={checkConnection} variant="outline" disabled={status === 'loading'}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Connection
          </Button>
          {status === 'connected' && (
            <Button onClick={testTokenRefresh} variant="outline" disabled={status === 'loading'}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Token Refresh
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>User ID:</strong> {user?.id || 'Not authenticated'}</p>
          <p><strong>Test Time:</strong> {new Date().toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Microsoft365Test;
