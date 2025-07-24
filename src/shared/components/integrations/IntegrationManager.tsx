import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { integrationService } from '@/domains/integrations/services/integrationService';
import { logger } from '@/shared/utils/logger';

interface Integration {
  id: string;
  user_id: string;
  platform: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  credentials: any;
  settings: any;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

interface PlatformConfig {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  authType: 'oauth' | 'api_key' | 'webhook';
  scopes: string[];
  features: string[];
}

interface IntegrationManagerProps {
  onIntegrationChange?: (integrations: Integration[]) => void;
}

export const IntegrationManager: React.FC<IntegrationManagerProps> = ({ 
  onIntegrationChange 
}) => {
  const { user } = useAuth();
  
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<PlatformConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load user integrations with proper authentication
  const loadIntegrations = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const userIntegrations = await integrationService.getUserIntegrations(user.id);
      setIntegrations(userIntegrations);
      onIntegrationChange?.(userIntegrations);
    } catch (error) {
      logger.error('Error loading integrations:', error);
      setError('Failed to load integrations');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, onIntegrationChange]);

  // Load available platforms with proper authentication
  const loadAvailablePlatforms = useCallback(async () => {
    try {
      const platforms = await integrationService.getAvailablePlatforms();
      setAvailablePlatforms(platforms);
    } catch (error) {
      logger.error('Error loading available platforms:', error);
      setError('Failed to load available platforms');
    }
  }, []);

  // Load data on mount
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

      const result = await integrationService.connectIntegration(user.id, platform, credentials);
      
      if (result.success) {
        await loadIntegrations(); // Reload integrations
      } else {
        setError(result.error || 'Failed to connect integration');
      }
    } catch (error) {
      logger.error('Error connecting integration:', error);
      setError('Failed to connect integration');
    } finally {
      setIsConnecting(false);
    }
  }, [user?.id, loadIntegrations]);

  // Disconnect integration with proper authentication
  const disconnectIntegration = useCallback(async (platform: string) => {
    if (!user?.id) return;

    try {
      const result = await integrationService.disconnectIntegration(user.id, platform);
      
      if (result.success) {
        await loadIntegrations(); // Reload integrations
      } else {
        setError(result.error || 'Failed to disconnect integration');
      }
    } catch (error) {
      logger.error('Error disconnecting integration:', error);
      setError('Failed to disconnect integration');
    }
  }, [user?.id, loadIntegrations]);

  // Sync integration with proper authentication
  const syncIntegration = useCallback(async (platform: string) => {
    if (!user?.id) return;

    try {
      const result = await integrationService.syncIntegration(user.id, platform);
      
      if (result.success) {
        logger.info(`Sync completed for ${platform}: ${result.recordsProcessed} records processed`);
        await loadIntegrations(); // Reload to get updated last_sync
      } else {
        setError(`Sync failed for ${platform}: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      logger.error(`Error syncing ${platform}:`, error);
      setError(`Failed to sync ${platform}`);
    }
  }, [user?.id, loadIntegrations]);

  // Test connection with proper authentication
  const testConnection = useCallback(async (platform: string) => {
    if (!user?.id) return;

    try {
      const result = await integrationService.testConnection(user.id, platform);
      
      if (result.success) {
        logger.info(`Connection test successful for ${platform}`);
      } else {
        setError(`Connection test failed for ${platform}: ${result.error}`);
      }
    } catch (error) {
      logger.error(`Error testing connection for ${platform}:`, error);
      setError(`Failed to test connection for ${platform}`);
    }
  }, [user?.id]);

  if (!user?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please log in to manage integrations</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
        <button
          onClick={() => setSelectedPlatform('')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Integration
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Connected Integrations */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Integrations</h3>
        {integrations.length === 0 ? (
          <p className="text-gray-500">No integrations connected yet.</p>
        ) : (
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {integration.platform.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {integration.platform.charAt(0).toUpperCase() + integration.platform.slice(1)}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Status: {integration.status}
                      {integration.last_sync && (
                        <span className="ml-2">
                          • Last sync: {new Date(integration.last_sync).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => testConnection(integration.platform)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => syncIntegration(integration.platform)}
                    className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                  >
                    Sync
                  </button>
                  <button
                    onClick={() => disconnectIntegration(integration.platform)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Platforms */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Platforms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePlatforms.map((platform) => {
            const isConnected = integrations.some(i => i.platform === platform.name);
            
            return (
              <div
                key={platform.name}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {platform.icon.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{platform.displayName}</h4>
                    <p className="text-xs text-gray-500">{platform.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {platform.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  {isConnected ? (
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Connected
                    </div>
                  ) : (
                    <button
                      onClick={() => connectIntegration(platform.name)}
                      disabled={isConnecting}
                      className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 