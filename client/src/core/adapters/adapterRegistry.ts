/**
 * Adapter Registry
 * 
 * Central registry for all integration adapters with metadata and capabilities.
 * Updated to follow new service layer standards and use helper functions.
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

// Adapter Credentials Schema
export const AdapterCredentialsSchema = z.object({
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

export type AdapterCredentials = z.infer<typeof AdapterCredentialsSchema>;

// Connection Result Schema
export const AdapterConnectionResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  details: z.record(z.any()).optional(),
});

export type AdapterConnectionResult = z.infer<typeof AdapterConnectionResultSchema>;

// Sync Result Schema
export const AdapterSyncResultSchema = z.object({
  success: z.boolean(),
  recordsProcessed: z.number(),
  errors: z.array(z.string()),
  duration: z.number(),
});

export type AdapterSyncResult = z.infer<typeof AdapterSyncResultSchema>;

// Adapter Metadata Schema
export const AdapterMetadataSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  icon: z.string(),
  authType: z.enum(['oauth', 'api_key', 'webhook']),
  scopes: z.array(z.string()),
  capabilities: z.array(z.string()),
  setupTime: z.string(),
  isPopular: z.boolean().optional(),
  category: z.string(),
});

export type AdapterMetadata = z.infer<typeof AdapterMetadataSchema>;

// ============================================================================
// BASE ADAPTER CLASS
// ============================================================================

/**
 * Base adapter class that follows service layer standards and uses helper functions
 */
export abstract class BaseAdapter extends BaseService {
  abstract readonly id: string;
  abstract readonly metadata: AdapterMetadata;

  /**
   * Connect to the integration
   */
  abstract connect(credentials: AdapterCredentials): Promise<ServiceResponse<AdapterConnectionResult>>;

  /**
   * Disconnect from the integration
   */
  abstract disconnect(): Promise<ServiceResponse<AdapterConnectionResult>>;

  /**
   * Test the connection
   */
  abstract testConnection(): Promise<ServiceResponse<AdapterConnectionResult>>;

  /**
   * Sync data from the integration
   */
  abstract sync(): Promise<ServiceResponse<AdapterSyncResult>>;

  /**
   * Save integration credentials to database
   */
  protected async saveCredentials(userId: string, credentials: AdapterCredentials): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        const { data, error } = await insertOne('user_integrations', {
          user_id: userId,
          integration_id: this.id,
          integration_slug: this.id,
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token,
          token_type: credentials.token_type || 'Bearer',
          expires_at: credentials.expires_at,
          scope: credentials.scope,
          status: 'connected',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) {
          const errorResult = handleSupabaseError(error, `save ${this.id} credentials`);
          return { data: null, error: errorResult.error };
        }

        return { data: true, error: null };
      } catch (error) {
        return { data: null, error: 'Failed to save credentials' };
      }
    }, `save ${this.id} credentials`);
  }

  /**
   * Update integration status in database
   */
  protected async updateIntegrationStatus(userId: string, status: string, details?: any): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        // First get the integration record to find its ID
        const { data: existingData, error: selectError } = await select('user_integrations', '*', { 
          user_id: userId, 
          integration_id: this.id 
        });

        if (selectError) {
          const errorResult = handleSupabaseError(selectError, `get ${this.id} status for update`);
          return { data: null, error: errorResult.error };
        }

        if (!existingData || existingData.length === 0) {
          return { data: null, error: 'Integration not found' };
        }

        // Update using the record ID
        const { data, error } = await updateOne('user_integrations', (existingData[0] as any).id, {
          status: status,
          details: details,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          const errorResult = handleSupabaseError(error, `update ${this.id} status`);
          return { data: null, error: errorResult.error };
        }

        return { data: true, error: null };
      } catch (error) {
        return { data: null, error: 'Failed to update integration status' };
      }
    }, `update ${this.id} status`);
  }

  /**
   * Get integration status from database
   */
  protected async getIntegrationStatus(userId: string): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      try {
        const { data, error } = await select('user_integrations', '*', { 
          user_id: userId, 
          integration_id: this.id 
        });

        if (error) {
          const errorResult = handleSupabaseError(error, `get ${this.id} status`);
          return { data: null, error: errorResult.error };
        }

        return { data: data?.[0] || null, error: null };
      } catch (error) {
        return { data: null, error: 'Failed to get integration status' };
      }
    }, `get ${this.id} status`);
  }

  /**
   * Get all integrations for a user
   */
  protected async getUserIntegrations(userId: string): Promise<ServiceResponse<any[]>> {
    return this.executeDbOperation(async () => {
      try {
        const { data, error } = await select('user_integrations', '*', { user_id: userId });

        if (error) {
          const errorResult = handleSupabaseError(error, `get user integrations`);
          return { data: null, error: errorResult.error };
        }

        return { data: data || [], error: null };
      } catch (error) {
        return { data: null, error: 'Failed to get user integrations' };
      }
    }, 'get user integrations');
  }
}

