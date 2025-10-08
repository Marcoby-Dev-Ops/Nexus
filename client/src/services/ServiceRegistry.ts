/**
 * Service Registry - Centralized service management
 * 
 * Provides a standardized way to access all services with proper
 * dependency injection and lifecycle management.
 */

import type { ServiceMetadata } from './shared/types';

// Core Services
import { userService } from './core/UserService';
import { analyticsService } from './core/AnalyticsService';
// CompanyService removed - using API calls instead
import { financialService } from './core/FinancialService';
import { notificationService } from './core/NotificationService';

// Business Services
import { ContactService } from './business/ContactService';
import { DealService } from './business/DealService';
import { CalendarService } from './business/CalendarService';
import { companyKnowledgeService } from './business/CompanyKnowledgeService';
import { EmailService } from './email/EmailService';

// AI Services
import { ConsolidatedAIService } from './ai/ConsolidatedAIService';
import { SpeechService } from './ai/SpeechService';
import { MentalModelsService } from './ai/MentalModelsService';
import { NextBestActionService } from './ai/NextBestActionService';
import { enhancedChatService } from '@/lib/ai/enhancedChatService';
import { chatContextApi } from '@/lib/api/chatContextApi';
import { expertKnowledgeService } from './ai/ExpertKnowledgeService';

// Playbook Services
import { unifiedPlaybookService } from './playbook/UnifiedPlaybookService';
import { FireCycleService } from './playbook/FireCycleService';
import { FireInitiativeAcceptanceService } from './playbook/FireInitiativeAcceptanceService';
import { journeyIntakeService } from './playbook/JourneyIntakeService';
import JourneyTicketService from './playbook/JourneyTicketService';

// Integration Services
import { ConsolidatedIntegrationService } from './integrations/consolidatedIntegrationService';

// Department Services
import { SalesService } from './departments/SalesService';
import { MarketingService } from './departments/MarketingService';
import { FinanceService } from './departments/FinanceService';
import { OperationsService } from './departments/OperationsService';



