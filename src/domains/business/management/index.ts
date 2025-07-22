/**
 * Business Management Subdomain
 * Handles business operations and management features
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface BusinessManagement {
  id: string;
  type: 'operations' | 'finance' | 'hr' | 'marketing' | 'sales';
  status: 'active' | 'inactive' | 'pending';
  config: Record<string, any>;
  metrics: BusinessMetric[];
  lastUpdated: string;
}

export interface BusinessMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  category: string;
}

export interface ManagementDashboard {
  id: string;
  title: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'flex' | 'custom';
  refreshInterval: number;
} 