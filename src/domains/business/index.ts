/**
 * Business Domain - Main Index
 * Consolidates all business functionality including profiles, setup, and management
 */

// Business Components
export { BusinessProfileSetup } from './components/BusinessProfileSetup';
export { QuickBusinessSetup } from './components/QuickBusinessSetup';

// Business Services
export { companyStatusService } from './services/companyStatusService';

// Business Types
export interface BusinessProfile {
  id: string;
  name: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large';
  stage: 'idea' | 'mvp' | 'growth' | 'scale' | 'mature';
  revenue: number;
  employees: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessMetrics {
  mrr: number;
  arr: number;
  churnRate: number;
  ltv: number;
  cac: number;
  burnRate: number;
} 