import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { z } from 'zod';

// Analytics Schemas
export const IntegrationAnalyticsSchema = z.object({
  totalIntegrations: z.number(),
  activeIntegrations: z.number(),
  totalRecords: z.number(),
  lastSyncAt: z.string().datetime().optional(),
  syncSuccessRate: z.number(),
  errorCount: z.number(),
});

export const DataSourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  integrationname: z.string(),
  status: z.string(),
  lastsyncat: z.string().datetime().optional(),
  totalsyncs: z.number(),
  datarecordcount: z.number(),
  authtype: z.string(),
  error_message: z.string().optional(),
});

export const DataUsageByCategorySchema = z.object({
  category: z.string(),
  count: z.number(),
  integrations: z.number(),
});

export const RecentSyncActivitySchema = z.object({
  id: z.string().uuid(),
  user_integration_id: z.string().uuid(),
  sync_type: z.string(),
  status: z.string(),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  processedrecords: z.number(),
  user_name: z.string().optional(),
});

export type IntegrationAnalytics = z.infer<typeof IntegrationAnalyticsSchema>;
export type DataSource = z.infer<typeof DataSourceSchema>;
export type DataUsageByCategory = z.infer<typeof DataUsageByCategorySchema>;
export type RecentSyncActivity = z.infer<typeof RecentSyncActivitySchema>;

/**
 * Analytics Service
 * 
 * MIGRATED: Now extends BaseService for consistent error handling and logging
 * 
 * Handles all analytics-related database operations
 */
export class AnalyticsService extends BaseService {
  /**
   * Get user integration analytics
   */
  async getUserIntegrationAnalytics(userId: string): Promise<ServiceResponse<IntegrationAnalytics>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getUserIntegrationAnalytics', { userId });

      const { data, error } = await this.supabase
        .rpc('get_user_integration_analytics', { user_uuid: userId });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const analytics = IntegrationAnalyticsSchema.parse(data[0]);
        this.logSuccess('getUserIntegrationAnalytics', { userId });
        return this.createSuccessResponse(analytics);
      }

      return this.createErrorResponse('No analytics data found');
    }, `get integration analytics for user ${userId}`);
  }

  /**
   * Get user data sources
   */
  async getUserDataSources(userId: string): Promise<ServiceResponse<DataSource[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getUserDataSources', { userId });

      // Get detailed data sources information
      const { data: sourcesData, error: sourcesError } = await this.supabase
        .from('user_integrations')
        .select(`
          id,
          integration_name,
          status,
          last_sync_at,
          error_message,
          integrations (
            name,
            auth_type,
            category
          )
        `)
        .eq('user_id', userId)
        .order('last_sync_at', { ascending: false });

      if (sourcesError) throw sourcesError;

      // Get data record counts for each integration
      const sourcePromises = sourcesData?.map(async (source) => {
        const { count } = await this.supabase
          .from('integration_data')
          .select('*', { count: 'exact', head: true })
          .eq('user_integration_id', source.id);

        // Handle integrations property which might be an array or object
        const integration = Array.isArray(source.integrations) ? source.integrations[0] : source.integrations;

        return {
          id: source.id,
          name: source.integration_name || integration?.name || 'Unknown',
          integrationname: integration?.name || 'Unknown',
          status: source.status,
          lastsyncat: source.last_sync_at,
          totalsyncs: 0, // total_syncs column doesn't exist in user_integrations table
          datarecordcount: count || 0,
          authtype: integration?.auth_type || 'unknown',
          error_message: source.error_message
        };
      }) || [];

      const resolvedSources = await Promise.all(sourcePromises);
      const validatedSources = resolvedSources.map(source => DataSourceSchema.parse(source));

      this.logSuccess('getUserDataSources', { userId, count: validatedSources.length });
      return this.createSuccessResponse(validatedSources);
    }, `get data sources for user ${userId}`);
  }

  /**
   * Get usage by category
   */
  async getUsageByCategory(userId: string): Promise<ServiceResponse<DataUsageByCategory[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getUsageByCategory', { userId });

      // Get category information
      const { data: categoryData, error: categoryError } = await this.supabase
        .from('user_integrations')
        .select(`
          integrations (
            category
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'connected');

      if (categoryError) throw categoryError;

      if (!categoryData) {
        return this.createSuccessResponse([]);
      }

      const categoryMap = new Map<string, { count: number; integrations: number }>();
      
      categoryData.forEach(item => {
        // Handle integrations property which might be an array or object
        const integration = Array.isArray(item.integrations) ? item.integrations[0] : item.integrations;
        const category = integration?.category || 'other';
        const current = categoryMap.get(category) || { count: 0, integrations: 0 };
        categoryMap.set(category, {
          count: current.count,
          integrations: current.integrations + 1
        });
      });

      // Get record counts per category
      for (const [category, data] of categoryMap.entries()) {
        const { count } = await this.supabase
          .from('integration_data')
          .select('*', { count: 'exact', head: true })
          .in('user_integration_id', 
            categoryData
              .filter(item => {
                const integration = Array.isArray(item.integrations) ? item.integrations[0] : item.integrations;
                return integration?.category === category;
              })
              .map(item => item.id)
          );
        
        data.count = count || 0;
      }

      const usageByCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        integrations: data.integrations,
      }));

      const validatedUsage = usageByCategory.map(usage => DataUsageByCategorySchema.parse(usage));

      this.logSuccess('getUsageByCategory', { userId, categories: validatedUsage.length });
      return this.createSuccessResponse(validatedUsage);
    }, `get usage by category for user ${userId}`);
  }

  /**
   * Get recent sync activity
   */
  async getRecentSyncActivity(userId: string, limit: number = 10): Promise<ServiceResponse<RecentSyncActivity[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getRecentSyncActivity', { userId, limit });

      const { data, error } = await this.supabase
        .from('sync_activity')
        .select(`
          id,
          user_integration_id,
          sync_type,
          status,
          started_at,
          completed_at,
          processed_records,
          user_profiles!inner (
            first_name,
            last_name
          )
        `)
        .eq('user_profiles.user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const activities = (data || []).map(activity => ({
        id: activity.id,
        user_integration_id: activity.user_integration_id,
        sync_type: activity.sync_type,
        status: activity.status,
        started_at: activity.started_at,
        completed_at: activity.completed_at,
        processedrecords: activity.processed_records || 0,
        user_name: activity.user_profiles ? 
          `${activity.user_profiles.first_name} ${activity.user_profiles.last_name}`.trim() : 
          undefined,
      }));

      const validatedActivities = activities.map(activity => RecentSyncActivitySchema.parse(activity));

      this.logSuccess('getRecentSyncActivity', { userId, count: validatedActivities.length });
      return this.createSuccessResponse(validatedActivities);
    }, `get recent sync activity for user ${userId}`);
  }

  /**
   * Get daily sync activity for charts
   */
  async getDailySyncActivity(userId: string, days: number = 30): Promise<ServiceResponse<Array<{name: string; value: number}>>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getDailySyncActivity', { userId, days });

      const { data, error } = await this.supabase
        .rpc('get_daily_sync_activity', { 
          user_uuid: userId, 
          days_back: days 
        });

      if (error) throw error;

      const dailyActivity = (data || []).map((item: any) => ({
        name: item.date,
        value: item.count || 0,
      }));

      this.logSuccess('getDailySyncActivity', { userId, days: dailyActivity.length });
      return this.createSuccessResponse(dailyActivity);
    }, `get daily sync activity for user ${userId}`);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
