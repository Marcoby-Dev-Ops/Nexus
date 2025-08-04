/**
 * Universal Integration Service
 * 
 * Provides a unified interface for managing integrations across different platforms.
 * 
 * MIGRATED: Now extends BaseService for consistent error handling and logging
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { adapterRegistry, type AdapterMetadata } from '@/core/adapters/adapterRegistry';
import { z } from 'zod';

// Integration Config Schema
export const IntegrationConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  platform: z.string(),
  credentials: z.record(z.any()),
  settings: z.record(z.any()),
  status: z.enum(['connected', 'disconnected', 'error']),
  lastSync: z.string().optional(),
  dataCount: z.number().optional(),
});

export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>;

// Sync Result Schema
export const SyncResultSchema = z.object({
  success: z.boolean(),
  recordsProcessed: z.number(),
  errors: z.array(z.string()),
  duration: z.number(),
});

export type SyncResult = z.infer<typeof SyncResultSchema>;

// Connection Result Schema
export const ConnectionResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  details: z.record(z.any()).optional(),
});

export type ConnectionResult = z.infer<typeof ConnectionResultSchema>;

/**
 * Universal Integration Service
 * 
 * MIGRATED: Now extends BaseService for consistent error handling and logging
 * Provides a unified interface for managing integrations across different platforms.
 */
export class UniversalIntegrationService extends BaseService {
  /**
   * Get all available integrations
   */
  async getAvailableIntegrations(): Promise<ServiceResponse<AdapterMetadata[]>> {
    return this.executeDbOperation(async () => {
      try {
        const adapters = adapterRegistry.getAll();
        const metadata = adapters.map(adapter => adapter.metadata);
        return { data: metadata, error: null };
      } catch (error) {
        this.logger.error('Error getting available integrations:', error);
        return { data: [], error: 'Failed to get available integrations' };
      }
    }, 'get available integrations');
  }

  /**
   * Get integrations by category
   */
  async getIntegrationsByCategory(category: string): Promise<ServiceResponse<AdapterMetadata[]>> {
    return this.executeDbOperation(async () => {
      try {
        const adapters = adapterRegistry.getByCategory(category);
        const metadata = adapters.map(adapter => adapter.metadata);
        return { data: metadata, error: null };
      } catch (error) {
        this.logger.error('Error getting integrations by category:', error);
        return { data: [], error: 'Failed to get integrations by category' };
      }
    }, `get integrations by category ${category}`);
  }

  /**
   * Get popular integrations
   */
  async getPopularIntegrations(): Promise<ServiceResponse<AdapterMetadata[]>> {
    return this.executeDbOperation(async () => {
      try {
        const adapters = adapterRegistry.getPopular();
        const metadata = adapters.map(adapter => adapter.metadata);
        return { data: metadata, error: null };
      } catch (error) {
        this.logger.error('Error getting popular integrations:', error);
        return { data: [], error: 'Failed to get popular integrations' };
      }
    }, 'get popular integrations');
  }

  /**
   * Connect to an integration
   */
  async connectIntegration(integrationId: string, credentials: any): Promise<ServiceResponse<ConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info(`Connecting to integration: ${integrationId}`);
        
        const adapter = adapterRegistry.get(integrationId);
        if (!adapter) {
          return { 
            data: { 
              success: false, 
              error: 'Integration not found' 
            }, 
            error: null 
          };
        }

        const result = await adapter.connect(credentials);
        
        if (result.success) {
          this.logger.info(`Successfully connected to ${integrationId}`);
        } else {
          this.logger.error(`Failed to connect to ${integrationId}:`, result.error);
        }
        
