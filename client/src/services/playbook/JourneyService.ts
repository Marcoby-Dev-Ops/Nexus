/**
 * Journey Service
 * 
 * Manages lifecycle tracking of playbook execution:
 * - User journeys (active instances of playbook execution)
 * - Step responses (user responses to journey steps)
 * - Journey analytics (completion analytics and insights)
 * - Journey context notes (knowledge enhancements from journeys)
 * 
 * Focus: Tracking the lifecycle of playbook execution, not creating the plans
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
// JOURNEY SCHEMAS
// ============================================================================

// User Journey Schema (Active Instance)
export const UserJourneySchema = z.object({
  id: z.string(),
  userId: z.string(),
  playbookId: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'paused']),
  currentStep: z.number(),
  totalSteps: z.number(),
  progressPercentage: z.number(),
  stepResponses: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
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

// Journey Analytics Schema
export const JourneyAnalyticsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  journeyId: z.string(),
  completionDuration: z.number().optional(), // Duration in minutes
  responseCount: z.number().default(0),
  maturityAssessment: z.record(z.any()).optional(),
  completedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Journey Context Notes Schema
export const JourneyContextNotesSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  journeyId: z.string(),
  stepId: z.string(),
  noteType: z.enum(['insight', 'pattern', 'recommendation', 'learning']),
  title: z.string(),
  content: z.string(),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type UserJourney = z.infer<typeof UserJourneySchema>;
export type StepResponse = z.infer<typeof StepResponseSchema>;
export type JourneyAnalytics = z.infer<typeof JourneyAnalyticsSchema>;
export type JourneyContextNotes = z.infer<typeof JourneyContextNotesSchema>;

// ============================================================================
// JOURNEY SERVICE
// ============================================================================

export class JourneyService extends BaseService {
  private static instance: JourneyService;

  constructor() {
    super('JourneyService');
  }

  public static getInstance(): JourneyService {
    if (!JourneyService.instance) {
      JourneyService.instance = new JourneyService();
    }
    return JourneyService.instance;
  }

  // ============================================================================
  // USER JOURNEY OPERATIONS
  // ============================================================================

  /**
   * Create a new journey instance from a playbook
   */
  async createJourney(
    userId: string,
    playbookId: string,
    totalSteps: number,
    metadata?: Record<string, any>
  ): Promise<ServiceResponse<UserJourney>> {
    try {
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
        startedAt: new Date().toISOString(),
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
        return this.createErrorResponse('Failed to create journey');
      }

      logger.info('Journey created successfully', { userId, playbookId, journeyId: savedJourney.id });
      return this.createSuccessResponse(savedJourney);
    } catch (error) {
      return this.handleError(error, `create journey for user ${userId}`);
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
  // JOURNEY ANALYTICS OPERATIONS
  // ============================================================================

  /**
   * Track journey completion analytics
   */
  async trackJourneyCompletion(
    userId: string,
    organizationId: string,
    journeyId: string,
    completionData: {
      completionDuration?: number;
      responseCount?: number;
      maturityAssessment?: Record<string, any>;
    }
  ): Promise<ServiceResponse<JourneyAnalytics>> {
    try {
      const analytics: JourneyAnalytics = {
        id: `${journeyId}-analytics-${Date.now()}`,
        userId,
        organizationId,
        journeyId,
        completionDuration: completionData.completionDuration,
        responseCount: completionData.responseCount || 0,
        maturityAssessment: completionData.maturityAssessment,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data: savedAnalytics, error } = await insertOne<JourneyAnalytics>(
        'journey_analytics',
        analytics
      );

      if (error) {
        logger.error('Failed to save journey analytics:', error);
        return this.createErrorResponse('Failed to track journey completion');
      }

      logger.info('Journey completion tracked', { userId, journeyId, analyticsId: savedAnalytics.id });
      return this.createSuccessResponse(savedAnalytics);
    } catch (error) {
      return this.handleError(error, `track journey completion for journey ${journeyId}`);
    }
  }

  /**
   * Get journey analytics for a user
   */
  async getJourneyAnalytics(userId: string, organizationId: string): Promise<ServiceResponse<JourneyAnalytics[]>> {
    try {
      const { data: analytics, error } = await selectData<JourneyAnalytics>(
        'journey_analytics',
        { userId, organizationId }
      );

      if (error) {
        logger.error('Failed to get journey analytics:', error);
        return this.createErrorResponse('Failed to get journey analytics');
      }

      return this.createSuccessResponse(analytics || []);
    } catch (error) {
      return this.handleError(error, `get journey analytics for user ${userId}`);
    }
  }

  // ============================================================================
  // JOURNEY CONTEXT NOTES OPERATIONS
  // ============================================================================

  /**
   * Add context note to a journey
   */
  async addContextNote(
    companyId: string,
    journeyId: string,
    stepId: string,
    noteType: 'insight' | 'pattern' | 'recommendation' | 'learning',
    title: string,
    content: string,
    confidence: number,
    metadata?: Record<string, any>
  ): Promise<ServiceResponse<JourneyContextNotes>> {
    try {
      const contextNote: JourneyContextNotes = {
        id: `${journeyId}-${stepId}-note-${Date.now()}`,
        companyId,
        journeyId,
        stepId,
        noteType,
        title,
        content,
        confidence,
        metadata: metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data: savedNote, error } = await insertOne<JourneyContextNotes>(
        'journey_context_notes',
        contextNote
      );

      if (error) {
        logger.error('Failed to save context note:', error);
        return this.createErrorResponse('Failed to add context note');
      }

      logger.info('Context note added', { companyId, journeyId, stepId, noteId: savedNote.id });
      return this.createSuccessResponse(savedNote);
    } catch (error) {
      return this.handleError(error, `add context note for journey ${journeyId}`);
    }
  }

  /**
   * Get context notes for a journey
   */
  async getJourneyContextNotes(companyId: string, journeyId: string): Promise<ServiceResponse<JourneyContextNotes[]>> {
    try {
      const { data: notes, error } = await selectData<JourneyContextNotes>(
        'journey_context_notes',
        { companyId, journeyId }
      );

      if (error) {
        logger.error('Failed to get context notes:', error);
        return this.createErrorResponse('Failed to get context notes');
      }

      return this.createSuccessResponse(notes || []);
    } catch (error) {
      return this.handleError(error, `get context notes for journey ${journeyId}`);
    }
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  /**
   * Get journey summary analytics
   */
  async getJourneySummary(userId: string, organizationId: string): Promise<ServiceResponse<{
    totalJourneys: number;
    completedJourneys: number;
    activeJourneys: number;
    averageCompletionTime: number;
    totalInsights: number;
  }>> {
    try {
      const [journeysResponse, analyticsResponse, notesResponse] = await Promise.all([
        this.getUserJourneys(userId),
        this.getJourneyAnalytics(userId, organizationId),
        this.getJourneyContextNotes(organizationId, '') // Get all notes for company
      ]);

      if (!journeysResponse.success || !analyticsResponse.success || !notesResponse.success) {
        return this.createErrorResponse('Failed to get journey summary data');
      }

      const journeys = journeysResponse.data;
      const analytics = analyticsResponse.data;
      const notes = notesResponse.data;

      const completed = journeys.filter(j => j.status === 'completed');
      const active = journeys.filter(j => j.status === 'in_progress');
      const averageCompletionTime = analytics.length > 0 
        ? analytics.reduce((sum, a) => sum + (a.completionDuration || 0), 0) / analytics.length 
        : 0;

      return this.createSuccessResponse({
        totalJourneys: journeys.length,
        completedJourneys: completed.length,
        activeJourneys: active.length,
        averageCompletionTime,
        totalInsights: notes.length
      });
    } catch (error) {
      return this.handleError(error, `get journey summary for user ${userId}`);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const journeyService = JourneyService.getInstance();
