/**
 * Playbook Hierarchy Service
 * 
 * Integrates the Acts & Chapters hierarchy with the existing playbook system
 * Provides intelligent recommendations based on business stage and completion status
 */

import { 
  PlaybookHierarchyService as HierarchyService,
  type PlaybookAct,
  type PlaybookChapter,
  criticalActs,
  growthChapters
} from '../core/config/playbookHierarchy';
import { businessPlaybooks, type BusinessPlaybook } from '../core/config/businessPlaybooks';
import { NexusAIGatewayService } from '../ai/services/NexusAIGatewayService';

export interface HierarchyRecommendation {
  act: PlaybookAct;
  chapters: PlaybookChapter[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
  estimatedImpact: string;
  timeToComplete: string;
  playbooks: BusinessPlaybook[];
}

export interface BusinessFoundationStatus {
  foundationScore: number;
  optimizationScore: number;
  overallScore: number;
  completedActs: PlaybookAct[];
  missingCritical: PlaybookAct[];
  recommendedChapters: PlaybookChapter[];
  nextSteps: Array<{
    type: 'act' | 'chapter';
    item: PlaybookAct | PlaybookChapter;
    priority: string;
    reasoning: string;
  }>;
}

export class EnhancedPlaybookHierarchyService {
  private aiService: NexusAIGatewayService;

  constructor() {
    this.aiService = new NexusAIGatewayService();
  }

  /**
   * Get comprehensive business foundation status
   */
  async getBusinessFoundationStatus(
    userId: string,
    companyId: string,
    completedPlaybookIds: string[]
  ): Promise<BusinessFoundationStatus> {
    const healthScore = HierarchyService.getBusinessHealthScore(completedPlaybookIds);
    
    const completedActs = criticalActs.filter(act => {
      const hasAllPlaybooks = act.playbookIds.every(playbookId => 
        completedPlaybookIds.includes(playbookId)
      );
      return hasAllPlaybooks;
    });

    const missingCritical = HierarchyService.getMissingCriticalActs(completedPlaybookIds);
    const recommendedChapters = HierarchyService.getRecommendedChapters(completedPlaybookIds);

    // Generate AI-powered next steps
    const nextSteps = await this.generateNextSteps(
      userId,
      companyId,
      completedPlaybookIds,
      missingCritical,
      recommendedChapters
    );

    return {
      foundationScore: healthScore.foundationScore,
      optimizationScore: healthScore.optimizationScore,
      overallScore: healthScore.overallScore,
      completedActs,
      missingCritical,
      recommendedChapters,
      nextSteps
    };
  }

