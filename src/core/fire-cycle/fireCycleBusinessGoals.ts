import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import type { FireCyclePhase } from '@/core/fire-cycle/fireCycleStore';

export interface BusinessGoal {
  id: string;
  title: string;
  description: string;
  category: BusinessGoalCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';
  firePhase: FireCyclePhase;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  targetDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  metrics?: GoalMetric[];
  playbookId?: string;
  tasks?: Task[];
  insights?: Insight[];
  roadmap?: RoadmapStep[];
}

export interface GoalMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  actualHours?: number;
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  dependencies?: string[]; // Task IDs
  playbookStepId?: string;
}

export interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'pattern';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  source: 'data' | 'feedback' | 'analysis' | 'intuition';
  createdAt: Date;
  actions?: string[];
}

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  phase: FireCyclePhase;
  order: number;
  estimatedDuration: number; // days
  dependencies?: string[]; // Step IDs
  status: 'planned' | 'in-progress' | 'completed' | 'blocked';
  tasks?: string[]; // Task IDs
  playbookId?: string;
}

export interface FireCycleBusinessPlaybook {
  id: string;
  name: string;
  description: string;
  category: BusinessGoalCategory;
  maturityLevel: 'startup' | 'growth' | 'established' | 'enterprise';
  firePhase: FireCyclePhase;
  steps: PlaybookStep[];
  estimatedDuration: number; // days
  successMetrics: string[];
  prerequisites: string[];
  risks: string[];
}

export interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  firePhase: FireCyclePhase;
  order: number;
  estimatedHours: number;
  deliverables: string[];
  checkpoints: string[];
  resources: string[];
  templates?: string[];
}

export type BusinessGoalCategory = 
  | 'revenue-growth'
  | 'cost-reduction'
  | 'market-expansion'
  | 'product-development'
  | 'team-management'
  | 'customer-acquisition'
  | 'operational-efficiency'
  | 'financial-management'
  | 'risk-mitigation'
  | 'compliance'
  | 'technology-upgrade'
  | 'process-improvement';

export interface FIREAnalysis {
  goal: BusinessGoal;
  currentPhase: FireCyclePhase;
  phaseProgress: number; // 0-100
  nextActions: Task[];
  insights: Insight[];
  playbookRecommendations: FireCycleBusinessPlaybook[];
  risks: string[];
  opportunities: string[];
  estimatedTimeline: number; // days
  confidence: number; // 0-1
}

export class FireCycleBusinessGoalsService extends BaseService {
  
  /**
   * Analyze a business goal and determine the optimal FIRE phase
   */
  async analyzeBusinessGoal(goal: Partial<BusinessGoal>): Promise<ServiceResponse<FIREAnalysis>> {
    try {
      const category = goal.category || 'revenue-growth';
      const maturityLevel = await this.getOrganizationMaturityLevel();
      
      // Determine current FIRE phase based on goal state
      const currentPhase = this.determineCurrentPhase(goal);
      
      // Get relevant playbooks for this goal category and maturity
      const playbookRecommendations = await this.getPlaybookRecommendations(
        category, 
        maturityLevel, 
        currentPhase
      );
      
      // Generate insights based on goal context
      const insights = await this.generateInsights(goal, currentPhase);
      
      // Create next actions based on current phase
      const nextActions = await this.generateNextActions(goal, currentPhase, playbookRecommendations);
      
      // Calculate progress and timeline
      const phaseProgress = this.calculatePhaseProgress(goal, currentPhase);
      const estimatedTimeline = this.estimateTimeline(goal, playbookRecommendations);
      
      // Identify risks and opportunities
      const { risks, opportunities } = await this.analyzeRisksAndOpportunities(goal, currentPhase);
      
      const analysis: FIREAnalysis = {
        goal: goal as BusinessGoal,
        currentPhase,
        phaseProgress,
        nextActions,
        insights,
        playbookRecommendations,
        risks,
        opportunities,
        estimatedTimeline,
        confidence: this.calculateConfidence(goal, currentPhase, insights)
      };
      
      return this.createResponse(analysis);
    } catch (error) {
      return this.handleError(error, 'Failed to analyze business goal');
    }
  }

  /**
   * Create a new business goal with FIRE phase guidance
   */
  async createBusinessGoal(goalData: Partial<BusinessGoal>): Promise<ServiceResponse<BusinessGoal>> {
    try {
      // Determine initial FIRE phase
      const initialPhase = this.determineInitialPhase(goalData);
      
      // Get recommended playbook
      const playbook = await this.getRecommendedPlaybook(goalData, initialPhase);
      
      // Create roadmap steps based on playbook
      const roadmap = await this.createRoadmapFromPlaybook(playbook, goalData);
      
      // Generate initial tasks
      const tasks = await this.generateInitialTasks(goalData, initialPhase, playbook);
      
      const goal: BusinessGoal = {
        id: this.generateId(),
        title: goalData.title || 'Untitled Goal',
        description: goalData.description || '',
        category: goalData.category || 'revenue-growth',
        priority: goalData.priority || 'medium',
        firePhase: initialPhase,
        status: 'active',
        targetDate: goalData.targetDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        playbookId: playbook?.id,
        tasks,
        roadmap
      };
      
      return this.createResponse(goal);
    } catch (error) {
      return this.handleError(error, 'Failed to create business goal');
    }
  }

