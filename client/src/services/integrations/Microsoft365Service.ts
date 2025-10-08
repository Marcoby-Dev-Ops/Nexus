import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { selectData, upsertOne, deleteOne } from '@/lib/database';
import { msalInstance } from '@/shared/auth/msal';

export interface Microsoft365Config {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
}

export interface Microsoft365Connection {
  id: string;
  user_id: string;
  integration_slug: 'microsoft365';
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
  status: 'active' | 'expired' | 'error';
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export class Microsoft365Service extends BaseService {
  private readonly INTEGRATION_SLUG = 'microsoft365';
  private readonly GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

  constructor() {
    super();
  }

  /**
   * Connect Microsoft 365 account
   */
  async connect(userId: string, config: Microsoft365Config): Promise<ServiceResponse<Microsoft365Connection>> {
    return this.executeDbOperation(async () => {
      try {
        logger.info('Connecting Microsoft 365 for user', { userId });

        // Use upsert to handle both insert and update cases
        const { data, error } = await upsertOne('user_integrations', {
          user_id: userId,
          integration_slug: this.INTEGRATION_SLUG,
          access_token: config.access_token,
          refresh_token: config.refresh_token,
          expires_at: config.expires_at,
          scope: config.scope,
          status: 'active',
          token_type: 'Bearer',
          updated_at: new Date().toISOString()
        }, 'user_id,integration_slug');

        if (error) throw error;
        return this.createSuccessResponse(data as Microsoft365Connection);
      } catch (error) {
        logger.error('Failed to connect Microsoft 365', { userId, error });
        return this.createErrorResponse('Failed to connect Microsoft 365');
      }
    }, 'connect Microsoft 365');
  }

  /**
   * Get user's Microsoft 365 connection
   */
  async getConnection(userId: string): Promise<ServiceResponse<Microsoft365Connection | null>> {
    return this.executeDbOperation(async () => {
      try {
        const { data, error } = await selectData('user_integrations', '*', {
          user_id: userId,
          integration_slug: this.INTEGRATION_SLUG
        });

        if (error) throw error;
        const connection = data && data.length > 0 ? data[0] : null;
        return this.createSuccessResponse(connection as Microsoft365Connection | null);
      } catch (error) {
        logger.error('Failed to get Microsoft 365 connection', { userId, error });
        return this.createErrorResponse('Failed to get Microsoft 365 connection');
      }
    }, 'get Microsoft 365 connection');
  }

  /**
   * Refresh access token using MSAL's built-in capabilities
   */
  async refreshAccessToken(userId: string): Promise<ServiceResponse<{ access_token: string; expires_at: string }>> {
    return this.executeDbOperation(async () => {
      try {
        logger.info('Refreshing Microsoft 365 access token', { userId });

        // Get current connection
        const connectionResult = await this.getConnection(userId);
        if (!connectionResult.success || !connectionResult.data) {
          return this.createErrorResponse('No Microsoft 365 connection found');
        }

        const connection = connectionResult.data;

        // Use MSAL instance from static import
        
        // Get active account from MSAL
        let account = msalInstance.getActiveAccount();
        if (!account) {
          logger.warn('No active MSAL account found, attempting to get from cache');
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length === 0) {
            return this.createErrorResponse('No MSAL account found. Please reconnect your Microsoft 365 account.');
          }
          // Use the first available account
          msalInstance.setActiveAccount(accounts[0]);
          account = accounts[0];
        }

        // Attempt silent token acquisition
        const silentResult = await msalInstance.acquireTokenSilent({
          scopes: connection.scope.split(' ').filter(scope => scope !== 'offline_access'),
          account: account,
        });

        if (!silentResult.accessToken) {
          return this.createErrorResponse('Failed to acquire new access token');
        }

        // Update the connection with new token
        const expiresAtIso = silentResult.expiresOn ? silentResult.expiresOn.toISOString() : new Date(Date.now() + (3600 * 1000)).toISOString();
        
        const { data, error } = await upsertOne('user_integrations', {
          id: connection.id,
          access_token: silentResult.accessToken,
          expires_at: expiresAtIso,
          updated_at: new Date().toISOString()
        }, 'id');

        if (error) throw error;

        logger.info('Successfully refreshed Microsoft 365 access token', { userId });
        return this.createSuccessResponse({
          access_token: silentResult.accessToken,
          expires_at: expiresAtIso
        });
      } catch (error) {
        logger.error('Failed to refresh Microsoft 365 access token', { userId, error });
        return this.createErrorResponse('Failed to refresh access token');
      }
    }, 'refresh Microsoft 365 access token');
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(userId: string): Promise<ServiceResponse<string>> {
    return this.executeDbOperation(async () => {
      try {
        const connectionResult = await this.getConnection(userId);
        if (!connectionResult.success || !connectionResult.data) {
          return this.createErrorResponse('No Microsoft 365 connection found');
        }

        const connection = connectionResult.data;

        // Check if token is expired or will expire soon (5 minute buffer)
        const expiresAt = new Date(connection.expires_at);
        const bufferTime = new Date(Date.now() + (5 * 60 * 1000));
        
        if (expiresAt <= bufferTime) {
          logger.info('Microsoft 365 token expired or expiring soon, refreshing', { userId });
          const refreshResult = await this.refreshAccessToken(userId);
          if (!refreshResult.success || !refreshResult.data) {
            return this.createErrorResponse('Failed to refresh access token');
          }
          return this.createSuccessResponse(refreshResult.data.access_token);
        }

        return this.createSuccessResponse(connection.access_token);
      } catch (error) {
        logger.error('Failed to get valid Microsoft 365 access token', { userId, error });
        return this.createErrorResponse('Failed to get valid access token');
      }
    }, 'get valid Microsoft 365 access token');
  }

  /**
   * Test Microsoft 365 connection
   */
  async testConnection(userId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        const connection = await this.getConnection(userId);
        if (!connection.data) {
          return this.createErrorResponse('No Microsoft 365 connection found');
        }

        // Test API call to Microsoft Graph
        const response = await fetch(`${this.GRAPH_API_BASE}/me`, {
          headers: {
            'Authorization': `Bearer ${connection.data.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          // Try to refresh token if expired
          if (response.status === 401) {
            const refreshResult = await this.refreshToken(userId);
            if (refreshResult.error) {
              return this.createErrorResponse('Token expired and refresh failed');
            }
            return this.createSuccessResponse(true);
          }
          return this.createErrorResponse('API test failed');
        }

        return this.createSuccessResponse(true);
      } catch (error) {
        logger.error('Failed to test Microsoft 365 connection', { userId, error });
        return this.createErrorResponse('Failed to test connection');
      }
    }, 'test Microsoft 365 connection');
  }

  /**
   * Refresh access token
   */
  private async refreshToken(userId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        const connection = await this.getConnection(userId);
        if (!connection.data?.refresh_token) {
          return this.createErrorResponse('No refresh token available');
        }

        const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
            client_secret: import.meta.env.VITE_MICROSOFT_CLIENT_SECRET || '',
            grant_type: 'refresh_token',
            refresh_token: connection.data.refresh_token
          })
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const tokens = await response.json();
        
        // Update connection with new tokens
        const { error } = await upsertOne('user_integrations', {
          id: connection.data.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || connection.data.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          token_type: tokens.token_type || 'Bearer',
          updated_at: new Date().toISOString()
        }, 'id');

        if (error) throw error;
        return this.createSuccessResponse(true);
      } catch (error) {
        logger.error('Failed to refresh Microsoft 365 token', { userId, error });
        return this.createErrorResponse('Failed to refresh token');
      }
    }, 'refresh Microsoft 365 token');
  }

  /**
   * Disconnect Microsoft 365
   */
  async disconnect(userId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        const connection = await this.getConnection(userId);
        if (!connection.data) {
          return this.createSuccessResponse(true); // Already disconnected
        }

        const { error } = await deleteOne('user_integrations', connection.data.id);
        if (error) throw error;
        return this.createSuccessResponse(true);
      } catch (error) {
        logger.error('Failed to disconnect Microsoft 365', { userId, error });
        return this.createErrorResponse('Failed to disconnect Microsoft 365');
      }
    }, 'disconnect Microsoft 365');
  }

  /**
   * Get Microsoft Graph API data
   */
  async getGraphData(userId: string, endpoint: string): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      try {
        const connection = await this.getConnection(userId);
        if (!connection.data) {
          return this.createErrorResponse('No Microsoft 365 connection found');
        }

        const response = await fetch(`${this.GRAPH_API_BASE}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${connection.data.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            const refreshResult = await this.refreshToken(userId);
            if (refreshResult.error) {
              return this.createErrorResponse('Authentication failed');
            }
            // Retry the request with new token
            return this.getGraphData(userId, endpoint);
          }
          return this.createErrorResponse(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return this.createSuccessResponse(data);
      } catch (error) {
        logger.error('Failed to get Microsoft Graph data', { userId, endpoint, error });
        return this.createErrorResponse('Failed to get Microsoft Graph data');
      }
    }, 'get Microsoft Graph data');
  }
}

// Export singleton instance
export const microsoft365Service = new Microsoft365Service();
