import { useState, useEffect, useCallback } from 'react';
import { oauthIntegrationService } from '@/services/integrations/OAuthIntegrationService';
import type { 
  OAuthIntegration, 
  OAuthConnectionRequest, 
  OAuthCallbackRequest, 
  OAuthConnectionResult,
  ManualSyncRequest,
  ManualSyncResult,
  OAuthProvider
} from '@/core/types/integrations';

interface UseOAuthIntegrationsOptions {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useOAuthIntegrations = (options: UseOAuthIntegrationsOptions) => {
  const { userId, autoRefresh = true, refreshInterval = 30000 } = options;
  
  const [integrations, setIntegrations] = useState<OAuthIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusSummary, setStatusSummary] = useState({
    total: 0,
    connected: 0,
    disconnected: 0,
    error: 0,
    pending: 0
  });

  // Fetch integrations
  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [integrationsData, summaryData] = await Promise.all([
        oauthIntegrationService.getUserOAuthIntegrations(userId),
        oauthIntegrationService.getIntegrationStatusSummary(userId)
      ]);
      
      setIntegrations(integrationsData);
      setStatusSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Start OAuth flow
  const startOAuthFlow = useCallback(async (request: OAuthConnectionRequest) => {
    try {
      setError(null);
      return await oauthIntegrationService.startOAuthFlow(request);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start OAuth flow';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Complete OAuth flow
  const completeOAuthFlow = useCallback(async (request: OAuthCallbackRequest) => {
    try {
      setError(null);
      const result = await oauthIntegrationService.completeOAuthFlow(request);
      
      // Refresh integrations after successful connection
      if (result.success) {
        await fetchIntegrations();
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete OAuth flow';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchIntegrations]);

  // Disconnect integration
  const disconnectIntegration = useCallback(async (integrationId: string) => {
    try {
      setError(null);
      await oauthIntegrationService.disconnectIntegration(integrationId, userId);
      
      // Update local state
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'disconnected' as const }
          : integration
      ));
      
      // Refresh summary
      const summary = await oauthIntegrationService.getIntegrationStatusSummary(userId);
      setStatusSummary(summary);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect integration';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [userId]);

  // Manual sync
  const manualSync = useCallback(async (request: ManualSyncRequest) => {
    try {
      setError(null);
      const result = await oauthIntegrationService.manualSync(request);
      
      // Update last sync timestamp in local state
      if (result.success) {
        setIntegrations(prev => prev.map(integration => 
          integration.id === request.integrationId 
            ? { ...integration, lastSyncAt: result.syncedAt }
            : integration
        ));
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync integration';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Test connection
  const testConnection = useCallback(async (provider: OAuthProvider, accessToken: string) => {
    try {
      setError(null);
      return await oauthIntegrationService.testConnection(provider, accessToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test connection';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Check if user has connected a specific provider
  const hasProviderConnection = useCallback(async (provider: OAuthProvider) => {
    try {
      return await oauthIntegrationService.hasProviderConnection(userId, provider);
    } catch (err) {
      console.error('Error checking provider connection:', err);
      return false;
    }
  }, [userId]);

  // Get integration by ID
  const getIntegrationById = useCallback((integrationId: string) => {
    return integrations.find(integration => integration.id === integrationId);
  }, [integrations]);

  // Get integrations by provider
  const getIntegrationsByProvider = useCallback((provider: OAuthProvider) => {
    return integrations.filter(integration => integration.provider === provider);
  }, [integrations]);

  // Get integrations by status
  const getIntegrationsByStatus = useCallback((status: OAuthIntegration['status']) => {
    return integrations.filter(integration => integration.status === status);
  }, [integrations]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchIntegrations, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchIntegrations]);

  return {
    // State
    integrations,
    loading,
    error,
    statusSummary,
    
    // Actions
    fetchIntegrations,
    startOAuthFlow,
    completeOAuthFlow,
    disconnectIntegration,
    manualSync,
    testConnection,
    hasProviderConnection,
    
    // Queries
    getIntegrationById,
    getIntegrationsByProvider,
    getIntegrationsByStatus,
    
    // Utilities
    clearError
  };
};
