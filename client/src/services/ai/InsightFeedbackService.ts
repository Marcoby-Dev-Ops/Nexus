/**
 * Insight Feedback Service
 * 
 * Handles user feedback on AI-generated insights to improve RAG system recommendations
 * and prevent suggesting already implemented or low-value insights
 */

import { z } from 'zod';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData, insertOne, updateOne } from '@/lib/database';
import { logger } from '@/shared/utils/logger';

// ============================================================================
// SCHEMAS
// ============================================================================

export const InsightFeedbackSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  company_id: z.string().optional(),
  organization_id: z.string().optional(),
  insight_id: z.string(),
  insight_type: z.string(),
  insight_title: z.string(),
  insight_content: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  value_assessment: z.enum(['need_this', 'already_implemented', 'not_applicable']),
  implementation_status: z.enum(['not_started', 'in_progress', 'completed', 'abandoned']).default('not_started'),
  implementation_details: z.string().optional(), // How the user has implemented this (e.g., "through Microsoft 365")
  feedback_comment: z.string().optional(),
  business_context: z.record(z.any()).default({}),
  insight_category: z.string().optional(),
  insight_impact: z.string().optional(),
  insight_confidence: z.number().optional(),
  should_exclude_from_recommendations: z.boolean().default(false),
  exclusion_reason: z.string().optional(),
  learning_applied: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type InsightFeedback = z.infer<typeof InsightFeedbackSchema>;

export const InsightFeedbackResponseSchema = z.object({
  success: z.boolean(),
  data: InsightFeedbackSchema.optional(),
  error: z.string().optional(),
});

// ============================================================================
// INSIGHT FEEDBACK SERVICE
// ============================================================================

export class InsightFeedbackService extends BaseService {
  private readonly tableName = 'insight_feedback';

  constructor() {
    super();
  }

