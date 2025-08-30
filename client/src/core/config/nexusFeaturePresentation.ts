/**
 * Nexus Feature Presentation System
 * 
 * Transforms the business dashboard into a "locker room" experience with game mechanics
 * that deliver serious business outcomes. Users feel like they're managing their
 * business's "player card" with stats, missions, and progression paths.
 */

export interface BusinessPlayerCard {
  id: string;
  businessName: string;
  logo?: string;
  tagline: string;
  overallRating: number; // 0-99
  tier: string; // Walk-on, Journeyman, First Round Pick, 99 Overall
  tierIcon: string;
  tierColor: string;
  
  // Core Stats (like RPG attributes)
  attributes: BusinessAttribute[];
  
  // Recent achievements
  recentLevelUps: LevelUp[];
  
  // Current focus areas
  activeFocusAreas: string[];
  
  // Weekly/Monthly progress
  weeklyProgress: ProgressSummary;
  monthlyProgress: ProgressSummary;
}

export interface BusinessAttribute {
  name: string;
  value: number; // 0-100
  maxValue: number;
  category: 'revenue' | 'efficiency' | 'automation' | 'customer' | 'finance' | 'operations';
  icon: string;
  color: string;
  description: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number; // Percentage change
}

export interface LevelUp {
  id: string;
  title: string;
  description: string;
  attribute: string;
  valueIncrease: number;
  timestamp: Date;
  type: 'mission' | 'integration' | 'milestone' | 'optimization';
}

export interface ProgressSummary {
  period: string;
  overallChange: number;
  attributeChanges: Array<{
    attribute: string;
    change: number;
    direction: 'up' | 'down';
  }>;
  missionsCompleted: number;
  newIntegrations: number;
  achievements: string[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'primary' | 'side' | 'daily' | 'weekly';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  rewards: MissionReward[];
  requirements: string[];
  progress: number; // 0-100
  status: 'available' | 'in_progress' | 'completed' | 'locked';
  category: string;
  relatedPlaybook?: string;
}

export interface MissionReward {
  type: 'attribute_boost' | 'experience_points' | 'badge' | 'unlock' | 'integration';
  value: string;
  description: string;
}

export interface SkillTree {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  focusAreas: SkillTreeFocus[];
  isActive: boolean;
  progress: number; // 0-100
}

export interface SkillTreeFocus {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  requirements: string[];
  rewards: MissionReward[];
  relatedMissions: string[];
  relatedIntegrations: string[];
}

export interface IntegrationPowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'sales' | 'finance' | 'operations' | 'communication' | 'marketing';
  status: 'connected' | 'available' | 'locked';
  attributeBoosts: Array<{
    attribute: string;
    boost: number;
    description: string;
  }>;
  setupTime: string;
  monthlyCost?: string;
  features: string[];
  requirements: string[];
}

export interface AdvisorAI {
  id: string;
  message: string;
  type: 'suggestion' | 'achievement' | 'warning' | 'opportunity';
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionRequired: boolean;
  actionText?: string;
  actionUrl?: string;
  relatedAttribute?: string;
  relatedMission?: string;
}

export interface LeaderboardEntry {
  rank: number;
  businessName: string;
  overallRating: number;
  category: string;
  value: number;
  isCurrentUser: boolean;
}

/**
 * Feature Presentation Templates
 */
