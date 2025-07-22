/**
 * Analytics Export Subdomain
 * Handles data export and sharing functionality
 */

// Export Components
export * from './components';

// Export Hooks
export * from './hooks';

// Export Services
export * from './services';

// Export Pages
export * from './pages';

// Export Types
export interface DataExport {
  id: string;
  name: string;
  description: string;
  format: 'csv' | 'excel' | 'pdf' | 'json';
  dataSource: string;
  filters: ExportFilter[];
  schedule?: ExportSchedule;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  createdAt: string;
}

export interface ExportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
}

export interface ExportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone: string;
  enabled: boolean;
  recipients: string[];
}

export interface ExportConfig {
  enableScheduling: boolean;
  enableEmailDelivery: boolean;
  enableCompression: boolean;
  maxFileSize: number;
} 