/**
 * Universal Integration Service
 * 
 * Provides a unified interface for managing integrations across different platforms.
 */

import { adapterRegistry, type AdapterMetadata } from '@/core/adapters/adapterRegistry';
import { logger } from '@/shared/utils/logger';

export interface IntegrationConfig {
  id: string;
  name: string;
  platform: string;
  credentials: any;
  settings: any;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  dataCount?: number;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  duration: number;
}

export class UniversalIntegrationService {
  /**
   * Get all available integrations
   */
  async getAvailableIntegrations(): Promise<AdapterMetadata[]> {
    try {
      const adapters = adapterRegistry.getAll();
      return adapters.map(adapter => adapter.metadata);
    } catch (error) {
      logger.error('Error getting available integrations:', error);
      return [];
    }
  }

  /**
   * Get integrations by category
   */
  async getIntegrationsByCategory(category: string): Promise<AdapterMetadata[]> {
    try {
      const adapters = adapterRegistry.getByCategory(category);
      return adapters.map(adapter => adapter.metadata);
    } catch (error) {
      logger.error('Error getting integrations by category:', error);
      return [];
    }
  }

  /**
   * Get popular integrations
   */
  async getPopularIntegrations(): Promise<AdapterMetadata[]> {
    try {
      const adapters = adapterRegistry.getPopular();
      return adapters.map(adapter => adapter.metadata);
    } catch (error) {
      logger.error('Error getting popular integrations:', error);
      return [];
    }
  }

  /**
   * Connect to an integration
   */
  async connectIntegration(integrationId: string, credentials: any): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`Connecting to integration: ${integrationId}`);
      
      const adapter = adapterRegistry.get(integrationId);
      if (!adapter) {
        return { success: false, error: 'Integration not found' };
      }

      const result = await adapter.connect(credentials);
      
      if (result.success) {
        logger.info(`Successfully connected to ${integrationId}`);
      } else {
        logger.error(`Failed to connect to ${integrationId}:`, result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error connecting to integration ${integrationId}:`, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Disconnect from an integration
   */
  async disconnectIntegration(integrationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`Disconnecting from integration: ${integrationId}`);
      
      const adapter = adapterRegistry.get(integrationId);
      if (!adapter) {
        return { success: false, error: 'Integration not found' };
      }

      const result = await adapter.disconnect();
      
      if (result.success) {
        logger.info(`Successfully disconnected from ${integrationId}`);
      } else {
        logger.error(`Failed to disconnect from ${integrationId}:`, result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error disconnecting from integration ${integrationId}:`, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Test connection to an integration
   */
  async testConnection(integrationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`Testing connection to integration: ${integrationId}`);
      
      const adapter = adapterRegistry.get(integrationId);
      if (!adapter) {
        return { success: false, error: 'Integration not found' };
      }

      const result = await adapter.testConnection();
      
      if (result.success) {
        logger.info(`Connection test successful for ${integrationId}`);
      } else {
        logger.error(`Connection test failed for ${integrationId}:`, result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error testing connection to integration ${integrationId}:`, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sync data from an integration
   */
  async syncIntegration(integrationId: string): Promise<SyncResult> {
    try {
      logger.info(`Starting sync for integration: ${integrationId}`);
      const startTime = Date.now();
      
      const adapter = adapterRegistry.get(integrationId);
      if (!adapter) {
        return {
          success: false,
          recordsProcessed: 0,
          errors: ['Integration not found'],
          duration: 0
        };
      }

      const result = await adapter.sync();
      const duration = Date.now() - startTime;
      
      if (result.success) {
        logger.info(`Sync completed for ${integrationId}`, { 
          recordsProcessed: result.recordsProcessed, 
          duration 
        });
      } else {
        logger.error(`Sync failed for ${integrationId}:`, result.error);
      }
      
      return {
        success: result.success,
        recordsProcessed: result.recordsProcessed,
        errors: result.error ? [result.error] : [],
        duration
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error syncing integration ${integrationId}:`, error);
      return {
        success: false,
        recordsProcessed: 0,
        errors: [errorMessage],
        duration: 0
      };
    }
  }

  /**
   * Get integration metadata
   */
  getIntegrationMetadata(integrationId: string): AdapterMetadata | undefined {
    return adapterRegistry.getMetadata(integrationId);
  }

  /**
   * Check if integration exists
   */
  hasIntegration(integrationId: string): boolean {
    return adapterRegistry.has(integrationId);
  }
}

// Export singleton instance
export const universalIntegrationService = new UniversalIntegrationService(); 