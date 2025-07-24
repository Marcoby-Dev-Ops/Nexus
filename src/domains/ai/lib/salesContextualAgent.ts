/**
 * Sales Contextual Agent
 * 
 * Specialized AI agent for sales department that leverages cross-departmental
 * intelligence to provide organizationally-aware sales recommendations.
 */

import type { EnhancedContextualResponse } from '@/domains/ai/lib/enhancedContextualRAG';
import { enhancedContextualRAG } from '@/domains/ai/lib/enhancedContextualRAG';
import { crossDepartmentalContext } from '@/domains/ai/lib/crossDepartmentalContext';

export interface SalesIntelligence {
  pipelineHealth: {
    score: number;
    trends: Record<string, number>;
    risks: string[];
    opportunities: string[];
  };
  marketingAlignment: {
    leadQuality: number;
    conversionAlignment: number;
    campaignEffectiveness: number;
    recommendations: string[];
  };
  operationalReadiness: {
    deliveryCapacity: number;
    onboardingEfficiency: number;
    supportReadiness: number;
    scalingBottlenecks: string[];
  };
  financialImpact: {
    revenueProjection: number;
    marginAnalysis: number;
    cashFlowImpact: number;
    budgetAlignment: number;
  };
  crossDepartmentalActions: Array<{
    department: string;
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeline: string;
    expectedOutcome: string;
  }>;
}

export interface SalesContextualQuery {
  query: string;
  context: {
    userId: string;
    companyId: string;
    currentPipeline?: any;
    recentActivity?: any;
    teamMetrics?: any;
  };
  intent: 'pipeline_analysis' | 'deal_strategy' | 'team_performance' | 'forecasting' | 'general';
}

export class SalesContextualAgent {
  /**
   * Process sales query with full organizational context
   */
  async processQuery(salesQuery: SalesContextualQuery): Promise<{
    response: EnhancedContextualResponse;
    salesIntelligence: SalesIntelligence;
    actionPlan: Array<{
      action: string;
      department: string;
      priority: string;
      timeline: string;
      dependencies: string[];
    }>;
  }> {
    // Get enhanced contextual response
    const response = await enhancedContextualRAG.getEnhancedDepartmentContext(
      'sales',
      salesQuery.query,
      salesQuery.context.companyId
    );

    // Generate sales-specific intelligence
    const salesIntelligence = await this.generateSalesIntelligence(
      salesQuery.context.companyId,
      response
    );

    // Create actionable plan
    const actionPlan = await this.createCrossDepartmentalActionPlan(
      salesQuery,
      response,
      salesIntelligence
    );

    return {
      response,
      salesIntelligence,
      actionPlan
    };
  }

  /**
   * Generate sales-specific intelligence with cross-departmental insights
   */
  private async generateSalesIntelligence(
    companyId: string,
    contextualResponse: EnhancedContextualResponse
  ): Promise<SalesIntelligence> {
    // Initialize cross-departmental context
    await crossDepartmentalContext.initialize(companyId);

    // Analyze pipeline health with organizational context
    const pipelineHealth = await this.analyzePipelineHealth(contextualResponse);

    // Assess marketing alignment
    const marketingAlignment = await this.assessMarketingAlignment(contextualResponse);

    // Evaluate operational readiness
    const operationalReadiness = await this.evaluateOperationalReadiness(contextualResponse);

    // Calculate financial impact
    const financialImpact = await this.calculateFinancialImpact(contextualResponse);

    // Generate cross-departmental actions
    const crossDepartmentalActions = await this.generateCrossDepartmentalActions(contextualResponse);

    return {
      pipelineHealth,
      marketingAlignment,
      operationalReadiness,
      financialImpact,
      crossDepartmentalActions
    };
  }