// ============================================================================
// ADAPTER INTERFACE (for backward compatibility)
// ============================================================================

export interface Adapter {
  id: string;
  metadata: AdapterMetadata;
  connect: (credentials: AdapterCredentials) => Promise<ServiceResponse<AdapterConnectionResult>>;
  disconnect: () => Promise<ServiceResponse<AdapterConnectionResult>>;
  testConnection: () => Promise<ServiceResponse<AdapterConnectionResult>>;
  sync: () => Promise<ServiceResponse<AdapterSyncResult>>;
}

// ============================================================================
// ADAPTER REGISTRY
// ============================================================================

class AdapterRegistry {
  private adapters = new Map<string, Adapter>();

  /**
   * Register an adapter
   */
  register(adapter: Adapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  /**
   * Get an adapter by ID
   */
  get(id: string): Adapter | undefined {
    return this.adapters.get(id);
  }

  /**
   * Get all adapters
   */
  getAll(): Adapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapters by category
   */
  getByCategory(category: string): Adapter[] {
    return this.getAll().filter(adapter => adapter.metadata.category === category);
  }

  /**
   * Get popular adapters
   */
  getPopular(): Adapter[] {
    return this.getAll().filter(adapter => adapter.metadata.isPopular);
  }

  /**
   * Get adapters by auth type
   */
  getByAuthType(authType: string): Adapter[] {
    return this.getAll().filter(adapter => adapter.metadata.authType === authType);
  }

  /**
   * Check if adapter exists
   */
  has(id: string): boolean {
    return this.adapters.has(id);
  }

  /**
   * Get adapter metadata
   */
  getMetadata(id: string): AdapterMetadata | undefined {
    const adapter = this.get(id);
    return adapter?.metadata;
  }
}

// Create singleton instance
export const adapterRegistry = new AdapterRegistry();

// ============================================================================
// DEFAULT ADAPTERS (Updated to use helper functions)
// ============================================================================

// HubSpot Adapter
class HubSpotAdapter extends BaseAdapter {
  readonly id = 'hubspot';
  readonly metadata: AdapterMetadata = {
    name: 'hubspot',
    displayName: 'HubSpot',
    description: 'CRM and marketing automation platform',
    icon: 'hubspot',
    authType: 'oauth',
    scopes: ['crm.objects.contacts.read', 'crm.objects.companies.read', 'crm.objects.deals.read', 'crm.lists.read'],
    capabilities: ['CRM', 'Marketing', 'Sales'],
    setupTime: '5 minutes',
    isPopular: true,
    category: 'CRM'
  };

  async connect(credentials: AdapterCredentials): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Connecting to HubSpot', { credentials: { ...credentials, access_token: '[REDACTED]' } });
        
        // Simulate OAuth connection process
        if (!credentials.access_token) {
          return { data: null, error: 'Access token required for HubSpot connection' };
        }

        // Save credentials to database
        const saveResult = await this.saveCredentials('current_user_id', credentials);
        if (!saveResult.success) {
          return { data: null, error: 'Failed to save HubSpot credentials' };
        }

        // Update integration status
        await this.updateIntegrationStatus('current_user_id', 'connected', {
          connected_at: new Date().toISOString(),
          scopes: credentials.scope?.split(' ') || []
        });
        
