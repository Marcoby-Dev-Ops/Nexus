/**
 * Business Progression System
 * 
 * Maps the Acts & Chapters hierarchy to gamified player tiers and growth stages
 * Users progress from "Walk-on" to "99 Overall" based on business maturity
 * 
 * Player Tiers:
 * - Walk-on: Just starting, basic foundations
 * - Journeyman: Established foundations, growing capabilities  
 * - First Round Pick: Optimized operations, strong performance
 * - 99 Overall: Elite business operations, continuous excellence
 */

export interface PlayerTier {
  id: string;
  name: string;
  description: string;
  overallRating: number;
  color: string;
  icon: string;
  requirements: {
    foundationScore: number;
    optimizationScore: number;
    completedActs: number;
    completedChapters: number;
  };
  benefits: string[];
  nextTier?: string;
}

export interface GrowthStage {
  id: string;
  name: string;
  description: string;
  playerTier: string;
  focusAreas: string[];
  keyMetrics: Array<{
    name: string;
    target: string;
    description: string;
  }>;
  recommendedActs: string[];
  recommendedChapters: string[];
}

export interface ProgressionMilestone {
  id: string;
  name: string;
  description: string;
  type: 'act_completion' | 'chapter_completion' | 'score_threshold' | 'metric_achievement';
  requirements: {
    acts?: string[];
    chapters?: string[];
    foundationScore?: number;
    optimizationScore?: number;
    metrics?: Array<{
      name: string;
      value: string;
    }>;
  };
  rewards: {
    experiencePoints: number;
    badges: string[];
    unlocks: string[];
  };
}

/**
 * Player Tiers - From Walk-on to 99 Overall
 */
export const playerTiers: PlayerTier[] = [
  {
    id: 'walk-on',
    name: 'Walk-on',
    description: 'Just getting started - building essential business foundations',
    overallRating: 50,
    color: '#6B7280', // Gray
    icon: '🚶',
    requirements: {
      foundationScore: 0,
      optimizationScore: 0,
      completedActs: 0,
      completedChapters: 0
    },
    benefits: [
      'Access to basic business playbooks',
      'Foundation building guidance',
      'Essential legal and financial setup'
    ],
    nextTier: 'journeyman'
  },
  {
    id: 'journeyman',
    name: 'Journeyman',
    description: 'Established foundations - growing business capabilities',
    overallRating: 70,
    color: '#3B82F6', // Blue
    icon: '👨‍💼',
    requirements: {
      foundationScore: 50,
      optimizationScore: 0,
      completedActs: 2,
      completedChapters: 0
    },
    benefits: [
      'Access to growth playbooks',
      'Advanced operational systems',
      'Revenue optimization strategies'
    ],
    nextTier: 'first-round-pick'
  },
  {
    id: 'first-round-pick',
    name: 'First Round Pick',
    description: 'Optimized operations - strong business performance',
    overallRating: 85,
    color: '#10B981', // Green
    icon: '⭐',
    requirements: {
      foundationScore: 100,
      optimizationScore: 50,
      completedActs: 4,
      completedChapters: 2
    },
    benefits: [
      'Access to advanced optimization playbooks',
      'Elite business strategies',
      'Market leadership positioning'
    ],
    nextTier: '99-overall'
  },
  {
    id: '99-overall',
    name: '99 Overall',
    description: 'Elite business operations - continuous excellence',
    overallRating: 99,
    color: '#F59E0B', // Gold
    icon: '🏆',
    requirements: {
      foundationScore: 100,
      optimizationScore: 100,
      completedActs: 4,
      completedChapters: 6
    },
    benefits: [
      'Access to all playbooks',
      'Innovation and scaling strategies',
      'Industry leadership recognition'
    ]
  }
];

/**
 * Growth Stages - Detailed progression paths
 */
