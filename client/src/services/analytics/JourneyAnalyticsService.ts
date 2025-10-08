/**
 * Journey Analytics Service
 * 
 * Tracks user journey patterns and generates insights for the complete lifecycle
 */

import { BaseService } from '../shared/BaseService';
import { callEdgeFunction } from '@/lib/database';
import { logger } from '@/shared/utils/logger';
import type { UserJourneyProgress, JourneyResponse } from '../playbook/JourneyTypes';

export interface JourneyAnalytics {
  userId: string;
  organizationId: string;
  totalJourneysCompleted: number;
  averageCompletionTime: number;
  journeyPatterns: JourneyPattern[];
  skillProgression: SkillProgression[];
  recommendations: JourneyRecommendation[];
  businessImpact: BusinessImpactMetrics;
  nextBestJourney: NextBestJourney;
}

export interface JourneyPattern {
  pattern: string;
  frequency: number;
  confidence: number;
  examples: string[];
}

export interface SkillProgression {
  skill: string;
  currentLevel: number;
  maxLevel: number;
  progressPercentage: number;
  nextMilestone: string;
  relatedJourneys: string[];
}

export interface JourneyRecommendation {
  journeyId: string;
  title: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expectedImpact: string;
  estimatedTime: number;
  prerequisites: string[];
}

export interface BusinessImpactMetrics {
  efficiencyGain: number;
  costSavings: number;
  productivityIncrease: number;
  riskReduction: number;
  innovationScore: number;
}

export interface NextBestJourney {
  journeyId: string;
  title: string;
  confidence: number;
  reasoning: string;
  expectedOutcomes: string[];
  timeToComplete: number;
}

export class JourneyAnalyticsService extends BaseService {
  private readonly EDGE_FUNCTION = 'journey-analytics';

  constructor() {
    super('JourneyAnalyticsService');
  }

  /**
   * Track journey completion and generate analytics
   */
  async trackJourneyCompletion(
    userId: string,
    organizationId: string,
    journeyId: string,
    completionData: {
      duration: number;
      responses: JourneyResponse[];
      maturityAssessment?: any;
    }
  ): Promise<ServiceResponse<void>> {
    return this.executeDbOperation(async () => {
      logger.info('Tracking journey completion for analytics', { userId, journeyId });

      const response = await callEdgeFunction(this.EDGE_FUNCTION, {
        method: 'POST',
        body: {
          action: 'track_completion',
          user_id: userId,
          organization_id: organizationId,
          journey_id: journeyId,
          completion_data: completionData
        }
      });

      if (!response.success) {
        return this.handleError(new Error(response.error || 'Failed to track journey completion'));
      }

      return this.createResponse(undefined);
    }, 'trackJourneyCompletion');
  }

  /**
   * Generate comprehensive analytics for user
   */
  async generateUserAnalytics(
    userId: string,
    organizationId: string
  ): Promise<ServiceResponse<JourneyAnalytics>> {
    return this.executeDbOperation(async () => {
      logger.info('Generating user journey analytics', { userId, organizationId });

      // Get user's journey history
      const historyResponse = await this.getUserJourneyHistory(userId, organizationId);
      if (!historyResponse.success) {
        return this.handleError(new Error('Failed to get journey history'));
      }

      const history = historyResponse.data;
      
      // Generate analytics
      const analytics: JourneyAnalytics = {
        userId,
        organizationId,
        totalJourneysCompleted: history.completedJourneys.length,
        averageCompletionTime: this.calculateAverageCompletionTime(history.completedJourneys),
        journeyPatterns: this.identifyJourneyPatterns(history),
        skillProgression: this.calculateSkillProgression(history),
        recommendations: this.generateRecommendations(history),
        businessImpact: this.calculateBusinessImpact(history),
        nextBestJourney: this.predictNextBestJourney(history)
      };

      return this.createResponse(analytics);
    }, 'generateUserAnalytics');
  }

  /**
   * Get user's journey history
   */
  private async getUserJourneyHistory(
    userId: string,
    organizationId: string
  ): Promise<ServiceResponse<{
    completedJourneys: UserJourneyProgress[];
    responses: JourneyResponse[];
  }>> {
    const response = await callEdgeFunction(this.EDGE_FUNCTION, {
      method: 'POST',
      body: {
        action: 'get_user_history',
        user_id: userId,
        organization_id: organizationId
      }
    });

    if (!response.success) {
      return this.handleError(new Error(response.error || 'Failed to get user history'));
    }

    return this.createResponse(response.data);
  }

