import { callEdgeFunction } from '@/lib/api-client';
import { contextualRAG, type ConversationTurn, type AgentContext } from './contextualRAG';
import { logger } from '@/shared/utils/logger';
import { chatContextApi } from '@/lib/api/chatContextApi';
import type { Company } from '@/services/core/CompanyService';
import type { UserContextData, BuildingBlockStatus } from '@/lib/api/chatContextApi';

export interface ChatAgent {
  id: string;
  name: string;
  type: 'executive' | 'departmental' | 'specialist';
  department?: string;
  systemPrompt: string;
  personality: {
    communicationStyle: string;
    expertise_level: string;
    tone: string;
    background: string;
  };
}

export interface BuildingBlock {
  id: string;
  name: string;
  status: 'complete' | 'in_progress' | 'not_started';
  data?: Record<string, any>;
  lastUpdated?: string;
}

export interface ChatContext {
  userId: string;
  companyId?: string;
  company?: Company;
  sessionId: string;
  currentTopic?: string;
  recentInteractions?: string[];
  userPreferences?: Record<string, any>;
  buildingBlocks?: BuildingBlockStatus[];
  userContextData?: UserContextData;
  conversationHistory?: ConversationTurn[];
  agentContext?: AgentContext;
}

export interface EnhancedChatRequest {
  message: string;
  conversationId: string;
  agent: ChatAgent;
  context: ChatContext;
  metadata?: {
    agent_id: string;
    agent_type: string;
    department?: string;
    session_id: string;
    conversation_stage: 'initial' | 'ongoing' | 'handoff' | 'resolution';
    interaction_type: 'question' | 'command' | 'clarification' | 'feedback';
    topic_tags?: string[];
    escalation_level?: 'low' | 'medium' | 'high';
  };
}

export interface EnhancedChatResponse {
  response: string;
  agent: ChatAgent;
  context: ChatContext;
  metadata: {
    processingTime: number;
    contextUsed: boolean;
    companyDataUsed: boolean;
    buildingBlocksUsed: boolean;
    ragResults?: number;
    contextSummary?: string;
  };
}

class EnhancedChatService {
  private async buildCompanyContext(company: Company): Promise<string> {
    if (!company) return '';

    const contextParts = [];

    // Basic company information
    contextParts.push(`COMPANY: ${company.name}`);
    if (company.description) {
      contextParts.push(`DESCRIPTION: ${company.description}`);
    }
    if (company.industry) {
      contextParts.push(`INDUSTRY: ${company.industry}`);
    }
    if (company.size) {
      contextParts.push(`SIZE: ${company.size}`);
    }

    // Company analytics if available
    if (company.analytics) {
      contextParts.push('ANALYTICS:');
      if (company.analytics.revenue) {
        contextParts.push(`- Revenue: ${company.analytics.revenue}`);
      }
      if (company.analytics.employees) {
        contextParts.push(`- Employees: ${company.analytics.employees}`);
      }
      if (company.analytics.customers) {
        contextParts.push(`- Customers: ${company.analytics.customers}`);
      }
    }

    // Company health if available
    if (company.health) {
      contextParts.push('HEALTH METRICS:');
      if (company.health.score !== undefined) {
        contextParts.push(`- Health Score: ${company.health.score}/100`);
      }
      if (company.health.status) {
        contextParts.push(`- Status: ${company.health.status}`);
      }
      if (company.health.insights && company.health.insights.length > 0) {
        contextParts.push('INSIGHTS:');
        company.health.insights.forEach(insight => {
          contextParts.push(`- ${insight}`);
        });
      }
    }

    return contextParts.join('\n');
  }

