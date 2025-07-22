/**
 * Hype Engagement Subdomain
 * Handles audience engagement and interaction
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface HypeEngagement {
  id: string;
  campaignId: string;
  userId: string;
  type: 'like' | 'share' | 'comment' | 'click' | 'conversion';
  timestamp: string;
  data: Record<string, any>;
}

export interface EngagementMetrics {
  totalEngagements: number;
  uniqueUsers: number;
  engagementRate: number;
  topContent: string[];
  peakTimes: string[];
  demographics: Record<string, number>;
}

export interface AudienceSegment {
  id: string;
  name: string;
  criteria: Record<string, any>;
  size: number;
  engagementRate: number;
  lastUpdated: string;
} 