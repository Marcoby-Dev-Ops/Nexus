import { BaseService } from '../shared/BaseService';
import type { ServiceResponse } from '../shared/BaseService';
import type { UserContext, BuildingBlock } from './types';

export class BuildingBlocksService extends BaseService {
  private readonly buildingBlocks: BuildingBlock[] = [
    // Sales Building Blocks
    {
      id: 'sales-automation',
      name: 'Sales Automation Block',
      description: 'Automated follow-up sequences and lead nurturing',
      category: 'sales',
      complexity: 'simple',
      implementationTime: 8,
      riskLevel: 'low',
      expectedImpact: 'high',
      prerequisites: ['Email marketing tool', 'Lead database'],
      successMetrics: ['Response rate', 'Conversion rate', 'Sales cycle length'],
      phaseRelevance: ['focus', 'insight', 'roadmap', 'execute'],
      mentalModelAlignment: ['successPatternRecognition', 'lowHangingFruit'],
      tags: ['automation', 'follow-up', 'email'],
      documentation: 'Follow HubSpot\'s proven email automation patterns',
      examples: ['HubSpot sequences', 'Mailchimp automation', 'ActiveCampaign workflows']
    },
    {
      id: 'lead-scoring',
      name: 'Lead Scoring Block',
      description: 'Prioritize leads based on engagement and fit',
      category: 'sales',
      complexity: 'medium',
      implementationTime: 16,
      riskLevel: 'medium',
      expectedImpact: 'high',
      prerequisites: ['CRM system', 'Lead data', 'Analytics'],
      successMetrics: ['Lead quality score', 'Conversion rate', 'Revenue per lead'],
      phaseRelevance: ['insight', 'roadmap', 'execute'],
      mentalModelAlignment: ['successPatternRecognition', 'riskMinimization'],
      tags: ['scoring', 'prioritization', 'analytics'],
      documentation: 'Implement Salesforce-style lead scoring algorithms',
      examples: ['Salesforce lead scoring', 'Pipedrive lead scoring', 'HubSpot lead scoring']
    },
    {
      id: 'pipeline-management',
      name: 'Pipeline Management Block',
      description: 'Visualize and optimize sales pipeline',
      category: 'sales',
      complexity: 'medium',
      implementationTime: 12,
      riskLevel: 'low',
      expectedImpact: 'medium',
      prerequisites: ['CRM system', 'Sales process'],
      successMetrics: ['Pipeline velocity', 'Win rate', 'Average deal size'],
      phaseRelevance: ['roadmap', 'execute'],
      mentalModelAlignment: ['successPatternRecognition', 'timeAllocation'],
      tags: ['pipeline', 'visualization', 'process'],
      documentation: 'Follow Pipedrive\'s pipeline management approach',
      examples: ['Pipedrive pipeline', 'Salesforce pipeline', 'HubSpot pipeline']
    },

    // Marketing Building Blocks
    {
      id: 'email-marketing',
      name: 'Email Marketing Block',
      description: 'Automated email campaigns and segmentation',
      category: 'marketing',
      complexity: 'simple',
      implementationTime: 6,
      riskLevel: 'low',
      expectedImpact: 'high',
      prerequisites: ['Email marketing tool', 'Subscriber list'],
      successMetrics: ['Open rate', 'Click-through rate', 'Conversion rate'],
      phaseRelevance: ['focus', 'insight', 'roadmap', 'execute'],
      mentalModelAlignment: ['lowHangingFruit', 'successPatternRecognition'],
      tags: ['email', 'automation', 'segmentation'],
      documentation: 'Follow Mailchimp\'s email marketing best practices',
      examples: ['Mailchimp campaigns', 'ConvertKit sequences', 'ActiveCampaign automation']
    },
    {
      id: 'customer-feedback',
      name: 'Customer Feedback Block',
      description: 'Collect and analyze customer feedback',
      category: 'marketing',
      complexity: 'simple',
      implementationTime: 4,
      riskLevel: 'low',
      expectedImpact: 'medium',
      prerequisites: ['Survey tool', 'Customer database'],
      successMetrics: ['Response rate', 'Satisfaction score', 'Net Promoter Score'],
      phaseRelevance: ['focus', 'insight'],
      mentalModelAlignment: ['giversVsTakers', 'circleOfCompetence'],
      tags: ['feedback', 'surveys', 'customer-insights'],
      documentation: 'Implement customer-centric feedback collection',
      examples: ['SurveyMonkey surveys', 'Typeform forms', 'Google Forms']
    },

    // Operations Building Blocks
    {
      id: 'process-automation',
      name: 'Process Automation Block',
      description: 'Automate repetitive business processes',
      category: 'operations',
      complexity: 'medium',
      implementationTime: 20,
      riskLevel: 'medium',
      expectedImpact: 'high',
      prerequisites: ['Process documentation', 'Automation tools'],
      successMetrics: ['Time saved', 'Error reduction', 'Process efficiency'],
      phaseRelevance: ['insight', 'roadmap', 'execute'],
      mentalModelAlignment: ['riskMinimization', 'timeAllocation'],
      tags: ['automation', 'process', 'efficiency'],
      documentation: 'Start with simple automations, then scale',
      examples: ['Zapier workflows', 'n8n automations', 'Microsoft Power Automate']
    },
    {
      id: 'analytics-dashboard',
      name: 'Analytics Dashboard Block',
      description: 'Real-time business metrics and insights',
      category: 'operations',
      complexity: 'complex',
      implementationTime: 32,
      riskLevel: 'medium',
      expectedImpact: 'high',
      prerequisites: ['Data sources', 'Analytics platform', 'Technical expertise'],
      successMetrics: ['Data accuracy', 'Insight quality', 'Decision speed'],
      phaseRelevance: ['execute'],
      mentalModelAlignment: ['circleOfCompetence', 'timeAllocation'],
      tags: ['analytics', 'dashboard', 'metrics'],
      documentation: 'Build dashboards that drive actionable insights',
      examples: ['Google Analytics', 'Mixpanel', 'Amplitude']
    },

    // Finance Building Blocks
    {
      id: 'cash-flow-tracking',
      name: 'Cash Flow Tracking Block',
      description: 'Monitor and forecast cash flow',
      category: 'finance',
      complexity: 'simple',
      implementationTime: 8,
      riskLevel: 'low',
      expectedImpact: 'high',
      prerequisites: ['Financial data', 'Accounting system'],
      successMetrics: ['Cash flow accuracy', 'Forecast precision', 'Decision quality'],
      phaseRelevance: ['focus', 'insight', 'roadmap', 'execute'],
      mentalModelAlignment: ['riskMinimization', 'ruleOf72'],
      tags: ['cash-flow', 'finance', 'forecasting'],
      documentation: 'Implement basic cash flow tracking and forecasting',
      examples: ['QuickBooks cash flow', 'Xero cash flow', 'Wave cash flow']
    },
    {
      id: 'budget-management',
      name: 'Budget Management Block',
      description: 'Create and track budgets by department',
      category: 'finance',
      complexity: 'medium',
      implementationTime: 16,
      riskLevel: 'low',
      expectedImpact: 'medium',
      prerequisites: ['Financial data', 'Department structure'],
      successMetrics: ['Budget adherence', 'Variance analysis', 'Cost control'],
      phaseRelevance: ['roadmap', 'execute'],
      mentalModelAlignment: ['riskMinimization', 'timeAllocation'],
      tags: ['budget', 'planning', 'control'],
      documentation: 'Implement department-based budget management',
      examples: ['QuickBooks budgets', 'Xero budgets', 'FreshBooks budgets']
    }
  ];

