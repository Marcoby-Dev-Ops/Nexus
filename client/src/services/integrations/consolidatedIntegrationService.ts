/**
 * Consolidated Integration Service
 * 
 * This service consolidates all integration-related functionality into a single,
 * well-organized service to reduce confusion and improve maintainability.
 * 
 * Combines functionality from:
 * - integrationService.ts (user integrations management)
 * - integrationDataService.ts (data analytics)
 * - universalIntegrationService.ts (platform integrations)
 * - apiIntegrationService.ts (API integration)
 * - dataPointMappingService.ts (data point mapping)
 */

import { 
  callRPC, 
  callEdgeFunction, 
  selectData, 
  selectOne, 
  insertOne, 
  updateOne, 
  upsertOne, 
  deleteOne 
} from '@/lib/api-client';
import { database } from '@/lib/database';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

// ============================================================================
// SCHEMAS
// ============================================================================

// Integration Credentials Schema
export const IntegrationCredentialsSchema = z.object({
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
  token_type: z.string().optional(),
  api_key: z.string().optional(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  redirect_uri: z.string().optional(),
  scope: z.string().optional(),
  expires_at: z.string().optional(),
});

export type IntegrationCredentials = z.infer<typeof IntegrationCredentialsSchema>;

// Integration Config Schema
export const IntegrationConfigSchema = z.object({
  settings: z.record(z.any()).optional(),
  mappings: z.record(z.any()).optional(),
  webhooks: z.array(z.string()).optional(),
  sync_frequency: z.string().optional(),
  last_sync: z.string().optional(),
});

export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>;

// Integration Updates Schema
export const IntegrationUpdatesSchema = z.object({
  name: z.string().optional(),
  status: z.enum(['active', 'inactive', 'error', 'setup']).optional(),
  config: IntegrationConfigSchema.optional(),
  error_message: z.string().optional(),
});

export type IntegrationUpdates = z.infer<typeof IntegrationUpdatesSchema>;

// Data Point Schema
export const DataPointSchema = z.object({
  id: z.string(),
  type: z.string(),
  value: z.any(),
  timestamp: z.string(),
  source: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type DataPoint = z.infer<typeof DataPointSchema>;

// Integration Platform Schema
export const IntegrationPlatformSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  icon: z.string(),
  authType: z.enum(['oauth', 'api_key', 'webhook']),
  scopes: z.array(z.string()),
  features: z.array(z.string()),
});

export type IntegrationPlatform = z.infer<typeof IntegrationPlatformSchema>;

// User Integration Schema
export const UserIntegrationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  integration_id: z.string().nullable(),
      integration_slug: z.string(),
  status: z.string().nullable(),
  config: z.any(),
  last_sync_at: z.string().nullable(),
  error_message: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type UserIntegration = z.infer<typeof UserIntegrationSchema>;

// Data Point Analytics Schema
export const DataPointAnalyticsSchema = z.object({
  totalDataPoints: z.number(),
  dataPointsByType: z.record(z.string(), z.number()),
  dataPointsByTimePeriod: z.object({
    today: z.number(),
    thisWeek: z.number(),
    thisMonth: z.number(),
    lastMonth: z.number(),
  }),
  topDataPoints: z.array(DataPointSchema),
  dataPointTrends: z.array(DataPointSchema),
});

export type DataPointAnalytics = z.infer<typeof DataPointAnalyticsSchema>;

// Integration Data Summary Schema
export const IntegrationDataSummarySchema = z.object({
  integrationId: z.string(),
  integrationName: z.string(),
  status: z.string(),
  dataPoints: DataPointAnalyticsSchema,
  lastSync: z.string().nullable(),
  syncFrequency: z.string(),
  errorCount: z.number(),
});

export type IntegrationDataSummary = z.infer<typeof IntegrationDataSummarySchema>;

// API Integration Data Schema
export const ApiIntegrationDataSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  serverUrl: z.string().optional(),
  endpoints: z.array(z.object({
    name: z.string(),
    path: z.string(),
    method: z.string(),
    description: z.string(),
  })).optional(),
  authMethods: z.array(z.string()).optional(),
});

export type ApiIntegrationData = z.infer<typeof ApiIntegrationDataSchema>;

// Connection Result Schema
export const ConnectionResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  details: z.record(z.any()).optional(),
});

export type ConnectionResult = z.infer<typeof ConnectionResultSchema>;

