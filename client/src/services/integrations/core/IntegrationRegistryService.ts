import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { IntegrationBaseService} from './IntegrationBaseService';
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
      const { data, error } = await this.supabase
        .from('integration_registry')
        .select('*')
        .eq('category', category)
        .eq('isActive', true)
        .order('name');

      if (error) throw error;
      const validatedData = data?.map(item => IntegrationRegistrySchema.parse(item)) || [];
      return { data: validatedData, error: null };
    }, `get integrations by category ${category}`);
  }

  /**
   * Get popular integrations
   */
  async getPopularIntegrations(): Promise<ServiceResponse<IntegrationRegistry[]>> {
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from('integration_registry')
        .select('*')
        .eq('isPopular', true)
        .eq('isActive', true)
        .order('name');

      if (error) throw error;
      const validatedData = data?.map(item => IntegrationRegistrySchema.parse(item)) || [];
      return { data: validatedData, error: null };
    }, 'get popular integrations');
  }

  /**
   * Get all integration categories
   */
  async getCategories(): Promise<ServiceResponse<IntegrationCategory[]>> {
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from('integration_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      const validatedData = data?.map(item => IntegrationCategorySchema.parse(item)) || [];
      return { data: validatedData, error: null };
    }, 'get integration categories');
  }

  /**
   * Search integrations
   */
  async searchIntegrations(query: string): Promise<ServiceResponse<IntegrationRegistry[]>> {
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from('integration_registry')
        .select('*')
        .eq('isActive', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,platform.ilike.%${query}%`)
        .order('name');

      if (error) throw error;
      const validatedData = data?.map(item => IntegrationRegistrySchema.parse(item)) || [];
      return { data: validatedData, error: null };
    }, `search integrations with query: ${query}`);
  }

  /**
   * Get integration metadata
   */
  async getIntegrationMetadata(type: string): Promise<ServiceResponse<IntegrationRegistry | null>> {
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from('integration_registry')
        .select('*')
        .eq('type', type)
        .eq('isActive', true)
        .single();

      if (error) throw error;
      return { 
        data: data ? IntegrationRegistrySchema.parse(data) : null, 
        error: null 
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
      const { data: integration, error } = await this.supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error) throw error;

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
      const { data: integration, error } = await this.supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error) throw error;

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
      const { data: integrations, error } = await this.supabase
        .from('integrations')
        .select('status, type');

      if (error) throw error;

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

      return { data: stats, error: null };
    }, 'get integration statistics');
  }

  /**
   * Calculate total data points from integration_data table
   */
  private async calculateTotalDataPoints(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('integration_data')
        .select('id', { count: 'exact' });

      if (error) {
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
