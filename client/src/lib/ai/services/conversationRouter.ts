import type { Agent, RoutingDecision, UserContext } from '../types/types';
import { agentRegistry } from '../core/agentRegistry';
import { BaseService } from '@/core/services/BaseService';

export class ConversationRouter extends BaseService {
  private static instance: ConversationRouter;
  private userContext: UserContext | null = null;

  private constructor() {
    super();
  }

  public static getInstance(): ConversationRouter {
    if (!ConversationRouter.instance) {
      ConversationRouter.instance = new ConversationRouter();
    }
    return ConversationRouter.instance;
  }

  /**
   * Set user context to help the Executive Assistant understand the user better
   */
  public setUserContext(context: UserContext): void {
    this.userContext = context;
  }

  /**
   * Get the default agent (Executive Assistant)
   */
  public getDefaultAgent(): Agent {
  return agentRegistry.getAgent('concierge-director')!;
  }

  /**
   * Analyze a user query and determine if it should be routed to a specialist
   */
  public analyzeQuery(query: string): RoutingDecision {
    const analysis = this.performIntentAnalysis(query);
    
    // If confidence is high enough, route to specialist
    if (analysis.confidence >= 0.7) {
      return {
        agentId: analysis.agentId,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        shouldRoute: true,
        context: this.buildContextForAgent(analysis.agentId, query)
      };
    }

    // Otherwise, let Executive Assistant handle it
    return {
      agentId: 'executive-assistant',
      confidence: 1.0,
      reasoning: 'Query is general or strategic - best handled by Executive Assistant',
      shouldRoute: false
    };
  }

  /**
   * Get routing suggestions for the user
   */
  public getRoutingSuggestions(query: string): Array<{agentId: string, confidence: number, reasoning: string}> {
    const suggestions = [];
    
    // Check each department
    const departments = ['sales', 'finance', 'operations', 'marketing'];
    
    for (const dept of departments) {
      const analysis = this.analyzeDepartmentQuery(query, dept);
      if (analysis.confidence > 0.3) {
        const deptAgent = agentRegistry.getDepartmentAgentByDepartment(dept);
        if (deptAgent) {
          suggestions.push({
            agentId: deptAgent.id,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning
          });
        }
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Build context for a specific agent based on user context and query
   */
  private buildContextForAgent(agentId: string, query: string): string {
    const context = [];
    
    if (this.userContext) {
      context.push(`User Business Type: ${this.userContext.businessType}`);
      context.push(`Current Goals: ${this.userContext.goals.join(', ')}`);
      context.push(`Areas of Focus: ${this.userContext.currentChallenges.join(', ')}`);
    }
    
    context.push(`Query: ${query}`);
    
    return context.join('\n');
  }

  /**
   * Perform intent analysis to determine the best agent
   */
  private performIntentAnalysis(query: string): {agentId: string, confidence: number, reasoning: string} {
    const lowerQuery = query.toLowerCase();
    
    // Sales indicators
    const salesKeywords = ['sales', 'pipeline', 'deals', 'revenue', 'quota', 'leads', 'prospects', 'closing'];
    const salesScore = this.calculateKeywordScore(lowerQuery, salesKeywords);
    
    // Finance indicators
    const financeKeywords = ['budget', 'financial', 'cost', 'revenue', 'profit', 'expenses', 'cash flow', 'roi'];
    const financeScore = this.calculateKeywordScore(lowerQuery, financeKeywords);
    
    // Operations indicators
    const operationsKeywords = ['process', 'workflow', 'efficiency', 'automation', 'operations', 'productivity'];
    const operationsScore = this.calculateKeywordScore(lowerQuery, operationsKeywords);
    
    // Marketing indicators
    const marketingKeywords = ['marketing', 'campaign', 'brand', 'advertising', 'growth', 'acquisition', 'conversion'];
    const marketingScore = this.calculateKeywordScore(lowerQuery, marketingKeywords);

    // Find the highest scoring department
    const scores = [
      { agentId: 'sales-dept', score: salesScore, name: 'Sales' },
      { agentId: 'finance-dept', score: financeScore, name: 'Finance' },
      { agentId: 'operations-dept', score: operationsScore, name: 'Operations' },
      { agentId: 'marketing-dept', score: marketingScore, name: 'Marketing' }
    ];

    const bestMatch = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return {
      agentId: bestMatch.agentId,
      confidence: bestMatch.score,
      reasoning: `Query contains ${bestMatch.name.toLowerCase()} indicators with ${Math.round(bestMatch.score * 100)}% confidence`
    };
  }

  /**
   * Analyze query for a specific department
   */
  private analyzeDepartmentQuery(query: string, department: string): {confidence: number, reasoning: string} {
    const lowerQuery = query.toLowerCase();
    
    const departmentKeywords = {
      sales: ['sales', 'pipeline', 'deals', 'revenue', 'quota', 'leads', 'prospects', 'closing'],
      finance: ['budget', 'financial', 'cost', 'revenue', 'profit', 'expenses', 'cash flow', 'roi'],
      operations: ['process', 'workflow', 'efficiency', 'automation', 'operations', 'productivity'],
      marketing: ['marketing', 'campaign', 'brand', 'advertising', 'growth', 'acquisition', 'conversion']
    };

    const keywords = departmentKeywords[department as keyof typeof departmentKeywords] || [];
    const score = this.calculateKeywordScore(lowerQuery, keywords);
    
    return {
      confidence: score,
      reasoning: `Contains ${department} keywords: ${keywords.filter(k => lowerQuery.includes(k)).join(', ')}`
    };
  }

  /**
   * Calculate confidence score based on keyword matches
   */
  private calculateKeywordScore(query: string, keywords: string[]): number {
    const matches = keywords.filter(keyword => query.includes(keyword));
    const matchRatio = matches.length / keywords.length;
    
    // Boost score for multiple matches
    const multipleMatchBonus = matches.length > 1 ? 0.2 : 0;
    
    return Math.min(1.0, matchRatio + multipleMatchBonus);
  }

  /**
   * Get the Executive Assistant's enhanced system prompt with routing capabilities
   */
  public getExecutiveAssistantPrompt(): string {
    const basePrompt = agentRegistry.getAgent('executive-assistant')?.systemPrompt || '';
    
    return `${basePrompt}

ROUTING CAPABILITIES:
You have the ability to route complex queries to specialized agents when needed. Here's how to handle routing:

1. **Assess the Query**: Determine if the query requires specialized expertise
2. **Suggest Routing**: If you identify a need for specialist help, say:
   "I think this would be better handled by our [Specialist Name]. Would you like me to connect you with them?"
3. **Provide Context**: When routing, explain why the specialist would be helpful
4. **Stay Available**: You remain available for follow-up and coordination

SPECIALIST AGENTS AVAILABLE:
- VP of Sales: Sales strategy, pipeline management, revenue optimization
- CFO: Financial planning, budget analysis, cost optimization  
- COO: Process optimization, workflow automation, operational efficiency
- CMO: Marketing strategy, campaign optimization, growth initiatives

Remember: Your primary role is to understand the user's needs and provide strategic guidance. Only suggest routing when it would genuinely add value.`;
  }
}

// Export singleton instance
export const conversationRouter = ConversationRouter.getInstance();
