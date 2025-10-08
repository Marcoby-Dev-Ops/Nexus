import { z } from 'zod';
import { BaseService, type ServiceResponse } from './BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, selectWithOptions } from '@/lib/api-client';

// ============================================================================
// SCHEMAS
// ============================================================================

export const ChatUsageTrackingSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  org_id: z.string().uuid().optional(),
  date: z.string().date(),
  usage_count: z.number().int().min(0),
  metadata: z.record(z.any()).optional(),
});

export type ChatUsageTracking = z.infer<typeof ChatUsageTrackingSchema>;

export const CreateChatUsageTrackingSchema = ChatUsageTrackingSchema.omit({
  id: true,
});

export type CreateChatUsageTracking = z.infer<typeof CreateChatUsageTrackingSchema>;

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const SERVICE_CONFIG = {
  tableName: 'chat_usage_tracking',
  schema: ChatUsageTrackingSchema,
  createSchema: CreateChatUsageTrackingSchema,
  defaultOrderBy: 'date.desc',
  defaultLimit: 50,
} as const;

// ============================================================================
// CHAT USAGE TRACKING SERVICE
// ============================================================================

/**
 * Service for managing chat usage tracking
 * 
 * Provides type-safe, RBAC-compliant operations for chat usage tracking
 * following the service layer architecture standards.
 */
export class ChatUsageTrackingService extends BaseService {
  private readonly config = SERVICE_CONFIG;

  /**
   * Get a chat usage record by ID
   */
  async get(id: string): Promise<ServiceResponse<ChatUsageTracking>> {
    try {
      this.logger.info('Getting chat usage record', { id });

      return await this.executeDbOperation(async () => {
        const resp = await selectOne<ChatUsageTracking>(this.config.tableName, { id });
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to get chat usage record');
        const validated = this.config.schema.parse(resp.data);
        return { data: validated, error: null, success: true };
      }, `get ${this.config.tableName} ${id}`);
    } catch (error) {
      return this.handleError(error, 'Failed to get chat usage record');
    }
  }

  /**
   * Create a new chat usage record
   */
  async create(data: CreateChatUsageTracking): Promise<ServiceResponse<ChatUsageTracking>> {
    try {
      this.logger.info('Creating chat usage record', { user_id: data.user_id, date: data.date });

      const validated = this.config.createSchema.parse(data);

      return await this.executeDbOperation(async () => {
        const resp = await insertOne<ChatUsageTracking>(this.config.tableName, validated);
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to create chat usage record');
        const validatedCreated = this.config.schema.parse(resp.data);
        return { data: validatedCreated, error: null, success: true };
      }, `create ${this.config.tableName}`);
    } catch (error) {
      return this.handleError(error, 'Failed to create chat usage record');
    }
  }

  /**
   * Update a chat usage record
   */
  async update(id: string, data: Partial<CreateChatUsageTracking>): Promise<ServiceResponse<ChatUsageTracking>> {
    try {
      this.logger.info('Updating chat usage record', { id });

      return await this.executeDbOperation(async () => {
        const resp = await updateOne<ChatUsageTracking>(this.config.tableName, id, data as any);
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to update chat usage record');
        const validated = this.config.schema.parse(resp.data);
        return { data: validated, error: null, success: true };
      }, `update ${this.config.tableName} ${id}`);
    } catch (error) {
      return this.handleError(error, 'Failed to update chat usage record');
    }
  }