  /**
   * Save feedback for an insight
   */
  async saveFeedback(feedback: Omit<InsightFeedback, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<InsightFeedback>> {
    this.logMethodCall('saveFeedback', { insight_id: feedback.insight_id, user_id: feedback.user_id });

    try {
      // Validate required fields
      if (!feedback.user_id || !feedback.insight_id) {
        return {
          success: false,
          data: null,
          error: 'User ID and Insight ID are required',
        };
      }

      // Determine if this insight should be excluded from recommendations
      const shouldExclude = this.shouldExcludeFromRecommendations(feedback);
      const exclusionReason = shouldExclude ? this.getExclusionReason(feedback) : null;

      const validatedFeedback = {
        ...feedback,
        should_exclude_from_recommendations: shouldExclude,
        exclusion_reason: exclusionReason,
      };

      // Save to database
      const result = await insertOne(this.tableName, validatedFeedback);

      if (result.error) {
        logger.error('Error saving insight feedback:', result.error);
        return {
          success: false,
          data: null,
          error: result.error || 'Failed to save feedback',
        };
      }

      // If this insight should be excluded, update RAG system
      if (shouldExclude) {
        await this.updateRAGSystem(feedback);
      }

      logger.info('Insight feedback saved successfully', {
        insight_id: feedback.insight_id,
        value_assessment: feedback.value_assessment,
        should_exclude: shouldExclude,
      });

      return {
        success: true,
        data: result.data as InsightFeedback,
        error: null,
      };
    } catch (error) {
      logger.error('Error saving insight feedback:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get feedback for a specific insight
   */
  async getFeedbackForInsight(insightId: string, userId: string): Promise<ServiceResponse<InsightFeedback | null>> {
    this.logMethodCall('getFeedbackForInsight', { insightId, userId });

    try {
      const result = await selectData(this.tableName, '*', {
        insight_id: insightId,
        user_id: userId,
      });

      if (result.error) {
        logger.error('Error fetching insight feedback:', result.error);
        return {
          success: false,
          data: null,
          error: result.error || 'Failed to fetch feedback',
        };
      }

      // Return the first matching record or null
      const feedback = result.data && result.data.length > 0 ? result.data[0] : null;

      return {
        success: true,
        data: feedback as InsightFeedback | null,
        error: null,
      };
    } catch (error) {
      logger.error('Error fetching insight feedback:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get all feedback for a user
   */
  async getUserFeedback(userId: string, companyId?: string): Promise<ServiceResponse<InsightFeedback[]>> {
    this.logMethodCall('getUserFeedback', { userId, companyId });

    try {
      const filters: Record<string, any> = { user_id: userId };
      if (companyId) {
        filters.company_id = companyId;
      }

      const result = await selectData(this.tableName, '*', filters);

      if (result.error) {
        logger.error('Error fetching user feedback:', result.error);
        return {
          success: false,
          data: null,
          error: result.error || 'Failed to fetch user feedback',
        };
      }

      return {
        success: true,
        data: result.data as InsightFeedback[],
        error: null,
      };
    } catch (error) {
      logger.error('Error fetching user feedback:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get insights that should be excluded from recommendations for a user
   */
  async getExcludedInsights(userId: string, companyId?: string): Promise<ServiceResponse<string[]>> {
    // Reduced logging for frequently called method

    try {
      // Don't proceed if userId is invalid
      if (!userId || userId === 'unknown' || userId === '') {
        logger.warn('Invalid userId provided to getExcludedInsights', { userId });
        return {
          success: true,
          data: [],
          error: null,
        };
      }

      // Check if user is authenticated before making API call
      const { getAuthentikAuthService } = await import('@/core/auth/authentikAuthServiceInstance.dynamic');
      const authentikAuthService = await getAuthentikAuthService();
      const authResult = await authentikAuthService.isAuthenticated();
      const authenticated = authResult.success && authResult.data;
      
      if (!authenticated) {
        logger.info('User not authenticated, returning empty excluded insights array', { userId });
        return {
          success: true,
          data: [],
          error: null,
        };
      }

      const filters: Record<string, any> = {
        user_id: userId,
        should_exclude_from_recommendations: true,
      };
      // Only add company_id filter if it's a valid UUID (not 'default' or empty)
      if (companyId && companyId !== 'default' && companyId !== '') {
        filters.company_id = companyId;
      }

      const result = await selectData(this.tableName, 'insight_id,exclusion_reason', filters);

      // ApiResponse has data and error properties, but no success property
      if (result.error) {
        // Handle authentication errors gracefully - user might not be authenticated yet
        if (result.error?.includes('401') || 
            result.error?.includes('Unauthorized') || 
            result.error?.includes('Access token required') ||
            result.error?.includes('MISSING_TOKEN')) {
          logger.info('Authentication required for excluded insights, returning empty array', { userId });
          return {
            success: true,
            data: [],
            error: null,
          };
        }
        
        logger.error('Error fetching excluded insights:', result.error);
        return {
          success: false,
          data: null,
          error: result.error || 'Failed to fetch excluded insights',
        };
      }

      const excludedInsights = (result.data as any[] || []).map(item => item.insight_id);

      return {
        success: true,
        data: excludedInsights,
        error: null,
      };
    } catch (error) {
      logger.error('Error fetching excluded insights:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Update implementation status of an insight
   */
  async updateImplementationStatus(
    insightId: string,
    userId: string,
    status: InsightFeedback['implementation_status']
  ): Promise<ServiceResponse<InsightFeedback>> {
    this.logMethodCall('updateImplementationStatus', { insightId, userId, status });

    try {
      // First, get the existing feedback
      const existingFeedback = await this.getFeedbackForInsight(insightId, userId);

      if (!existingFeedback.success || !existingFeedback.data) {
        // Create new feedback if none exists
        return await this.saveFeedback({
          user_id: userId,
          insight_id: insightId,
          insight_type: 'fire_insight',
          insight_title: 'FIRE Insight',
          value_assessment: 'need_this',
          implementation_status: status,
          business_context: {},
          should_exclude_from_recommendations: false,
          learning_applied: false,
        });
      }

      // Update existing feedback
      const result = await updateOne(this.tableName, existingFeedback.data.id!, {
        implementation_status: status,
        updated_at: new Date().toISOString(),
      });

      if (result.error) {
        logger.error('Error updating implementation status:', result.error);
        return {
          success: false,
          data: null,
          error: result.error || 'Failed to update implementation status',
        };
      }

      return {
        success: true,
        data: result.data as InsightFeedback,
        error: null,
      };
    } catch (error) {
      logger.error('Error updating implementation status:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Determine if an insight should be excluded from future recommendations
   */
  private shouldExcludeFromRecommendations(feedback: Omit<InsightFeedback, 'id' | 'created_at' | 'updated_at'>): boolean {
    // Exclude if user marked as "not applicable" or "already implemented"
    if (feedback.value_assessment === 'not_applicable' || feedback.value_assessment === 'already_implemented') {
      return true;
    }

    // Exclude if implementation status is "abandoned"
    if (feedback.implementation_status === 'abandoned') {
      return true;
    }

    // Exclude if user explicitly marked to exclude
    if (feedback.should_exclude_from_recommendations) {
      return true;
    }

    return false;
  }

  /**
   * Get the reason for excluding an insight from recommendations
   */
  private getExclusionReason(feedback: Omit<InsightFeedback, 'id' | 'created_at' | 'updated_at'>): string {
    if (feedback.value_assessment === 'not_applicable') {
      return 'User marked as not applicable to their business';
    }
    if (feedback.value_assessment === 'already_implemented') {
      return 'User has already implemented this insight';
    }
    if (feedback.implementation_status === 'abandoned') {
      return 'User abandoned implementation of this insight';
    }
    if (feedback.should_exclude_from_recommendations) {
      return 'User explicitly requested to exclude from recommendations';
    }
    return 'Unknown exclusion reason';
  }

  /**
   * Update RAG system to exclude this insight from future recommendations
   */
  private async updateRAGSystem(feedback: Omit<InsightFeedback, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      // This would integrate with your RAG system to exclude the insight
      // For now, we'll just log that this should happen
      logger.info('Should update RAG system to exclude insight', {
        insight_id: feedback.insight_id,
        exclusion_reason: this.getExclusionReason(feedback),
      });
    } catch (error) {
      logger.error('Error updating RAG system:', error);
    }
  }

  /**
   * Get analytics on user feedback
   */
  async getFeedbackAnalytics(userId: string, companyId?: string): Promise<ServiceResponse<{
    totalFeedback: number;
    valuableInsights: number;
    implementedInsights: number;
    excludedInsights: number;
    averageRating: number;
    feedbackByType: Record<string, number>;
    feedbackByAssessment: Record<string, number>;
  }>> {
    this.logMethodCall('getFeedbackAnalytics', { userId, companyId });

    try {
      const userFeedback = await this.getUserFeedback(userId, companyId);

      if (!userFeedback.success) {
        return {
          success: false,
          data: null,
          error: userFeedback.error,
        };
      }

      const feedback = userFeedback.data || [];
      const totalFeedback = feedback.length;
      const valuableInsights = feedback.filter(f => f.value_assessment === 'need_this').length;
      const implementedInsights = feedback.filter(f => f.implementation_status === 'completed').length;
      const excludedInsights = feedback.filter(item => item.should_exclude_from_recommendations).length;
      
      const ratings = feedback.filter(f => f.rating !== undefined).map(f => f.rating!);
      const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      const feedbackByType = feedback.reduce((acc, f) => {
        acc[f.insight_type] = (acc[f.insight_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const feedbackByAssessment = feedback.reduce((acc, f) => {
        acc[f.value_assessment] = (acc[f.value_assessment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        success: true,
        data: {
          totalFeedback,
          valuableInsights,
          implementedInsights,
          excludedInsights,
          averageRating,
          feedbackByType,
          feedbackByAssessment,
        },
        error: null,
      };
    } catch (error) {
      logger.error('Error getting feedback analytics:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// Export singleton instance
export const insightFeedbackService = new InsightFeedbackService();
