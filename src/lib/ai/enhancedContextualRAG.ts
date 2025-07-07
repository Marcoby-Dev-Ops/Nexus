/**
 * Enhanced Contextual RAG System
 * 
 * Integrates cross-departmental intelligence to provide AI responses that consider
 * the entire organizational ecosystem and cross-departmental impact.
 */

import { ContextualRAG, EnhancedUserContext } from './contextualRAG';
import { crossDepartmentalContext, CrossDepartmentalInsight, DepartmentImpactAnalysis } from './crossDepartmentalContext';

export interface EnhancedContextualResponse {
  primaryResponse: string;
  crossDepartmentalInsights: CrossDepartmentalInsight[];
  impactAnalysis: DepartmentImpactAnalysis;
  organizationalRecommendations: string[];
  riskWarnings: string[];
  opportunityHighlights: string[];
  relatedDepartments: Array<{
    department: string;
    relevance: number;
    suggestedActions: string[];
  }>;
}

export interface OrganizationalIntelligence {
  departmentSynergies: Array<{
    departments: string[];
    synergy: string;
    potentialValue: string;
  }>;
  resourceConflicts: Array<{
    resource: string;
    conflictingDepartments: string[];
    resolution: string;
  }>;
  strategicAlignments: Array<{
    objective: string;
    alignedDepartments: string[];
    misalignedDepartments: string[];
  }>;
}

export class EnhancedContextualRAG extends ContextualRAG {
  /**
   * Get enhanced department context with cross-departmental intelligence
   */
  async getEnhancedDepartmentContext(
    department: string, 
    query: string, 
    companyId: string
  ): Promise<EnhancedContextualResponse> {
    // Get base context from parent class
    const baseContext = await this.getDepartmentContext(department, query);
    
    // Get cross-departmental intelligence
    const contextualFeedback = await crossDepartmentalContext.getContextualFeedback(
      department,
      query,
      await this.getCurrentDepartmentData(department, companyId),
      companyId
    );

    // Generate organizational intelligence
    const organizationalIntel = await this.generateOrganizationalIntelligence(department, companyId);

    // Create enhanced response
    const primaryResponse = await this.enhanceResponseWithCrossDepartmentalContext(
      baseContext,
      contextualFeedback,
      organizationalIntel
    );

    return {
      primaryResponse,
      crossDepartmentalInsights: contextualFeedback.contextualInsights,
      impactAnalysis: contextualFeedback.impactAnalysis,
      organizationalRecommendations: contextualFeedback.recommendations,
      riskWarnings: contextualFeedback.warnings,
      opportunityHighlights: this.extractOpportunityHighlights(contextualFeedback),
      relatedDepartments: this.identifyRelatedDepartments(contextualFeedback.impactAnalysis)
    };
  }

  /**
   * Get executive context with full organizational intelligence
   */
  async getEnhancedExecutiveContext(
    query: string,
    companyId: string
  ): Promise<EnhancedContextualResponse> {
    // Get base executive context
    const baseContext = await this.getExecutiveContext(query);

    // Initialize cross-departmental context
    await crossDepartmentalContext.initialize(companyId);

    // Analyze query for organizational impact
    const organizationalImpact = await this.analyzeOrganizationalImpact(query, companyId);

    // Generate comprehensive organizational intelligence
    const organizationalIntel = await this.generateComprehensiveOrganizationalIntelligence(companyId);

    // Create enhanced executive response
    const primaryResponse = await this.enhanceExecutiveResponseWithOrganizationalContext(
      baseContext,
      organizationalImpact,
      organizationalIntel
    );

    return {
      primaryResponse,
      crossDepartmentalInsights: organizationalImpact.insights,
      impactAnalysis: organizationalImpact.analysis,
      organizationalRecommendations: organizationalImpact.recommendations,
      riskWarnings: organizationalImpact.warnings,
      opportunityHighlights: organizationalImpact.opportunities,
      relatedDepartments: this.identifyAllRelevantDepartments(query)
    };
  }