  /**
   * Calculate average completion time
   */
  private calculateAverageCompletionTime(journeys: UserJourneyProgress[]): number {
    if (journeys.length === 0) return 0;

    const totalTime = journeys.reduce((sum, journey) => {
      if (journey.completed_at && journey.started_at) {
        const start = new Date(journey.started_at);
        const end = new Date(journey.completed_at);
        return sum + (end.getTime() - start.getTime());
      }
      return sum;
    }, 0);

    return Math.round(totalTime / journeys.length / (1000 * 60 * 60)); // Hours
  }

  /**
   * Identify patterns in user's journey behavior
   */
  private identifyJourneyPatterns(history: {
    completedJourneys: UserJourneyProgress[];
    responses: JourneyResponse[];
  }): JourneyPattern[] {
    const patterns: JourneyPattern[] = [];

    // Pattern 1: Completion speed
    const fastCompletions = history.completedJourneys.filter(j => 
      j.progress_percentage === 100 && 
      j.metadata?.estimated_duration_minutes &&
      j.metadata?.actual_duration_minutes &&
      j.metadata.actual_duration_minutes < j.metadata.estimated_duration_minutes * 0.8
    );

    if (fastCompletions.length > 0) {
      patterns.push({
        pattern: 'Fast Learner',
        frequency: fastCompletions.length,
        confidence: Math.min(0.9, fastCompletions.length / history.completedJourneys.length),
        examples: fastCompletions.map(j => j.template_id)
      });
    }

    // Pattern 2: Consistent completion
    const consistentCompletions = history.completedJourneys.filter(j => 
      j.progress_percentage === 100
    );

    if (consistentCompletions.length > 2) {
      patterns.push({
        pattern: 'High Completion Rate',
        frequency: consistentCompletions.length,
        confidence: Math.min(0.95, consistentCompletions.length / history.completedJourneys.length),
        examples: consistentCompletions.map(j => j.template_id)
      });
    }

    // Pattern 3: Skill progression
    const skillJourneys = history.completedJourneys.filter(j => 
      j.metadata?.complexity === 'beginner' || 
      j.metadata?.complexity === 'intermediate'
    );

    if (skillJourneys.length > 1) {
      patterns.push({
        pattern: 'Skill Builder',
        frequency: skillJourneys.length,
        confidence: 0.8,
        examples: skillJourneys.map(j => j.template_id)
      });
    }

    return patterns;
  }

  /**
   * Calculate skill progression based on completed journeys
   */
  private calculateSkillProgression(history: {
    completedJourneys: UserJourneyProgress[];
    responses: JourneyResponse[];
  }): SkillProgression[] {
    const skills: SkillProgression[] = [];

    // Business Foundation Skills
    const foundationJourneys = history.completedJourneys.filter(j => 
      j.template_id === 'quantum-building-blocks' || 
      j.template_id === 'mvp-onboarding'
    );

    if (foundationJourneys.length > 0) {
      skills.push({
        skill: 'Business Foundation',
        currentLevel: Math.min(5, foundationJourneys.length),
        maxLevel: 5,
        progressPercentage: (foundationJourneys.length / 5) * 100,
        nextMilestone: foundationJourneys.length >= 2 ? 'Advanced Strategy' : 'Complete Core Setup',
        relatedJourneys: ['business-strategy', 'financial-planning']
      });
    }

    // Technical Skills
    const technicalJourneys = history.completedJourneys.filter(j => 
      j.template_id.includes('integration') || 
      j.template_id.includes('automation')
    );

    if (technicalJourneys.length > 0) {
      skills.push({
        skill: 'Technical Implementation',
        currentLevel: Math.min(5, technicalJourneys.length),
        maxLevel: 5,
        progressPercentage: (technicalJourneys.length / 5) * 100,
        nextMilestone: technicalJourneys.length >= 2 ? 'Advanced Automation' : 'Basic Integrations',
        relatedJourneys: ['advanced-automation', 'system-integration']
      });
    }

    // Strategic Skills
    const strategicJourneys = history.completedJourneys.filter(j => 
      j.template_id.includes('strategy') || 
      j.template_id.includes('planning')
    );

    if (strategicJourneys.length > 0) {
      skills.push({
        skill: 'Strategic Planning',
        currentLevel: Math.min(5, strategicJourneys.length),
        maxLevel: 5,
        progressPercentage: (strategicJourneys.length / 5) * 100,
        nextMilestone: strategicJourneys.length >= 2 ? 'Executive Strategy' : 'Basic Planning',
        relatedJourneys: ['executive-strategy', 'growth-planning']
      });
    }

    return skills;
  }

