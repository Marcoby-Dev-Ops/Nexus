import type { NexusIntegration, SyncResult as _SyncResult, SyncStatus } from '@/domains/integrations/lib/types';
import { unifiedAuthService } from './unifiedAuthService';
import type { IntegrationCredentials, AuthType } from './authTypes';
import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';

export type SyncResult = _SyncResult;

export abstract class BaseIntegration implements NexusIntegration {
  abstract id: string;
  abstract name: string;
  abstract dataFields: string[];
  abstract authType: AuthType; // 'oauth' | 'api_key' | 'basic_auth' | 'custom'

  /**
   * Get credentials for this integration
   */
  protected async getCredentials(userId: string): Promise<IntegrationCredentials | null> {
    return await unifiedAuthService.getCredentials(this.id, userId);
  }

  /**
   * Store credentials for this integration
   */
  protected async storeCredentials(userId: string, credentials: IntegrationCredentials): Promise<void> {
    await unifiedAuthService.storeCredentials(this.id, userId, credentials);
  }

  /**
   * Test connection with stored credentials
   */
  protected async testConnection(userId: string): Promise<boolean> {
    return await unifiedAuthService.testConnection(this.id, userId);
  }

  /**
   * Refresh OAuth tokens if needed
   */
  protected async refreshTokens(userId: string): Promise<IntegrationCredentials | null> {
    if (this.authType === 'oauth') {
      return await unifiedAuthService.refreshTokens(this.id, userId);
    }
    return null;
  }

  /**
   * Remove stored credentials
   */
  protected async removeCredentials(userId: string): Promise<void> {
    await unifiedAuthService.removeCredentials(this.id, userId);
  }

  /**
   * Create API client with appropriate authentication
   */
  protected async createApiClient(userId: string, baseUrl: string) {
    const credentials = await this.getCredentials(userId);
    if (!credentials) {
      throw new Error(`No credentials found for ${this.name} integration`);
    }

    return unifiedAuthService.createClient(baseUrl, credentials, {
      timeout: 30000,
      retries: 3
    });
  }

  /**
   * Validate API key for integrations that use API keys
   */
  protected async validateApiKey(
    apiKey: string,
    validationEndpoint: string,
    keyName?: string,
    keyLocation?: 'header' | 'query' | 'body'
  ): Promise<boolean> {
    return await unifiedAuthService.validateApiKey(apiKey, validationEndpoint, keyName, keyLocation);
  }

  abstract fetchProviderData(options: { userId: string; fullSync?: boolean }): Promise<Record<string, any[]>>;

  abstract sync(options: { userId: string; fullSync?: boolean }): Promise<SyncResult>;

  async getSyncStatus(_userId: string): Promise<SyncStatus> {
    // Placeholder: fetch from integration_sync_status table
    // Replace with actual DB call
    return {
      lastSyncedAt: null,
      nextSyncAt: null,
      status: 'idle',
      dataPointsSynced: 0
    };
  }

  /**
   * Get connection status for this integration
   */
  async getConnectionStatus(userId: string): Promise<{
    connected: boolean;
    lastSync?: string;
    dataPoints?: number;
    error?: string;
  }> {
    try {
      const connected = await this.testConnection(userId);
      
      if (!connected) {
        return { connected: false, error: `Not connected to ${this.name}` };
      }

      // Get sync metadata
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('last_sync_at')
        .eq('user_id', userId)
        .eq('integration_id', this.id)
        .single();

      return {
        connected: true,
        lastSync: integration?.last_sync_at || undefined,
        dataPoints: 0 // Will be calculated from actual data
      };
    } catch (error) {
      logger.error({ userId, error }, `Failed to get ${this.name} connection status`);
      return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Test the integration with stored credentials
   */
  async testIntegration(userId: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
  }> {
    try {
      logger.info({ userId, integration: this.name }, 'Testing integration');
      
      const connected = await this.testConnection(userId);
      if (!connected) {
        return {
          success: false,
          message: 'Connection test failed',
          error: `Unable to connect to ${this.name} API`
        };
      }

      return {
        success: true,
        message: `${this.name} integration is working correctly`,
        data: {
          integrationId: this.id,
          integrationName: this.name,
          authType: this.authType,
          lastTested: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error({ userId, integration: this.name, error }, 'Integration test failed');
      return {
        success: false,
        message: 'Integration test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 