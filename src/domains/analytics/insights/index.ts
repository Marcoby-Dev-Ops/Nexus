/**
 * Analytics Insights Subdomain
 * Handles AI-powered insights and recommendations
 */

// Insights Components
export * from './components';

// Insights Hooks
export * from './hooks';

// Insights Services
export * from './services';

// Insights Pages
export * from './pages';

// Insights Types
export interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction';
  confidence: number;
  dataSource: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  createdAt: string;
}

export interface InsightRecommendation {
  id: string;
  insightId: string;
  action: string;
  description: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  priority: 'high' | 'medium' | 'low';
}

export interface InsightConfig {
  enableAutoDiscovery: boolean;
  enablePredictions: boolean;
  enableRecommendations: boolean;
  confidenceThreshold: number;
} 