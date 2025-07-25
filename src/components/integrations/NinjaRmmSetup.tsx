import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Shield, Monitor } from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { useNotifications } from '@/shared/core/hooks/NotificationContext';
import { NinjaRmmService } from '@/services/ninjaRmmService';

interface NinjaRmmSetupProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export const NinjaRmmSetup: React.FC<NinjaRmmSetupProps> = ({ onConnectionChange }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionData, setConnectionData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const ninjaService = new NinjaRmmService();

  useEffect(() => {
    if (user?.id) {
      checkConnectionStatus();
      handleOAuthCallback();
    }
  }, [user?.id]);

  const checkConnectionStatus = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const status = await ninjaService.getIntegrationStatus(user.id);
      setIsConnected(status.isConnected);
      setConnectionData(status.config);
      onConnectionChange?.(status.isConnected);
    } catch (err) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error checking connection status: ', err);
      setError('Failed to check connection status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user?.id) return;
    
    try {
      setIsConnecting(true);
      setError('');
      
      // Get OAuth URL and redirect user
      const authUrl = await ninjaService.initiateAuth(user.id);
      
      // Open OAuth flow in current window
      window.location.href = authUrl;
      
    } catch (err) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error initiating NinjaRMM connection: ', err);
      setError(err instanceof Error ? err.message: 'Failed to connect to NinjaRMM');
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const result = await ninjaService.testConnection(user.id);
      
      if (result.success) {
        addNotification({
          type: 'success',
          message: 'NinjaRMM connection test successful!'
        });
      } else {
        setError(result.error || 'Connection test failed');
        addNotification({
          type: 'error',
          message: result.error || 'Connection test failed'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Connection test failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const result = await ninjaService.disconnect(user.id);
      
      if (result.success) {
        setIsConnected(false);
        setConnectionData(null);
        onConnectionChange?.(false);
        addNotification({
          type: 'success',
          message: 'NinjaRMM disconnected successfully'
        });
      } else {
        setError(result.error || 'Failed to disconnect');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to disconnect';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth callback from URL parameters
  const handleOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'ninjarmm') {
      addNotification({
        type: 'success',
        message: 'NinjaRMM connected successfully!'
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh connection status
      setTimeout(() => checkConnectionStatus(), 1000);
    } else if (error) {
      addNotification({
        type: 'error',
        message: `NinjaRMM connection failed: ${decodeURIComponent(error)}`
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  if (isLoading && !isConnecting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            NinjaRMM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          NinjaRMM
          {isConnected && <Badge variant="default">Connected</Badge>}
        </CardTitle>
        <CardDescription>
          Connect your NinjaRMM account to monitor and manage IT assets through Nexus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Connect NinjaRMM</h4>
              <p className="text-sm text-muted-foreground">
                Connect your NinjaRMM account to access device monitoring, management features, and automation capabilities.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-success" />
                <span>Secure OAuth 2.0 authentication</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Monitor className="h-4 w-4 text-primary" />
                <span>Access to device monitoring and management</span>
              </div>
            </div>

            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect to NinjaRMM
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-medium">Connected to NinjaRMM</span>
            </div>

            {connectionData && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Scopes: </span> {connectionData.scope || 'monitoring, management'}
                </div>
                {connectionData.expires_at && (
                  <div>
                    <span className="font-medium">Token expires: </span> {new Date(connectionData.expires_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Test Connection'
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                disabled={isLoading}
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 