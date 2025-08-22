/**
 * Playbook Hierarchy System
 * 
 * Organizes playbooks into a hierarchical structure:
 * - Acts: Critical initiatives that are essential for business foundation and compliance
 * - Chapters: Missions that make you better - optimization, growth, and improvement initiatives
 * 
 * This structure helps users understand:
 * 1. What they MUST have (Acts)
 * 2. What will make them BETTER (Chapters)
 */

export interface PlaybookAct {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'essential' | 'foundational';
  category: 'legal' | 'financial' | 'operational' | 'compliance' | 'security';
  businessStage: 'startup' | 'growth' | 'established' | 'enterprise';
  estimatedValue: string;
  riskLevel: 'low' | 'medium' | 'high';
  timeToComplete: string;
  
  // Critical success factors
  criticalSuccessFactors: string[];
  
  // What happens if you don't have this
  consequencesOfMissing: string[];
  
  // Playbooks that belong to this act
  playbookIds: string[];
  
  // Dependencies on other acts
  dependencies: string[];
  
  // Validation requirements
  validationRequirements: Array<{
    requirement: string;
    validationMethod: 'document_upload' | 'api_check' | 'manual_verification' | 'system_check';
    required: boolean;
    description: string;
  }>;
}

export interface PlaybookChapter {
  id: string;
  title: string;
  description: string;
  actId: string; // Which act this chapter belongs to
  category: 'optimization' | 'growth' | 'efficiency' | 'innovation' | 'scaling';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedValue: string;
  timeToComplete: string;
  
  // What this makes better
  improvements: string[];
  
  // Prerequisites
  prerequisites: string[];
  
  // Playbooks that belong to this chapter
  playbookIds: string[];
  
  // Success metrics
  successMetrics: Array<{
    metric: string;
    target: string;
    measurement: string;
  }>;
}

export interface PlaybookHierarchy {
  acts: PlaybookAct[];
  chapters: PlaybookChapter[];
}

/**
 * Critical Acts - Essential initiatives that every business needs
 */
