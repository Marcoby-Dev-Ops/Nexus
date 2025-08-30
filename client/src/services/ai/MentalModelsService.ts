import { BaseService, type ServiceResponse } from '../shared/BaseService';
import type { UserContext } from './types';

export interface MentalModelInsight {
  modelName: string;
  principle: string;
  insights: string[];
  recommendations: string[];
  examples: string[];
  implementationSteps: string[];
  successMetrics: string[];
}

export interface SuccessPattern {
  organization: string;
  problemSolved: string;
  successFactors: string[];
  adaptationStrategy: string;
  validationMetrics: string[];
}

export interface RiskProfile {
  currentRisk: 'low' | 'medium' | 'high';
  riskFactors: string[];
  mitigationStrategies: string[];
  fallbackPlans: string[];
  validationApproach: string;
}

export interface TimeAllocation {
  currentTimeUsage: Record<string, number>;
  optimalAllocation: Record<string, number>;
  implementationStrategy: string;
  weeklySchedule: Record<string, string[]>;
}

export interface QuickWin {
  category: 'highImpactLowEffort' | 'mediumImpactMediumEffort' | 'lowPriority';
  action: string;
  expectedImpact: string;
  timeRequired: string;
  resourcesNeeded: string[];
}

export interface CompetenceAssessment {
  currentStrengths: string[];
  gaps: string[];
  recommendedApproach: string;
  learningPath: string[];
  partnershipOpportunities: string[];
}

export interface AccountabilityFramework {
  personalInvestment: string;
  measurableOutcomes: string[];
  consequenceFramework: string;
  successRewards: string[];
  progressTracking: string[];
}

export interface GiverTakerAnalysis {
  giverBehaviors: string[];
  takerBehaviors: string[];
  recommendedApproach: string;
  valueCreationStrategy: string;
  relationshipBuilding: string[];
}

export class MentalModelsService extends BaseService {
  private readonly mentalModels = {
    successPatternRecognition: {
      name: 'Success Pattern Recognition',
      principle: 'Study organizations that solved your same problem and follow their proven patterns',
      apply: async (userGoal: string, context: any): Promise<SuccessPattern[]> => {
        return this.identifySuccessPatterns(userGoal, context);
      }
    },
    
    riskMinimization: {
      name: 'Risk Minimization',
      principle: 'Heads I win, tails I don\'t lose much',
      apply: async (userInsight: string, context: any): Promise<RiskProfile> => {
        return this.evaluateRiskProfile(userInsight, context);
      }
    },
    
    timeAllocation: {
      name: 'Time Allocation',
      principle: 'Optimize your 168-hour week for maximum business impact',
      apply: async (userPlan: string, context: any): Promise<TimeAllocation> => {
        return this.create168HourWeek(userPlan, context);
      }
    },
    
    lowHangingFruit: {
      name: 'Low-Hanging Fruit',
      principle: 'Identify and execute high-impact, low-effort opportunities first',
      apply: async (userPlan: string, context: any): Promise<QuickWin[]> => {
        return this.identifyQuickWins(userPlan, context);
      }
    },
    
    skinInTheGame: {
      name: 'Skin in the Game',
      principle: 'Create personal accountability and commitment to drive success',
      apply: async (userAction: string, context: any): Promise<AccountabilityFramework> => {
        return this.createAccountability(userAction, context);
      }
    },
    
    circleOfCompetence: {
      name: 'Circle of Competence',
      principle: 'Stay within your areas of expertise and partner for gaps',
      apply: async (userInsight: string, context: any): Promise<CompetenceAssessment> => {
        return this.assessCapabilities(userInsight, context);
      }
    },
    
    giversVsTakers: {
      name: 'Givers vs Takers',
      principle: 'Focus on creating value for others first, success follows',
      apply: async (userAction: string, context: any): Promise<GiverTakerAnalysis> => {
        return this.evaluateApproach(userAction, context);
      }
    },
    
    ruleOf72: {
      name: 'Rule of 72',
      principle: 'Understand compound growth and time value of business decisions',
      apply: async (userGoal: string, context: any): Promise<any> => {
        return this.calculateCompoundGrowth(userGoal, context);
      }
    },
    
    dhandhoFramework: {
      name: 'Dhandho Framework',
      principle: 'Zero-risk entrepreneurship through asymmetric opportunities',
      apply: async (userGoal: string, context: any): Promise<any> => {
        return this.identifyAsymmetricOpportunities(userGoal, context);
      }
    }
  };