  async identifyForContext(
    phase: 'focus' | 'insight' | 'roadmap' | 'execute',
    mentalModelInsights: Record<string, any>,
    context: UserContext
  ): Promise<ServiceResponse<BuildingBlock[]>> {
    try {
      let relevantBlocks = this.buildingBlocks.filter(block => 
        block.phaseRelevance.includes(phase)
      );

      // Filter by mental model alignment
      if (mentalModelInsights.successPatternRecognition) {
        relevantBlocks = relevantBlocks.filter(block =>
          block.mentalModelAlignment.includes('successPatternRecognition')
        );
      }

      if (mentalModelInsights.riskMinimization) {
        relevantBlocks = relevantBlocks.filter(block =>
          block.riskLevel === 'low' || block.mentalModelAlignment.includes('riskMinimization')
        );
      }

      if (mentalModelInsights.lowHangingFruit) {
        relevantBlocks = relevantBlocks.filter(block =>
          block.complexity === 'simple' && block.expectedImpact === 'high'
        );
      }

      // Filter by user context
      relevantBlocks = relevantBlocks.filter(block => {
        // Experience level filtering
        if (context.experienceLevel === 'beginner' && block.complexity === 'complex') {
          return false;
        }
        if (context.experienceLevel === 'expert' && block.complexity === 'simple') {
          return false;
        }

        // Time availability filtering
        if (context.availableTime < 10 && block.implementationTime > 8) {
          return false;
        }

        // Technical capabilities filtering
        if (block.prerequisites.some(prereq => 
          !context.technicalCapabilities.some(cap => 
            cap.toLowerCase().includes(prereq.toLowerCase())
          )
        )) {
          return false;
        }

        return true;
      });

      // Sort by priority (impact * phase relevance - risk)
      relevantBlocks.sort((a, b) => {
        const aPriority = this.calculatePriority(a, phase, mentalModelInsights);
        const bPriority = this.calculatePriority(b, phase, mentalModelInsights);
        return bPriority - aPriority;
      });

      return this.createResponse(relevantBlocks.slice(0, 5)); // Return top 5
    } catch (error) {
      return this.handleError(error, 'Failed to identify building blocks for context');
    }
  }

