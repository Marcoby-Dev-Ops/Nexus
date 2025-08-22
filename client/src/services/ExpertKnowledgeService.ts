/**
 * Expert Knowledge Service
 * 
 * Provides 20+ years of business expertise through brain analysis and expert advice.
 * This service delivers the core Nexus experience of bridging skill gaps with expert knowledge.
 */

export interface BrainAnalysisData {
  previousActions: string[];
  businessContext: string;
  expertKnowledge: string;
  learningOpportunity: string;
  patternRecognition?: string;
  confidence: number;
}

export interface ExpertAdviceData {
  businessPrinciple: string;
  expertTactic: string;
  implementation: string;
  commonMistake: string;
  expectedOutcome: string;
  timeToImpact: string;
  confidence: number;
  expertiseYears: number;
}

export interface ExpertKnowledgeContext {
  businessType: string;
  industry: string;
  companySize: string;
  growthStage: string;
  challenges: string[];
  goals: string[];
}

export class ExpertKnowledgeService {
  private static instance: ExpertKnowledgeService;
  private expertDatabase: Map<string, any>;

  private constructor() {
    this.expertDatabase = new Map();
    this.initializeExpertDatabase();
  }

  public static getInstance(): ExpertKnowledgeService {
    if (!ExpertKnowledgeService.instance) {
      ExpertKnowledgeService.instance = new ExpertKnowledgeService();
    }
    return ExpertKnowledgeService.instance;
  }

  private initializeExpertDatabase(): void {
    // Pricing Strategy Expertise
    this.expertDatabase.set('pricing-strategy', {
      brainAnalysis: {
        previousActions: ['Customer validation completed', 'Market research conducted', 'Competitor analysis performed'],
        businessContext: 'Service-based business, B2B market, mid-market pricing',
        expertKnowledge: 'Pricing strategy and value-based pricing (20+ years experience)',
        learningOpportunity: 'Pricing psychology and value-based pricing methodologies',
        patternRecognition: 'Common pricing mistakes: competing on price instead of value',
        confidence: 95
      },
      expertAdvice: {
        businessPrinciple: 'Price based on value delivered, not cost plus margin',
        expertTactic: 'Use the 10x value rule - price at 1/10th of value created',
        implementation: 'Start with competitor analysis, then value quantification, then pricing tiers',
        commonMistake: 'Don\'t compete on price - compete on value',
        expectedOutcome: 'Proper pricing increases profit margins by 40-60%',
        timeToImpact: '30-60 days',
        confidence: 95,
        expertiseYears: 20
      }
    });

    // Cross-Departmental Alignment
    this.expertDatabase.set('department-alignment', {
      brainAnalysis: {
        previousActions: ['Sales and marketing data analyzed', 'Customer journey mapped', 'Team communication reviewed'],
        businessContext: 'Multi-department coordination challenge, scaling business',
        expertKnowledge: 'Cross-departmental optimization and team alignment (20+ years experience)',
        learningOpportunity: 'Unified customer journey mapping and shared metrics',
        patternRecognition: 'Common scaling challenge: departments operating in silos',
        confidence: 90
      },
      expertAdvice: {
        businessPrinciple: 'Alignment creates exponential growth',
        expertTactic: 'Implement unified customer journey mapping with shared metrics',
        implementation: 'Weekly sales-marketing alignment meetings with joint accountability',
        commonMistake: 'Don\'t operate departments in silos - create shared success metrics',
        expectedOutcome: 'Aligned teams see 30% faster growth and improved customer experience',
        timeToImpact: '30-60 days',
        confidence: 90,
        expertiseYears: 20
      }
    });

    // Cash Flow Management
    this.expertDatabase.set('cash-flow', {
      brainAnalysis: {
        previousActions: ['Payment patterns analyzed', 'Invoice timing reviewed', 'Seasonal trends identified'],
        businessContext: 'Service business with irregular payment cycles, growth stage',
        expertKnowledge: 'Cash flow management and financial optimization (20+ years experience)',
        learningOpportunity: 'Cash flow forecasting and payment terms optimization',
        patternRecognition: 'Irregular payment cycles causing cash flow unpredictability',
        confidence: 85
      },
      expertAdvice: {
        businessPrinciple: 'Cash flow is more important than profit',
        expertTactic: 'Implement payment terms optimization and cash flow forecasting',
        implementation: 'Require 50% upfront, net-15 terms for remainder, maintain 6-month reserve',
        commonMistake: 'Don\'t wait for cash flow problems - be proactive',
        expectedOutcome: 'Predictable cash flow within 60 days',
        timeToImpact: '30-60 days',
        confidence: 85,
        expertiseYears: 20
      }
    });

    // Scaling Operations
    this.expertDatabase.set('scaling-operations', {
      brainAnalysis: {
        previousActions: ['Process bottlenecks identified', 'Automation opportunities analyzed', 'Team capacity assessed'],
        businessContext: 'Scaling bottlenecks across multiple departments, 25+ employees',
        expertKnowledge: 'Operations excellence and scaling strategies (20+ years experience)',
        learningOpportunity: 'Process automation and systemization methodologies',
        patternRecognition: 'Manual processes limiting growth and efficiency',
        confidence: 88
      },
      expertAdvice: {
        businessPrinciple: 'Systemize everything that can be repeated',
        expertTactic: 'Use the 80/20 rule to prioritize automation',
        implementation: 'Start with highest-volume, lowest-complexity processes',
        commonMistake: 'Don\'t automate everything at once - prioritize by impact',
        expectedOutcome: '40% reduction in manual work within 6 months',
        timeToImpact: '3-6 months',
        confidence: 88,
        expertiseYears: 20
      }
    });

    // Customer Success
    this.expertDatabase.set('customer-success', {
      brainAnalysis: {
        previousActions: ['Customer usage patterns analyzed', 'Support tickets reviewed', 'Satisfaction scores assessed'],
        businessContext: 'Growth-stage company with customer success challenges',
        expertKnowledge: 'Customer success and retention strategies (20+ years experience)',
        learningOpportunity: 'Proactive health scoring and intervention strategies',
        patternRecognition: 'Reactive customer success leading to preventable churn',
        confidence: 92
      },
      expertAdvice: {
        businessPrinciple: 'Prevent churn before it happens',
        expertTactic: 'Implement proactive health scoring and intervention triggers',
        implementation: 'Trigger interventions at 70% health score with success milestones',
        commonMistake: 'Don\'t wait for customers to complain - be proactive',
        expectedOutcome: 'Proactive approach reduces churn by 50%',
        timeToImpact: '60-90 days',
        confidence: 92,
        expertiseYears: 20
      }
    });
  }

