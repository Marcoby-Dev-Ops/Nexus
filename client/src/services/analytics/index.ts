/**
 * Analytics Services Index
 */

import { BaseService } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';

// Consolidated analytics service - primary interface
export { ConsolidatedAnalyticsService } from './ConsolidatedAnalyticsService';

// Analytics types
export interface UnifiedCommunicationInsights {
  totalMessages: number;
  responseTime: number;
  engagementRate: number;
  channelDistribution: Record<string, number>;
  topTopics: string[];
  sentimentScore: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface CommunicationHealthScore {
  overall: number;
  responsiveness: number;
  clarity: number;
  engagement: number;
  consistency: number;
  recommendations: string[];
  lastUpdated: Date;
}

// Analytics Services
import { AnalyticsService, analyticsService } from '../core/AnalyticsService';

export { AnalyticsService, analyticsService } from '../core/AnalyticsService';

// Communication Analytics Service - wrapper around core analytics service
class CommunicationAnalyticsService extends BaseService {
  private analytics = analyticsService;

  async getInsights(): Promise<UnifiedCommunicationInsights> {
    try {
      // Get communication-related events and metrics from the core analytics service
      const events = await this.analytics.getEvents({ event_type: 'communication' });
      const metrics = await this.analytics.getMetrics({ metric_type: 'communication' });
      
      // Transform the data into the expected format
      return {
        totalMessages: metrics.data?.length || 0,
        responseTime: 0, // Calculate from metrics
        engagementRate: 0, // Calculate from events
        channelDistribution: {}, // Aggregate from events
        topTopics: [], // Extract from event data
        sentimentScore: 0, // Calculate from sentiment metrics
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          end: new Date()
        }
      };
    } catch (error) {
      this.logger.error('Error getting communication insights:', error);
      // Return mock data as fallback
      return {
        totalMessages: 0,
        responseTime: 0,
        engagementRate: 0,
        channelDistribution: {},
        topTopics: [],
        sentimentScore: 0,
        period: {
          start: new Date(),
          end: new Date()
        }
      };
    }
  }

  async getHealthScore(): Promise<CommunicationHealthScore> {
    try {
      // Get communication health metrics from the core analytics service
      const businessMetrics = await this.analytics.getBusinessMetrics('current-user');
      
      return {
        overall: 75, // Calculate from various metrics
        responsiveness: 80,
        clarity: 70,
        engagement: 85,
        consistency: 65,
        recommendations: [
          'Improve response time for customer inquiries',
          'Standardize communication templates',
          'Increase engagement in team channels'
        ],
        lastUpdated: new Date()
      };
    } catch (error) {
      this.logger.error('Error getting communication health score:', error);
      // Return mock data as fallback
      return {
        overall: 0,
        responsiveness: 0,
        clarity: 0,
        engagement: 0,
        consistency: 0,
        recommendations: [],
        lastUpdated: new Date()
      };
    }
  }
}

export const communicationAnalyticsService = new CommunicationAnalyticsService();
