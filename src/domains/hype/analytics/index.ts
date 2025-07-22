/**
 * Hype Analytics Subdomain
 * Handles marketing analytics and performance tracking
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface HypeAnalytics {
  id: string;
  campaignId: string;
  period: string;
  metrics: AnalyticsMetrics;
  insights: AnalyticsInsight[];
  generatedAt: string;
}

export interface AnalyticsMetrics {
  reach: number;
  engagement: number;
  conversions: number;
  revenue: number;
  roi: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  data: Record<string, any>;
} 