/**
 * Integration Data Service
 * Provides comprehensive analytics for integration data points
 * Enhanced with proper authentication handling and error recovery
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';
import { sessionUtils } from '@/lib/supabase';

export interface DataPointAnalytics {
  totalDataPoints: number;
  dataPointsByType: Record<string, number>;
  dataPointsByTimePeriod: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  topDataPoints: any[];
  dataPointTrends: any[];
}

export interface IntegrationDataSummary {
  integrationId: string;
  integrationName: string;
  status: string;
  dataPoints: DataPointAnalytics;
  lastSync: string | null;
  syncFrequency: string;
  errorCount: number;
}

export class IntegrationDataService {
  /**
   * Validate authentication and session before making database calls
   */
  private async validateAuth(): Promise<{ userId: string; error?: string }> {
    try {
      // Get session with retries
      const { session, error } = await sessionUtils.getSession();
      
      if (error || !session) {
        logger.error('Authentication validation failed', { error });
        return { userId: '', error: 'No valid session found' };
      }

      if (!session.user?.id) {
        logger.error('Session exists but no user ID found');
        return { userId: '', error: 'Invalid session - no user ID' };
      }

      // Validate session is not expired
      if (session.expires_at && new Date(session.expires_at) < new Date()) {
        logger.error('Session has expired');
        return { userId: '', error: 'Session expired' };
      }

      return { userId: session.user.id };
    } catch (error) {
      logger.error('Unexpected error during auth validation', { error });
      return { userId: '', error: 'Authentication validation failed' };
    }
  }

  /**
   * Safe database query wrapper with authentication and error handling
   */
  private async safeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    context: string
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      // Validate authentication first
      const { error: authError } = await this.validateAuth();
      if (authError) {
        logger.error(`Authentication failed for ${context}`, { error: authError });
        return { data: null, error: authError };
      }

      // Execute the query
      const result = await queryFn();
      
      if (result.error) {
        // Handle specific error types
        if (result.error.code === 'PGRST116') {
          // No rows found - this is not an error
          logger.info(`No data found for ${context}`);
          return { data: [] as T, error: null };
        }
        
        if (result.error.code === '42501') {
          // Permission denied - likely RLS policy issue
          logger.error(`Permission denied for ${context}`, { error: result.error });
          return { data: null, error: 'Permission denied - check authentication' };
        }
        
        if (result.error.code === '23505') {
          // Unique constraint violation
          logger.error(`Duplicate data for ${context}`, { error: result.error });
          return { data: null, error: 'Duplicate data found' };
        }
        
        // Generic error handling
        logger.error(`Database query failed for ${context}`, { error: result.error });
        return { data: null, error: result.error.message || 'Database operation failed' };
      }

      return { data: result.data, error: null };
    } catch (error) {
      logger.error(`Unexpected error in ${context}`, { error });
      return { data: null, error: 'Unexpected database error' };
    }
  }

  /**
   * Get comprehensive data point analytics for a user
   */
  async getUserDataPointAnalytics(userId?: string): Promise<DataPointAnalytics> {
    try {
      // If no userId provided, get it from session
      if (!userId) {
        const { userId: sessionUserId, error } = await this.validateAuth();
        if (error) {
          throw new Error(error);
        }
        userId = sessionUserId;
      }

      const { data: integrationData, error } = await this.safeQuery(
        async () => {
          return supabase
            .from('integration_data')
            .select(`
              id,
              data_type,
              created_at,
              user_integration_id,
              user_integrations!inner(
                user_id
              )
            `)
            .eq('user_integrations.user_id', userId!)
            .order('created_at', { ascending: false });
        },
        'getUserDataPointAnalytics'
      );

      if (error) {
        throw new Error(error);
      }

      if (!integrationData || (Array.isArray(integrationData) && integrationData.length === 0)) {
        return this.getEmptyAnalytics();
      }

      return this.calculateAnalytics(integrationData || []);
    } catch (error) {
      logger.error('Error getting user data point analytics', { error, userId });
      throw error;
    }
  }

  /**
   * Get data point analytics for a specific integration
   */
  async getIntegrationDataPointAnalytics(userIntegrationId: string): Promise<DataPointAnalytics> {
    try {
      const { data: integrationData, error } = await this.safeQuery(
        async () => {
          return supabase
            .from('integration_data')
            .select('*')
            .eq('user_integration_id', userIntegrationId)
            .order('created_at', { ascending: false });
        },
        'getIntegrationDataPointAnalytics'
      );

      if (error) {
        throw new Error(error);
      }

      if (!integrationData || (Array.isArray(integrationData) && integrationData.length === 0)) {
        return this.getEmptyAnalytics();
      }

      return this.calculateAnalytics(integrationData || []);
    } catch (error) {
      logger.error('Error getting integration data point analytics', { error, userIntegrationId });
      throw error;
    }
  }

  /**
   * Get data point summary for all user integrations
   */
  async getUserIntegrationDataSummaries(userId?: string): Promise<IntegrationDataSummary[]> {
    try {
      // If no userId provided, get it from session
      if (!userId) {
        const { userId: sessionUserId, error } = await this.validateAuth();
        if (error) {
          throw new Error(error);
        }
        userId = sessionUserId;
      }

      const { data: userIntegrations, error } = await this.safeQuery(
        async () => {
          return supabase
            .from('user_integrations')
            .select(`
              id,
              integration_name,
              status,
              last_sync_at,
              error_message,
              user_id
            `)
            .eq('user_id', userId!);
        },
        'getUserIntegrationDataSummaries'
      );

      if (error) {
        throw new Error(error);
      }

      if (!userIntegrations || (Array.isArray(userIntegrations) && userIntegrations.length === 0)) {
        return [];
      }

      // Get data point counts for each integration
      const summaries: IntegrationDataSummary[] = [];

      for (const integration of (userIntegrations || [])) {
        const { data: dataPoints } = await this.safeQuery(
          async () => {
            return supabase
              .from('integration_data')
              .select('id')
              .eq('user_integration_id', integration.id);
          },
          `getDataPointsForIntegration_${integration.id}`
        );

        const dataPointCount = dataPoints?.length || 0;

        summaries.push({
          integrationId: integration.id,
          integrationName: integration.integration_name || 'Unknown Integration',
          status: integration.status || 'unknown',
          dataPoints: {
            totalDataPoints: dataPointCount,
            dataPointsByType: {},
            dataPointsByTimePeriod: { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0 },
            topDataPoints: [],
            dataPointTrends: []
          },
          lastSync: integration.last_sync_at ? new Date(integration.last_sync_at).toISOString() : null,
          syncFrequency: 'daily',
          errorCount: 0
        });
      }

      return summaries;
    } catch (error) {
      logger.error('Error getting user integration data summaries', { error, userId });
      throw error;
    }
  }

  /**
   * Get data points by type for a specific integration
   */
  async getDataPointsByType(userIntegrationId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await this.safeQuery(
        async () => {
          return supabase
            .from('integration_data')
            .select('data_type')
            .eq('user_integration_id', userIntegrationId);
        },
        'getDataPointsByType'
      );

      if (error) {
        throw new Error(error);
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return {};
      }

      // Count by data type
      const typeCounts: Record<string, number> = {};
      (data || []).forEach((item: any) => {
        const dataType = item.data_type || 'unknown';
        typeCounts[dataType] = (typeCounts[dataType] || 0) + 1;
      });

      return typeCounts;
    } catch (error) {
      logger.error('Error getting data points by type', { error, userIntegrationId });
      throw error;
    }
  }

  /**
   * Get data points by time period
   */
  async getDataPointsByTimePeriod(userIntegrationId: string): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  }> {
    try {
      const { data, error } = await this.safeQuery(
        async () => {
          return supabase
            .from('integration_data')
            .select('created_at')
            .eq('user_integration_id', userIntegrationId);
        },
        'getDataPointsByTimePeriod'
      );

      if (error) {
        throw new Error(error);
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          lastMonth: 0
        };
      }

      return this.calculateTimePeriodCounts(data || []);
    } catch (error) {
      logger.error('Error getting data points by time period', { error, userIntegrationId });
      throw error;
    }
  }

  /**
   * Calculate comprehensive analytics from raw data
   */
  private calculateAnalytics(data: any[]): DataPointAnalytics {
    const total = data.length;
    const timePeriodCounts = this.calculateTimePeriodCounts(data);
    
    // Count by type
    const byType: Record<string, number> = {};
    data.forEach(item => {
      const type = item.data_type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    });

    // Get top data types
    const topDataTypes = Object.entries(byType)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalDataPoints: total,
      dataPointsByType: byType,
      dataPointsByTimePeriod: timePeriodCounts,
      topDataPoints: topDataTypes,
      dataPointTrends: this.calculateTrends(data)
    };
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
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let todayCount = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;
    let lastMonthCount = 0;

    data.forEach(item => {
      const createdAt = item.created_at ? new Date(item.created_at) : null;
      
      if (createdAt && createdAt >= today) todayCount++;
      if (createdAt && createdAt >= thisWeek) thisWeekCount++;
      if (createdAt && createdAt >= thisMonth) thisMonthCount++;
      if (createdAt && createdAt >= lastMonth && createdAt < thisMonth) lastMonthCount++;
    });

    return {
      today: todayCount,
      thisWeek: thisWeekCount,
      thisMonth: thisMonthCount,
      lastMonth: lastMonthCount
    };
  }

  /**
   * Calculate trends from data
   */
  private calculateTrends(data: any[]): any[] {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentData = data.filter(item => {
      const createdAt = item.created_at ? new Date(item.created_at) : null;
      return createdAt && createdAt >= lastWeek;
    });

    const olderData = data.filter(item => {
      const createdAt = item.created_at ? new Date(item.created_at) : null;
      return createdAt && createdAt >= lastMonth && createdAt < lastWeek;
    });

    return [
      {
        period: 'last_week',
        count: recentData.length,
        growth: this.calculateGrowthRate(recentData.length, olderData.length)
      },
      {
        period: 'last_month',
        count: olderData.length,
        growth: 0 // No comparison data
      }
    ];
  }

  /**
   * Calculate growth rate percentage
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
        lastMonth: 0
      },
      topDataPoints: [],
      dataPointTrends: []
    };
  }

  /**
   * Get top data points
   */
  private getTopDataPoints(data: any[]): any[] {
    // Group by data type and count
    const typeCounts: Record<string, number> = {};
    data.forEach(item => {
      const dataType = item.data_type || 'unknown';
      typeCounts[dataType] = (typeCounts[dataType] || 0) + 1;
    });

    // Convert to array and sort by count
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }

  /**
   * Get data point trends
   */
  private getDataPointTrends(data: any[]): any[] {
    // Simple trend calculation based on recent data
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentData = data.filter(item => {
      const createdAt = item.created_at ? new Date(item.created_at) : null;
      return createdAt && createdAt >= lastWeek;
    });

    const olderData = data.filter(item => {
      const createdAt = item.created_at ? new Date(item.created_at) : null;
      return createdAt && createdAt >= lastMonth && createdAt < lastWeek;
    });

    return [
      {
        period: 'last_week',
        count: recentData.length,
        growth: this.calculateGrowthRate(recentData.length, olderData.length)
      },
      {
        period: 'last_month',
        count: olderData.length,
        growth: 0 // No comparison data
      }
    ];
  }
}

export const integrationDataService = new IntegrationDataService(); 