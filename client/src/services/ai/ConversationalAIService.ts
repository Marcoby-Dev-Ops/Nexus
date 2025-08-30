/**
 * Conversational AI Service
 * 
 * Provides "ChatGPT but it knows their business" experience by:
 * - Asking focused questions based on business context
 * - Validating answers against business data
 * - Updating internal systems (profiles, tickets, etc.)
 * - Progressing through structured tasks conversationally
 * - Accessing the full client knowledgebase for personalized responses
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { quantumBusinessService } from '@/services/business/QuantumBusinessService';
import { selectData } from '@/lib/api-client';

export interface ConversationContext {
  userId: string;
  organizationId: string;
  currentTask?: string;
  currentStep?: number;
  totalSteps?: number;
  collectedData: Record<string, unknown>;
  businessContext: {
    industry?: string;
    companySize?: string;
    maturityLevel?: string;
    existingProfiles?: string[];
    knowledgeBase?: ClientKnowledgeBase;
  };
}

export interface ClientKnowledgeBase {
  thoughts: Array<{
    id: string;
    title: string;
    content: string;
    created_at: string;
  }>;
  brainTickets: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
  }>;
  userContexts: Array<{
    id: string;
    context_data: unknown;
    created_at: string;
  }>;
  companyData: {
    name?: string;
    industry?: string;
    size?: string;
    tools?: string[];
  };
}

export interface ConversationStep {
  id: string;
  question: string;
  field: string;
  validation: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    examples?: string[];
  };
  context?: string;
  followUp?: string;
}

export interface ConversationResponse {
  response: string;
  nextStep?: ConversationStep;
  isComplete: boolean;
  progress: number;
  collectedData: Record<string, unknown>;
  actions: {
    type: 'update_profile' | 'create_ticket' | 'save_data' | 'progress_journey';
    target: string;
    data: unknown;
  }[];
  knowledgeContext?: {
    relevantThoughts?: string[];
    activeTickets?: string[];
    businessInsights?: string[];
  };
}

interface BusinessContext {
  company: {
    name?: string;
    industry?: string;
    size?: string;
  };
  insights: string[];
  activeTasks: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  focusAreas: string[];
  recommendations: string[];
  businessMetrics?: {
    recentActivity: {
      focusAreas: string[];
    };
  };
}

interface Ticket {
  title: string;
  description: string;
  priority?: 'high' | 'medium' | 'low';
}

interface Thought {
  title: string;
  content: string;
}

export class ConversationalAIService extends BaseService {
  private static instance: ConversationalAIService;

  public static getInstance(): ConversationalAIService {
    if (!ConversationalAIService.instance) {
      ConversationalAIService.instance = new ConversationalAIService();
    }
    return ConversationalAIService.instance;
  }

  /**
   * Initialize conversation context with business data and knowledgebase
   */
  async initializeContext(userId: string, organizationId: string): Promise<ServiceResponse<ConversationContext>> {
    try {
      logger.info('Initializing conversation context with knowledgebase', { userId, organizationId });

      // Get existing business data
      const quantumProfile = await quantumBusinessService.getQuantumProfile(organizationId);
      
      // Load client knowledgebase
      const knowledgeBase = await this.loadClientKnowledgeBase(userId, organizationId);
      
      const context: ConversationContext = {
        userId,
        organizationId,
        collectedData: {},
        businessContext: {
          existingProfiles: quantumProfile.success && quantumProfile.data ? ['quantum'] : [],
          knowledgeBase
        }
      };

      return this.createResponse(context);
    } catch (error) {
      logger.error('Error initializing conversation context', { error });
      return this.handleError('Failed to initialize conversation context', error);
    }
  }

  /**
   * Load the client's complete knowledgebase
   */
  private async loadClientKnowledgeBase(userId: string, organizationId: string): Promise<ClientKnowledgeBase> {
    try {
      // Load thoughts (business insights and knowledge)
      const thoughtsResponse = await selectData(
        'thoughts',
        'id, title, content, created_at',
        { user_id: userId },
        'created_at DESC',
        10
      );

      // Load brain tickets (active tasks and requests)
      const brainTicketsResponse = await selectData(
        'brain_tickets',
        'id, title, description, status, created_at',
        { user_id: userId },
        'created_at DESC',
        10
      );

      // Load user contexts (conversation history and preferences)
      const userContextsResponse = await selectData(
        'user_contexts',
        'id, context_data, created_at',
        { user_id: userId },
        'created_at DESC',
        5
      );

      // Load company data
      const companyResponse = await selectData(
        'companies',
        'name, industry, size',
        { id: organizationId }
      );

      return {
        thoughts: thoughtsResponse.success ? (thoughtsResponse.data as Array<{ id: string; title: string; content: string; created_at: string }>) : [],
        brainTickets: brainTicketsResponse.success ? (brainTicketsResponse.data as Array<{ id: string; title: string; description: string; status: string; created_at: string }>) : [],
        userContexts: userContextsResponse.success ? (userContextsResponse.data as Array<{ id: string; context_data: unknown; created_at: string }>) : [],
        companyData: companyResponse.success && companyResponse.data && companyResponse.data.length > 0 ? (companyResponse.data[0] as { name?: string; industry?: string; size?: string; tools?: string[] }) : {}
      };
    } catch (error) {
      logger.error('Error loading client knowledgebase', { error });
      return {
        thoughts: [],
        brainTickets: [],
        userContexts: [],
        companyData: {}
      };
    }
  }

  /**
   * Process user message and determine next action with knowledgebase context
   */
  async processMessage(
    message: string,
    context: ConversationContext
  ): Promise<ServiceResponse<ConversationResponse>> {
    try {
      logger.info('Processing conversation message with knowledgebase context', { message: message.substring(0, 100) });

      // Detect intent and current task
      const intent = await this.detectIntent(message, context);
      
      // Get appropriate conversation flow
      const flow = await this.getConversationFlow(intent, context);
      
      // Process the message through the flow
      const response = await this.executeConversationFlow(message, flow, context);

      // Enhance response with knowledgebase context
      const enhancedResponse = await this.enhanceResponseWithKnowledge(response, context, message);

      return this.createResponse(enhancedResponse);
    } catch (error) {
      logger.error('Error processing conversation message', { error });
      return this.handleError('Failed to process message', error);
    }
  }

  /**
   * Enhance response with relevant knowledgebase information
   */
  private async enhanceResponseWithKnowledge(
    response: ConversationResponse,
    context: ConversationContext,
    userMessage: string
  ): Promise<ConversationResponse> {
    const knowledgeBase = context.businessContext.knowledgeBase;
    if (!knowledgeBase) return response;

    // Build comprehensive business context
    const businessContext = this.buildBusinessContext(knowledgeBase, userMessage);
    
    // Generate personalized response based on business context
    const personalizedResponse = await this.generatePersonalizedResponse(userMessage, response.response, businessContext, context);

    response.response = personalizedResponse.response;
    response.knowledgeContext = personalizedResponse.knowledgeContext as {
      relevantThoughts?: string[];
      activeTickets?: string[];
      businessInsights?: string[];
    };
    
    return response;
  }

  /**
   * Build comprehensive business context from knowledgebase
   */
  private buildBusinessContext(knowledgeBase: ClientKnowledgeBase, userMessage: string): BusinessContext {
    const context: BusinessContext = {
      company: knowledgeBase.companyData,
      insights: [],
      activeTasks: [],
      focusAreas: [],
      recommendations: []
    };

    // Extract company insights from thoughts
    const companyThoughts = knowledgeBase.thoughts.filter(thought => 
      thought.content.toLowerCase().includes('marcoby') ||
      thought.title.toLowerCase().includes('marcoby') ||
      thought.content.toLowerCase().includes('business profile') ||
      thought.content.toLowerCase().includes('tool optimization') ||
      thought.content.toLowerCase().includes('customer') ||
      thought.content.toLowerCase().includes('client') ||
      thought.content.toLowerCase().includes('automation') ||
      thought.content.toLowerCase().includes('integration')
    );

    companyThoughts.forEach(thought => {
      const insights = this.extractInsightsFromThought(thought);
      context.insights.push(...insights);
    });

    // Find active brain tickets
    const activeTickets = knowledgeBase.brainTickets.filter(ticket => ticket.status === 'open');
    context.activeTasks = activeTickets.map(ticket => ({
      title: ticket.title,
      description: ticket.description,
      priority: this.analyzeTicketPriority(ticket)
    }));

    // Find related insights based on user message
    const relatedInsights = this.findRelatedInsights(knowledgeBase.thoughts, userMessage);
    context.focusAreas = relatedInsights;

    // Generate business recommendations
    context.recommendations = this.generateBusinessRecommendations(context);

    return context;
  }

  /**
   * Extract insights from thought content
   */
  private extractInsightsFromThought(thought: { content: string }): string[] {
    const insights: string[] = [];
    
    // Extract key business information
    if (thought.content.includes('Company Details:')) {
      const companyMatch = thought.content.match(/Company Details:[\s\S]*?(?=\n\n|$)/);
      if (companyMatch) {
        insights.push(`Business Profile: ${companyMatch[0].replace('Company Details:', '').trim()}`);
      }
    }

    // Extract tool stack information
    if (thought.content.includes('Tool Stack:')) {
      const toolMatch = thought.content.match(/Tool Stack:[\s\S]*?(?=\n\n|$)/);
      if (toolMatch) {
        insights.push(`Current Tools: ${toolMatch[0].replace('Tool Stack:', '').trim()}`);
      }
    }

    // Extract priorities
    if (thought.content.includes('Key Priorities:')) {
      const priorityMatch = thought.content.match(/Key Priorities:[\s\S]*?(?=\n\n|$)/);
      if (priorityMatch) {
        insights.push(`Business Priorities: ${priorityMatch[0].replace('Key Priorities:', '').trim()}`);
      }
    }

    // Extract customer-related insights
    if (thought.content.toLowerCase().includes('customer') || thought.content.toLowerCase().includes('client')) {
      const customerMatch = thought.content.match(/(?:customer|client)[\s\S]*?(?=\n\n|\.|$)/i);
      if (customerMatch) {
        insights.push(`Customer Focus: ${customerMatch[0].trim()}`);
      }
    }

    // Extract automation insights
    if (thought.content.toLowerCase().includes('automation') || thought.content.toLowerCase().includes('integration')) {
      const automationMatch = thought.content.match(/(?:automation|integration)[\s\S]*?(?=\n\n|\.|$)/i);
      if (automationMatch) {
        insights.push(`Automation: ${automationMatch[0].trim()}`);
      }
    }

    // Extract business insights from Marcoby-specific content
    if (thought.content.toLowerCase().includes('marcoby')) {
      const marcobyMatch = thought.content.match(/marcoby[\s\S]*?(?=\n\n|\.|$)/i);
      if (marcobyMatch) {
        insights.push(`Marcoby Business: ${marcobyMatch[0].trim()}`);
      }
    }

    return insights;
  }

  /**
   * Analyze ticket priority based on content
   */
  private analyzeTicketPriority(ticket: { title: string; description: string }): 'high' | 'medium' | 'low' {
    const urgentKeywords = ['urgent', 'critical', 'blocking', 'immediate', 'asap'];
    const highKeywords = ['important', 'priority', 'deadline', 'due'];
    
    const content = `${ticket.title} ${ticket.description}`.toLowerCase();
    
    if (urgentKeywords.some(keyword => content.includes(keyword))) return 'high';
    if (highKeywords.some(keyword => content.includes(keyword))) return 'medium';
    return 'low';
  }

  /**
   * Find related insights based on user message
   */
  private findRelatedInsights(thoughts: Thought[], userMessage: string): string[] {
    const keywords = userMessage.toLowerCase().split(' ');
    const related: string[] = [];

    thoughts.forEach(thought => {
      const content = `${thought.title} ${thought.content}`.toLowerCase();
      const matches = keywords.filter(keyword => 
        keyword.length > 3 && content.includes(keyword)
      );
      
      if (matches.length > 0) {
        related.push(thought.title);
      }
    });

    return related.slice(0, 3);
  }

  /**
   * Generate business recommendations based on context
   */
  private generateBusinessRecommendations(context: BusinessContext): string[] {
    const recommendations: string[] = [];

    // Company-specific recommendations
    if (context.company?.name === 'Marcoby') {
      recommendations.push('Focus on your technology industry expertise');
      recommendations.push('Leverage your existing tool stack (HubSpot, Stripe, etc.)');
    }

    // Size-based recommendations
    if (context.company?.size === 'startup' || context.company?.size === '1-10 employees') {
      recommendations.push('Prioritize high-impact activities for growth');
      recommendations.push('Focus on building recurring revenue streams');
    }

    // Industry-specific recommendations
    if (context.company?.industry === 'technology') {
      recommendations.push('Emphasize your managed services expertise');
      recommendations.push('Target small to medium businesses with established processes');
    }

    return recommendations;
  }

  /**
   * Generate personalized response based on business context
   */
  private async generatePersonalizedResponse(
    userMessage: string,
    baseResponse: string,
    businessContext: BusinessContext,
    _context: ConversationContext
  ): Promise<{ response: string; knowledgeContext: unknown }> {
    
    // Generate business-aware response
    const personalizedResponse = this.generateBusinessAwareResponse(userMessage, businessContext, _context);
    
    return {
      response: personalizedResponse.response,
      knowledgeContext: personalizedResponse.knowledgeContext
    };
  }

  /**
   * Generate business-aware response that fundamentally shapes the AI output
   */
  private generateBusinessAwareResponse(
    userMessage: string,
    businessContext: BusinessContext,
    _context: ConversationContext
  ): { response: string; knowledgeContext: unknown } {
    
    const companyName = businessContext.company?.name || 'your business';
    const industry = businessContext.company?.industry || 'your industry';
    const insights = businessContext.insights?.length || 0;
    const activeTasks = businessContext.activeTasks?.length || 0;
    const focusAreas = businessContext.focusAreas || [];
    const recommendations = businessContext.recommendations || [];

    // Extract customer-related insights
    const customerInsights = businessContext.insights?.filter(insight => 
      insight.toLowerCase().includes('customer') || 
      insight.toLowerCase().includes('client') ||
      insight.toLowerCase().includes('customer focus')
    ) || [];

    // Build knowledge context for display
    const knowledgeContext = {
      businessInsights: businessContext.insights?.slice(0, 2) || [],
      focusAreas: focusAreas,
      activeTickets: businessContext.activeTasks?.slice(0, 2).map((t) => t.title) || [],
      recommendations: recommendations.slice(0, 2)
    };

    // Generate personalized response based on user message
    let response = '';

    if (userMessage.toLowerCase().includes('what should i work on')) {
      response = `Based on your ${companyName} business context, I can see you're a ${industry} company with ${insights} business insights in your knowledgebase. You currently have ${activeTasks} active tasks that need attention.`;
      
      if (customerInsights.length > 0) {
        response += ` I can see you're focused on customer experience and satisfaction. `;
      }
      
      if (focusAreas.length > 0) {
        response += ` Based on your recent work, I know you've been focusing on ${focusAreas.join(' and ')}. `;
      }
      
      if (activeTasks > 0) {
        const highPriorityTasks = businessContext.activeTasks.filter((t) => t.priority === 'high');
        if (highPriorityTasks.length > 0) {
          response += `I'd recommend starting with your high-priority task: "${highPriorityTasks[0].title}". `;
        }
      }
      
      response += `What specific aspect would you like to tackle first?`;
    } else if (userMessage.toLowerCase().includes('customer') || userMessage.toLowerCase().includes('client')) {
      // Customer-specific response
      response = `Based on your ${companyName} ${industry} business context, I can see you're focused on customer experience enhancement and satisfaction. `;
      
      if (customerInsights.length > 0) {
        response += `Your business insights show a strong focus on ${customerInsights.slice(0, 2).join(' and ')}. `;
      }
      
      response += `How can I help you improve your customer relationships or processes?`;
    } else {
      // For other messages, provide context-aware response
      response = `Based on your ${companyName} ${industry} business context, `;
      
      if (customerInsights.length > 0) {
        response += `I can see you're focused on customer experience and satisfaction. `;
      }
      
      if (focusAreas.length > 0) {
        response += `I can see you've been working on ${focusAreas.join(' and ')}. `;
      }
      
      response += `How can I help you with your current priorities?`;
    }

    return { response, knowledgeContext };
  }

  /**
   * Detect user intent from message with knowledgebase context
   */
  private async detectIntent(message: string, context: ConversationContext): Promise<string> {
    const lowerMessage = message.toLowerCase();
    const knowledgeBase = context.businessContext.knowledgeBase;
    
    // Check if message relates to existing brain tickets
    if (knowledgeBase?.brainTickets) {
      const relatedTickets = knowledgeBase.brainTickets.filter(ticket => 
        lowerMessage.includes(ticket.title.toLowerCase().split(' ')[0]) ||
        ticket.description.toLowerCase().includes(lowerMessage.split(' ')[0])
      );
      
      if (relatedTickets.length > 0) {
        return 'brain_ticket_followup';
      }
    }
    
    // Check if message relates to existing thoughts
    if (knowledgeBase?.thoughts) {
      const relatedThoughts = knowledgeBase.thoughts.filter(thought => 
        lowerMessage.includes(thought.title.toLowerCase().split(' ')[0]) ||
        thought.content.toLowerCase().includes(lowerMessage.split(' ')[0])
      );
      
      if (relatedThoughts.length > 0) {
        return 'knowledge_inquiry';
      }
    }
    
    // Quantum profile setup intent
    if (lowerMessage.includes('quantum') || lowerMessage.includes('building blocks') || 
        lowerMessage.includes('configure') || lowerMessage.includes('setup')) {
      return 'quantum_profile_setup';
    }
    
    // General business help
    if (lowerMessage.includes('help') || lowerMessage.includes('what') || 
        lowerMessage.includes('how') || lowerMessage.includes('business')) {
      return 'general_business_help';
    }
    
    // Task completion
    if (lowerMessage.includes('done') || lowerMessage.includes('complete') || 
        lowerMessage.includes('finished')) {
      return 'task_completion';
    }
    
    return 'general_conversation';
  }

  /**
   * Get conversation flow based on intent with knowledgebase integration
   */
  private async getConversationFlow(intent: string, context: ConversationContext): Promise<ConversationStep[]> {
    switch (intent) {
      case 'quantum_profile_setup':
        return this.getQuantumProfileFlow(context);
      case 'brain_ticket_followup':
        return this.getBrainTicketFollowupFlow(context);
      case 'knowledge_inquiry':
        return this.getKnowledgeInquiryFlow(context);
      case 'general_business_help':
        return this.getGeneralHelpFlow(context);
      default:
        return this.getGeneralConversationFlow(context);
    }
  }

  /**
   * Get brain ticket followup conversation flow
   */
  private async getBrainTicketFollowupFlow(context: ConversationContext): Promise<ConversationStep[]> {
    const knowledgeBase = context.businessContext.knowledgeBase;
    const activeTickets = knowledgeBase?.brainTickets?.filter(t => t.status === 'open') || [];
    
    return [
      {
        id: 'ticket-followup',
        question: `I see you have ${activeTickets.length} active brain tickets. Which one would you like to work on? I can help you make progress on any of them.`,
        field: 'selected_ticket',
        validation: {
          type: 'string',
          required: true,
          minLength: 3
        },
        context: 'This helps me focus on the specific task you want to address.'
      }
    ];
  }

  /**
   * Get knowledge inquiry conversation flow
   */
  private async getKnowledgeInquiryFlow(context: ConversationContext): Promise<ConversationStep[]> {
    const knowledgeBase = context.businessContext.knowledgeBase;
    const relevantThoughts = knowledgeBase?.thoughts?.slice(0, 3) || [];
    
    return [
      {
        id: 'knowledge-inquiry',
        question: `I found some relevant insights in your knowledgebase. Would you like me to share what I know about ${relevantThoughts.map(t => t.title).join(', ')}?`,
        field: 'knowledge_topic',
        validation: {
          type: 'string',
          required: true,
          minLength: 3
        },
        context: 'This helps me provide the most relevant information from your business knowledge.'
      }
    ];
  }

  /**
   * Get quantum profile setup conversation flow with knowledgebase context
   */
  private async getQuantumProfileFlow(context: ConversationContext): Promise<ConversationStep[]> {
    const knowledgeBase = context.businessContext.knowledgeBase;
    const companyName = knowledgeBase?.companyData?.name || 'your business';
    const industry = knowledgeBase?.companyData?.industry || 'your industry';
    
    return [
      {
        id: 'quantum-intro',
        question: `I'd love to help you set up your quantum business profile for ${companyName}! I can see you're in the ${industry} industry. Let's start with your business identity. What's your company's mission statement?`,
        field: 'mission',
        validation: {
          type: 'string',
          required: true,
          minLength: 10,
          examples: ['To empower entrepreneurs with AI-driven business tools', 'To provide innovative solutions for small businesses']
        },
        context: 'This helps establish your business foundation and guides all other decisions.'
      },
      {
        id: 'quantum-vision',
        question: "Great! Now, what's your vision for where you want your business to be in 3-5 years?",
        field: 'vision',
        validation: {
          type: 'string',
          required: true,
          minLength: 10,
          examples: ['To become the leading platform for business automation', 'To serve 10,000+ small businesses nationwide']
        },
        context: 'Your vision guides long-term strategy and growth planning.'
      },
      {
        id: 'quantum-values',
        question: "What are your core values? (You can list 3-5 key values that drive your business decisions)",
        field: 'values',
        validation: {
          type: 'array',
          required: true,
          examples: ['Innovation', 'Customer Success', 'Transparency', 'Excellence']
        },
        context: 'Core values shape your company culture and decision-making.'
      },
      {
        id: 'quantum-revenue-model',
        question: "How does your business generate revenue? What's your primary revenue model?",
        field: 'revenue_model',
        validation: {
          type: 'string',
          required: true,
          examples: ['Subscription', 'One-time sales', 'Marketplace fees', 'Consulting', 'Licensing']
        },
        context: 'Understanding your revenue model helps optimize your business strategy.'
      },
      {
        id: 'quantum-target-customers',
        question: "Who are your ideal customers? Describe your target customer segments.",
        field: 'target_customers',
        validation: {
          type: 'array',
          required: true,
          examples: ['Small businesses', 'Enterprise clients', 'Individual entrepreneurs', 'Startups']
        },
        context: 'Knowing your target customers helps focus your marketing and product development.'
      }
    ];
  }

  /**
   * Execute conversation flow with validation and progress tracking
   */
  private async executeConversationFlow(
    message: string,
    flow: ConversationStep[],
    context: ConversationContext
  ): Promise<ConversationResponse> {
    // Determine current step
    const currentStepIndex = context.currentStep || 0;
    const currentStep = flow[currentStepIndex];
    
    if (!currentStep) {
      // Flow complete
      return await this.completeFlow(context);
    }

    // Validate user's answer
    const validation = await this.validateAnswer(message, currentStep);
    
    if (!validation.isValid) {
      return {
        response: `I need a bit more detail. ${validation.error}. ${currentStep.context || ''} Can you provide more information?`,
        nextStep: currentStep,
        isComplete: false,
        progress: (currentStepIndex / flow.length) * 100,
        collectedData: context.collectedData,
        actions: []
      };
    }

    // Save validated data
    context.collectedData[currentStep.field] = validation.value;
    context.currentStep = currentStepIndex + 1;

    // Check if flow is complete
    if (context.currentStep >= flow.length) {
      return await this.completeFlow(context);
    }

    // Get next step
    const nextStep = flow[context.currentStep];
    
    return {
      response: `${currentStep.followUp || 'Perfect!'} ${nextStep.question}`,
      nextStep,
      isComplete: false,
      progress: (context.currentStep / flow.length) * 100,
      collectedData: context.collectedData,
      actions: [{
        type: 'save_data',
        target: 'quantum_profile',
        data: { [currentStep.field]: validation.value }
      }]
    };
  }

  /**
   * Validate user answer against step requirements
   */
  private async validateAnswer(message: string, step: ConversationStep): Promise<{ isValid: boolean; value?: unknown; error?: string }> {
    const { validation } = step;
    
    try {
      let value: unknown = message.trim();
      
      // Basic validation
      if (validation.required && (!value || (typeof value === 'string' && value.length === 0))) {
        return { isValid: false, error: 'This field is required.' };
      }
      
      if (validation.minLength && typeof value === 'string' && value.length < validation.minLength) {
        return { isValid: false, error: `Please provide at least ${validation.minLength} characters.` };
      }
      
      if (validation.maxLength && typeof value === 'string' && value.length > validation.maxLength) {
        return { isValid: false, error: `Please keep your response under ${validation.maxLength} characters.` };
      }
      
      // Type-specific validation
      if (validation.type === 'array') {
        // Parse comma-separated values into array
        value = (value as string).split(',').map((item: string) => item.trim()).filter(Boolean);
        if (validation.required && Array.isArray(value) && value.length === 0) {
          return { isValid: false, error: 'Please provide at least one value.' };
        }
      }
      
      return { isValid: true, value };
    } catch (error) {
      return { isValid: false, error: 'I couldn\'t understand that response. Please try again.' };
    }
  }

  /**
   * Complete the conversation flow and save data
   */
  private async completeFlow(context: ConversationContext): Promise<ConversationResponse> {
    try {
      // Save quantum profile
      if (context.collectedData.mission) {
        await this.saveQuantumProfile(context);
      }
      
      return {
        response: "Excellent! I've saved your quantum business profile. This will help me provide more personalized assistance going forward. What would you like to work on next?",
        isComplete: true,
        progress: 100,
        collectedData: context.collectedData,
        actions: [{
          type: 'update_profile',
          target: 'quantum_business_profiles',
          data: context.collectedData
        }]
      };
    } catch (error) {
      logger.error('Error completing conversation flow', { error });
      return {
        response: "I've collected your information, but there was an issue saving it. Let me try again, or you can continue and I'll save it later.",
        isComplete: true,
        progress: 100,
        collectedData: context.collectedData,
        actions: []
      };
    }
  }

  /**
   * Save quantum profile with collected data
   */
  private async saveQuantumProfile(context: ConversationContext): Promise<void> {
    const profileData = {
      id: `quantum-${context.organizationId}`,
      organizationId: context.organizationId,
      blocks: [
        {
          blockId: 'identity',
          strength: 80,
          health: 85,
          properties: {
            mission: context.collectedData.mission,
            vision: context.collectedData.vision,
            values: context.collectedData.values
          },
          healthIndicators: {},
          aiCapabilities: [],
          marketplaceIntegrations: []
        },
        {
          blockId: 'revenue',
          strength: 75,
          health: 80,
          properties: {
            revenue_model: context.collectedData.revenue_model,
            target_customers: context.collectedData.target_customers
          },
          healthIndicators: {},
          aiCapabilities: [],
          marketplaceIntegrations: []
        }
      ],
      relationships: [],
      healthScore: 82,
      maturityLevel: 'startup' as const,
      lastUpdated: new Date().toISOString()
    };

    await quantumBusinessService.saveQuantumProfile(profileData);
  }

  /**
   * Get general help conversation flow
   */
  private async getGeneralHelpFlow(_context: ConversationContext): Promise<ConversationStep[]> {
    return [
      {
        id: 'help-intro',
        question: "I'd be happy to help! What specific aspect of your business would you like to work on?",
        field: 'help_topic',
        validation: {
          type: 'string',
          required: true,
          minLength: 5
        },
        context: 'This helps me provide the most relevant assistance.'
      }
    ];
  }

  /**
   * Get general conversation flow
   */
  private async getGeneralConversationFlow(_context: ConversationContext): Promise<ConversationStep[]> {
    return [
      {
        id: 'general-intro',
        question: "How can I help you with your business today?",
        field: 'general_topic',
        validation: {
          type: 'string',
          required: true,
          minLength: 5
        },
        context: 'I\'m here to help with any business questions or tasks.'
      }
    ];
  }

  /**
   * Analyze what the user is asking about
   */
  private analyzeUserIntent(message: string): { type: string; keywords: string[] } {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('optimize') || lowerMessage.includes('efficiency') || lowerMessage.includes('tool')) {
      return { type: 'optimization', keywords: ['optimization', 'efficiency', 'tools'] };
    }
    
    if (lowerMessage.includes('grow') || lowerMessage.includes('revenue') || lowerMessage.includes('scale')) {
      return { type: 'growth', keywords: ['growth', 'revenue', 'scaling'] };
    }
    
    if (lowerMessage.includes('team') || lowerMessage.includes('hire') || lowerMessage.includes('people')) {
      return { type: 'team', keywords: ['team', 'hiring', 'people'] };
    }
    
    if (lowerMessage.includes('process') || lowerMessage.includes('automation') || lowerMessage.includes('workflow')) {
      return { type: 'process', keywords: ['process', 'automation', 'workflow'] };
    }
    
    return { type: 'general', keywords: [] };
  }

  /**
   * Generate optimization-focused response based on business context
   */
  private generateOptimizationResponse(_userMessage: string, businessContext: BusinessContext): string {
    const company = businessContext.company;
    const insights = businessContext.insights;
    const activeTasks = businessContext.activeTasks;
    
    // Find optimization-related insights
    const optimizationInsights = insights.filter(i => 
      i.toLowerCase().includes('optimization') || 
      i.toLowerCase().includes('efficiency') ||
      i.toLowerCase().includes('automation')
    );
    
    // Find optimization-related tasks
    const optimizationTasks = activeTasks.filter(t => 
      t.title.toLowerCase().includes('optimization') ||
      t.description.toLowerCase().includes('efficiency')
    );

    let response = `Based on your ${company.industry} business context, `;
    
    if (optimizationInsights.length > 0) {
      response += `I can see from your business insights that ${optimizationInsights[0].toLowerCase()}. `;
    }
    
    if (optimizationTasks.length > 0) {
      response += `You also have ${optimizationTasks.length} active tasks related to optimization that we should address. `;
    }
    
    // Add specific recommendations based on company size and industry
    if (company.size === '1-10') {
      response += `As a small team, I'd recommend focusing on tool automation first - you can likely save 6-10 hours per week per team member through proper tool optimization. `;
    }
    
    if (company.industry === 'technology') {
      response += `In the technology industry, process optimization is crucial for staying competitive. `;
    }
    
    response += `What specific area of your business would you like to optimize first?`;
    
    return response;
  }

  /**
   * Generate growth-focused response based on business context
   */
  private generateGrowthResponse(_userMessage: string, businessContext: BusinessContext): string {
    const company = businessContext.company;
    const insights = businessContext.insights;
    const activeTasks = businessContext.activeTasks;
    
    // Find growth-related insights
    const growthInsights = insights.filter(i => 
      i.toLowerCase().includes('growth') || 
      i.toLowerCase().includes('revenue') ||
      i.toLowerCase().includes('customer')
    );
    
    // Find growth-related tasks
    const growthTasks = activeTasks.filter(t => 
      t.title.toLowerCase().includes('revenue') ||
      t.title.toLowerCase().includes('growth') ||
      t.description.toLowerCase().includes('customer')
    );

    let response = `Looking at your ${company.industry} business growth opportunities, `;
    
    if (growthInsights.length > 0) {
      response += `your business insights show that ${growthInsights[0].toLowerCase()}. `;
    }
    
    if (growthTasks.length > 0) {
      response += `I notice you have ${growthTasks.length} active tasks focused on growth and revenue. `;
    }
    
    // Add industry-specific growth advice
    if (company.industry === 'technology') {
      response += `For technology companies, recurring revenue models and customer retention are key growth drivers. `;
    }
    
    if (company.size === '1-10') {
      response += `As a small business, focus on customer acquisition and retention strategies that scale with your team size. `;
    }
    
    response += `What's your current growth target and timeline?`;
    
    return response;
  }

  /**
   * Generate team-focused response based on business context
   */
  private generateTeamResponse(_userMessage: string, businessContext: BusinessContext): string {
    const company = businessContext.company;
    const insights = businessContext.insights;
    const activeTasks = businessContext.activeTasks;
    
    // Find team-related insights
    const teamInsights = insights.filter(i => 
      i.toLowerCase().includes('team') || 
      i.toLowerCase().includes('hiring') ||
      i.toLowerCase().includes('people')
    );
    
    // Find team-related tasks
    const teamTasks = activeTasks.filter(t => 
      t.title.toLowerCase().includes('hire') ||
      t.title.toLowerCase().includes('team') ||
      t.description.toLowerCase().includes('people')
    );

    let response = `Regarding your ${company.industry} team development, `;
    
    if (teamInsights.length > 0) {
      response += `your business insights indicate that ${teamInsights[0].toLowerCase()}. `;
    }
    
    if (teamTasks.length > 0) {
      response += `You have ${teamTasks.length} active tasks related to team building and hiring. `;
    }
    
    // Add size-specific team advice
    if (company.size === '1-10') {
      response += `As you're building your team from a small size, focus on roles that will have the biggest impact on your growth. `;
    }
    
    if (company.industry === 'technology') {
      response += `In the technology industry, technical roles and customer success positions are typically the highest priority for early-stage companies. `;
    }
    
    response += `What specific role or team need are you looking to address?`;
    
    return response;
  }

  /**
   * Generate process-focused response based on business context
   */
  private generateProcessResponse(_userMessage: string, businessContext: BusinessContext): string {
    const company = businessContext.company;
    const insights = businessContext.insights;
    const activeTasks = businessContext.activeTasks;
    
    // Find process-related insights
    const processInsights = insights.filter(i => 
      i.toLowerCase().includes('process') || 
      i.toLowerCase().includes('automation') ||
      i.toLowerCase().includes('workflow')
    );
    
    // Find process-related tasks
    const processTasks = activeTasks.filter(t => 
      t.title.toLowerCase().includes('process') ||
      t.title.toLowerCase().includes('automation') ||
      t.description.toLowerCase().includes('workflow')
    );

    let response = `For your ${company.industry} business processes, `;
    
    if (processInsights.length > 0) {
      response += `your insights show that ${processInsights[0].toLowerCase()}. `;
    }
    
    if (processTasks.length > 0) {
      response += `You have ${processTasks.length} active tasks focused on process improvement. `;
    }
    
    // Add automation recommendations
    if (company.size === '1-10') {
      response += `Small teams benefit most from automating repetitive tasks and customer communication workflows. `;
    }
    
    if (company.industry === 'technology') {
      response += `Technology companies should prioritize development workflows and customer onboarding processes. `;
    }
    
    response += `Which process would you like to streamline first?`;
    
    return response;
  }

  /**
   * Generate general business response based on business context
   */
  private generateGeneralBusinessResponse(_userMessage: string, businessContext: BusinessContext): string {
    const company = businessContext.company;
    const insights = businessContext.insights;
    const activeTasks = businessContext.activeTasks;
    const focusAreas = businessContext.businessMetrics?.recentActivity.focusAreas || [];
    
    let response = `Based on your ${company.name} business context, `;
    
    if (focusAreas.length > 0) {
      response += `I can see you've been focusing on ${focusAreas.join(' and ')}. `;
    }
    
    if (insights.length > 0) {
      response += `Your business insights show that ${insights[0].toLowerCase()}. `;
    }
    
    if (activeTasks.length > 0) {
      const highPriorityTasks = activeTasks.filter(t => t.priority === 'high');
      if (highPriorityTasks.length > 0) {
        response += `You have ${highPriorityTasks.length} high-priority tasks that might need attention: ${highPriorityTasks.map(t => t.title).join(', ')}. `;
      }
    }
    
    // Add industry-specific context
    if (company.industry === 'technology') {
      response += `As a technology company, you're in a fast-moving industry where efficiency and innovation are crucial. `;
    }
    
    if (company.size === '1-10') {
      response += `Being a small team means every decision has a big impact - let's make sure we're focusing on what will drive the most value. `;
    }
    
    response += `How can I help you move forward with your business goals today?`;
    
    return response;
  }
}

export const conversationalAIService = ConversationalAIService.getInstance();

