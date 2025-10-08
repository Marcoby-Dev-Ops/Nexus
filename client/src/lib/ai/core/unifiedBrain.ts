import { logger } from '@/shared/utils/logger';
import { agentRegistry, type ChatAgent } from './agentRegistry';
import { ContextualRAG } from './contextualRAG';
import { consolidatedAIService } from '@/services/ai/ConsolidatedAIService';
import { onboardingBrainIntegration } from '@/shared/services/OnboardingBrainIntegrationService';

// Core unified brain interfaces
export interface UnifiedBrainContext {
  userId: string;
  tenantId: string;
  sessionId: string;
  currentPage?: string;
  userIntent?: string;
  businessContext?: Record<string, any>;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    agentUsed?: string;
  }>;
  // Extended optional fields populated by enhanceContext
  userProfile?: any;
  sessionMemory?: any;
  learningPatterns?: any;
  relevantDocs?: any[];
  contextSources?: string[];
  // Optional shared personality supplied by server or enhanced context
  sharedPersonality?: string;
}

export interface UnifiedBrainRequest {
  input: string;
  context: UnifiedBrainContext;
  requestType: 'chat' | 'action' | 'generation' | 'analysis' | 'automation';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  constraints?: Record<string, any>;
}

export interface UnifiedBrainResponse {
  success: boolean;
  output: string;
  agentUsed: string;
  confidence: number;
  actions: UnifiedBrainAction[];
  insights: UnifiedBrainInsight[];
  nextSteps: string[];
  metadata: {
    processingTime: number;
    contextUsed: string[];
    toolsExecuted: string[];
    reasoning: string;
  };
}

export interface UnifiedBrainAction {
  type: 'create' | 'update' | 'delete' | 'analyze' | 'notify' | 'automate';
  target: string;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: number; // 1-10 scale
}

export interface UnifiedBrainInsight {
  type: 'opportunity' | 'risk' | 'pattern' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: number;
  actionable: boolean;
  relatedData?: Record<string, any>;
}

/**
 * Unified Brain - The Central Logic Layer
 * 
 * This service acts as the "human brain" of the Nexus platform, coordinating
 * all services, actions, and generations through a unified intelligence system.
 * 
 * Key Responsibilities:
 * - Route requests to appropriate agents based on context and intent
 * - Coordinate cross-departmental intelligence and actions
 * - Maintain conversation context and learning across sessions
 * - Execute actions with full organizational awareness
 * - Generate insights and recommendations
 * - Manage tool execution and automation
 */
export class UnifiedBrain {
  private contextualRAG: ContextualRAG;
  private aiAgentWithTools: any;
  private sessionMemory: Map<string, UnifiedBrainContext> = new Map();
  private learningPatterns: Map<string, any> = new Map();

  constructor() {
  this.contextualRAG = new ContextualRAG();
  // Use consolidated AI service as the agent executor
  this.aiAgentWithTools = consolidatedAIService;
    logger.info('Unified Brain initialized');
  }