  private async buildBuildingBlocksContext(buildingBlocks: BuildingBlockStatus[]): Promise<string> {
    if (!buildingBlocks || buildingBlocks.length === 0) return '';

    const contextParts = ['BUILDING BLOCKS STATUS:'];

    buildingBlocks.forEach(block => {
      const statusEmoji = {
        complete: '✅',
        in_progress: '🔄',
        not_started: '⏳'
      }[block.status] || '❓';

      contextParts.push(`${statusEmoji} ${block.name}: ${block.status.replace('_', ' ')}`);
      
      // Add progress if available
      if (block.progress !== undefined) {
        contextParts.push(`  - Progress: ${block.progress}%`);
      }
      
      // Add specific data for each building block if available
      if (block.data && Object.keys(block.data).length > 0) {
        Object.entries(block.data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            contextParts.push(`  - ${key}: ${value}`);
          }
        });
      }
    });

    return contextParts.join('\n');
  }

  private async buildAgentContext(agent: ChatAgent): Promise<AgentContext> {
    return {
      agentId: agent.id,
      agentType: agent.type,
      department: agent.department,
      currentGoals: [
        'Provide accurate and helpful business advice',
        'Maintain context awareness throughout conversations',
        'Adapt responses to user expertise level'
      ],
      expertise: [
        agent.personality.expertise_level,
        agent.department || 'general business',
        agent.personality.background
      ],
      personality: agent.personality
    };
  }

  private async buildEnhancedSystemPrompt(
    agent: ChatAgent,
    context: ChatContext,
    companyContext?: string,
    buildingBlocksContext?: string,
    ragContext?: string
  ): Promise<string> {
    const basePrompt = agent.systemPrompt;
    
    const contextParts = [];

    // Add company context if available
    if (companyContext) {
      contextParts.push(`\n\nCOMPANY CONTEXT:\n${companyContext}`);
    }

    // Add building blocks context if available
    if (buildingBlocksContext) {
      contextParts.push(`\n\n${buildingBlocksContext}`);
    }

    // Add RAG context if available
    if (ragContext) {
      contextParts.push(`\n\nRELEVANT CONTEXT:\n${ragContext}`);
    }

    // Add user context
    if (context.userPreferences) {
      const preferences = Object.entries(context.userPreferences)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      if (preferences) {
        contextParts.push(`\nUSER PREFERENCES: ${preferences}`);
      }
    }

    // Add recent interactions context
    if (context.recentInteractions && context.recentInteractions.length > 0) {
      contextParts.push(`\nRECENT INTERACTIONS: ${context.recentInteractions.slice(-3).join(', ')}`);
    }

    // Add current topic context
    if (context.currentTopic) {
      contextParts.push(`\nCURRENT TOPIC: ${context.currentTopic}`);
    }

    // Add conversation history context
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      const recentTurns = context.conversationHistory.slice(-6); // Last 6 turns
      const conversationContext = recentTurns
        .map(turn => `${turn.role}: ${turn.content}`)
        .join('\n');
      contextParts.push(`\nRECENT CONVERSATION:\n${conversationContext}`);
    }

    const enhancedPrompt = `${basePrompt}${contextParts.join('')}`;
    
    logger.info('Built enhanced system prompt', {
      agentId: agent.id,
      hasCompanyContext: !!companyContext,
      hasBuildingBlocksContext: !!buildingBlocksContext,
      hasRAGContext: !!ragContext,
      hasConversationHistory: !!context.conversationHistory?.length,
      promptLength: enhancedPrompt.length
    });

    return enhancedPrompt;
  }

  private async getRAGContext(query: string, context: ChatContext): Promise<{ context: string; summary?: string }> {
    try {
      const ragQuery = {
        query,
        context: {
          userId: context.userId,
          companyId: context.companyId,
          sessionId: context.sessionId,
          currentTopic: context.currentTopic,
          recentInteractions: context.recentInteractions,
          userPreferences: context.userPreferences,
          conversationHistory: context.conversationHistory,
          agentContext: context.agentContext
        },
        maxResults: 5,
        threshold: 0.6,
        includeConversationHistory: true,
        includeBusinessData: true
      };

      const result = await contextualRAG.searchRelevantDocuments(ragQuery);
      
      if (result.documents.length === 0) {
        return { context: '', summary: '' };
      }

      const contextText = result.documents
        .map(doc => `[${doc.metadata.source}]: ${doc.content}`)
        .join('\n\n');

      logger.info('Retrieved RAG context', {
        documentCount: result.documents.length,
        processingTime: result.processingTime,
        hasContextSummary: !!result.contextSummary
      });

      return { 
        context: `\n\nRELEVANT CONTEXT:\n${contextText}`,
        summary: result.contextSummary
      };
    } catch (error) {
      logger.error('Error getting RAG context:', error);
      return { context: '', summary: '' };
    }
  }

  private async addUserMessageToHistory(context: ChatContext, message: string): Promise<void> {
    const userTurn: ConversationTurn = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      metadata: {
        topic: context.currentTopic,
        intent: 'question'
      }
    };

    await contextualRAG.addConversationTurn(context.userId, userTurn, {
      userId: context.userId,
      companyId: context.companyId,
      sessionId: context.sessionId,
      conversationHistory: context.conversationHistory
    });

    // Update local context
    context.conversationHistory = context.conversationHistory || [];
    context.conversationHistory.push(userTurn);
  }

  private async addAssistantMessageToHistory(context: ChatContext, response: string): Promise<void> {
    const assistantTurn: ConversationTurn = {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      metadata: {
        topic: context.currentTopic,
        intent: 'response'
      }
    };

    await contextualRAG.addConversationTurn(context.userId, assistantTurn, {
      userId: context.userId,
      companyId: context.companyId,
      sessionId: context.sessionId,
      conversationHistory: context.conversationHistory
    });

    // Update local context
    context.conversationHistory = context.conversationHistory || [];
    context.conversationHistory.push(assistantTurn);
  }

  async sendMessageWithContext(request: EnhancedChatRequest): Promise<EnhancedChatResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Processing enhanced chat request', {
        agentId: request.agent.id,
        agentType: request.agent.type,
        hasCompany: !!request.context.company,
        hasBuildingBlocks: !!request.context.buildingBlocks,
        hasConversationHistory: !!request.context.conversationHistory?.length,
        messageLength: request.message.length
      });

      // Fetch comprehensive user context from API
      let userContextData: UserContextData | undefined;
      if (!request.context.userContextData) {
        const contextResult = await chatContextApi.getUserContext(request.context.userId);
        if (contextResult.success && contextResult.data) {
          userContextData = contextResult.data;
          request.context.userContextData = userContextData;
          request.context.company = userContextData.company;
          request.context.buildingBlocks = userContextData.buildingBlocks;
        }
      } else {
        userContextData = request.context.userContextData;
      }

      // Build agent context
      const agentContext = await this.buildAgentContext(request.agent);
      request.context.agentContext = agentContext;

      // Add user message to conversation history
      await this.addUserMessageToHistory(request.context, request.message);

      // Build company context
      const companyContext = request.context.company 
        ? await this.buildCompanyContext(request.context.company)
        : '';

      // Build building blocks context
      const buildingBlocksContext = request.context.buildingBlocks
        ? await this.buildBuildingBlocksContext(request.context.buildingBlocks)
        : '';

      // Get RAG context with conversation awareness
      const { context: ragContext, summary: contextSummary } = await this.getRAGContext(request.message, request.context);

      // Build enhanced system prompt with all context
      const systemPrompt = await this.buildEnhancedSystemPrompt(
        request.agent,
        request.context,
        companyContext,
        buildingBlocksContext,
        ragContext
      );

      // Call the enhanced chat function
      const response = await callEdgeFunction('chat', {
        message: request.message,
        conversationId: request.conversationId,
        systemPrompt,
        contextualPrompt: contextSummary || '',
        metadata: {
          agent_id: request.agent.id,
          agent_type: request.agent.type,
          department: request.agent.department,
          session_id: request.context.sessionId,
          conversation_stage: 'ongoing',
          interaction_type: 'question',
          escalation_level: 'low',
          ...request.metadata
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to get chat response');
      }

      const assistantResponse = response.data.response || response.data;

      // Add assistant response to conversation history
      await this.addAssistantMessageToHistory(request.context, assistantResponse);

      const processingTime = Date.now() - startTime;

      logger.info('Enhanced chat response generated', {
        agentId: request.agent.id,
        processingTime,
        hasCompanyContext: !!companyContext,
        hasBuildingBlocksContext: !!buildingBlocksContext,
        hasRAGContext: !!ragContext,
        hasUserContext: !!userContextData,
        conversationTurns: request.context.conversationHistory?.length
      });

      return {
        response: assistantResponse,
        agent: request.agent,
        context: request.context,
        metadata: {
          processingTime,
          contextUsed: true,
          companyDataUsed: !!companyContext,
          buildingBlocksUsed: !!buildingBlocksContext,
          ragResults: ragContext ? 1 : 0,
          contextSummary
        }
      };

    } catch (error) {
      logger.error('Error in enhanced chat service:', error);
      throw error;
    }
  }

  async updateContext(userId: string, context: Partial<ChatContext>): Promise<void> {
    try {
      await contextualRAG.updateUserContext(userId, context);
      logger.info('Updated chat context', { userId, contextKeys: Object.keys(context) });
    } catch (error) {
      logger.error('Error updating chat context:', error);
    }
  }

  async getConversationHistory(userId: string, sessionId?: string): Promise<ConversationTurn[]> {
    try {
      // This would typically fetch from database
      // For now, return empty array - implement based on your database schema
      return [];
    } catch (error) {
      logger.error('Error getting conversation history:', error);
      return [];
    }
  }

  async clearConversationHistory(userId: string, sessionId?: string): Promise<void> {
    try {
      // This would typically clear from database
      // For now, just log - implement based on your database schema
      logger.info('Cleared conversation history', { userId, sessionId });
    } catch (error) {
      logger.error('Error clearing conversation history:', error);
    }
  }
}

export const enhancedChatService = new EnhancedChatService();
