/**
 * Identity Service
 * 
 * Comprehensive service for managing business identity data with AI assistance,
 * validation, and integration with the Journey system.
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { openAIService } from '@/services/ai/OpenAIService';
import type { 
  BusinessIdentity, 
  IdentitySection, 
  CompletionStatus,
  CompanyFoundation,
  MissionVisionValues,
  ProductsServices,
  TargetMarket,
  CompetitiveLandscape,
  BusinessOperations,
  FinancialContext,
  StrategicContext
} from '@/lib/identity/types';

// ============================================================================
// IDENTITY SERVICE
// ============================================================================

export class IdentityService extends BaseService {
  private static instance: IdentityService;

  constructor() {
    super('IdentityService');
  }

  public static getInstance(): IdentityService {
    if (!IdentityService.instance) {
      IdentityService.instance = new IdentityService();
    }
    return IdentityService.instance;
  }

  // ============================================================================
  // CORE IDENTITY OPERATIONS
  // ============================================================================

  /**
   * Get complete business identity
   */
  async getBusinessIdentity(userId: string): Promise<ServiceResponse<BusinessIdentity>> {
    try {
      const response = await this.apiRequest<BusinessIdentity>('/db/business_identity', {
        method: 'GET',
        headers: {
          'X-User-ID': userId
        }
      });

      if (response.success && response.data) {
        return this.createSuccessResponse(response.data);
      }

      // Return default identity if none exists
      return this.createSuccessResponse(this.getDefaultIdentity());
    } catch (error) {
      return this.handleError(error, `get business identity for user ${userId}`);
    }
  }

  /**
   * Update business identity section
   */
  async updateIdentitySection(
    userId: string,
    section: IdentitySection,
    data: any
  ): Promise<ServiceResponse<BusinessIdentity>> {
    try {
      // Get current identity
      const currentResponse = await this.getBusinessIdentity(userId);
      if (!currentResponse.success) {
        return this.createErrorResponse('Failed to get current identity');
      }

      const currentIdentity = currentResponse.data!;
      
      // Update the specific section
      const updatedIdentity = {
        ...currentIdentity,
        [section]: { ...currentIdentity[section], ...data },
        lastUpdated: new Date().toISOString()
      };

      // Calculate new completeness
      updatedIdentity.completeness = this.calculateCompleteness(updatedIdentity);

      // Save to database
      const saveResponse = await this.apiRequest<BusinessIdentity>('/db/business_identity/upsert', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            user_id: userId,
            ...updatedIdentity,
            // Transform camelCase to snake_case for database
            foundation: updatedIdentity.foundation,
            mission_vision_values: updatedIdentity.missionVisionValues,
            products_services: updatedIdentity.productsServices,
            target_market: updatedIdentity.targetMarket,
            competitive_landscape: updatedIdentity.competitiveLandscape,
            business_operations: updatedIdentity.businessOperations,
            financial_context: updatedIdentity.financialContext,
            strategic_context: updatedIdentity.strategicContext,
            last_updated: updatedIdentity.lastUpdated,
            version: updatedIdentity.version,
            completeness: updatedIdentity.completeness
          }
        })
      });

      if (saveResponse.success) {
        logger.info('Identity section updated', { userId, section });
        return this.createSuccessResponse(updatedIdentity);
      }

      return this.createErrorResponse('Failed to save identity update');
    } catch (error) {
      return this.handleError(error, `update identity section ${section} for user ${userId}`);
    }
  }

  /**
   * Get section completion status
   */
  getSectionStatus(identity: BusinessIdentity, section: IdentitySection): CompletionStatus {
    const completeness = identity.completeness.sections[section];
    
    if (completeness === 0) return 'Not Started';
    if (completeness < 50) return 'In Progress';
    if (completeness < 90) return 'Needs Review';
    return 'Complete';
  }

  /**
   * Get next recommended action
   */
  getNextAction(identity: BusinessIdentity): { 
    section: IdentitySection; 
    action: string; 
    priority: 'High' | 'Medium' | 'Low' 
  } {
    const sections: IdentitySection[] = [
      'foundation', 'missionVisionValues', 'productsServices',
      'targetMarket', 'competitiveLandscape', 'businessOperations',
      'financialContext', 'strategicContext'
    ];
    
    // Find the section with lowest completeness
    let lowestCompleteness = 100;
    let targetSection: IdentitySection = 'foundation';
    
    for (const section of sections) {
      const completeness = identity.completeness.sections[section];
      if (completeness < lowestCompleteness) {
        lowestCompleteness = completeness;
        targetSection = section;
      }
    }
    
    const actions: Record<IdentitySection, string> = {
      foundation: 'Complete basic company information',
      missionVisionValues: 'Define mission, vision, and core values',
      productsServices: 'Document products and services',
      targetMarket: 'Define target market and customer personas',
      competitiveLandscape: 'Analyze competitive landscape',
      businessOperations: 'Document business operations',
      financialContext: 'Add financial information',
      strategicContext: 'Define strategic goals and priorities'
    };
    
    const priority = lowestCompleteness < 25 ? 'High' : lowestCompleteness < 50 ? 'Medium' : 'Low';
    
    return {
      section: targetSection,
      action: actions[targetSection],
      priority
    };
  }

  // ============================================================================
  // AI ASSISTANCE OPERATIONS
  // ============================================================================

  /**
   * Generate AI-assisted content for identity section
   */
  async generateAIContent(
    userId: string,
    section: IdentitySection,
    context: any,
    prompt: string
  ): Promise<ServiceResponse<any>> {
    try {
      // Get current identity for context
      const identityResponse = await this.getBusinessIdentity(userId);
      const currentIdentity = identityResponse.success ? identityResponse.data : null;

      // Use OpenAI service directly with usage tracking
      const response = await openAIService.generateIdentityContent(
        section,
        {
          ...context,
          currentIdentity
        },
        prompt,
        userId // Pass userId for usage tracking
      );

      if (response.success) {
        logger.info('AI content generated', { userId, section });
        return this.createSuccessResponse(response.data);
      }

      return this.createErrorResponse('Failed to generate AI content');
    } catch (error) {
      return this.handleError(error, `generate AI content for section ${section}`);
    }
  }

  /**
   * Validate and improve identity content
   */
  async validateIdentityContent(
    userId: string,
    section: IdentitySection,
    content: any
  ): Promise<ServiceResponse<{
    isValid: boolean;
    suggestions: string[];
    improvedContent?: any;
  }>> {
    try {
      const response = await this.apiRequest<any>('/api/ai/validate-identity', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          section,
          content,
          currentIdentity: await this.getBusinessIdentity(userId)
        })
      });

      if (response.success) {
        return this.createSuccessResponse(response.data);
      }

      return this.createErrorResponse('Failed to validate identity content');
    } catch (error) {
      return this.handleError(error, `validate identity content for section ${section}`);
    }
  }

  // ============================================================================
  // JOURNEY INTEGRATION
  // ============================================================================

  /**
   * Complete identity journey step
   */
  async completeJourneyStep(
    userId: string,
    journeyId: string,
    stepId: string,
    stepData: any
  ): Promise<ServiceResponse<BusinessIdentity>> {
    try {
      // Update identity with journey step data
      const section = this.mapJourneyStepToSection(stepId);
      if (section) {
        const updateResponse = await this.updateIdentitySection(userId, section, stepData);
        if (updateResponse.success) {
          logger.info('Journey step completed and identity updated', { userId, journeyId, stepId });
          return this.createSuccessResponse(updateResponse.data!);
        }
      }

      return this.createErrorResponse('Failed to complete journey step');
    } catch (error) {
      return this.handleError(error, `complete journey step ${stepId} for user ${userId}`);
    }
  }

  /**
   * Get identity insights for dashboard
   */
  async getIdentityInsights(userId: string): Promise<ServiceResponse<{
    completeness: number;
    nextAction: any;
    recentUpdates: any[];
    aiRecommendations: string[];
  }>> {
    try {
      const identityResponse = await this.getBusinessIdentity(userId);
      if (!identityResponse.success) {
        return this.createErrorResponse('Failed to get identity data');
      }

      const identity = identityResponse.data!;
      const nextAction = this.getNextAction(identity);

      // Get AI recommendations
      const recommendationsResponse = await this.apiRequest<string[]>('/api/ai/identity-recommendations', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          identity
        })
      });

      const insights = {
        completeness: identity.completeness.overall,
        nextAction,
        recentUpdates: [], // TODO: Implement recent updates tracking
        aiRecommendations: recommendationsResponse.success ? recommendationsResponse.data || [] : []
      };

      return this.createSuccessResponse(insights);
    } catch (error) {
      return this.handleError(error, `get identity insights for user ${userId}`);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Calculate completeness for identity
   */
  private calculateCompleteness(identity: BusinessIdentity): BusinessIdentity['completeness'] {
    const sections: IdentitySection[] = [
      'foundation', 'missionVisionValues', 'productsServices',
      'targetMarket', 'competitiveLandscape', 'businessOperations',
      'financialContext', 'strategicContext'
    ];

    const sectionCompleteness: Record<string, number> = {};
    let totalCompleteness = 0;

    for (const section of sections) {
      const completeness = this.calculateSectionCompleteness(identity, section);
      sectionCompleteness[section] = completeness;
      totalCompleteness += completeness;
    }

    return {
      overall: Math.round(totalCompleteness / sections.length),
      sections: sectionCompleteness as any
    };
  }

  /**
   * Calculate completeness for a specific section
   */
  private calculateSectionCompleteness(identity: BusinessIdentity, section: IdentitySection): number {
    const sectionData = (identity as any)[section];
    const requiredFields = this.getRequiredFields(section);
    
    let completedFields = 0;
    for (const field of requiredFields) {
      if (this.isFieldCompleted(sectionData, field)) {
        completedFields++;
      }
    }
    
    return Math.round((completedFields / requiredFields.length) * 100);
  }

  /**
   * Get required fields for each section
   */
  private getRequiredFields(section: IdentitySection): string[] {
    const requiredFields: Record<IdentitySection, string[]> = {
      foundation: ['name', 'industry', 'businessModel', 'website', 'email'],
      missionVisionValues: ['missionStatement', 'visionStatement', 'coreValues'],
      productsServices: ['offerings', 'uniqueValueProposition'],
      targetMarket: ['customerSegments', 'idealCustomerProfile'],
      competitiveLandscape: ['directCompetitors', 'competitivePositioning'],
      businessOperations: ['team', 'keyProcesses'],
      financialContext: ['revenue', 'financialHealth'],
      strategicContext: ['goals', 'strategicPriorities']
    };
    
    return requiredFields[section] || [];
  }

  /**
   * Check if a field is completed
   */
  private isFieldCompleted(data: any, field: string): boolean {
    const value = data[field];
    
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') {
      return Object.values(value).some(v => 
        v !== null && v !== undefined && 
        (typeof v === 'string' ? v.trim().length > 0 : true)
      );
    }
    
    return true;
  }

  /**
   * Map journey step to identity section
   */
  private mapJourneyStepToSection(stepId: string): IdentitySection | null {
    const stepMapping: Record<string, IdentitySection> = {
      'foundation-step': 'foundation',
      'mission-vision-step': 'missionVisionValues',
      'products-services-step': 'productsServices',
      'target-market-step': 'targetMarket',
      'competitive-landscape-step': 'competitiveLandscape',
      'business-operations-step': 'businessOperations',
      'financial-context-step': 'financialContext',
      'strategic-context-step': 'strategicContext'
    };

    return stepMapping[stepId] || null;
  }

  /**
   * Get default identity structure
   */
  private getDefaultIdentity(): BusinessIdentity {
    return {
      foundation: {
        name: '',
        legalStructure: 'LLC',
        foundedDate: '',
        headquarters: {
          address: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        },
        industry: '',
        sector: '',
        businessModel: 'B2B',
        companyStage: 'Startup',
        companySize: 'Small (2-10)',
        website: '',
        email: '',
        phone: '',
        socialMedia: {}
      },
      missionVisionValues: {
        missionStatement: '',
        visionStatement: '',
        purpose: '',
        coreValues: [],
        companyCulture: {
          workStyle: [],
          communicationStyle: [],
          decisionMaking: '',
          innovationApproach: ''
        },
        brandPersonality: [],
        brandVoice: {
          tone: '',
          style: '',
          examples: []
        }
      },
      productsServices: {
        offerings: [],
        uniqueValueProposition: '',
        competitiveAdvantages: [],
        differentiators: [],
        productRoadmap: []
      },
      targetMarket: {
        totalAddressableMarket: { size: '', description: '' },
        serviceableAddressableMarket: { size: '', description: '' },
        serviceableObtainableMarket: { size: '', percentage: 0, description: '' },
        customerSegments: [],
        idealCustomerProfile: {
          demographics: { industry: [], companySize: [], location: [], revenue: [] },
          psychographics: { painPoints: [], goals: [], challenges: [], motivations: [] },
          behavior: { buyingProcess: '', decisionFactors: [], preferredChannels: [] }
        },
        personas: []
      },
      competitiveLandscape: {
        directCompetitors: [],
        indirectCompetitors: [],
        competitivePositioning: {
          position: '',
          differentiation: [],
          advantages: [],
          threats: []
        },
        marketTrends: [],
        opportunities: [],
        threats: []
      },
      businessOperations: {
        team: {
          size: 0,
          structure: [],
          keyPeople: []
        },
        keyProcesses: [],
        technologyStack: {
          frontend: [],
          backend: [],
          database: [],
          infrastructure: [],
          tools: [],
          integrations: []
        },
        operationalMetrics: []
      },
      financialContext: {
        revenue: {
          model: '',
          currentAnnual: '',
          growth: { rate: 0, period: '' }
        },
        financialHealth: {
          profitability: 'Break-even',
          cashFlow: 'Neutral'
        },
        funding: {
          stage: 'Bootstrapped'
        },
        financialGoals: []
      },
      strategicContext: {
        goals: {
          shortTerm: [],
          longTerm: []
        },
        strategicPriorities: [],
        challenges: [],
        successMetrics: []
      },
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
      completeness: {
        overall: 0,
        sections: {
          foundation: 0,
          missionVisionValues: 0,
          productsServices: 0,
          targetMarket: 0,
          competitiveLandscape: 0,
          businessOperations: 0,
          financialContext: 0,
          strategicContext: 0
        }
      }
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const identityService = IdentityService.getInstance();