export const featurePresentationTemplates = {
  // Marketing-ready feature descriptions
  features: [
    {
      id: 'business-profile-stats',
      title: 'Business Profile & Stats Tracking',
      subtitle: 'Know Your Stats. Grow Your Stats.',
      description: 'Every business gets a dashboard "player card" with live stats: revenue, efficiency, automation, customer satisfaction. Businesses instantly see where they\'re strong and where they\'re weak.',
      icon: '📊',
      color: '#3B82F6',
      benefits: [
        'Live business performance dashboard',
        'Attribute-based scoring system',
        'Real-time progress tracking',
        'Visual strength/weakness identification'
      ]
    },
    {
      id: 'level-up-progression',
      title: 'Level-Up Progression System',
      subtitle: 'Turn Everyday Work Into Measurable Progress.',
      description: 'Clear paths to improve specific areas (sales, marketing, finance, operations). Progress bars, milestones, and unlocks as they complete real-world actions.',
      icon: '📈',
      color: '#10B981',
      benefits: [
        'Clear progression paths',
        'Milestone-based unlocks',
        'Progress visualization',
        'Achievement tracking'
      ]
    },
    {
      id: 'missions-quests',
      title: 'Missions & Quests (Actionable Workflows)',
      subtitle: 'Always Know The Next Best Move.',
      description: 'AI surfaces opportunities like "Upgrade your invoicing system", "Close 3 new leads this week", "Automate onboarding emails". Completing missions boosts the business\'s "attributes."',
      icon: '🎯',
      color: '#F59E0B',
      benefits: [
        'AI-powered opportunity identification',
        'Actionable workflow suggestions',
        'Attribute-based rewards',
        'Clear next steps guidance'
      ]
    },
    {
      id: 'skill-trees-paths',
      title: 'Skill Trees / Paths',
      subtitle: 'Design Your Own Business Build.',
      description: 'Businesses choose focus areas ("Growth," "Automation," "Customer Experience," "Finance"). Nexus adapts the journey based on their goals.',
      icon: '🌳',
      color: '#8B5CF6',
      benefits: [
        'Customizable growth paths',
        'Goal-based journey adaptation',
        'Specialized focus areas',
        'Personalized recommendations'
      ]
    },
    {
      id: 'integrations-power-ups',
      title: 'Integrations as Power-Ups',
      subtitle: 'Every Tool Becomes a Power-Up in Your Ecosystem.',
      description: 'Connect tools like HubSpot, QuickBooks, Microsoft 365, Slack, etc. Each integration unlocks new insights and capabilities.',
      icon: '⚡',
      color: '#EF4444',
      benefits: [
        'Seamless tool integration',
        'Capability unlocking',
        'Enhanced insights',
        'Ecosystem expansion'
      ]
    },
    {
      id: 'advisor-ai-coaching',
      title: 'Advisor AI & Coaching',
      subtitle: 'It\'s Like Having a Business Coach On-Demand, 24/7.',
      description: 'Built-in AI acts like a coach, giving personalized guidance: "Here\'s where you\'re leaving money on the table," "This workflow is costing you efficiency."',
      icon: '🤖',
      color: '#06B6D4',
      benefits: [
        '24/7 AI coaching',
        'Personalized guidance',
        'Opportunity identification',
        'Efficiency optimization'
      ]
    },
    {
      id: 'leaderboards-benchmarks',
      title: 'Leaderboards & Benchmarks',
      subtitle: 'See How Your Business Stacks Up.',
      description: 'Compare progress against industry peers. Celebrate milestones like "Top 10% in Automation" or "Fastest Growth this Quarter."',
      icon: '🏆',
      color: '#F59E0B',
      benefits: [
        'Industry benchmarking',
        'Progress comparison',
        'Achievement recognition',
        'Competitive motivation'
      ]
    },
    {
      id: 'endgame-vision',
      title: 'Endgame Vision (99 Overall Business)',
      subtitle: 'Your Path to Becoming a 99 Overall Business.',
      description: 'Show what "maxed out" looks like (profitable, efficient, scalable, resilient). Make it aspirational but attainable.',
      icon: '🎖️',
      color: '#F59E0B',
      benefits: [
        'Clear endgame vision',
        'Aspirational goals',
        'Attainable milestones',
        'Comprehensive business excellence'
      ]
    }
  ],

  // Marketing-ready bullet points
  marketingBullets: [
    {
      id: 'track-stats',
      title: 'Track Your Stats',
      description: 'Instantly see where your business stands.',
      icon: '📊'
    },
    {
      id: 'level-up',
      title: 'Level Up',
      description: 'Complete missions and unlock growth.',
      icon: '📈'
    },
    {
      id: 'play-to-win',
      title: 'Play to Win',
      description: 'Integrate tools, get AI coaching, and climb to 99 overall.',
      icon: '🏆'
    }
  ],

  // Dashboard layout sections
  dashboardSections: [
    {
      id: 'player-card',
      title: 'Business Profile Card',
      description: 'Your business\'s "player card" with overall rating, attributes, and recent achievements',
      layout: 'top',
      components: ['business-info', 'overall-rating', 'attributes', 'recent-achievements']
    },
    {
      id: 'next-moves',
      title: 'Next Moves (Missions/Quests)',
      description: 'Clear next actions with progress rewards and side quests',
      layout: 'middle',
      components: ['primary-mission', 'side-quests', 'progress-meter']
    },
    {
      id: 'skill-trees',
      title: 'Skill Trees & Growth Paths',
      description: 'Choose your focus areas and unlock new capabilities',
      layout: 'middle',
      components: ['focus-areas', 'skill-trees', 'unlock-progress']
    },
    {
      id: 'integrations',
      title: 'Integrations Hub (Power-Ups)',
      description: 'Connected tools as glowing icons with attribute boosts',
      layout: 'bottom',
      components: ['connected-tools', 'available-tools', 'power-up-effects']
    },
    {
      id: 'progression',
      title: 'Progression & Leaderboard',
      description: 'Weekly/monthly progress with industry benchmarks',
      layout: 'bottom',
      components: ['progress-trends', 'achievements', 'leaderboard']
    },
    {
      id: 'advisor-ai',
      title: 'Advisor AI Panel',
      description: 'Personalized coaching and guidance',
      layout: 'sidebar',
      components: ['ai-suggestions', 'coaching-tips', 'opportunity-alerts']
    }
  ]
};