export const criticalActs: PlaybookAct[] = [
  {
    id: 'legal-foundation',
    title: 'Legal Foundation',
    description: 'Essential legal structures and compliance requirements for business operation',
    priority: 'critical',
    category: 'legal',
    businessStage: 'startup',
    estimatedValue: '$50,000+ liability protection',
    riskLevel: 'high',
    timeToComplete: '1-2 weeks',
    criticalSuccessFactors: [
      'Proper business entity registration',
      'Tax identification and compliance',
      'Liability protection',
      'Regulatory compliance'
    ],
    consequencesOfMissing: [
      'Personal liability for business debts',
      'Tax penalties and legal issues',
      'Inability to open business accounts',
      'Loss of business credibility'
    ],
    playbookIds: [
      'register-business-entity',
      'business-bank-account',
      'insurance-setup',
      'tax-compliance-setup'
    ],
    dependencies: [],
    validationRequirements: [
      {
        requirement: 'Business entity registration certificate',
        validationMethod: 'document_upload',
        required: true,
        description: 'Proof of legal business registration'
      },
      {
        requirement: 'EIN confirmation',
        validationMethod: 'document_upload',
        required: true,
        description: 'Federal tax identification number'
      },
      {
        requirement: 'Business bank account',
        validationMethod: 'api_check',
        required: true,
        description: 'Active business banking relationship'
      }
    ]
  },
  {
    id: 'financial-infrastructure',
    title: 'Financial Infrastructure',
    description: 'Core financial systems and processes for business operations',
    priority: 'critical',
    category: 'financial',
    businessStage: 'startup',
    estimatedValue: '$25,000+ in efficiency gains',
    riskLevel: 'medium',
    timeToComplete: '1-3 weeks',
    criticalSuccessFactors: [
      'Accounting system setup',
      'Cash flow management',
      'Financial reporting',
      'Expense tracking'
    ],
    consequencesOfMissing: [
      'Poor financial visibility',
      'Cash flow problems',
      'Tax filing difficulties',
      'Inability to make informed decisions'
    ],
    playbookIds: [
      'accounting-system-setup',
      'expense-tracking-system',
      'invoice-management',
      'cash-flow-management'
    ],
    dependencies: ['legal-foundation'],
    validationRequirements: [
      {
        requirement: 'Accounting system active',
        validationMethod: 'system_check',
        required: true,
        description: 'Functional accounting software'
      },
      {
        requirement: 'Bank account integration',
        validationMethod: 'api_check',
        required: true,
        description: 'Connected banking for transactions'
      }
    ]
  },
  {
    id: 'operational-core',
    title: 'Operational Core',
    description: 'Essential operational systems and processes for business delivery',
    priority: 'essential',
    category: 'operational',
    businessStage: 'startup',
    estimatedValue: '$15,000+ in efficiency gains',
    riskLevel: 'medium',
    timeToComplete: '2-4 weeks',
    criticalSuccessFactors: [
      'Customer service system',
      'Order fulfillment process',
      'Quality assurance',
      'Basic automation'
    ],
    consequencesOfMissing: [
      'Poor customer experience',
      'Operational inefficiencies',
      'Quality issues',
      'Scalability problems'
    ],
    playbookIds: [
      'customer-service-system',
      'order-fulfillment',
      'quality-assurance-system',
      'process-automation'
    ],
    dependencies: ['financial-infrastructure'],
    validationRequirements: [
      {
        requirement: 'Customer service system',
        validationMethod: 'system_check',
        required: true,
        description: 'Functional customer support system'
      },
      {
        requirement: 'Order processing workflow',
        validationMethod: 'manual_verification',
        required: true,
        description: 'Documented order fulfillment process'
      }
    ]
  },
  {
    id: 'security-compliance',
    title: 'Security & Compliance',
    description: 'Essential security measures and compliance requirements',
    priority: 'essential',
    category: 'compliance',
    businessStage: 'startup',
    estimatedValue: '$100,000+ in risk mitigation',
    riskLevel: 'high',
    timeToComplete: '1-2 weeks',
    criticalSuccessFactors: [
      'Data security measures',
      'Privacy compliance',
      'Access controls',
      'Audit trails'
    ],
    consequencesOfMissing: [
      'Data breaches and security incidents',
      'Regulatory penalties',
      'Loss of customer trust',
      'Legal liability'
    ],
    playbookIds: [
      'data-security-setup',
      'privacy-compliance',
      'access-control-system',
      'audit-trail-setup'
    ],
    dependencies: ['operational-core'],
    validationRequirements: [
      {
        requirement: 'Security policy documentation',
        validationMethod: 'document_upload',
        required: true,
        description: 'Written security and privacy policies'
      },
      {
        requirement: 'Access control system',
        validationMethod: 'system_check',
        required: true,
        description: 'User access management system'
      }
    ]
  }
];

/**
 * Growth Chapters - Missions that make you better
 */
