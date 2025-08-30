import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { consolidatedIntegrationService } from '@/services/integrations/consolidatedIntegrationService';
import type { UserIntegration, IntegrationPlatform, ConnectionResult } from '@/services/integrations/consolidatedIntegrationService';
import { logger } from '@/shared/utils/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';

interface IntegrationManagerProps {
  onIntegrationChange?: (integrations: UserIntegration[]) => void;
}

export const IntegrationManager: React.FC<IntegrationManagerProps> = ({ 
  onIntegrationChange 
}) => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<IntegrationPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user integrations
  const loadIntegrations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data: userIntegrations, error: integrationsError } = await consolidatedIntegrationService.getUserIntegrations(user.id);
      
      if (integrationsError) {
        throw new Error(integrationsError);
      }

      setIntegrations(userIntegrations || []);
      
      if (onIntegrationChange) {
        onIntegrationChange(userIntegrations || []);
      }
    } catch (error) {
      logger.error('Error loading integrations:', error);
      setError('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, onIntegrationChange]);

  // Load available platforms
  const loadAvailablePlatforms = useCallback(async () => {
    try {
      const { data: platforms, error: platformsError } = await consolidatedIntegrationService.getAvailablePlatforms();
      
      if (platformsError) {
        throw new Error(platformsError);
      }

      setAvailablePlatforms(platforms || []);
    } catch (error) {
      logger.error('Error loading available platforms:', error);
      setError('Failed to load available platforms');
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadIntegrations();
      loadAvailablePlatforms();
    }
  }, [user?.id, loadIntegrations, loadAvailablePlatforms]);

  // Connect integration with proper authentication
  const connectIntegration = useCallback(async (platform: string) => {
    if (!user?.id) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Simulate OAuth flow (in real app, this would redirect to platform)
      const credentials = {
        access_token: 'mock_token_' + Date.now(),
        refresh_token: 'mock_refresh_' + Date.now(),
        expires_at: new Date(Date.now() + 3600000).toISOString()
      };

      const { data: result, error } = await consolidatedIntegrationService.connectIntegration(user.id, platform, credentials);
      
      if (error) {
        throw new Error(error);
      }
      
      if (result?.success) {
        await loadIntegrations(); // Reload integrations
        toast({
          title: 'Integration Connected',
          description: `${platform} has been successfully connected.`,
        });
      } else {
        setError(result?.error || 'Failed to connect integration');
      }
    } catch (error) {
      logger.error('Error connecting integration:', error);
      setError('Failed to connect integration');
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect integration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [user?.id, loadIntegrations]);

  // Disconnect integration with proper authentication
  const disconnectIntegration = useCallback(async (platform: string) => {
    if (!user?.id) return;

    try {
      const { data: result, error } = await integrationService.disconnectIntegration(user.id, platform);
      
      if (error) {
        throw new Error(error);
      }
      
      if (result?.success) {
        await loadIntegrations(); // Reload integrations
        toast({
          title: 'Integration Disconnected',
          description: `${platform} has been successfully disconnected.`,
        });
      } else {
        setError(result?.error || 'Failed to disconnect integration');
      }
    } catch (error) {
      logger.error('Error disconnecting integration:', error);
      setError('Failed to disconnect integration');
      toast({
        title: 'Disconnection Failed',
        description: 'Failed to disconnect integration. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user?.id, loadIntegrations]);

  // Sync integration with proper authentication
  const syncIntegration = useCallback(async (platform: string) => {
    if (!user?.id) return;

    try {
      const { data: result, error } = await integrationService.syncIntegration(user.id, platform);
      
      if (error) {
        throw new Error(error);
      }
      
      if (result?.success) {
        await loadIntegrations(); // Reload integrations
        toast({
          title: 'Sync Complete',
          description: `Successfully synced ${result.recordsProcessed} records from ${platform}.`,
        });
      } else {
        setError(result?.errors?.join(', ') || 'Failed to sync integration');
      }
    } catch (error) {
      logger.error('Error syncing integration:', error);
      setError('Failed to sync integration');
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync integration. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user?.id, loadIntegrations]);

  // Test integration connection
  const testConnection = useCallback(async (platform: string) => {
    if (!user?.id) return;

    try {
      const { data: result, error } = await integrationService.testConnection(user.id, platform);
      
      if (error) {
        throw new Error(error);
      }
      
      if (result?.success) {
        toast({
          title: 'Connection Test Successful',
          description: `${platform} connection is working properly.`,
        });
      } else {
        toast({
          title: 'Connection Test Failed',
          description: result?.error || 'Connection test failed.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logger.error('Error testing connection:', error);
      toast({
        title: 'Connection Test Failed',
        description: 'Failed to test connection. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="secondary">Disconnected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading integrations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    loadIntegrations();
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Integrations</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={loadIntegrations}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {integrations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <AlertCircle className="h-12 w-12" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No integrations connected</h3>
            <p className="mt-2 text-sm text-gray-500">
              Connect your first integration to get started with data synchronization.
            </p>
            <div className="mt-6">
              <Button onClick={() => connectIntegration('demo')} disabled={isConnecting}>
                {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Connect Demo Integration
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{integration.integration_name}</CardTitle>
                  {getStatusIcon(integration.status)}
                </div>
                <div className="flex items-center justify-between">
                  {getStatusBadge(integration.status)}
                  {integration.last_sync_at && (
                    <span className="text-xs text-gray-500">
                      Last sync: {new Date(integration.last_sync_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection(integration.integration_name)}
                  >
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncIntegration(integration.integration_name)}
                  >
                    Sync
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => disconnectIntegration(integration.integration_name)}
                  >
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}; 
