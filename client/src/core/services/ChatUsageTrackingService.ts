import { z } from 'zod';
import { BaseService, type ServiceResponse } from './BaseService';
import { selectData, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

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

      const { data, error, success } = await selectOne<ChatUsageTracking>(this.config.tableName, { id });

      if (!success) {
        return this.handleError(error || 'Record not found', 'Failed to get chat usage record');
      }

      const validated = this.config.schema.parse(data);
      return this.createResponse(validated);
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

      const { data: created, error, success } = await insertOne<ChatUsageTracking>(this.config.tableName, validated);

      if (!success) {
        return this.handleError(error || 'Failed to create record', 'Failed to create chat usage record');
      }

      const validatedCreated = this.config.schema.parse(created);
      return this.createResponse(validatedCreated);
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

      const { data: updated, error, success } = await updateOne<ChatUsageTracking>(this.config.tableName, { id }, data);

      if (!success) {
        return this.handleError(error || 'Failed to update record', 'Failed to update chat usage record');
      }

      const validated = this.config.schema.parse(updated);
      return this.createResponse(validated);
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

      const { error, success } = await deleteOne(this.config.tableName, { id });

      if (!success) {
        return this.handleError(error || 'Failed to delete record', 'Failed to delete chat usage record');
      }

      return this.createResponse(true);
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

      const queryFilters: Record<string, any> = {};
      if (filters?.user_id) queryFilters.user_id = filters.user_id;
      if (filters?.org_id) queryFilters.org_id = filters.org_id;

      // Note: Simple api-client doesn't have complex GTE/LTE yet in filters object
      // but we can pass them as params if the backend supports it.
      // For now, following current api-client capabilities which mostly handle equality.
      if (filters?.date_from) queryFilters.date_from = filters.date_from;
      if (filters?.date_to) queryFilters.date_to = filters.date_to;

      const { data, error, success } = await selectData<ChatUsageTracking>({
        table: this.config.tableName,
        filters: queryFilters,
        orderBy: [{ column: 'date', ascending: false }],
        limit: filters?.limit || this.config.defaultLimit,
        offset: filters?.offset
      });

      if (!success) {
        return this.handleError(error || 'Failed to list records', 'Failed to list chat usage records');
      }

      const validated = z.array(this.config.schema).parse(data);
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

      const filters: Record<string, any> = { user_id };
      if (org_id) {
        filters.org_id = org_id;
      }

      const { data, error, success } = await selectData<ChatUsageTracking>({
        table: this.config.tableName,
        columns: 'usage_count',
        filters
      });

      if (!success) {
        return this.handleError(error || 'Failed to fetch usage', 'Failed to get total usage');
      }

      const totalUsage = (data || []).reduce((sum: number, record: ChatUsageTracking) => sum + (record.usage_count || 0), 0);
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

      // First, try to get existing record
      const filters: Record<string, any> = { user_id, date };
      if (org_id) {
        filters.org_id = org_id;
      }

      const { data: existing, success } = await selectOne<ChatUsageTracking>(this.config.tableName, filters);

      if (success && existing) {
        // Update existing record
        const { data: updated, error: updateError, success: updateSuccess } = await updateOne<ChatUsageTracking>(
          this.config.tableName,
          { id: existing.id },
          { usage_count: (existing.usage_count || 0) + 1 }
        );

        if (!updateSuccess) {
          return this.handleError(updateError || 'Failed to update', 'Failed to update usage record');
        }

        const validated = this.config.schema.parse(updated);
        return this.createResponse(validated);
      } else {
        // Create new record
        return this.create({
          user_id: user_id,
          org_id: org_id,
          date: date,
          usage_count: 1,
        });
      }
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