        return { data: { success: true }, error: null };
      } catch (error) {
        this.logger.error('HubSpot connection failed', { error });
        return { data: null, error: 'Failed to connect to HubSpot' };
      }
    }, 'connect to HubSpot');
  }

  async disconnect(): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Disconnecting from HubSpot');
        
        // Update integration status to disconnected
        await this.updateIntegrationStatus('current_user_id', 'disconnected', {
          disconnected_at: new Date().toISOString()
        });
        
        return { data: { success: true }, error: null };
      } catch (error) {
        this.logger.error('HubSpot disconnection failed', { error });
        return { data: null, error: 'Failed to disconnect from HubSpot' };
      }
    }, 'disconnect from HubSpot');
  }

  async testConnection(): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Testing HubSpot connection');
        
        // Get integration status from database
        const statusResult = await this.getIntegrationStatus('current_user_id');
        if (!statusResult.success || !statusResult.data) {
          return { data: null, error: 'HubSpot integration not found' };
        }

        // Simulate API test call
        const isConnected = statusResult.data.status === 'connected';
        
        return { data: { success: isConnected }, error: null };
      } catch (error) {
        this.logger.error('HubSpot connection test failed', { error });
        return { data: null, error: 'Failed to test HubSpot connection' };
      }
    }, 'test HubSpot connection');
  }

  async sync(): Promise<ServiceResponse<AdapterSyncResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Syncing HubSpot data');
        
        // Get integration status
        const statusResult = await this.getIntegrationStatus('current_user_id');
        if (!statusResult.success || statusResult.data?.status !== 'connected') {
          return { data: null, error: 'HubSpot integration not connected' };
        }

        // Simulate sync operation with database interaction
        const startTime = Date.now();
        
        // Simulate processing records
        const recordsProcessed = Math.floor(Math.random() * 100) + 10;
        const errors: string[] = [];
        
        // Update sync timestamp
        await this.updateIntegrationStatus('current_user_id', 'connected', {
          last_sync: new Date().toISOString(),
          records_processed: recordsProcessed
        });
        
        const duration = Date.now() - startTime;
        
        return { 
          data: { 
            success: true, 
            recordsProcessed,
            errors,
            duration
          }, 
          error: null 
        };
      } catch (error) {
        this.logger.error('HubSpot sync failed', { error });
        return { data: null, error: 'Failed to sync HubSpot data' };
      }
    }, 'sync HubSpot data');
  }
}

// Google Workspace Adapter
class GoogleWorkspaceAdapter extends BaseAdapter {
  readonly id = 'google_workspace';
  readonly metadata: AdapterMetadata = {
    name: 'google_workspace',
    displayName: 'Google Workspace',
    description: 'Email, calendar, and productivity tools',
    icon: 'google',
    authType: 'oauth',
    scopes: ['gmail', 'calendar', 'drive'],
    capabilities: ['Email', 'Calendar', 'Storage'],
    setupTime: '3 minutes',
    isPopular: true,
    category: 'Productivity'
  };

  async connect(credentials: AdapterCredentials): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Connecting to Google Workspace', { credentials: { ...credentials, access_token: '[REDACTED]' } });
        
        // Simulate OAuth connection process
        if (!credentials.access_token) {
          return { data: null, error: 'Access token required for Google Workspace connection' };
        }

        // Save credentials to database
        const saveResult = await this.saveCredentials('current_user_id', credentials);
        if (!saveResult.success) {
          return { data: null, error: 'Failed to save Google Workspace credentials' };
        }

        // Update integration status
        await this.updateIntegrationStatus('current_user_id', 'connected', {
          connected_at: new Date().toISOString(),
          scopes: credentials.scope?.split(' ') || []
        });
        
        return { data: { success: true }, error: null };
      } catch (error) {
        this.logger.error('Google Workspace connection failed', { error });
        return { data: null, error: 'Failed to connect to Google Workspace' };
      }
    }, 'connect to Google Workspace');
  }

  async disconnect(): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Disconnecting from Google Workspace');
        
        // Update integration status to disconnected
        await this.updateIntegrationStatus('current_user_id', 'disconnected', {
          disconnected_at: new Date().toISOString()
        });
        
        return { data: { success: true }, error: null };
      } catch (error) {
        this.logger.error('Google Workspace disconnection failed', { error });
        return { data: null, error: 'Failed to disconnect from Google Workspace' };
      }
    }, 'disconnect from Google Workspace');
  }

  async testConnection(): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Testing Google Workspace connection');
        
        // Get integration status from database
        const statusResult = await this.getIntegrationStatus('current_user_id');
        if (!statusResult.success || !statusResult.data) {
          return { data: null, error: 'Google Workspace integration not found' };
        }

        // Simulate API test call
        const isConnected = statusResult.data.status === 'connected';
        
        return { data: { success: isConnected }, error: null };
      } catch (error) {
        this.logger.error('Google Workspace connection test failed', { error });
        return { data: null, error: 'Failed to test Google Workspace connection' };
      }
    }, 'test Google Workspace connection');
  }

  async sync(): Promise<ServiceResponse<AdapterSyncResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Syncing Google Workspace data');
        
        // Get integration status
        const statusResult = await this.getIntegrationStatus('current_user_id');
        if (!statusResult.success || statusResult.data?.status !== 'connected') {
          return { data: null, error: 'Google Workspace integration not connected' };
        }

        // Simulate sync operation with database interaction
        const startTime = Date.now();
        
        // Simulate processing records
        const recordsProcessed = Math.floor(Math.random() * 50) + 5;
        const errors: string[] = [];
        
        // Update sync timestamp
        await this.updateIntegrationStatus('current_user_id', 'connected', {
          last_sync: new Date().toISOString(),
          records_processed: recordsProcessed
        });
        
        const duration = Date.now() - startTime;
        
        return { 
          data: { 
            success: true, 
            recordsProcessed,
            errors,
            duration
          }, 
          error: null 
        };
      } catch (error) {
        this.logger.error('Google Workspace sync failed', { error });
        return { data: null, error: 'Failed to sync Google Workspace data' };
      }
    }, 'sync Google Workspace data');
  }
}

