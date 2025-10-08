import type { UserContext } from '../types/types';
import { conversationRouter } from './conversationRouter';
import { agentRegistry } from '../core/agentRegistry';
import { BaseService } from '@/core/services/BaseService';

export interface ConversationContext {
  currentAgentId: string;
  userContext: UserContext | null;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    agentId?: string;
    timestamp: Date;
  }>;
}

export class DefaultAgentService extends BaseService {
  private static instance: DefaultAgentService;
  private conversationContext: ConversationContext;

  private constructor() {
    super();
    this.conversationContext = {
      currentAgentId: 'executive-assistant',
      userContext: null,
      conversationHistory: []
    };
  }

  public static getInstance(): DefaultAgentService {
    if (!DefaultAgentService.instance) {
      DefaultAgentService.instance = new DefaultAgentService();
    }
    return DefaultAgentService.instance;
  }

  /**
   * Initialize the default agent with user context
   */
  public initialize(userContext: UserContext): void {
    this.conversationContext.userContext = userContext;
    conversationRouter.setUserContext(userContext);
  }

  /**
   * Get the current default agent (Executive Assistant)
   */
  public getDefaultAgent() {
    return conversationRouter.getDefaultAgent();
  }

  /**
   * Process a user message and determine routing
   */
  public async processMessage(message: string): Promise<{
    shouldRoute: boolean;
    suggestedAgent?: any;
    reasoning?: string;
    confidence?: number;
    enhancedPrompt?: string;
  }> {
    // Add message to conversation history
    this.conversationContext.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Analyze the query for routing
    const routingDecision = conversationRouter.analyzeQuery(message);

    // Get routing suggestions for context
    const suggestions = conversationRouter.getRoutingSuggestions(message);

    if (routingDecision.shouldRoute) {
      const suggestedAgent = agentRegistry.getDepartmentAgent(routingDecision.agentId);
      
      return {
        shouldRoute: true,
        suggestedAgent,
        reasoning: routingDecision.reasoning,
        confidence: routingDecision.confidence,
        enhancedPrompt: this.buildEnhancedPrompt(message, routingDecision, suggestions)
      };
    }

    // Stay with Executive Assistant but provide enhanced context
    return {
      shouldRoute: false,
      enhancedPrompt: this.buildEnhancedPrompt(message, routingDecision, suggestions)
    };
  }

  /**
   * Switch to a different agent
   */
  public switchAgent(agentId: string): void {
    this.conversationContext.currentAgentId = agentId;
  }

  /**
   * Get conversation context
   */
  public getConversationContext(): ConversationContext {
    return { ...this.conversationContext };
  }

  /**
   * Add assistant response to conversation history
   */
  public addAssistantResponse(content: string, agentId?: string): void {
    this.conversationContext.conversationHistory.push({
      role: 'assistant',
      content,
      agentId: agentId || this.conversationContext.currentAgentId,
      timestamp: new Date()
    });
  }

  /**
   * Build enhanced prompt with context and routing information
   */
  private buildEnhancedPrompt(
    message: string, 
    routingDecision: any, 
    suggestions: Array<{agentId: string, confidence: number, reasoning: string}>
  ): string {
    const basePrompt = conversationRouter.getExecutiveAssistantPrompt();
    
    let context = '';
    
    // Add user context if available
    if (this.conversationContext.userContext) {
      const userCtx = this.conversationContext.userContext;
      context += `\n\nUSER CONTEXT:
- Business Type: ${userCtx.businessType}
- Current Goals: ${userCtx.goals.join(', ')}
- Challenges: ${userCtx.currentChallenges.join(', ')}
- Expertise Areas: ${userCtx.expertise.join(', ')}`;
    }

    // Add routing analysis
    context += `\n\nROUTING ANALYSIS:
- Query: "${message}"
- Current Decision: ${routingDecision.reasoning}
- Confidence: ${Math.round(routingDecision.confidence * 100)}%`;

    // Add available specialists
    if (suggestions.length > 0) {
      context += `\n\nAVAILABLE SPECIALISTS (if needed):
${suggestions.map(s => `- ${agentRegistry.getDepartmentAgent(s.agentId)?.name}: ${s.reasoning} (${Math.round(s.confidence * 100)}% confidence)`).join('\n')}`;
    }

    // Add conversation history context
    if (this.conversationContext.conversationHistory.length > 0) {
      const recentMessages = this.conversationContext.conversationHistory
        .slice(-6) // Last 6 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      
      context += `\n\nRECENT CONVERSATION CONTEXT:
${recentMessages}`;
    }

    return `${basePrompt}${context}

INSTRUCTIONS:
1. First, understand the query in the context of the user's business and goals
2. If this is a general strategy, planning, or cross-departmental question - handle it yourself
3. If it requires specialist expertise, suggest routing with explanation
4. Always provide value and actionable insights
5. Keep responses focused and strategic`;
  }

  /**
   * Get routing suggestions for display to user
   */
  public getRoutingSuggestions(message: string) {
    return conversationRouter.getRoutingSuggestions(message);
  }

  /**
   * Reset conversation context
   */
  public resetConversation(): void {
    this.conversationContext = {
      currentAgentId: 'executive-assistant',
      userContext: this.conversationContext.userContext, // Keep user context
      conversationHistory: []
    };
  }
}

// Export singleton instance
export const defaultAgentService = DefaultAgentService.getInstance();
