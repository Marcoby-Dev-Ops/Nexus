/**
 * Nexus Universe Configuration
 * 
 * This defines the complete "laws of physics" for the Nexus business gaming universe.
 * Users sign up and level up their real businesses through the 7 building blocks
 * and FIRE philosophy, creating measurable business outcomes.
 */

import { businessPlaybooks } from './businessPlaybooks';
import { criticalActs, growthChapters, PlaybookHierarchyService } from './playbookHierarchy';
import { playerTiers, growthStages, progressionMilestones, BusinessProgressionService } from './businessProgressionSystem';

/**
 * The 7 Quantum Building Blocks of Business
 * These are the core attributes that determine business success and progression
 */
export interface QuantumBuildingBlock {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'foundation' | 'growth' | 'optimization';
  
  // Core metrics that define this building block
  metrics: BusinessMetric[];
  
  // Related playbooks and activities
  relatedPlaybooks: string[];
  
  // Progression milestones
  milestones: BuildingBlockMilestone[];
  
  // Impact on overall business rating
  weightInOverallRating: number; // 0-1, total should equal 1
}

export interface BusinessMetric {
  id: string;
  name: string;
  description: string;
  unit: string;
  target: number;
  current: number;
  trend: 'up' | 'down' | 'stable';
  dataSource: 'manual' | 'integration' | 'calculated';
  updateFrequency: 'real-time' | 'daily' | 'weekly' | 'monthly';
}

export interface BuildingBlockMilestone {
  id: string;
  name: string;
  description: string;
  requirement: string;
  reward: {
    type: 'attribute_boost' | 'unlock' | 'badge' | 'experience';
    value: string;
  };
  isCompleted: boolean;
}

/**
 * FIRE Philosophy Implementation
 * Focus, Insight, Roadmap, Execute - the methodology for determining what matters
 */
export interface FIREPhase {
  id: 'focus' | 'insight' | 'roadmap' | 'execute';
  name: string;
  description: string;
  icon: string;
  color: string;
  
  // Activities and playbooks for this phase
  activities: FIREActivity[];
  
  // Success criteria
  successCriteria: string[];
  
  // Next phase triggers
  nextPhaseTriggers: string[];
}

export interface FIREActivity {
  id: string;
  name: string;
  description: string;
  type: 'assessment' | 'analysis' | 'planning' | 'implementation';
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  buildingBlock: string;
  playbookId?: string;
  isCompleted: boolean;
}

/**
 * Nexus Universe Configuration
 */
