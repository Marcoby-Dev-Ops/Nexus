/**
 * Unified Playbook Service
 * 
 * Single source of truth for all playbook functionality:
 * - Playbook templates (blueprints)
 * - User journeys (active instances)
 * - Onboarding (specialized playbook type)
 * 
 * Eliminates confusion between playbook/journey/onboarding concepts
 */

import { z } from 'zod';
import { BaseService } from '../shared/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { 
  selectData, 
  selectOne, 
  insertOne, 
  updateOne, 
  upsertOne, 
  deleteOne 
} from '@/lib/api-client';

// ============================================================================
// UNIFIED SCHEMAS
// ============================================================================

// Playbook Template Schema
export const PlaybookTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['onboarding', 'business', 'operational', 'strategic', 'tactical']),
  version: z.string(),
  estimatedDuration: z.number(), // minutes
  complexity: z.enum(['beginner', 'intermediate', 'advanced']),
  isActive: z.boolean(),
  steps: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    stepType: z.enum(['introduction', 'form', 'action', 'review', 'completion']),
    isRequired: z.boolean(),
    order: z.number(),
    estimatedDuration: z.number(),
    validationSchema: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional()
  })),
  prerequisites: z.array(z.string()).optional(),
  successMetrics: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// User Journey Schema (Active Instance)