export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, any> = new Map();
  private metadata: Map<string, ServiceMetadata> = new Map();
  private initializationQueue: string[] = [];

  private constructor() {
    this.registerCoreServices();
    this.registerBusinessServices();
    this.registerAIServices();
    this.registerPlaybookServices();
    this.registerIntegrationServices();
    this.registerDepartmentServices();
  }

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Get a service by name
   */
  get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not found in registry`);
    }
    return service;
  }

  /**
   * Register a service
   */
  register<T>(name: string, service: T, metadata: Omit<ServiceMetadata, 'isInitialized'>): void {
    this.services.set(name, service);
    this.metadata.set(name, { ...metadata, isInitialized: false });
  }

  /**
   * Get service metadata
   */
  getMetadata(serviceName: string): ServiceMetadata | undefined {
    return this.metadata.get(serviceName);
  }

  /**
   * Get all services by category
   */
  getServicesByCategory(category: ServiceMetadata['category']): string[] {
    return Array.from(this.metadata.entries())
      .filter(([_, metadata]) => metadata.category === category)
      .map(([name]) => name);
  }

  /**
   * Initialize all services
   */
  async initializeServices(): Promise<void> {
    for (const [name, metadata] of this.metadata.entries()) {
      if (!metadata.isInitialized) {
        await this.initializeService(name);
      }
    }
  }

  /**
   * Initialize a specific service
   */
  private async initializeService(serviceName: string): Promise<void> {
    const metadata = this.metadata.get(serviceName);
    if (!metadata) return;

    // Check dependencies first
    for (const dependency of metadata.dependencies) {
      if (!this.metadata.get(dependency)?.isInitialized) {
        await this.initializeService(dependency);
      }
    }

    // Mark as initialized
    metadata.isInitialized = true;
    this.metadata.set(serviceName, metadata);
  }

  /**
   * Get service health status
   */
  getServiceHealth(): Record<string, { status: 'healthy' | 'error' | 'unknown'; lastCheck: Date }> {
    const health: Record<string, { status: 'healthy' | 'error' | 'unknown'; lastCheck: Date }> = {};
    
    for (const [name, metadata] of this.metadata.entries()) {
      health[name] = {
        status: metadata.isInitialized ? 'healthy' : 'unknown',
        lastCheck: new Date()
      };
    }
    
    return health;
  }

  // ============================================================================
  // SERVICE REGISTRATION METHODS
  // ============================================================================

  private registerCoreServices(): void {
    // User Service
    this.register('userService', userService, {
      name: 'UserService',
      category: 'core',
      description: 'Manages user profiles, authentication, and user-related data',
      dependencies: [],
      isSingleton: true
    });

    // Analytics Service
    this.register('analyticsService', analyticsService, {
      name: 'AnalyticsService',
      category: 'core',
      description: 'Handles analytics, metrics, and data insights',
      dependencies: ['userService'],
      isSingleton: true
    });

    // Company Service removed - using API calls instead

    // Financial Service
    this.register('financialService', financialService, {
      name: 'FinancialService',
      category: 'core',
      description: 'Handles billing, subscriptions, and financial data',
      dependencies: ['userService'],
      isSingleton: true
    });

    // Notification Service
    this.register('notificationService', notificationService, {
      name: 'NotificationService',
      category: 'core',
      description: 'Manages notifications, alerts, and communication',
      dependencies: ['userService'],
      isSingleton: true
    });
  }

  private registerBusinessServices(): void {
    // Contact Service
    this.register('contactService', new ContactService(), {
      name: 'ContactService',
      category: 'business',
      description: 'Manages contact information and relationships',
      dependencies: ['userService'],
      isSingleton: true
    });

    // Deal Service
    this.register('dealService', new DealService(), {
      name: 'DealService',
      category: 'business',
      description: 'Manages sales deals and pipeline',
      dependencies: ['userService', 'contactService'],
      isSingleton: true
    });

    // Calendar Service
    this.register('calendarService', new CalendarService(), {
      name: 'CalendarService',
      category: 'business',
      description: 'Manages calendar events and scheduling',
      dependencies: ['userService'],
      isSingleton: true
    });

    // Company Knowledge Service
    this.register('companyKnowledgeService', companyKnowledgeService, {
      name: 'CompanyKnowledgeService',
      category: 'business',
      description: 'Manages company knowledge, document intelligence, and vector search',
      dependencies: ['userService'],
      isSingleton: true
    });

    // Email Service
    this.register('emailService', new EmailService(), {
      name: 'EmailService',
      category: 'business',
      description: 'Manages email integration, sync, and unified inbox functionality',
      dependencies: ['userService'],
      isSingleton: true
    });
  }

  private registerAIServices(): void {
    // Consolidated AI Service (Primary Orchestrator)
    this.register('consolidatedAIService', new ConsolidatedAIService(), {
      name: 'ConsolidatedAIService',
      category: 'ai',
      description: 'Primary AI orchestrator providing unified AI capabilities including chat, analysis, insights, form assistance, and recommendations',
      dependencies: ['userService', 'analyticsService'],
      isSingleton: true
    });

    // Speech Service
    this.register('speechService', new SpeechService(), {
      name: 'SpeechService',
      category: 'ai',
      description: 'AI-powered speech recognition and transcription services',
      dependencies: ['consolidatedAIService'],
      isSingleton: true
    });

    // Mental Models Service
    this.register('mentalModelsService', new MentalModelsService('MentalModelsService'), {
      name: 'MentalModelsService',
      category: 'ai',
      description: 'AI-powered mental model analysis and strategic thinking frameworks',
      dependencies: ['consolidatedAIService'],
      isSingleton: true
    });

    // Next Best Action Service
    this.register('nextBestActionService', new NextBestActionService('NextBestActionService'), {
      name: 'NextBestActionService',
      category: 'ai',
      description: 'AI-powered action recommendations and decision support',
      dependencies: ['consolidatedAIService'],
      isSingleton: true
    });

    // Expert Knowledge Service
    this.register('expertKnowledgeService', expertKnowledgeService, {
      name: 'ExpertKnowledgeService',
      category: 'ai',
      description: 'Provides 20+ years of business expertise through brain analysis and expert advice',
      dependencies: ['consolidatedAIService'],
      isSingleton: true
    });

    // Enhanced Chat Service
    this.register('enhancedChatService', enhancedChatService, {
      name: 'EnhancedChatService',
      category: 'ai',
      description: 'Enhanced chat service with company context, building blocks, and RAG integration',
      dependencies: ['userService'],
      isSingleton: true
    });

    // Chat Context API
    this.register('chatContextApi', chatContextApi, {
      name: 'ChatContextApi',
      category: 'ai',
      description: 'API for fetching user, company, and building blocks context for chat',
      dependencies: ['userService'],
      isSingleton: true
    });
  }

  private registerPlaybookServices(): void {
    // Unified Playbook Service (Primary - Consolidates all playbook functionality)
    this.register('unifiedPlaybookService', unifiedPlaybookService, {
      name: 'UnifiedPlaybookService',
      category: 'playbook',
      description: 'Single source of truth for all playbook functionality: templates, journeys, and onboarding',
      dependencies: ['userService'],
      isSingleton: true
    });



    // FIRE Cycle Service (Focus Intent Roadmap Execute)
    this.register('fireCycleService', new FireCycleService('FireCycleService'), {
      name: 'FireCycleService',
      category: 'playbook',
      description: 'Manages FIRE cycle phases: Focus, Intent, Roadmap, Execute',
      dependencies: ['userService'],
      isSingleton: true
    });

    // FIRE Initiative Acceptance Service
    this.register('fireInitiativeAcceptanceService', new FireInitiativeAcceptanceService('FireInitiativeAcceptanceService'), {
      name: 'FireInitiativeAcceptanceService',
      category: 'playbook',
      description: 'Manages initiative acceptance and tracking in the FIRE cycle',
      dependencies: ['userService'],
      isSingleton: true
    });

    // Journey Intake Service
    this.register('journeyIntakeService', journeyIntakeService, {
      name: 'JourneyIntakeService',
      category: 'playbook',
      description: 'Handles AI-powered conversation flow for creating new business journeys',
      dependencies: ['userService'],
      isSingleton: true
    });



    // Journey Ticket Service
    this.register('journeyTicketService', new JourneyTicketService(), {
      name: 'JourneyTicketService',
      category: 'playbook',
      description: 'Manages journey tickets for tracking problems, issues, updates, and new entries',
      dependencies: ['userService'],
      isSingleton: true
    });
  }

  private registerIntegrationServices(): void {
    // Consolidated Integration Service
    this.register('integrationService', new ConsolidatedIntegrationService(), {
      name: 'ConsolidatedIntegrationService',
      category: 'integration',
      description: 'Manages all external integrations and data synchronization',
      dependencies: ['userService'],
      isSingleton: true
    });
  }

  private registerDepartmentServices(): void {
    // Sales Service
    this.register('salesService', new SalesService(), {
      name: 'SalesService',
      category: 'department',
      description: 'Sales department operations and metrics',
      dependencies: ['userService', 'dealService'],
      isSingleton: true
    });

    // Marketing Service
    this.register('marketingService', new MarketingService(), {
      name: 'MarketingService',
      category: 'department',
      description: 'Marketing department operations and campaigns',
      dependencies: ['userService', 'analyticsService'],
      isSingleton: true
    });

    // Finance Service
    this.register('financeService', new FinanceService(), {
      name: 'FinanceService',
      category: 'department',
      description: 'Finance department operations and reporting',
      dependencies: ['userService', 'financialService'],
      isSingleton: true
    });

    // Operations Service
    this.register('operationsService', new OperationsService(), {
      name: 'OperationsService',
      category: 'department',
      description: 'Operations department workflows and efficiency',
      dependencies: ['userService'],
      isSingleton: true
    });
  }
}

// Export singleton instance
export const serviceRegistry = ServiceRegistry.getInstance();

// Convenience exports for commonly used services
export const getService = <T>(serviceName: string): T => serviceRegistry.get<T>(serviceName);