/**
 * Dashboard Experience Service
 */
export class DashboardExperienceService {
  /**
   * Generate business player card
   */
  static generatePlayerCard(
    businessData: any,
    completedPlaybooks: string[],
    integrations: string[]
  ): BusinessPlayerCard {
    // Calculate overall rating based on business health
    const overallRating = this.calculateOverallRating(businessData, completedPlaybooks);
    const tier = this.getTierFromRating(overallRating);
    
    // Generate attributes
    const attributes = this.generateAttributes(businessData, completedPlaybooks, integrations);
    
    // Get recent level ups
    const recentLevelUps = this.getRecentLevelUps(businessData);
    
    return {
      id: businessData.id,
      businessName: businessData.name,
      logo: businessData.logo,
      tagline: this.generateTagline(businessData),
      overallRating,
      tier: tier.name,
      tierIcon: tier.icon,
      tierColor: tier.color,
      attributes,
      recentLevelUps,
      activeFocusAreas: this.getActiveFocusAreas(businessData),
      weeklyProgress: this.getWeeklyProgress(businessData),
      monthlyProgress: this.getMonthlyProgress(businessData)
    };
  }

  /**
   * Generate available missions
   */
  static generateMissions(
    businessData: any,
    completedPlaybooks: string[],
    availablePlaybooks: any[]
  ): Mission[] {
    const missions: Mission[] = [];
    
    // Primary mission (most important)
    const primaryMission = this.getPrimaryMission(businessData, completedPlaybooks);
    if (primaryMission) {
      missions.push({
        ...primaryMission,
        type: 'primary',
        status: 'available'
      });
    }
    
    // Side quests (optional improvements)
    const sideQuests = this.getSideQuests(businessData, completedPlaybooks);
    sideQuests.forEach(quest => {
      missions.push({
        ...quest,
        type: 'side',
        status: 'available'
      });
    });
    
    // Daily missions (quick wins)
    const dailyMissions = this.getDailyMissions(businessData);
    dailyMissions.forEach(mission => {
      missions.push({
        ...mission,
        type: 'daily',
        status: 'available'
      });
    });
    
    return missions;
  }