  /**
   * Get brain analysis data for a specific business challenge
   */
  public getBrainAnalysis(challenge: string, context: ExpertKnowledgeContext): BrainAnalysisData {
    const expertData = this.expertDatabase.get(challenge);
    
    if (expertData) {
      return {
        ...expertData.brainAnalysis,
        businessContext: this.customizeBusinessContext(expertData.brainAnalysis.businessContext, context)
      };
    }

    // Default brain analysis
    return {
      previousActions: ['Business analysis completed', 'Current state assessed', 'Opportunities identified'],
      businessContext: `${context.businessType} business in ${context.industry} industry`,
      expertKnowledge: 'Business optimization and growth strategies (20+ years experience)',
      learningOpportunity: 'Pattern recognition and strategic decision making',
      confidence: 80
    };
  }

  /**
   * Get expert advice for a specific business challenge
   */
  public getExpertAdvice(challenge: string, context: ExpertKnowledgeContext): ExpertAdviceData {
    const expertData = this.expertDatabase.get(challenge);
    
    if (expertData) {
      return {
        ...expertData.expertAdvice,
        implementation: this.customizeImplementation(expertData.expertAdvice.implementation, context)
      };
    }

    // Default expert advice
    return {
      businessPrinciple: 'Focus on high-impact, low-effort improvements',
      expertTactic: 'Implement systematic approach to business optimization',
      implementation: 'Start with quick wins, then build sustainable processes',
      commonMistake: 'Don\'t try to fix everything at once - prioritize by impact',
      expectedOutcome: 'Measurable improvements in efficiency and growth',
      timeToImpact: '30-90 days',
      confidence: 80,
      expertiseYears: 20
    };
  }

  /**
   * Get available expert knowledge areas
   */
  public getAvailableExpertise(): string[] {
    return Array.from(this.expertDatabase.keys());
  }

  /**
   * Customize business context based on company specifics
   */
  private customizeBusinessContext(baseContext: string, context: ExpertKnowledgeContext): string {
    return `${baseContext}, ${context.companySize} company in ${context.industry} industry, ${context.growthStage} stage`;
  }

  /**
   * Customize implementation based on company specifics
   */
  private customizeImplementation(baseImplementation: string, context: ExpertKnowledgeContext): string {
    if (context.companySize === 'small') {
      return `${baseImplementation} (start with simple processes)`;
    } else if (context.companySize === 'large') {
      return `${baseImplementation} (implement across departments systematically)`;
    }
    return baseImplementation;
  }

  /**
   * Get contextual recommendations based on business challenges
   */
  public getContextualRecommendations(context: ExpertKnowledgeContext): string[] {
    const recommendations: string[] = [];

    if (context.challenges.includes('pricing')) {
      recommendations.push('pricing-strategy');
    }
    if (context.challenges.includes('alignment') || context.challenges.includes('coordination')) {
      recommendations.push('department-alignment');
    }
    if (context.challenges.includes('cash flow') || context.challenges.includes('finance')) {
      recommendations.push('cash-flow');
    }
    if (context.challenges.includes('scaling') || context.challenges.includes('operations')) {
      recommendations.push('scaling-operations');
    }
    if (context.challenges.includes('customer') || context.challenges.includes('retention')) {
      recommendations.push('customer-success');
    }

    return recommendations;
  }
}

export const expertKnowledgeService = ExpertKnowledgeService.getInstance();
