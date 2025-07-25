/**
 * Analytics Services Index
 */

export { analyticsService } from './analyticsService';
export { communicationAnalyticsService } from './communicationAnalyticsService';
export { realDataService } from './realDataService';

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
