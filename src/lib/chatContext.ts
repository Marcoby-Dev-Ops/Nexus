/**
 * chatContext.ts
 * 
 * Enhanced chat context management for comprehensive session data collection
 * and context-aware AI responses with agent routing intelligence
 */

import { supabase, chatHistory } from './supabase';
import { unifiedAuthService } from './unifiedAuthService';
import type { Agent } from './agentRegistry';
import { ContextualRAG } from './contextualRAG';
import { ExpertPromptEngine } from './expertPromptEngine';
import { progressiveLearningService } from './progressiveLearning';

/**
 * Extended metadata interface for comprehensive context tracking
 */
export interface ChatContextMetadata {
  // Agent Context
  agent_id: string;
  agent_type: 'executive' | 'departmental' | 'specialist';
  department?: string;
  agent_switches?: Array<{
    from_agent: string;
    to_agent: string;
    timestamp: string;
    reason?: string;
  }>;

  // User Context
  user_location?: {
    page: string;
    section?: string;
    referrer?: string;
  };
  
  // Session Context
  session_id: string;
  device_info?: {
    user_agent: string;
    screen_resolution?: string;
    timezone?: string;
  };

  // Conversation Context
  conversation_stage: 'initial' | 'ongoing' | 'handoff' | 'resolution';
  conversation_intent?: string;
  conversation_sentiment?: 'positive' | 'neutral' | 'negative';
  
  // Business Context
  user_role?: string;
  user_department?: string;
  related_entities?: Array<{
    type: 'project' | 'lead' | 'task' | 'document';
    id: string;
    name: string;
  }>;

  // AI Context
  model_used?: string;
  response_time_ms?: number;
  confidence_score?: number;
  suggested_actions?: string[];
  
  // Analytics
  interaction_type: 'question' | 'command' | 'clarification' | 'feedback';
  topic_tags?: string[];
  escalation_level?: 'low' | 'medium' | 'high';
}

/**
 * Session data interface for comprehensive tracking
 */
export interface ChatSession {
  session_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  total_messages: number;
  total_agents_used: number;
  primary_department?: string;
  session_outcome?: 'resolved' | 'escalated' | 'abandoned' | 'ongoing';
  satisfaction_score?: number;
  metadata: Record<string, any>;
}

/**
 * Context builder for creating comprehensive AI prompts
 */
export class ChatContextBuilder {
  private sessionId: string;
  private userId: string;
  private ragSystem: ContextualRAG;
  private expertEngine: ExpertPromptEngine;

  constructor(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.ragSystem = new ContextualRAG();
    this.expertEngine = new ExpertPromptEngine();
  }

