/**
 * Next Best Action Service
 * 
 * Implements the "tool as a skill-bridge" philosophy by providing:
 * 1. Clear, actionable recommendations
 * 2. Delegation opportunities to team members or AI agents
 * 3. Context-aware suggestions based on business data
 * 4. Immediate execution capabilities
 */

import { callRPC, callEdgeFunction, selectData, selectOne, insertOne, updateOne } from '@/lib/database';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';

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
  name: string;
  role: string;
  expertise: string[];
  availability: 'available' | 'busy' | 'unavailable';
  estimatedCompletionTime: string;
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
    const metrics = await selectData('business_metrics', '*', { company_id: companyId });
    
    // Get user's recent activities
    const activities = await selectData('user_activities', '*', { user_id: userId });
    
    // Get integration data
    const integrations = await selectData('user_integrations', '*', { user_id: userId });
    
    return {
      metrics: metrics.data || [],
      activities: activities.data || [],
      integrations: integrations.data || [],
      userId,
      companyId
    };
  }

  /**
   * Analyze business data for opportunities and risks
   */
  private async analyzeBusinessData(context: any) {
    // Use AI to analyze business data and identify opportunities
    try {
      const analysisResult = await callEdgeFunction('ai_analyze_business_data', {
        context,
        analysisType: 'opportunities_and_risks'
      });
      
      return analysisResult;
    } catch (error) {
      logger.error('Error analyzing business data:', error);
      // Fallback to basic analysis
      return this.performBasicAnalysis(context);
    }
  }

  /**
   * Perform basic business analysis when AI is unavailable
   */
  private performBasicAnalysis(context: any) {
    const analysis = {
      opportunities: [],
      risks: [],
      trends: []
    };

    // Analyze metrics for trends
    if (context.metrics && context.metrics.length > 0) {
      const recentMetrics = context.metrics.slice(-5);
      // Basic trend analysis
      analysis.trends = recentMetrics.map((metric: any) => ({
        metric: metric.name,
        trend: metric.value > metric.previous_value ? 'up' : 'down',
        change: ((metric.value - metric.previous_value) / metric.previous_value) * 100
      }));
    }

    return analysis;
  }

  /**
   * Create actionable recommendations based on analysis
   */
  private async createActionRecommendations(analysis: any, context: any): Promise<NextBestAction[]> {
    const actions: NextBestAction[] = [];

    // Generate actions based on analysis results
    if (analysis.opportunities && analysis.opportunities.length > 0) {
      for (const opportunity of analysis.opportunities) {
        actions.push({
          id: `opp_${Date.now()}_${Math.random()}`,
          title: opportunity.title || 'Capitalize on Opportunity',
          description: opportunity.description || 'Take advantage of this business opportunity',
          priority: 'high',
          category: opportunity.category || 'general',
          estimatedTime: '2-4 hours',
          impact: opportunity.impact || 'Medium to High',
          effort: 'medium',
          canDelegate: true,
          aiAssisted: true,
          requiresExpertise: opportunity.required_skills || [],
          businessValue: opportunity.value || 7,
          confidence: opportunity.confidence || 0.8,
          dataSources: opportunity.sources || [],
          suggestedActions: opportunity.actions || [],
          automationPotential: opportunity.automation || false,
          context: opportunity.context || {},
          createdAt: new Date().toISOString(),
          status: 'active'
        });
      }
    }

    // Generate actions for risks
    if (analysis.risks && analysis.risks.length > 0) {
      for (const risk of analysis.risks) {
        actions.push({
          id: `risk_${Date.now()}_${Math.random()}`,
          title: risk.title || 'Mitigate Risk',
          description: risk.description || 'Address this potential business risk',
          priority: 'critical',
          category: risk.category || 'general',
          estimatedTime: '1-3 hours',
          impact: risk.impact || 'High',
          effort: 'high',
          canDelegate: false,
          aiAssisted: true,
          requiresExpertise: risk.required_skills || [],
          businessValue: risk.value || 9,
          confidence: risk.confidence || 0.9,
          dataSources: risk.sources || [],
          suggestedActions: risk.mitigation_actions || [],
          automationPotential: risk.automation || false,
          context: risk.context || {},
          createdAt: new Date().toISOString(),
          status: 'active'
        });
      }
    }

    return actions;
  }

  /**
   * Prioritize actions based on impact and effort
   */
  private prioritizeActions(actions: NextBestAction[]): NextBestAction[] {
    return actions.sort((a, b) => {
      // Priority order: critical > high > medium > low
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by business value
      return b.businessValue - a.businessValue;
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
      const actionResult = await selectOne(this.tableName, actionId);
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
      const insights: string[] = [];
      const nextSteps: string[] = [];

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

  private async executeSalesAction(action: NextBestAction, executionData?: any) {
    // Implement sales action execution
    return { success: true, message: 'Sales action executed' };
  }

  private async executeMarketingAction(action: NextBestAction, executionData?: any) {
    // Implement marketing action execution
    return { success: true, message: 'Marketing action executed' };
  }

  private async executeFinanceAction(action: NextBestAction, executionData?: any) {
    // Implement finance action execution
    return { success: true, message: 'Finance action executed' };
  }

  private async executeOpsAction(action: NextBestAction, executionData?: any) {
    // Implement operations action execution
    return { success: true, message: 'Operations action executed' };
  }

  private async executeGeneralAction(action: NextBestAction, executionData?: any) {
    // Implement general action execution
    return { success: true, message: 'General action executed' };
  }

  private calculateValueGenerated(action: NextBestAction, result: any, timeSpent: number): number {
    // Simplified value calculation
    const baseValue = action.businessValue * 100; // Convert 1-10 scale to monetary value
    const timeEfficiency = Math.max(0.5, 1 - (timeSpent / (parseInt(action.estimatedTime) * 60 * 1000)));
    return Math.round(baseValue * timeEfficiency);
  }

  /**
   * Delegate action to team member or AI agent
   */
  async delegateAction(actionId: string, targetId: string, userId: string): Promise<ServiceResponse<any>> {
    try {
      // Update action status to delegated
      await updateOne(this.tableName, actionId, { 
        status: 'delegated',
        delegated_to: targetId,
        delegated_at: new Date().toISOString()
      });

      return {
        success: true,
        data: { message: 'Action delegated successfully' }
      };
    } catch (error) {
      logger.error('Error delegating action:', error);
      return {
        success: false,
        error: 'Failed to delegate action'
      };
    }
  }

  /**
   * Get available delegation targets
   */
  async getDelegationTargets(actionId: string): Promise<ServiceResponse<DelegationTarget[]>> {
    try {
      // Get team members and AI agents
      const teamMembers = await selectData('team_members', '*');
      const aiAgents = await selectData('ai_agents', '*');

      const targets: DelegationTarget[] = [
        ...(teamMembers.data || []).map((member: any) => ({
          id: member.id,
          name: member.name,
          role: member.role,
          expertise: member.expertise || [],
          availability: member.availability || 'available',
          estimatedCompletionTime: '2-4 hours'
        })),
        ...(aiAgents.data || []).map((agent: any) => ({
          id: agent.id,
          name: agent.name,
          role: agent.role,
          expertise: agent.capabilities || [],
          availability: 'available',
          estimatedCompletionTime: '5-15 minutes'
        }))
      ];

      return {
        success: true,
        data: targets
      };
    } catch (error) {
      logger.error('Error getting delegation targets:', error);
      return {
        success: false,
        error: 'Failed to get delegation targets'
      };
    }
  }
}

export const nextBestActionService = new NextBestActionService();
