import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { z } from 'zod';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/database';
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
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from('integrations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { data: IntegrationSchema.parse(data), error: null };
    }, `get integration ${id}`);
  }

  /**
   * Create a new integration
   */
  async create(data: Partial<Integration>): Promise<ServiceResponse<Integration>> {
    return this.executeDbOperation(async () => {
      const integrationData = {
        ...data,
        type: this.integrationType,
        platform: this.platform,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data: result, error } = await this.supabase
        .from('integrations')
        .insert(integrationData)
        .select()
        .single();

      if (error) throw error;
      return { data: IntegrationSchema.parse(result), error: null };
    }, `create ${this.integrationType} integration`);
  }

  /**
   * Update an existing integration
   */
  async update(id: string, data: Partial<Integration>): Promise<ServiceResponse<Integration>> {
    return this.executeDbOperation(async () => {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const { data: result, error } = await this.supabase
        .from('integrations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: IntegrationSchema.parse(result), error: null };
    }, `update integration ${id}`);
  }

  /**
   * Delete an integration
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      const { error } = await this.supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    }, `delete integration ${id}`);
  }

  /**
   * List integrations with optional filters
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<Integration[]>> {
    return this.executeDbOperation(async () => {
      let query = this.supabase
        .from('integrations')
        .select('*')
        .eq('type', this.integrationType)
        .order('createdAt', { ascending: false });

      // Apply additional filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      const { data, error } = await query;

      if (error) throw error;
      const validatedData = data?.map(item => IntegrationSchema.parse(item)) || [];
      return { data: validatedData, error: null };
    }, `list ${this.integrationType} integrations`);
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
    return this.executeDbOperation(async () => {
      const { data: integration, error } = await this.supabase
        .from('integrations')
        .select('status, lastSync, dataCount, errorCount')
        .eq('id', integrationId)
        .single();

      if (error) throw error;

      return {
        data: {
          status: integration.status,
          lastSync: integration.lastSync,
          dataCount: integration.dataCount || 0,
          errorCount: integration.errorCount || 0,
          lastError: await this.getLastError(integrationId),
        },
        error: null
      };
    }, `get status for integration ${integrationId}`);
  }

  /**
   * Update integration status
   */
  protected async updateStatus(
    integrationId: string, 
    status: Integration['status'], 
    metadata?: Partial<Integration>
  ): Promise<ServiceResponse<Integration>> {
    return this.executeDbOperation(async () => {
      const updateData = {
        status,
        updatedAt: new Date().toISOString(),
        ...metadata
      };

      const { data: result, error } = await this.supabase
        .from('integrations')
        .update(updateData)
        .eq('id', integrationId)
        .select()
        .single();

      if (error) throw error;
      return { data: IntegrationSchema.parse(result), error: null };
    }, `update status for integration ${integrationId}`);
  }

  /**
   * Get the last error for an integration
   */
  private async getLastError(integrationId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('integration_errors')
        .select('error_message')
        .eq('integration_id', integrationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data.error_message;
    } catch (error) {
      this.logger.warn('Failed to get last error for integration:', error);
      return null;
    }
  }

  /**
   * Log integration error
   */
  protected async logError(integrationId: string, error: string): Promise<void> {
    await this.executeDbOperation(async () => {
      const { error: updateError } = await this.supabase
        .from('integrations')
        .update({
          errorCount: this.supabase.raw('error_count + 1'),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', integrationId);

      if (updateError) throw updateError;
    }, `log error for integration ${integrationId}`);
  }
} 
