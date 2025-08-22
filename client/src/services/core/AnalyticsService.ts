/**
 * Consolidated Analytics Service
 * 
 * Merges functionality from:
 * - src/services/AnalyticsService.ts (Integration analytics)
 * - src/services/analytics/analyticsService.ts (General analytics + Google Analytics)
 * 
 * Provides unified analytics with domain-specific modules
 */

import { z } from 'zod';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callRPC, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

// ============================================================================
// SCHEMAS
// ============================================================================

// Integration Analytics Schemas
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

// General Analytics Schemas
export const AnalyticsEventSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  company_id: z.string().optional(),
  event_type: z.string(),
  event_data: z.record(z.any()).optional(),
  timestamp: z.string().optional(),
  session_id: z.string().optional(),
  page_url: z.string().optional(),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
});

export const AnalyticsMetricsSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  company_id: z.string().optional(),
  metric_type: z.string(),
  metric_value: z.number(),
  metric_unit: z.string().optional(),
  timestamp: z.string().optional(),
  period: z.string().optional(), // daily, weekly, monthly
});

export const AnalyticsInsightSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  company_id: z.string().optional(),
  insight_type: z.string(),
  insight_data: z.record(z.any()),
  confidence_score: z.number().min(0).max(1).optional(),
  created_at: z.string().optional(),
  expires_at: z.string().optional(),
});

export const AnalyticsDashboardSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  company_id: z.string().optional(),
  dashboard_name: z.string(),
  dashboard_config: z.record(z.any()),
  is_default: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Google Analytics Schemas
export const GoogleAnalyticsConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
});

export const GoogleAnalyticsPropertySchema = z.object({
  id: z.string(),
  name: z.string(),
  accountId: z.string(),
});

export const GoogleAnalyticsReportSchema = z.object({
  rows: z.array(z.record(z.string())),
  columnHeaders: z.array(z.object({
    name: z.string(),
    dataType: z.string(),
  })),
  totalsForAllResults: z.record(z.string()),
});

export const GoogleWorkspaceConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
});

export const GoogleWorkspaceUsageSchema = z.object({
  gmail: z.object({
    messagesSent: z.number(),
    storageUsed: z.number(),
    lastSync: z.string(),
  }),
  drive: z.object({
    filesCreated: z.number(),
    storageUsed: z.number(),
    lastSync: z.string(),
  }),
  calendar: z.object({
    eventsCreated: z.number(),
    eventsAttended: z.number(),
    lastSync: z.string(),
  }),
});

// ============================================================================
// TYPES
// ============================================================================

export type IntegrationAnalytics = z.infer<typeof IntegrationAnalyticsSchema>;
export type DataSource = z.infer<typeof DataSourceSchema>;
export type DataUsageByCategory = z.infer<typeof DataUsageByCategorySchema>;
export type RecentSyncActivity = z.infer<typeof RecentSyncActivitySchema>;

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type AnalyticsMetrics = z.infer<typeof AnalyticsMetricsSchema>;
export type AnalyticsInsight = z.infer<typeof AnalyticsInsightSchema>;
export type AnalyticsDashboard = z.infer<typeof AnalyticsDashboardSchema>;

export type GoogleAnalyticsConfig = z.infer<typeof GoogleAnalyticsConfigSchema>;
export type GoogleAnalyticsProperty = z.infer<typeof GoogleAnalyticsPropertySchema>;
export type GoogleAnalyticsReport = z.infer<typeof GoogleAnalyticsReportSchema>;
export type GoogleWorkspaceConfig = z.infer<typeof GoogleWorkspaceConfigSchema>;
export type GoogleWorkspaceUsage = z.infer<typeof GoogleWorkspaceUsageSchema>;

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const analyticsServiceConfig = {
  tableName: 'analytics_events',
  schema: AnalyticsEventSchema,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
  enableLogging: true,
};

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

