/**
 * Dashboard Overview Subdomain
 * Handles main dashboard views, summaries, and overview components
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface DashboardOverview {
  id: string;
  title: string;
  description: string;
  type: 'summary' | 'metrics' | 'widget' | 'report';
  data: Record<string, any>;
  lastUpdated: string;
  refreshInterval?: number;
}

export interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  category: 'fire-cycle' | 'see-think-act' | 'business-intelligence' | 'communication';
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
} 