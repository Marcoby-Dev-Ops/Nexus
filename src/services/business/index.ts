/**
 * Business Services Index
 */

export { companyStatusService } from './companyStatusService';
export { businessBenchmarkingService } from './businessBenchmarkingService';
export { dataConnectivityHealthService } from './dataConnectivityHealthService';

// Business types
export interface CompanyStatusOverview {
  companyId: string;
  overallHealth: number;
  dimensions: DimensionStatus[];
  lastUpdated: Date;
  recommendations: string[];
}

export interface DimensionStatus {
  name: string;
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    name: string;
    value: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  insights: string[];
}