export const growthStages: GrowthStage[] = [
  {
    id: 'foundation-building',
    name: 'Foundation Building',
    description: 'Establish essential business foundations and legal compliance',
    playerTier: 'walk-on',
    focusAreas: [
      'Legal entity registration',
      'Financial infrastructure',
      'Basic operational systems',
      'Security and compliance'
    ],
    keyMetrics: [
      { name: 'Foundation Score', target: '100%', description: 'Completion of critical acts' },
      { name: 'Legal Compliance', target: '100%', description: 'All legal requirements met' },
      { name: 'Financial Setup', target: 'Complete', description: 'Accounting and banking systems' }
    ],
    recommendedActs: ['legal-foundation', 'financial-infrastructure'],
    recommendedChapters: []
  },
  {
    id: 'operational-establishment',
    name: 'Operational Establishment',
    description: 'Build operational systems and customer service capabilities',
    playerTier: 'walk-on',
    focusAreas: [
      'Customer service systems',
      'Order fulfillment processes',
      'Quality assurance',
      'Basic automation'
    ],
    keyMetrics: [
      { name: 'Operational Efficiency', target: '80%+', description: 'Process completion rates' },
      { name: 'Customer Satisfaction', target: '90%+', description: 'Customer feedback scores' },
      { name: 'Quality Score', target: '95%+', description: 'Product/service quality metrics' }
    ],
    recommendedActs: ['operational-core', 'security-compliance'],
    recommendedChapters: []
  },
  {
    id: 'growth-acceleration',
    name: 'Growth Acceleration',
    description: 'Optimize operations and accelerate revenue growth',
    playerTier: 'journeyman',
    focusAreas: [
      'Revenue optimization',
      'Customer acquisition',
      'Process automation',
      'Market expansion'
    ],
    keyMetrics: [
      { name: 'Revenue Growth', target: '25%+', description: 'Monthly recurring revenue increase' },
      { name: 'Customer Acquisition', target: '50% improvement', description: 'Conversion rate optimization' },
      { name: 'Operational Efficiency', target: '30% improvement', description: 'Process optimization gains' }
    ],
    recommendedActs: [],
    recommendedChapters: ['revenue-growth', 'operational-efficiency']
  },
  {
    id: 'optimization-excellence',
    name: 'Optimization Excellence',
    description: 'Achieve operational excellence and customer satisfaction',
    playerTier: 'first-round-pick',
    focusAreas: [
      'Customer experience optimization',
      'Advanced automation',
      'Quality improvement',
      'Performance optimization'
    ],
    keyMetrics: [
      { name: 'Customer Satisfaction', target: '95%+', description: 'NPS and satisfaction scores' },
      { name: 'Operational Excellence', target: '98%+', description: 'Process efficiency and quality' },
      { name: 'Customer Retention', target: '90%+', description: 'Customer loyalty and retention' }
    ],
    recommendedActs: [],
    recommendedChapters: ['customer-excellence', 'financial-optimization']
  },
  {
    id: 'elite-operations',
    name: 'Elite Operations',
    description: 'Achieve elite business operations and industry leadership',
    playerTier: '99-overall',
    focusAreas: [
      'Advanced security and compliance',
      'Innovation and scaling',
      'Industry leadership',
      'Continuous improvement'
    ],
    keyMetrics: [
      { name: 'Security Score', target: '100%', description: 'Security and compliance excellence' },
      { name: 'Innovation Index', target: '95%+', description: 'Innovation and scaling metrics' },
      { name: 'Industry Position', target: 'Top 10%', description: 'Market leadership position' }
    ],
    recommendedActs: [],
    recommendedChapters: ['security-advanced']
  }
];

/**
 * Progression Milestones - Achievement system
 */
export const progressionMilestones: ProgressionMilestone[] = [
  // Foundation Milestones
  {
    id: 'legal-foundation-complete',
    name: 'Legal Foundation Complete',
    description: 'Successfully established legal business foundation',
    type: 'act_completion',
    requirements: {
      acts: ['legal-foundation']
    },
    rewards: {
      experiencePoints: 1000,
      badges: ['legal-eagle'],
      unlocks: ['financial-infrastructure-act']
    }
  },
  {
    id: 'financial-infrastructure-complete',
    name: 'Financial Infrastructure Complete',
    description: 'Successfully established financial systems and processes',
    type: 'act_completion',
    requirements: {
      acts: ['financial-infrastructure']
    },
    rewards: {
      experiencePoints: 1000,
      badges: ['financial-wizard'],
      unlocks: ['operational-core-act']
    }
  },
  {
    id: 'operational-core-complete',
    name: 'Operational Core Complete',
    description: 'Successfully established operational systems',
    type: 'act_completion',
    requirements: {
      acts: ['operational-core']
    },
    rewards: {
      experiencePoints: 1000,
      badges: ['operations-master'],
      unlocks: ['security-compliance-act']
    }
  },
  {
    id: 'security-compliance-complete',
    name: 'Security & Compliance Complete',
    description: 'Successfully established security and compliance measures',
    type: 'act_completion',
    requirements: {
      acts: ['security-compliance']
    },
    rewards: {
      experiencePoints: 1000,
      badges: ['security-expert'],
      unlocks: ['all-chapters']
    }
  },
  
  // Score Threshold Milestones
  {
    id: 'foundation-master',
    name: 'Foundation Master',
    description: 'Achieved 100% foundation score',
    type: 'score_threshold',
    requirements: {
      foundationScore: 100
    },
    rewards: {
      experiencePoints: 2000,
      badges: ['foundation-master'],
      unlocks: ['journeyman-tier']
    }
  },
  {
    id: 'optimization-expert',
    name: 'Optimization Expert',
    description: 'Achieved 100% optimization score',
    type: 'score_threshold',
    requirements: {
      optimizationScore: 100
    },
    rewards: {
      experiencePoints: 3000,
      badges: ['optimization-expert'],
      unlocks: ['99-overall-tier']
    }
  },
  
  // Chapter Completion Milestones
  {
    id: 'revenue-growth-complete',
    name: 'Revenue Growth Champion',
    description: 'Successfully implemented revenue growth strategies',
    type: 'chapter_completion',
    requirements: {
      chapters: ['revenue-growth']
    },
    rewards: {
      experiencePoints: 1500,
      badges: ['revenue-champion'],
      unlocks: ['advanced-growth-strategies']
    }
  },
  {
    id: 'customer-excellence-complete',
    name: 'Customer Excellence Champion',
    description: 'Successfully achieved customer excellence',
    type: 'chapter_completion',
    requirements: {
      chapters: ['customer-excellence']
    },
    rewards: {
      experiencePoints: 1500,
      badges: ['customer-champion'],
      unlocks: ['advanced-customer-strategies']
    }
  }
];