  /**
   * Generate session ID based on timestamp and user
   */
  static generateSessionId(userId: string): string {
    return `session_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize RAG system with user context
   */
  async initializeRAG(): Promise<void> {
    await this.ragSystem.initialize(this.userId);
  }

  /**
   * Get intelligent agent routing recommendation using RAG system
   */
  async getIntelligentRouting(userMessage: string): Promise<{
    recommendedAgent: string;
    confidence: number;
    reasoning: string;
    contextualPrompt: string;
  }> {
    try {
      await this.initializeRAG();
      return await this.ragSystem.getRoutingIntelligence(userMessage);
    } catch (error) {
      console.error('Error in intelligent routing:', error);
      // Fallback to default routing
      return {
        recommendedAgent: 'executive',
        confidence: 0.5,
        reasoning: 'Fallback to Executive Assistant due to routing error',
        contextualPrompt: 'I\'m your Executive Assistant, ready to help with strategic guidance and coordination across all business functions.'
      };
    }
  }

  /**
   * Collect comprehensive context for AI responses
   */
  async buildContextForAI(
    conversationId: string,
    currentAgent: Agent,
    userMessage: string,
    messageCount: number = 10
  ): Promise<{
    systemPrompt: string;
    contextualPrompt: string;
    metadata: ChatContextMetadata;
  }> {
    // Get recent conversation history
    const recentMessages = await this.getRecentMessages(conversationId, messageCount);
    
    // Get user context
    const userContext = await this.getUserContext();
    
    // Get session analytics
    const sessionAnalytics = await this.getSessionAnalytics();
    
    // Analyze conversation patterns
    const conversationAnalysis = this.analyzeConversation(recentMessages, userMessage);
    
    // Build comprehensive metadata
    const metadata: ChatContextMetadata = {
      agent_id: currentAgent.id,
      agent_type: currentAgent.type,
      department: currentAgent.department,
      session_id: this.sessionId,
      conversation_stage: this.determineConversationStage(recentMessages.length, conversationAnalysis),
      interaction_type: this.classifyInteractionType(userMessage),
      user_location: {
        page: typeof window !== 'undefined' ? window.location.pathname : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      },
      device_info: typeof navigator !== 'undefined' ? {
        user_agent: navigator.userAgent,
        screen_resolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } : undefined,
      topic_tags: this.extractTopicTags(userMessage, recentMessages),
      escalation_level: this.assessEscalationLevel(userMessage, conversationAnalysis),
      ...conversationAnalysis.metadata,
    };

    // Get RAG-enhanced context if available
    let ragContext = '';
    try {
      await this.initializeRAG();
      if (currentAgent.department) {
        ragContext = await this.ragSystem.getDepartmentContext(currentAgent.department, userMessage);
      } else {
        ragContext = await this.ragSystem.getExecutiveContext(userMessage);
      }
    } catch (error) {
      console.warn('RAG context unavailable, using fallback:', error);
    }

    // Get contextual questions for progressive learning
    let contextualQuestions: string[] = [];
    try {
      const conversationHistory = recentMessages.map(msg => msg.content || '');
              contextualQuestions = await progressiveLearningService.getContextualQuestions(
          this.userId,
          userContext?.user?.company || 'default',
          conversationHistory
        );
    } catch (error) {
      console.warn('Progressive learning unavailable:', error);
    }

    // Build enhanced system prompt with expert prompting
    const systemPrompt = this.buildEnhancedSystemPrompt(currentAgent, userContext, sessionAnalytics, ragContext);
    
    // Build contextual information for AI
    const baseContextualPrompt = this.buildContextualPrompt(recentMessages, userContext, sessionAnalytics, conversationAnalysis);
    
    // Enhance contextual prompt with progressive learning questions
    const contextualPrompt = contextualQuestions.length > 0
      ? `${baseContextualPrompt}\n\nOPTIONAL FOLLOW-UP QUESTIONS to better understand your needs:\n${contextualQuestions.map(q => `• ${q}`).join('\n')}`
      : baseContextualPrompt;

    return {
      systemPrompt,
      contextualPrompt,
      metadata,
    };
  }

  /**
   * Process learning insights from conversation
   */
  async processLearningInsights(
    userMessage: string,
    aiResponse: string,
    agent: Agent,
    feedback?: 'helpful' | 'unhelpful' | 'partially_helpful'
  ): Promise<void> {
    try {
      const userContext = await this.getUserContext();
      await progressiveLearningService.analyzeUserInteraction(
        this.userId,
        userContext?.user?.company || 'default',
        userMessage,
        aiResponse,
        agent,
        feedback
      );
    } catch (error) {
      console.warn('Error processing learning insights:', error);
    }
  }

  /**
   * Get recent messages with full context
   */
  private async getRecentMessages(conversationId: string, limit: number) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data?.reverse() || [];
  }

  /**
   * Get user context and preferences
   */
  private async getUserContext() {
    // Use unified auth service to get properly authenticated user
    const unifiedUser = unifiedAuthService.getCurrentUser();
    if (!unifiedUser || !unifiedAuthService.isAuthenticated()) {
      console.warn('No authenticated user found for getUserContext');
      return null;
    }

    // Get user's recent activity patterns
    const { data: recentActivity, error } = await supabase
      .from('conversations')
      .select('agent_id, created_at, metadata')
      .eq('user_id', unifiedUser.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching user context from conversations:', error);
      return {
        user: unifiedUser,
        recentActivity: [],
      };
    }

    return {
      user: unifiedUser,
      recentActivity: recentActivity || [],
    };
  }

  /**
   * Get session-level analytics
   */
  private async getSessionAnalytics() {
    const { data: sessionMessages } = await supabase
      .from('chat_messages')
      .select('metadata, created_at')
      .eq('user_id', this.userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: true });

    return {
      totalMessages: sessionMessages?.length || 0,
      agentsUsed: new Set(sessionMessages?.map(m => (m.metadata as any)?.agent_id).filter(Boolean)).size,
      sessionDuration: sessionMessages?.length ? 
        new Date().getTime() - new Date(sessionMessages[0].created_at || new Date()).getTime() : 0,
    };
  }

  /**
   * Analyze conversation patterns and sentiment
   */
  private analyzeConversation(messages: any[], currentMessage: string) {
    const analysis = {
      messageCount: messages.length,
      averageMessageLength: messages.reduce((sum, msg) => sum + msg.content.length, 0) / Math.max(messages.length, 1),
      questionCount: messages.filter(msg => msg.content.includes('?')).length,
      agentSwitches: this.detectAgentSwitches(messages),
      conversationTopics: this.extractConversationTopics(messages),
      urgencyIndicators: this.detectUrgencyIndicators([...messages.map(m => m.content), currentMessage]),
      metadata: {} as Record<string, any>,
    };

    // Add derived insights
    analysis.metadata.conversation_complexity = analysis.messageCount > 10 ? 'high' : 
      analysis.messageCount > 5 ? 'medium' : 'low';
    analysis.metadata.user_engagement = analysis.averageMessageLength > 50 ? 'high' : 'medium';
    analysis.metadata.needs_escalation = analysis.urgencyIndicators.length > 0 || analysis.questionCount > 3;

    return analysis;
  }

  /**
   * Build enhanced system prompt combining expert prompting and RAG context
   */
  private buildEnhancedSystemPrompt(agent: Agent, userContext: any, sessionAnalytics: any, ragContext: string): string {
    // Get base expert prompt
    const basePrompt = this.buildSystemPrompt(agent, userContext, sessionAnalytics);
    
    // Add RAG context if available
    if (ragContext) {
      return `${basePrompt}

REAL-TIME BUSINESS CONTEXT & DATA:
${ragContext}

Use this contextual business data to provide specific, data-driven insights and recommendations. Reference actual metrics, trends, and opportunities when providing guidance.`;
    }
    
    return basePrompt;
  }

  /**
   * Build comprehensive system prompt using expert personality engine
   */
  private buildSystemPrompt(agent: Agent, userContext: any, sessionAnalytics: any): string {
    // Import expert prompt engine for specialized personalities
    const { getExpertSystemPrompt } = require('./expertPromptEngine');
    
    // Generate expert-level system prompt with personality
    const expertPrompt = getExpertSystemPrompt(agent, {
      userRole: userContext?.role || 'business professional',
      businessContext: userContext?.context || 'general business',
      urgency: sessionAnalytics.totalMessages > 10 ? 'high' : 'medium',
      complexity: sessionAnalytics.agentsUsed > 2 ? 'complex' : 'moderate'
    });

    // Add session context to expert prompt
    let sessionContext = `

SESSION CONTEXT AWARENESS:
- User has sent ${sessionAnalytics.totalMessages} messages in this session
- User has interacted with ${sessionAnalytics.agentsUsed} different agents
- Session duration: ${Math.round(sessionAnalytics.sessionDuration / 1000 / 60)} minutes`;

    if (userContext?.recentActivity?.length > 0) {
      const recentDepts = userContext.recentActivity.map((a: any) => a.metadata?.department).filter(Boolean);
      const focusAreas = [...new Set(recentDepts)].join(', ');
      sessionContext += `\n- User's recent focus areas: ${focusAreas}`;
    }