  async getAvailableBlocks(context: UserContext): Promise<ServiceResponse<BuildingBlock[]>> {
    try {
      const availableBlocks = this.buildingBlocks.filter(block => {
        // Filter by user capabilities and constraints
        if (context.experienceLevel === 'beginner' && block.complexity === 'complex') {
          return false;
        }
        if (context.availableTime < 10 && block.implementationTime > 8) {
          return false;
        }
        return true;
      });

      return this.createResponse(availableBlocks);
    } catch (error) {
      return this.handleError(error, 'Failed to get available building blocks');
    }
  }

  async getBlockById(blockId: string): Promise<ServiceResponse<BuildingBlock | null>> {
    try {
      const block = this.buildingBlocks.find(b => b.id === blockId);
      return this.createResponse(block || null);
    } catch (error) {
      return this.handleError(error, 'Failed to get building block by ID');
    }
  }

  async getBlocksByCategory(category: string): Promise<ServiceResponse<BuildingBlock[]>> {
    try {
      const blocks = this.buildingBlocks.filter(block => block.category === category);
      return this.createResponse(blocks);
    } catch (error) {
      return this.handleError(error, 'Failed to get blocks by category');
    }
  }

  async getBlocksByComplexity(complexity: 'simple' | 'medium' | 'complex'): Promise<ServiceResponse<BuildingBlock[]>> {
    try {
      const blocks = this.buildingBlocks.filter(block => block.complexity === complexity);
      return this.createResponse(blocks);
    } catch (error) {
      return this.handleError(error, 'Failed to get blocks by complexity');
    }
  }