export const growthChapters: PlaybookChapter[] = [
  // Legal Foundation Chapters
  {
    id: 'legal-optimization',
    title: 'Legal Optimization',
    description: 'Advanced legal strategies and compliance optimization',
    actId: 'legal-foundation',
    category: 'optimization',
    difficulty: 'intermediate',
    estimatedValue: '$75,000+ in additional protection',
    timeToComplete: '2-4 weeks',
    improvements: [
      'Enhanced liability protection',
      'Tax optimization strategies',
      'Intellectual property protection',
      'Advanced compliance frameworks'
    ],
    prerequisites: ['legal-foundation'],
    playbookIds: [
      'intellectual-property-protection',
      'advanced-tax-strategies',
      'compliance-framework-setup',
      'legal-risk-assessment'
    ],
    successMetrics: [
      { metric: 'Legal risk score', target: '<10%', measurement: 'Risk assessment score' },
      { metric: 'Tax efficiency', target: '15% improvement', measurement: 'Effective tax rate' },
      { metric: 'IP protection', target: '100% coverage', measurement: 'Protected assets' }
    ]
  },
  
  // Financial Infrastructure Chapters
  {
    id: 'financial-optimization',
    title: 'Financial Optimization',
    description: 'Advanced financial strategies and efficiency improvements',
    actId: 'financial-infrastructure',
    category: 'optimization',
    difficulty: 'intermediate',
    estimatedValue: '$50,000+ in efficiency gains',
    timeToComplete: '3-6 weeks',
    improvements: [
      'Advanced financial reporting',
      'Cash flow optimization',
      'Cost reduction strategies',
      'Financial forecasting'
    ],
    prerequisites: ['financial-infrastructure'],
    playbookIds: [
      'advanced-financial-reporting',
      'cash-flow-optimization',
      'cost-reduction-strategies',
      'financial-forecasting'
    ],
    successMetrics: [
      { metric: 'Cash flow efficiency', target: '20% improvement', measurement: 'Days cash conversion' },
      { metric: 'Cost reduction', target: '15% reduction', measurement: 'Operating expenses' },
      { metric: 'Financial visibility', target: 'Real-time', measurement: 'Reporting frequency' }
    ]
  },
  {
    id: 'revenue-growth',
    title: 'Revenue Growth',
    description: 'Strategies to increase revenue and market share',
    actId: 'financial-infrastructure',
    category: 'growth',
    difficulty: 'intermediate',
    estimatedValue: '$100,000+ in revenue growth',
    timeToComplete: '4-8 weeks',
    improvements: [
      'Sales process optimization',
      'Customer acquisition strategies',
      'Pricing optimization',
      'Market expansion'
    ],
    prerequisites: ['financial-infrastructure', 'operational-core'],
    playbookIds: [
      'sales-process-optimization',
      'customer-acquisition-strategy',
      'pricing-strategy-development',
      'market-expansion-strategy'
    ],
    successMetrics: [
      { metric: 'Revenue growth', target: '25% increase', measurement: 'Monthly recurring revenue' },
      { metric: 'Customer acquisition', target: '50% improvement', measurement: 'Conversion rate' },
      { metric: 'Market share', target: '10% increase', measurement: 'Market penetration' }
    ]
  },
  
  // Operational Core Chapters
  {
    id: 'operational-efficiency',
    title: 'Operational Efficiency',
    description: 'Advanced operational optimization and automation',
    actId: 'operational-core',
    category: 'efficiency',
    difficulty: 'intermediate',
    estimatedValue: '$75,000+ in efficiency gains',
    timeToComplete: '4-6 weeks',
    improvements: [
      'Process automation',
      'Workflow optimization',
      'Quality improvement',
      'Operational scalability'
    ],
    prerequisites: ['operational-core'],
    playbookIds: [
      'process-automation-advanced',
      'workflow-optimization',
      'quality-improvement-system',
      'operational-scalability'
    ],
    successMetrics: [
      { metric: 'Process efficiency', target: '30% improvement', measurement: 'Time to completion' },
      { metric: 'Quality score', target: '95%+', measurement: 'Customer satisfaction' },
      { metric: 'Operational cost', target: '20% reduction', measurement: 'Cost per transaction' }
    ]
  },
  {
    id: 'customer-excellence',
    title: 'Customer Excellence',
    description: 'Advanced customer service and experience optimization',
    actId: 'operational-core',
    category: 'optimization',
    difficulty: 'intermediate',
    estimatedValue: '$100,000+ in customer lifetime value',
    timeToComplete: '3-5 weeks',
    improvements: [
      'Customer experience optimization',
      'Service quality improvement',
      'Customer retention strategies',
      'Loyalty program development'
    ],
    prerequisites: ['operational-core'],
    playbookIds: [
      'customer-experience-optimization',
      'service-quality-improvement',
      'customer-retention-strategies',
      'loyalty-program-development'
    ],
    successMetrics: [
      { metric: 'Customer satisfaction', target: '95%+', measurement: 'NPS score' },
      { metric: 'Customer retention', target: '90%+', measurement: 'Retention rate' },
      { metric: 'Customer lifetime value', target: '25% increase', measurement: 'CLV' }
    ]
  },
  
  // Security & Compliance Chapters
  {
    id: 'security-advanced',
    title: 'Advanced Security',
    description: 'Advanced security measures and threat protection',
    actId: 'security-compliance',
    category: 'security',
    difficulty: 'advanced',
    estimatedValue: '$200,000+ in risk mitigation',
    timeToComplete: '4-8 weeks',
    improvements: [
      'Advanced threat protection',
      'Security monitoring',
      'Incident response',
      'Compliance automation'
    ],
    prerequisites: ['security-compliance'],
    playbookIds: [
      'advanced-threat-protection',
      'security-monitoring-system',
      'incident-response-plan',
      'compliance-automation'
    ],
    successMetrics: [
      { metric: 'Security incidents', target: '0', measurement: 'Monthly incidents' },
      { metric: 'Compliance score', target: '100%', measurement: 'Audit results' },
      { metric: 'Response time', target: '<1 hour', measurement: 'Incident response' }
    ]
  }
];

