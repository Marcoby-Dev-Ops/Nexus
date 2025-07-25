import { supabase } from '@/lib/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger.ts';

export interface Integration {
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

export interface IntegrationStatus {
  platform: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  errorMessage?: string;
  dataCount?: number;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  duration: number;
}

export interface PlatformConfig {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  authType: 'oauth' | 'api_key' | 'webhook';
  scopes: string[];
  features: string[];
}

export class IntegrationService {
  private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Get user integrations with proper authentication
   */
  async getUserIntegrations(userId: string): Promise<Integration[]> {
    try {
      const { data, error } = await this.queryWrapper.getUserIntegrations(userId);

      if (error) {
        logger.error('Error fetching user integrations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getUserIntegrations:', error);
      return [];
    }
  }

  /**
   * Get integration status with proper authentication
   */
  async getIntegrationStatus(userId: string, platform: string): Promise<IntegrationStatus | null> {
    try {
      const { data, error } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', userId)
          .eq('platform', platform)
          .single(),
        userId,
        'get-integration-status'
      );

      if (error) {
        logger.error('Error fetching integration status:', error);
        return null;
      }

      if (!data) {
        return {
          platform,
          status: 'disconnected'
        };
      }

      return {
        platform: data.platform,
        status: data.status,
        lastSync: data.last_sync,
        errorMessage: data.error_message,
        dataCount: data.data_count
      };
    } catch (error) {
      logger.error('Error in getIntegrationStatus:', error);
      return null;
    }
  }

  /**
   * Connect integration with proper authentication
   */
  async connectIntegration(userId: string, platform: string, credentials: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('user_integrations')
          .upsert({
            user_id: userId,
            platform,
            status: 'connected',
            credentials,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }),
        userId,
        'connect-integration'
      );

      if (error) {
        throw new Error(error.message || 'Failed to connect integration');
      }

      logger.info(`Integration ${platform} connected for user ${userId}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect integration';
      logger.error('Error connecting integration:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Disconnect integration with proper authentication
   */
  async disconnectIntegration(userId: string, platform: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('user_integrations')
          .update({
            status: 'disconnected',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('platform', platform),
        userId,
        'disconnect-integration'
      );

      if (error) {
        throw new Error(error.message || 'Failed to disconnect integration');
      }

      logger.info(`Integration ${platform} disconnected for user ${userId}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect integration';
      logger.error('Error disconnecting integration:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update integration settings with proper authentication
   */
  async updateIntegrationSettings(userId: string, platform: string, settings: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('user_integrations')
          .update({
            settings,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('platform', platform),
        userId,
        'update-integration-settings'
      );

      if (error) {
        throw new Error(error.message || 'Failed to update integration settings');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update integration settings';
      logger.error('Error updating integration settings:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sync integration data with proper authentication
   */
  async syncIntegration(userId: string, platform: string): Promise<SyncResult> {
    try {
      logger.info(`Starting sync for ${platform} integration for user ${userId}`);

      const startTime = Date.now();

      // Get integration details
      const integration = await this.getIntegrationStatus(userId, platform);
      if (!integration || integration.status !== 'connected') {
        throw new Error(`Integration ${platform} is not connected`);
      }

      // Perform sync (placeholder - integrate with actual platform APIs)
      const syncResult = await this.performPlatformSync(platform, userId);

      // Update last sync time with proper authentication
      await this.queryWrapper.userQuery(
        async () => supabase
          .from('user_integrations')
          .update({
            last_sync: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('platform', platform),
        userId,
        'update-sync-time'
      );

      const duration = Date.now() - startTime;
      logger.info(`Sync completed for ${platform} in ${duration}ms`);

      return {
        success: syncResult.success,
        recordsProcessed: syncResult.recordsProcessed,
        errors: syncResult.errors,
        duration
      };
    } catch (error) {
      logger.error(`Error syncing ${platform} integration:`, error);
      return {
        success: false,
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: 0
      };
    }
  }

  /**
   * Get available platforms
   */
  async getAvailablePlatforms(): Promise<PlatformConfig[]> {
    try {
      const { data, error } = await this.queryWrapper.query(
        async () => supabase
          .from('integration_platforms')
          .select('*')
          .eq('is_active', true)
          .order('display_name'),
        { context: 'get-available-platforms' }
      );

      if (error) {
        logger.error('Error fetching available platforms:', error);
        return this.getDefaultPlatforms();
      }

      return data || this.getDefaultPlatforms();
    } catch (error) {
      logger.error('Error in getAvailablePlatforms:', error);
      return this.getDefaultPlatforms();
    }
  }

  /**
   * Get integration analytics with proper authentication
   */
  async getIntegrationAnalytics(userId: string): Promise<any> {
    try {
      const { data, error } = await this.queryWrapper.userQuery(
        async () => supabase
          .rpc('get_integration_analytics', { user_id: userId }),
        userId,
        'get-integration-analytics'
      );

      if (error) {
        logger.error('Error fetching integration analytics:', error);
        return {};
      }

      return data || {};
    } catch (error) {
      logger.error('Error in getIntegrationAnalytics:', error);
      return {};
    }
  }

  /**
   * Test integration connection with proper authentication
   */
  async testConnection(userId: string, platform: string): Promise<{ success: boolean; error?: string }> {
    try {
      const integration = await this.getIntegrationStatus(userId, platform);
      if (!integration || integration.status !== 'connected') {
        return { success: false, error: 'Integration not connected' };
      }

      // Test connection (placeholder - integrate with actual platform APIs)
      const testResult = await this.performConnectionTest(platform, userId);

      return { success: testResult.success, error: testResult.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to test connection';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Perform platform-specific sync (placeholder implementation)
   */
  private async performPlatformSync(_platform: string, _userId: string): Promise<{ success: boolean; recordsProcessed: number; errors: string[] }> {
    // This is a placeholder implementation
    // In a real application, this would call the actual platform APIs
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    return {
      success: true,
      recordsProcessed: Math.floor(Math.random() * 100) + 10,
      errors: []
    };
  }

  /**
   * Perform connection test (placeholder implementation)
   */
  private async performConnectionTest(_platform: string, _userId: string): Promise<{ success: boolean; error?: string }> {
    // This is a placeholder implementation
    // In a real application, this would test the actual platform connection
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    return { success: true };
  }

  /**
   * Get default platforms when database is unavailable
   */
  private getDefaultPlatforms(): PlatformConfig[] {
    return [
      {
        name: 'hubspot',
        displayName: 'HubSpot',
        description: 'CRM and marketing automation platform',
        icon: 'hubspot',
        authType: 'oauth',
        scopes: ['contacts', 'companies', 'deals'],
        features: ['CRM', 'Marketing', 'Sales']
      },
      {
        name: 'google_workspace',
        displayName: 'Google Workspace',
        description: 'Email, calendar, and productivity tools',
        icon: 'google',
        authType: 'oauth',
        scopes: ['gmail', 'calendar', 'drive'],
        features: ['Email', 'Calendar', 'Storage']
      },
      {
        name: 'microsoft_365',
        displayName: 'Microsoft 365',
        description: 'Office productivity and collaboration tools',
        icon: 'microsoft',
        authType: 'oauth',
        scopes: ['mail', 'calendar', 'files'],
        features: ['Email', 'Calendar', 'Documents']
      }
    ];
  }
}

// Export singleton instance
export const integrationService = new IntegrationService(); 