  /**
   * Get personalized hierarchy recommendations
   */
  async getHierarchyRecommendations(
    userId: string,
    companyId: string,
    completedPlaybookIds: string[],
    businessContext?: any
  ): Promise<HierarchyRecommendation[]> {
    const missingActs = HierarchyService.getMissingCriticalActs(completedPlaybookIds);
    const availableChapters = HierarchyService.getRecommendedChapters(completedPlaybookIds);

    const recommendations: HierarchyRecommendation[] = [];

    // Add critical acts first
    for (const act of missingActs) {
      const actPlaybooks = businessPlaybooks.filter(pb => 
        act.playbookIds.includes(pb.id)
      );

      recommendations.push({
        act,
        chapters: [],
        priority: 'critical',
        reasoning: `Missing critical foundation: ${act.title}`,
        estimatedImpact: act.estimatedValue,
        timeToComplete: act.timeToComplete,
        playbooks: actPlaybooks
      });
    }

    // Add recommended chapters
    for (const chapter of availableChapters.slice(0, 5)) { // Limit to top 5
      const chapterPlaybooks = businessPlaybooks.filter(pb => 
        chapter.playbookIds.includes(pb.id)
      );

      const parentAct = criticalActs.find(act => act.id === chapter.actId);
      if (!parentAct) continue;

      recommendations.push({
        act: parentAct,
        chapters: [chapter],
        priority: 'high',
        reasoning: `Optimization opportunity: ${chapter.title}`,
        estimatedImpact: chapter.estimatedValue,
        timeToComplete: chapter.timeToComplete,
        playbooks: chapterPlaybooks
      });
    }

    // Sort by priority and impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Sort by estimated value if same priority
      const aValue = this.extractNumericValue(a.estimatedImpact);
      const bValue = this.extractNumericValue(b.estimatedImpact);
      return bValue - aValue;
    });
  }

  /**
   * Get detailed act information with progress tracking
   */
  getActDetails(
    actId: string,
    completedPlaybookIds: string[]
  ): {
    act: PlaybookAct;
    progress: number;
    completedPlaybooks: BusinessPlaybook[];
    remainingPlaybooks: BusinessPlaybook[];
    chapters: PlaybookChapter[];
    isComplete: boolean;
  } {
    const act = criticalActs.find(a => a.id === actId);
    if (!act) {
      throw new Error(`Act not found: ${actId}`);
    }

    const completedPlaybooks = businessPlaybooks.filter(pb => 
      act.playbookIds.includes(pb.id) && completedPlaybookIds.includes(pb.id)
    );

    const remainingPlaybooks = businessPlaybooks.filter(pb => 
      act.playbookIds.includes(pb.id) && !completedPlaybookIds.includes(pb.id)
    );

    const progress = (completedPlaybooks.length / act.playbookIds.length) * 100;
    const isComplete = progress === 100;

    const chapters = HierarchyService.getChaptersForAct(actId);

    return {
      act,
      progress: Math.round(progress),
      completedPlaybooks,
      remainingPlaybooks,
      chapters,
      isComplete
    };
  }

  /**
   * Get chapter details with prerequisites check
   */
  getChapterDetails(
    chapterId: string,
    completedPlaybookIds: string[]
  ): {
    chapter: PlaybookChapter;
    parentAct: PlaybookAct;
    prerequisitesMet: boolean;
    missingPrerequisites: string[];
    availablePlaybooks: BusinessPlaybook[];
    isAvailable: boolean;
  } {
    const chapter = growthChapters.find(c => c.id === chapterId);
    if (!chapter) {
      throw new Error(`Chapter not found: ${chapterId}`);
    }

    const parentAct = criticalActs.find(act => act.id === chapter.actId);
    if (!parentAct) {
      throw new Error(`Parent act not found: ${chapter.actId}`);
    }

    // Check if parent act is complete
    const parentActComplete = parentAct.playbookIds.every(playbookId => 
      completedPlaybookIds.includes(playbookId)
    );

    // Check prerequisites
    const missingPrerequisites = chapter.prerequisites.filter(prereq => {
      if (prereq === chapter.actId) {
        return !parentActComplete;
      }
      return !completedPlaybookIds.includes(prereq);
    });

    const prerequisitesMet = missingPrerequisites.length === 0;
    const isAvailable = parentActComplete && prerequisitesMet;

    const availablePlaybooks = businessPlaybooks.filter(pb => 
      chapter.playbookIds.includes(pb.id)
    );

    return {
      chapter,
      parentAct,
      prerequisitesMet,
      missingPrerequisites,
      availablePlaybooks,
      isAvailable
    };
  }

  /**
   * Generate AI-powered next steps
   */
  private async generateNextSteps(
    userId: string,
    companyId: string,
    completedPlaybookIds: string[],
    missingCritical: PlaybookAct[],
    recommendedChapters: PlaybookChapter[]
  ): Promise<Array<{
    type: 'act' | 'chapter';
    item: PlaybookAct | PlaybookChapter;
    priority: string;
    reasoning: string;
  }>> {
    const nextSteps: Array<{
      type: 'act' | 'chapter';
      item: PlaybookAct | PlaybookChapter;
      priority: string;
      reasoning: string;
    }> = [];

    // Add critical missing acts first
    for (const act of missingCritical.slice(0, 2)) {
      nextSteps.push({
        type: 'act',
        item: act,
        priority: 'Critical',
        reasoning: `Missing essential foundation: ${act.title}`
      });
    }

    // Add top recommended chapters
    for (const chapter of recommendedChapters.slice(0, 3)) {
      nextSteps.push({
        type: 'chapter',
        item: chapter,
        priority: 'High',
        reasoning: `Optimization opportunity: ${chapter.title}`
      });
    }

    return nextSteps;
  }

  /**
   * Extract numeric value from estimated impact string
   */
  private extractNumericValue(impactString: string): number {
    const match = impactString.match(/\$([\d,]+)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''));
    }
    return 0;
  }

  /**
   * Get business maturity assessment
   */
  getBusinessMaturityAssessment(completedPlaybookIds: string[]): {
    stage: 'foundation' | 'growth' | 'optimization' | 'advanced';
    description: string;
    nextMilestone: string;
    recommendations: string[];
  } {
    const healthScore = HierarchyService.getBusinessHealthScore(completedPlaybookIds);
    
    if (healthScore.foundationScore < 50) {
      return {
        stage: 'foundation',
        description: 'Building essential business foundations',
        nextMilestone: 'Complete critical acts for legal, financial, and operational foundations',
        recommendations: [
          'Focus on completing critical acts first',
          'Prioritize legal and financial infrastructure',
          'Establish basic operational processes'
        ]
      };
    } else if (healthScore.foundationScore < 100) {
      return {
        stage: 'growth',
        description: 'Expanding business capabilities and operations',
        nextMilestone: 'Complete remaining foundation elements and begin optimization',
        recommendations: [
          'Complete any remaining critical acts',
          'Start implementing growth chapters',
          'Focus on revenue and operational efficiency'
        ]
      };
    } else if (healthScore.optimizationScore < 50) {
      return {
        stage: 'optimization',
        description: 'Optimizing and improving business performance',
        nextMilestone: 'Implement advanced optimization strategies',
        recommendations: [
          'Focus on efficiency and optimization chapters',
          'Implement advanced automation and processes',
          'Optimize customer experience and retention'
        ]
      };
    } else {
      return {
        stage: 'advanced',
        description: 'Advanced business operations with continuous improvement',
        nextMilestone: 'Maintain excellence and explore innovation opportunities',
        recommendations: [
          'Focus on innovation and scaling chapters',
          'Explore advanced security and compliance',
          'Consider enterprise-level optimizations'
        ]
      };
    }
  }
}
