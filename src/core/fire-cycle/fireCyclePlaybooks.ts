import type { FireCyclePhase } from '@/domains/business/fire-cycle/types';
import type { UserContext } from './fireCycleLogic';

export interface SolutionsPlaybook {
  id: string;
  name: string;
  description: string;
  category: PlaybookCategory;
  problem: string;
  focus: string;
  insight: string;
  roadmap: PlaybookStep[];
  execute: PlaybookAction[];
  prerequisites: string[];
  estimatedTime: number; // minutes
  successMetrics: string[];
  confidence: number;
  tags: string[];
}

export interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  firePhase: FireCyclePhase;
  order: number;
  estimatedTime: number; // minutes
  dependencies: string[]; // step IDs
  resources: PlaybookResource[];
  checkpoints: PlaybookCheckpoint[];
}

export interface PlaybookAction {
  id: string;
  title: string;
  description: string;
  firePhase: FireCyclePhase;
  type: 'automation' | 'task' | 'delegation' | 'integration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: number; // minutes
  canAutomate: boolean;
  automationScript?: string;
  assignee?: string;
  dueDate?: Date;
}

export interface PlaybookResource {
  type: 'template' | 'guide' | 'tool' | 'integration';
  name: string;
  url?: string;
  description: string;
}

export interface PlaybookCheckpoint {
  id: string;
  question: string;
  criteria: string[];
  required: boolean;
}

export type PlaybookCategory = 
  | 'sales' 
  | 'marketing' 
  | 'product' 
  | 'operations' 
  | 'finance' 
  | 'hr' 
  | 'customer-success' 
  | 'general';

export interface PlaybookRecommendation {
  playbook: SolutionsPlaybook;
  relevance: number; // 0-1
  reasoning: string;
  userContext: Partial<UserContext>;
  nextAction: PlaybookAction;
}

export class FireCyclePlaybooks {
  private playbooks: SolutionsPlaybook[] = [];

  constructor() {
    this.initializePlaybooks();
  }

