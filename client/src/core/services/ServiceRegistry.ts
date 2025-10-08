/**
 * Service Registry
 * 
 * Centralized service registration and management.
 * Automatically registers all services and provides easy access.
 */

import { serviceFactory, registerService } from './ServiceFactory';
import type { BaseService } from './BaseService';

// Import all services
import { UserService } from '@/services/core/UserService';
import { CompanyService } from '@/services/core/CompanyService';
import { DealService } from '@/services/business/DealService';
import { ContactService } from '@/services/business/ContactService';
import { NotificationService } from '@/services/core/NotificationService';
import { FinancialService } from '@/services/core/FinancialService';
import { CalendarService } from '@/services/business/CalendarService';
import { TenantService } from '@/services/business/TenantService';
import { CompanyOwnershipService } from '@/services/business/CompanyOwnershipService';
// CompanyProvisioningService consolidated into CompanyService
// UserProfileService consolidated into UserService

// Core services
import { WorkflowService } from './workflowService';
import { databaseService } from './DatabaseService';
import { DataPrincipleService } from './DataPrincipleService';
import { PersonalThoughtsService } from './PersonalThoughtsService';
import { PersonalAutomationsService } from './PersonalAutomationsService';
import { ChatUsageTrackingService } from './ChatUsageTrackingService';
import { UserLicensesService } from './UserLicensesService';
import { CentralizedRLSService } from './CentralizedRLSService';
import { executionService } from './ExecutionService';

// Integration services
import { ConsolidatedIntegrationService } from '@/services/integrations/consolidatedIntegrationService';
import { SalesforceStyleDataService } from '@/services/integrations/SalesforceStyleDataService';
import { RealTimeCrossDepartmentalSync } from '@/services/integrations/realTimeCrossDepartmentalSync';

// Email services
import { EmailService } from '@/services/email/EmailService';

// Dashboard services
import { DashboardService } from '@/services/dashboard/dashboardService';

// Task services
import { TaskService } from '@/services/tasks/taskService';
import { CalendarService as TaskCalendarService } from '@/services/tasks/calendarService';

// Shared services
import { QuotaService } from '@/shared/services/quotaService';
import { AuditLogService } from '@/shared/services/auditLogService';
import { DemoService } from '@/shared/services/demoService';
import { unifiedPlaybookService } from '@/services/playbook/UnifiedPlaybookService';
import { BusinessProfileService } from '@/shared/lib/business/businessProfileService';
import { UserCompanyIntegrationBridgeService } from '@/shared/services/UserCompanyIntegrationBridgeService';
import { CompanyIntelligenceService } from '@/shared/services/CompanyIntelligenceService';
import { BusinessProcessAutomationService } from '@/shared/services/BusinessProcessAutomationService';

// Auth services
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { OAuthTokenService } from '@/core/auth/OAuthTokenService';

// Admin services
import { WaitlistService } from '@/components/admin/onboarding/lib/waitlistService';

// Business services
import { DomainAnalysisService } from '@/services/business/domainAnalysisService';

// AI services
import { ThoughtsService } from '@/lib/services/thoughtsService';
import { conversationRouter } from '@/lib/ai/services/conversationRouter';
import { defaultAgentService } from '@/lib/ai/services/defaultAgentService';
import { agentRegistry } from '@/lib/ai/core/agentRegistry';

// Validation services
import { OnboardingValidationService } from '@/shared/utils/onboardingValidation';

/**
 * Service registration interface
 */
export interface ServiceRegistration {
  name: string;
  service: BaseService;
  description?: string;
  category?: string;
}