  /**
   * Generate personalized journey recommendations
   */
  private generateRecommendations(history: {
    completedJourneys: UserJourneyProgress[];
    responses: JourneyResponse[];
  }): JourneyRecommendation[] {
    const recommendations: JourneyRecommendation[] = [];

    // Check for missing foundational journeys
    const hasQuantumBlocks = history.completedJourneys.some(j => j.template_id === 'quantum-building-blocks');
    const hasMVP = history.completedJourneys.some(j => j.template_id === 'mvp-onboarding');

    if (!hasQuantumBlocks) {
      recommendations.push({
        journeyId: 'quantum-building-blocks',
        title: 'Quantum Building Blocks Setup',
        reason: 'Essential foundation for business optimization',
        priority: 'critical',
        expectedImpact: 'Establish business foundation and health metrics',
        estimatedTime: 60,
        prerequisites: []
      });
    }

    if (!hasMVP) {
      recommendations.push({
        journeyId: 'mvp-onboarding',
        title: 'MVP Business Setup',
        reason: 'Quick setup to get started with Nexus',
        priority: 'high',
        expectedImpact: 'Basic business profile and core integrations',
        estimatedTime: 10,
        prerequisites: []
      });
    }

    // Recommend next level based on completed journeys
    const completedCount = history.completedJourneys.length;
    
    if (completedCount >= 2) {
      recommendations.push({
        journeyId: 'business-strategy',
        title: 'Business Strategy Development',
        reason: 'Build on your foundation with strategic planning',
        priority: 'medium',
        expectedImpact: 'Clear business direction and growth strategy',
        estimatedTime: 45,
        prerequisites: ['quantum-building-blocks']
      });
    }

    if (completedCount >= 3) {
      recommendations.push({
        journeyId: 'advanced-automation',
        title: 'Advanced Business Automation',
        reason: 'Scale your operations with intelligent automation',
        priority: 'medium',
        expectedImpact: 'Increased efficiency and reduced manual work',
        estimatedTime: 90,
        prerequisites: ['mvp-onboarding']
      });
    }

    return recommendations;
  }

  /**
   * Calculate business impact metrics
   */
  private calculateBusinessImpact(history: {
    completedJourneys: UserJourneyProgress[];
    responses: JourneyResponse[];
  }): BusinessImpactMetrics {
    const completedCount = history.completedJourneys.length;
    
    return {
      efficiencyGain: Math.min(100, completedCount * 15),
      costSavings: Math.min(50000, completedCount * 5000),
      productivityIncrease: Math.min(100, completedCount * 12),
      riskReduction: Math.min(100, completedCount * 8),
      innovationScore: Math.min(100, completedCount * 10)
    };
  }

  /**
   * Predict the next best journey for the user
   */
  private predictNextBestJourney(history: {
    completedJourneys: UserJourneyProgress[];
    responses: JourneyResponse[];
  }): NextBestJourney {
    const completedCount = history.completedJourneys.length;
    const hasQuantumBlocks = history.completedJourneys.some(j => j.template_id === 'quantum-building-blocks');
    const hasMVP = history.completedJourneys.some(j => j.template_id === 'mvp-onboarding');

    // Priority logic based on completion status
    if (!hasQuantumBlocks) {
      return {
        journeyId: 'quantum-building-blocks',
        title: 'Quantum Building Blocks Setup',
        confidence: 0.95,
        reasoning: 'Essential foundation journey not completed',
        expectedOutcomes: ['Business foundation established', 'Health metrics configured', 'Strategic framework ready'],
        timeToComplete: 60
      };
    }

    if (!hasMVP) {
      return {
        journeyId: 'mvp-onboarding',
        title: 'MVP Business Setup',
        confidence: 0.9,
        reasoning: 'Quick setup journey for immediate value',
        expectedOutcomes: ['Basic profile complete', 'Core integrations setup', 'Ready for advanced features'],
        timeToComplete: 10
      };
    }

    if (completedCount >= 2) {
      return {
        journeyId: 'business-strategy',
        title: 'Business Strategy Development',
        confidence: 0.8,
        reasoning: 'Ready for strategic planning based on foundation',
        expectedOutcomes: ['Clear business direction', 'Growth strategy defined', 'Competitive positioning'],
        timeToComplete: 45
      };
    }

    // Default recommendation
    return {
      journeyId: 'advanced-automation',
      title: 'Advanced Business Automation',
      confidence: 0.7,
      reasoning: 'Next logical step for operational efficiency',
      expectedOutcomes: ['Process automation', 'Efficiency gains', 'Scalable operations'],
      timeToComplete: 90
    };
  }
}

// Export singleton instance
export const journeyAnalyticsService = new JourneyAnalyticsService();