export const UserJourneySchema = z.object({
  id: z.string(),
  userId: z.string(),
  playbookId: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'paused']),
  currentStep: z.number(),
  totalSteps: z.number(),
  progressPercentage: z.number(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  stepResponses: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Step Response Schema
export const StepResponseSchema = z.object({
  id: z.string(),
  journeyId: z.string(),
  stepId: z.string(),
  response: z.record(z.any()),
  completedAt: z.string(),
  metadata: z.record(z.any()).optional()
});

export type PlaybookTemplate = z.infer<typeof PlaybookTemplateSchema>;
export type UserJourney = z.infer<typeof UserJourneySchema>;
export type StepResponse = z.infer<typeof StepResponseSchema>;

// ============================================================================
// ONBOARDING TEMPLATE
// ============================================================================

export const ONBOARDING_PLAYBOOK_ID = 'onboarding-v1';

export const ONBOARDING_TEMPLATE: PlaybookTemplate = {
  id: ONBOARDING_PLAYBOOK_ID,
  name: 'Business Foundation Setup',
  description: 'Complete your business profile to train Nexus AI with your unique context and goals',
  category: 'onboarding',
  version: '1.0.0',
  estimatedDuration: 15,
  complexity: 'beginner',
  isActive: true,
  steps: [
    {
      id: 'welcome-introduction',
      title: 'Welcome to Nexus',
      description: 'Your business transformation journey starts here',
      stepType: 'introduction',
      isRequired: true,
      order: 1,
      estimatedDuration: 2,
      metadata: { component: 'WelcomeStep' }
    },
    {
      id: 'core-identity-priorities',
      title: 'About Your Business',
      description: 'A few simple questions to understand your business better',
      stepType: 'form',
      isRequired: true,
      order: 2,
      estimatedDuration: 5,
      validationSchema: {
        firstName: { type: 'string', required: true, minLength: 1 },
        lastName: { type: 'string', required: true, minLength: 1 },
        email: { type: 'string', required: true, format: 'email' },
        company: { type: 'string', required: true, minLength: 1 },
        industry: { type: 'string', required: true, minLength: 1 },
        companySize: { type: 'string', required: true, minLength: 1 },
        keyPriorities: { type: 'array', required: true, minItems: 1 }
      },
      metadata: { component: 'CoreIdentityStep' }
    },
    {
      id: 'tool-identification',
      title: 'Your Business Tools',
      description: 'Tell us what tools you\'re already using',
      stepType: 'form',
      isRequired: false,
      order: 3,
      estimatedDuration: 3,
      metadata: { component: 'ToolIdentificationStep' }
    },
    {
      id: 'ai-goal-generation',
      title: 'What Do You Want to Achieve?',
      description: 'Based on your business, here are some common goals that help companies grow',
      stepType: 'form',
      isRequired: true,
      order: 4,
      estimatedDuration: 3,
      validationSchema: {
        selectedGoals: { type: 'array', required: true, minItems: 1 },
        maturityScore: { type: 'number', required: true, min: 0, max: 100 }
      },
      metadata: { component: 'AIPoweredGoalsStep' }
    },
    {
      id: 'day-1-insight-preview',
      title: 'Your First Insights',
      description: 'See your personalized dashboard and opportunities',
      stepType: 'review',
      isRequired: true,
      order: 5,
      estimatedDuration: 2,
      metadata: { component: 'DayOneInsightStep' }
    }
  ],
  prerequisites: [],
  successMetrics: [
    'Complete business profile established',
    'Unified brain trained with user context',
    'Personalized AI guidance activated',
    'Business intelligence foundation ready'
  ],
  tags: ['foundation', 'brain-training', 'profile-setup', 'ai-context'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// ============================================================================
// UNIFIED PLAYBOOK SERVICE
// ============================================================================

export class UnifiedPlaybookService extends BaseService {
  private static instance: UnifiedPlaybookService;

  constructor() {
    super('UnifiedPlaybookService');
  }

  public static getInstance(): UnifiedPlaybookService {
    if (!UnifiedPlaybookService.instance) {
      UnifiedPlaybookService.instance = new UnifiedPlaybookService();
    }
    return UnifiedPlaybookService.instance;
  }

  // ============================================================================
  // PLAYBOOK TEMPLATE OPERATIONS
  // ============================================================================

  /**
   * Get all available playbook templates
   */
  async getPlaybookTemplates(): Promise<ServiceResponse<PlaybookTemplate[]>> {
    try {
      // For now, return hardcoded templates
      // TODO: Move to database
      const templates = [ONBOARDING_TEMPLATE];
      
      return this.createSuccessResponse(templates);
    } catch (error) {
      return this.handleError(error, 'get playbook templates');
    }
  }

  /**
   * Get a specific playbook template by ID
   */
  async getPlaybookTemplate(templateId: string): Promise<ServiceResponse<PlaybookTemplate | null>> {
    try {
      if (templateId === ONBOARDING_PLAYBOOK_ID) {
        return this.createSuccessResponse(ONBOARDING_TEMPLATE);
      }
      
      return this.createSuccessResponse(null);
    } catch (error) {
      return this.handleError(error, `get playbook template ${templateId}`);
    }
  }

  // ============================================================================
  // USER JOURNEY OPERATIONS
  // ============================================================================

  /**
   * Start a new journey for a user
   */
  async startJourney(
    userId: string, 
    playbookId: string, 
    metadata?: Record<string, any>
  ): Promise<ServiceResponse<UserJourney>> {
    try {
      // Get playbook template
      const templateResponse = await this.getPlaybookTemplate(playbookId);
      if (!templateResponse.success || !templateResponse.data) {
        return this.createErrorResponse(`Playbook template ${playbookId} not found`);
      }

      const template = templateResponse.data;
      const totalSteps = template.steps.length;

      // Check if user already has an active journey for this playbook
      const existingJourney = await this.getUserJourney(userId, playbookId);
      if (existingJourney.success && existingJourney.data) {
        return this.createSuccessResponse(existingJourney.data);
      }

      // Create new journey
      const journey: UserJourney = {
        id: `${userId}-${playbookId}-${Date.now()}`,
        userId,
        playbookId,
        status: 'not_started',
        currentStep: 1,
        totalSteps,
        progressPercentage: 0,
        stepResponses: {},
        metadata: metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to database
      const { data: savedJourney, error } = await insertOne<UserJourney>(
        'user_journeys',
        journey
      );

      if (error) {
        logger.error('Failed to save journey:', error);
        return this.createErrorResponse('Failed to start journey');
      }

      logger.info('Journey started successfully', { userId, playbookId, journeyId: savedJourney.id });
      return this.createSuccessResponse(savedJourney);
    } catch (error) {
      return this.handleError(error, `start journey for user ${userId}`);
    }
  }

  /**
   * Get user's journey for a specific playbook
   */
  async getUserJourney(userId: string, playbookId: string): Promise<ServiceResponse<UserJourney | null>> {
    try {
      const { data: journey, error } = await selectOne<UserJourney>(
        'user_journeys',
        { userId, playbookId }
      );

      if (error) {
        logger.error('Failed to get user journey:', error);
        return this.createErrorResponse('Failed to get user journey');
      }

      return this.createSuccessResponse(journey);
    } catch (error) {
      return this.handleError(error, `get user journey for user ${userId}`);
    }
  }

  /**
   * Get all user's journeys
   */
  async getUserJourneys(userId: string): Promise<ServiceResponse<UserJourney[]>> {
    try {
      const { data: journeys, error } = await selectData<UserJourney>(
        'user_journeys',
        { userId }
      );

      if (error) {
        logger.error('Failed to get user journeys:', error);
        return this.createErrorResponse('Failed to get user journeys');
      }

      return this.createSuccessResponse(journeys || []);
    } catch (error) {
      return this.handleError(error, `get user journeys for user ${userId}`);
    }
  }

  /**
   * Update journey progress
   */
  async updateJourneyProgress(
    journeyId: string, 
    updates: Partial<UserJourney>
  ): Promise<ServiceResponse<UserJourney>> {
    try {
      const { data: updatedJourney, error } = await updateOne<UserJourney>(
        'user_journeys',
        journeyId,
        {
          ...updates,
          updatedAt: new Date().toISOString()
        }
      );

      if (error) {
        logger.error('Failed to update journey progress:', error);
        return this.createErrorResponse('Failed to update journey progress');
      }

      return this.createSuccessResponse(updatedJourney);
    } catch (error) {
      return this.handleError(error, `update journey progress for journey ${journeyId}`);
    }
  }

  /**
   * Complete a journey step
   */
  async completeStep(
    journeyId: string,
    stepId: string,
    response: Record<string, any>
  ): Promise<ServiceResponse<UserJourney>> {
    try {
      // Get current journey
      const { data: journey, error: journeyError } = await selectOne<UserJourney>(
        'user_journeys',
        { id: journeyId }
      );

      if (journeyError || !journey) {
        return this.createErrorResponse('Journey not found');
      }

      // Save step response
      const stepResponse: StepResponse = {
        id: `${journeyId}-${stepId}-${Date.now()}`,
        journeyId,
        stepId,
        response,
        completedAt: new Date().toISOString()
      };

      const { error: responseError } = await insertOne<StepResponse>(
        'step_responses',
        stepResponse
      );

      if (responseError) {
        logger.error('Failed to save step response:', responseError);
        return this.createErrorResponse('Failed to save step response');
      }

      // Update journey progress
      const newCurrentStep = journey.currentStep + 1;
      const progressPercentage = (newCurrentStep / journey.totalSteps) * 100;
      const status = newCurrentStep > journey.totalSteps ? 'completed' : 'in_progress';

      const updatedStepResponses = {
        ...journey.stepResponses,
        [stepId]: response
      };

      return this.updateJourneyProgress(journeyId, {
        currentStep: newCurrentStep,
        progressPercentage,
        status,
        stepResponses: updatedStepResponses,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined
      });
    } catch (error) {
      return this.handleError(error, `complete step for journey ${journeyId}`);
    }
  }

  // ============================================================================
  // ONBOARDING SPECIALIZED OPERATIONS
  // ============================================================================

  /**
   * Start onboarding for a user
   */
  async startOnboarding(userId: string): Promise<ServiceResponse<UserJourney>> {
    return this.startJourney(userId, ONBOARDING_PLAYBOOK_ID, {
      type: 'onboarding',
      startedAt: new Date().toISOString()
    });
  }

  /**
   * Get user's onboarding status
   */
  async getOnboardingStatus(userId: string): Promise<ServiceResponse<{
    isCompleted: boolean;
    progressPercentage: number;
    currentStep: number;
    totalSteps: number;
    journey?: UserJourney;
  }>> {
    try {
      const journeyResponse = await this.getUserJourney(userId, ONBOARDING_PLAYBOOK_ID);
      
      if (!journeyResponse.success || !journeyResponse.data) {
        return this.createSuccessResponse({
          isCompleted: false,
          progressPercentage: 0,
          currentStep: 0,
          totalSteps: ONBOARDING_TEMPLATE.steps.length
        });
      }

      const journey = journeyResponse.data;
      return this.createSuccessResponse({
        isCompleted: journey.status === 'completed',
        progressPercentage: journey.progressPercentage,
        currentStep: journey.currentStep,
        totalSteps: journey.totalSteps,
        journey
      });
    } catch (error) {
      return this.handleError(error, `get onboarding status for user ${userId}`);
    }
  }

  /**
   * Complete onboarding step
   */
  async completeOnboardingStep(
    userId: string,
    stepId: string,
    data: Record<string, any>
  ): Promise<ServiceResponse<UserJourney>> {
    try {
      // Get user's onboarding journey
      const journeyResponse = await this.getUserJourney(userId, ONBOARDING_PLAYBOOK_ID);
      if (!journeyResponse.success || !journeyResponse.data) {
        return this.createErrorResponse('Onboarding journey not found');
      }

      const journey = journeyResponse.data;

      // Complete the step
      const result = await this.completeStep(journey.id, stepId, data);
      
      // If onboarding is completed, trigger additional actions
      if (result.success && result.data?.status === 'completed') {
        await this.handleOnboardingCompletion(userId, result.data);
      }

      return result;
    } catch (error) {
      return this.handleError(error, `complete onboarding step for user ${userId}`);
    }
  }

  /**
   * Handle onboarding completion
   */
  private async handleOnboardingCompletion(userId: string, journey: UserJourney): Promise<void> {
    try {
      // Update user profile with onboarding data
      const onboardingData = journey.stepResponses;
      
      // TODO: Update user profile, create company, etc.
      logger.info('Onboarding completed', { userId, journeyId: journey.id });
    } catch (error) {
      logger.error('Failed to handle onboarding completion:', error);
    }
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  /**
   * Get journey analytics
   */
  async getJourneyAnalytics(userId: string): Promise<ServiceResponse<{
    totalJourneys: number;
    completedJourneys: number;
    activeJourneys: number;
    averageProgress: number;
  }>> {
    try {
      const journeysResponse = await this.getUserJourneys(userId);
      if (!journeysResponse.success || !journeysResponse.data) {
        return this.createErrorResponse('Failed to get user journeys');
      }

      const journeys = journeysResponse.data;
      const completed = journeys.filter(j => j.status === 'completed');
      const active = journeys.filter(j => j.status === 'in_progress');
      const averageProgress = journeys.length > 0 
        ? journeys.reduce((sum, j) => sum + j.progressPercentage, 0) / journeys.length 
        : 0;

      return this.createSuccessResponse({
        totalJourneys: journeys.length,
        completedJourneys: completed.length,
        activeJourneys: active.length,
        averageProgress
      });
    } catch (error) {
      return this.handleError(error, `get journey analytics for user ${userId}`);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const unifiedPlaybookService = UnifiedPlaybookService.getInstance();

// Legacy exports for backward compatibility
export const playbookService = unifiedPlaybookService;
export const journeyService = unifiedPlaybookService;
