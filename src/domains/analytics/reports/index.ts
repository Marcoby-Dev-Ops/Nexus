/**
 * Analytics Reports Subdomain
 * Handles report generation and data visualization
 */

// Reports Components
export * from './components';

// Reports Hooks
export * from './hooks';

// Reports Services
export * from './services';

// Reports Pages
export * from './pages';

// Reports Types
export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'chart' | 'table' | 'dashboard' | 'export';
  dataSource: string;
  filters: ReportFilter[];
  schedule?: ReportSchedule;
  recipients: string[];
  lastGenerated?: string;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone: string;
  enabled: boolean;
} 