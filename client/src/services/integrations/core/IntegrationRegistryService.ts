import { BaseService } from '@/core/services/BaseService';
import { selectData, selectOne } from '@/lib/api-client';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { IntegrationBaseService } from './IntegrationBaseService';
import { type Integration, type IntegrationConfig } from './IntegrationBaseService';
import { z } from 'zod';

// Integration Registry Schema
export const IntegrationRegistrySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  platform: z.string(),
  description: z.string(),
  category: z.string(),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  capabilities: z.array(z.string()),
  requiredFields: z.array(z.string()),
  optionalFields: z.array(z.string()),
  icon: z.string().optional(),
  documentationUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type IntegrationRegistry = z.infer<typeof IntegrationRegistrySchema>;

// Integration Category Schema
export const IntegrationCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string().optional(),
  integrations: z.array(z.string()), // Integration type IDs
});

export type IntegrationCategory = z.infer<typeof IntegrationCategorySchema>;

/**
 * Integration Registry Service
 * Manages all available integrations and provides centralized access
 * 
 * Extends BaseService for consistent error handling and logging
 */
export class IntegrationRegistryService extends BaseService {
  private integrations = new Map<string, IntegrationBaseService>();
  private categories = new Map<string, IntegrationCategory>();

  /**
   * Register an integration service
   */
  registerIntegration(integration: IntegrationBaseService): void {
    this.logger.info(`Registering integration: ${integration.constructor.name}`);
    this.integrations.set(integration.constructor.name, integration);
  }

  /**
   * Get an integration service by type
   */
  getIntegration(type: string): IntegrationBaseService | undefined {
    return this.integrations.get(type);
  }