export const nexusUniverse = {
  // The 7 Quantum Building Blocks
  buildingBlocks: [
    {
      id: 'identity',
      name: 'Business Identity',
      description: 'Clear brand, mission, vision, and market positioning',
      icon: '🎯',
      color: '#3B82F6',
      category: 'foundation',
      metrics: [
        {
          id: 'brand-clarity',
          name: 'Brand Clarity Score',
          description: 'How clearly defined your brand identity is',
          unit: 'score',
          target: 90,
          current: 65,
          trend: 'up',
          dataSource: 'manual',
          updateFrequency: 'weekly'
        },
        {
          id: 'market-positioning',
          name: 'Market Positioning Strength',
          description: 'How well positioned you are in your market',
          unit: 'score',
          target: 85,
          current: 70,
          trend: 'stable',
          dataSource: 'manual',
          updateFrequency: 'monthly'
        }
      ],
      relatedPlaybooks: ['define-business-identity', 'market-research', 'brand-strategy'],
      milestones: [
        {
          id: 'identity-foundation',
          name: 'Identity Foundation',
          description: 'Complete basic business identity setup',
          requirement: 'Complete 3 identity-related playbooks',
          reward: { type: 'attribute_boost', value: '+10 Identity Score' },
          isCompleted: false
        }
      ],
      weightInOverallRating: 0.15
    },
    {
      id: 'revenue',
      name: 'Revenue Generation',
      description: 'Sales, pricing, and revenue optimization strategies',
      icon: '💰',
      color: '#10B981',
      category: 'growth',
      metrics: [
        {
          id: 'monthly-recurring-revenue',
          name: 'Monthly Recurring Revenue',
          description: 'Predictable monthly revenue from subscriptions',
          unit: 'USD',
          target: 50000,
          current: 25000,
          trend: 'up',
          dataSource: 'integration',
          updateFrequency: 'real-time'
        },
        {
          id: 'customer-acquisition-cost',
          name: 'Customer Acquisition Cost',
          description: 'Cost to acquire a new customer',
          unit: 'USD',
          target: 100,
          current: 150,
          trend: 'down',
          dataSource: 'calculated',
          updateFrequency: 'weekly'
        }
      ],
      relatedPlaybooks: ['sales-process-optimization', 'pricing-strategy', 'customer-acquisition'],
      milestones: [
        {
          id: 'revenue-breakthrough',
          name: 'Revenue Breakthrough',
          description: 'Achieve 50% revenue growth in a quarter',
          requirement: 'Increase MRR by 50% in 90 days',
          reward: { type: 'badge', value: 'Revenue Champion' },
          isCompleted: false
        }
      ],
      weightInOverallRating: 0.20
    },
    {
      id: 'operations',
      name: 'Operations Excellence',
      description: 'Process efficiency, automation, and operational scalability',
      icon: '⚙️',
      color: '#F59E0B',
      category: 'optimization',
      metrics: [
        {
          id: 'operational-efficiency',
          name: 'Operational Efficiency Score',
          description: 'Overall efficiency of business operations',
          unit: 'score',
          target: 85,
          current: 72,
          trend: 'up',
          dataSource: 'calculated',
          updateFrequency: 'weekly'
        },
        {
          id: 'automation-coverage',
          name: 'Automation Coverage',
          description: 'Percentage of processes that are automated',
          unit: 'percentage',
          target: 80,
          current: 45,
          trend: 'up',
          dataSource: 'manual',
          updateFrequency: 'monthly'
        }
      ],
      relatedPlaybooks: ['process-automation', 'operational-scaling', 'efficiency-audit'],
      milestones: [
        {
          id: 'automation-master',
          name: 'Automation Master',
          description: 'Automate 80% of repeatable processes',
          requirement: 'Achieve 80% automation coverage',
          reward: { type: 'unlock', value: 'Advanced Automation Tools' },
          isCompleted: false
        }
      ],
      weightInOverallRating: 0.15
    },
    {
      id: 'finance',
      name: 'Financial Management',
      description: 'Accounting, cash flow, and financial planning',
      icon: '📊',
      color: '#8B5CF6',
      category: 'foundation',
      metrics: [
        {
          id: 'cash-flow-ratio',
          name: 'Cash Flow Ratio',
          description: 'Ratio of cash inflows to outflows',
          unit: 'ratio',
          target: 1.5,
          current: 1.2,
          trend: 'up',
          dataSource: 'integration',
          updateFrequency: 'daily'
        },
        {
          id: 'profit-margin',
          name: 'Profit Margin',
          description: 'Net profit as percentage of revenue',
          unit: 'percentage',
          target: 25,
          current: 18,
          trend: 'up',
          dataSource: 'integration',
          updateFrequency: 'weekly'
        }
      ],
      relatedPlaybooks: ['financial-planning', 'cash-flow-management', 'cost-optimization'],
      milestones: [
        {
          id: 'financial-freedom',
          name: 'Financial Freedom',
          description: 'Achieve 25% profit margin consistently',
          requirement: 'Maintain 25% profit margin for 3 months',
          reward: { type: 'attribute_boost', value: '+15 Finance Score' },
          isCompleted: false
        }
      ],
      weightInOverallRating: 0.15
    },
    {
      id: 'team',
      name: 'Team & Culture',
      description: 'Hiring, leadership, and organizational culture',
      icon: '👥',
      color: '#EF4444',
      category: 'growth',
      metrics: [
        {
          id: 'employee-satisfaction',
          name: 'Employee Satisfaction',
          description: 'Overall team satisfaction and engagement',
          unit: 'score',
          target: 85,
          current: 78,
          trend: 'up',
          dataSource: 'manual',
          updateFrequency: 'monthly'
        },
        {
          id: 'team-productivity',
          name: 'Team Productivity',
          description: 'Overall team output and efficiency',
          unit: 'score',
          target: 90,
          current: 82,
          trend: 'up',
          dataSource: 'calculated',
          updateFrequency: 'weekly'
        }
      ],
      relatedPlaybooks: ['hiring-process', 'team-culture', 'leadership-development'],
      milestones: [
        {
          id: 'dream-team',
          name: 'Dream Team',
          description: 'Build a high-performing team of 10+ people',
          requirement: 'Have 10+ employees with 85%+ satisfaction',
          reward: { type: 'badge', value: 'Team Builder' },
          isCompleted: false
        }
      ],
      weightInOverallRating: 0.10
    },
    {
      id: 'innovation',
      name: 'Innovation & Growth',
      description: 'Product development, market expansion, and innovation',
      icon: '🚀',
      color: '#06B6D4',
      category: 'growth',
      metrics: [
        {
          id: 'innovation-pipeline',
          name: 'Innovation Pipeline',
          description: 'Number of new products/features in development',
          unit: 'count',
          target: 5,
          current: 3,
          trend: 'up',
          dataSource: 'manual',
          updateFrequency: 'weekly'
        },
        {
          id: 'market-expansion',
          name: 'Market Expansion',
          description: 'Number of new markets entered',
          unit: 'count',
          target: 3,
          current: 1,
          trend: 'stable',
          dataSource: 'manual',
          updateFrequency: 'monthly'
        }
      ],
      relatedPlaybooks: ['product-development', 'market-expansion', 'innovation-strategy'],
      milestones: [
        {
          id: 'innovation-leader',
          name: 'Innovation Leader',
          description: 'Launch 3 new products in a year',
          requirement: 'Successfully launch 3 new products',
          reward: { type: 'unlock', value: 'Advanced Innovation Tools' },
          isCompleted: false
        }
      ],
      weightInOverallRating: 0.10
    },
    {
      id: 'resilience',
      name: 'Business Resilience',
      description: 'Risk management, compliance, and business continuity',
      icon: '🛡️',
      color: '#84CC16',
      category: 'foundation',
      metrics: [
        {
          id: 'risk-mitigation',
          name: 'Risk Mitigation Score',
          description: 'How well risks are identified and mitigated',
          unit: 'score',
          target: 90,
          current: 75,
          trend: 'up',
          dataSource: 'manual',
          updateFrequency: 'monthly'
        },
        {
          id: 'compliance-score',
          name: 'Compliance Score',
          description: 'Adherence to industry regulations and standards',
          unit: 'score',
          target: 95,
          current: 88,
          trend: 'up',
          dataSource: 'manual',
          updateFrequency: 'monthly'
        }
      ],
      relatedPlaybooks: ['risk-management', 'compliance-framework', 'business-continuity'],
      milestones: [
        {
          id: 'resilience-champion',
          name: 'Resilience Champion',
          description: 'Achieve 90%+ risk mitigation and compliance',
          requirement: 'Maintain 90%+ in both risk and compliance scores',
          reward: { type: 'badge', value: 'Resilience Champion' },
          isCompleted: false
        }
      ],
      weightInOverallRating: 0.15
    }
  ],

  // FIRE Philosophy Phases
  firePhases: [
    {
      id: 'focus',
      name: 'Focus',
      description: 'Identify what truly matters for your business success',
      icon: '🎯',
      color: '#3B82F6',
      activities: [
        {
          id: 'business-assessment',
          name: 'Business Assessment',
          description: 'Evaluate current state across all building blocks',
          type: 'assessment',
          estimatedTime: '2 hours',
          difficulty: 'medium',
          buildingBlock: 'identity',
          isCompleted: false
        },
        {
          id: 'priority-identification',
          name: 'Priority Identification',
          description: 'Identify top 3 priorities for immediate focus',
          type: 'analysis',
          estimatedTime: '1 hour',
          difficulty: 'easy',
          buildingBlock: 'identity',
          isCompleted: false
        }
      ],
      successCriteria: [
        'Clear understanding of current business state',
        'Identified top 3 priorities',
        'Aligned team on focus areas'
      ],
      nextPhaseTriggers: [
        'Complete business assessment',
        'Define top 3 priorities',
        'Team alignment achieved'
      ]
    },
    {
      id: 'insight',
      name: 'Insight',
      description: 'Gain deep understanding of opportunities and challenges',
      icon: '🔍',
      color: '#10B981',
      activities: [
        {
          id: 'data-analysis',
          name: 'Data Analysis',
          description: 'Analyze key metrics and performance data',
          type: 'analysis',
          estimatedTime: '3 hours',
          difficulty: 'medium',
          buildingBlock: 'finance',
          isCompleted: false
        },
        {
          id: 'market-research',
          name: 'Market Research',
          description: 'Research market opportunities and competitive landscape',
          type: 'analysis',
          estimatedTime: '4 hours',
          difficulty: 'hard',
          buildingBlock: 'revenue',
          isCompleted: false
        }
      ],
      successCriteria: [
        'Data-driven insights identified',
        'Market opportunities mapped',
        'Root causes of challenges understood'
      ],
      nextPhaseTriggers: [
        'Complete data analysis',
        'Market research finished',
        'Insights documented'
      ]
    },
    {
      id: 'roadmap',
      name: 'Roadmap',
      description: 'Create clear action plan with milestones and timelines',
      icon: '🗺️',
      color: '#F59E0B',
      activities: [
        {
          id: 'action-planning',
          name: 'Action Planning',
          description: 'Create detailed action plan with specific steps',
          type: 'planning',
          estimatedTime: '2 hours',
          difficulty: 'medium',
          buildingBlock: 'operations',
          isCompleted: false
        },
        {
          id: 'milestone-setting',
          name: 'Milestone Setting',
          description: 'Define key milestones and success metrics',
          type: 'planning',
          estimatedTime: '1 hour',
          difficulty: 'easy',
          buildingBlock: 'operations',
          isCompleted: false
        }
      ],
      successCriteria: [
        'Clear action plan created',
        'Milestones and timelines defined',
        'Success metrics established'
      ],
      nextPhaseTriggers: [
        'Action plan completed',
        'Milestones defined',
        'Team commitment secured'
      ]
    },
    {
      id: 'execute',
      name: 'Execute',
      description: 'Implement the plan with continuous monitoring and adjustment',
      icon: '⚡',
      color: '#EF4444',
      activities: [
        {
          id: 'implementation',
          name: 'Implementation',
          description: 'Execute the action plan with regular check-ins',
          type: 'implementation',
          estimatedTime: 'Ongoing',
          difficulty: 'hard',
          buildingBlock: 'operations',
          isCompleted: false
        },
        {
          id: 'progress-monitoring',
          name: 'Progress Monitoring',
          description: 'Track progress and adjust as needed',
          type: 'implementation',
          estimatedTime: 'Weekly',
          difficulty: 'medium',
          buildingBlock: 'finance',
          isCompleted: false
        }
      ],
      successCriteria: [
        'Action plan being executed',
        'Progress being tracked',
        'Adjustments made as needed'
      ],
      nextPhaseTriggers: [
        'Implementation started',
        'Progress tracking established',
        'First results achieved'
      ]
    }
  ],

  // Platform Features Integration
  platformFeatures: [
    {
      id: 'ai-coaching',
      name: 'AI Business Coach',
      description: '24/7 personalized guidance and recommendations',
      icon: '🤖',
      buildingBlock: 'all',
      impact: 'Accelerates progress across all building blocks'
    },
    {
      id: 'playbook-system',
      name: 'Proven Playbooks',
      description: 'Step-by-step guides for business improvement',
      icon: '📚',
      buildingBlock: 'all',
      impact: 'Provides structured approach to building block development'
    },
    {
      id: 'integration-hub',
      name: 'Integration Hub',
      description: 'Connect tools and automate data flow',
      icon: '🔗',
      buildingBlock: 'operations',
      impact: 'Improves operational efficiency and data accuracy'
    },
    {
      id: 'progress-tracking',
      name: 'Progress Tracking',
      description: 'Real-time monitoring of business metrics',
      icon: '📈',
      buildingBlock: 'all',
      impact: 'Provides visibility into building block development'
    },
    {
      id: 'community',
      name: 'Business Community',
      description: 'Connect with other business owners',
      icon: '👥',
      buildingBlock: 'team',
      impact: 'Provides support and learning opportunities'
    }
  ]
};

