/**
 * Department Services Index
 * 
 * Centralized export of all department-specific services
 */

// Import all department services
import { salesService, SalesService } from './SalesService';
import { financeService, FinanceService } from './FinanceService';
import { operationsService, OperationsService } from './OperationsService';
import { marketingService, MarketingService } from './MarketingService';

// Export all department services
export { salesService, SalesService } from './SalesService';
export { financeService, FinanceService } from './FinanceService';
export { operationsService, OperationsService } from './OperationsService';
export { marketingService, MarketingService } from './MarketingService';

// Export types
export type {
  SalesLead,
  SalesPipeline,
  SalesRevenue,
  SalesPerformance,
} from './SalesService';

export type {
  FinancialTransaction,
  FinancialMetric,
  Budget,
  CashFlow,
} from './FinanceService';

export type {
  Workflow,
  EfficiencyMetric,
  Automation,
  Performance,
} from './OperationsService';

export type {
  MarketingCampaign,
  MarketingLead,
  MarketingAnalytics,
  MarketingPerformance,
} from './MarketingService';

// Service registry for easy access
export const departmentServices = {
  sales: salesService,
  finance: financeService,
  operations: operationsService,
  marketing: marketingService,
} as const;

export type DepartmentServiceType = keyof typeof departmentServices;