  /**
   * Get all registered integrations
   */
  getAllIntegrations(): IntegrationBaseService[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Get integrations by category
   */
  async getIntegrationsByCategory(category: string): Promise<ServiceResponse<IntegrationRegistry[]>> {
    return this.executeDbOperation(async () => {
      const { data, success, error } = await selectData<any>({
        table: 'integration_registry',
        filters: {
          category,
          isActive: true
        },
        orderBy: [{ column: 'name', ascending: true }]
      });

      if (!success) throw new Error(error || 'Failed to fetch integrations by category');
      const validatedData = data?.map(item => IntegrationRegistrySchema.parse(item)) || [];
      return { data: validatedData, error: null, success: true };
    }, `get integrations by category ${category}`);
  }

  /**
   * Get popular integrations
   */
  async getPopularIntegrations(): Promise<ServiceResponse<IntegrationRegistry[]>> {
    return this.executeDbOperation(async () => {
      const { data, success, error } = await selectData<any>({
        table: 'integration_registry',
        filters: {
          isPopular: true,
          isActive: true
        },
        orderBy: [{ column: 'name', ascending: true }]
      });

      if (!success) throw new Error(error || 'Failed to fetch popular integrations');
      const validatedData = data?.map(item => IntegrationRegistrySchema.parse(item)) || [];
      return { data: validatedData, error: null, success: true };
    }, 'get popular integrations');
  }

  /**
   * Get all integration categories
   */
  async getCategories(): Promise<ServiceResponse<IntegrationCategory[]>> {
    return this.executeDbOperation(async () => {
      const { data, success, error } = await selectData<any>({
        table: 'integration_categories',
        orderBy: [{ column: 'name', ascending: true }]
      });

      if (!success) throw new Error(error || 'Failed to fetch integration categories');
      const validatedData = data?.map(item => IntegrationCategorySchema.parse(item)) || [];
      return { data: validatedData, error: null, success: true };
    }, 'get integration categories');
  }

  /**
   * Search integrations
   */
  async searchIntegrations(query: string): Promise<ServiceResponse<IntegrationRegistry[]>> {
    return this.executeDbOperation(async () => {
      // Note: Standard API client doesn't support complex OR/ILIKE filters yet
      // We'll fetch all active integrations and filter client-side for now
      // This is a temporary measure until the backend supports advanced searching
      const { data, success, error } = await selectData<any>({
        table: 'integration_registry',
        filters: { isActive: true },
        orderBy: [{ column: 'name', ascending: true }]
      });

      if (!success) throw new Error(error || 'Failed to search integrations');

      const lowerQuery = query.toLowerCase();
      const filtered = (data || []).filter(item =>
        item.name?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.platform?.toLowerCase().includes(lowerQuery)
      );

      const validatedData = filtered.map(item => IntegrationRegistrySchema.parse(item));
      return { data: validatedData, error: null, success: true };
    }, `search integrations with query: ${query}`);
  }

  /**
   * Get integration metadata
   */
  async getIntegrationMetadata(type: string): Promise<ServiceResponse<IntegrationRegistry | null>> {
    return this.executeDbOperation(async () => {
      const { data, success, error } = await selectOne<any>('integration_registry', {
        type: type,
        isActive: true
      });

      if (!success && error && !error.includes('No record found')) {
        throw new Error(error);
      }

      return {
        data: data ? IntegrationRegistrySchema.parse(data) : null,
        error: null,
        success: true
      };
    }, `get metadata for integration type ${type}`);
  }

  /**
   * Create a new integration instance
   */
  async createIntegration(config: IntegrationConfig): Promise<ServiceResponse<Integration>> {
    return this.executeDbOperation(async () => {
      const integration = this.getIntegration(config.type);
      if (!integration) {
        throw new Error(`Integration type ${config.type} not found`);
      }

      const result = await integration.create({
        name: config.name,
        type: config.type,
        platform: config.platform,
        credentials: config.credentials,
        settings: config.settings,
      });

      if (result.error) throw new Error(result.error);
      return result;
    }, `create integration ${config.type}`);
  }

  /**
   * Test connection for an integration
   */
  async testConnection(integrationId: string): Promise<ServiceResponse<{
    success: boolean;
    error?: string;
    details?: any;
  }>> {
    return this.executeDbOperation(async () => {
      // Get integration details
      const { data: integration, success, error } = await selectOne<any>('integrations', { id: integrationId });

      if (!success) throw new Error(error || 'Integration not found');

      const integrationService = this.getIntegration(integration.type);
      if (!integrationService) {
        throw new Error(`Integration service for type ${integration.type} not found`);
      }

      const result = await integrationService.testConnection(integrationId);
      return result;
    }, `test connection for integration ${integrationId}`);
  }

  /**
   * Sync data for an integration
   */
  async syncIntegration(integrationId: string): Promise<ServiceResponse<{
    success: boolean;
    recordsProcessed: number;
    errors: string[];
    duration: number;
  }>> {
    return this.executeDbOperation(async () => {
      // Get integration details
      const { data: integration, success, error } = await selectOne<any>('integrations', { id: integrationId });

      if (!success) throw new Error(error || 'Integration not found');

      const integrationService = this.getIntegration(integration.type);
      if (!integrationService) {
        throw new Error(`Integration service for type ${integration.type} not found`);
      }

      const result = await integrationService.syncData(integrationId);
      return result;
    }, `sync integration ${integrationId}`);
  }

  /**
   * Get integration statistics
   */
  async getIntegrationStats(): Promise<ServiceResponse<{
    totalIntegrations: number;
    activeIntegrations: number;
    errorIntegrations: number;
    totalDataPoints: number;
    categories: Record<string, number>;
  }>> {
    return this.executeDbOperation(async () => {
      const { data: integrations, success, error } = await selectData<any>({
        table: 'integrations',
        columns: 'status, type'
      });

      if (!success) throw new Error(error || 'Failed to fetch integration stats');

      const stats = {
        totalIntegrations: integrations?.length || 0,
        activeIntegrations: integrations?.filter(i => i.status === 'connected').length || 0,
        errorIntegrations: integrations?.filter(i => i.status === 'error').length || 0,
        totalDataPoints: await this.calculateTotalDataPoints(),
        categories: {} as Record<string, number>,
      };

      // Calculate category statistics
      if (integrations) {
        integrations.forEach(integration => {
          const category = this.getCategoryForType(integration.type);
          if (category) {
            stats.categories[category] = (stats.categories[category] || 0) + 1;
          }
        });
      }

      return { data: stats, error: null, success: true };
    }, 'get integration statistics');
  }

  /**
   * Calculate total data points from integration_data table
   */
  private async calculateTotalDataPoints(): Promise<number> {
    try {
      const { data, success, error } = await selectData<any>({
        table: 'integration_data',
        columns: 'id'
      });

      if (!success) {
        this.logger.warn('Failed to calculate total data points:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      this.logger.warn('Error calculating total data points:', error);
      return 0;
    }
  }

  /**
   * Get category for integration type
   */
  private getCategoryForType(type: string): string | null {
    // This would typically come from a mapping table
    const categoryMap: Record<string, string> = {
      'hubspot': 'CRM',
      'salesforce': 'CRM',
      'paypal': 'Payment',
      'stripe': 'Payment',
      'quickbooks': 'Accounting',
      'xero': 'Accounting',
      'mailchimp': 'Marketing',
      'sendgrid': 'Marketing',
    };

    return categoryMap[type] || 'Other';
  }
} 
