/**
 * Integration Data Service
 * Provides comprehensive analytics for integration data points
 * Enhanced with proper authentication handling and error recovery
 * 
 * MIGRATED: Now extends BaseService for consistent error handling and logging
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { authentikAuthService } from '@/core/auth/AuthentikAuthService';
import { z } from 'zod';

// Data Point Analytics Schema
export const DataPointAnalyticsSchema = z.object({
  totalDataPoints: z.number(),
  dataPointsByType: z.record(z.string(), z.number()),
  dataPointsByTimePeriod: z.object({
    today: z.number(),
    thisWeek: z.number(),
    thisMonth: z.number(),
    lastMonth: z.number(),
  }),
  topDataPoints: z.array(z.any()),
  dataPointTrends: z.array(z.any()),
});

export type DataPointAnalytics = z.infer<typeof DataPointAnalyticsSchema>;

// Integration Data Summary Schema
export const IntegrationDataSummarySchema = z.object({
  integrationId: z.string(),
  integrationName: z.string(),
  status: z.string(),
  dataPoints: DataPointAnalyticsSchema,
  lastSync: z.string().nullable(),
  syncFrequency: z.string(),
  errorCount: z.number(),
});

export type IntegrationDataSummary = z.infer<typeof IntegrationDataSummarySchema>;

/**
 * Integration Data Service
 * 
 * MIGRATED: Now extends BaseService for consistent error handling and logging
 * Provides comprehensive analytics for integration data points
 */
export class IntegrationDataService extends BaseService {
  /**
   * Validate authentication and session before making database calls
   */
  private async validateAuth(): Promise<{ userId: string; error?: string }> {
    return this.executeDbOperation(async () => {
      try {
        // Get session with retries
        const { session, error } = await sessionUtils.getSession();
        
        if (error || !session) {
          this.logger.error('Authentication validation failed', { error });
          return { userId: '', error: 'No valid session found' };
        }

        if (!session.user?.id) {
          this.logger.error('Session exists but no user ID found');
          return { userId: '', error: 'Invalid session - no user ID' };
        }

        // Validate session is not expired
        if (session.expires_at && new Date(session.expires_at) < new Date()) {
          this.logger.error('Session has expired');
          return { userId: '', error: 'Session expired' };
        }

        return { userId: session.user.id };
      } catch (error) {
        this.logger.error('Unexpected error during auth validation', { error });
        return { userId: '', error: 'Authentication validation failed' };
      }
    }, 'validate authentication');
  }

  /**
   * Get user data point analytics
   */
  async getUserDataPointAnalytics(userId?: string): Promise<ServiceResponse<DataPointAnalytics>> {
    return this.executeDbOperation(async () => {
      try {
        // Validate authentication first
        const { userId: authUserId, error: authError } = await this.validateAuth();
        if (authError) {
          this.logger.error('Authentication failed for getUserDataPointAnalytics', { error: authError });
          return { data: null, error: authError };
        }

        const targetUserId = userId || authUserId;

        // Get user integrations
        const { data: userIntegrations, error: integrationsError } = await this.supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', targetUserId);

        if (integrationsError) {
          this.logger.error('Failed to get user integrations:', integrationsError);
          return { data: null, error: 'Failed to get user integrations' };
        }

        if (!userIntegrations?.length) {
          return { data: this.getEmptyAnalytics(), error: null };
        }

        // Get data points for all integrations
        const allDataPoints: any[] = [];
        for (const integration of userIntegrations) {
          const { data: dataPoints, error: dataPointsError } = await this.supabase
            .from('data_point_definitions')
            .select('*')
            .eq('user_integration_id', integration.id);

          if (dataPointsError) {
            this.logger.warn(`Failed to get data points for integration ${integration.id}:`, dataPointsError);
            continue;
          }

          if (dataPoints) {
            allDataPoints.push(...dataPoints);
          }
        }

        const analytics = this.calculateAnalytics(allDataPoints);
        return { data: DataPointAnalyticsSchema.parse(analytics), error: null };
      } catch (error) {
        this.logger.error('Error getting user data point analytics:', error);
        return { data: null, error: 'Failed to get user data point analytics' };
      }
    }, `get user data point analytics for user ${userId}`);
  }