export const playbookHierarchy: PlaybookHierarchy = {
  acts: criticalActs,
  chapters: growthChapters
};

/**
 * Utility functions for working with the hierarchy
 */
export class PlaybookHierarchyService {
  /**
   * Get all acts for a business stage
   */
  static getActsForStage(businessStage: string): PlaybookAct[] {
    return criticalActs.filter(act => act.businessStage === businessStage);
  }

  /**
   * Get chapters for a specific act
   */
  static getChaptersForAct(actId: string): PlaybookChapter[] {
    return growthChapters.filter(chapter => chapter.actId === actId);
  }

  /**
   * Get critical acts that are missing for a business
   */
  static getMissingCriticalActs(completedPlaybookIds: string[]): PlaybookAct[] {
    return criticalActs.filter(act => {
      const hasAllPlaybooks = act.playbookIds.every(playbookId => 
        completedPlaybookIds.includes(playbookId)
      );
      return !hasAllPlaybooks;
    });
  }

  /**
   * Get recommended chapters based on completed acts
   */
  static getRecommendedChapters(completedPlaybookIds: string[]): PlaybookChapter[] {
    const completedActs = criticalActs.filter(act => {
      const hasAllPlaybooks = act.playbookIds.every(playbookId => 
        completedPlaybookIds.includes(playbookId)
      );
      return hasAllPlaybooks;
    });

    const actIds = completedActs.map(act => act.id);
    
    return growthChapters.filter(chapter => 
      actIds.includes(chapter.actId) &&
      chapter.prerequisites.every(prereq => 
        completedPlaybookIds.includes(prereq) || actIds.includes(prereq)
      )
    );
  }

  /**
   * Get business health score based on completed acts and chapters
   */
  static getBusinessHealthScore(completedPlaybookIds: string[]): {
    foundationScore: number;
    optimizationScore: number;
    overallScore: number;
    missingCritical: string[];
    recommendedNext: string[];
  } {
    const completedActs = criticalActs.filter(act => {
      const hasAllPlaybooks = act.playbookIds.every(playbookId => 
        completedPlaybookIds.includes(playbookId)
      );
      return hasAllPlaybooks;
    });

    const completedChapters = growthChapters.filter(chapter => 
      completedPlaybookIds.some(playbookId => chapter.playbookIds.includes(playbookId))
    );

    const foundationScore = (completedActs.length / criticalActs.length) * 100;
    const optimizationScore = (completedChapters.length / growthChapters.length) * 100;
    const overallScore = (foundationScore * 0.7) + (optimizationScore * 0.3);

    const missingCritical = criticalActs
      .filter(act => !completedActs.includes(act))
      .map(act => act.title);

    const recommendedNext = this.getRecommendedChapters(completedPlaybookIds)
      .slice(0, 3)
      .map(chapter => chapter.title);

    return {
      foundationScore: Math.round(foundationScore),
      optimizationScore: Math.round(optimizationScore),
      overallScore: Math.round(overallScore),
      missingCritical,
      recommendedNext
    };
  }
}