  /**
   * Generate intelligent routing with cross-departmental awareness
   */
  async getEnhancedRoutingIntelligence(
    query: string,
    companyId: string
  ): Promise<{
    recommendedAgent: string;
    confidence: number;
    reasoning: string;
    contextualPrompt: string;
    crossDepartmentalContext: string;
    organizationalPriorities: string[];
  }> {
    // Get base routing intelligence
    const baseRouting = await this.getRoutingIntelligence(query);

    // Get cross-departmental context for the recommended department
    const department = this.extractDepartmentFromAgent(baseRouting.recommendedAgent);
    const crossDeptContext = department ? 
      await this.getCrossDepartmentalContextSummary(department, companyId) : '';

    // Identify organizational priorities relevant to the query
    const orgPriorities = await this.identifyRelevantOrganizationalPriorities(query, companyId);

    return {
      ...baseRouting,
      crossDepartmentalContext: crossDeptContext,
      organizationalPriorities: orgPriorities,
      contextualPrompt: this.enhancePromptWithOrganizationalContext(
        baseRouting.contextualPrompt,
        crossDeptContext,
        orgPriorities
      )
    };
  }

  /**
   * Get current department data for analysis
   */
  private async getCurrentDepartmentData(department: string, companyId: string): Promise<any> {
    // This would integrate with your actual data sources
    // For now, return demo data structure
    return {
      department,
      companyId,
      timestamp: new Date().toISOString(),
      metrics: {
        // Department-specific metrics would be fetched here
      }
    };
  }

  /**
   * Generate organizational intelligence
   */
  private async generateOrganizationalIntelligence(
    focusDepartment: string,
    companyId: string
  ): Promise<OrganizationalIntelligence> {
    await crossDepartmentalContext.initialize(companyId);

    return {
      departmentSynergies: [
        {
          departments: ['sales', 'marketing'],
          synergy: 'High-performing marketing campaigns driving qualified leads',
          potentialValue: '25-40% revenue increase with aligned campaigns'
        },
        {
          departments: ['sales', 'customer-success'],
          synergy: 'Customer success insights improving sales messaging',
          potentialValue: 'Reduced churn and increased expansion revenue'
        }
      ],
      resourceConflicts: [
        {
          resource: 'Development capacity',
          conflictingDepartments: ['sales', 'product'],
          resolution: 'Prioritize features that directly support sales goals'
        }
      ],
      strategicAlignments: [
        {
          objective: 'Revenue growth',
          alignedDepartments: ['sales', 'marketing', 'customer-success'],
          misalignedDepartments: ['operations']
        }
      ]
    };
  }

  /**
   * Generate comprehensive organizational intelligence for executives
   */
  private async generateComprehensiveOrganizationalIntelligence(
    companyId: string
  ): Promise<OrganizationalIntelligence> {
    // This would provide a complete organizational view
    return this.generateOrganizationalIntelligence('executive', companyId);
  }

  /**
   * Analyze organizational impact of a query
   */
  private async analyzeOrganizationalImpact(
    query: string,
    companyId: string
  ): Promise<{
    insights: CrossDepartmentalInsight[];
    analysis: DepartmentImpactAnalysis;
    recommendations: string[];
    warnings: string[];
    opportunities: string[];
  }> {
    // Analyze which departments the query affects
    const affectedDepartments = this.identifyAffectedDepartments(query);
    
    // Get cross-departmental feedback for each affected department
    const allInsights: CrossDepartmentalInsight[] = [];
    const allRecommendations: string[] = [];
    const allWarnings: string[] = [];
    
    for (const dept of affectedDepartments) {
      const feedback = await crossDepartmentalContext.getContextualFeedback(
        dept,
        query,
        {},
        companyId
      );
      
      allInsights.push(...feedback.contextualInsights);
      allRecommendations.push(...feedback.recommendations);
      allWarnings.push(...feedback.warnings);
    }

    return {
      insights: allInsights,
      analysis: {
        primaryDepartment: 'executive',
        impactMap: {},
        cascadeEffects: []
      },
      recommendations: [...new Set(allRecommendations)], // Remove duplicates
      warnings: [...new Set(allWarnings)],
      opportunities: this.extractOpportunities(allInsights)
    };
  }

