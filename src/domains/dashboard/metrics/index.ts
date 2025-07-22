/**
 * Dashboard Metrics Subdomain
 * Handles metrics, KPIs, and performance indicators
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface DashboardMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  target?: number;
  category: 'revenue' | 'operations' | 'customer' | 'team' | 'efficiency';
  lastUpdated: string;
}

export interface MetricWidget {
  id: string;
  title: string;
  metrics: DashboardMetric[];
  layout: 'grid' | 'list' | 'chart';
  refreshInterval: number;
} 