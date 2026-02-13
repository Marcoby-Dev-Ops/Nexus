import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { z } from 'zod';
import { selectData, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';

// Base Integration Schema
export const IntegrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  platform: z.string(),
  status: z.enum(['connected', 'disconnected', 'error', 'pending']),
  credentials: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  lastSync: z.string().optional(),
  dataCount: z.number().optional(),
  errorCount: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Integration = z.infer<typeof IntegrationSchema>;

// Integration Configuration Schema
export const IntegrationConfigSchema = z.object({
  name: z.string(),
  type: z.string(),
  platform: z.string(),
  credentials: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>;

// Sync Result Schema
export const SyncResultSchema = z.object({
  success: z.boolean(),
  recordsProcessed: z.number(),
  errors: z.array(z.string()),
  duration: z.number(),
  lastSync: z.string(),
});

export type SyncResult = z.infer<typeof SyncResultSchema>;

// Test Connection Result Schema
export const TestConnectionResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  details: z.record(z.any()).optional(),
});

export type TestConnectionResult = z.infer<typeof TestConnectionResultSchema>;

/**
 * Base Integration Service
 * Provides a standardized interface for all integrations
 * 
 * Extends BaseService for consistent error handling and logging
 */
export abstract class IntegrationBaseService extends BaseService implements CrudServiceInterface<Integration> {
  protected abstract readonly integrationType: string;
  protected abstract readonly platform: string;

  /**
   * Get a single integration by ID
   */
  async get(id: string): Promise<ServiceResponse<Integration>> {
    try {
      this.logger.info(`Getting integration ${id}`);
      const { data, error, success } = await selectOne<Integration>('integrations', { id });

      if (!success) {
        return this.handleError(error || 'Integration not found', `Failed to get integration ${id}`);
      }

      const validated = IntegrationSchema.parse(data);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, `Failed to get integration ${id}`);
    }
  }

  /**
   * Create a new integration
   */
  async create(data: Partial<Integration>): Promise<ServiceResponse<Integration>> {
    try {
      this.logger.info(`Creating ${this.integrationType} integration`);
      const integrationData = {
        ...data,
        type: this.integrationType,
        platform: this.platform,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data: created, error, success } = await insertOne<Integration>('integrations', integrationData);

      if (!success) {
        return this.handleError(error || 'Failed to create integration', `Failed to create ${this.integrationType} integration`);
      }

      const validatedData = IntegrationSchema.parse(created);
      return this.createResponse(validatedData);
    } catch (error) {
      return this.handleError(error, `Failed to create ${this.integrationType} integration`);
    }
  }

  /**
   * Update an existing integration
   */
  async update(id: string, data: Partial<Integration>): Promise<ServiceResponse<Integration>> {
    try {
      this.logger.info(`Updating integration ${id}`);
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const { data: updated, error, success } = await updateOne<Integration>('integrations', { id }, updateData);

      if (!success) {
        return this.handleError(error || 'Failed to update integration', `Failed to update integration ${id}`);
      }

      const validatedData = IntegrationSchema.parse(updated);
      return this.createResponse(validatedData);
    } catch (error) {
      return this.handleError(error, `Failed to update integration ${id}`);
    }
  }

  /**
   * Delete an integration
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      this.logger.info(`Deleting integration ${id}`);
      const { error, success } = await deleteOne('integrations', { id });

      if (!success) {
        return this.handleError(error || 'Failed to delete integration', `Failed to delete integration ${id}`);
      }

      return this.createResponse(true);
    } catch (error) {
      return this.handleError(error, `Failed to delete integration ${id}`);
    }
  }

  /**
   * List integrations with optional filters
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<Integration[]>> {
    try {
      this.logger.info(`Listing ${this.integrationType} integrations`);
      const filterParams: Record<string, any> = {
        type: this.integrationType,
        ...filters
      };

      const { data, error, success } = await selectData<Integration>({
        table: 'integrations',
        filters: filterParams,
        orderBy: [{ column: 'createdAt', ascending: false }]
      });

      if (!success) {
        return this.handleError(error || 'Failed to list integrations', `Failed to list ${this.integrationType} integrations`);
      }

      const validatedData = data?.map(item => IntegrationSchema.parse(item)) || [];
      return this.createResponse(validatedData);
    } catch (error) {
      return this.handleError(error, `Failed to list ${this.integrationType} integrations`);
    }
  }

  /**
   * Test connection to the integration
   */
  abstract testConnection(integrationId: string): Promise<ServiceResponse<TestConnectionResult>>;

  /**
   * Sync data from the integration
   */
  abstract syncData(integrationId: string): Promise<ServiceResponse<SyncResult>>;

  /**
   * Connect to the integration
   */
  abstract connect(integrationId: string, credentials: any): Promise<ServiceResponse<Integration>>;

  /**
   * Disconnect from the integration
   */
  abstract disconnect(integrationId: string): Promise<ServiceResponse<boolean>>;

  /**
   * Get integration metadata
   */
  abstract getMetadata(): Promise<ServiceResponse<{
    name: string;
    type: string;
    platform: string;
    description: string;
    capabilities: string[];
    requiredFields: string[];
    optionalFields: string[];
  }>>;

  /**
   * Validate integration configuration
   */
  abstract validateConfig(config: IntegrationConfig): Promise<ServiceResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>>;

  /**
   * Get integration status
   */
  async getStatus(integrationId: string): Promise<ServiceResponse<{
    status: string;
    lastSync: string | null;
    dataCount: number;
    errorCount: number;
    lastError: string | null;
  }>> {
    try {
      this.logger.info(`Getting status for integration ${integrationId}`);
      const { data: integration, error, success } = await selectOne<any>('integrations', { id: integrationId });

      if (!success || !integration) {
        return this.handleError(error || 'Integration not found', `Failed to get status for integration ${integrationId}`);
      }

      return this.createResponse({
        status: integration.status,
        lastSync: integration.lastSync,
        dataCount: integration.dataCount || 0,
        errorCount: integration.errorCount || 0,
        lastError: await this.getLastError(integrationId),
      });
    } catch (error) {
      return this.handleError(error, `Failed to get status for integration ${integrationId}`);
    }
  }

  /**
   * Update integration status
   */
  protected async updateStatus(
    integrationId: string,
    status: Integration['status'],
    metadata?: Partial<Integration>
  ): Promise<ServiceResponse<Integration>> {
    try {
      this.logger.info(`Updating status for integration ${integrationId}`);
      const updateData = {
        status,
        updatedAt: new Date().toISOString(),
        ...metadata
      };

      const { data: updated, error, success } = await updateOne<Integration>('integrations', { id: integrationId }, updateData);

      if (!success) {
        return this.handleError(error || 'Failed to update status', `Failed to update status for integration ${integrationId}`);
      }

      const validatedData = IntegrationSchema.parse(updated);
      return this.createResponse(validatedData);
    } catch (error) {
      return this.handleError(error, `Failed to update status for integration ${integrationId}`);
    }
  }

  /**
   * Get the last error for an integration
   */
  private async getLastError(integrationId: string): Promise<string | null> {
    try {
      const { data, error, success } = await selectData<any>({
        table: 'integration_errors',
        filters: { integration_id: integrationId },
        orderBy: [{ column: 'created_at', ascending: false }],
        limit: 1
      });

      if (!success || !data || data.length === 0) {
        return null;
      }

      return data[0].error_message;
    } catch (error) {
      this.logger.warn('Failed to get last error for integration:', error);
      return null;
    }
  }

  /**
   * Log integration error
   */
  protected async logError(integrationId: string, error: string): Promise<void> {
    try {
      // Get current error count first since we don't have atomic increment in the simple API client
      const { data: integration } = await selectOne<any>('integrations', { id: integrationId });
      const currentErrorCount = integration?.errorCount || 0;

      await updateOne('integrations', { id: integrationId }, {
        errorCount: currentErrorCount + 1,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to log error for integration ${integrationId}:`, error);
    }
  }
}

