import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { MentalModelsService } from '@/services/ai/MentalModelsService';
import { FireCycleService } from '@/services/playbook/FireCycleService';
import { BuildingBlocksService } from '@/services/playbook/BuildingBlocksService';
import type { UserContext, FireAnalysis, BuildingBlock, UnifiedResponse } from '@/services/types';

export class UnifiedFrameworkService extends BaseService {
  constructor(
    private mentalModels: MentalModelsService,
    private fireCycle: FireCycleService,
    private buildingBlocks: BuildingBlocksService
  ) {
    super();
  }

  async processUserInput(input: string, userContext: UserContext): Promise<ServiceResponse<UnifiedResponse>> {
    try {
      // Step 1: FIRE Cycle Analysis
      const fireAnalysis = await this.fireCycle.analyzeInput(input);
      
      // Step 2: Apply Mental Models
      const mentalModelInsights = await this.mentalModels.applyToPhase(
        fireAnalysis.phase,
        input,
        userContext
      );
      
      // Step 3: Identify Building Blocks
      const buildingBlocks = await this.buildingBlocks.identifyForContext(
        fireAnalysis.phase,
        mentalModelInsights.data || {},
        userContext
      );
      
      // Step 4: Generate Unified Response
      const response: UnifiedResponse = {
        firePhase: fireAnalysis.phase,
        mentalModelInsights: mentalModelInsights.data || {},
        recommendedBlocks: buildingBlocks.data || [],
        nextActions: this.generateNextActions(fireAnalysis, mentalModelInsights.data || {}, buildingBlocks.data || []),
        successMetrics: this.defineSuccessMetrics(fireAnalysis.phase, buildingBlocks.data || []),
        confidence: fireAnalysis.confidence,
        reasoning: fireAnalysis.reasoning,
        studyPlan: this.generateStudyPlan(fireAnalysis.phase, mentalModelInsights.data || {})
      };

      return this.createResponse(response);
    } catch (error) {
      return this.handleError(error, 'Failed to process user input');
    }
  }

  async getUnifiedInsights(userContext: UserContext): Promise<ServiceResponse<{
    mentalModels: any;
    fireCycleStatus: any;
    buildingBlocks: any;
    recommendations: any;
  }>> {
    try {
      const [mentalModels, fireCycleStatus, buildingBlocks] = await Promise.all([
        this.mentalModels.getAllMentalModels(),
        this.fireCycle.getCurrentStatus(userContext),
        this.buildingBlocks.getAvailableBlocks(userContext)
      ]);

      const recommendations = this.generatePersonalizedRecommendations(
        mentalModels.data,
        fireCycleStatus.data,
        buildingBlocks.data,
        userContext
      );

      return this.createResponse({
        mentalModels: mentalModels.data,
        fireCycleStatus: fireCycleStatus.data,
        buildingBlocks: buildingBlocks.data,
        recommendations
      });
    } catch (error) {
      return this.handleError(error, 'Failed to get unified insights');
    }
  }

  async trackProgress(
    userId: string,
    action: string,
    outcome: 'success' | 'failure' | 'partial',
    metrics: Record<string, number>
  ): Promise<ServiceResponse<any>> {
    try {
      // Track user progress and update learning algorithms
      const progress = await this.updateLearningAlgorithms(userId, action, outcome, metrics);
      return this.createResponse(progress);
    } catch (error) {
      return this.handleError(error, 'Failed to track progress');
    }
  }

  private generateNextActions(
    fireAnalysis: FireAnalysis,
    mentalModels: Record<string, any>,
    blocks: BuildingBlock[]
  ): { immediate: string[]; shortTerm: string[]; longTerm: string[] } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Phase-specific immediate actions
    switch (fireAnalysis.phase) {
      case 'focus':
        immediate.push('Research success patterns from similar organizations');
        immediate.push('Define specific problem statement');
        immediate.push('Identify key success metrics');
        break;
      case 'insight':
        immediate.push('Evaluate risk profile and mitigation strategies');
        immediate.push('Assess current capabilities and gaps');
        immediate.push('Validate assumptions with data');
        break;
      case 'roadmap':
        immediate.push('Create detailed implementation timeline');
        immediate.push('Allocate time and resources');
        immediate.push('Set up progress tracking systems');
        break;
      case 'execute':
        immediate.push('Deploy first building block');
        immediate.push('Monitor initial results');
        immediate.push('Collect feedback and iterate');
        break;
    }

    // Mental model-based actions
    if (mentalModels.successPatternRecognition) {
      shortTerm.push('Study identified success patterns');
      shortTerm.push('Adapt strategies to your context');
    }

    if (mentalModels.riskMinimization) {
      shortTerm.push('Implement risk mitigation strategies');
      shortTerm.push('Set up fallback plans');
    }

    if (mentalModels.timeAllocation) {
      shortTerm.push('Optimize weekly schedule');
      shortTerm.push('Allocate time to high-impact activities');
    }

    if (mentalModels.lowHangingFruit) {
      immediate.push('Execute quick wins first');
      shortTerm.push('Prioritize high-impact, low-effort actions');
    }

    // Building block-based actions
    blocks.forEach(block => {
      if (block.complexity === 'simple') {
        immediate.push(`Implement ${block.name}`);
      } else if (block.complexity === 'medium') {
        shortTerm.push(`Plan and implement ${block.name}`);
      } else {
        longTerm.push(`Research and implement ${block.name}`);
      }
    });

