/**
 * Core Services Index
 * 
 * Exports consolidated services that have been cleaned up and merged
 * to eliminate duplications and provide a clean foundation.
 */

// ============================================================================
// CONSOLIDATED CORE SERVICES
// ============================================================================

// User Service (consolidates 3 user profile services)
export { userService, UserService } from './UserService';
export type {
  UserProfile,
  Company,
  UserBusinessData,
  UpdateProfileRequest
} from './UserService';

// Analytics Service (consolidates 2 analytics services)
export { analyticsService, AnalyticsService } from './AnalyticsService';
export type {
  IntegrationAnalytics,
  DataSource,
  DataUsageByCategory,
  RecentSyncActivity,
  AnalyticsEvent,
  AnalyticsMetrics,
  AnalyticsInsight,
  AnalyticsDashboard,
  GoogleAnalyticsConfig,
  GoogleAnalyticsProperty,
  GoogleAnalyticsReport,
  GoogleWorkspaceConfig,
  GoogleWorkspaceUsage
} from './AnalyticsService';

// Company Service (consolidates CompanyService and CompanyProvisioningService)
export { companyService, CompanyService } from './CompanyService';
export type {
  Company,
  Department,
  CompanyRole,
  UserCompanyRole,
  CompanyHealth,
  CompanyProvisioningOptions,
  ProvisioningResult
} from './CompanyService';

// Financial Service (consolidates BillingService and FinancialDataService)
export { financialService, FinancialService } from './FinancialService';
export type {
  FinancialData,
  FinancialMetrics,
  FinancialHealthScore,
  FinancialIntegrationStatus,
  BillingPlan,
  Subscription,
  Invoice,
  PaymentMethod,
  BillingUsage,
  BillingStatus,
  ChatQuotas,
  UsageTracking,
  UsageBilling
} from './FinancialService';

// Notification Service (consolidates NotificationService from business)
export { notificationService, NotificationService } from './NotificationService';
export type {
  Notification,
  NotificationTemplate,
  NotificationChannel
} from './NotificationService';

// ============================================================================
// SERVICE UTILITIES
// ============================================================================

/**
 * Get all core services
 */
export const getCoreServices = () => ({
  userService: userService,
  analyticsService: analyticsService,
  companyService: companyService,
  financialService: financialService,
  notificationService: notificationService,
});

/**
 * Initialize all core services
 */
export const initializeCoreServices = async () => {
  // Services are automatically initialized when imported
  // This function can be used for any additional initialization logic
  // Core services initialized
};

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Migration status for old services
 */
export const MIGRATION_STATUS = {
  USER_SERVICES: {
    status: 'CONSOLIDATED',
    oldServices: [
      'src/services/business/UserService.ts',
      'src/services/auth/UserProfileService.ts',
      'src/services/business/userProfileService.ts'
    ],
    newService: 'src/services/core/UserService.ts',
    migrationDate: '2024-01-17'
  },
  ANALYTICS_SERVICES: {
    status: 'CONSOLIDATED',
    oldServices: [
      'src/services/AnalyticsService.ts',
      'src/services/analytics/analyticsService.ts'
    ],
    newService: 'src/services/core/AnalyticsService.ts',
    migrationDate: '2024-01-17'
  },
  COMPANY_SERVICES: {
    status: 'CONSOLIDATED',
    oldServices: [
      'src/services/business/CompanyService.ts',
      'src/services/business/CompanyProvisioningService.ts'
    ],
    newService: 'src/services/core/CompanyService.ts',
    migrationDate: '2024-01-17'
  },
  FINANCIAL_SERVICES: {
    status: 'CONSOLIDATED',
    oldServices: [
      'src/services/business/BillingService.ts',
      'src/services/business/financialDataService.ts'
    ],
    newService: 'src/services/core/FinancialService.ts',
    migrationDate: '2024-01-17'
  },
  NOTIFICATION_SERVICES: {
    status: 'CONSOLIDATED',
    oldServices: [
      'src/services/business/NotificationService.ts'
    ],
    newService: 'src/services/core/NotificationService.ts',
    migrationDate: '2024-01-17'
  }
} as const;

/**
 * Check if a service has been migrated
 */
export const isServiceMigrated = (servicePath: string): boolean => {
  const allOldServices = [
    ...MIGRATION_STATUS.USER_SERVICES.oldServices,
    ...MIGRATION_STATUS.ANALYTICS_SERVICES.oldServices
  ];
  return allOldServices.includes(servicePath);
};

/**
 * Get migration info for a service
 */
export const getMigrationInfo = (servicePath: string) => {
  for (const [key, info] of Object.entries(MIGRATION_STATUS)) {
    if (info.oldServices.includes(servicePath)) {
      return {
        status: info.status,
        newService: info.newService,
        migrationDate: info.migrationDate
      };
    }
  }
  return null;
};
