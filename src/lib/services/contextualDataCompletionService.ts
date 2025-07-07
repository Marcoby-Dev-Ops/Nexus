import { supabase } from '../core/supabase';
import { profileContextService } from './profileContextService';
import type { RAGProfileContext } from './profileContextService';

export interface ContextGap {
  id: string;
  type: 'user_profile' | 'business_data' | 'department_context' | 'integration_data';
  severity: 'critical' | 'important' | 'optional';
  field: string;
  description: string;
  suggestedValue?: string;
  quickFillOptions?: string[];
  impact: string;
  exampleQueries: string[];
  fillMethod: 'manual' | 'integration' | 'ai_suggested';
  estimatedTimeToFill: number; // in minutes
}

export interface ContextCompletionSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  gaps: ContextGap[];
  expectedImpact: string;
  oneClickFill: boolean;
  fillAction?: () => Promise<void>;
}

export interface ConversationContextAnalysis {
  missingContextDetected: boolean;
  contextGaps: ContextGap[];
  suggestedCompletions: ContextCompletionSuggestion[];
  confidenceScore: number;
  queryIntent: string;
  priorityRecommendation: string;
}

export class ContextualDataCompletionService {
  
  /**
   * Analyze a conversation query and detect missing context
   */
  async analyzeConversationForMissingContext(
    userId: string,
    query: string,
    aiResponse: string,
    department?: string
  ): Promise<ConversationContextAnalysis> {
    // Get current user context
    const currentContext = await profileContextService.getUserRAGContext(userId);
    const missingFields = await profileContextService.getMissingContextFields(userId);
    
    // Analyze the query for context needs
    const queryAnalysis = this.analyzeQueryForContextNeeds(query, department);
    
    // Detect gaps in AI response capabilities
    const responseGaps = this.detectResponseLimitations(aiResponse, currentContext);
    
    // Generate contextual suggestions
    const contextGaps = await this.identifyContextGaps(
      queryAnalysis,
      missingFields,
      responseGaps,
      currentContext
    );
    
    const suggestedCompletions = await this.generateContextCompletionSuggestions(
      contextGaps,
      queryAnalysis,
      userId
    );
    
    const confidenceScore = this.calculateConfidenceScore(contextGaps, queryAnalysis);
    
    return {
      missingContextDetected: contextGaps.length > 0,
      contextGaps,
      suggestedCompletions,
      confidenceScore,
      queryIntent: queryAnalysis.intent,
      priorityRecommendation: this.generatePriorityRecommendation(contextGaps, queryAnalysis)
    };
  }
  