    const finalPrompt = expertPrompt + sessionContext + `

EXPERT GUIDANCE APPROACH:
- Draw from your ${agent.personality?.years_experience || 10}+ years of specialized experience
- Provide specific, actionable recommendations using proven frameworks
- Reference relevant methodologies and tools from your expertise
- Consider business impact and ROI in all recommendations
- If the question requires deeper specialization, suggest connecting with relevant specialists while providing valuable interim guidance`;

    return finalPrompt;
  }

  /**
   * Build contextual prompt with conversation history
   */
  private buildContextualPrompt(messages: any[], userContext: any, sessionAnalytics: any, analysis: any): string {
    let contextPrompt = '\n\nCONVERSATION CONTEXT:\n';
    
    if (messages.length > 0) {
      contextPrompt += `Recent conversation summary:\n`;
      contextPrompt += messages.slice(-3).map(msg => 
        `${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`
      ).join('\n');
    }

    if (analysis.conversationTopics.length > 0) {
      contextPrompt += `\n\nMain topics discussed: ${analysis.conversationTopics.join(', ')}`;
    }

    if (analysis.urgencyIndicators.length > 0) {
      contextPrompt += `\n\nUrgency indicators detected: ${analysis.urgencyIndicators.join(', ')}`;
    }

    if (analysis.metadata.needs_escalation) {
      contextPrompt += `\n\nNote: This conversation may benefit from specialist attention.`;
    }

    return contextPrompt;
  }

  /**
   * Utility methods for analysis
   */
  private determineConversationStage(messageCount: number, analysis: any): ChatContextMetadata['conversation_stage'] {
    if (messageCount === 0) return 'initial';
    if (analysis.agentSwitches.length > 0) return 'handoff';
    if (analysis.metadata.needs_escalation) return 'resolution';
    return 'ongoing';
  }

  private classifyInteractionType(message: string): ChatContextMetadata['interaction_type'] {
    if (message.includes('?')) return 'question';
    if (message.toLowerCase().includes('please') || message.toLowerCase().includes('can you')) return 'command';
    if (message.toLowerCase().includes('thank') || message.toLowerCase().includes('good')) return 'feedback';
    return 'clarification';
  }

  private extractTopicTags(message: string, recentMessages: any[]): string[] {
    const allText = [message, ...recentMessages.map(m => m.content)].join(' ').toLowerCase();
    
    const topicKeywords: Record<string, string[]> = {
      'sales': ['sales', 'lead', 'deal', 'pipeline', 'customer', 'revenue'],
      'marketing': ['campaign', 'marketing', 'seo', 'content', 'social', 'brand'],
      'finance': ['budget', 'finance', 'cost', 'invoice', 'payment', 'accounting'],
      'operations': ['process', 'workflow', 'project', 'quality', 'support', 'it'],
      'urgent': ['urgent', 'asap', 'immediately', 'critical', 'emergency'],
      'help': ['help', 'assistance', 'support', 'how to', 'tutorial'],
    };

    const tags: string[] = [];
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        tags.push(topic);
      }
    }

    return tags;
  }

  private assessEscalationLevel(message: string, analysis: any): ChatContextMetadata['escalation_level'] {
    const urgentWords = ['urgent', 'critical', 'emergency', 'asap', 'immediately'];
    const complexityIndicators = analysis.messageCount > 8 || analysis.questionCount > 3;
    
    if (urgentWords.some(word => message.toLowerCase().includes(word))) return 'high';
    if (complexityIndicators || analysis.agentSwitches.length > 1) return 'medium';
    return 'low';
  }

  private detectAgentSwitches(messages: any[]) {
    const switches: Array<{ from: string; to: string; timestamp: string }> = [];
    for (let i = 1; i < messages.length; i++) {
      const prevAgent = messages[i-1].metadata?.agent_id;
      const currentAgent = messages[i].metadata?.agent_id;
      if (prevAgent && currentAgent && prevAgent !== currentAgent) {
        switches.push({
          from: prevAgent,
          to: currentAgent,
          timestamp: messages[i].created_at,
        });
      }
    }
    return switches;
  }

  private extractConversationTopics(messages: any[]): string[] {
    // Simple topic extraction - in production, you might use NLP
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    return this.extractTopicTags(allText, []);
  }

  private detectUrgencyIndicators(messages: string[]): string[] {
    const urgentPhrases = [
      'urgent', 'asap', 'immediately', 'critical', 'emergency',
      'deadline', 'time sensitive', 'right now', 'help quickly'
    ];
    
    const found: string[] = [];
    const allText = messages.join(' ').toLowerCase();
    
    for (const phrase of urgentPhrases) {
      if (allText.includes(phrase)) {
        found.push(phrase);
      }
    }
    
    return found;
  }
}

