/**
 * Dashboard Domain
 * Centralized dashboard functionality and management
 */

// Core Dashboard
export * from './components';
export * from './hooks';
export * from './services';
export * from './pages';

// Dashboard Subdomains
export * from './overview';
export * from './metrics';
export * from './widgets';
export * from './reports';

// Export specific components
export { ConsolidatedDashboard } from './components/ConsolidatedDashboard';

// Dashboard Services
export { dashboardService } from './services/dashboardService';

// Dashboard Types
export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  layout: 'grid' | 'flex' | 'custom';
  widgets: string[];
  refreshInterval: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

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

export interface DashboardUser {
  id: string;
  userId: string;
  dashboardId: string;
  permissions: string[];
  preferences: Record<string, any>;
  lastAccessed: string;
} 