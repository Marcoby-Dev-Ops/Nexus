/**
 * Standardized Integration Service
 * 
 * Provides a unified interface for integration management using PostgreSQL
 * Replaces the legacy ConsolidatedIntegrationService with consistent patterns
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { authentikAuthService } from '@/core/auth/AuthentikAuthService';
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

export const IntegrationCredentialsSchema = z.object({
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
  expires_at: z.string().optional(),
  api_key: z.string().optional(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  scope: z.string().optional(),
});

export const UserIntegrationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  integration_id: z.string().uuid(),
  integration_slug: z.string(),
  status: z.enum(['connected', 'disconnected', 'error', 'pending', 'configuring']),
  config: IntegrationCredentialsSchema.optional(),
  settings: z.record(z.any()).optional(),
  last_sync_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const IntegrationPlatformSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  icon: z.string(),
  authType: z.enum(['oauth', 'api_key', 'basic_auth']),
  scopes: z.array(z.string()),
  features: z.array(z.string()),
});

export const ConnectionResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export const SyncResultSchema = z.object({
  success: z.boolean(),
  recordsProcessed: z.number(),
  errors: z.array(z.string()),
  duration: z.number(),
});

// ============================================================================
// TYPES
// ============================================================================

export type IntegrationCredentials = z.infer<typeof IntegrationCredentialsSchema>;
export type UserIntegration = z.infer<typeof UserIntegrationSchema>;
export type IntegrationPlatform = z.infer<typeof IntegrationPlatformSchema>;
export type ConnectionResult = z.infer<typeof ConnectionResultSchema>;
export type SyncResult = z.infer<typeof SyncResultSchema>;

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

/**
 * Integration Service
 * 
 * Provides standardized integration management using PostgreSQL database
 * Follows consistent patterns and error handling
 */
export class IntegrationService extends BaseService {
  
  // ============================================================================
  // AUTHENTICATION & VALIDATION
  // ============================================================================

  /**
   * Validate authentication and session before making database calls
   */
  private async validateAuth(): Promise<{ userId: string; error?: string }> {
    try {
      const { data: session, error } = await authentikAuthService.getSession();
      
      if (error || !session) {
        this.logger.error('Authentication validation failed', { error });
        return { userId: '', error: 'No valid session found' };
      }

      if (!session.user?.id) {
        this.logger.error('Session exists but no user ID found');
        return { userId: '', error: 'Invalid session - no user ID' };
      }

      // Validate session is not expired
      if (session.expires_at) {
        const expiresAtMs = typeof session.expires_at === 'number'
          ? session.expires_at * 1000
          : Date.parse(String(session.expires_at));
        if (expiresAtMs <= Date.now()) {
          this.logger.error('Session has expired');
          return { userId: '', error: 'Session expired' };
        }
      }

      return { userId: session.user.id };
    } catch (error) {
      this.logger.error('Unexpected error during auth validation', { error });
      return { userId: '', error: 'Authentication validation failed' };
    }
  }

  // ============================================================================
  // USER INTEGRATION MANAGEMENT
  // ============================================================================

  /**
   * Get user integrations
   */
  async getUserIntegrations(userId?: string): Promise<ServiceResponse<UserIntegration[]>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;

      // Get user integrations using standardized database interface
      const { data: userIntegrations, error: integrationsError } = await this.database.select<UserIntegration>(
        'user_integrations',
        '*',
        { user_id: targetUserId }
      );

      if (integrationsError) {
        return { data: null, error: integrationsError };
      }

      // Sort by updated_at descending
      const sortedIntegrations = (userIntegrations || []).sort((a, b) => {
        const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bDate - aDate;
      });

