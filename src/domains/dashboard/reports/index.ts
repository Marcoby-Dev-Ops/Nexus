/**
 * Dashboard Reports Subdomain
 * Handles report generation, scheduling, and distribution
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface DashboardReport {
  id: string;
  title: string;
  description: string;
  type: 'summary' | 'detailed' | 'comparative' | 'trend';
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'manual';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'html';
  lastGenerated?: string;
  nextGeneration?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  dataSources: string[];
  filters: ReportFilter[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'text' | 'metric';
  config: Record<string, any>;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
} 