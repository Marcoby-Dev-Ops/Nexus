/**
 * Business Services Index
 */

// Core business services
export { CompanyService } from './CompanyService';
export { UserService } from './UserService';
export { ContactService } from './ContactService';
export { DealService } from './DealService';
export { BillingService, billingService } from './BillingService';
export { NotificationService } from './NotificationService';
export { CalendarService } from './CalendarService';
export { CompanyProvisioningService } from './CompanyProvisioningService';
export { CompanyOwnershipService } from './CompanyOwnershipService';
export { userProfileService } from './userProfileService';
export { TenantService } from './TenantService';

// Additional business services
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