  /**
   * Get integration data point analytics
   */
  async getIntegrationDataPointAnalytics(userIntegrationId: string): Promise<ServiceResponse<DataPointAnalytics>> {
    return this.executeDbOperation(async () => {
      try {
        // Validate authentication first
        const { error: authError } = await this.validateAuth();
        if (authError) {
          this.logger.error('Authentication failed for getIntegrationDataPointAnalytics', { error: authError });
          return { data: null, error: authError };
        }

        // Get data points for this integration
        const { data: dataPoints, error: dataPointsError } = await this.supabase
          .from('data_point_definitions')
          .select('*')
          .eq('user_integration_id', userIntegrationId);

        if (dataPointsError) {
          this.logger.error('Failed to get data points:', dataPointsError);
          return { data: null, error: 'Failed to get data points' };
        }

        if (!dataPoints?.length) {
          return { data: this.getEmptyAnalytics(), error: null };
        }

        const analytics = this.calculateAnalytics(dataPoints);
        return { data: DataPointAnalyticsSchema.parse(analytics), error: null };
      } catch (error) {
        this.logger.error('Error getting integration data point analytics:', error);
        return { data: null, error: 'Failed to get integration data point analytics' };
      }
    }, `get integration data point analytics for integration ${userIntegrationId}`);
  }

  /**
   * Get user integration data summaries
   */
  async getUserIntegrationDataSummaries(userId?: string): Promise<ServiceResponse<IntegrationDataSummary[]>> {
    return this.executeDbOperation(async () => {
      try {
        // Validate authentication first
        const { userId: authUserId, error: authError } = await this.validateAuth();
        if (authError) {
          this.logger.error('Authentication failed for getUserIntegrationDataSummaries', { error: authError });
          return { data: null, error: authError };
        }

        const targetUserId = userId || authUserId;

        // Get user integrations
        const { data: userIntegrations, error: integrationsError } = await this.supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', targetUserId);

        if (integrationsError) {
          this.logger.error('Failed to get user integrations:', integrationsError);
          return { data: null, error: 'Failed to get user integrations' };
        }

        if (!userIntegrations?.length) {
          return { data: [], error: null };
        }

        const summaries: IntegrationDataSummary[] = [];

        for (const integration of userIntegrations) {
          try {
            // Get data points for this integration
            const { data: dataPoints, error: dataPointsError } = await this.supabase
              .from('data_point_definitions')
              .select('*')
              .eq('user_integration_id', integration.id);

            if (dataPointsError) {
              this.logger.warn(`Failed to get data points for integration ${integration.id}:`, dataPointsError);
              continue;
            }

            // Get data point analytics
            const analytics = this.calculateAnalytics(dataPoints || []);

            // Get error count
            const { data: errorCount, error: errorCountError } = await this.supabase
              .from('integration_data_records')
              .select('id', { count: 'exact' })
              .eq('userintegration_id', integration.id)
              .eq('sync_status', 'error');

            const summary: IntegrationDataSummary = {
              integrationId: integration.id,
              integrationName: integration.integration_slug,
              status: integration.status,
              dataPoints: analytics,
              lastSync: integration.last_sync,
              syncFrequency: integration.sync_frequency || 'daily',
              errorCount: errorCountError ? 0 : (errorCount?.length || 0),
            };

            summaries.push(IntegrationDataSummarySchema.parse(summary));
          } catch (error) {
            this.logger.warn(`Failed to process integration ${integration.id}:`, error);
          }
        }

        return { data: summaries, error: null };
      } catch (error) {
        this.logger.error('Error getting user integration data summaries:', error);
        return { data: null, error: 'Failed to get user integration data summaries' };
      }
    }, `get user integration data summaries for user ${userId}`);
  }

  /**
   * Get data points by type for an integration
   */
  async getDataPointsByType(userIntegrationId: string): Promise<ServiceResponse<Record<string, number>>> {
    return this.executeDbOperation(async () => {
      try {
        // Validate authentication first
        const { error: authError } = await this.validateAuth();
        if (authError) {
          this.logger.error('Authentication failed for getDataPointsByType', { error: authError });
          return { data: null, error: authError };
        }

        // Get data points for this integration
        const { data: dataPoints, error: dataPointsError } = await this.supabase
          .from('data_point_definitions')
          .select('*')
          .eq('user_integration_id', userIntegrationId);

        if (dataPointsError) {
          this.logger.error('Failed to get data points:', dataPointsError);
          return { data: null, error: 'Failed to get data points' };
        }

        if (!dataPoints?.length) {
          return { data: {}, error: null };
        }

        // Group by type
        const byType: Record<string, number> = {};
        dataPoints.forEach(dataPoint => {
          const type = dataPoint.data_point_type || 'unknown';
          byType[type] = (byType[type] || 0) + 1;
        });

        return { data: byType, error: null };
      } catch (error) {
        this.logger.error('Error getting data points by type:', error);
        return { data: null, error: 'Failed to get data points by type' };
      }
    }, `get data points by type for integration ${userIntegrationId}`);
  }