  /**
   * Generate skill trees
   */
  static generateSkillTrees(
    businessData: any,
    completedPlaybooks: string[]
  ): SkillTree[] {
    const skillTrees: SkillTree[] = [
      {
        id: 'growth',
        name: 'Growth',
        description: 'Sales, marketing, and customer acquisition strategies',
        icon: '📈',
        color: '#10B981',
        focusAreas: this.getGrowthFocusAreas(businessData, completedPlaybooks),
        isActive: businessData.focusAreas?.includes('growth'),
        progress: this.calculateSkillTreeProgress('growth', completedPlaybooks)
      },
      {
        id: 'efficiency',
        name: 'Efficiency',
        description: 'Automation, process optimization, and operational excellence',
        icon: '⚡',
        color: '#3B82F6',
        focusAreas: this.getEfficiencyFocusAreas(businessData, completedPlaybooks),
        isActive: businessData.focusAreas?.includes('efficiency'),
        progress: this.calculateSkillTreeProgress('efficiency', completedPlaybooks)
      },
      {
        id: 'finance',
        name: 'Finance',
        description: 'Accounting, cost management, and financial optimization',
        icon: '💰',
        color: '#F59E0B',
        focusAreas: this.getFinanceFocusAreas(businessData, completedPlaybooks),
        isActive: businessData.focusAreas?.includes('finance'),
        progress: this.calculateSkillTreeProgress('finance', completedPlaybooks)
      },
      {
        id: 'customer',
        name: 'Customer Experience',
        description: 'Customer satisfaction, retention, and service excellence',
        icon: '👥',
        color: '#8B5CF6',
        focusAreas: this.getCustomerFocusAreas(businessData, completedPlaybooks),
        isActive: businessData.focusAreas?.includes('customer'),
        progress: this.calculateSkillTreeProgress('customer', completedPlaybooks)
      }
    ];
    
    return skillTrees;
  }

  /**
   * Generate integration power-ups
   */
  static generateIntegrationPowerUps(
    connectedIntegrations: string[],
    availableIntegrations: any[]
  ): IntegrationPowerUp[] {
    const powerUps: IntegrationPowerUp[] = [];
    
    // Connected integrations (glowing icons)
    connectedIntegrations.forEach(integrationId => {
      const integration = availableIntegrations.find(i => i.id === integrationId);
      if (integration) {
        powerUps.push({
          id: integration.id,
          name: integration.name,
          description: integration.description,
          icon: integration.icon,
          category: integration.category,
          status: 'connected',
          attributeBoosts: integration.attributeBoosts,
          setupTime: integration.setupTime,
          monthlyCost: integration.monthlyCost,
          features: integration.features,
          requirements: integration.requirements
        });
      }
    });
    
    // Available integrations (greyed out with unlock buttons)
    availableIntegrations
      .filter(i => !connectedIntegrations.includes(i.id))
      .forEach(integration => {
        powerUps.push({
          id: integration.id,
          name: integration.name,
          description: integration.description,
          icon: integration.icon,
          category: integration.category,
          status: 'available',
          attributeBoosts: integration.attributeBoosts,
          setupTime: integration.setupTime,
          monthlyCost: integration.monthlyCost,
          features: integration.features,
          requirements: integration.requirements
        });
      });
    
    return powerUps;
  }

  /**
   * Generate advisor AI suggestions
   */
  static generateAdvisorAI(
    businessData: any,
    completedPlaybooks: string[],
    currentMissions: Mission[]
  ): AdvisorAI[] {
    const suggestions: AdvisorAI[] = [];
    
    // Check for immediate opportunities
    const opportunities = this.identifyOpportunities(businessData, completedPlaybooks);
    opportunities.forEach(opp => {
      suggestions.push({
        id: `opportunity-${opp.id}`,
        message: opp.message,
        type: 'opportunity',
        priority: opp.priority,
        actionRequired: true,
        actionText: opp.actionText,
        actionUrl: opp.actionUrl,
        relatedAttribute: opp.attribute
      });
    });
    
    // Check for achievements
    const achievements = this.checkAchievements(businessData, completedPlaybooks);
    achievements.forEach(achievement => {
      suggestions.push({
        id: `achievement-${achievement.id}`,
        message: achievement.message,
        type: 'achievement',
        priority: 'medium',
        actionRequired: false,
        relatedAttribute: achievement.attribute
      });
    });
    
    // Check for warnings
    const warnings = this.checkWarnings(businessData);
    warnings.forEach(warning => {
      suggestions.push({
        id: `warning-${warning.id}`,
        message: warning.message,
        type: 'warning',
        priority: warning.priority,
        actionRequired: true,
        actionText: warning.actionText,
        actionUrl: warning.actionUrl
      });
    });
    
    return suggestions;
  }