        return { data: ConnectionResultSchema.parse(result), error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Error connecting to integration ${integrationId}:`, error);
        return { 
          data: { 
            success: false, 
            error: errorMessage 
          }, 
          error: null 
        };
      }
    }, `connect to integration ${integrationId}`);
  }

  /**
   * Disconnect from an integration
   */
  async disconnectIntegration(integrationId: string): Promise<ServiceResponse<ConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info(`Disconnecting from integration: ${integrationId}`);
        
        const adapter = adapterRegistry.get(integrationId);
        if (!adapter) {
          return { 
            data: { 
              success: false, 
              error: 'Integration not found' 
            }, 
            error: null 
          };
        }

        const result = await adapter.disconnect();
        
        if (result.success) {
          this.logger.info(`Successfully disconnected from ${integrationId}`);
        } else {
          this.logger.error(`Failed to disconnect from ${integrationId}:`, result.error);
        }
        
        return { data: ConnectionResultSchema.parse(result), error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Error disconnecting from integration ${integrationId}:`, error);
        return { 
          data: { 
            success: false, 
            error: errorMessage 
          }, 
          error: null 
        };
      }
    }, `disconnect from integration ${integrationId}`);
  }

  /**
   * Test connection for an integration
   */
  async testConnection(integrationId: string): Promise<ServiceResponse<ConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info(`Testing connection for integration: ${integrationId}`);
        
        const adapter = adapterRegistry.get(integrationId);
        if (!adapter) {
          return { 
            data: { 
              success: false, 
              error: 'Integration not found' 
            }, 
            error: null 
          };
        }

        const result = await adapter.testConnection();
        
        if (result.success) {
          this.logger.info(`Connection test successful for ${integrationId}`);
        } else {
          this.logger.error(`Connection test failed for ${integrationId}:`, result.error);
        }
        
        return { data: ConnectionResultSchema.parse(result), error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Error testing connection for integration ${integrationId}:`, error);
        return { 
          data: { 
            success: false, 
            error: errorMessage 
          }, 
          error: null 
        };
      }
    }, `test connection for integration ${integrationId}`);
  }

  /**
   * Sync data from an integration
   */
  async syncIntegration(integrationId: string): Promise<ServiceResponse<SyncResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info(`Syncing data from integration: ${integrationId}`);
        
        const adapter = adapterRegistry.get(integrationId);
        if (!adapter) {
          return { 
            data: { 
              success: false, 
              recordsProcessed: 0, 
              errors: ['Integration not found'], 
              duration: 0 
            }, 
            error: null 
          };
        }

        const startTime = Date.now();
        const result = await adapter.sync();
        const duration = Date.now() - startTime;
        
        const syncResult: SyncResult = {
          success: result.success,
          recordsProcessed: result.recordsProcessed || 0,
          errors: result.errors || [],
          duration,
        };
        
        if (result.success) {
          this.logger.info(`Sync completed for ${integrationId}: ${result.recordsProcessed} records processed`);
        } else {
          this.logger.error(`Sync failed for ${integrationId}:`, result.errors);
        }
        
        return { data: SyncResultSchema.parse(syncResult), error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Error syncing integration ${integrationId}:`, error);
        return { 
          data: { 
            success: false, 
            recordsProcessed: 0, 
            errors: [errorMessage], 
            duration: 0 
          }, 
          error: null 
        };
      }
    }, `sync integration ${integrationId}`);
  }

  /**
   * Get integration metadata
   */
  getIntegrationMetadata(integrationId: string): ServiceResponse<AdapterMetadata | null> {
    try {
      const adapter = adapterRegistry.get(integrationId);
      if (!adapter) {
        return { data: null, error: 'Integration not found' };
      }
      
      return { data: adapter.metadata, error: null };
    } catch (error) {
      this.logger.error(`Error getting metadata for integration ${integrationId}:`, error);
      return { data: null, error: 'Failed to get integration metadata' };
    }
  }

  /**
   * Check if integration exists
   */
  hasIntegration(integrationId: string): ServiceResponse<boolean> {
    try {
      const adapter = adapterRegistry.get(integrationId);
      return { data: !!adapter, error: null };
    } catch (error) {
      this.logger.error(`Error checking integration ${integrationId}:`, error);
      return { data: false, error: 'Failed to check integration' };
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(integrationId: string): Promise<ServiceResponse<{
    status: string;
    lastSync: string | null;
    dataCount: number;
    errorCount: number;
  }>> {
    return this.executeDbOperation(async () => {
      try {
        const adapter = adapterRegistry.get(integrationId);
        if (!adapter) {
          return { data: null, error: 'Integration not found' };
        }

        const status = await adapter.getStatus();
        return { data: status, error: null };
      } catch (error) {
        this.logger.error(`Error getting status for integration ${integrationId}:`, error);
        return { data: null, error: 'Failed to get integration status' };
      }
    }, `get status for integration ${integrationId}`);
  }

  /**
   * Get integration statistics
   */
  async getIntegrationStats(): Promise<ServiceResponse<{
    totalIntegrations: number;
    activeIntegrations: number;
    errorIntegrations: number;
    totalDataPoints: number;
  }>> {
    return this.executeDbOperation(async () => {
      try {
        const adapters = adapterRegistry.getAll();
        const stats = {
          totalIntegrations: adapters.length,
          activeIntegrations: 0,
          errorIntegrations: 0,
          totalDataPoints: 0,
        };

        // Calculate stats from adapters
        for (const adapter of adapters) {
          try {
            const status = await adapter.getStatus();
            if (status.status === 'connected') {
              stats.activeIntegrations++;
            } else if (status.status === 'error') {
              stats.errorIntegrations++;
            }
            stats.totalDataPoints += status.dataCount || 0;
          } catch (error) {
            this.logger.warn(`Failed to get status for adapter ${adapter.metadata.name}:`, error);
          }
        }

        return { data: stats, error: null };
      } catch (error) {
        this.logger.error('Error getting integration statistics:', error);
        return { data: null, error: 'Failed to get integration statistics' };
      }
    }, 'get integration statistics');
  }
} 