  /**
   * Main entry point for all platform operations
   * Routes requests through the unified intelligence system
   */
  async processRequest(request: UnifiedBrainRequest): Promise<UnifiedBrainResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Unified Brain processing request', { 
        type: request.requestType, 
        priority: request.priority,
        userId: request.context.userId 
      });

      // 1. Enhance context with unified brain intelligence
      const enhancedContext = await this.enhanceContext(request.context);

      // 2. Analyze intent and determine optimal agent
      const agentSelection = await this.selectOptimalAgent(request, enhancedContext);

      // 3. Gather cross-departmental intelligence
      const crossDeptIntelligence = await this.gatherCrossDepartmentalIntelligence(request, enhancedContext);

      // 4. Execute through unified brain pipeline
      const result = await this.executeUnifiedBrainPipeline(request, enhancedContext, agentSelection, crossDeptIntelligence);

      // 5. Generate insights and next steps
      const insights = await this.generateInsights(request, result, enhancedContext);
      const nextSteps = await this.generateNextSteps(request, result, enhancedContext);

      // 6. Update learning patterns
      await this.updateLearningPatterns(request, result, enhancedContext);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        output: result.output,
        agentUsed: agentSelection.agent.id,
        confidence: result.confidence,
        actions: result.actions,
        insights,
        nextSteps,
        metadata: {
          processingTime,
          contextUsed: enhancedContext.contextSources || [],
          toolsExecuted: result.toolsExecuted || [],
          reasoning: result.reasoning || 'Unified brain processing completed'
        }
      };

    } catch (error) {
      logger.error('Unified Brain processing error', { error, request });
      return {
        success: false,
        output: 'I encountered an issue processing your request. Let me help you with a simpler approach.',
        agentUsed: 'executive-assistant',
        confidence: 0.3,
        actions: [],
        insights: [],
        nextSteps: ['Please try rephrasing your request', 'Contact support if the issue persists'],
        metadata: {
          processingTime: Date.now() - startTime,
          contextUsed: [],
          toolsExecuted: [],
          reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  /**
   * Enhance context with unified brain intelligence
   */
  private async enhanceContext(context: UnifiedBrainContext): Promise<UnifiedBrainContext & { contextSources: string[] }> {
    const contextSources: string[] = [];
    
    try {
      // Get user profile and preferences
      const userProfile = await this.getUserProfile(context.userId);
      contextSources.push('user_profile');

      // Get business context and metrics
      const businessContext = await this.getBusinessContext(context.tenantId);
      contextSources.push('business_metrics');

      // Get session memory and learning patterns
      const sessionMemory = this.sessionMemory.get(context.sessionId);
      const learningPatterns = this.learningPatterns.get(context.userId);
      contextSources.push('session_memory', 'learning_patterns');

      // Get relevant documents and knowledge
      const relevantDocs = await this.contextualRAG.searchRelevantDocuments({
        query: context.userIntent || 'general context',
        context: { userId: context.userId, companyId: context.tenantId },
        maxResults: 5
      });
      contextSources.push('document_knowledge');

      return {
        ...context,
        userProfile,
        businessContext,
        sessionMemory,
        learningPatterns,
        relevantDocs: relevantDocs.documents,
        contextSources
      };

    } catch (error) {
      logger.error('Error enhancing context', { error, context });
      return { ...context, contextSources: ['basic_context'] };
    }
  }

  /**
   * Select optimal agent based on request type, context, and intelligence
   */
  private async selectOptimalAgent(
    request: UnifiedBrainRequest, 
    context: UnifiedBrainContext
  ): Promise<{ agent: ChatAgent; confidence: number; reasoning: string }> {
    // Default to executive assistant
    let selectedAgent = (agentRegistry.getAgent('executive-assistant') as ChatAgent) || (agentRegistry.getAllAgents()[0] as ChatAgent);
    let confidence = 0.7;
    let reasoning = 'Default executive routing';

    try {
      // Analyze request type and content
      const requestAnalysis = await this.analyzeRequest(request, context);

      // Route based on request type
      switch (request.requestType) {
        case 'chat':
          selectedAgent = await this.routeChatRequest(request, context, requestAnalysis);
          break;
        case 'action':
          selectedAgent = await this.routeActionRequest(request, context, requestAnalysis);
          break;
        case 'generation':
          selectedAgent = await this.routeGenerationRequest(request, context, requestAnalysis);
          break;
        case 'analysis':
          selectedAgent = await this.routeAnalysisRequest(request, context, requestAnalysis);
          break;
        case 'automation':
          selectedAgent = await this.routeAutomationRequest(request, context, requestAnalysis);
          break;
      }

      // Adjust confidence based on context match
      confidence = this.calculateAgentConfidence(selectedAgent, request, context);
      reasoning = `Selected ${selectedAgent.name} for ${request.requestType} request`;

    } catch (error) {
      logger.error('Error selecting agent', { error, request });
    }

    return { agent: selectedAgent as ChatAgent, confidence, reasoning };
  }

  /**
   * Gather cross-departmental intelligence for comprehensive decision making
   */
  private async gatherCrossDepartmentalIntelligence(
    request: UnifiedBrainRequest,
    context: UnifiedBrainContext
  ): Promise<Record<string, any>> {
    
    const intelligence: Record<string, any> = {};

    try {
      // Get sales intelligence if relevant
      if (this.isSalesRelevant(request)) {
        intelligence.sales = await this.getSalesIntelligence(context.tenantId);
      }

      // Get financial intelligence if relevant
      if (this.isFinancialRelevant(request)) {
        intelligence.financial = await this.getFinancialIntelligence(context.tenantId);
      }

      // Get operational intelligence if relevant
      if (this.isOperationalRelevant(request)) {
        intelligence.operational = await this.getOperationalIntelligence(context.tenantId);
      }

      // Get marketing intelligence if relevant
      if (this.isMarketingRelevant(request)) {
        intelligence.marketing = await this.getMarketingIntelligence(context.tenantId);
      }

      // Cross-departmental correlations
      intelligence.correlations = await this.analyzeCrossDepartmentalCorrelations(intelligence);

    } catch (error) {
      logger.error('Error gathering cross-departmental intelligence', { error });
    }

    return intelligence;
  }

  /**
   * Execute the unified brain pipeline
   */
  private async executeUnifiedBrainPipeline(
    request: UnifiedBrainRequest,
    context: UnifiedBrainContext,
  agentSelection: { agent: ChatAgent; confidence: number; reasoning: string },
    crossDeptIntelligence: Record<string, any>
  ): Promise<{
    output: string;
    confidence: number;
    actions: UnifiedBrainAction[];
    toolsExecuted: string[];
    reasoning: string;
  }> {

    try {
      // Build comprehensive system prompt with unified brain context
      const systemPrompt = this.buildUnifiedBrainSystemPrompt(
        agentSelection.agent,
        context,
        crossDeptIntelligence,
        request
      );

      // Execute through AI agent with tools
      const agentResponse = await this.aiAgentWithTools.processMessage({
        message: request.input,
        systemPrompt,
        agent: agentSelection.agent,
        context: {
          ...context,
          crossDepartmentalIntelligence: crossDeptIntelligence,
          unifiedBrainContext: true
        }
      });

      // Extract actions from response
      const actions = this.extractActionsFromResponse(agentResponse);

      // Execute any immediate actions
      const executedActions = await this.executeImmediateActions(actions, context);

      return {
        output: agentResponse.message,
        confidence: agentSelection.confidence,
        actions: executedActions,
        toolsExecuted: agentResponse.toolsExecuted || [],
        reasoning: agentSelection.reasoning
      };

    } catch (error) {
      logger.error('Error in unified brain pipeline', { error });
      throw error;
    }
  }

  /**
   * Generate insights based on request, result, and context
   */
  private async generateInsights(
    request: UnifiedBrainRequest,
    result: any,
    context: UnifiedBrainContext
  ): Promise<UnifiedBrainInsight[]> {
    
    const insights: UnifiedBrainInsight[] = [];

    try {
      // Pattern recognition insights
      const patterns = await this.recognizePatterns(request, context);
      insights.push(...patterns);

      // Opportunity detection
      const opportunities = await this.detectOpportunities(request, context);
      insights.push(...opportunities);

      // Risk assessment
      const risks = await this.assessRisks(request, context);
      insights.push(...risks);

      // Performance insights
      const performance = await this.analyzePerformance(request, context);
      insights.push(...performance);

    } catch (error) {
      logger.error('Error generating insights', { error });
    }

    return insights;
  }

  /**
   * Generate next steps based on current state and goals
   */
  private async generateNextSteps(
    request: UnifiedBrainRequest,
    result: any,
    context: UnifiedBrainContext
  ): Promise<string[]> {
    
    const nextSteps: string[] = [];

    try {
      // Immediate next steps
      if (result.actions.length > 0) {
        nextSteps.push('Review and approve the suggested actions');
      }

      // Follow-up steps based on request type
      switch (request.requestType) {
        case 'chat':
          nextSteps.push('Continue the conversation to explore further');
          break;
        case 'action':
          nextSteps.push('Monitor the action execution and results');
          break;
        case 'generation':
          nextSteps.push('Review and refine the generated content');
          break;
        case 'analysis':
          nextSteps.push('Act on the analysis insights');
          break;
        case 'automation':
          nextSteps.push('Test and validate the automation');
          break;
      }

      // Learning-based next steps
      const learningSteps = await this.generateLearningBasedSteps(request, context);
      nextSteps.push(...learningSteps);

    } catch (error) {
      logger.error('Error generating next steps', { error });
      nextSteps.push('Continue with your current workflow');
    }

    return nextSteps;
  }

  /**
   * Update learning patterns for continuous improvement
   */
  private async updateLearningPatterns(
    request: UnifiedBrainRequest,
    result: any,
    context: UnifiedBrainContext
  ): Promise<void> {
    
    try {
      const userPatterns = this.learningPatterns.get(context.userId) || {};
      
      // Update request patterns
      userPatterns.requestTypes = userPatterns.requestTypes || {};
      userPatterns.requestTypes[request.requestType] = (userPatterns.requestTypes[request.requestType] || 0) + 1;

      // Update agent effectiveness
      userPatterns.agentEffectiveness = userPatterns.agentEffectiveness || {};
      userPatterns.agentEffectiveness[result.agentUsed] = {
        success: result.success,
        confidence: result.confidence,
        timestamp: new Date().toISOString()
      };

      // Update session memory
      this.sessionMemory.set(context.sessionId, {
        ...context,
        conversationHistory: [
          ...(context.conversationHistory || []),
          {
            role: 'user',
            content: request.input,
            timestamp: new Date().toISOString()
          },
          {
            role: 'assistant',
            content: result.output,
            timestamp: new Date().toISOString(),
            agentUsed: result.agentUsed
          }
        ]
      });

      this.learningPatterns.set(context.userId, userPatterns);
    } catch (error) {
      logger.error('Error updating learning patterns', { error });
    }
  }

  // Helper methods for context enhancement
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const response = await onboardingBrainIntegration.getOnboardingContext(userId);
      if (response && response.success && response.data) {
        return response.data.userProfile;
      }
      logger.warn('Failed to get onboarding context, using default profile', { userId });
      return { userId, preferences: {} };
    } catch (error) {
      logger.error('Error getting user profile', { userId, error });
      return { userId, preferences: {} };
    }
  }

  private async getBusinessContext(tenantId: string): Promise<any> {
    try {
      // For now, use the same user ID as tenant ID
      // In a multi-tenant setup, this would be different
      const response = await onboardingBrainIntegration.getOnboardingContext(tenantId);
      if (response.success && response.data) {
        return {
          tenantId,
          businessContext: response.data.businessContext,
          goals: response.data.goals,
          tools: response.data.tools,
          recommendations: response.data.recommendations
        };
      }
      logger.warn('Failed to get business context, using default', { tenantId });
      return { tenantId, metrics: {} };
    } catch (error) {
      logger.error('Error getting business context', { tenantId, error });
      return { tenantId, metrics: {} };
    }
  }

  // Helper methods for agent routing
  private async analyzeRequest(request: UnifiedBrainRequest, context: UnifiedBrainContext): Promise<any> {
    // Implementation would analyze request content and intent
    return { intent: 'general', complexity: 'medium' };
  }

  private async routeChatRequest(request: UnifiedBrainRequest, context: UnifiedBrainContext, analysis: any): Promise<ChatAgent> {
    // Route chat requests to appropriate agent
    return agentRegistry.getAgent('executive-assistant') as ChatAgent;
  }

  private async routeActionRequest(request: UnifiedBrainRequest, context: UnifiedBrainContext, analysis: any): Promise<ChatAgent> {
    // Route action requests to appropriate agent
    return agentRegistry.getAgent('executive-assistant') as ChatAgent;
  }

  private async routeGenerationRequest(request: UnifiedBrainRequest, context: UnifiedBrainContext, analysis: any): Promise<ChatAgent> {
    // Route generation requests to appropriate agent
    return agentRegistry.getAgent('executive-assistant') as ChatAgent;
  }

  private async routeAnalysisRequest(request: UnifiedBrainRequest, context: UnifiedBrainContext, analysis: any): Promise<ChatAgent> {
    // Route analysis requests to appropriate agent
    return agentRegistry.getAgent('executive-assistant') as ChatAgent;
  }

  private async routeAutomationRequest(request: UnifiedBrainRequest, context: UnifiedBrainContext, analysis: any): Promise<ChatAgent> {
    // Route automation requests to appropriate agent
    return agentRegistry.getAgent('executive-assistant') as ChatAgent;
  }

  private calculateAgentConfidence(agent: ChatAgent, request: UnifiedBrainRequest, context: UnifiedBrainContext): number {
    // Calculate confidence based on agent capabilities and request match
    return 0.8;
  }

  // Helper methods for cross-departmental intelligence
  private isSalesRelevant(request: UnifiedBrainRequest): boolean {
    return request.input.toLowerCase().includes('sales') || 
           request.input.toLowerCase().includes('revenue') ||
           request.input.toLowerCase().includes('pipeline');
  }

  private isFinancialRelevant(request: UnifiedBrainRequest): boolean {
    return request.input.toLowerCase().includes('financial') || 
           request.input.toLowerCase().includes('budget') ||
           request.input.toLowerCase().includes('cost');
  }

  private isOperationalRelevant(request: UnifiedBrainRequest): boolean {
    return request.input.toLowerCase().includes('operational') || 
           request.input.toLowerCase().includes('process') ||
           request.input.toLowerCase().includes('efficiency');
  }

  private isMarketingRelevant(request: UnifiedBrainRequest): boolean {
    return request.input.toLowerCase().includes('marketing') || 
           request.input.toLowerCase().includes('campaign') ||
           request.input.toLowerCase().includes('growth');
  }

  private async getSalesIntelligence(tenantId: string): Promise<any> {
    // Implementation would fetch sales intelligence
    return { pipeline: {}, metrics: {} };
  }

  private async getFinancialIntelligence(tenantId: string): Promise<any> {
    // Implementation would fetch financial intelligence
    return { budget: {}, metrics: {} };
  }

  private async getOperationalIntelligence(tenantId: string): Promise<any> {
    // Implementation would fetch operational intelligence
    return { processes: {}, metrics: {} };
  }

  private async getMarketingIntelligence(tenantId: string): Promise<any> {
    // Implementation would fetch marketing intelligence
    return { campaigns: {}, metrics: {} };
  }

  private async analyzeCrossDepartmentalCorrelations(intelligence: Record<string, any>): Promise<any> {
    // Implementation would analyze correlations between departments
    return { correlations: [] };
  }

  // Helper methods for pipeline execution
  private buildUnifiedBrainSystemPrompt(
    agent: ChatAgent,
    context: UnifiedBrainContext,
    crossDeptIntelligence: Record<string, any>,
    request: UnifiedBrainRequest
  ): string {
    const shared = context.sharedPersonality || '';

    return `${shared ? `SHARED PERSONALITY:\n${shared}\n\n` : ''}` + `
You are ${agent.name}, operating within the Nexus Unified Brain system.

UNIFIED BRAIN CONTEXT:
- User Context: ${JSON.stringify(context.userProfile || {})}
- Business Context: ${JSON.stringify(context.businessContext || {})}
- Cross-Departmental Intelligence: ${JSON.stringify(crossDeptIntelligence || {})}
- Request Type: ${request.requestType}
- Priority: ${request.priority || 'medium'}

AGENT CAPABILITIES:
- Expertise: ${(agent as any).knowledgeBase?.expertise?.join(', ') || ((agent.personality && agent.personality.communicationStyle) ? agent.personality.communicationStyle : '')}
- Tools: ${(agent as any).knowledgeBase?.tools?.join(', ') || ((agent.metadata && agent.metadata.tools) ? (agent.metadata.tools as string[]).join(', ') : '')}
- Frameworks: ${(agent as any).knowledgeBase?.frameworks?.join(', ') || ((agent.metadata && agent.metadata.frameworks) ? (agent.metadata.frameworks as string[]).join(', ') : '')}

UNIFIED BRAIN INSTRUCTIONS:
- Leverage cross-departmental intelligence for comprehensive responses
- Consider organizational impact of your recommendations
- Use your specialized expertise while maintaining organizational awareness
- Provide actionable insights that align with business objectives
- Coordinate with other departments when necessary

RESPONSE REQUIREMENTS:
- Stay in character as ${agent.name}
- Use unified brain context for informed decisions
- Provide specific, actionable recommendations
- Consider cross-departmental implications
- Maintain strategic alignment with business goals
`;
  }

  private extractActionsFromResponse(response: any): UnifiedBrainAction[] {
    // Implementation would extract actions from AI response
    return [];
  }

  private async executeImmediateActions(actions: UnifiedBrainAction[], context: UnifiedBrainContext): Promise<UnifiedBrainAction[]> {
    // Implementation would execute immediate actions
    return actions;
  }

  // Helper methods for insights generation
  private async recognizePatterns(request: UnifiedBrainRequest, context: UnifiedBrainContext): Promise<UnifiedBrainInsight[]> {
    // Implementation would recognize patterns
    return [];
  }

  private async detectOpportunities(request: UnifiedBrainRequest, context: UnifiedBrainContext): Promise<UnifiedBrainInsight[]> {
    // Implementation would detect opportunities
    return [];
  }

  private async assessRisks(request: UnifiedBrainRequest, context: UnifiedBrainContext): Promise<UnifiedBrainInsight[]> {
    // Implementation would assess risks
    return [];
  }

  private async analyzePerformance(request: UnifiedBrainRequest, context: UnifiedBrainContext): Promise<UnifiedBrainInsight[]> {
    // Implementation would analyze performance
    return [];
  }

  private async generateLearningBasedSteps(request: UnifiedBrainRequest, context: UnifiedBrainContext): Promise<string[]> {
    // Implementation would generate learning-based steps
    return [];
  }
}

// Export singleton instance
export const unifiedBrain = new UnifiedBrain();
