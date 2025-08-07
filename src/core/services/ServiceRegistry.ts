import { billingService } from '@/services/business/BillingService';
import { analyticsService } from '@/services/analytics/analyticsService';
import { aiService } from '@/services/ai/AIService';
import { consolidatedIntegrationService } from '@/services/integrations/consolidatedIntegrationService';
import { TenantService } from '@/services/business/TenantService';
import { onboardingService } from '@/shared/services/OnboardingService';
import { logger } from '@/shared/utils/logger.ts';

// Legacy services have been migrated to core services
// These imports are kept for reference during migration

export interface ServiceRegistry {
  billing: typeof billingService;
  analytics: typeof analyticsService;
  ai: typeof aiService;
  integration: typeof consolidatedIntegrationService;
  tenant: typeof TenantService;
  onboarding: typeof onboardingService;
}

export const serviceRegistry: ServiceRegistry = {
  billing: billingService,
  analytics: analyticsService,
  ai: aiService,
  integration: consolidatedIntegrationService,
  tenant: TenantService,
  onboarding: onboardingService,
};

// Migration helper functions
export const MigrationHelper = {
  /**
   * Check if a service has been migrated to the new core service
   */
  isServiceMigrated(serviceName: string): boolean {
    const migratedServices = ['billing', 'analytics', 'ai', 'integration', 'tenant', 'onboarding'];
    return migratedServices.includes(serviceName);
  },

  /**
   * Get the appropriate service (core or legacy) based on migration status
   */
  getService<T extends keyof ServiceRegistry>(serviceName: T): ServiceRegistry[T] {
    if (this.isServiceMigrated(serviceName as string)) {
      return serviceRegistry[serviceName];
    }
    
    logger.warn(`Service ${serviceName} not yet migrated, using legacy service`);
    throw new Error(`Service ${serviceName} not yet migrated`);
  },

  /**
   * Get legacy service for migration purposes
   */
  getLegacyService<T extends string>(serviceName: T): never {
    throw new Error(`Legacy service ${serviceName} has been migrated to core services`);
  },

  /**
   * Migration status for each service
   */
  getMigrationStatus(): Record<string, { migrated: boolean; targetService: string }> {
    return {
      billingService: { migrated: true, targetService: 'billing' },
      googleAnalyticsService: { migrated: true, targetService: 'analytics' },
      googleWorkspaceService: { migrated: true, targetService: 'analytics' },
      integrationTracker: { migrated: true, targetService: 'integration' },
      agentRegistry: { migrated: true, targetService: 'ai' },
      continuousImprovementService: { migrated: true, targetService: 'ai' },
      slashCommandService: { migrated: true, targetService: 'ai' },
      tenantService: { migrated: true, targetService: 'tenant' },
      onboardingService: { migrated: true, targetService: 'onboarding' },
    };
  },

  /**
   * Get migration recommendations
   */
  getMigrationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Check for any remaining legacy service usage
    const migrationStatus = this.getMigrationStatus();
    
    Object.entries(migrationStatus).forEach(([service, status]) => {
      if (status.migrated) {
        recommendations.push(`✅ ${service} → ${status.targetService} (migrated)`);
      } else {
        recommendations.push(`⚠️  ${service} → ${status.targetService} (pending)`);
      }
    });

    return recommendations;
  },
};

// Export individual services for direct access
export { billingService, analyticsService, aiService, consolidatedIntegrationService as integrationService, TenantService, onboardingService };

// All legacy services have been migrated to core services 