  async applyToPhase(
    phase: 'focus' | 'insight' | 'roadmap' | 'execute',
    input: string,
    context: any
  ): Promise<ServiceResponse<Record<string, any>>> {
    try {
      const phaseModels = {
        focus: ['successPatternRecognition'],
        insight: ['riskMinimization', 'circleOfCompetence'],
        roadmap: ['timeAllocation', 'lowHangingFruit'],
        execute: ['skinInTheGame', 'giversVsTakers']
      };

      const applicableModels = phaseModels[phase] || [];
      const insights: Record<string, any> = {};

      for (const modelName of applicableModels) {
        const model = this.mentalModels[modelName as keyof typeof this.mentalModels];
        if (model) {
          insights[modelName] = await model.apply(input, context);
        }
      }

      return this.createResponse(insights);
    } catch (error) {
      return this.handleError(error, 'Failed to apply mental models to phase');
    }
  }

  async getAllMentalModels(): Promise<ServiceResponse<Record<string, any>>> {
    try {
      const models = Object.entries(this.mentalModels).map(([key, model]) => ({
        key,
        name: model.name,
        principle: model.principle
      }));

      return this.createResponse(models);
    } catch (error) {
      return this.handleError(error, 'Failed to get all mental models');
    }
  }

  private async identifySuccessPatterns(userGoal: string, context: any): Promise<SuccessPattern[]> {
    // AI-powered pattern recognition based on user goal
    const patterns: SuccessPattern[] = [];
    
    if (userGoal.toLowerCase().includes('sales') || userGoal.toLowerCase().includes('revenue')) {
      patterns.push({
        organization: 'HubSpot',
        problemSolved: 'Lead follow-up and conversion',
        successFactors: ['Automated follow-up sequences', 'Lead scoring', 'Pipeline management'],
        adaptationStrategy: 'Start with email automation (lowest risk, highest impact)',
        validationMetrics: ['Response rate', 'Conversion rate', 'Sales cycle length']
      });
      
      patterns.push({
        organization: 'Salesforce',
        problemSolved: 'Lead prioritization and management',
        successFactors: ['Lead scoring algorithms', 'CRM integration', 'Sales forecasting'],
        adaptationStrategy: 'Implement basic lead scoring first, then advanced features',
        validationMetrics: ['Lead quality score', 'Conversion rate', 'Revenue per lead']
      });
    }

    if (userGoal.toLowerCase().includes('marketing') || userGoal.toLowerCase().includes('acquisition')) {
      patterns.push({
        organization: 'Mailchimp',
        problemSolved: 'Customer acquisition and retention',
        successFactors: ['Email marketing automation', 'Segmentation', 'A/B testing'],
        adaptationStrategy: 'Start with basic email sequences, then add segmentation',
        validationMetrics: ['Open rate', 'Click-through rate', 'Customer lifetime value']
      });
    }

    return patterns;
  }

  private async evaluateRiskProfile(userInsight: string, context: any): Promise<RiskProfile> {
    const riskFactors: string[] = [];
    const mitigationStrategies: string[] = [];
    let currentRisk: 'low' | 'medium' | 'high' = 'medium';

    if (userInsight.toLowerCase().includes('mobile') || userInsight.toLowerCase().includes('app')) {
      riskFactors.push('Mobile development requires significant resources');
      riskFactors.push('User adoption uncertainty');
      mitigationStrategies.push('Start with responsive web design (lower risk)');
      mitigationStrategies.push('A/B test mobile vs desktop conversion rates');
      currentRisk = 'medium';
    }

    if (userInsight.toLowerCase().includes('automation') || userInsight.toLowerCase().includes('ai')) {
      riskFactors.push('Technology complexity');
      riskFactors.push('Integration challenges');
      mitigationStrategies.push('Start with simple automation rules');
      mitigationStrategies.push('Test with small user group first');
      currentRisk = 'low';
    }

    return {
      currentRisk,
      riskFactors,
      mitigationStrategies,
      fallbackPlans: ['Optimize existing processes', 'Focus on manual improvements'],
      validationApproach: 'A/B testing with control groups'
    };
  }

