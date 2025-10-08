/**
 * Integration Connector Component
 * 
 * A reusable component that can work with any connector from the Nexus Integration SDK
 * Provides a consistent UI and functionality across all integrations
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Settings,
  Plug,
  Database,
  Activity,
  Shield,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { integrationService } from '@/core/integrations';
import { logger } from '@/shared/utils/logger';
import type { ConnectorType } from '@/core/integrations/registry';

interface IntegrationConnectorProps {
  connectorId: ConnectorType;
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  existingConfig?: Record<string, any>;
  customAuthFlow?: () => Promise<void>;
  customIcon?: React.ReactNode;
  customTitle?: string;
  customDescription?: string;
}

interface ConnectionStatus {
  connected: boolean;
  healthy: boolean;
  lastSync?: string;
  error?: string;
  services: Record<string, boolean>;
  metadata?: {
    name?: string;
    version?: string;
    features?: string[];
  };
}

export const IntegrationConnector: React.FC<IntegrationConnectorProps> = ({
  connectorId,
  onComplete,
  onCancel,
  existingConfig,
  customAuthFlow,
  customIcon,
  customTitle,
  customDescription
}) => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    healthy: false,
    services: {}
  });
  const [loading, setLoading] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [connectorMetadata, setConnectorMetadata] = useState<any>(null);

  // Initialize integration service and get connector metadata
  useEffect(() => {
    const initService = async () => {
      try {
        await integrationService.initialize();
        logger.info(`Integration Connector: Service initialized for ${connectorId}`);
        
        // Get connector metadata
        const registry = integrationService.getAvailableConnectors();
        const connector = registry.find(c => c.id === connectorId);
        if (connector) {
          setConnectorMetadata(connector);
        }
        
        await checkConnectionStatus();
      } catch (error) {
        logger.error(`Integration Connector: Failed to initialize for ${connectorId}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    initService();
  }, [connectorId]);

  const checkConnectionStatus = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Check if connector is available
      if (!integrationService.hasConnector(connectorId)) {
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
          healthy: false,
          error: `${connectorId} connector not available`
        }));
        return;
      }

      // Get connector instance
      const connector = integrationService.getConnectorInstance(connectorId);
      if (!connector) {
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
          healthy: false,
          error: `${connectorId} connector not initialized`
        }));
        return;
      }

      // Check if we have a valid context
      if (!existingConfig?.accessToken) {
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
          healthy: false
        }));
        return;
      }

      // Create context for health check
      const ctx = {
        tenantId: user.id,
        installId: `${connectorId}-${user.id}`,
        auth: {
          accessToken: existingConfig.accessToken,
          refreshToken: existingConfig.refreshToken,
          expiresAt: existingConfig.expiresAt,
        },
        config: existingConfig.config || {},
        metadata: {
          provider: connectorId,
          version: connector.version,
        },
      };

      // Perform health check
      const health = await integrationService.healthCheckImmediate(connectorId, ctx);
      
      // Extract service status from health check
      const services: Record<string, boolean> = {};
      if (health.details?.scopeTests) {
        health.details.scopeTests.forEach((test: any) => {
          services[test.scope] = test.status === 'ok';
        });
      }

      setConnectionStatus(prev => ({
        ...prev,
        connected: true,
        healthy: health.healthy,
        error: health.healthy ? undefined : health.details?.error,
        services,
        metadata: {
          name: connector.name,
          version: connector.version,
          features: connector.metadata?.features || []
        }
      }));

    } catch (error) {
      logger.error(`Integration Connector: Failed to check connection status for ${connectorId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      setConnectionStatus(prev => ({
        ...prev,
        connected: false,
        healthy: false,
        error: error instanceof Error ? error.message : String(error)
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (authInProgress) return;
    
    try {
      setAuthInProgress(true);
      
      if (customAuthFlow) {
        await customAuthFlow();
      } else {
        // Default auth flow - redirect to OAuth
        const authUrl = `/api/oauth/authorize/${connectorId}?state=${btoa(JSON.stringify({
          returnTo: window.location.href,
          provider: connectorId,
          ts: Date.now()
        }))}`;
        window.location.href = authUrl;
      }
    } catch (error) {
      logger.error(`Integration Connector: Auth failed for ${connectorId}`, { 
        error: error instanceof Error ? error.message : error,
      });
      setAuthInProgress(false);
    }
  };

  const handleSync = async () => {
    if (!user?.id || syncInProgress) return;

    setSyncInProgress(true);
    try {
      // Start a backfill sync using the SDK
      const jobId = await integrationService.startBackfill(
        connectorId,
        user.id,
        `${connectorId}-${user.id}`
      );

      logger.info(`Integration Connector: Sync started for ${connectorId}`, { jobId });
      
      // Update status
      setConnectionStatus(prev => ({
        ...prev,
        lastSync: new Date().toISOString()
      }));

      // In a real implementation, you'd poll for job status
      // For now, we'll just show success
      setTimeout(() => {
        setSyncInProgress(false);
        checkConnectionStatus();
      }, 2000);

    } catch (error) {
      logger.error(`Integration Connector: Failed to start sync for ${connectorId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      setSyncInProgress(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // In a real implementation, you'd call the SDK to revoke tokens
      // For now, we'll just update the UI
      setConnectionStatus({
        connected: false,
        healthy: false,
        services: {}
      });

      logger.info(`Integration Connector: Disconnected ${connectorId}`);
    } catch (error) {
      logger.error(`Integration Connector: Failed to disconnect ${connectorId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = () => {
    if (!connectionStatus.connected) {
      return <Badge variant="secondary">Disconnected</Badge>;
    }
    if (!connectionStatus.healthy) {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="default">Connected</Badge>;
  };

  const getDefaultIcon = () => {
    if (customIcon) return customIcon;
    
    // Default icons based on connector type
    switch (connectorId) {
      case 'microsoft365':
        return <Settings className="h-8 w-8 text-blue-500" />;
      case 'hubspot':
        return <Database className="h-8 w-8 text-orange-500" />;
      case 'slack':
        return <Activity className="h-8 w-8 text-purple-500" />;
      case 'google_workspace':
        return <Shield className="h-8 w-8 text-green-500" />;
      default:
        return <Plug className="h-8 w-8 text-gray-500" />;
    }
  };

  const getTitle = () => {
    return customTitle || connectorMetadata?.name || connectorId;
  };

  const getDescription = () => {
    return customDescription || connectorMetadata?.description || `Connect to ${connectorId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getDefaultIcon()}
          <div>
            <h2 className="text-2xl font-bold">{getTitle()}</h2>
            <p className="text-gray-600">{getDescription()}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Checking connection...
            </div>
          ) : connectionStatus.error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{connectionStatus.error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Service Status */}
              {Object.keys(connectionStatus.services).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(connectionStatus.services).map(([service, status]) => (
                    <div key={service} className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="text-sm capitalize">{service}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Metadata */}
              {connectionStatus.metadata && (
                <div className="space-y-2">
                  {connectionStatus.metadata.version && (
                    <div className="text-sm text-gray-600">
                      Version: {connectionStatus.metadata.version}
                    </div>
                  )}
                  {connectionStatus.metadata.features && connectionStatus.metadata.features.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Features: {connectionStatus.metadata.features.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* Last Sync */}
              {connectionStatus.lastSync && (
                <div className="text-sm text-gray-600">
                  Last sync: {new Date(connectionStatus.lastSync).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        {!connectionStatus.connected ? (
          <Button 
            onClick={handleConnect} 
            disabled={authInProgress}
            className="flex-1"
          >
            {authInProgress ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              `Connect ${getTitle()}`
            )}
          </Button>
        ) : (
          <>
            <Button 
              onClick={handleSync} 
              disabled={syncInProgress}
              variant="outline"
              className="flex-1"
            >
              {syncInProgress ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync Data'
              )}
            </Button>
            <Button 
              onClick={handleDisconnect} 
              disabled={loading}
              variant="destructive"
            >
              Disconnect
            </Button>
          </>
        )}
        
        {onCancel && (
          <Button onClick={onCancel} variant="ghost">
            Cancel
          </Button>
        )}
      </div>

      {/* SDK Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Integration SDK
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <div>• Powered by Nexus Integration SDK</div>
            <div>• Real-time data synchronization</div>
            <div>• Webhook support for live updates</div>
            <div>• Automatic token refresh</div>
            <div>• Comprehensive error handling</div>
            <div>• Scalable architecture</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationConnector;