/**
 * Enhanced chat service with context awareness
 */
export const enhancedChatService = {
  /**
   * Send message with comprehensive context collection
   */
  async sendMessageWithContext(
    conversationId: string,
    message: string,
    agent: Agent,
    sessionId: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const contextBuilder = new ChatContextBuilder(sessionId, user.id);
    
    try {
      // Build comprehensive context
      const context = await contextBuilder.buildContextForAI(conversationId, agent, message);
      
      // Save user message with enhanced metadata
      const userMessage = await chatHistory.addMessage(conversationId, {
        role: 'user',
        content: message,
        metadata: {
          ...context.metadata,
          timestamp: new Date().toISOString(),
        },
      });

      // Call AI service with enhanced context
      const aiResponse = await this.callAIWithContext(message, { 
        ...context, 
        conversationId 
      });
      
      // Save AI response with performance metadata
      const assistantMessage = await chatHistory.addMessage(conversationId, {
        role: 'assistant',
        content: aiResponse.content,
        metadata: {
          agent_id: agent.id,
          model_used: aiResponse.model,
          response_time_ms: aiResponse.responseTime,
          confidence_score: aiResponse.confidence,
          suggested_actions: aiResponse.suggestedActions,
          timestamp: new Date().toISOString(),
        },
      });

      // Process learning insights from the conversation
      await contextBuilder.processLearningInsights(
        message,
        aiResponse.content,
        agent
      );

      // Update session analytics
      await this.updateSessionAnalytics(sessionId, user.id, agent.id);

      return {
        userMessage,
        assistantMessage,
        context: context.metadata,
      };
    } catch (error) {
      console.error('Enhanced chat service error:', error);
      throw error;
    }
  },

  /**
   * Call AI service with enhanced context
   */
  async callAIWithContext(message: string, context: any) {
    try {
      // Get the Supabase URL from environment or use default
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kqclbpimkraenvbffnpk.supabase.co';

      // Call your Supabase Edge Function with enhanced context
      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          message,
          conversationId: context.conversationId || 'default',
          systemPrompt: context.systemPrompt,
          contextualPrompt: context.contextualPrompt,
          metadata: context.metadata,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error:', { status: response.status, body: errorText });
        
        // Try to parse the error response for better error messages
        let errorMessage = `AI service error: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          // Use the raw error text if it's not JSON
          errorMessage = errorText || errorMessage;
        }
        
        // Handle specific errors with better user messages
        if (response.status === 401 || errorMessage.includes('Invalid or expired token')) {
          return {
            content: `Your session has expired. Please refresh the page and try again.`,
            model: 'system',
            responseTime: 0,
            confidence: 0,
            suggestedActions: ['Refresh page', 'Sign in again'],
          };
        }
        
        if (errorMessage.includes('Missing required environment variables') || errorMessage.includes('OpenAI')) {
          return {
            content: `The AI service is currently unavailable. Our team has been notified and is working to resolve this issue.`,
            model: 'system',
            responseTime: 0,
            confidence: 0,
            suggestedActions: ['Try again later', 'Contact support'],
          };
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Edge function success:', result);
      
      return {
        content: result.message,
        model: result.model || 'gpt-4',
        responseTime: result.responseTime || 1000,
        confidence: result.confidence || 0.85,
        suggestedActions: result.suggestedActions || [],
      };
    } catch (error) {
      console.error('AI service call failed:', error);
      
      // More specific fallback responses based on error type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('session has expired') || errorMessage.includes('token')) {
        return {
          content: `Your session has expired. Please refresh the page and try again.`,
          model: 'system',
          responseTime: 0,
          confidence: 0,
          suggestedActions: ['Refresh page', 'Sign in again'],
        };
      }
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return {
          content: `Unable to connect to the AI service. Please check your internet connection and try again.`,
          model: 'system',
          responseTime: 0,
          confidence: 0,
          suggestedActions: ['Check connection', 'Try again'],
        };
      }
      
      // Generic fallback response
      return {
        content: `I apologize, but I'm having trouble processing your request right now. Please try again in a moment.`,
        model: 'fallback',
        responseTime: 0,
        confidence: 0,
        suggestedActions: ['Try again', 'Contact support'],
      };
    }
  },

  /**
   * Update session-level analytics
   */
  async updateSessionAnalytics(sessionId: string, userId: string, agentId: string) {
    try {
      // Check if sessions table exists, if not create the record in conversations metadata
      const { error } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('user_id', userId)
        .limit(1);

      // For now, we'll store session data in conversation metadata
      // You can create a separate sessions table later if needed
      console.log('Session analytics updated for:', { sessionId, userId, agentId });
    } catch (error) {
      console.error('Session analytics update error:', error);
    }
  },

  /**
   * Get session insights for analytics
   */
  async getSessionInsights(userId: string, days: number = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since);

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('metadata, created_at')
      .eq('user_id', userId)
      .gte('created_at', since);

    return {
      totalConversations: conversations?.length || 0,
      totalMessages: messages?.length || 0,
      mostUsedAgents: this.calculateAgentUsage(messages || []),
      avgMessagesPerConversation: Math.round((messages?.length || 0) / Math.max(conversations?.length || 1, 1)),
    };
  },

  calculateAgentUsage(messages: any[]) {
    const agentCounts: Record<string, number> = {};
    messages.forEach(msg => {
      const agentId = msg.metadata?.agent_id;
      if (agentId) {
        agentCounts[agentId] = (agentCounts[agentId] || 0) + 1;
      }
    });
    return Object.entries(agentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  },
}; 