  /**
   * Advance a goal through the FIRE phases
   */
  async advanceGoalPhase(goalId: string, targetPhase: FireCyclePhase): Promise<ServiceResponse<BusinessGoal>> {
    try {
      // Get current goal
      const goal = await this.getGoal(goalId);
      if (!goal) {
        return this.createErrorResponse('Goal not found');
      }
      
      // Validate phase transition
      const isValidTransition = this.validatePhaseTransition(goal.firePhase, targetPhase);
      if (!isValidTransition) {
        return this.createErrorResponse('Invalid phase transition');
      }
      
      // Update goal phase
      goal.firePhase = targetPhase;
      goal.updatedAt = new Date();
      
      // Generate new tasks for the new phase
      const newTasks = await this.generatePhaseTasks(goal, targetPhase);
      goal.tasks = [...(goal.tasks || []), ...newTasks];
      
      // Update roadmap progress
      await this.updateRoadmapProgress(goal, targetPhase);
      
      return this.createResponse(goal);
    } catch (error) {
      return this.handleError(error, 'Failed to advance goal phase');
    }
  }

  /**
   * Get proven playbooks for business goals
   */
  async getBusinessPlaybooks(
    category?: BusinessGoalCategory,
    maturityLevel?: string,
    phase?: FireCyclePhase
  ): Promise<ServiceResponse<FireCycleBusinessPlaybook[]>> {
    try {
      const playbooks = await this.loadPlaybooks();
      
      let filtered = playbooks;
      
      if (category) {
        filtered = filtered.filter(p => p.category === category);
      }
      
      if (maturityLevel) {
        filtered = filtered.filter(p => p.maturityLevel === maturityLevel);
      }
      
      if (phase) {
        filtered = filtered.filter(p => p.firePhase === phase);
      }
      
      return this.createResponse(filtered);
    } catch (error) {
      return this.handleError(error, 'Failed to get business playbooks');
    }
  }

  /**
   * Track goal progress and provide accountability
   */
  async trackGoalProgress(goalId: string): Promise<ServiceResponse<{
    progress: number;
    completedTasks: number;
    totalTasks: number;
    phaseProgress: Record<FireCyclePhase, number>;
    nextMilestone: string;
    estimatedCompletion: Date;
  }>> {
    try {
      const goal = await this.getGoal(goalId);
      if (!goal) {
        return this.createErrorResponse('Goal not found');
      }
      
      const tasks = goal.tasks || [];
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const totalTasks = tasks.length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      // Calculate phase progress for all phases
      const phaseProgress: Record<FireCyclePhase, number> = {
        focus: this.calculatePhaseProgress(goal, 'focus'),
        insight: this.calculatePhaseProgress(goal, 'insight'),
        roadmap: this.calculatePhaseProgress(goal, 'roadmap'),
        execute: this.calculatePhaseProgress(goal, 'execute')
      };
      
      // Find next milestone
      const nextMilestone = this.findNextMilestone(goal);
      
      // Estimate completion date
      const estimatedCompletion = this.estimateCompletionDate(goal, progress);
      
      return this.createResponse({
        progress,
        completedTasks,
        totalTasks,
        phaseProgress,
        nextMilestone,
        estimatedCompletion
      });
    } catch (error) {
      return this.handleError(error, 'Failed to track goal progress');
    }
  }

  // Private helper methods

  private determineCurrentPhase(_goal: Partial<BusinessGoal>): FireCyclePhase {
    // Logic to determine current phase based on goal state
    if (!_goal.tasks || _goal.tasks.length === 0) {
      return 'focus';
    }
    
    const completedTasks = _goal.tasks.filter((t: Task) => t.status === 'completed').length;
    const totalTasks = _goal.tasks.length;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
    
    if (completionRate < 0.25) return 'focus';
    if (completionRate < 0.5) return 'insight';
    if (completionRate < 0.75) return 'roadmap';
    return 'execute';
  }

  private determineInitialPhase(_goalData: Partial<BusinessGoal>): FireCyclePhase {
    // Most business goals start in Focus phase
    return 'focus';
  }

  private async getOrganizationMaturityLevel(): Promise<string> {
    // This would integrate with organization data
    // For now, return a default
    return 'growth';
  }