/**
 * Consolidated Analytics Service
 * 
 * Provides unified analytics with:
 * - Integration analytics
 * - General analytics events and metrics
 * - Google Analytics integration
 * - Dashboard management
 */
export class AnalyticsService extends BaseService implements CrudServiceInterface<AnalyticsEvent> {
  protected config = analyticsServiceConfig;

  // ============================================================================
  // CRUD OPERATIONS (CrudServiceInterface)
  // ============================================================================

  /**
   * Get analytics event by ID
   */
  async get(id: string): Promise<ServiceResponse<AnalyticsEvent>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('get', { id });
      
      const result = await selectOne(this.config.tableName, ['*'], { id });
      if (!result.success) throw new Error(result.error);
      
      const validatedData = this.config.schema.parse(result.data);
      return { data: validatedData, error: null };
    }, `get analytics event ${id}`);
  }

  /**
   * Create new analytics event
   */
  async create(data: Partial<AnalyticsEvent>): Promise<ServiceResponse<AnalyticsEvent>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('create', { data });
      
      const result = await insertOne(this.config.tableName, {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      });
      
      if (!result.success) throw new Error(result.error);
      
      const validatedData = this.config.schema.parse(result.data);
      return { data: validatedData, error: null };
    }, `create analytics event`);
  }

  /**
   * Update analytics event
   */
  async update(id: string, data: Partial<AnalyticsEvent>): Promise<ServiceResponse<AnalyticsEvent>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('update', { id, data });
      
      const result = await updateOne(this.config.tableName, id, data);
      if (!result.success) throw new Error(result.error);
      
      const validatedData = this.config.schema.parse(result.data);
      return { data: validatedData, error: null };
    }, `update analytics event ${id}`);
  }

  /**
   * Delete analytics event
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('delete', { id });
      
      const result = await deleteOne(this.config.tableName, id);
      if (!result.success) throw new Error(result.error);
      
      return { data: true, error: null };
    }, `delete analytics event ${id}`);
  }

  /**
   * List analytics events with filters
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<AnalyticsEvent[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('list', { filters });
      
      const result = await select(this.config.tableName, ['*'], filters);
      if (!result.success) throw new Error(result.error);
      
      const validatedData = result.data.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `list analytics events`);
  }

  // ============================================================================
  // INTEGRATION ANALYTICS
  // ============================================================================

  /**
   * Get user integration analytics
   */
  async getUserIntegrationAnalytics(userId: string): Promise<ServiceResponse<IntegrationAnalytics>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getUserIntegrationAnalytics', { userId });

      const result = await callRPC('get_user_integration_analytics', { user_uuid: userId });

      if (!result.success) throw new Error(result.error);
      
      if (result.data && result.data.length > 0) {
        const analytics = IntegrationAnalyticsSchema.parse(result.data[0]);
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
      const result = await select('user_integrations', [
        'id',
        'integration_name',
        'status',
        'last_sync_at',
        'error_message'
      ], { user_id: userId });

      if (!result.success) throw new Error(result.error);

      // Transform to DataSource format
      const dataSources = result.data.map(item => ({
        id: item.id,
        name: item.integration_name,
        integrationname: item.integration_name,
        status: item.status,
        lastsyncat: item.last_sync_at,
        totalsyncs: 0, // Would need to be calculated from sync history
        datarecordcount: 0, // Would need to be calculated from data tables
        authtype: 'oauth', // Default, would need to be fetched from integrations table
        error_message: item.error_message
      }));

      const validatedData = dataSources.map(item => DataSourceSchema.parse(item));
      return this.createSuccessResponse(validatedData);
    }, `get data sources for user ${userId}`);
  }

  /**
   * Get data usage by category
   */
  async getDataUsageByCategory(userId: string): Promise<ServiceResponse<DataUsageByCategory[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getDataUsageByCategory', { userId });

      const result = await callRPC('get_data_usage_by_category', { user_uuid: userId });

      if (!result.success) throw new Error(result.error);

      const validatedData = result.data.map((item: any) => DataUsageByCategorySchema.parse(item));
      return this.createSuccessResponse(validatedData);
    }, `get data usage by category for user ${userId}`);
  }

  /**
   * Get recent sync activity
   */
  async getRecentSyncActivity(userId: string, limit: number = 10): Promise<ServiceResponse<RecentSyncActivity[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getRecentSyncActivity', { userId, limit });

      const result = await select('sync_activity', ['*'], { 
        user_id: userId,
        order_by: 'started_at.desc',
        limit
      });

      if (!result.success) throw new Error(result.error);

      const validatedData = result.data.map(item => RecentSyncActivitySchema.parse(item));
      return this.createSuccessResponse(validatedData);
    }, `get recent sync activity for user ${userId}`);
  }

  // ============================================================================
  // GENERAL ANALYTICS
  // ============================================================================

  /**
   * Track analytics event
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<ServiceResponse<AnalyticsEvent>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('trackEvent', { event });

      const result = await insertOne('analytics_events', {
        ...event,
        timestamp: new Date().toISOString()
      });

      if (!result.success) throw new Error(result.error);

      const validatedData = AnalyticsEventSchema.parse(result.data);
      return this.createSuccessResponse(validatedData);
    }, `track analytics event`);
  }

  /**
   * Get analytics events for user
   */
  async getUserEvents(userId: string, filters?: Record<string, any>): Promise<ServiceResponse<AnalyticsEvent[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getUserEvents', { userId, filters });

      const result = await select('analytics_events', ['*'], {
        user_id: userId,
        ...filters,
        order_by: 'timestamp.desc'
      });

      if (!result.success) throw new Error(result.error);

      const validatedData = result.data.map(item => AnalyticsEventSchema.parse(item));
      return this.createSuccessResponse(validatedData);
    }, `get analytics events for user ${userId}`);
  }

  /**
   * Get analytics metrics
   */
  async getAnalyticsMetrics(userId: string, metricType?: string): Promise<ServiceResponse<AnalyticsMetrics[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getAnalyticsMetrics', { userId, metricType });

      const filters: Record<string, any> = { user_id: userId };
      if (metricType) filters.metric_type = metricType;

      const result = await select('analytics_metrics', ['*'], {
        ...filters,
        order_by: 'timestamp.desc'
      });

      if (!result.success) throw new Error(result.error);

      const validatedData = result.data.map(item => AnalyticsMetricsSchema.parse(item));
      return this.createSuccessResponse(validatedData);
    }, `get analytics metrics for user ${userId}`);
  }

  /**
   * Get analytics insights
   */
  async getAnalyticsInsights(userId: string, insightType?: string): Promise<ServiceResponse<AnalyticsInsight[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getAnalyticsInsights', { userId, insightType });

      const filters: Record<string, any> = { user_id: userId };
      if (insightType) filters.insight_type = insightType;

      const result = await select('analytics_insights', ['*'], {
        ...filters,
        order_by: 'created_at.desc'
      });

      if (!result.success) throw new Error(result.error);

      const validatedData = result.data.map(item => AnalyticsInsightSchema.parse(item));
      return this.createSuccessResponse(validatedData);
    }, `get analytics insights for user ${userId}`);
  }

  // ============================================================================
  // DASHBOARD MANAGEMENT
  // ============================================================================

  /**
   * Get user dashboards
   */
  async getUserDashboards(userId: string): Promise<ServiceResponse<AnalyticsDashboard[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getUserDashboards', { userId });

      const result = await select('analytics_dashboards', ['*'], {
        user_id: userId,
        order_by: 'created_at.desc'
      });

      if (!result.success) throw new Error(result.error);

      const validatedData = result.data.map(item => AnalyticsDashboardSchema.parse(item));
      return this.createSuccessResponse(validatedData);
    }, `get dashboards for user ${userId}`);
  }

  /**
   * Create dashboard
   */
  async createDashboard(dashboard: Omit<AnalyticsDashboard, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<AnalyticsDashboard>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('createDashboard', { dashboard });

      const result = await insertOne('analytics_dashboards', {
        ...dashboard,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (!result.success) throw new Error(result.error);

      const validatedData = AnalyticsDashboardSchema.parse(result.data);
      return this.createSuccessResponse(validatedData);
    }, `create dashboard`);
  }

  /**
   * Update dashboard
   */
  async updateDashboard(id: string, data: Partial<AnalyticsDashboard>): Promise<ServiceResponse<AnalyticsDashboard>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('updateDashboard', { id, data });

      const result = await updateOne('analytics_dashboards', id, {
        ...data,
        updated_at: new Date().toISOString()
      });

      if (!result.success) throw new Error(result.error);

      const validatedData = AnalyticsDashboardSchema.parse(result.data);
      return this.createSuccessResponse(validatedData);
    }, `update dashboard ${id}`);
  }

  // ============================================================================
  // GOOGLE ANALYTICS INTEGRATION
  // ============================================================================

  /**
   * Get Google Analytics data
   */
  async getGoogleAnalyticsData(config: GoogleAnalyticsConfig, propertyId: string, dateRange: { start: string; end: string }): Promise<ServiceResponse<GoogleAnalyticsReport>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getGoogleAnalyticsData', { propertyId, dateRange });

      const result = await callEdgeFunction('google-analytics-report', {
        config,
        propertyId,
        dateRange,
        metrics: ['sessions', 'users', 'pageviews'],
        dimensions: ['date']
      });

      if (!result.success) throw new Error(result.error);

      const validatedData = GoogleAnalyticsReportSchema.parse(result.data);
      return this.createSuccessResponse(validatedData);
    }, `get Google Analytics data for property ${propertyId}`);
  }

  /**
   * Get Google Workspace usage
   */
  async getGoogleWorkspaceUsage(config: GoogleWorkspaceConfig): Promise<ServiceResponse<GoogleWorkspaceUsage>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getGoogleWorkspaceUsage', { config });

      const result = await callEdgeFunction('google-workspace-usage', { config });

      if (!result.success) throw new Error(result.error);

      const validatedData = GoogleWorkspaceUsageSchema.parse(result.data);
      return this.createSuccessResponse(validatedData);
    }, `get Google Workspace usage`);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get analytics summary for user
   */
  async getAnalyticsSummary(userId: string): Promise<ServiceResponse<{
    totalEvents: number;
    totalMetrics: number;
    totalInsights: number;
    lastEventAt: string | null;
    topEventTypes: Array<{ type: string; count: number }>;
  }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getAnalyticsSummary', { userId });

      // Get total events
      const eventsResult = await select('analytics_events', ['id', 'event_type', 'timestamp'], {
        user_id: userId
      });

      if (!eventsResult.success) throw new Error(eventsResult.error);

      const totalEvents = eventsResult.data.length;
      const lastEventAt = eventsResult.data.length > 0 
        ? eventsResult.data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
        : null;

      // Get top event types
      const eventTypeCounts = eventsResult.data.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topEventTypes = Object.entries(eventTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get total metrics
      const metricsResult = await select('analytics_metrics', ['id'], { user_id: userId });
      const totalMetrics = metricsResult.success ? metricsResult.data.length : 0;

      // Get total insights
      const insightsResult = await select('analytics_insights', ['id'], { user_id: userId });
      const totalInsights = insightsResult.success ? insightsResult.data.length : 0;

      const summary = {
        totalEvents,
        totalMetrics,
        totalInsights,
        lastEventAt,
        topEventTypes
      };

      return this.createSuccessResponse(summary);
    }, `get analytics summary for user ${userId}`);
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const analyticsService = new AnalyticsService();
