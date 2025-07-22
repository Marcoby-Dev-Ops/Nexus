/**
 * Analytics Dashboards Subdomain
 * Handles dashboard creation and management
 */

// Dashboards Components
export * from './components';

// Dashboards Hooks
export * from './hooks';

// Dashboards Services
export * from './services';

// Dashboards Pages
export * from './pages';

// Dashboards Types
export interface Dashboard {
  id: string;
  name: string;
  description: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  refreshInterval: number;
  isPublic: boolean;
  owner: string;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'list';
  title: string;
  dataSource: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
}

export interface DashboardLayout {
  type: 'grid' | 'flexible';
  columns: number;
  rows: number;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'date' | 'select' | 'text' | 'number';
  defaultValue: any;
  options?: any[];
} 