// Microsoft 365 Adapter
class Microsoft365Adapter extends BaseAdapter {
  readonly id = 'microsoft365';
  readonly metadata: AdapterMetadata = {
    name: 'microsoft365',
    displayName: 'Microsoft 365',
    description: 'Office productivity and collaboration tools',
    icon: 'microsoft',
    authType: 'oauth',
    scopes: ['mail', 'calendar', 'files'],
    capabilities: ['Email', 'Calendar', 'Documents'],
    setupTime: '5 minutes',
    isPopular: true,
    category: 'Productivity'
  };

  async connect(credentials: AdapterCredentials): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Connecting to Microsoft 365', { credentials: { ...credentials, access_token: '[REDACTED]' } });
        
        // Simulate OAuth connection process
        if (!credentials.access_token) {
          return { data: null, error: 'Access token required for Microsoft 365 connection' };
        }

        // Save credentials to database
        const saveResult = await this.saveCredentials('current_user_id', credentials);
        if (!saveResult.success) {
          return { data: null, error: 'Failed to save Microsoft 365 credentials' };
        }

        // Update integration status
        await this.updateIntegrationStatus('current_user_id', 'connected', {
          connected_at: new Date().toISOString(),
          scopes: credentials.scope?.split(' ') || []
        });
        
        return { data: { success: true }, error: null };
      } catch (error) {
        this.logger.error('Microsoft 365 connection failed', { error });
        return { data: null, error: 'Failed to connect to Microsoft 365' };
      }
    }, 'connect to Microsoft 365');
  }

  async disconnect(): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Disconnecting from Microsoft 365');
        
        // Update integration status to disconnected
        await this.updateIntegrationStatus('current_user_id', 'disconnected', {
          disconnected_at: new Date().toISOString()
        });
        
        return { data: { success: true }, error: null };
      } catch (error) {
        this.logger.error('Microsoft 365 disconnection failed', { error });
        return { data: null, error: 'Failed to disconnect from Microsoft 365' };
      }
    }, 'disconnect from Microsoft 365');
  }

  async testConnection(): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Testing Microsoft 365 connection');
        
        // Get integration status from database
        const statusResult = await this.getIntegrationStatus('current_user_id');
        if (!statusResult.success || !statusResult.data) {
          return { data: null, error: 'Microsoft 365 integration not found' };
        }

        // Simulate API test call
        const isConnected = statusResult.data.status === 'connected';
        
        return { data: { success: isConnected }, error: null };
      } catch (error) {
        this.logger.error('Microsoft 365 connection test failed', { error });
        return { data: null, error: 'Failed to test Microsoft 365 connection' };
      }
    }, 'test Microsoft 365 connection');
  }

  async sync(): Promise<ServiceResponse<AdapterSyncResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Syncing Microsoft 365 data');
        
        // Get integration status
        const statusResult = await this.getIntegrationStatus('current_user_id');
        if (!statusResult.success || statusResult.data?.status !== 'connected') {
          return { data: null, error: 'Microsoft 365 integration not connected' };
        }

        // Simulate sync operation with database interaction
        const startTime = Date.now();
        
        // Simulate processing records
        const recordsProcessed = Math.floor(Math.random() * 75) + 8;
        const errors: string[] = [];
        
        // Update sync timestamp
        await this.updateIntegrationStatus('current_user_id', 'connected', {
          last_sync: new Date().toISOString(),
          records_processed: recordsProcessed
        });
        
        const duration = Date.now() - startTime;
        
        return { 
          data: { 
            success: true, 
            recordsProcessed,
            errors,
            duration
          }, 
          error: null 
        };
      } catch (error) {
        this.logger.error('Microsoft 365 sync failed', { error });
        return { data: null, error: 'Failed to sync Microsoft 365 data' };
      }
    }, 'sync Microsoft 365 data');
  }
}