/**
 * Nexus Universe Service
 * Manages the complete business gaming experience
 */
export class NexusUniverseService {
  /**
   * Calculate overall business rating based on building blocks
   */
  static calculateOverallRating(buildingBlockScores: Record<string, number>): number {
    let totalScore = 0;
    let totalWeight = 0;

    nexusUniverse.buildingBlocks.forEach(block => {
      const score = buildingBlockScores[block.id] || 0;
      totalScore += score * block.weightInOverallRating;
      totalWeight += block.weightInOverallRating;
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Get current FIRE phase based on business state
   */
  static getCurrentFIREPhase(businessData: any): FIREPhase {
    // Logic to determine current phase based on business maturity
    if (!businessData.focusCompleted) {
      return nexusUniverse.firePhases.find(p => p.id === 'focus')!;
    } else if (!businessData.insightCompleted) {
      return nexusUniverse.firePhases.find(p => p.id === 'insight')!;
    } else if (!businessData.roadmapCompleted) {
      return nexusUniverse.firePhases.find(p => p.id === 'roadmap')!;
    } else {
      return nexusUniverse.firePhases.find(p => p.id === 'execute')!;
    }
  }

  /**
   * Get recommended next actions based on current state
   */
  static getRecommendedActions(
    businessData: any,
    completedPlaybooks: string[]
  ): Array<{
    type: 'building_block' | 'fire_phase' | 'playbook' | 'integration';
    priority: 'high' | 'medium' | 'low';
    action: any;
    impact: string;
  }> {
    const recommendations = [];

    // Check building block priorities
    const buildingBlockScores = this.calculateBuildingBlockScores(businessData, completedPlaybooks);
    const weakestBlocks = this.getWeakestBuildingBlocks(buildingBlockScores);

    weakestBlocks.forEach(block => {
      recommendations.push({
        type: 'building_block',
        priority: 'high',
        action: block,
        impact: `Improve ${block.name} score from ${buildingBlockScores[block.id]} to target levels`
      });
    });

    // Check FIRE phase progress
    const currentPhase = this.getCurrentFIREPhase(businessData);
    const incompleteActivities = currentPhase.activities.filter(a => !a.isCompleted);

    incompleteActivities.forEach(activity => {
      recommendations.push({
        type: 'fire_phase',
        priority: 'medium',
        action: activity,
        impact: `Complete ${currentPhase.name} phase activity`
      });
    });

    // Check for available playbooks
    const availablePlaybooks = this.getAvailablePlaybooks(businessData, completedPlaybooks);
    availablePlaybooks.slice(0, 3).forEach(playbook => {
      recommendations.push({
        type: 'playbook',
        priority: 'medium',
        action: playbook,
        impact: `Complete ${playbook.title} to improve ${playbook.buildingBlock}`
      });
    });

    return recommendations;
  }

  /**
   * Calculate building block scores
   */
  static calculateBuildingBlockScores(businessData: any, completedPlaybooks: string[]): Record<string, number> {
    const scores: Record<string, number> = {};

    nexusUniverse.buildingBlocks.forEach(block => {
      // Calculate score based on metrics, completed playbooks, and business data
      let score = 0;
      
      // Base score from metrics
      block.metrics.forEach(metric => {
        const currentValue = businessData.metrics?.[metric.id] || metric.current;
        const targetValue = metric.target;
        const metricScore = Math.min((currentValue / targetValue) * 100, 100);
        score += metricScore;
      });

      // Average the metric scores
      score = block.metrics.length > 0 ? score / block.metrics.length : 0;

      // Bonus for completed playbooks
      const completedBlockPlaybooks = block.relatedPlaybooks.filter(p => completedPlaybooks.includes(p));
      const playbookBonus = (completedBlockPlaybooks.length / block.relatedPlaybooks.length) * 20;
      score = Math.min(score + playbookBonus, 100);

      scores[block.id] = Math.round(score);
    });

    return scores;
  }

  /**
   * Get weakest building blocks
   */
  static getWeakestBuildingBlocks(scores: Record<string, number>): QuantumBuildingBlock[] {
    return nexusUniverse.buildingBlocks
      .map(block => ({ ...block, score: scores[block.id] || 0 }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }

  /**
   * Get available playbooks for business
   */
  static getAvailablePlaybooks(businessData: any, completedPlaybooks: string[]): any[] {
    // Filter playbooks based on business stage and completed playbooks
    return businessPlaybooks.filter(playbook => {
      // Check if already completed
      if (completedPlaybooks.includes(playbook.id)) {
        return false;
      }

      // Check prerequisites
      const prerequisites = playbook.prerequisites || [];
      const hasPrerequisites = prerequisites.every(p => completedPlaybooks.includes(p));

      return hasPrerequisites;
    });
  }

  /**
   * Generate business progression summary
   */
  static generateProgressionSummary(
    businessData: any,
    completedPlaybooks: string[]
  ): {
    overallRating: number;
    tier: any;
    buildingBlockScores: Record<string, number>;
    firePhase: FIREPhase;
    nextActions: any[];
    achievements: any[];
  } {
    const buildingBlockScores = this.calculateBuildingBlockScores(businessData, completedPlaybooks);
    const overallRating = this.calculateOverallRating(buildingBlockScores);
    const tier = BusinessProgressionService.calculatePlayerTier(
      buildingBlockScores.identity || 0,
      buildingBlockScores.operations || 0,
      completedPlaybooks.length,
      completedPlaybooks.length
    );
    const firePhase = this.getCurrentFIREPhase(businessData);
    const nextActions = this.getRecommendedActions(businessData, completedPlaybooks);
    const achievements = this.getAchievements(businessData, completedPlaybooks);

    return {
      overallRating,
      tier,
      buildingBlockScores,
      firePhase,
      nextActions,
      achievements
    };
  }

  /**
   * Get business achievements
   */
  static getAchievements(businessData: any, completedPlaybooks: string[]): any[] {
    const achievements = [];

    // Check building block milestones
    nexusUniverse.buildingBlocks.forEach(block => {
      block.milestones.forEach(milestone => {
        // Logic to check if milestone is achieved
        if (this.isMilestoneAchieved(milestone, businessData, completedPlaybooks)) {
          achievements.push({
            id: milestone.id,
            name: milestone.name,
            description: milestone.description,
            type: 'building_block',
            buildingBlock: block.name,
            reward: milestone.reward
          });
        }
      });
    });

    // Check progression milestones
    progressionMilestones.forEach(milestone => {
      if (BusinessProgressionService.isMilestoneCompleted(
        milestone,
        completedPlaybooks,
        completedPlaybooks,
        businessData.overallRating || 0,
        businessData.optimizationScore || 0
      )) {
        achievements.push({
          id: milestone.id,
          name: milestone.name,
          description: milestone.description,
          type: 'progression',
          reward: milestone.reward
        });
      }
    });

    return achievements;
  }

  /**
   * Check if milestone is achieved
   */
  private static isMilestoneAchieved(milestone: BuildingBlockMilestone, businessData: any, completedPlaybooks: string[]): boolean {
    // Implementation would check specific milestone requirements
    return false; // Placeholder
  }
}

export default nexusUniverse;