  private async getPlaybookRecommendations(
    category: BusinessGoalCategory,
    maturityLevel: string,
    phase: FireCyclePhase
  ): Promise<FireCycleBusinessPlaybook[]> {
    const _playbooks = await this.loadPlaybooks();
    return _playbooks.filter(p => 
      p.category === category && 
      p.maturityLevel === maturityLevel &&
      p.firePhase === phase
    );
  }

  private async generateInsights(goal: Partial<BusinessGoal>, phase: FireCyclePhase): Promise<Insight[]> {
    // Generate insights based on goal context and current phase
    const insights: Insight[] = [];
    
    // Add phase-specific insights
    switch (phase) {
      case 'focus':
        insights.push({
          id: this.generateId(),
          type: 'opportunity',
          title: 'Goal Clarity Opportunity',
          description: 'This goal could benefit from more specific metrics and timelines',
          impact: 'high',
          confidence: 0.8,
          source: 'analysis',
          createdAt: new Date(),
          actions: ['Define specific metrics', 'Set target dates', 'Identify key stakeholders']
        });
        break;
      case 'insight':
        insights.push({
          id: this.generateId(),
          type: 'trend',
          title: 'Market Trend Analysis',
          description: 'Current market conditions favor this type of initiative',
          impact: 'medium',
          confidence: 0.7,
          source: 'data',
          createdAt: new Date(),
          actions: ['Research market data', 'Analyze competitor actions', 'Validate assumptions']
        });
        break;
      // Add more phase-specific insights
    }
    
    return insights;
  }

  private async generateNextActions(
    goal: Partial<BusinessGoal>, 
    phase: FireCyclePhase, 
    _playbooks: FireCycleBusinessPlaybook[]
  ): Promise<Task[]> {
    const tasks: Task[] = [];
    
    // Generate tasks based on current phase and recommended playbooks
    switch (phase) {
      case 'focus':
        tasks.push({
          id: this.generateId(),
          title: 'Define Goal Metrics',
          description: 'Establish specific, measurable metrics for this goal',
          status: 'todo',
          priority: 'high',
          estimatedHours: 2,
          playbookStepId: 'define-metrics'
        });
        break;
      case 'insight':
        tasks.push({
          id: this.generateId(),
          title: 'Conduct Market Research',
          description: 'Gather data and insights to inform strategy',
          status: 'todo',
          priority: 'high',
          estimatedHours: 4,
          playbookStepId: 'market-research'
        });
        break;
      case 'roadmap':
        tasks.push({
          id: this.generateId(),
          title: 'Create Implementation Plan',
          description: 'Develop detailed roadmap with milestones',
          status: 'todo',
          priority: 'high',
          estimatedHours: 3,
          playbookStepId: 'create-plan'
        });
        break;
      case 'execute':
        tasks.push({
          id: this.generateId(),
          title: 'Begin Implementation',
          description: 'Start executing the first phase of the plan',
          status: 'todo',
          priority: 'critical',
          estimatedHours: 8,
          playbookStepId: 'begin-execution'
        });
        break;
    }
    
    return tasks;
  }

  private calculatePhaseProgress(goal: Partial<BusinessGoal>, phase: FireCyclePhase): number {
    // Calculate progress within the current phase
    const phaseTasks = goal.tasks?.filter(t => t.playbookStepId?.includes(phase)) || [];
    if (phaseTasks.length === 0) return 0;
    
    const completed = phaseTasks.filter(t => t.status === 'completed').length;
    return (completed / phaseTasks.length) * 100;
  }

  private estimateTimeline(goal: Partial<BusinessGoal>, playbooks: FireCycleBusinessPlaybook[]): number {
    // Estimate timeline based on playbook recommendations
    const totalHours = playbooks.reduce((sum, p) => sum + p.estimatedDuration * 8, 0);
    return Math.ceil(totalHours / 40); // Assuming 40-hour work week
  }

  private async analyzeRisksAndOpportunities(
    goal: Partial<BusinessGoal>, 
    phase: FireCyclePhase
  ): Promise<{ risks: string[], opportunities: string[] }> {
    const risks: string[] = [];
    const opportunities: string[] = [];
    
    // Add phase-specific risks and opportunities
    switch (phase) {
      case 'focus':
        risks.push('Unclear goal definition may lead to scope creep');
        opportunities.push('Clear goal definition will improve team alignment');
        break;
      case 'insight':
        risks.push('Insufficient data may lead to poor decisions');
        opportunities.push('Market research may reveal new opportunities');
        break;
      case 'roadmap':
        risks.push('Overly complex plan may be difficult to execute');
        opportunities.push('Well-structured plan will improve execution efficiency');
        break;
      case 'execute':
        risks.push('Resource constraints may delay implementation');
        opportunities.push('Successful execution will drive business results');
        break;
    }
    
    return { risks, opportunities };
  }