  /**
   * Get data points by time period for an integration
   */
  async getDataPointsByTimePeriod(userIntegrationId: string): Promise<ServiceResponse<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  }>> {
    return this.executeDbOperation(async () => {
      try {
        // Validate authentication first
        const { error: authError } = await this.validateAuth();
        if (authError) {
          this.logger.error('Authentication failed for getDataPointsByTimePeriod', { error: authError });
          return { data: null, error: authError };
        }

        // Get data records for this integration
        const { data: dataRecords, error: dataRecordsError } = await this.supabase
          .from('integration_data_records')
          .select('created_at')
          .eq('userintegration_id', userIntegrationId);

        if (dataRecordsError) {
          this.logger.error('Failed to get data records:', dataRecordsError);
          return { data: null, error: 'Failed to get data records' };
        }

        if (!dataRecords?.length) {
          return { data: { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0 }, error: null };
        }

        const timePeriodCounts = this.calculateTimePeriodCounts(dataRecords);
        return { data: timePeriodCounts, error: null };
      } catch (error) {
        this.logger.error('Error getting data points by time period:', error);
        return { data: null, error: 'Failed to get data points by time period' };
      }
    }, `get data points by time period for integration ${userIntegrationId}`);
  }

  /**
   * Calculate analytics from data points
   */
  private calculateAnalytics(data: any[]): DataPointAnalytics {
    const analytics: DataPointAnalytics = {
      totalDataPoints: data.length,
      dataPointsByType: {},
      dataPointsByTimePeriod: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        lastMonth: 0,
      },
      topDataPoints: this.getTopDataPoints(data),
      dataPointTrends: this.getDataPointTrends(data),
    };

    // Calculate by type
    data.forEach(dataPoint => {
      const type = dataPoint.data_point_type || 'unknown';
      analytics.dataPointsByType[type] = (analytics.dataPointsByType[type] || 0) + 1;
    });

    // Calculate time periods
    analytics.dataPointsByTimePeriod = this.calculateTimePeriodCounts(data);

    return analytics;
  }

  /**
   * Calculate time period counts
   */
  private calculateTimePeriodCounts(data: any[]): {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let todayCount = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;
    let lastMonthCount = 0;

    data.forEach(item => {
      const createdAt = new Date(item.created_at);
      
      if (createdAt >= today) {
        todayCount++;
      }
      if (createdAt >= thisWeek) {
        thisWeekCount++;
      }
      if (createdAt >= thisMonth) {
        thisMonthCount++;
      }
      if (createdAt >= lastMonth && createdAt < thisMonth) {
        lastMonthCount++;
      }
    });

    return {
      today: todayCount,
      thisWeek: thisWeekCount,
      thisMonth: thisMonthCount,
      lastMonth: lastMonthCount,
    };
  }

  /**
   * Calculate trends from data
   */
  private calculateTrends(data: any[]): any[] {
    // Group by date and calculate daily trends
    const dailyData: Record<string, number> = {};
    
    data.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    const trends = Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days

    return trends;
  }

  /**
   * Calculate growth rate
   */
  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Get empty analytics object
   */
  private getEmptyAnalytics(): DataPointAnalytics {
    return {
      totalDataPoints: 0,
      dataPointsByType: {},
      dataPointsByTimePeriod: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        lastMonth: 0,
      },
      topDataPoints: [],
      dataPointTrends: [],
    };
  }

  /**
   * Get top data points
   */
  private getTopDataPoints(data: any[]): any[] {
    return data
      .sort((a, b) => {
        const aValue = a.business_value === 'high' ? 3 : a.business_value === 'medium' ? 2 : 1;
        const bValue = b.business_value === 'high' ? 3 : b.business_value === 'medium' ? 2 : 1;
        return bValue - aValue;
      })
      .slice(0, 10);
  }

  /**
   * Get data point trends
   */
  private getDataPointTrends(data: any[]): any[] {
    return this.calculateTrends(data);
  }
} 