  async getImplementationPlan(blockId: string, context: UserContext): Promise<ServiceResponse<{
    block: BuildingBlock;
    implementationSteps: string[];
    timeline: Record<string, string[]>;
    resources: string[];
    successCriteria: string[];
  }>> {
    try {
      const block = this.buildingBlocks.find(b => b.id === blockId);
      if (!block) {
        throw new Error(`Building block ${blockId} not found`);
      }

      const implementationSteps = this.generateImplementationSteps(block, context);
      const timeline = this.generateTimeline(block, context);
      const resources = this.identifyResources(block, context);
      const successCriteria = this.defineSuccessCriteria(block);

      return this.createResponse({
        block,
        implementationSteps,
        timeline,
        resources,
        successCriteria
      });
    } catch (error) {
      return this.handleError(error, 'Failed to get implementation plan');
    }
  }

  private calculatePriority(
    block: BuildingBlock,
    phase: string,
    mentalModelInsights: Record<string, any>
  ): number {
    let priority = 0;

    // Base priority from impact and complexity
    const impactScore = { low: 1, medium: 2, high: 3 }[block.expectedImpact];
    const complexityScore = { simple: 3, medium: 2, complex: 1 }[block.complexity];
    const riskPenalty = { low: 0, medium: 1, high: 2 }[block.riskLevel];

    priority += impactScore * complexityScore - riskPenalty;

    // Phase relevance bonus
    if (block.phaseRelevance.includes(phase as any)) {
      priority += 2;
    }

    // Mental model alignment bonus
    Object.keys(mentalModelInsights).forEach(model => {
      if (block.mentalModelAlignment.includes(model)) {
        priority += 1;
      }
    });

    return priority;
  }

  private generateImplementationSteps(block: BuildingBlock, context: UserContext): string[] {
    const steps: string[] = [];

    // Generic implementation steps
    steps.push(`Research ${block.name} best practices`);
    steps.push(`Set up prerequisites: ${block.prerequisites.join(', ')}`);
    steps.push(`Configure ${block.name} with basic settings`);
    steps.push(`Test ${block.name} with sample data`);
    steps.push(`Deploy ${block.name} to production`);
    steps.push(`Monitor ${block.name} performance`);
    steps.push(`Optimize ${block.name} based on results`);

    // Context-specific steps
    if (context.experienceLevel === 'beginner') {
      steps.unshift(`Get training on ${block.name}`);
      steps.push(`Get expert review of ${block.name} implementation`);
    }

    if (block.complexity === 'complex') {
      steps.unshift(`Assemble implementation team`);
      steps.push(`Document ${block.name} processes`);
    }

    return steps;
  }

  private generateTimeline(block: BuildingBlock, context: UserContext): Record<string, string[]> {
    const timeline: Record<string, string[]> = {
      week1: [],
      week2: [],
      week3: [],
      week4: []
    };

    const totalWeeks = Math.ceil(block.implementationTime / (context.availableTime / 4));
    const stepsPerWeek = Math.ceil(block.implementationTime / totalWeeks);

    // Distribute implementation steps across weeks
    const steps = this.generateImplementationSteps(block, context);
    steps.forEach((step, index) => {
      const week = Math.floor(index / stepsPerWeek) + 1;
      if (week <= 4) {
        timeline[`week${week}`].push(step);
      }
    });

    return timeline;
  }

  private identifyResources(block: BuildingBlock, context: UserContext): string[] {
    const resources: string[] = [];

    // Required tools and platforms
    resources.push(...block.prerequisites);

    // Human resources
    if (block.complexity === 'complex') {
      resources.push('Technical expert or consultant');
    }
    if (context.experienceLevel === 'beginner') {
      resources.push('Training or mentorship');
    }

    // Documentation and examples
    resources.push(`${block.name} documentation`);
    resources.push(`${block.name} examples and case studies`);

    return resources;
  }

  private defineSuccessCriteria(block: BuildingBlock): string[] {
    return [
      ...block.successMetrics,
      'User adoption rate > 80%',
      'Implementation completed within timeline',
      'Positive ROI within 3 months'
    ];
  }
}