  // Helper methods (implementations would be based on business logic)
  private static calculateOverallRating(businessData: any, completedPlaybooks: string[]): number {
    // Implementation would calculate based on business health metrics
    return 75; // Placeholder
  }

  private static getTierFromRating(rating: number): { name: string; icon: string; color: string } {
    if (rating >= 90) return { name: '99 Overall', icon: '🏆', color: '#F59E0B' };
    if (rating >= 80) return { name: 'First Round Pick', icon: '⭐', color: '#10B981' };
    if (rating >= 60) return { name: 'Journeyman', icon: '👨‍💼', color: '#3B82F6' };
    return { name: 'Walk-on', icon: '🚶', color: '#6B7280' };
  }

  private static generateAttributes(businessData: any, completedPlaybooks: string[], integrations: string[]): BusinessAttribute[] {
    // Implementation would generate based on business metrics
    return [
      {
        name: 'Revenue',
        value: 75,
        maxValue: 100,
        category: 'revenue',
        icon: '💰',
        color: '#10B981',
        description: 'Monthly recurring revenue performance',
        trend: 'up',
        trendValue: 12
      },
      {
        name: 'Efficiency',
        value: 68,
        maxValue: 100,
        category: 'efficiency',
        icon: '⚡',
        color: '#3B82F6',
        description: 'Operational efficiency and automation',
        trend: 'up',
        trendValue: 8
      }
    ];
  }

  private static generateTagline(businessData: any): string {
    // Implementation would generate based on business type and goals
    return 'Growing technology company focused on innovation and customer success';
  }

  private static getRecentLevelUps(businessData: any): LevelUp[] {
    // Implementation would get from recent achievements
    return [
      {
        id: 'level-up-1',
        title: 'Sales Efficiency +5',
        description: 'Closed 2 new deals this week',
        attribute: 'revenue',
        valueIncrease: 5,
        timestamp: new Date(),
        type: 'mission'
      }
    ];
  }

  private static getActiveFocusAreas(businessData: any): string[] {
    return businessData.focusAreas || ['growth', 'efficiency'];
  }

  private static getWeeklyProgress(businessData: any): ProgressSummary {
    // Implementation would calculate weekly progress
    return {
      period: 'This Week',
      overallChange: 5,
      attributeChanges: [
        { attribute: 'revenue', change: 3, direction: 'up' },
        { attribute: 'efficiency', change: 2, direction: 'up' }
      ],
      missionsCompleted: 3,
      newIntegrations: 1,
      achievements: ['First Deal Closed', 'Automation Setup Complete']
    };
  }

  private static getMonthlyProgress(businessData: any): ProgressSummary {
    // Implementation would calculate monthly progress
    return {
      period: 'This Month',
      overallChange: 15,
      attributeChanges: [
        { attribute: 'revenue', change: 12, direction: 'up' },
        { attribute: 'efficiency', change: 8, direction: 'up' }
      ],
      missionsCompleted: 12,
      newIntegrations: 3,
      achievements: ['Revenue Goal Met', 'Customer Satisfaction Improved']
    };
  }

  // Additional helper methods would be implemented based on business logic
  private static getPrimaryMission(businessData: any, completedPlaybooks: string[]): any { return null; }
  private static getSideQuests(businessData: any, completedPlaybooks: string[]): any[] { return []; }
  private static getDailyMissions(businessData: any): any[] { return []; }
  private static getGrowthFocusAreas(businessData: any, completedPlaybooks: string[]): any[] { return []; }
  private static getEfficiencyFocusAreas(businessData: any, completedPlaybooks: string[]): any[] { return []; }
  private static getFinanceFocusAreas(businessData: any, completedPlaybooks: string[]): any[] { return []; }
  private static getCustomerFocusAreas(businessData: any, completedPlaybooks: string[]): any[] { return []; }
  private static calculateSkillTreeProgress(treeId: string, completedPlaybooks: string[]): number { return 0; }
  private static identifyOpportunities(businessData: any, completedPlaybooks: string[]): any[] { return []; }
  private static checkAchievements(businessData: any, completedPlaybooks: string[]): any[] { return []; }
  private static checkWarnings(businessData: any): any[] { return []; }
}