    return { immediate, shortTerm, longTerm };
  }

  private defineSuccessMetrics(phase: string, blocks: BuildingBlock[]): {
    primary: string[];
    secondary: string[];
    tracking: string[];
  } {
    const primary: string[] = [];
    const secondary: string[] = [];
    const tracking: string[] = [];

    // Phase-specific metrics
    switch (phase) {
      case 'focus':
        primary.push('Problem clarity score');
        primary.push('Goal specificity');
        secondary.push('Research completion rate');
        break;
      case 'insight':
        primary.push('Risk assessment accuracy');
        primary.push('Capability gap identification');
        secondary.push('Validation success rate');
        break;
      case 'roadmap':
        primary.push('Timeline adherence');
        primary.push('Resource allocation efficiency');
        secondary.push('Planning completeness');
        break;
      case 'execute':
        primary.push('Implementation success rate');
        primary.push('Outcome achievement');
        secondary.push('Feedback quality');
        break;
    }

    // Building block metrics
    blocks.forEach(block => {
      tracking.push(...block.successMetrics);
    });

    return { primary, secondary, tracking };
  }

  private generateStudyPlan(phase: string, mentalModels: Record<string, any>): {
    researchTasks: string[];
    implementationSteps: string[];
    timeline: Record<string, string[]>;
  } {
    const researchTasks: string[] = [];
    const implementationSteps: string[] = [];
    const timeline: Record<string, string[]> = {
      week1: [],
      week2: [],
      week3: [],
      week4: []
    };

    if (mentalModels.successPatternRecognition) {
      const patterns = mentalModels.successPatternRecognition as any[];
      patterns.forEach(pattern => {
        researchTasks.push(`Study ${pattern.organization}'s approach to ${pattern.problemSolved}`);
        researchTasks.push(`Analyze ${pattern.organization}'s success factors`);
        implementationSteps.push(`Adapt ${pattern.adaptationStrategy}`);
      });
    }

    if (mentalModels.timeAllocation) {
      const timeAllocation = mentalModels.timeAllocation as any;
      Object.entries(timeAllocation.weeklySchedule || {}).forEach(([day, tasks]) => {
        if (day === 'monday') timeline.week1.push(...(tasks as string[]));
        if (day === 'tuesday') timeline.week1.push(...(tasks as string[]));
        if (day === 'wednesday') timeline.week2.push(...(tasks as string[]));
        if (day === 'thursday') timeline.week2.push(...(tasks as string[]));
        if (day === 'friday') timeline.week2.push(...(tasks as string[]));
        if (day === 'saturday') timeline.week3.push(...(tasks as string[]));
        if (day === 'sunday') timeline.week3.push(...(tasks as string[]));
      });
    }

    return { researchTasks, implementationSteps, timeline };
  }

  private generatePersonalizedRecommendations(
    mentalModels: any,
    fireCycleStatus: any,
    buildingBlocks: any,
    userContext: UserContext
  ): any {
    const recommendations = {
      mentalModels: [] as string[],
      buildingBlocks: [] as string[],
      learningPath: [] as string[],
      timeOptimization: [] as string[]
    };

    // Experience-based recommendations
    if (userContext.experienceLevel === 'beginner') {
      recommendations.mentalModels.push('Start with Success Pattern Recognition');
      recommendations.mentalModels.push('Focus on Risk Minimization');
      recommendations.buildingBlocks.push('Begin with simple, low-risk components');
    } else if (userContext.experienceLevel === 'intermediate') {
      recommendations.mentalModels.push('Apply Time Allocation principles');
      recommendations.mentalModels.push('Implement Low-Hanging Fruit strategy');
      recommendations.buildingBlocks.push('Add medium-complexity components');
    } else {
      recommendations.mentalModels.push('Master all mental models');
      recommendations.mentalModels.push('Optimize for maximum impact');
      recommendations.buildingBlocks.push('Implement advanced, high-impact components');
    }

    // Time-based recommendations
    if (userContext.availableTime < 10) {
      recommendations.timeOptimization.push('Focus on quick wins only');
      recommendations.timeOptimization.push('Use no-code tools and templates');
    } else if (userContext.availableTime < 20) {
      recommendations.timeOptimization.push('Balance quick wins with strategic initiatives');
      recommendations.timeOptimization.push('Partner with experts for complex tasks');
    } else {
      recommendations.timeOptimization.push('Full implementation of all frameworks');
      recommendations.timeOptimization.push('Deep learning and optimization');
    }

    return recommendations;
  }

  private async updateLearningAlgorithms(
    userId: string,
    action: string,
    outcome: 'success' | 'failure' | 'partial',
    metrics: Record<string, number>
  ): Promise<any> {
    // Update learning algorithms based on user outcomes
    // This would integrate with your existing learning system
    return {
      userId,
      action,
      outcome,
      metrics,
      updatedAt: new Date().toISOString(),
      learningInsights: this.generateLearningInsights(action, outcome, metrics)
    };
  }

  private generateLearningInsights(
    action: string,
    outcome: 'success' | 'failure' | 'partial',
    metrics: Record<string, number>
  ): string[] {
    const insights: string[] = [];

    if (outcome === 'success') {
      insights.push('Action was effective - consider scaling up');
      insights.push('Mental models applied successfully');
    } else if (outcome === 'failure') {
      insights.push('Action needs adjustment - review mental models');
      insights.push('Consider alternative approaches');
    } else {
      insights.push('Partial success - iterate and improve');
      insights.push('Refine implementation strategy');
    }

    return insights;
  }
}
