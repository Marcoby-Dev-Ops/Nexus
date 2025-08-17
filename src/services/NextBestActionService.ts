/**
 * Next Best Action Service
 * 
 * Implements the "tool as a skill-bridge" philosophy by providing:
 * 1. Clear, actionable recommendations
 * 2. Delegation opportunities to team members or AI agents
 * 3. Context-aware suggestions based on business data
 * 4. Immediate execution capabilities
 */

import { callRPC, callEdgeFunction, selectData, selectOne, insertOne, updateOne } from '@/lib/api-client';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import type { Database } from '@/core/types/supabase';

export interface NextBestAction {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'sales' | 'marketing' | 'ops' | 'finance' | 'general';
  estimatedTime: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  canDelegate: boolean;
  aiAssisted: boolean;
  requiresExpertise: string[];
  businessValue: number; // 1-10 scale
  confidence: number; // 0-1 scale
  dataSources: string[];
  suggestedActions: string[];
  automationPotential: boolean;
  context: Record<string, any>;
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'completed' | 'dismissed' | 'delegated';
}

export interface ActionExecutionResult {
  success: boolean;
  actionId: string;
  result: any;
  insights: string[];
  nextSteps: string[];
  timeSpent: number;
  valueGenerated: number;
}

export interface DelegationTarget {
  id: string;
  type: 'ai_agent' | 'team_member' | 'external_service';
  name: string;
  expertise: string[];
  availability: 'available' | 'busy' | 'unavailable';
  estimatedCompletionTime: string;
  confidence: number;
}

export class NextBestActionService extends BaseService {
  private readonly tableName = 'next_best_actions';
  private readonly userActionsTable = 'user_action_executions';