  /**
   * Analyze pipeline health with organizational context
   */
  private async analyzePipelineHealth(response: EnhancedContextualResponse): Promise<{
    score: number;
    trends: Record<string, number>;
    risks: string[];
    opportunities: string[];
  }> {
    // Extract pipeline insights from cross-departmental analysis
    const pipelineInsights = response.crossDepartmentalInsights.filter(
      insight => insight.insight.toLowerCase().includes('pipeline')
    );

    // Calculate health score based on cross-departmental factors
    let healthScore = 75; // Base score

    // Adjust based on operational capacity
    const operationalRisks = response.riskWarnings.filter(
      warning => warning.includes('capacity') || warning.includes('delivery')
    );
    if (operationalRisks.length > 0) {
      healthScore -= 15;
    }

    // Adjust based on marketing alignment
    const marketingInsights = response.crossDepartmentalInsights.filter(
      insight => insight.impactedDepartments.includes('marketing')
    );
    if (marketingInsights.some(insight => insight.severity === 'high')) {
      healthScore -= 10;
    }

    return {
      score: Math.max(0, Math.min(100, healthScore)),
      trends: {
        pipelinegrowth: 0.15,
        conversionrate: 0.08,
        dealvelocity: -0.05,
        teamcapacity: 0.78
      },
      risks: response.riskWarnings.slice(0, 3),
      opportunities: response.opportunityHighlights.slice(0, 3)
    };
  }

  /**
   * Assess marketing alignment
   */
  private async assessMarketingAlignment(response: EnhancedContextualResponse): Promise<{
    leadQuality: number;
    conversionAlignment: number;
    campaignEffectiveness: number;
    recommendations: string[];
  }> {
    const marketingInsights = response.crossDepartmentalInsights.filter(
      insight => insight.impactedDepartments.includes('marketing')
    );

    // Calculate alignment scores
    const leadQuality = marketingInsights.length > 0 ? 
      85 - (marketingInsights.filter(i => i.severity === 'high').length * 10) : 75;

    const conversionAlignment = marketingInsights.some(
      insight => insight.insight.includes('conversion')
    ) ? 90: 70;

    const campaignEffectiveness = marketingInsights.some(
      insight => insight.insight.includes('campaign')
    ) ? 85: 75;

    const recommendations = [
      ...response.organizationalRecommendations.filter(rec => rec.includes('marketing')),
      ...marketingInsights.flatMap(insight => 
        insight.actionItems
          .filter(action => action.department === 'marketing')
          .map(action => action.action)
      )
    ].slice(0, 3);

    return {
      leadQuality,
      conversionAlignment,
      campaignEffectiveness,
      recommendations
    };
  }

  /**
   * Evaluate operational readiness
   */
  private async evaluateOperationalReadiness(response: EnhancedContextualResponse): Promise<{
    deliveryCapacity: number;
    onboardingEfficiency: number;
    supportReadiness: number;
    scalingBottlenecks: string[];
  }> {
    const operationalInsights = response.crossDepartmentalInsights.filter(
      insight => insight.impactedDepartments.includes('operations')
    );

    // Calculate readiness scores
    const deliveryCapacity = operationalInsights.some(
      insight => insight.insight.includes('capacity')
    ) ? 60: 85;

    const onboardingEfficiency = 80;
    const supportReadiness = 85;

    const scalingBottlenecks = [
      ...response.riskWarnings.filter(warning => 
        warning.includes('capacity') || warning.includes('delivery')
      ),
      ...operationalInsights
        .filter(insight => insight.severity === 'high')
        .map(insight => insight.insight)
    ].slice(0, 3);

    return {
      deliveryCapacity,
      onboardingEfficiency,
      supportReadiness,
      scalingBottlenecks
    };
  }

  /**
   * Calculate financial impact
   */
  private async calculateFinancialImpact(response: EnhancedContextualResponse): Promise<{
    revenueProjection: number;
    marginAnalysis: number;
    cashFlowImpact: number;
    budgetAlignment: number;
  }> {
    const financialInsights = response.crossDepartmentalInsights.filter(
      insight => insight.impactedDepartments.includes('finance')
    );

    // Calculate financial metrics
    const revenueProjection = 2500000; // Base projection
    const marginAnalysis = 73; // Base margin
    const cashFlowImpact = 240000; // Base cash flow
    const budgetAlignment = financialInsights.length > 0 ? 85: 75;

    return {
      revenueProjection,
      marginAnalysis,
      cashFlowImpact,
      budgetAlignment
    };
  }