/**
 * Business Progression Service
 */
export class BusinessProgressionService {
  /**
   * Calculate player tier based on completion status
   */
  static calculatePlayerTier(
    foundationScore: number,
    optimizationScore: number,
    completedActs: number,
    completedChapters: number
  ): PlayerTier {
    // Sort tiers by requirements (highest to lowest)
    const sortedTiers = [...playerTiers].sort((a, b) => 
      b.requirements.foundationScore - a.requirements.foundationScore
    );

    for (const tier of sortedTiers) {
      if (
        foundationScore >= tier.requirements.foundationScore &&
        optimizationScore >= tier.requirements.optimizationScore &&
        completedActs >= tier.requirements.completedActs &&
        completedChapters >= tier.requirements.completedChapters
      ) {
        return tier;
      }
    }

    return playerTiers[0]; // Default to walk-on
  }

  /**
   * Get current growth stage
   */
  static getCurrentGrowthStage(
    foundationScore: number,
    optimizationScore: number,
    completedActs: string[]
  ): GrowthStage {
    if (foundationScore < 50) {
      return growthStages[0]; // Foundation Building
    } else if (foundationScore < 100) {
      return growthStages[1]; // Operational Establishment
    } else if (optimizationScore < 50) {
      return growthStages[2]; // Growth Acceleration
    } else if (optimizationScore < 100) {
      return growthStages[3]; // Optimization Excellence
    } else {
      return growthStages[4]; // Elite Operations
    }
  }

  /**
   * Get available milestones
   */
  static getAvailableMilestones(
    completedActs: string[],
    completedChapters: string[],
    foundationScore: number,
    optimizationScore: number
  ): ProgressionMilestone[] {
    return progressionMilestones.filter(milestone => {
      // Check if milestone is already completed
      const isCompleted = this.isMilestoneCompleted(
        milestone,
        completedActs,
        completedChapters,
        foundationScore,
        optimizationScore
      );

      return !isCompleted;
    });
  }

  /**
   * Check if milestone is completed
   */
  static isMilestoneCompleted(
    milestone: ProgressionMilestone,
    completedActs: string[],
    completedChapters: string[],
    foundationScore: number,
    optimizationScore: number
  ): boolean {
    const { requirements } = milestone;

    // Check act requirements
    if (requirements.acts) {
      const hasAllActs = requirements.acts.every(act => completedActs.includes(act));
      if (!hasAllActs) return false;
    }

    // Check chapter requirements
    if (requirements.chapters) {
      const hasAllChapters = requirements.chapters.every(chapter => completedChapters.includes(chapter));
      if (!hasAllChapters) return false;
    }

    // Check score requirements
    if (requirements.foundationScore && foundationScore < requirements.foundationScore) {
      return false;
    }

    if (requirements.optimizationScore && optimizationScore < requirements.optimizationScore) {
      return false;
    }

    return true;
  }

  /**
   * Get progression summary
   */
  static getProgressionSummary(
    foundationScore: number,
    optimizationScore: number,
    completedActs: string[],
    completedChapters: string[]
  ): {
    playerTier: PlayerTier;
    growthStage: GrowthStage;
    overallRating: number;
    nextMilestones: ProgressionMilestone[];
    progressToNextTier: number;
  } {
    const playerTier = this.calculatePlayerTier(
      foundationScore,
      optimizationScore,
      completedActs.length,
      completedChapters.length
    );

    const growthStage = this.getCurrentGrowthStage(
      foundationScore,
      optimizationScore,
      completedActs
    );

    const availableMilestones = this.getAvailableMilestones(
      completedActs,
      completedChapters,
      foundationScore,
      optimizationScore
    );

    // Calculate progress to next tier
    let progressToNextTier = 0;
    if (playerTier.nextTier) {
      const nextTier = playerTiers.find(t => t.id === playerTier.nextTier);
      if (nextTier) {
        const currentProgress = (foundationScore + optimizationScore) / 2;
        const requiredProgress = (nextTier.requirements.foundationScore + nextTier.requirements.optimizationScore) / 2;
        progressToNextTier = Math.min(100, (currentProgress / requiredProgress) * 100);
      }
    }

    return {
      playerTier,
      growthStage,
      overallRating: playerTier.overallRating,
      nextMilestones: availableMilestones.slice(0, 3), // Top 3 next milestones
      progressToNextTier: Math.round(progressToNextTier)
    };
  }
}
