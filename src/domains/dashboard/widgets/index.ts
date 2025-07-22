/**
 * Dashboard Widgets Subdomain
 * Handles reusable dashboard widgets and components
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  type: 'chart' | 'table' | 'card' | 'list' | 'form';
  config: Record<string, any>;
  dataSource: string;
  refreshInterval?: number;
  permissions: string[];
}

export interface WidgetConfig {
  layout: 'grid' | 'flex' | 'fixed';
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  visible: boolean;
} 