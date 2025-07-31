import { serviceFactory } from './ServiceFactory';
import { userService } from './UserService';
import { companyService } from './CompanyService';

/**
 * Service Registry
 * Central registry for all application services
 */
export interface ServiceRegistry {
  user: typeof userService;
  company: typeof companyService;
  // Add other services as they are migrated
  // analytics: AnalyticsService;
  // integrations: IntegrationService;
}

/**
 * Register all services with the factory
 */
export const registerServices = () => {
  // Register core services
  serviceFactory.register('user', userService);
  serviceFactory.register('company', companyService);
  
  // Register additional services as they are migrated
  // serviceFactory.register('analytics', analyticsService);
  // serviceFactory.register('integrations', integrationService);
  
  console.log(`✅ Registered ${serviceFactory.count} services:`, serviceFactory.list());
};

/**
 * Get service registry instance
 */
export const getServiceRegistry = (): ServiceRegistry => {
  return {
    user: serviceFactory.get('user'),
    company: serviceFactory.get('company'),
    // Add other services as they are migrated
    // analytics: serviceFactory.get('analytics'),
    // integrations: serviceFactory.get('integrations'),
  };
};

/**
 * Service registry for React hooks
 */
export const useServiceRegistry = () => {
  return {
    user: () => serviceFactory.get('user'),
    company: () => serviceFactory.get('company'),
    // Add other services as they are migrated
    // analytics: () => serviceFactory.get('analytics'),
    // integrations: () => serviceFactory.get('integrations'),
  };
};

// Auto-register services on import
registerServices(); 