/**
 * Integration Runtime System
 * 
 * Loads and executes generated integrations dynamically
 */

import { ApiClient, type ApiClientConfig } from './api-client';
import { consolidatedIntegrationService } from '@/services/integrations/consolidatedIntegrationService';
import { logger } from '@/shared/utils/logger';

export interface IntegrationInstance {
  id: string;
  name: string;
  methods: Record<string, (...args: any[]) => Promise<any>>;
  testConnection: () => Promise<boolean>;
  getStatus: () => Promise<{ status: string; lastSync?: string; errorCount: number }>;
}

export interface IntegrationMetadata {
  id: string;
  name: string;
  version: string;
  serverUrl: string;
  authMethods: string[];
  endpoints: Array<{
    name: string;
    path: string;
    method: string;
    description: string;
  }>;
  generatedCode: string;
  config: Record<string, any>;
}

/**
 * Runtime system for loading and executing generated integrations
 */
export class IntegrationRuntime {
  private static instance: IntegrationRuntime;
  private loadedIntegrations: Map<string, IntegrationInstance> = new Map();

  private constructor() {}

  static getInstance(): IntegrationRuntime {
    if (!IntegrationRuntime.instance) {
      IntegrationRuntime.instance = new IntegrationRuntime();
    }
    return IntegrationRuntime.instance;
  }

  /**
   * Load an integration from the database and create an executable instance
   */
  async loadIntegration(integrationId: string): Promise<IntegrationInstance> {
    try {
      // Check if already loaded
      if (this.loadedIntegrations.has(integrationId)) {
        return this.loadedIntegrations.get(integrationId)!;
      }

      // Get integration data from database
      const { data: userIntegrations, error } = await consolidatedIntegrationService.getUserIntegrations();
      
      if (error || !userIntegrations) {
        throw new Error(`Failed to load integration: ${error}`);
      }

      const userIntegration = userIntegrations.find(ui => ui.id === integrationId);
      if (!userIntegration) {
        throw new Error(`Integration not found: ${integrationId}`);
      }

      const settings = userIntegration.settings as any;
      if (!settings.generatedCode) {
        throw new Error('Integration has no generated code');
      }

      // Create API client instance
      const apiClient = new ApiClient({
        baseUrl: settings.serverUrl || '',
        apiKey: userIntegration.credentials?.apiKey,
        clientId: userIntegration.credentials?.clientId,
        clientSecret: userIntegration.credentials?.clientSecret,
        accessToken: userIntegration.credentials?.accessToken,
        refreshToken: userIntegration.credentials?.refreshToken,
      });

      // Create integration instance with methods
      const integrationInstance: IntegrationInstance = {
        id: integrationId,
        name: userIntegration.integration_name,
        methods: this.createMethodsFromEndpoints(settings.endpoints || [], apiClient),
        testConnection: () => this.testConnection(integrationId, apiClient),
        getStatus: () => this.getStatus(integrationId, userIntegration),
      };

      // Cache the instance
      this.loadedIntegrations.set(integrationId, integrationInstance);

      logger.info(`Loaded integration: ${userIntegration.integration_name}`, { integrationId });
      return integrationInstance;

    } catch (error) {
      logger.error('Failed to load integration', { integrationId, error });
      throw error;
    }
  }

  /**
   * Create methods from endpoint definitions
   */
  private createMethodsFromEndpoints(
    endpoints: Array<{ name: string; path: string; method: string; description: string }>,
    apiClient: ApiClient
  ): Record<string, (...args: any[]) => Promise<any>> {
    const methods: Record<string, (...args: any[]) => Promise<any>> = {};

    endpoints.forEach(endpoint => {
      const methodName = this.sanitizeMethodName(endpoint.name);
      
      methods[methodName] = async (...args: any[]) => {
        try {
          let path = endpoint.path;
          
          // Replace path parameters with arguments
          const pathParams = path.match(/\{([^}]+)\}/g);
          if (pathParams) {
            pathParams.forEach((param, index) => {
              const paramName = param.slice(1, -1);
              const value = args[index];
              if (value !== undefined) {
                path = path.replace(param, value);
              }
            });
          }

          // Determine request body (last argument for POST/PUT/PATCH)
          let body: any = undefined;
          if (['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase()) && args.length > 0) {
            body = args[args.length - 1];
          }

          // Make the request
          const response = await apiClient.request(endpoint.method.toLowerCase() as any, path, { body });
          
          if (!response.success) {
            throw new Error(`API request failed: ${response.error}`);
          }

          return response.data;

        } catch (error) {
          logger.error(`Method execution failed: ${methodName}`, { error, endpoint });
          throw error;
        }
      };
    });

    return methods;
  }

  /**
   * Sanitize method name for JavaScript
   */
  private sanitizeMethodName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Test connection to the integration
   */
  private async testConnection(integrationId: string, apiClient: ApiClient): Promise<boolean> {
    try {
      // Try to make a simple request to test connectivity
      const response = await apiClient.get('/');
      return response.success;
    } catch (error) {
      logger.error('Connection test failed', { integrationId, error });
      return false;
    }
  }

  /**
   * Get integration status
   */
  private async getStatus(
    integrationId: string, 
    userIntegration: any
  ): Promise<{ status: string; lastSync?: string; errorCount: number }> {
    return {
      status: userIntegration.status || 'unknown',
      lastSync: userIntegration.last_sync_at,
      errorCount: userIntegration.error_count || 0,
    };
  }

  /**
   * Execute a method on an integration
   */
  async executeMethod(
    integrationId: string, 
    methodName: string, 
    ...args: any[]
  ): Promise<any> {
    const integration = await this.loadIntegration(integrationId);
    
    if (!integration.methods[methodName]) {
      throw new Error(`Method not found: ${methodName}`);
    }

    return integration.methods[methodName](...args);
  }

  /**
   * Get all loaded integrations
   */
  getLoadedIntegrations(): IntegrationInstance[] {
    return Array.from(this.loadedIntegrations.values());
  }

  /**
   * Unload an integration
   */
  unloadIntegration(integrationId: string): void {
    this.loadedIntegrations.delete(integrationId);
    logger.info(`Unloaded integration: ${integrationId}`);
  }

  /**
   * Clear all loaded integrations
   */
  clearAll(): void {
    this.loadedIntegrations.clear();
    logger.info('Cleared all loaded integrations');
  }
}

// Export singleton instance
export const integrationRuntime = IntegrationRuntime.getInstance();