  private async create168HourWeek(userPlan: string, context: any): Promise<TimeAllocation> {
    const currentTimeUsage = {
      dayJob: 40,
      family: 20,
      sleep: 56,
      commuting: 5,
      meals: 7,
      availableForBusiness: 40
    };

    const optimalAllocation = {
      businessDevelopment: 15,
      learning: 10,
      execution: 10,
      planning: 5
    };

    return {
      currentTimeUsage,
      optimalAllocation,
      implementationStrategy: 'Use weekends for development, evenings for research',
      weeklySchedule: {
        monday: ['Planning (1 hour)', 'Learning (2 hours)'],
        tuesday: ['Execution (3 hours)', 'Business Development (2 hours)'],
        wednesday: ['Learning (2 hours)', 'Execution (2 hours)'],
        thursday: ['Business Development (3 hours)', 'Planning (1 hour)'],
        friday: ['Execution (2 hours)', 'Learning (2 hours)'],
        saturday: ['Business Development (4 hours)', 'Execution (4 hours)'],
        sunday: ['Planning (2 hours)', 'Learning (2 hours)']
      }
    };
  }

  private async identifyQuickWins(userPlan: string, context: any): Promise<QuickWin[]> {
    const quickWins: QuickWin[] = [];

    if (userPlan.toLowerCase().includes('sales') || userPlan.toLowerCase().includes('revenue')) {
      quickWins.push({
        category: 'highImpactLowEffort',
        action: 'Optimize email follow-up sequences',
        expectedImpact: '3x faster response time',
        timeRequired: '4 hours',
        resourcesNeeded: ['Email marketing tool', 'Basic templates']
      });

      quickWins.push({
        category: 'highImpactLowEffort',
        action: 'Implement basic lead scoring',
        expectedImpact: '40% better conversion rate',
        timeRequired: '8 hours',
        resourcesNeeded: ['CRM system', 'Lead data']
      });
    }

    if (userPlan.toLowerCase().includes('marketing') || userPlan.toLowerCase().includes('acquisition')) {
      quickWins.push({
        category: 'highImpactLowEffort',
        action: 'Create customer feedback survey',
        expectedImpact: 'Better product-market fit',
        timeRequired: '2 hours',
        resourcesNeeded: ['Survey tool', 'Customer list']
      });
    }

    return quickWins;
  }

  private async createAccountability(userAction: string, context: any): Promise<AccountabilityFramework> {
    return {
      personalInvestment: 'Commit 20 hours/week for 3 months',
      measurableOutcomes: ['Revenue increase', 'Customer satisfaction', 'Process efficiency'],
      consequenceFramework: 'If goals not met, pivot to alternative approach',
      successRewards: ['Increased revenue', 'Market expansion', 'Team growth'],
      progressTracking: ['Weekly reviews', 'Monthly metrics', 'Quarterly assessments']
    };
  }

  private async assessCapabilities(userInsight: string, context: any): Promise<CompetenceAssessment> {
    return {
      currentStrengths: ['Business strategy', 'Customer relationships', 'Problem solving'],
      gaps: ['Technical implementation', 'Data analysis', 'Advanced automation'],
      recommendedApproach: 'Partner with technical experts or use no-code tools',
      learningPath: ['Study technical fundamentals', 'Practice with tools', 'Build prototypes'],
      partnershipOpportunities: ['Technical co-founder', 'Freelance developers', 'Agency partnerships']
    };
  }

  private async evaluateApproach(userAction: string, context: any): Promise<GiverTakerAnalysis> {
    return {
      giverBehaviors: [
        'Focus on user value first',
        'Build relationships with experts',
        'Share learnings with team',
        'Create win-win partnerships'
      ],
      takerBehaviors: [
        'Rush to market without user feedback',
        'Copy competitors without adding value',
        'Focus only on revenue without user benefit',
        'Take without giving back'
      ],
      recommendedApproach: 'Adopt giver mindset - focus on user value',
      valueCreationStrategy: 'Solve real customer problems before optimizing for revenue',
      relationshipBuilding: ['Customer interviews', 'Expert consultations', 'Community engagement']
    };
  }

  private async calculateCompoundGrowth(userGoal: string, context: any): Promise<any> {
    // Rule of 72: Time to double = 72 / growth rate
    return {
      principle: 'Rule of 72',
      explanation: 'Time to double = 72 / growth rate',
      examples: [
        '10% growth = 7.2 years to double',
        '20% growth = 3.6 years to double',
        '5% growth = 14.4 years to double'
      ],
      application: 'Use this to evaluate business growth strategies and time investments'
    };
  }

  private async identifyAsymmetricOpportunities(userGoal: string, context: any): Promise<any> {
    return {
      principle: 'Dhandho Framework',
      explanation: 'Heads I win big, tails I don\'t lose much',
      opportunities: [
        'Test new markets with minimal investment',
        'Experiment with new channels using existing resources',
        'Partner with complementary businesses',
        'Leverage existing customer relationships for new products'
      ],
      riskMitigation: 'Start small, validate, then scale'
    };
  }
}