  private calculateConfidence(
    goal: Partial<BusinessGoal>, 
    phase: FireCyclePhase, 
    insights: Insight[]
  ): number {
    // Calculate confidence based on goal clarity, available data, and insights
    let confidence = 0.5; // Base confidence
    
    // Adjust based on goal completeness
    if (goal.title && goal.description) confidence += 0.2;
    if (goal.targetDate) confidence += 0.1;
    if (goal.metrics && goal.metrics.length > 0) confidence += 0.2;
    
    // Adjust based on insights quality
    const highConfidenceInsights = insights.filter(i => i.confidence > 0.7).length;
    confidence += Math.min(highConfidenceInsights * 0.05, 0.2);
    
    return Math.min(confidence, 1.0);
  }

  private async loadPlaybooks(): Promise<FireCycleBusinessPlaybook[]> {
    // This would load from database or configuration
    // For now, return sample playbooks
    return [
      {
        id: 'revenue-growth-startup',
        name: 'Revenue Growth for Startups',
        description: 'Proven playbook for increasing revenue in early-stage companies',
        category: 'revenue-growth',
        maturityLevel: 'startup',
        firePhase: 'focus',
        steps: [
          {
            id: 'define-metrics',
            title: 'Define Revenue Metrics',
            description: 'Establish clear revenue targets and KPIs',
            firePhase: 'focus',
            order: 1,
            estimatedHours: 2,
            deliverables: ['Revenue targets', 'KPI definitions', 'Measurement plan'],
            checkpoints: ['Metrics defined', 'Targets set', 'Plan approved'],
            resources: ['Financial data', 'Market research', 'Team input']
          }
        ],
        estimatedDuration: 30,
        successMetrics: ['Revenue growth rate', 'Customer acquisition cost', 'Lifetime value'],
        prerequisites: ['Basic financial tracking', 'Customer data'],
        risks: ['Market conditions', 'Resource constraints', 'Timeline pressure']
      }
      // Add more playbooks
    ];
  }

  private async getGoal(_goalId: string): Promise<BusinessGoal | null> {
    // This would fetch from database
    // For now, return null
    return null;
  }

  private validatePhaseTransition(from: FireCyclePhase, to: FireCyclePhase): boolean {
    const validTransitions: Record<FireCyclePhase, FireCyclePhase[]> = {
      focus: ['insight', 'roadmap'],
      insight: ['roadmap', 'execute'],
      roadmap: ['execute'],
      execute: ['focus'] // Can restart cycle
    };
    
    return validTransitions[from]?.includes(to) || false;
  }

  private async generatePhaseTasks(
    goal: BusinessGoal, 
    phase: FireCyclePhase
  ): Promise<Task[]> {
    // Generate tasks specific to the new phase
    return this.generateNextActions(goal, phase, []);
  }

  private async updateRoadmapProgress(goal: BusinessGoal, phase: FireCyclePhase): Promise<void> {
    // Update roadmap steps based on phase change
    if (goal.roadmap) {
      goal.roadmap.forEach(step => {
        if (step.phase === phase) {
          step.status = 'in-progress';
        }
      });
    }
  }

  private findNextMilestone(goal: BusinessGoal): string {
    // Find the next important milestone
    const roadmap = goal.roadmap || [];
    const nextStep = roadmap.find(step => step.status === 'planned');
    return nextStep?.title || 'No upcoming milestones';
  }

  private estimateCompletionDate(goal: BusinessGoal, progress: number): Date {
    // Estimate completion date based on progress and remaining work
    const remainingProgress = 100 - progress;
    const estimatedDays = Math.ceil(remainingProgress / 10); // Assume 10% progress per day
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + estimatedDays);
    return completionDate;
  }

  private generateId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getRecommendedPlaybook(goalData: Partial<BusinessGoal>, phase: FireCyclePhase): Promise<FireCycleBusinessPlaybook | null> {
    const _playbooks = await this.loadPlaybooks();
    return _playbooks.find(p => p.category === goalData.category && p.firePhase === phase) || null;
  }

  private async createRoadmapFromPlaybook(playbook: FireCycleBusinessPlaybook | null, _goalData: Partial<BusinessGoal>): Promise<RoadmapStep[]> {
    if (!playbook) return [];
    
    return playbook.steps.map(step => ({
      id: this.generateId(),
      title: step.title,
      description: step.description,
      phase: step.firePhase,
      order: step.order,
      estimatedDuration: Math.ceil(step.estimatedHours / 8), // Convert hours to days
      status: 'planned',
      playbookId: playbook.id
    }));
  }

  private async generateInitialTasks(goalData: Partial<BusinessGoal>, phase: FireCyclePhase, playbook: FireCycleBusinessPlaybook | null): Promise<Task[]> {
    return this.generateNextActions(goalData, phase, playbook ? [playbook] : []);
  }
}