  /**
   * Generate next best actions based on current business context
   */
  async generateNextBestActions(userId: string, companyId: string): Promise<ServiceResponse<NextBestAction[]>> {
    try {
      // Get current business context
      const businessContext = await this.getBusinessContext(userId, companyId);
      
      // Analyze business data for opportunities and risks
      const analysis = await this.analyzeBusinessData(businessContext);
      
      // Generate actionable recommendations
      const actions = await this.createActionRecommendations(analysis, businessContext);
      
      // Prioritize actions based on impact and effort
      const prioritizedActions = this.prioritizeActions(actions);
      
      // Save actions to database
      await this.saveActions(prioritizedActions, userId, companyId);
      
      return {
        success: true,
        data: prioritizedActions,
        message: `Generated ${prioritizedActions.length} next best actions`
      };
    } catch (error) {
      logger.error('Error generating next best actions:', error);
      return {
        success: false,
        error: 'Failed to generate next best actions',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current business context for action generation
   */
  private async getBusinessContext(userId: string, companyId: string) {
    // Get recent business metrics
    const metrics = await selectData('business_metrics', {
      filters: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      limit: 10
    });

    // Get recent activities
    const activities = await selectData('user_activities', {
      filters: { user_id: userId },
      orderBy: { created_at: 'desc' },
      limit: 20
    });

    // Get current goals and KPIs
    const goals = await selectData('business_goals', {
      filters: { company_id: companyId, status: 'active' }
    });

    // Get integration status
    const integrations = await selectData('user_integrations', {
      filters: { user_id: userId, status: 'connected' }
    });

    return {
      metrics: metrics.data || [],
      activities: activities.data || [],
      goals: goals.data || [],
      integrations: integrations.data || [],
      userId,
      companyId
    };
  }

  /**
   * Analyze business data to identify opportunities and risks
   */
  private async analyzeBusinessData(context: any) {
    const analysis = {
      opportunities: [] as any[],
      risks: [] as any[],
      trends: [] as any[],
      gaps: [] as any[]
    };

    // Analyze revenue trends
    if (context.metrics.length > 0) {
      const revenueMetrics = context.metrics.filter((m: any) => m.metric_type === 'revenue');
      if (revenueMetrics.length >= 2) {
        const recent = revenueMetrics[0];
        const previous = revenueMetrics[1];
        const growth = ((recent.value - previous.value) / previous.value) * 100;
        
        if (growth < 5) {
          analysis.opportunities.push({
            type: 'revenue_optimization',
            description: 'Revenue growth below target',
            impact: 'high',
            data: { currentGrowth: growth, targetGrowth: 10 }
          });
        }
      }
    }

    // Analyze sales pipeline
    const salesActivities = context.activities.filter((a: any) => a.category === 'sales');
    if (salesActivities.length > 0) {
      const recentDeals = salesActivities.filter((a: any) => 
        new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      
      if (recentDeals.length < 3) {
        analysis.opportunities.push({
          type: 'lead_generation',
          description: 'Low recent sales activity',
          impact: 'medium',
          data: { recentDeals: recentDeals.length, target: 3 }
        });
      }
    }

    // Analyze marketing performance
    const marketingActivities = context.activities.filter((a: any) => a.category === 'marketing');
    if (marketingActivities.length === 0) {
      analysis.gaps.push({
        type: 'marketing_activity',
        description: 'No marketing activities detected',
        impact: 'high',
        data: { hasMarketing: false }
      });
    }

    // Analyze financial health
    const financialMetrics = context.metrics.filter((m: any) => 
      ['cash_flow', 'expenses', 'profit_margin'].includes(m.metric_type)
    );
    
    if (financialMetrics.length > 0) {
      const cashFlow = financialMetrics.find((m: any) => m.metric_type === 'cash_flow');
      if (cashFlow && cashFlow.value < 0) {
        analysis.risks.push({
          type: 'cash_flow_negative',
          description: 'Negative cash flow detected',
          impact: 'critical',
          data: { cashFlow: cashFlow.value }
        });
      }
    }

    return analysis;
  }

  /**
   * Create actionable recommendations based on analysis
   */
  private async createActionRecommendations(analysis: any, context: any): Promise<NextBestAction[]> {
    const actions: NextBestAction[] = [];

    // Revenue optimization actions
    analysis.opportunities.forEach((opp: any) => {
      if (opp.type === 'revenue_optimization') {
        actions.push({
          id: `revenue-${Date.now()}`,
          title: 'Optimize Revenue Generation',
          description: `Revenue growth is ${opp.data.currentGrowth}% - below target of 10%. Review pricing strategy and sales pipeline.`,
          priority: 'high',
          category: 'sales',
          estimatedTime: '30 min',
          impact: 'High revenue impact',
          effort: 'medium',
          canDelegate: true,
          aiAssisted: true,
          requiresExpertise: ['sales', 'pricing', 'analytics'],
          businessValue: 8,
          confidence: 0.85,
          dataSources: ['revenue_metrics', 'sales_pipeline'],
          suggestedActions: [
            'Review pricing strategy',
            'Analyze sales pipeline conversion rates',
            'Identify high-value customer segments',
            'Optimize sales process'
          ],
          automationPotential: true,
          context: opp.data,
          createdAt: new Date().toISOString(),
          status: 'active'
        });
      }
    });

    // Lead generation actions
    analysis.opportunities.forEach((opp: any) => {
      if (opp.type === 'lead_generation') {
        actions.push({
          id: `leads-${Date.now()}`,
          title: 'Boost Lead Generation',
          description: `Only ${opp.data.recentDeals} deals in the last week. Implement lead generation strategies.`,
          priority: 'medium',
          category: 'marketing',
          estimatedTime: '45 min',
          impact: 'Increased sales opportunities',
          effort: 'medium',
          canDelegate: true,
          aiAssisted: true,
          requiresExpertise: ['marketing', 'lead_generation', 'content'],
          businessValue: 7,
          confidence: 0.8,
          dataSources: ['sales_activities', 'marketing_metrics'],
          suggestedActions: [
            'Create lead magnet content',
            'Optimize website conversion',
            'Launch targeted ad campaign',
            'Improve email marketing'
          ],
          automationPotential: true,
          context: opp.data,
          createdAt: new Date().toISOString(),
          status: 'active'
        });
      }
    });

    // Marketing gap actions
    analysis.gaps.forEach((gap: any) => {
      if (gap.type === 'marketing_activity') {
        actions.push({
          id: `marketing-${Date.now()}`,
          title: 'Set Up Marketing Foundation',
          description: 'No marketing activities detected. Establish basic marketing infrastructure.',
          priority: 'high',
          category: 'marketing',
          estimatedTime: '60 min',
          impact: 'Brand awareness and lead generation',
          effort: 'high',
          canDelegate: true,
          aiAssisted: true,
          requiresExpertise: ['marketing', 'branding', 'digital_marketing'],
          businessValue: 9,
          confidence: 0.9,
          dataSources: ['user_activities'],
          suggestedActions: [
            'Define target audience',
            'Create brand guidelines',
            'Set up social media presence',
            'Launch first marketing campaign'
          ],
          automationPotential: false,
          context: gap.data,
          createdAt: new Date().toISOString(),
          status: 'active'
        });
      }
    });

    // Financial risk actions
    analysis.risks.forEach((risk: any) => {
      if (risk.type === 'cash_flow_negative') {
        actions.push({
          id: `cashflow-${Date.now()}`,
          title: 'Address Cash Flow Issues',
          description: `Negative cash flow of $${Math.abs(risk.data.cashFlow)} detected. Immediate action required.`,
          priority: 'critical',
          category: 'finance',
          estimatedTime: '90 min',
          impact: 'Business survival',
          effort: 'high',
          canDelegate: false,
          aiAssisted: true,
          requiresExpertise: ['finance', 'cash_flow_management'],
          businessValue: 10,
          confidence: 0.95,
          dataSources: ['financial_metrics'],
          suggestedActions: [
            'Review all expenses',
            'Accelerate receivables collection',
            'Negotiate payment terms',
            'Create cash flow forecast'
          ],
          automationPotential: false,
          context: risk.data,
          createdAt: new Date().toISOString(),
          status: 'active'
        });
      }
    });

    return actions;
  }

  /**
   * Prioritize actions based on impact, effort, and business value
   */
  private prioritizeActions(actions: NextBestAction[]): NextBestAction[] {
    return actions.sort((a, b) => {
      // Priority order: critical > high > medium > low
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by business value
      const valueDiff = b.businessValue - a.businessValue;
      if (valueDiff !== 0) return valueDiff;
      
      // Then by confidence
      return b.confidence - a.confidence;
    });
  }

  /**
   * Save actions to database
   */
  private async saveActions(actions: NextBestAction[], userId: string, companyId: string) {
    for (const action of actions) {
      await insertOne(this.tableName, {
        ...action,
        user_id: userId,
        company_id: companyId
      });
    }
  }

  /**
   * Execute a next best action
   */
  async executeAction(actionId: string, userId: string, executionData?: any): Promise<ServiceResponse<ActionExecutionResult>> {
    try {
      // Get action details
      const actionResult = await selectOne(this.tableName, { id: actionId });
      if (!actionResult.success || !actionResult.data) {
        return {
          success: false,
          error: 'Action not found'
        };
      }

      const action = actionResult.data as NextBestAction;
      const startTime = Date.now();

      // Execute based on action type
      let result: any;
      let insights: string[] = [];
      let nextSteps: string[] = [];

      switch (action.category) {
        case 'sales':
          result = await this.executeSalesAction(action, executionData);
          break;
        case 'marketing':
          result = await this.executeMarketingAction(action, executionData);
          break;
        case 'finance':
          result = await this.executeFinanceAction(action, executionData);
          break;
        case 'ops':
          result = await this.executeOpsAction(action, executionData);
          break;
        default:
          result = await this.executeGeneralAction(action, executionData);
      }

      const timeSpent = Date.now() - startTime;

      // Calculate value generated (simplified)
      const valueGenerated = this.calculateValueGenerated(action, result, timeSpent);

      // Save execution record
      await insertOne(this.userActionsTable, {
        action_id: actionId,
        user_id: userId,
        execution_data: executionData,
        result: result,
        time_spent: timeSpent,
        value_generated: valueGenerated,
        status: 'completed',
        created_at: new Date().toISOString()
      });

      // Update action status
      await updateOne(this.tableName, actionId, { status: 'completed' });

      return {
        success: true,
        data: {
          success: true,
          actionId,
          result,
          insights,
          nextSteps,
          timeSpent,
          valueGenerated
        }
      };
    } catch (error) {
      logger.error('Error executing action:', error);
      return {
        success: false,
        error: 'Failed to execute action',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delegate action to team member or AI agent
   */
  async delegateAction(actionId: string, targetId: string, userId: string): Promise<ServiceResponse<any>> {
    try {
      // Get action details
      const actionResult = await selectOne(this.tableName, { id: actionId });
      if (!actionResult.success || !actionResult.data) {
        return {
          success: false,
          error: 'Action not found'
        };
      }

      const action = actionResult.data as NextBestAction;

      // Create delegation record
      const delegationResult = await insertOne('action_delegations', {
        action_id: actionId,
        delegated_by: userId,
        delegated_to: targetId,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      // Update action status
      await updateOne(this.tableName, actionId, { status: 'delegated' });

      return {
        success: true,
        data: delegationResult.data,
        message: 'Action delegated successfully'
      };
    } catch (error) {
      logger.error('Error delegating action:', error);
      return {
        success: false,
        error: 'Failed to delegate action',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get available delegation targets
   */
  async getDelegationTargets(userId: string, actionId: string): Promise<ServiceResponse<DelegationTarget[]>> {
    try {
      // Get AI agents
      const aiAgents = [
        {
          id: 'ai-sales-expert',
          type: 'ai_agent' as const,
          name: 'AI Sales Expert',
          expertise: ['sales', 'pipeline_management', 'deal_analysis'],
          availability: 'available' as const,
          estimatedCompletionTime: '2 hours',
          confidence: 0.85
        },
        {
          id: 'ai-marketing-expert',
          type: 'ai_agent' as const,
          name: 'AI Marketing Expert',
          expertise: ['marketing', 'campaign_optimization', 'lead_generation'],
          availability: 'available' as const,
          estimatedCompletionTime: '3 hours',
          confidence: 0.8
        },
        {
          id: 'ai-finance-expert',
          type: 'ai_agent' as const,
          name: 'AI Finance Expert',
          expertise: ['finance', 'cash_flow', 'financial_analysis'],
          availability: 'available' as const,
          estimatedCompletionTime: '1 hour',
          confidence: 0.9
        }
      ];

      // Get team members (placeholder - would come from actual team data)
      const teamMembers = [
        {
          id: 'team-member-1',
          type: 'team_member' as const,
          name: 'Sarah (Sales Manager)',
          expertise: ['sales', 'team_management'],
          availability: 'available' as const,
          estimatedCompletionTime: '4 hours',
          confidence: 0.9
        }
      ];

      return {
        success: true,
        data: [...aiAgents, ...teamMembers]
      };
    } catch (error) {
      logger.error('Error getting delegation targets:', error);
      return {
        success: false,
        error: 'Failed to get delegation targets',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private execution methods
  private async executeSalesAction(action: NextBestAction, executionData?: any) {
    // Implement sales action execution logic
    return {
      type: 'sales_optimization',
      recommendations: action.suggestedActions,
      estimatedImpact: '15-25% revenue increase',
      timeline: '2-4 weeks'
    };
  }

  private async executeMarketingAction(action: NextBestAction, executionData?: any) {
    // Implement marketing action execution logic
    return {
      type: 'marketing_campaign',
      recommendations: action.suggestedActions,
      estimatedImpact: '30-50% lead increase',
      timeline: '1-2 weeks'
    };
  }

  private async executeFinanceAction(action: NextBestAction, executionData?: any) {
    // Implement finance action execution logic
    return {
      type: 'cash_flow_optimization',
      recommendations: action.suggestedActions,
      estimatedImpact: 'Immediate cash flow improvement',
      timeline: '1 week'
    };
  }

  private async executeOpsAction(action: NextBestAction, executionData?: any) {
    // Implement operations action execution logic
    return {
      type: 'process_optimization',
      recommendations: action.suggestedActions,
      estimatedImpact: '20-30% efficiency improvement',
      timeline: '2-3 weeks'
    };
  }

  private async executeGeneralAction(action: NextBestAction, executionData?: any) {
    // Implement general action execution logic
    return {
      type: 'general_optimization',
      recommendations: action.suggestedActions,
      estimatedImpact: 'Varies by action',
      timeline: '1-4 weeks'
    };
  }

  private calculateValueGenerated(action: NextBestAction, result: any, timeSpent: number): number {
    // Simplified value calculation
    const baseValue = action.businessValue * 100; // Convert 1-10 scale to monetary value
    const timeEfficiency = Math.max(0.5, 1 - (timeSpent / (parseInt(action.estimatedTime) * 60 * 1000)));
    return Math.round(baseValue * timeEfficiency);
  }
}

export const nextBestActionService = new NextBestActionService();
