/**
 * Journey Management Service
 * 
 * Handles journey selection, updating, and completion operations
 * using the same patterns as other Nexus services.
 */

import { BaseService } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { callEdgeFunction } from '@/lib/database';

export interface JourneyType {
  id: string;
  name: string;
  description: string;
  category: 'startup' | 'growth' | 'optimization' | 'transformation' | 'specialized';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  prerequisites: string[];
  outcomes: string[];
  milestones: JourneyMilestone[];
}

export interface JourneyMilestone {
  id: string;
  name: string;
  description: string;
  order: number;
  estimatedDuration: string;
  dependencies: string[];
  deliverables: string[];
  successCriteria: string[];
}

export interface JourneyInstance {
  id: string;
  typeId: string;
  userId: string;
  organizationId: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
  progress: number;
  startDate: string;
  targetEndDate?: string;
  actualEndDate?: string;
  goals: string[];
  customMilestones: JourneyMilestone[];
  completedMilestones: string[];
  conversation: JourneyConversation[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyConversation {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: Record<string, any>;
}

export interface JourneyPreferences {
  goals: string[];
  industry?: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  timeline: string;
  resources: string[];
  constraints?: string[];
}

export interface JourneyUpdate {
  goals?: string[];
  milestones?: Partial<JourneyMilestone>[];
  timeline?: string;
  status?: JourneyInstance['status'];
  metadata?: Record<string, any>;
}

export interface JourneyCompletion {
  achievements: string[];
  outcomes: string[];
  learnings: string[];
  nextSteps: string[];
  metrics?: Record<string, any>;
}

export class JourneyManagementService extends BaseService {
  constructor() {
    super('JourneyManagementService');
  }

  /**
   * Get available journey types
   */
  async getJourneyTypes(): Promise<ServiceResponse<JourneyType[]>> {
    try {
      const response = await callEdgeFunction('get_journey_types');
      
      if (!response.success) {
        return this.handleError('Failed to fetch journey types', response.error);
      }

      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error fetching journey types', error);
    }
  }

  /**
   * Get journey recommendations based on user preferences
   */
  async getJourneyRecommendations(preferences: JourneyPreferences): Promise<ServiceResponse<JourneyType[]>> {
    try {
      const response = await callEdgeFunction('get_journey_recommendations', {
        preferences
      });
      
      if (!response.success) {
        return this.handleError('Failed to get journey recommendations', response.error);
      }

      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error getting journey recommendations', error);
    }
  }

  /**
   * Create a new journey instance
   */
  async createJourney(
    typeId: string, 
    preferences: JourneyPreferences,
    customName?: string
  ): Promise<ServiceResponse<JourneyInstance>> {
    try {
      const response = await callEdgeFunction('create_journey', {
        typeId,
        preferences,
        customName
      });
      
      if (!response.success) {
        return this.handleError('Failed to create journey', response.error);
      }

      logger.info('Journey created successfully', { journeyId: response.data.id, typeId });
      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error creating journey', error);
    }
  }

  /**
   * Get journey instance by ID
   */
  async getJourney(journeyId: string): Promise<ServiceResponse<JourneyInstance>> {
    try {
      const response = await callEdgeFunction('get_journey', {
        journeyId
      });
      
      if (!response.success) {
        return this.handleError('Failed to fetch journey', response.error);
      }

      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error fetching journey', error);
    }
  }

  /**
   * Get user's active journeys
   */
  async getUserJourneys(userId: string, status?: JourneyInstance['status']): Promise<ServiceResponse<JourneyInstance[]>> {
    try {
      const response = await callEdgeFunction('get_user_journeys', {
        userId,
        status
      });
      
      if (!response.success) {
        return this.handleError('Failed to fetch user journeys', response.error);
      }

      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error fetching user journeys', error);
    }
  }

  /**
   * Update journey instance
   */
  async updateJourney(journeyId: string, updates: JourneyUpdate): Promise<ServiceResponse<JourneyInstance>> {
    try {
      const response = await callEdgeFunction('update_journey', {
        journeyId,
        updates
      });
      
      if (!response.success) {
        return this.handleError('Failed to update journey', response.error);
      }

      logger.info('Journey updated successfully', { journeyId, updates });
      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error updating journey', error);
    }
  }

  /**
   * Complete journey instance
   */
  async completeJourney(journeyId: string, completion: JourneyCompletion): Promise<ServiceResponse<JourneyInstance>> {
    try {
      const response = await callEdgeFunction('complete_journey', {
        journeyId,
        completion
      });
      
      if (!response.success) {
        return this.handleError('Failed to complete journey', response.error);
      }

      logger.info('Journey completed successfully', { journeyId, completion });
      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error completing journey', error);
    }
  }

  /**
   * Pause journey instance
   */
  async pauseJourney(journeyId: string, reason?: string): Promise<ServiceResponse<JourneyInstance>> {
    try {
      const response = await callEdgeFunction('pause_journey', {
        journeyId,
        reason
      });
      
      if (!response.success) {
        return this.handleError('Failed to pause journey', response.error);
      }

      logger.info('Journey paused', { journeyId, reason });
      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error pausing journey', error);
    }
  }

  /**
   * Resume journey instance
   */
  async resumeJourney(journeyId: string): Promise<ServiceResponse<JourneyInstance>> {
    try {
      const response = await callEdgeFunction('resume_journey', {
        journeyId
      });
      
      if (!response.success) {
        return this.handleError('Failed to resume journey', response.error);
      }

      logger.info('Journey resumed', { journeyId });
      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error resuming journey', error);
    }
  }

  /**
   * Abandon journey instance
   */
  async abandonJourney(journeyId: string, reason?: string): Promise<ServiceResponse<JourneyInstance>> {
    try {
      const response = await callEdgeFunction('abandon_journey', {
        journeyId,
        reason
      });
      
      if (!response.success) {
        return this.handleError('Failed to abandon journey', response.error);
      }

      logger.info('Journey abandoned', { journeyId, reason });
      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error abandoning journey', error);
    }
  }

  /**
   * Add conversation message to journey
   */
  async addJourneyConversation(
    journeyId: string, 
    conversation: Omit<JourneyConversation, 'id' | 'timestamp'>
  ): Promise<ServiceResponse<JourneyConversation>> {
    try {
      const response = await callEdgeFunction('add_journey_conversation', {
        journeyId,
        conversation
      });
      
      if (!response.success) {
        return this.handleError('Failed to add conversation', response.error);
      }

      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error adding conversation', error);
    }
  }

  /**
   * Get journey analytics
   */
  async getJourneyAnalytics(journeyId: string): Promise<ServiceResponse<any>> {
    try {
      const response = await callEdgeFunction('get_journey_analytics', {
        journeyId
      });
      
      if (!response.success) {
        return this.handleError('Failed to fetch journey analytics', response.error);
      }

      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error fetching journey analytics', error);
    }
  }

  /**
   * Get journey insights and recommendations
   */
  async getJourneyInsights(journeyId: string): Promise<ServiceResponse<any>> {
    try {
      const response = await callEdgeFunction('get_journey_insights', {
        journeyId
      });
      
      if (!response.success) {
        return this.handleError('Failed to fetch journey insights', response.error);
      }

      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error fetching journey insights', error);
    }
  }

  /**
   * Export journey data
   */
  async exportJourney(journeyId: string, format: 'pdf' | 'json' | 'csv' = 'json'): Promise<ServiceResponse<any>> {
    try {
      const response = await callEdgeFunction('export_journey', {
        journeyId,
        format
      });
      
      if (!response.success) {
        return this.handleError('Failed to export journey', response.error);
      }

      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error exporting journey', error);
    }
  }
}

// Export singleton instance
export const journeyManagementService = new JourneyManagementService();