  /**
   * Delete a chat usage record
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      this.logger.info('Deleting chat usage record', { id });

      return await this.executeDbOperation(async () => {
        const resp = await deleteOne(this.config.tableName, { id });
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to delete chat usage record');
        return { data: true, error: null, success: true };
      }, `delete ${this.config.tableName} ${id}`);
    } catch (error) {
      return this.handleError(error, 'Failed to delete chat usage record');
    }
  }

  /**
   * List chat usage records with optional filters
   */
  async list(filters?: {
    user_id?: string;
    org_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<ServiceResponse<ChatUsageTracking[]>> {
    try {
      this.logger.info('Listing chat usage records', { filters });

      // Build filter object and leverage selectData helper
      const queryFilters: Record<string, any> = {};
      if (filters?.user_id) queryFilters.user_id = filters.user_id;
      if (filters?.org_id) queryFilters.org_id = filters.org_id;
      if (filters?.date_from) queryFilters.date = { gte: filters.date_from };
      if (filters?.date_to) queryFilters.date = { lte: filters.date_to };

      const limit = filters?.limit ?? this.config.defaultLimit;
    // offset not used in current API call

      const resp = await selectWithOptions<ChatUsageTracking>(this.config.tableName, {
        filter: queryFilters as any,
        orderBy: { column: 'date', ascending: false },
        limit,
      });

      if (!resp || !resp.success) {
        return this.handleError(resp?.error || 'Failed to list chat usage records', 'Failed to list chat usage records');
      }

      const validated = z.array(this.config.schema).parse(resp.data || []);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to list chat usage records');
    }
  }

  /**
   * Get usage for a specific date range
   */
  async getUsageForPeriod(user_id: string, date_from: string, date_to: string, org_id?: string): Promise<ServiceResponse<ChatUsageTracking[]>> {
    return this.list({
      user_id,
      org_id,
      date_from,
      date_to,
    });
  }

  /**
   * Get current month usage for a user
   */
  async getCurrentMonthUsage(user_id: string, org_id?: string): Promise<ServiceResponse<ChatUsageTracking[]>> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    return this.getUsageForPeriod(user_id, firstDayOfMonth, lastDayOfMonth, org_id);
  }

  /**
   * Get total usage for a user
   */
  async getTotalUsage(user_id: string, org_id?: string): Promise<ServiceResponse<number>> {
    try {
      this.logger.info('Getting total usage', { user_id, org_id });

      const resp = await select<ChatUsageTracking>(this.config.tableName, '*', { user_id, org_id: org_id ?? null });

      if (!resp || !resp.success) {
        return this.handleError(resp?.error || 'Failed to get total usage', 'Failed to get total usage');
      }

      const data = resp.data || [];
      const totalUsage = data.reduce((sum: number, record: ChatUsageTracking) => sum + (record.usage_count || 0), 0);
      return this.createResponse(totalUsage);
    } catch (error) {
      return this.handleError(error, 'Failed to get total usage');
    }
  }

  /**
   * Increment usage count for a user on a specific date
   */
  async incrementUsage(user_id: string, date: string, org_id?: string): Promise<ServiceResponse<ChatUsageTracking>> {
    try {
      this.logger.info('Incrementing usage', { user_id, date, org_id });

      // Try to find an existing record
      const existingResp = await selectOne<ChatUsageTracking>(this.config.tableName, { user_id, date, org_id: org_id ?? null });

      if (existingResp && existingResp.data) {
        // Update existing record
        const idToUpdate = (existingResp.data as any).id as string;
        const updateResp = await updateOne<ChatUsageTracking>(this.config.tableName, idToUpdate, {
          usage_count: ((existingResp.data as any).usage_count || 0) + 1,
        } as any);

        if (!updateResp || updateResp.error) {
          return this.handleError(updateResp?.error || 'Failed to update usage record', 'Failed to update usage record');
        }

        const validated = this.config.schema.parse(updateResp.data);
        return this.createResponse(validated);
      }

      // Create new record
      return this.create({ user_id, org_id, date, usage_count: 1 });
    } catch (error) {
      return this.handleError(error, 'Failed to increment usage');
    }
  }

  /**
   * Get usage statistics for a user
   */
  async getUsageStats(user_id: string, org_id?: string): Promise<ServiceResponse<{
    total_usage: number;
    current_month_usage: number;
    average_daily_usage: number;
  }>> {
    try {
      this.logger.info('Getting usage stats', { user_id, org_id });

      const [totalResult, currentMonthResult] = await Promise.all([
        this.getTotalUsage(user_id, org_id),
        this.getCurrentMonthUsage(user_id, org_id),
      ]);

      if (!totalResult.success) {
        return this.handleError(new Error(totalResult.error || 'Failed to get total usage'), 'Failed to get usage stats');
      }

      if (!currentMonthResult.success) {
        return this.handleError(new Error(currentMonthResult.error || 'Failed to get current month usage'), 'Failed to get usage stats');
      }

      const currentMonthUsage = currentMonthResult.data?.reduce((sum, record) => sum + (record.usage_count || 0), 0) || 0;
      const totalUsage = totalResult.data || 0;

      // Calculate average daily usage (simplified - could be enhanced with more sophisticated logic)
      const averageDailyUsage = totalUsage > 0 ? Math.round(totalUsage / 30) : 0; // Assuming 30 days as default

      return this.createResponse({
        total_usage: totalUsage,
        current_month_usage: currentMonthUsage,
        average_daily_usage: averageDailyUsage,
      });
    } catch (error) {
      return this.handleError(error, 'Failed to get usage stats');
    }
  }
}

// ============================================================================
// SERVICE INSTANCE
// ============================================================================

export const chatUsageTrackingService = new ChatUsageTrackingService(); 