/**
 * Service Registry Class
 * 
 * Manages automatic registration of all services and provides
 * centralized access to the service layer.
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private registrations: ServiceRegistration[] = [];

  private constructor() {
    this.registerAllServices();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register all services automatically
   */
  private registerAllServices(): void {
    // Business Services
    this.registerService('user', new UserService(), 'User management', 'business');
    this.registerService('company', new CompanyService(), 'Company management', 'business');
    this.registerService('deal', new DealService(), 'Deal management', 'business');
    this.registerService('contact', new ContactService(), 'Contact management', 'business');
    this.registerService('notification', new NotificationService(), 'Notification management', 'business');
    this.registerService('financial', new FinancialService(), 'Financial management', 'business');
    this.registerService('calendar', new CalendarService(), 'Calendar management', 'business');
    this.registerService('tenant', new TenantService(), 'Tenant management', 'business');
    this.registerService('company-ownership', new CompanyOwnershipService(), 'Company ownership', 'business');
    // CompanyProvisioningService consolidated into CompanyService
    // UserProfileService consolidated into UserService

    // Core Services
    this.registerService('workflow', WorkflowService.getInstance(), 'Workflow management', 'core');
    this.registerService('execution', executionService, 'Hybrid execution layer (Nexus + n8n)', 'core');
    // Only register database service if it's available (server-side only)
    if (databaseService) {
      this.registerService('database', databaseService, 'Database operations', 'core');
    }
    this.registerService('data-principle', new DataPrincipleService(), 'Data principle management', 'core');
    this.registerService('personal-thoughts', new PersonalThoughtsService(), 'Personal thoughts', 'core');
    this.registerService('personal-automations', new PersonalAutomationsService(), 'Personal automations', 'core');
    this.registerService('chat-usage-tracking', new ChatUsageTrackingService(), 'Chat usage tracking', 'core');
    this.registerService('user-licenses', new UserLicensesService(), 'User license management', 'core');
    this.registerService('centralized-rls', new CentralizedRLSService(), 'Centralized RLS management', 'core');

    // Integration Services
    this.registerService('consolidated-integration', new ConsolidatedIntegrationService(), 'Consolidated integration', 'integration');
    this.registerService('salesforce-style-data', new SalesforceStyleDataService(), 'Salesforce style data', 'integration');
    this.registerService('real-time-sync', new RealTimeCrossDepartmentalSync(), 'Real-time sync', 'integration');

    // Email Services
    this.registerService('email', new EmailService(), 'Email management', 'email');

    // Dashboard Services
    this.registerService('dashboard', new DashboardService(), 'Dashboard management', 'dashboard');

    // Task Services
    this.registerService('task', new TaskService(), 'Task management', 'task');
    this.registerService('task-calendar', new TaskCalendarService(), 'Task calendar', 'task');

    // Shared Services
    this.registerService('quota', new QuotaService(), 'Quota management', 'shared');
    this.registerService('audit-log', new AuditLogService(), 'Audit logging', 'shared');
    this.registerService('demo', new DemoService(), 'Demo management', 'shared');
    this.registerService('onboarding', unifiedPlaybookService, 'Unified playbook management', 'shared');
    this.registerService('business-profile', new BusinessProfileService(), 'Business profile', 'shared');
    this.registerService('user-company-bridge', new UserCompanyIntegrationBridgeService(), 'User company bridge', 'shared');
    this.registerService('company-intelligence', new CompanyIntelligenceService(), 'Company intelligence', 'shared');
    this.registerService('business-process-automation', new BusinessProcessAutomationService(), 'Business process automation', 'shared');

    // Auth Services
    this.registerService('auth', authentikAuthService, 'Authentication', 'auth');
    this.registerService('oauth-token', new OAuthTokenService(), 'OAuth token management', 'auth');

    // Admin Services
    this.registerService('waitlist', new WaitlistService(), 'Waitlist management', 'admin');

    // Business Services
    this.registerService('domain-analysis', new DomainAnalysisService(), 'Domain analysis', 'business');

    // AI Services
    this.registerService('thoughts', new ThoughtsService(), 'Thoughts management', 'ai');
    this.registerService('conversation-router', conversationRouter, 'Conversation routing and agent management', 'ai');
    this.registerService('default-agent', defaultAgentService, 'Default agent service with Executive Assistant', 'ai');
    this.registerService('agent-registry', agentRegistry, 'Agent registry and management', 'ai');

    // Validation Services
    this.registerService('onboarding-validation', new OnboardingValidationService(), 'Onboarding validation', 'validation');
  }

  /**
   * Register a service with metadata
   */
  private registerService(
    name: string,
    service: BaseService,
    description?: string,
    category?: string
  ): void {
    // Make registration idempotent across HMR/re-mounts
    if (!serviceFactory.has(name)) {
      registerService(name, service);
      this.registrations.push({
        name,
        service,
        description,
        category,
      });
    }
  }

  /**
   * Get all service registrations
   */
  getRegistrations(): ServiceRegistration[] {
    return [...this.registrations];
  }

  /**
   * Get services by category
   */
  getServicesByCategory(category: string): ServiceRegistration[] {
    return this.registrations.filter(reg => reg.category === category);
  }

  /**
   * Get service by name
   */
  getService<T extends BaseService>(name: string): T {
    return serviceFactory.get<T>(name);
  }

  /**
   * Check if service exists
   */
  hasService(name: string): boolean {
    return serviceFactory.has(name);
  }

  /**
   * List all service names
   */
  listServiceNames(): string[] {
    return serviceFactory.list();
  }

  /**
   * Get service count
   */
  getServiceCount(): number {
    return serviceFactory.size();
  }

  /**
   * Get services by category
   */
  getCategories(): string[] {
    const categories = new Set(this.registrations.map(reg => reg.category).filter((category): category is string => Boolean(category)));
    return Array.from(categories);
  }

  /**
   * Get service statistics
   */
  getStatistics(): {
    total: number;
    byCategory: Record<string, number>;
    categories: string[];
  } {
    const byCategory: Record<string, number> = {};
    
    this.registrations.forEach(reg => {
      if (reg.category) {
        byCategory[reg.category] = (byCategory[reg.category] || 0) + 1;
      }
    });

    return {
      total: this.registrations.length,
      byCategory,
      categories: this.getCategories(),
    };
  }
}

/**
 * Global service registry instance
 */
export const serviceRegistry = ServiceRegistry.getInstance();

/**
 * Auto-register services on import
 */
serviceRegistry; 