      return { data: sortedIntegrations, error: null };
    }, `get user integrations for user ${userId}`);
  }

  /**
   * Get available platforms
   */
  async getAvailablePlatforms(): Promise<ServiceResponse<IntegrationPlatform[]>> {
    return this.executeDbOperation(async () => {
      // Get available platforms from integrations table using standardized interface
      const { data: platforms, error: platformsError } = await this.database.select(
        'integrations',
        '*',
        { is_active: true }
      );

      if (platformsError) {
        return { data: null, error: platformsError };
      }

      // Sort by name ascending
      const sortedPlatforms = (platforms || []).sort((a: any, b: any) => a.name.localeCompare(b.name));

      // Transform to expected format
      const transformedPlatforms = sortedPlatforms.map((platform: any) => ({
        name: platform.slug,
        displayName: platform.name,
        description: platform.description || '',
        icon: platform.icon_url || '🔗',
        authType: 'api_key' as const, // Default auth type since it's not in the schema
        scopes: [], // Default empty array since it's not in the schema
        features: [], // Default empty array since it's not in the schema
      }));

      return { data: transformedPlatforms, error: null };
    }, 'get available platforms');
  }

  /**
   * Connect integration
   */
  async connectIntegration(userId: string, platform: string, credentials: IntegrationCredentials): Promise<ServiceResponse<ConnectionResult>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;

      // Get integration details using standardized database interface
      const { data: integrations, error: integrationError } = await this.database.select(
        'integrations',
        '*',
        { slug: platform }
      );

      if (integrationError || !integrations || integrations.length === 0) {
        return { data: null, error: 'Integration not found' };
      }

      const integration = integrations[0] as any;

      // Create or update user integration using standardized interface
      const { data: userIntegration, error: upsertError } = await this.database.insert('user_integrations', {
        user_id: targetUserId,
        integration_id: integration.id,
        integration_slug: integration.slug || integration.name,
        status: 'connected',
        config: credentials,
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        return { data: null, error: upsertError };
      }

      // Initialize unified client profiles after successful integration
      try {
        this.logger.info('Initializing unified client profiles for user:', targetUserId);
        
        const { data: unifiedResult, error: unifiedError } = await this.database.rpc('populate_unified_clients', { 
          user_id: targetUserId 
        });
        
        if (unifiedError) {
          this.logger.warn('Unified client initialization failed:', unifiedError);
          // Don't fail the integration setup, just log the warning
        } else {
          this.logger.info('Unified client profiles initialized successfully:', unifiedResult);
        }
      } catch (unifiedInitError) {
        this.logger.warn('Unified client initialization error:', unifiedInitError);
        // Don't fail the integration setup, just log the warning
      }

      return { data: { success: true }, error: null };
    }, `connect integration ${platform} for user ${userId}`);
  }

  /**
   * Disconnect integration
   */
  async disconnectIntegration(userId: string, platform: string): Promise<ServiceResponse<ConnectionResult>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;

      // Get integration details
      const { data: integrations, error: integrationError } = await this.database.select(
        'integrations',
        '*',
        { slug: platform }
      );

      if (integrationError || !integrations || integrations.length === 0) {
        return { data: null, error: 'Integration not found' };
      }

      const integration = integrations[0] as any;

      // Update user integration status to disconnected
      const { data: userIntegration, error: updateError } = await this.database.update(
        'user_integrations',
        { 
          status: 'disconnected',
          updated_at: new Date().toISOString()
        },
        { 
          user_id: targetUserId,
          integration_id: integration.id
        }
      );

      if (updateError) {
        return { data: null, error: updateError };
      }

      return { data: { success: true }, error: null };
    }, `disconnect integration ${platform} for user ${userId}`);
  }

  /**
   * Test integration connection
   */
  async testConnection(userId: string, platform: string): Promise<ServiceResponse<ConnectionResult>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;

      // Get user integration
      const { data: userIntegrations, error: integrationError } = await this.database.select(
        'user_integrations',
        '*',
        { user_id: targetUserId }
      );

      if (integrationError) {
        return { data: null, error: integrationError };
      }

      // Find the specific integration
      const userIntegration = userIntegrations?.find(ui => {
        // Check if the integration name matches the platform
              return ui.integration_slug?.toLowerCase().includes(platform.toLowerCase()) ||
        ui.integration_slug?.toLowerCase() === platform.toLowerCase();
      });

      if (!userIntegration) {
        return { data: null, error: 'Integration not found for user' };
      }

      // Simulate connection test (in real implementation, this would test the actual API)
      try {
        // For now, just check if the integration exists and has credentials
        const hasCredentials = userIntegration.config && 
          (userIntegration.config.access_token || userIntegration.config.api_key);

        if (!hasCredentials) {
          return { data: { success: false, error: 'No credentials found' }, error: null };
        }

        // Simulate API test
        await new Promise(resolve => setTimeout(resolve, 1000));

        return { data: { success: true }, error: null };
      } catch (error) {
        return { data: { success: false, error: 'Connection test failed' }, error: null };
      }
    }, `test connection for integration ${platform} and user ${userId}`);
  }

  /**
   * Sync integration data
   */
  async syncIntegration(userId: string, platform: string): Promise<ServiceResponse<SyncResult>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;
      const startTime = Date.now();

      try {
        // Get integration details
        const { data: integrations, error: integrationError } = await this.database.select(
          'integrations',
          '*',
          { slug: platform }
        );

        if (integrationError || !integrations || integrations.length === 0) {
          return { data: null, error: 'Integration not found' };
        }

        const integration = integrations[0] as any;

        // Simulate data sync (in real implementation, this would sync actual data)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update last sync time
        const { data: userIntegration, error: updateError } = await this.database.update(
          'user_integrations',
          {
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            user_id: targetUserId,
            integration_id: integration.id
          }
        );

        if (updateError) {
          return { data: null, error: updateError };
        }

        const duration = Date.now() - startTime;

        return { 
          data: { 
            success: true, 
            recordsProcessed: 100, // Mock data
            errors: [],
            duration 
          }, 
          error: null 
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        return { 
          data: { 
            success: false, 
            recordsProcessed: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            duration 
          }, 
          error: null 
        };
      }
    }, `sync integration ${platform} for user ${userId}`);
  }

  /**
   * Get integration analytics
   */
  async getIntegrationAnalytics(userId?: string): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;

      // Get user integrations to calculate analytics
      const { data: userIntegrations, error: integrationsError } = await this.database.select(
        'user_integrations',
        '*',
        { user_id: targetUserId }
      );

      if (integrationsError) {
        return { data: null, error: integrationsError };
      }

      // Calculate analytics
      const analytics = {
        totalIntegrations: userIntegrations?.length || 0,
        connectedIntegrations: userIntegrations?.filter(ui => ui.status === 'connected').length || 0,
        lastSync: userIntegrations?.reduce((latest, ui) => {
          if (!ui.last_sync_at) return latest;
          const syncTime = new Date(ui.last_sync_at).getTime();
          return syncTime > latest ? syncTime : latest;
        }, 0) || 0,
        integrationsByStatus: userIntegrations?.reduce((acc, ui) => {
          acc[ui.status] = (acc[ui.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      };

      return { data: analytics, error: null };
    }, `get integration analytics for user ${userId}`);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const integrationService = new IntegrationService(); 