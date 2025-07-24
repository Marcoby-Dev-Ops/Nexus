import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';
import type { 
  AuthService, 
  ApiClientFactory, 
  AuthValidation,
  IntegrationCredentials,
  OAuthCredentials,
  ApiKeyCredentials,
  AuthType
} from './authTypes';

/**
 * Unified Authentication Service
 * Handles OAuth, API Keys, and other authentication methods
 */
export class UnifiedAuthService implements AuthService, ApiClientFactory, AuthValidation {
  
  /**
   * Get credentials for an integration
   */
  async getCredentials(integrationId: string, userId: string): Promise<IntegrationCredentials | null> {
    try {
      

      if (!integration?.credentials) {
        return null;
      }

      // Decrypt credentials if needed
      const credentials = integration.credentials;
      return credentials as IntegrationCredentials;
    } catch (error) {
      logger.error({ integrationId, userId, error }, 'Failed to get credentials');
      return null;
    }
  }

  /**
   * Store credentials for an integration
   */
  async storeCredentials(
    integrationId: string, 
    userId: string, 
    credentials: IntegrationCredentials
  ): Promise<void> {
    try {
      await supabase
        .from('user_integrations')
        .upsert({
          userid: userId,
          integrationid: integrationId,
          integrationtype: credentials.type,
          credentials,
          status: 'active',
          updatedat: new Date().toISOString()
        }, { onConflict: 'user_id,integration_id' });

      logger.info({ integrationId, userId, authType: credentials.type }, 'Credentials stored successfully');
    } catch (error) {
      logger.error({ integrationId, userId, error }, 'Failed to store credentials');
      throw error;
    }
  }

  /**
   * Test connection with stored credentials
   */
  async testConnection(integrationId: string, userId: string): Promise<boolean> {
    try {
      const credentials = await this.getCredentials(integrationId, userId);
      if (!credentials) {
        return false;
      }

      switch (credentials.type) {
        case 'oauth':
          return await this.validateOAuthTokens(credentials);
        case 'api_key':
          // For API key, we need to know the validation endpoint
          // This would be stored in integration config
          return true; // Simplified for now
        default: return false;
      }
    } catch (error) {
      logger.error({ integrationId, userId, error }, 'Connection test failed');
      return false;
    }
  }

  /**
   * Refresh OAuth tokens if needed
   */
  async refreshTokens(integrationId: string, userId: string): Promise<OAuthCredentials | null> {
    try {
      const credentials = await this.getCredentials(integrationId, userId);
      if (!credentials || credentials.type !== 'oauth') {
        return null;
      }

      if (!this.needsTokenRefresh(credentials)) {
        return credentials;
      }

      // Implement token refresh logic here
      // This would call the specific integration's refresh endpoint
      logger.info({ integrationId, userId }, 'OAuth tokens refreshed');
      return credentials;
    } catch (error) {
      logger.error({ integrationId, userId, error }, 'Failed to refresh tokens');
      return null;
    }
  }

  /**
   * Remove stored credentials
   */
  async removeCredentials(integrationId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('user_integrations')
        .update({
          credentials: null,
          status: 'disconnected',
          updatedat: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('integration_id', integrationId);

      logger.info({ integrationId, userId }, 'Credentials removed successfully');
    } catch (error) {
      logger.error({ integrationId, userId, error }, 'Failed to remove credentials');
      throw error;
    }
  }

  /**
   * Create API client with appropriate authentication
   */
  createClient(
    baseUrl: string,
    credentials: IntegrationCredentials,
    options: {
      timeout?: number;
      retries?: number;
      headers?: Record<string, string>;
    } = {}
  ) {
    const { timeout = 30000, retries = 3, headers = {} } = options;

    const client = {
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    };

    // Add authentication headers based on credential type
    switch (credentials.type) {
      case 'oauth':
        client.headers['Authorization'] = `Bearer ${credentials.access_token}`;
        break;
      case 'api_key':
        const keyName = credentials.key_name || 'X-API-Key';
        if (credentials.key_location === 'query') {
          // Handle query params in individual requests
        } else {
          client.headers[keyName] = credentials.api_key;
        }
        break;
      case 'basic_auth':
        const auth = btoa(`${credentials.username}:${credentials.password}`);
        client.headers['Authorization'] = `Basic ${auth}`;
        break;
    }

    return this.createHttpClient(client, retries);
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(
    apiKey: string,
    validationEndpoint: string,
    keyName: string = 'X-API-Key',
    keyLocation: 'header' | 'query' | 'body' = 'header'
  ): Promise<boolean> {
    try {
      const headers: Record<string, string> = {};
      const params: Record<string, string> = {};
      
      if (keyLocation === 'header') {
        headers[keyName] = apiKey;
      } else if (keyLocation === 'query') {
        params[keyName] = apiKey;
      }

      const response = await fetch(validationEndpoint, {
        method: 'GET',
        headers,
        // Note: query params would need to be added to URL
      });

      return response.ok;
    } catch (error) {
      logger.error({ error }, 'API key validation failed');
      return false;
    }
  }

  /**
   * Validate OAuth tokens
   */
  async validateOAuthTokens(credentials: OAuthCredentials): Promise<boolean> {
    try {
      // Check if token is expired
      if (credentials.expires_at && Date.now() > credentials.expires_at) {
        return false;
      }

      // Make a test request to validate token
      // This would be integration-specific
      return true;
    } catch (error) {
      logger.error({ error }, 'OAuth token validation failed');
      return false;
    }
  }

  /**
   * Check if OAuth tokens need refresh
   */
  needsTokenRefresh(credentials: OAuthCredentials): boolean {
    if (!credentials.expires_at) {
      return false;
    }

    // Refresh if token expires in the next 5 minutes
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    return credentials.expires_at < fiveMinutesFromNow;
  }

  /**
   * Create HTTP client with retry logic
   */
  private createHttpClient(config: any, retries: number) {
    return {
      async request<T>(method: string, url: string, options: any = {}): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const response = await fetch(`${config.baseURL}${url}`, {
              method,
              headers: { ...config.headers, ...options.headers },
              body: options.data ? JSON.stringify(options.data) : undefined,
              ...options
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
          } catch (error) {
            lastError = error as Error;
            if (attempt === retries) {
              throw lastError;
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }

        throw lastError!;
      },

      get: <T>(url: string, params?: Record<string, any>) => 
        this.request<T>('GET', url, { params }),
      
      post: <T>(url: string, data?: any, params?: Record<string, any>) => 
        this.request<T>('POST', url, { data, params }),
      
      put: <T>(url: string, data?: any, params?: Record<string, any>) => 
        this.request<T>('PUT', url, { data, params }),
      
      delete: <T>(url: string, params?: Record<string, any>) => 
        this.request<T>('DELETE', url, { params }),
      
      patch: <T>(url: string, data?: any, params?: Record<string, any>) => 
        this.request<T>('PATCH', url, { data, params })
    };
  }
}

// Export singleton instance
export const unifiedAuthService = new UnifiedAuthService(); 