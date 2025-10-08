/**
 * Business Services Index
 */

// Consolidated business service - primary interface
export { ConsolidatedBusinessService } from './ConsolidatedBusinessService';

// Core business services
export { CompanyService } from '../core/CompanyService';
export { UserService } from '../core/UserService';
export { ContactService } from './ContactService';
export { DealService } from './DealService';
export { NotificationService } from '../core/NotificationService';
export { CalendarService } from './CalendarService';
// Company association and ownership services
export { CompanyAssociationService } from './CompanyAssociationService';
export { CompanyOwnershipService } from './CompanyOwnershipService';
// userProfileService consolidated into UserService
export { TenantService } from './TenantService';

// Export types from consolidated CompanyService
export type { CompanyProvisioningOptions, ProvisioningResult } from '../core/CompanyService';

// Additional business services
export { companyStatusService } from './companyStatusService';
export { businessBenchmarkingService } from './businessBenchmarkingService';
export { dataConnectivityHealthService } from './dataConnectivityHealthService';
// financialDataService consolidated into FinancialService

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
