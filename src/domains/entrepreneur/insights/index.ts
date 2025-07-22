/**
 * Entrepreneur Insights Subdomain
 * Handles business insights and analytics
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface EntrepreneurInsight {
  id: string;
  title: string;
  description: string;
  category: 'market' | 'trend' | 'opportunity' | 'risk' | 'strategy';
  priority: 'high' | 'medium' | 'low';
  data: Record<string, any>;
  recommendations: string[];
  createdAt: string;
}

export interface MarketTrend {
  id: string;
  name: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  timeframe: string;
  data: Record<string, any>;
}

export interface BusinessOpportunity {
  id: string;
  title: string;
  description: string;
  market: string;
  potential: number;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  risks: string[];
} 