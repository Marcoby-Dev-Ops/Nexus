/**
 * Waitlist Analytics Subdomain
 * Handles waitlist performance and insights
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface WaitlistAnalytics {
  id: string;
  campaignId: string;
  period: string;
  metrics: WaitlistMetrics;
  insights: WaitlistInsight[];
  generatedAt: string;
}

export interface WaitlistMetrics {
  totalSignups: number;
  activeSignups: number;
  conversionRate: number;
  averageWaitTime: number;
  topSources: string[];
  growthRate: number;
}

export interface WaitlistInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  data: Record<string, any>;
}

export interface WaitlistTrend {
  id: string;
  metric: string;
  values: TrendPoint[];
  period: string;
}

export interface TrendPoint {
  date: string;
  value: number;
} 