// Google Analytics Adapter
class GoogleAnalyticsAdapter extends BaseAdapter {
  readonly id = 'google_analytics';
  readonly metadata: AdapterMetadata = {
    name: 'google_analytics',
    displayName: 'Google Analytics',
    description: 'Website analytics and marketing performance tracking',
    icon: 'google_analytics',
    authType: 'oauth',
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    capabilities: ['Analytics', 'Marketing', 'Website Tracking'],
    setupTime: '5 minutes',
    isPopular: true,
    category: 'Analytics'
  };

  async connect(credentials: AdapterCredentials): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Connecting to Google Analytics', { credentials: { ...credentials, access_token: '[REDACTED]' } });
        
        // Simulate OAuth connection process
        if (!credentials.access_token) {
          return { data: null, error: 'Access token required for Google Analytics connection' };
        }

        // Save credentials to database
        const saveResult = await this.saveCredentials('current_user_id', credentials);
        if (!saveResult.success) {
          return { data: null, error: 'Failed to save Google Analytics credentials' };
        }

        // Update integration status
        await this.updateIntegrationStatus('current_user_id', 'connected', {
          connected_at: new Date().toISOString(),
          scopes: credentials.scope?.split(' ') || []
        });
        
        return { data: { success: true }, error: null };
      } catch (error) {
        this.logger.error('Google Analytics connection failed', { error });
        return { data: null, error: 'Failed to connect to Google Analytics' };
      }
    }, 'connect to Google Analytics');
  }

  async disconnect(): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Disconnecting from Google Analytics');
        
        // Update integration status to disconnected
        await this.updateIntegrationStatus('current_user_id', 'disconnected', {
          disconnected_at: new Date().toISOString()
        });
        
        return { data: { success: true }, error: null };
      } catch (error) {
        this.logger.error('Google Analytics disconnection failed', { error });
        return { data: null, error: 'Failed to disconnect from Google Analytics' };
      }
    }, 'disconnect from Google Analytics');
  }

  async testConnection(): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Testing Google Analytics connection');
        
        // Get integration status from database
        const statusResult = await this.getIntegrationStatus('current_user_id');
        if (!statusResult.success || !statusResult.data) {
          return { data: null, error: 'Google Analytics integration not found' };
        }

        // Simulate API test call
        const isConnected = statusResult.data.status === 'connected';
        
        return { data: { success: isConnected }, error: null };
      } catch (error) {
        this.logger.error('Google Analytics connection test failed', { error });
        return { data: null, error: 'Failed to test Google Analytics connection' };
      }
    }, 'test Google Analytics connection');
  }

  async sync(): Promise<ServiceResponse<AdapterSyncResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Syncing Google Analytics data');
        
        // Get integration status
        const statusResult = await this.getIntegrationStatus('current_user_id');
        if (!statusResult.success || statusResult.data?.status !== 'connected') {
          return { data: null, error: 'Google Analytics integration not connected' };
        }

        // Simulate sync operation with database interaction
        const startTime = Date.now();
        
        // Simulate processing records
        const recordsProcessed = Math.floor(Math.random() * 100) + 10;
        const errors: string[] = [];
        
        // Update sync timestamp
        await this.updateIntegrationStatus('current_user_id', 'connected', {
          last_sync: new Date().toISOString(),
          records_processed: recordsProcessed
        });
        
        const duration = Date.now() - startTime;
        
        return { 
          data: { 
            success: true, 
            recordsProcessed,
            errors,
            duration
          }, 
          error: null 
        };
      } catch (error) {
        this.logger.error('Google Analytics sync failed', { error });
        return { data: null, error: 'Failed to sync Google Analytics data' };
      }
    }, 'sync Google Analytics data');
  }
}

// Register default adapters
const defaultAdapters: Adapter[] = [
  new HubSpotAdapter(),
  new GoogleWorkspaceAdapter(),
  new Microsoft365Adapter(),
  new GoogleAnalyticsAdapter(),
];

defaultAdapters.forEach(adapter => adapterRegistry.register(adapter)); 