  /**
   * Proactively suggest context completion based on user patterns
   */
  async getProactiveContextSuggestions(userId: string): Promise<ContextCompletionSuggestion[]> {
    const currentContext = await profileContextService.getUserRAGContext(userId);
    const missingFields = await profileContextService.getMissingContextFields(userId);
    const userActivity = await this.getUserActivityPatterns(userId);
    
    const suggestions: ContextCompletionSuggestion[] = [];
    
    // High-impact business profile gaps
    if (missingFields.critical.length > 0) {
      suggestions.push({
        id: 'business-identity',
        title: 'Complete Your Business Identity',
        description: `${missingFields.critical.length} essential fields are missing, limiting AI personalization`,
        priority: 'high',
        category: 'Business Profile',
        gaps: missingFields.critical.map(field => this.createContextGap(field, 'critical', currentContext)),
        expectedImpact: 'Dramatically improve AI response quality and business recommendations',
        oneClickFill: true,
        fillAction: () => this.triggerProfileCompletion(userId, 'critical')
      });
    }
    
    // Department-specific context gaps
    if (currentContext?.department) {
      const departmentGaps = await this.analyzeDepartmentContextGaps(
        currentContext.department,
        currentContext,
        userActivity
      );
      
      if (departmentGaps.length > 0) {
        suggestions.push({
          id: 'department-context',
          title: `Enhance ${currentContext.department} Context`,
          description: `Add ${currentContext.department}-specific data for better insights`,
          priority: 'medium',
          category: 'Department Context',
          gaps: departmentGaps,
          expectedImpact: `Get more relevant ${currentContext.department} recommendations and insights`,
          oneClickFill: false
        });
      }
    }
    
    // Integration-based suggestions
    const integrationGaps = await this.analyzeIntegrationContextGaps(userId, currentContext);
    if (integrationGaps.length > 0) {
      suggestions.push({
        id: 'integration-context',
        title: 'Connect Business Data Sources',
        description: 'Link your business tools for real-time insights',
        priority: 'medium',
        category: 'Data Integration',
        gaps: integrationGaps,
        expectedImpact: 'Transform static recommendations into live business intelligence',
        oneClickFill: false
      });
    }
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * Generate contextual data suggestions based on query intent
   */
  async generateContextualSuggestions(
    query: string,
    department?: string,
    userId?: string
  ): Promise<ContextCompletionSuggestion[]> {
    const queryAnalysis = this.analyzeQueryForContextNeeds(query, department);
    const suggestions: ContextCompletionSuggestion[] = [];
    
    // Sales-specific context needs
    if (queryAnalysis.departmentFocus === 'sales') {
      suggestions.push({
        id: 'sales-context',
        title: 'Connect CRM for Live Sales Data',
        description: 'Link HubSpot/Salesforce for real-time pipeline insights',
        priority: 'high',
        category: 'Sales Intelligence',
        gaps: [
          {
            id: 'crm-integration',
            type: 'integration_data',
            severity: 'important',
            field: 'crm_connection',
            description: 'CRM integration for live sales data',
            impact: 'Enable real-time sales insights and pipeline analytics',
            exampleQueries: ['Show me my sales pipeline', 'How are deals progressing?'],
            fillMethod: 'integration',
            estimatedTimeToFill: 5
          }
        ],
        expectedImpact: 'Get live sales metrics instead of generic advice',
        oneClickFill: true
      });
    }
    
    // Financial context needs
    if (queryAnalysis.departmentFocus === 'finance') {
      suggestions.push({
        id: 'financial-context',
        title: 'Connect Financial Data',
        description: 'Link QuickBooks/Stripe for real-time financial insights',
        priority: 'high',
        category: 'Financial Intelligence',
        gaps: [
          {
            id: 'financial-integration',
            type: 'integration_data',
            severity: 'important',
            field: 'financial_connection',
            description: 'Financial system integration for live data',
            impact: 'Enable real-time financial insights and reporting',
            exampleQueries: ['Show me cash flow', 'What are our expenses?'],
            fillMethod: 'integration',
            estimatedTimeToFill: 5
          }
        ],
        expectedImpact: 'Get live financial metrics instead of generic advice',
        oneClickFill: true
      });
    }
    
    // Personal context needs
    if (queryAnalysis.needsPersonalization) {
      suggestions.push({
        id: 'personal-context',
        title: 'Complete Your Profile',
        description: 'Add personal preferences for better AI assistance',
        priority: 'medium',
        category: 'Personal Profile',
        gaps: [
          {
            id: 'communication-style',
            type: 'user_profile',
            severity: 'important',
            field: 'communication_style',
            description: 'How you prefer to receive information',
            quickFillOptions: ['Direct & concise', 'Detailed analysis', 'Visual summaries'],
            impact: 'Get responses tailored to your communication style',
            exampleQueries: ['How should I approach this?', 'What do you recommend?'],
            fillMethod: 'manual',
            estimatedTimeToFill: 1
          }
        ],
        expectedImpact: 'Get personalized responses that match your work style',
        oneClickFill: true
      });
    }
    
    return suggestions;
  }
  
  /**
   * Auto-fill suggested context values using AI
   */
  async autoFillContextSuggestions(
    userId: string,
    contextGaps: ContextGap[],
    userApproval: boolean = false
  ): Promise<{
    filled: number;
    suggestions: Record<string, any>;
    requiresApproval: ContextGap[];
  }> {
    const suggestions: Record<string, any> = {};
    const requiresApproval: ContextGap[] = [];
    let filled = 0;
    
    for (const gap of contextGaps) {
      if (gap.fillMethod === 'ai_suggested') {
        const suggestion = await this.generateAISuggestion(gap, userId);
        
        if (suggestion && suggestion.confidence > 0.7) {
          suggestions[gap.field] = suggestion.value;
          
          if (userApproval) {
            // Apply the suggestion
            await this.applyContextSuggestion(userId, gap.field, suggestion.value);
            filled++;
          } else {
            requiresApproval.push(gap);
          }
        }
      }
    }
    
    return {
      filled,
      suggestions,
      requiresApproval
    };
  }
  
  /**
   * Apply a context suggestion to the user's profile
   */
  async applyContextSuggestion(
    userId: string,
    field: string,
    value: any
  ): Promise<boolean> {
    try {
      const updates = { [field]: value };
      return await profileContextService.updateRAGContext(userId, updates);
    } catch (error) {
      console.error('Error applying context suggestion:', error);
      return false;
    }
  }
  
  /**
   * Track context completion events for learning
   */
  async trackContextCompletion(
    userId: string,
    completionId: string,
    gaps: ContextGap[],
    userAction: 'accepted' | 'rejected' | 'deferred'
  ): Promise<void> {
    try {
      await supabase
        .from('context_completion_events')
        .insert({
          user_id: userId,
          completion_id: completionId,
          gaps_addressed: gaps.map(g => g.id),
          user_action: userAction,
          impact_score: gaps.reduce((sum, gap) => sum + this.getImpactScore(gap), 0),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error tracking context completion:', error);
    }
  }
  
  // Private helper methods
  
  private analyzeQueryForContextNeeds(query: string, department?: string): {
    intent: string;
    departmentFocus: string | null;
    needsPersonalization: boolean;
    needsBusinessData: boolean;
    needsIntegration: boolean;
    contextRequirements: string[];
  } {
    const queryLower = query.toLowerCase();
    
    // Detect department focus
    let departmentFocus = department || null;
    if (queryLower.includes('sales') || queryLower.includes('pipeline') || queryLower.includes('deals')) {
      departmentFocus = 'sales';
    } else if (queryLower.includes('finance') || queryLower.includes('budget') || queryLower.includes('cash')) {
      departmentFocus = 'finance';
    } else if (queryLower.includes('marketing') || queryLower.includes('campaign') || queryLower.includes('leads')) {
      departmentFocus = 'marketing';
    }
    
    // Detect personalization needs
    const needsPersonalization = queryLower.includes('recommend') || 
                                queryLower.includes('should i') || 
                                queryLower.includes('help me') ||
                                queryLower.includes('what do you think');
    
    // Detect business data needs
    const needsBusinessData = queryLower.includes('performance') || 
                             queryLower.includes('metrics') || 
                             queryLower.includes('status') ||
                             queryLower.includes('how is');
    
    // Detect integration needs
    const needsIntegration = queryLower.includes('show me') || 
                            queryLower.includes('current') || 
                            queryLower.includes('latest') ||
                            queryLower.includes('real-time');
    
    return {
      intent: this.classifyQueryIntent(query),
      departmentFocus,
      needsPersonalization,
      needsBusinessData,
      needsIntegration,
      contextRequirements: this.extractContextRequirements(query)
    };
  }
  
  private detectResponseLimitations(aiResponse: string, context: RAGProfileContext | null): string[] {
    const limitations: string[] = [];
    
    if (aiResponse.includes('generic') || aiResponse.includes('general')) {
      limitations.push('response_too_generic');
    }
    
    if (aiResponse.includes('unable to') || aiResponse.includes('cannot')) {
      limitations.push('capability_gap');
    }
    
    if (aiResponse.includes('more information') || aiResponse.includes('could you specify')) {
      limitations.push('insufficient_context');
    }
    
    return limitations;
  }
  
  private async identifyContextGaps(
    queryAnalysis: any,
    missingFields: any,
    responseGaps: string[],
    currentContext: RAGProfileContext | null
  ): Promise<ContextGap[]> {
    const gaps: ContextGap[] = [];
    
    // Add critical missing fields
    missingFields.critical.forEach((field: string) => {
      gaps.push(this.createContextGap(field, 'critical', currentContext));
    });
    
    // Add query-specific gaps
    if (queryAnalysis.needsPersonalization && !currentContext?.communication_style) {
      gaps.push({
        id: 'communication-style',
        type: 'user_profile',
        severity: 'important',
        field: 'communication_style',
        description: 'Communication style preference for personalized responses',
        quickFillOptions: ['Direct & concise', 'Detailed analysis', 'Visual summaries'],
        impact: 'Get responses tailored to your preferred communication style',
        exampleQueries: ['How should I approach this?', 'What do you recommend?'],
        fillMethod: 'manual',
        estimatedTimeToFill: 1
      });
    }
    
    return gaps;
  }
  
  private async generateContextCompletionSuggestions(
    contextGaps: ContextGap[],
    queryAnalysis: any,
    userId: string
  ): Promise<ContextCompletionSuggestion[]> {
    const suggestions: ContextCompletionSuggestion[] = [];
    
    // Group gaps by category
    const gapsByCategory = contextGaps.reduce((acc, gap) => {
      const category = this.getCategoryForGap(gap);
      if (!acc[category]) acc[category] = [];
      acc[category].push(gap);
      return acc;
    }, {} as Record<string, ContextGap[]>);
    
    // Create suggestions for each category
    for (const [category, gaps] of Object.entries(gapsByCategory)) {
      if (gaps.length > 0) {
        suggestions.push({
          id: `${category.toLowerCase().replace(' ', '-')}-completion`,
          title: `Complete ${category} Information`,
          description: `Add ${gaps.length} ${category.toLowerCase()} fields for better AI assistance`,
          priority: this.calculatePriority(gaps),
          category,
          gaps,
          expectedImpact: this.calculateExpectedImpact(gaps),
          oneClickFill: gaps.every(gap => gap.fillMethod !== 'integration')
        });
      }
    }
    
    return suggestions;
  }
  
  private createContextGap(field: string, severity: 'critical' | 'important' | 'optional', context: RAGProfileContext | null): ContextGap {
    const gapDefinitions: Record<string, Partial<ContextGap>> = {
      name: {
        description: 'Your name for personalized greetings and communication',
        impact: 'Enable personalized AI interactions',
        exampleQueries: ['What should I focus on?', 'Help me with...'],
        fillMethod: 'manual',
        estimatedTimeToFill: 1
      },
      role: {
        description: 'Your role in the organization',
        impact: 'Get role-specific advice and recommendations',
        exampleQueries: ['What should I prioritize?', 'Management advice'],
        fillMethod: 'manual',
        estimatedTimeToFill: 1
      },
      department: {
        description: 'Your department for contextual insights',
        impact: 'Get department-specific recommendations and data',
        exampleQueries: ['Show me department metrics', 'How is our team doing?'],
        fillMethod: 'manual',
        estimatedTimeToFill: 1
      },
      experience_level: {
        description: 'Your experience level with business tools',
        quickFillOptions: ['Beginner', 'Intermediate', 'Advanced'],
        impact: 'Get appropriately detailed responses',
        exampleQueries: ['How do I...', 'What\'s the best approach?'],
        fillMethod: 'manual',
        estimatedTimeToFill: 1
      }
    };
    
    const definition = gapDefinitions[field] || {};
    
    return {
      id: field,
      type: 'user_profile',
      severity,
      field,
      description: definition.description || `${field} information`,
      impact: definition.impact || 'Improve AI personalization',
      exampleQueries: definition.exampleQueries || [],
      fillMethod: definition.fillMethod || 'manual',
      estimatedTimeToFill: definition.estimatedTimeToFill || 2,
      quickFillOptions: definition.quickFillOptions
    };
  }
  
  private async getUserActivityPatterns(userId: string): Promise<{
    frequentQueries: string[];
    departmentFocus: string | null;
    interactionStyle: string;
  }> {
    // This would analyze user's chat history and activity patterns
    return {
      frequentQueries: [],
      departmentFocus: null,
      interactionStyle: 'conversational'
    };
  }
  
  private async analyzeDepartmentContextGaps(
    department: string,
    context: RAGProfileContext,
    activity: any
  ): Promise<ContextGap[]> {
    const gaps: ContextGap[] = [];
    
    // Department-specific gap analysis
    if (department === 'sales' && !context.key_tools?.includes('CRM')) {
      gaps.push({
        id: 'sales-crm',
        type: 'integration_data',
        severity: 'important',
        field: 'crm_integration',
        description: 'CRM integration for sales insights',
        impact: 'Get live sales pipeline and customer data',
        exampleQueries: ['Show me my deals', 'How are sales performing?'],
        fillMethod: 'integration',
        estimatedTimeToFill: 5
      });
    }
    
    return gaps;
  }
  
  private async analyzeIntegrationContextGaps(
    userId: string,
    context: RAGProfileContext | null
  ): Promise<ContextGap[]> {
    const gaps: ContextGap[] = [];
    
    // Check for missing business integrations
    if (!context?.data_sources?.length) {
      gaps.push({
        id: 'business-integrations',
        type: 'integration_data',
        severity: 'important',
        field: 'business_integrations',
        description: 'Connect business tools for real-time data',
        impact: 'Transform AI from generic advice to live business intelligence',
        exampleQueries: ['What\'s happening with my business?', 'Show me current metrics'],
        fillMethod: 'integration',
        estimatedTimeToFill: 10
      });
    }
    
    return gaps;
  }
  
  private generatePriorityRecommendation(gaps: ContextGap[], queryAnalysis: any): string {
    if (gaps.length === 0) return 'No additional context needed';
    
    const criticalGaps = gaps.filter(g => g.severity === 'critical');
    if (criticalGaps.length > 0) {
      return `Complete ${criticalGaps.length} critical fields to dramatically improve AI assistance`;
    }
    
    const importantGaps = gaps.filter(g => g.severity === 'important');
    if (importantGaps.length > 0) {
      return `Add ${importantGaps.length} important fields for better personalization`;
    }
    
    return 'Consider adding optional fields for enhanced AI assistance';
  }
  
  private calculateConfidenceScore(gaps: ContextGap[], queryAnalysis: any): number {
    if (gaps.length === 0) return 1.0;
    
    const totalWeight = gaps.reduce((sum, gap) => {
      const weights = { critical: 0.4, important: 0.3, optional: 0.1 };
      return sum + weights[gap.severity];
    }, 0);
    
    return Math.max(0, 1 - totalWeight);
  }
  
  private async generateAISuggestion(gap: ContextGap, userId: string): Promise<{
    value: any;
    confidence: number;
    reasoning: string;
  } | null> {
    // This would use AI to suggest values based on user patterns
    return null;
  }
  
  private async triggerProfileCompletion(userId: string, priority: string): Promise<void> {
    // This would trigger a profile completion flow
    console.log(`Triggering ${priority} profile completion for user ${userId}`);
  }
  
  private classifyQueryIntent(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('show') || queryLower.includes('what is')) {
      return 'information_request';
    } else if (queryLower.includes('how') || queryLower.includes('help')) {
      return 'guidance_request';
    } else if (queryLower.includes('recommend') || queryLower.includes('suggest')) {
      return 'recommendation_request';
    } else {
      return 'general_inquiry';
    }
  }
  
  private extractContextRequirements(query: string): string[] {
    const requirements: string[] = [];
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('my') || queryLower.includes('our')) {
      requirements.push('personal_context');
    }
    
    if (queryLower.includes('business') || queryLower.includes('company')) {
      requirements.push('business_context');
    }
    
    if (queryLower.includes('team') || queryLower.includes('department')) {
      requirements.push('team_context');
    }
    
    return requirements;
  }
  
  private getCategoryForGap(gap: ContextGap): string {
    const categoryMap: Record<string, string> = {
      user_profile: 'Personal Profile',
      business_data: 'Business Information',
      department_context: 'Department Context',
      integration_data: 'Data Integration'
    };
    
    return categoryMap[gap.type] || 'General';
  }
  
  private calculatePriority(gaps: ContextGap[]): 'high' | 'medium' | 'low' {
    const hasCritical = gaps.some(g => g.severity === 'critical');
    const hasImportant = gaps.some(g => g.severity === 'important');
    
    if (hasCritical) return 'high';
    if (hasImportant) return 'medium';
    return 'low';
  }
  
  private calculateExpectedImpact(gaps: ContextGap[]): string {
    const impactMap: Record<string, number> = {
      critical: 5,
      important: 3,
      optional: 1
    };
    
    const totalImpact = gaps.reduce((sum, gap) => sum + impactMap[gap.severity], 0);
    
    if (totalImpact >= 10) return 'Dramatically improve AI assistance quality';
    if (totalImpact >= 5) return 'Significantly enhance AI personalization';
    return 'Improve AI response relevance';
  }
  
  private getImpactScore(gap: ContextGap): number {
    const impactMap: Record<string, number> = {
      critical: 5,
      important: 3,
      optional: 1
    };
    
    return impactMap[gap.severity] || 1;
  }
}

export const contextualDataCompletionService = new ContextualDataCompletionService(); 