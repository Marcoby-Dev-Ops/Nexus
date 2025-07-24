/**
 * Integration Data Service
 * Provides comprehensive analytics for integration data points
 */

import { databaseService } from './DatabaseService';
import { logger } from '@/shared/utils/logger';

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
   * Get comprehensive data point analytics for a user
   */
  async getUserDataPointAnalytics(userId: string): Promise<DataPointAnalytics> {
    try {
      // Get all integration data for the user
      const { data: integrationData, error } = await databaseService.select(
        'integration_data',
        `
          id,
          data_type,
          created_at,
          user_integration_id,
          user_integrations!inner(
            user_id
          )
        `,
        { 'user_integrations.user_id': userId },
        { retries: 2 }
      );

      if (error) throw error;

      if (!integrationData || integrationData.length === 0) {
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

      // Process data points
      const dataPointsByType: Record<string, number> = {};
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      let todayCount = 0;
      let thisWeekCount = 0;
      let thisMonthCount = 0;
      let lastMonthCount = 0;

      integrationData.forEach(item => {
        const createdAt = item.created_at ? new Date(item.created_at) : null;
        
        if (createdAt && createdAt >= today) todayCount++;
        if (createdAt && createdAt >= thisWeek) thisWeekCount++;
        if (createdAt && createdAt >= thisMonth) thisMonthCount++;
        if (createdAt && createdAt >= lastMonth && createdAt < thisMonth) lastMonthCount++;

        const dataType = item.data_type || 'unknown';
        dataPointsByType[dataType] = (dataPointsByType[dataType] || 0) + 1;
      });

      return {
        totalDataPoints: integrationData.length,
        dataPointsByType,
        dataPointsByTimePeriod: {
          today: todayCount,
          thisWeek: thisWeekCount,
          thisMonth: thisMonthCount,
          lastMonth: lastMonthCount
        },
        topDataPoints: this.getTopDataPoints(integrationData),
        dataPointTrends: this.getDataPointTrends(integrationData)
      };
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
      const { data: integrationData, error } = await databaseService.select(
        'integration_data',
        '*',
        { userintegration_id: userIntegrationId },
        { retries: 2 }
      );

      if (error) throw error;

      if (!integrationData || integrationData.length === 0) {
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

      // Process data points
      const dataPointsByType: Record<string, number> = {};
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      let todayCount = 0;
      let thisWeekCount = 0;
      let thisMonthCount = 0;
      let lastMonthCount = 0;

      integrationData.forEach(item => {
        const createdAt = item.created_at ? new Date(item.created_at) : null;
        
        if (createdAt && createdAt >= today) todayCount++;
        if (createdAt && createdAt >= thisWeek) thisWeekCount++;
        if (createdAt && createdAt >= thisMonth) thisMonthCount++;
        if (createdAt && createdAt >= lastMonth && createdAt < thisMonth) lastMonthCount++;

        const dataType = item.data_type || 'unknown';
        dataPointsByType[dataType] = (dataPointsByType[dataType] || 0) + 1;
      });

      return {
        totalDataPoints: integrationData.length,
        dataPointsByType,
        dataPointsByTimePeriod: {
          today: todayCount,
          thisWeek: thisWeekCount,
          thisMonth: thisMonthCount,
          lastMonth: lastMonthCount
        },
        topDataPoints: this.getTopDataPoints(integrationData),
        dataPointTrends: this.getDataPointTrends(integrationData)
      };
    } catch (error) {
      logger.error('Error getting integration data point analytics', { error, userIntegrationId });
      throw error;
    }
  }

  /**
   * Get data point summary for all user integrations
   */
  async getUserIntegrationDataSummaries(userId: string): Promise<IntegrationDataSummary[]> {
    try {
      // Get user integrations with data point counts
      const { data: userIntegrations, error } = await databaseService.select(
        'user_integrations',
        `
          id,
          integration_name,
          status,
          last_sync_at,
          error_message,
          user_id
        `,
        { userid: userId },
        { retries: 2 }
      );

      if (error) throw error;

      if (!userIntegrations || userIntegrations.length === 0) {
        return [];
      }

      // Get data point counts for each integration
      const summaries: IntegrationDataSummary[] = [];

      for (const integration of userIntegrations) {
        const { data: dataPoints } = await databaseService.select(
          'integration_data',
          'id',
          { userintegration_id: integration.id },
          { retries: 2 }
        );

        const dataPointCount = dataPoints?.length || 0;

        summaries.push({
          id: integration.id,
          name: integration.integration_name || 'Unknown Integration',
          status: integration.status || 'unknown',
          lastSyncAt: integration.last_sync_at ? new Date(integration.last_sync_at) : null,
          errorCount: 0, // TODO: Implement error counting
          dataPointCount,
          syncFrequency: 'daily' // TODO: Get from integration config
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
      const { data, error } = await databaseService.select(
        'integration_data',
        'data_type',
        { userintegration_id: userIntegrationId },
        { retries: 2 }
      );

      if (error) throw error;

      if (!data || data.length === 0) {
        return {};
      }

      // Count by data type
      const typeCounts: Record<string, number> = {};
      data.forEach(item => {
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
      const { data, error } = await databaseService.select(
        'integration_data',
        'created_at',
        { userintegration_id: userIntegrationId },
        { retries: 2 }
      );

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          lastMonth: 0
        };
      }

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
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Count by type
    const byType: Record<string, number> = {};
    data.forEach(item => {
      const type = item.data_type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    });

    // Count by time period
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

    // Calculate trends (simplified - in real implementation, use more sophisticated trend analysis)
    const dailyGrowth = this.calculateGrowthRate(todayCount, thisWeekCount / 7);
    const weeklyGrowth = this.calculateGrowthRate(thisWeekCount, thisMonthCount / 4);
    const monthlyGrowth = this.calculateGrowthRate(thisMonthCount, lastMonthCount);

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
      total,
      byType,
      byTimePeriod: {
        today: todayCount,
        thisWeek: thisWeekCount,
        thisMonth: thisMonthCount,
        lastMonth: lastMonthCount
      },
      trends: {
        dailyGrowth,
        weeklyGrowth,
        monthlyGrowth
      },
      topDataTypes
    };
  }

  /**
   * Calculate growth rate percentage
   */
  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100: 0;
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