  /**
   * Find the most relevant playbook for user context
   */
  async recommendPlaybook(
    userContext: UserContext,
    currentPhase: FireCyclePhase,
    detectedProblem?: string
  ): Promise<PlaybookRecommendation[]> {
    const recommendations: PlaybookRecommendation[] = [];

    for (const playbook of this.playbooks) {
      const relevance = this.calculateRelevance(playbook, userContext, currentPhase, detectedProblem);
      
      if (relevance > 0.3) { // Only recommend if reasonably relevant
        const nextAction = this.getNextAction(playbook, currentPhase);
        
        recommendations.push({
          playbook,
          relevance,
          reasoning: this.generateReasoning(playbook, userContext, currentPhase),
          userContext: this.extractRelevantContext(userContext),
          nextAction
        });
      }
    }

    // Sort by relevance
    return recommendations.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Get playbook by ID
   */
  getPlaybook(id: string): SolutionsPlaybook | undefined {
    return this.playbooks.find(p => p.id === id);
  }

  /**
   * Get playbooks by category
   */
  getPlaybooksByCategory(category: PlaybookCategory): SolutionsPlaybook[] {
    return this.playbooks.filter(p => p.category === category);
  }

  /**
   * Calculate relevance score for a playbook
   */
  private calculateRelevance(
    playbook: SolutionsPlaybook,
    userContext: UserContext,
    currentPhase: FireCyclePhase,
    detectedProblem?: string
  ): number {
    let score = 0;

    // Phase alignment
    if (currentPhase === 'focus' && playbook.focus) score += 0.3;
    if (currentPhase === 'insight' && playbook.insight) score += 0.3;
    if (currentPhase === 'roadmap' && playbook.roadmap.length > 0) score += 0.3;
    if (currentPhase === 'execute' && playbook.execute.length > 0) score += 0.3;

    // Problem matching
    if (detectedProblem && playbook.problem.toLowerCase().includes(detectedProblem.toLowerCase())) {
      score += 0.4;
    }

    // User context matching
    if (playbook.tags.some(tag => userContext.role?.toLowerCase().includes(tag))) score += 0.2;
    if (playbook.tags.some(tag => userContext.department?.toLowerCase().includes(tag))) score += 0.2;
    if (playbook.tags.some(tag => userContext.industry?.toLowerCase().includes(tag))) score += 0.1;

    // Company size matching
    if (playbook.tags.some(tag => userContext.companySize?.toLowerCase().includes(tag))) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Generate reasoning for recommendation
   */
  private generateReasoning(
    playbook: SolutionsPlaybook,
    userContext: UserContext,
    currentPhase: FireCyclePhase
  ): string {
    const reasons = [];

    if (currentPhase === 'focus') {
      reasons.push(`This playbook helps clarify: ${playbook.focus}`);
    } else if (currentPhase === 'insight') {
      reasons.push(`This playbook provides insights on: ${playbook.insight}`);
    } else if (currentPhase === 'roadmap') {
      reasons.push(`This playbook offers a ${playbook.roadmap.length}-step roadmap`);
    } else if (currentPhase === 'execute') {
      reasons.push(`This playbook provides ${playbook.execute.length} actionable steps`);
    }

    if (userContext.role) {
      reasons.push(`Tailored for ${userContext.role} role`);
    }

    if (playbook.estimatedTime) {
      reasons.push(`Estimated time: ${playbook.estimatedTime} minutes`);
    }

    return reasons.join('. ');
  }

  /**
   * Extract relevant user context for recommendation
   */
  private extractRelevantContext(userContext: UserContext): Partial<UserContext> {
    return {
      role: userContext.role,
      department: userContext.department,
      industry: userContext.industry,
      companySize: userContext.companySize,
      stage: userContext.stage
    };
  }

  /**
   * Get next action for current phase
   */
  private getNextAction(playbook: SolutionsPlaybook, currentPhase: FireCyclePhase): PlaybookAction {
    switch (currentPhase) {
      case 'focus':
        return {
          id: 'focus-action',
          title: 'Define the Problem',
          description: playbook.focus,
          firePhase: 'focus',
          type: 'task',
          priority: 'high',
          estimatedEffort: 15,
          canAutomate: false
        };
      case 'insight':
        return {
          id: 'insight-action',
          title: 'Gather Insights',
          description: playbook.insight,
          firePhase: 'insight',
          type: 'task',
          priority: 'medium',
          estimatedEffort: 30,
          canAutomate: false
        };
      case 'roadmap':
        const nextStep = playbook.roadmap.find(step => step.order === 1);
        return {
          id: 'roadmap-action',
          title: nextStep?.title || 'Start Roadmap',
          description: nextStep?.description || 'Begin the first step of the roadmap',
          firePhase: 'roadmap',
          type: 'task',
          priority: 'high',
          estimatedEffort: nextStep?.estimatedTime || 30,
          canAutomate: false
        };
      case 'execute':
        const nextAction = playbook.execute.find(action => action.priority === 'high');
        return nextAction || playbook.execute[0] || {
          id: 'execute-action',
          title: 'Take Action',
          description: 'Execute the next step',
          firePhase: 'execute',
          type: 'task',
          priority: 'high',
          estimatedEffort: 30,
          canAutomate: false
        };
    }
  }

  /**
   * Initialize all playbooks
   */
  private initializePlaybooks(): void {
    this.playbooks = [
      // Sales Playbooks
      {
        id: 'sales-pipeline-stalled',
        name: 'Re-energize Sales Pipeline',
        description: 'Boost your sales pipeline when leads are drying up',
        category: 'sales',
        problem: 'Sales lead response rate is low',
        focus: 'Clarify target response KPIs and identify bottlenecks',
        insight: 'Identify stages with highest drop-off and analyze lead quality',
        roadmap: [
          {
            id: 'step-1',
            title: 'Review Lead Sources',
            description: 'Analyze which lead sources are performing best',
            firePhase: 'insight',
            order: 1,
            estimatedTime: 30,
            dependencies: [],
            resources: [
              {
                type: 'tool',
                name: 'Lead Source Analytics',
                description: 'Track lead source performance'
              }
            ],
            checkpoints: [
              {
                id: 'cp-1',
                question: 'Which lead sources have the highest conversion rate?',
                criteria: ['Identified top 3 lead sources', 'Calculated conversion rates'],
                required: true
              }
            ]
          },
          {
            id: 'step-2',
            title: 'Automate First-Touch Emails',
            description: 'Set up automated email sequences for new leads',
            firePhase: 'roadmap',
            order: 2,
            estimatedTime: 45,
            dependencies: ['step-1'],
            resources: [
              {
                type: 'template',
                name: 'First-Touch Email Templates',
                description: 'Pre-written email templates'
              }
            ],
            checkpoints: [
              {
                id: 'cp-2',
                question: 'Are automated emails configured?',
                criteria: ['Email sequence created', 'Triggers set up'],
                required: true
              }
            ]
          },
          {
            id: 'step-3',
            title: 'Schedule Weekly Lead Review',
            description: 'Establish regular review process for lead quality',
            firePhase: 'execute',
            order: 3,
            estimatedTime: 15,
            dependencies: ['step-2'],
            resources: [
              {
                type: 'guide',
                name: 'Lead Review Checklist',
                description: 'Step-by-step review process'
              }
            ],
            checkpoints: [
              {
                id: 'cp-3',
                question: 'Is weekly review scheduled?',
                criteria: ['Calendar invite sent', 'Agenda prepared'],
                required: true
              }
            ]
          }
        ],
        execute: [
          {
            id: 'action-1',
            title: 'Enable Lead Scoring Automation',
            description: 'Automatically score leads based on engagement',
            firePhase: 'execute',
            type: 'automation',
            priority: 'high',
            estimatedEffort: 60,
            canAutomate: true,
            automationScript: 'lead-scoring-automation'
          },
          {
            id: 'action-2',
            title: 'Assign Follow-up Tasks',
            description: 'Create tasks for sales team follow-up',
            firePhase: 'execute',
            type: 'task',
            priority: 'medium',
            estimatedEffort: 30,
            canAutomate: true
          }
        ],
        prerequisites: ['CRM system', 'Email marketing tool'],
        estimatedTime: 90,
        successMetrics: ['Lead response rate increased by 25%', 'Pipeline velocity improved'],
        confidence: 0.85,
        tags: ['sales', 'pipeline', 'leads', 'automation']
      },

      // Marketing Playbooks
      {
        id: 'marketing-campaign-optimization',
        name: 'Optimize Marketing Campaign',
        description: 'Improve campaign performance and ROI',
        category: 'marketing',
        problem: 'Marketing campaign performance is declining',
        focus: 'Identify underperforming campaigns and optimization opportunities',
        insight: 'Analyze campaign metrics and audience behavior patterns',
        roadmap: [
          {
            id: 'step-1',
            title: 'Audit Current Campaigns',
            description: 'Review all active campaigns and their performance',
            firePhase: 'insight',
            order: 1,
            estimatedTime: 60,
            dependencies: [],
            resources: [
              {
                type: 'tool',
                name: 'Campaign Analytics Dashboard',
                description: 'Comprehensive campaign performance view'
              }
            ],
            checkpoints: [
              {
                id: 'cp-1',
                question: 'Which campaigns are underperforming?',
                criteria: ['Performance data collected', 'ROI calculated'],
                required: true
              }
            ]
          },
          {
            id: 'step-2',
            title: 'A/B Test Key Elements',
            description: 'Test different creative and messaging approaches',
            firePhase: 'roadmap',
            order: 2,
            estimatedTime: 120,
            dependencies: ['step-1'],
            resources: [
              {
                type: 'template',
                name: 'A/B Test Templates',
                description: 'Pre-built test variations'
              }
            ],
            checkpoints: [
              {
                id: 'cp-2',
                question: 'Are A/B tests running?',
                criteria: ['Tests created', 'Traffic split configured'],
                required: true
              }
            ]
          }
        ],
        execute: [
          {
            id: 'action-1',
            title: 'Implement Winning Variations',
            description: 'Apply best-performing elements across campaigns',
            firePhase: 'execute',
            type: 'automation',
            priority: 'high',
            estimatedEffort: 45,
            canAutomate: true
          }
        ],
        prerequisites: ['Marketing analytics platform', 'A/B testing tool'],
        estimatedTime: 180,
        successMetrics: ['Campaign ROI improved by 20%', 'Conversion rate increased'],
        confidence: 0.8,
        tags: ['marketing', 'campaign', 'optimization', 'A/B testing']
      },

      // Product Playbooks
      {
        id: 'product-feature-launch',
        name: 'Launch New Product Feature',
        description: 'Successfully launch a new product feature',
        category: 'product',
        problem: 'Need to launch a new feature effectively',
        focus: 'Define success metrics and target audience for the feature',
        insight: 'Analyze user needs and market opportunity',
        roadmap: [
          {
            id: 'step-1',
            title: 'Define Success Metrics',
            description: 'Establish clear KPIs for feature success',
            firePhase: 'focus',
            order: 1,
            estimatedTime: 30,
            dependencies: [],
            resources: [
              {
                type: 'guide',
                name: 'Feature Launch Checklist',
                description: 'Comprehensive launch checklist'
              }
            ],
            checkpoints: [
              {
                id: 'cp-1',
                question: 'Are success metrics defined?',
                criteria: ['KPIs identified', 'Baseline established'],
                required: true
              }
            ]
          },
          {
            id: 'step-2',
            title: 'Plan Launch Strategy',
            description: 'Create comprehensive launch plan',
            firePhase: 'roadmap',
            order: 2,
            estimatedTime: 90,
            dependencies: ['step-1'],
            resources: [
              {
                type: 'template',
                name: 'Launch Plan Template',
                description: 'Structured launch planning'
              }
            ],
            checkpoints: [
              {
                id: 'cp-2',
                question: 'Is launch plan complete?',
                criteria: ['Timeline created', 'Resources allocated'],
                required: true
              }
            ]
          }
        ],
        execute: [
          {
            id: 'action-1',
            title: 'Execute Launch Plan',
            description: 'Implement the launch strategy',
            firePhase: 'execute',
            type: 'task',
            priority: 'critical',
            estimatedEffort: 120,
            canAutomate: false
          }
        ],
        prerequisites: ['Product analytics', 'User feedback system'],
        estimatedTime: 240,
        successMetrics: ['Feature adoption rate', 'User satisfaction score'],
        confidence: 0.9,
        tags: ['product', 'feature', 'launch', 'user-experience']
      }
    ];
  }
}

// Hook for easy playbook integration
export const useFireCyclePlaybooks = () => {
  const playbooks = new FireCyclePlaybooks();
  
  return {
    recommendPlaybook: (userContext: UserContext, currentPhase: FireCyclePhase, detectedProblem?: string) =>
      playbooks.recommendPlaybook(userContext, currentPhase, detectedProblem),
    getPlaybook: (id: string) => playbooks.getPlaybook(id),
    getPlaybooksByCategory: (category: PlaybookCategory) => playbooks.getPlaybooksByCategory(category)
  };
}; 