  /**
   * Enhance response with cross-departmental context
   */
  private async enhanceResponseWithCrossDepartmentalContext(
    baseContext: string,
    contextualFeedback: any,
    organizationalIntel: OrganizationalIntelligence
  ): Promise<string> {
    const insights = contextualFeedback.contextualInsights
      .map((insight: CrossDepartmentalInsight) => `• ${insight.insight}`)
      .join('\n');

    const recommendations = contextualFeedback.recommendations
      .map((rec: string) => `• ${rec}`)
      .join('\n');

    return `${baseContext}

🔗 **CROSS-DEPARTMENTAL INTELLIGENCE:**

**Key Organizational Insights:**
${insights || 'No specific cross-departmental insights identified.'}

**Strategic Recommendations:**
${recommendations || 'No specific recommendations at this time.'}

**Department Synergies:**
${organizationalIntel.departmentSynergies.map(synergy => 
  `• ${synergy.departments.join(' + ')}: ${synergy.synergy}`
).join('\n')}

**Action Items with Organizational Impact:**
${contextualFeedback.contextualInsights.flatMap((insight: CrossDepartmentalInsight) => 
  insight.actionItems.map(action => 
    `• **${action.department}**: ${action.action} (${action.priority} priority)`
  )
).join('\n')}

This analysis considers data from all ${contextualFeedback.contextualInsights.length > 0 ? 
  contextualFeedback.contextualInsights[0].impactedDepartments.length : 3} impacted departments to provide organizationally-aware recommendations.`;
  }

  /**
   * Enhance executive response with organizational context
   */
  private async enhanceExecutiveResponseWithOrganizationalContext(
    baseContext: string,
    organizationalImpact: any,
    organizationalIntel: OrganizationalIntelligence
  ): Promise<string> {
    return `${baseContext}

🏢 **ORGANIZATIONAL INTELLIGENCE SUMMARY:**

**Cross-Departmental Insights (${organizationalImpact.insights.length} identified):**
${organizationalImpact.insights.slice(0, 3).map((insight: CrossDepartmentalInsight) => 
  `• ${insight.insight} (${insight.severity} severity)`
).join('\n')}

**Strategic Priorities:**
${organizationalImpact.recommendations.slice(0, 3).join('\n')}

**Risk Mitigation:**
${organizationalImpact.warnings.slice(0, 2).join('\n')}

**Growth Opportunities:**
${organizationalImpact.opportunities.slice(0, 2).join('\n')}

**Resource Optimization:**
${organizationalIntel.resourceConflicts.map(conflict => 
  `• ${conflict.resource}: ${conflict.resolution}`
).join('\n')}

This executive briefing synthesizes intelligence from all organizational departments to provide strategic guidance with full business context.`;
  }

  /**
   * Extract department from agent recommendation
   */
  private extractDepartmentFromAgent(agent: string): string | null {
    const departmentMap: Record<string, string> = {
      'sales-dept': 'sales',
      'marketing-dept': 'marketing',
      'finance-dept': 'finance',
      'operations-dept': 'operations'
    };
    
    return departmentMap[agent] || null;
  }

  /**
   * Get cross-departmental context summary
   */
  private async getCrossDepartmentalContextSummary(
    department: string,
    companyId: string
  ): Promise<string> {
    const feedback = await crossDepartmentalContext.getContextualFeedback(
      department,
      'general context',
      {},
      companyId
    );

    return `Cross-departmental context for ${department}:
- ${feedback.contextualInsights.length} organizational insights identified
- Impact analysis covers ${Object.keys(feedback.impactAnalysis.impactMap).length} related departments
- ${feedback.recommendations.length} strategic recommendations available
- ${feedback.warnings.length} risk factors to consider`;
  }

