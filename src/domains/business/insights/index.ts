/**
 * Business Insights Subdomain
 * Handles business intelligence and analytics
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface BusinessInsight {
  id: string;
  title: string;
  description: string;
  category: 'revenue' | 'efficiency' | 'growth' | 'risk' | 'opportunity';
  priority: 'high' | 'medium' | 'low';
  data: Record<string, any>;
  recommendations: string[];
  createdAt: string;
}

export interface InsightReport {
  id: string;
  title: string;
  period: string;
  insights: BusinessInsight[];
  summary: string;
  generatedAt: string;
}

export interface InsightAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
  createdAt: string;
  read: boolean;
} 