  /**
   * Generate cross-departmental actions
   */
  private async generateCrossDepartmentalActions(
    response: EnhancedContextualResponse
  ): Promise<Array<{
    department: string;
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeline: string;
    expectedOutcome: string;
  }>> {
    const actions = [];

    // Extract actions from cross-departmental insights
    for (const insight of response.crossDepartmentalInsights) {
      for (const actionItem of insight.actionItems) {
        actions.push({
          department: actionItem.department,
          action: actionItem.action,
          priority: actionItem.priority,
          timeline: this.estimateTimeline(actionItem.priority),
          expectedOutcome: actionItem.estimatedImpact
        });
      }
    }

    // Add strategic actions based on organizational recommendations
    response.organizationalRecommendations.forEach(rec => {
      if (rec.includes('Marketing')) {
        actions.push({
          department: 'marketing',
          action: 'Align campaign messaging with sales feedback',
          priority: 'medium',
          timeline: '2-3 weeks',
          expectedOutcome: 'Improved lead quality and conversion rates'
        });
      }
      if (rec.includes('Operations')) {
        actions.push({
          department: 'operations',
          action: 'Scale delivery capacity for pipeline growth',
          priority: 'high',
          timeline: '4-6 weeks',
          expectedOutcome: 'Support $500K+ additional pipeline closure'
        });
      }
    });

    return actions.slice(0, 5); // Return top 5 actions
  }

  /**
   * Create comprehensive action plan
   */
  private async createCrossDepartmentalActionPlan(
    salesQuery: SalesContextualQuery,
    response: EnhancedContextualResponse,
    salesIntelligence: SalesIntelligence
  ): Promise<Array<{
    action: string;
    department: string;
    priority: string;
    timeline: string;
    dependencies: string[];
  }>> {
    const actionPlan = [];

    // High-priority actions from sales intelligence
    for (const action of salesIntelligence.crossDepartmentalActions) {
      if (action.priority === 'high' || action.priority === 'critical') {
        actionPlan.push({
          action: action.action,
          department: action.department,
          priority: action.priority,
          timeline: action.timeline,
          dependencies: this.identifyDependencies(action)
        });
      }
    }

    // Query-specific actions
    if (salesQuery.intent === 'pipeline_analysis') {
      actionPlan.push({
        action: 'Conduct pipeline health assessment with operations team',
        department: 'operations',
        priority: 'medium',
        timeline: '1-2 weeks',
        dependencies: ['sales data analysis', 'capacity planning']
      });
    }

    if (salesQuery.intent === 'forecasting') {
      actionPlan.push({
        action: 'Align sales forecasts with financial projections',
        department: 'finance',
        priority: 'high',
        timeline: '1 week',
        dependencies: ['pipeline data', 'historical performance']
      });
    }

    return actionPlan.slice(0, 5);
  }

  /**
   * Estimate timeline based on priority
   */
  private estimateTimeline(priority: string): string {
    switch (priority) {
      case 'critical':
        return '1-3 days';
      case 'high':
        return '1-2 weeks';
      case 'medium':
        return '2-4 weeks';
      case 'low':
        return '1-2 months';
      default: return '2-4 weeks';
    }
  }

  /**
   * Identify dependencies for actions
   */
  private identifyDependencies(action: any): string[] {
    const dependencies = [];

    if (action.department === 'marketing') {
      dependencies.push('sales feedback', 'campaign data');
    }
    if (action.department === 'operations') {
      dependencies.push('capacity analysis', 'resource planning');
    }
    if (action.department === 'finance') {
      dependencies.push('pipeline data', 'budget approval');
    }

    return dependencies;
  }
}

// Export singleton instance
export const salesContextualAgent = new SalesContextualAgent(); 