  /**
   * Identify relevant organizational priorities
   */
  private async identifyRelevantOrganizationalPriorities(
    query: string,
    companyId: string
  ): Promise<string[]> {
    // This would analyze the query against organizational objectives
    return [
      'Revenue growth alignment',
      'Operational efficiency optimization',
      'Cross-departmental collaboration',
      'Resource utilization improvement'
    ];
  }

  /**
   * Enhance prompt with organizational context
   */
  private enhancePromptWithOrganizationalContext(
    basePrompt: string,
    crossDeptContext: string,
    orgPriorities: string[]
  ): string {
    return `${basePrompt}

🌐 **ORGANIZATIONAL CONTEXT:**
${crossDeptContext}

🎯 **ORGANIZATIONAL PRIORITIES:**
${orgPriorities.map(priority => `• ${priority}`).join('\n')}

**ENHANCED RESPONSE GUIDELINES:**
- Consider impact on other departments in your recommendations
- Align suggestions with organizational priorities
- Highlight any cross-departmental coordination needed
- Identify potential resource conflicts or synergies
- Provide context on how this relates to company-wide objectives`;
  }

  /**
   * Extract opportunity highlights
   */
  private extractOpportunityHighlights(contextualFeedback: any): string[] {
    return contextualFeedback.contextualInsights
      .filter((insight: CrossDepartmentalInsight) => insight.severity === 'low')
      .map((insight: CrossDepartmentalInsight) => insight.insight)
      .slice(0, 3);
  }

  /**
   * Identify related departments from impact analysis
   */
  private identifyRelatedDepartments(impactAnalysis: DepartmentImpactAnalysis): Array<{
    department: string;
    relevance: number;
    suggestedActions: string[];
  }> {
    return Object.entries(impactAnalysis.impactMap).map(([dept, impact]) => ({
      department: dept,
      relevance: impact.directImpact || 50,
      suggestedActions: impact.keyMetrics?.slice(0, 2) || []
    }));
  }

  /**
   * Identify all relevant departments for executive queries
   */
  private identifyAllRelevantDepartments(query: string): Array<{
    department: string;
    relevance: number;
    suggestedActions: string[];
  }> {
    // For executive queries, all departments are potentially relevant
    const departments = ['sales', 'marketing', 'finance', 'operations', 'hr', 'it', 'product'];
    
    return departments.map(dept => ({
      department: dept,
      relevance: 70, // Default relevance for executive queries
      suggestedActions: [`Review ${dept} metrics`, `Assess ${dept} alignment`]
    }));
  }

  /**
   * Identify affected departments from query
   */
  private identifyAffectedDepartments(query: string): string[] {
    const queryLower = query.toLowerCase();
    const departments = [];

    if (queryLower.includes('sales') || queryLower.includes('revenue') || queryLower.includes('pipeline')) {
      departments.push('sales');
    }
    if (queryLower.includes('marketing') || queryLower.includes('campaign') || queryLower.includes('leads')) {
      departments.push('marketing');
    }
    if (queryLower.includes('finance') || queryLower.includes('budget') || queryLower.includes('cost')) {
      departments.push('finance');
    }
    if (queryLower.includes('operations') || queryLower.includes('process') || queryLower.includes('efficiency')) {
      departments.push('operations');
    }

    // If no specific departments identified, include major ones
    if (departments.length === 0) {
      departments.push('sales', 'marketing', 'finance', 'operations');
    }

    return departments;
  }

  /**
   * Extract opportunities from insights
   */
  private extractOpportunities(insights: CrossDepartmentalInsight[]): string[] {
    return insights
      .filter(insight => insight.severity === 'low' || insight.confidence > 0.8)
      .map(insight => insight.insight)
      .slice(0, 3);
  }
}

// Export singleton instance
export const enhancedContextualRAG = new EnhancedContextualRAG(); 