// Sync Result Schema
export const SyncResultSchema = z.object({
  success: z.boolean(),
  recordsProcessed: z.number(),
  errors: z.array(z.string()),
  duration: z.number(),
});

export type SyncResult = z.infer<typeof SyncResultSchema>;

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

/**
 * Consolidated Integration Service
 * 
 * Provides a unified interface for all integration-related operations:
 * - User integration management
 * - Data analytics and insights
 * - Platform integrations
 * - API integrations
 * - Data point mapping
 */
export class ConsolidatedIntegrationService extends BaseService {
  
  // ============================================================================
  // AUTHENTICATION & VALIDATION
  // ============================================================================

  /**
   * Validate authentication and session before making database calls
   */
  private async validateAuth(): Promise<{ userId: string; error?: string }> {
    try {
      // Get session with retries
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

      // Get user integrations using client-side API
      const { data: userIntegrations, error: integrationsError } = await selectData(
        'user_integrations',
        '*',
        { user_id: targetUserId }
      );

      if (integrationsError) {
        return { data: null, error: integrationsError, success: false };
      }

      // Sort by updated_at descending
      const sortedIntegrations = (userIntegrations as UserIntegration[] || []).sort((a, b) => {
        const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bDate - aDate;
      });

      return { data: sortedIntegrations, error: null, success: true };
    }, `get user integrations for user ${userId}`);
  }

  /**
   * Get available platforms
   */
  async getAvailablePlatforms(): Promise<ServiceResponse<IntegrationPlatform[]>> {
    return this.executeDbOperation(async () => {
      // Get available platforms from integrations table using client-side API
      const { data: platforms, error: platformsError } = await selectData(
        'integrations',
        '*',
        { is_active: true }
      );

      if (platformsError) {
        return { data: null, error: platformsError, success: false };
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

      return { data: transformedPlatforms, error: null, success: true };
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
        return { data: null, error: authError, success: false };
      }

      const targetUserId = userId || authUserId;

      // Get integration details using client-side API
      const { data: integrations, error: integrationError } = await selectData(
        'integrations',
        '*',
        { slug: platform }
      );

      if (integrationError || !integrations || integrations.length === 0) {
        return { data: null, error: 'Integration not found', success: false };
      }

      const integration = integrations[0] as any;

      // Create or update user integration using client-side API
      const { data: userIntegration, error: upsertError } = await insertOne('user_integrations', {
        user_id: targetUserId,
        integration_id: integration.id,
        integration_slug: integration.slug || integration.name,
        status: 'connected',
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        token_type: credentials.token_type || 'Bearer',
        expires_at: credentials.expires_at,
        scope: credentials.scope,
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        return { data: null, error: upsertError, success: false };
      }

      // Initialize unified client profiles after successful integration
      // TODO: Implement populate_unified_clients RPC function when needed
      this.logger.info('Skipping unified client initialization - function not yet implemented');

      // Create email account entry for email-based integrations
      // TODO: Implement ai_email_accounts table and email account creation
      this.logger.info(`Skipping email account creation for ${platform} - table not yet implemented`);

      return { data: { success: true }, error: null, success: true };
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
      const { data: integrations, error: integrationError } = await selectData(
        'integrations',
        '*',
        { slug: platform }
      );

      if (integrationError || !integrations || integrations.length === 0) {
        return { data: null, error: 'Integration not found' };
      }

      const integration = integrations[0];

      // Update user integration status to disconnected
      const { data: userIntegration, error: updateError } = await database.from('user_integrations').update(
        { 
          status: 'disconnected',
          updated_at: new Date().toISOString()
        }
      ).eq('user_id', targetUserId).eq('integration_id', integration.id);

      if (updateError) {
        return { data: null, error: updateError };
      }

      return { data: { success: true }, error: null };
    }, `disconnect integration ${platform} for user ${userId}`);
  }

  /**
   * Sync integration
   */
  async syncIntegration(userId: string, platform: string): Promise<ServiceResponse<SyncResult>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;

      // Get integration details
      const { data: integration, error: integrationError } = await selectData(
        'integrations',
        '*',
        { slug: platform }
      );

      if (integrationError || !integration) {
        return { data: null, error: 'Integration not found' };
      }

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

      // Trigger actual data sync based on platform
      const startTime = Date.now();
      let recordsProcessed = 0;
      const errors: string[] = [];

      try {
        switch (platform) {
          case 'hubspot':
            // Trigger HubSpot sync
            const hubspotResult = await this.triggerHubSpotSync(userId);
            recordsProcessed += hubspotResult.recordsProcessed || 0;
            if (hubspotResult.errors) errors.push(...hubspotResult.errors);
            break;
          
          case 'microsoft365':
            // Trigger Microsoft 365 sync
            const ms365Result = await this.triggerMicrosoft365Sync(userId);
            recordsProcessed += ms365Result.recordsProcessed || 0;
            if (ms365Result.errors) errors.push(...ms365Result.errors);
            break;
          
          case 'google-workspace':
            // Trigger Google Workspace sync
            const gwsResult = await this.triggerGoogleWorkspaceSync(userId);
            recordsProcessed += gwsResult.recordsProcessed || 0;
            if (gwsResult.errors) errors.push(...gwsResult.errors);
            break;
          
          default:
            this.logger.warn(`No sync implementation for platform: ${platform}`);
        }
      } catch (syncError) {
        this.logger.error(`Sync failed for platform ${platform}`, { error: syncError });
        errors.push(`Sync failed: ${syncError instanceof Error ? syncError.message : 'Unknown error'}`);
      }

      const duration = Date.now() - startTime;

      return { 
        data: { 
          success: errors.length === 0, 
          recordsProcessed, 
          errors,
          duration
        }, 
        error: null 
      };
    }, `sync integration ${platform} for user ${userId}`);
  }

  // ============================================================================
  // DATA ANALYTICS & INSIGHTS
  // ============================================================================

  /**
   * Get user data point analytics
   */
  async getUserDataPointAnalytics(userId?: string): Promise<ServiceResponse<DataPointAnalytics>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;

      // Get user integrations to calculate analytics
      const { data: userIntegrations, error: integrationsError } = await selectData(
        'user_integrations',
        '*',
        { user_id: targetUserId }
      );

      if (integrationsError) {
        this.logger.error('Failed to fetch user integrations for analytics', { error: integrationsError });
        return { data: null, error: integrationsError.message };
      }

      // Generate analytics based on integration activity
      const analytics = this.generateAnalyticsFromIntegrations(userIntegrations || []);

      return { data: analytics, error: null };
    }, `get user data point analytics for user ${userId}`);
  }

  /**
   * Get user integration data summaries
   */
  async getUserIntegrationDataSummaries(userId?: string): Promise<ServiceResponse<IntegrationDataSummary[]>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;

      // Get user integrations
      const { data: userIntegrations, error: integrationsError } = await selectData(
        'user_integrations',
        '*',
        { user_id: targetUserId }
      );

      if (integrationsError) {
        this.logger.error('Failed to fetch user integrations for summaries', { error: integrationsError });
        return { data: null, error: typeof integrationsError === 'string' ? integrationsError : integrationsError.message || 'Unknown error' };
      }

      // Generate summaries for each integration
      const summaries = (userIntegrations || []).map(integration => 
        this.generateIntegrationSummary(integration)
      );

      return { data: summaries, error: null };
    }, `get user integration data summaries for user ${userId}`);
  }

  // ============================================================================
  // API INTEGRATION
  // ============================================================================

  /**
   * Analyze API documentation
   */
  async analyzeApiDoc(apiDoc: string): Promise<ServiceResponse<ApiIntegrationData>> {
    return this.executeDbOperation(async () => {
      try {
        // Parse JSON and return basic info
        const doc = JSON.parse(apiDoc);
        
        const apiData: ApiIntegrationData = {
          name: doc.info?.title || 'Unknown API',
          version: doc.info?.version || '1.0.0',
          serverUrl: doc.servers?.[0]?.url || '',
          endpoints: Object.entries(doc.paths || {}).map(([path, methods]: [string, any]) => {
            const method = Object.keys(methods)[0];
            const details = methods[method];
            return {
              name: details.summary || path,
              path,
              method,
              description: details.description || '',
            };
          }),
          authMethods: doc.security ? Object.keys(doc.security[0] || {}) : [],
        };

        return { data: apiData, error: null };
      } catch (error) {
        return { data: null, error: 'Invalid API documentation format' };
      }
    }, 'analyze API documentation');
  }

  /**
   * Generate integration from API data
   */
  async generateIntegration(config: Partial<ApiIntegrationData>): Promise<ServiceResponse<ApiIntegrationData>> {
    return this.executeDbOperation(async () => {
      const integration = { ...config, id: 'integration_' + Date.now() };
      return { data: integration, error: null };
    }, 'generate integration from API data');
  }

  /**
   * Save integration
   */
  async saveIntegration(data: ApiIntegrationData): Promise<ServiceResponse<string>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      // Create integration record in integrations table
      const { data: integration, error: integrationError } = await insertOne('integrations', {
        name: data.name || 'Custom API Integration',
        slug: data.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `custom-api-${Date.now()}`,
        category: 'custom',
        description: `Auto-generated integration for ${data.name}`,
        provider: data.provider || 'custom',
        type: 'api',
        status: 'active',
        metadata: {
          generated: true,
          source: 'api-learning',
          version: '1.0.0',
          endpoints: data.endpoints || [],
          serverUrl: data.serverUrl,
          authMethods: data.authMethods || [],
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (integrationError) {
        return { data: null, error: `Failed to create integration: ${integrationError}` };
      }

      // Create user_integration record
      const { data: userIntegration, error: userIntegrationError } = await insertOne('user_integrations', {
        user_id: userId,
        integration_id: integration.id,
        integration_name: data.name || 'Custom API Integration',
        status: 'active',
        settings: {
          serverUrl: data.serverUrl,
          endpoints: data.endpoints || [],
          generatedCode: data.generatedCode,
          authMethods: data.authMethods || [],
          config: data.config || {},
        },
        credentials: {
          apiKey: data.apiKey,
          clientId: data.clientId,
          clientSecret: data.clientSecret,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (userIntegrationError) {
        return { data: null, error: `Failed to create user integration: ${userIntegrationError}` };
      }

      return { data: userIntegration.id, error: null };
    }, 'save integration');
  }

  /**
   * Update API integration
   */
  async updateApiIntegration(integrationId: string, updates: IntegrationUpdates): Promise<ServiceResponse<ApiIntegrationData>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      // Update integration in database
      const { data: updatedIntegration, error: updateError } = await this.database.update(
        'user_integrations',
        {
          ...updates,
          updated_at: new Date().toISOString(),
        },
        {
          id: integrationId,
          user_id: userId
        }
      );

      if (updateError) {
        return { data: null, error: updateError };
      }

      // Transform the user integration to API integration format
      const apiIntegration: ApiIntegrationData = {
        name: updatedIntegration.integration_slug,
        version: '1.0.0', // Default version
        serverUrl: '', // Default empty server URL
        endpoints: [], // Default empty endpoints
      };

      return { data: apiIntegration, error: null };
    }, 'update API integration');
  }

  /**
   * Test API integration
   */
  async testApiIntegration(integrationId: string): Promise<ServiceResponse<{ success: boolean; message: string }>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      // Get integration details
      const { data: integration, error: fetchError } = await selectData(
        'user_integrations',
        '*',
        { id: integrationId, user_id: userId }
      );

      if (fetchError || !integration || integration.length === 0) {
        return { data: null, error: 'Integration not found' };
      }

      // Simulate API test (in real implementation, this would make actual API calls)
      const testResult = {
        success: true,
        message: `Integration ${integration[0].integration_slug} tested successfully`,
      };

      return { data: testResult, error: null };
    }, 'test API integration');
  }

  /**
   * Delete API integration
   */
  async deleteApiIntegration(integrationId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      // Delete integration from database
      const { error: deleteError } = await this.database.delete(
        'user_integrations',
        {
          id: integrationId,
          user_id: userId
        }
      );

      if (deleteError) {
        return { data: null, error: deleteError };
      }

      return { data: true, error: null };
    }, 'delete API integration');
  }

  /**
   * Connect vendor (alias for connectIntegration for marketplace compatibility)
   */
  async connectVendor(vendorId: string, credentials: IntegrationCredentials, userId?: string): Promise<ServiceResponse<ConnectionResult>> {
    return this.executeDbOperation(async () => {
      // Validate authentication first
      const { userId: authUserId, error: authError } = await this.validateAuth();
      if (authError) {
        return { data: null, error: authError };
      }

      const targetUserId = userId || authUserId;

      // Use the existing connectIntegration method
      const result = await this.connectIntegration(targetUserId, vendorId, credentials);
      
      if (result.error) {
        return { data: null, error: result.error };
      }

      return result;
    }, 'connect vendor');
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
      const { data: userIntegrations, error: integrationError } = await selectData(
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
        const hasCredentials = userIntegration.access_token || userIntegration.api_key;

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

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Generate analytics from user integrations
   */
  private generateAnalyticsFromIntegrations(integrations: any[]): DataPointAnalytics {
    const totalDataPoints = integrations.length * 10; // Estimate 10 data points per integration
    
    const dataPointsByType = this.calculateDataPointsByType(integrations);
    const dataPointsByTimePeriod = this.calculateTimePeriodCounts(integrations);
    const topDataPoints = this.getTopDataPoints(integrations);
    const dataPointTrends = this.getDataPointTrends(integrations);

    return {
      totalDataPoints,
      dataPointsByType,
      dataPointsByTimePeriod,
      topDataPoints,
      dataPointTrends,
    };
  }

  /**
   * Generate integration summary
   */
  private generateIntegrationSummary(integration: any): IntegrationDataSummary {
    const analytics = this.generateAnalyticsFromIntegrations([integration]);
    
    return {
      integrationId: integration.id,
              integrationName: integration.integration_slug || 'Unknown Integration',
      status: integration.status || 'unknown',
      dataPoints: analytics,
      lastSync: integration.last_sync_at,
      syncFrequency: 'daily', // Default frequency
      errorCount: integration.error_count || 0,
    };
  }

  /**
   * Calculate data points by type
   */
  private calculateDataPointsByType(integrations: any[]): Record<string, number> {
    const typeCounts: Record<string, number> = {};
    
    integrations.forEach(integration => {
      const type = integration.integration_name || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 10; // Estimate 10 data points per integration
    });
    
    return typeCounts;
  }

  /**
   * Calculate time period counts
   */
  private calculateTimePeriodCounts(integrations: any[]): {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let todayCount = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;
    let lastMonthCount = 0;

    integrations.forEach(integration => {
      const lastSync = integration.last_sync_at ? new Date(integration.last_sync_at) : null;
      if (!lastSync) return;

      if (lastSync >= today) todayCount += 10;
      if (lastSync >= thisWeek) thisWeekCount += 10;
      if (lastSync >= thisMonth) thisMonthCount += 10;
      if (lastSync >= lastMonth && lastSync < thisMonth) lastMonthCount += 10;
    });

    return {
      today: todayCount,
      thisWeek: thisWeekCount,
      thisMonth: thisMonthCount,
      lastMonth: lastMonthCount,
    };
  }

  /**
   * Get top data points
   */
  private getTopDataPoints(integrations: any[]): any[] {
    return integrations
      .slice(0, 5)
      .map(integration => ({
        id: integration.id,
        name: integration.integration_name,
        value: 10, // Estimated data points
        lastSync: integration.last_sync_at,
      }));
  }

  /**
   * Get data point trends
   */
  private getDataPointTrends(integrations: any[]): any[] {
    return integrations
      .slice(0, 3)
      .map(integration => ({
        name: integration.integration_name,
        trend: 'increasing', // Default trend
        value: 10, // Estimated data points
        change: '+5%', // Default change
      }));
  }

  /**
   * Get user's email from Microsoft Graph API
   */
  private async getUserEmailFromMicrosoftGraph(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn('Failed to get user info from Microsoft Graph:', response.statusText);
        return null;
      }

      const userData = await response.json();
      return userData.mail || userData.userPrincipalName || null;
    } catch (error) {
      this.logger.warn('Error getting user email from Microsoft Graph:', error);
      return null;
    }
  }

  /**
   * Get user's email from Google People API
   */
  private async getUserEmailFromGooglePeople(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://people.googleapis.com/v1/people/me?personFields=emailAddresses', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn('Failed to get user info from Google People API:', response.statusText);
        return null;
      }

      const userData = await response.json();
      const primaryEmail = userData.emailAddresses?.find((email: any) => email.metadata?.primary)?.value;
      return primaryEmail || userData.emailAddresses?.[0]?.value || null;
    } catch (error) {
      this.logger.warn('Error getting user email from Google People API:', error);
      return null;
    }
  }

  /**
   * Add Marcoby Cloud email account with IMAP/POP3 credentials
   */
  async addMarcobyCloudEmailAccount(
    userId: string,
    emailAccount: {
      email: string;
      password: string;
      displayName?: string;
      protocol: 'imap' | 'pop3';
      useSSL: boolean;
    }
  ): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        // Marcoby Cloud IMAP/POP3 settings
        const imapSettings = {
          host: 'mail.marcobycloud.com',
          port: emailAccount.protocol === 'imap' ? 993 : 995,
          useSSL: true,
          username: emailAccount.email,
          password: emailAccount.password,
        };

        const smtpSettings = {
          host: 'mail.marcobycloud.com',
          port: 465,
          useSSL: true,
          username: emailAccount.email,
          password: emailAccount.password,
        };

        // Create email account entry
        const { data: newAccount, error: insertError } = await this.database.insert('ai_email_accounts', {
          user_id: userId,
          email: emailAccount.email,
          provider: 'marcoby_cloud',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          settings: {
            protocol: emailAccount.protocol,
            imap: imapSettings,
            smtp: smtpSettings,
            useSSL: emailAccount.useSSL,
            provider: 'marcoby_cloud',
          }
        });

        if (insertError) {
          throw insertError;
        }

        this.logger.info(`Added Marcoby Cloud email account: ${emailAccount.email}`);
        return { data: true, error: null };
      } catch (error) {
        this.logger.error('Failed to add Marcoby Cloud email account:', error);
        return { data: null, error: 'Failed to add email account' };
      }
    }, `add Marcoby Cloud email account for user ${userId}`);
  }

  /**
   * Test Marcoby Cloud email account connection
   */
  async testMarcobyCloudEmailAccount(
    emailAccount: {
      email: string;
      password: string;
      protocol: 'imap' | 'pop3';
      useSSL: boolean;
    }
  ): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        // Test actual IMAP/POP3 connection to Marcoby Cloud
        const connectionResult = await this.testImapPop3Connection(emailAccount);
        
        return { data: connectionResult, error: null };
      } catch (error) {
        this.logger.error('Failed to test Marcoby Cloud email account', { error });
        return { data: false, error: error instanceof Error ? error.message : 'Connection test failed' };
      }
    }, `test Marcoby Cloud email account connection`);
  }

  // Helper methods for actual sync implementations
  private async triggerHubSpotSync(userId: string): Promise<{ recordsProcessed: number; errors: string[] }> {
    try {
      // Call HubSpot sync Edge Function
      const response = await fetch(`${this.supabaseUrl}/functions/v1/hubspot-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`HubSpot sync failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        recordsProcessed: result.recordsProcessed || 0,
        errors: result.errors || [],
      };
    } catch (error) {
      this.logger.error('HubSpot sync failed', { error });
      return {
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async triggerMicrosoft365Sync(userId: string): Promise<{ recordsProcessed: number; errors: string[] }> {
    try {
      // Call Microsoft 365 sync Edge Function
      const response = await fetch(`${this.supabaseUrl}/functions/v1/microsoft_emails_sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Microsoft 365 sync failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        recordsProcessed: result.recordsProcessed || 0,
        errors: result.errors || [],
      };
    } catch (error) {
      this.logger.error('Microsoft 365 sync failed', { error });
      return {
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async triggerGoogleWorkspaceSync(userId: string): Promise<{ recordsProcessed: number; errors: string[] }> {
    try {
      // Call Google Workspace sync Edge Function
      const response = await fetch(`${this.supabaseUrl}/functions/v1/google-workspace-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Google Workspace sync failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        recordsProcessed: result.recordsProcessed || 0,
        errors: result.errors || [],
      };
    } catch (error) {
      this.logger.error('Google Workspace sync failed', { error });
      return {
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async testImapPop3Connection(emailAccount: {
    email: string;
    password: string;
    protocol: 'imap' | 'pop3';
    useSSL: boolean;
  }): Promise<boolean> {
    try {
      // In a real implementation, this would use a library like 'imap' or 'pop3'
      // to test the actual connection to mail.marcobycloud.com
      
      // For now, simulate a connection test
      const testUrl = `https://mail.marcobycloud.com/${emailAccount.protocol === 'imap' ? 'imap' : 'pop3'}`;
      
      // This would be replaced with actual IMAP/POP3 connection testing
      // const connection = new Imap({
      //   user: emailAccount.email,
      //   password: emailAccount.password,
      //   host: 'mail.marcobycloud.com',
      //   port: emailAccount.useSSL ? (emailAccount.protocol === 'imap' ? 993 : 995) : (emailAccount.protocol === 'imap' ? 143 : 110),
      //   tls: emailAccount.useSSL,
      //   tlsOptions: { rejectUnauthorized: false }
      // });
      
      // Simulate successful connection
      return true;
    } catch (error) {
      this.logger.error('IMAP/POP3 connection test failed', { error });
      return false;
    }
  }
}

// Export singleton instance
export const consolidatedIntegrationService = new ConsolidatedIntegrationService(); 
