import { ApiManager } from '../ApiManager';
import type { 
  OAuthIntegration, 
  OAuthConnectionRequest, 
  OAuthCallbackRequest, 
  OAuthConnectionResult,
  ManualSyncRequest,
  ManualSyncResult,
  OAuthProvider
} from '@/core/types/integrations';

export class OAuthIntegrationService {
  private apiManager: ApiManager;

  constructor() {
    this.apiManager = new ApiManager();
  }

  /**
   * Start OAuth flow for a provider
   */
  async startOAuthFlow(request: OAuthConnectionRequest): Promise<{ authUrl: string; state: string }> {
    try {
      const response: any = await this.apiManager.get(`/api/oauth-providers/${request.provider}/start`, {
        params: {
          userId: request.userId,
          redirectUri: request.redirectUri
        }
      });
      
      return {
        authUrl: response.authUrl,
        state: response.state
      };
    } catch (error) {
      console.error('Error starting OAuth flow:', error);
      throw new Error('Failed to start OAuth flow');
    }
  }

  /**
   * Complete OAuth flow with callback
   */
  async completeOAuthFlow(request: OAuthCallbackRequest): Promise<OAuthConnectionResult> {
    try {
      const response: any = await this.apiManager.post(`/api/oauth-providers/${request.provider}/callback`, {
        code: request.code,
        state: request.state,
        userId: request.userId,
        redirectUri: request.redirectUri
      });
      
      return response;
    } catch (error) {
      console.error('Error completing OAuth flow:', error);
      throw new Error('Failed to complete OAuth flow');
    }
  }

  /**
   * Get user's OAuth integrations
   */
  async getUserOAuthIntegrations(userId: string): Promise<OAuthIntegration[]> {
    try {
      const response: any = await this.apiManager.get(`/api/oauth-providers/integrations/${userId}`);
      return response.integrations || [];
    } catch (error) {
      console.error('Error getting OAuth integrations:', error);
      throw new Error('Failed to get OAuth integrations');
    }
  }

  /**
   * Disconnect an OAuth integration
   */
  async disconnectIntegration(integrationId: string, userId: string): Promise<void> {
    try {
      await this.apiManager.post(`/api/oauth-providers/disconnect/${integrationId}`, {
        userId
      });
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      throw new Error('Failed to disconnect integration');
    }
  }

  /**
   * Manual sync for an integration
   */
  async manualSync(request: ManualSyncRequest): Promise<ManualSyncResult> {
    try {
      const response = await this.apiManager.post('/api/oauth-providers/sync', request);
      return response;
    } catch (error) {
      console.error('Error during manual sync:', error);
      throw new Error('Failed to sync integration');
    }
  }

  /**
   * Get sync history for an integration
   */
  async getSyncHistory(integrationId: string, userId: string): Promise<any> {
    try {
      const response: any = await this.apiManager.get(`/api/oauth-providers/sync/history/${integrationId}`, {
        params: { userId }
      });
      return response.history;
    } catch (error) {
      console.error('Error getting sync history:', error);
      throw new Error('Failed to get sync history');
    }
  }

  /**
   * Test connection for a provider
   */
  async testConnection(provider: OAuthProvider, accessToken: string): Promise<{ connected: boolean }> {
    try {
      const response = await this.apiManager.post(`/api/oauth-providers/${provider}/test`, {
        accessToken
      });
      return response;
    } catch (error) {
      console.error('Error testing connection:', error);
      throw new Error('Failed to test connection');
    }
  }

  /**
   * Get OAuth integration by ID
   */
  async getOAuthIntegration(integrationId: string, userId: string): Promise<OAuthIntegration | null> {
    try {
      const integrations = await this.getUserOAuthIntegrations(userId);
      return integrations.find(integration => integration.id === integrationId) || null;
    } catch (error) {
      console.error('Error getting OAuth integration:', error);
      return null;
    }
  }

  /**
   * Check if user has connected a specific provider
   */
  async hasProviderConnection(userId: string, provider: OAuthProvider): Promise<boolean> {
    try {
      const integrations = await this.getUserOAuthIntegrations(userId);
      return integrations.some(integration => 
        integration.provider === provider && integration.status === 'connected'
      );
    } catch (error) {
      console.error('Error checking provider connection:', error);
      return false;
    }
  }

  /**
   * Get integration status summary
   */
  async getIntegrationStatusSummary(userId: string): Promise<{
    total: number;
    connected: number;
    disconnected: number;
    error: number;
    pending: number;
  }> {
    try {
      const integrations = await this.getUserOAuthIntegrations(userId);
      const summary = {
        total: integrations.length,
        connected: 0,
        disconnected: 0,
        error: 0,
        pending: 0
      };

      integrations.forEach(integration => {
        summary[integration.status]++;
      });

      return summary;
    } catch (error) {
      console.error('Error getting integration status summary:', error);
      return {
        total: 0,
        connected: 0,
        disconnected: 0,
        error: 0,
        pending: 0
      };
    }
  }
}

// Export singleton instance
export const oauthIntegrationService = new OAuthIntegrationService();
