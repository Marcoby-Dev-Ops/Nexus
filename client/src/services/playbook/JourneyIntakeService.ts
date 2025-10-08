/**
 * Journey Intake Service
 * 
 * Handles AI-powered conversation flow for creating new business journeys.
 * Provides natural language processing to understand user intent and route
 * to appropriate journey types and resources.
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { callEdgeFunction } from '@/lib/api-client';

// ============================================================================
// TYPES
// ============================================================================

export interface JourneyIntakeSession {
  id: string;
  user_id: string;
  organization_id: string;
  status: 'active' | 'completed' | 'abandoned';
  journey_type?: JourneyType;
  conversation_history: ConversationMessage[];
  identified_goals: string[];
  recommended_resources: string[];
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface JourneyType {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'growth' | 'optimization' | 'innovation' | 'compliance' | 'custom';
  estimated_duration: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  required_resources: string[];
  success_metrics: string[];
  ai_prompt_template: string;
}

export interface JourneyIntakeRequest {
  user_id: string;
  organization_id: string;
  initial_message?: string;
  user_profile?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
  };
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    content?: string; // Base64 encoded content for processing
  }[];
  integrations?: {
    service: string;
    action: string;
    data?: any;
  }[];
  context?: {
    page?: string;
    topic?: string;
    mode?: string;
    focus?: string;
  };
}

export interface JourneyIntakeResponse {
  session: JourneyIntakeSession;
  next_message: string;
  suggested_questions: string[];
  journey_recommendations: JourneyType[];
}

export interface SendMessageRequest {
  session_id: string;
  message: string;
  user_id: string;
  user_profile?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
  };
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    content?: string;
  }[];
  integrations?: {
    service: string;
    action: string;
    data?: any;
  }[];
  context?: {
    page?: string;
    topic?: string;
    mode?: string;
    focus?: string;
  };
}

export interface SendMessageResponse {
  session: JourneyIntakeSession;
  response: string;
  journey_identified?: JourneyType;
  next_questions: string[];
  confidence_score: number;
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class JourneyIntakeService extends BaseService {
  private readonly EDGE_FUNCTION = 'journey-intake';

  /**
   * Start a new journey intake session
   */
  async startIntake(request: JourneyIntakeRequest): Promise<ServiceResponse<JourneyIntakeResponse>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('startIntake', { 
        user_id: request.user_id, 
        organization_id: request.organization_id 
      });

      const response = await callEdgeFunction(this.EDGE_FUNCTION, {
        action: 'start_intake',
        data: request
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to start journey intake');
      }

      return { data: response.data, error: null, success: true };
    }, `start journey intake for user ${request.user_id}`);
  }

  /**
   * Send a message in an active intake session
   */
  async sendMessage(request: SendMessageRequest): Promise<ServiceResponse<SendMessageResponse>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('sendMessage', { 
        session_id: request.session_id,
        user_id: request.user_id 
      });

      const response = await callEdgeFunction(this.EDGE_FUNCTION, {
        action: 'send_message',
        data: request
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to send message');
      }

      return { data: response.data, error: null, success: true };
    }, `send message in session ${request.session_id}`);
  }

  /**
   * Complete the intake and create a journey
   */
  async completeIntake(sessionId: string, userId: string, journeyTypeId: string, userProfile?: any): Promise<ServiceResponse<{ journey_id: string; journey_type: JourneyType; next_steps: string[] }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('completeIntake', { session_id: sessionId, user_id: userId, journey_type_id: journeyTypeId });

      const response = await callEdgeFunction(this.EDGE_FUNCTION, {
        action: 'complete_intake',
        data: { 
          session_id: sessionId, 
          user_id: userId, 
          journey_type_id: journeyTypeId,
          user_profile: userProfile
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to complete intake');
      }

      return { data: response.data, error: null, success: true };
    }, `complete intake session ${sessionId}`);
  }

  /**
   * Get available journey types from API
   */
  async getJourneyTypes(): Promise<ServiceResponse<JourneyType[]>> {
    return this.executeApiOperation(async () => {
      this.logMethodCall('getJourneyTypes');

      const response = await this.apiClient.get('/journey-intake/types');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch journey types');
      }

      return response.data;
    }, 'getJourneyTypes');
  }

  /**
   * Get predefined journey types (fallback)
   */
  async getPredefinedJourneyTypes(): Promise<ServiceResponse<JourneyType[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getPredefinedJourneyTypes');

      // Predefined journey types based on common business needs
      const journeyTypes: JourneyType[] = [
        // Onboarding Journeys - Starter journeys for all businesses
        {
          id: 'business-identity-setup',
          name: 'Business Identity Setup',
          description: 'Define your business vision, mission, and unique value proposition',
          category: 'onboarding',
          estimated_duration: '15-30 minutes',
          complexity: 'beginner',
          required_resources: ['Business idea or concept'],
          success_metrics: ['Clear business identity', 'Defined value proposition', 'Mission statement'],
          ai_prompt_template: 'Help me define my business identity by clarifying my vision, mission, and unique value proposition.'
        },
        {
          id: 'quantum-building-blocks',
          name: 'Quantum Building Blocks Setup',
          description: 'Configure the 7 fundamental building blocks that compose your business using our journey system',
          category: 'onboarding',
          estimated_duration: '30-60 minutes',
          complexity: 'beginner',
          required_resources: ['Business identity defined'],
          success_metrics: ['All 7 blocks configured', 'Business health score', 'Foundation established'],
          ai_prompt_template: 'Help me set up the 7 quantum building blocks that form the foundation of my business using the guided journey approach.'
        },
        {
          id: 'business-profile-completion',
          name: 'Business Profile Completion',
          description: 'Complete your business profile with industry, goals, and context',
          category: 'onboarding',
          estimated_duration: '10-20 minutes',
          complexity: 'beginner',
          required_resources: ['Basic business information'],
          success_metrics: ['Complete business profile', 'Industry context', 'Goal alignment'],
          ai_prompt_template: 'Help me complete my business profile with industry selection, goals, and business context.'
        },
        {
          id: 'mvp-onboarding',
          name: 'MVP Business Setup',
          description: 'Quick setup to get your business running with Nexus in under 10 minutes',
          category: 'onboarding',
          estimated_duration: '8-12 minutes',
          complexity: 'beginner',
          required_resources: ['Basic business information'],
          success_metrics: ['Business units configured', 'Goals defined', 'First action completed'],
          ai_prompt_template: 'Help me quickly set up my business with the essential units, goals, and take my first action.'
        },
        // Growth Journeys
        {
          id: 'customer-acquisition',
          name: 'Customer Acquisition Journey',
          description: 'Systematically grow your customer base through targeted marketing and sales strategies',
          category: 'growth',
          estimated_duration: '3-6 months',
          complexity: 'intermediate',
          required_resources: ['Marketing budget', 'Sales team', 'CRM system'],
          success_metrics: ['Customer acquisition cost', 'Conversion rate', 'Revenue growth'],
          ai_prompt_template: 'Help me acquire more customers for my business by identifying target markets, creating marketing strategies, and optimizing sales processes.'
        },
        {
          id: 'content-marketing',
          name: 'Content Marketing & Blog Journey',
          description: 'Build authority and attract customers through valuable content creation and distribution',
          category: 'growth',
          estimated_duration: '6-12 months',
          complexity: 'beginner',
          required_resources: ['Content creation tools', 'SEO knowledge', 'Social media presence'],
          success_metrics: ['Website traffic', 'Lead generation', 'Brand awareness'],
          ai_prompt_template: 'Help me start a successful blog and content marketing strategy to attract and engage my target audience.'
        },
        {
          id: 'sales-optimization',
          name: 'Sales Optimization Journey',
          description: 'Increase sales performance through process optimization and team development',
          category: 'optimization',
          estimated_duration: '2-4 months',
          complexity: 'intermediate',
          required_resources: ['Sales data', 'CRM system', 'Team training'],
          success_metrics: ['Sales conversion rate', 'Average deal size', 'Sales cycle length'],
          ai_prompt_template: 'Help me increase sales of my products by optimizing my sales process, improving conversion rates, and scaling my sales operations.'
        },
        {
          id: 'product-development',
          name: 'Product Development Journey',
          description: 'Develop and launch new products or improve existing ones based on market needs',
          category: 'innovation',
          estimated_duration: '6-18 months',
          complexity: 'advanced',
          required_resources: ['Development team', 'Market research', 'Product management tools'],
          success_metrics: ['Product-market fit', 'Customer satisfaction', 'Revenue from new products'],
          ai_prompt_template: 'Help me develop and launch new products or improve existing ones to better serve my customers and grow my business.'
        },
        {
          id: 'operational-efficiency',
          name: 'Operational Efficiency Journey',
          description: 'Streamline operations and reduce costs while maintaining quality',
          category: 'optimization',
          estimated_duration: '3-6 months',
          complexity: 'intermediate',
          required_resources: ['Process documentation', 'Analytics tools', 'Team collaboration'],
          success_metrics: ['Cost reduction', 'Process efficiency', 'Employee productivity'],
          ai_prompt_template: 'Help me improve my business operations to be more efficient, reduce costs, and increase productivity.'
        },
        {
          id: 'digital-transformation',
          name: 'Digital Transformation Journey',
          description: 'Modernize business processes and technology infrastructure',
          category: 'innovation',
          estimated_duration: '12-24 months',
          complexity: 'advanced',
          required_resources: ['Technology budget', 'IT expertise', 'Change management'],
          success_metrics: ['Digital adoption rate', 'Process automation', 'Customer experience'],
          ai_prompt_template: 'Help me transform my business digitally by implementing modern technology solutions and optimizing digital processes.'
        }
      ];

      return { data: journeyTypes, error: null, success: true };
    }, `get journey types`);
  }

  /**
   * Analyze user intent from message
   */
  async analyzeIntent(message: string): Promise<ServiceResponse<{
    intent: string;
    confidence: number;
    suggested_journey_types: string[];
    keywords: string[];
  }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('analyzeIntent', { message });

      // Simple keyword-based intent analysis (in production, this would use NLP/AI)
      const lowerMessage = message.toLowerCase();
      const keywords: string[] = [];
      const suggestedJourneyTypes: string[] = [];

      // Onboarding intents
      if (lowerMessage.includes('identity') || lowerMessage.includes('vision') || 
          lowerMessage.includes('mission') || lowerMessage.includes('value proposition')) {
        suggestedJourneyTypes.push('business-identity-setup');
        keywords.push('business identity', 'vision', 'mission');
      }

      if (lowerMessage.includes('building blocks') || lowerMessage.includes('foundation') || 
          lowerMessage.includes('setup') || lowerMessage.includes('configure')) {
        suggestedJourneyTypes.push('quantum-building-blocks');
        keywords.push('building blocks', 'foundation', 'setup');
      }

      if (lowerMessage.includes('profile') || lowerMessage.includes('industry') || 
          lowerMessage.includes('goals') || lowerMessage.includes('context')) {
        suggestedJourneyTypes.push('business-profile-completion');
        keywords.push('business profile', 'industry', 'goals');
      }

      if (lowerMessage.includes('mvp') || lowerMessage.includes('quick setup') || 
          lowerMessage.includes('fast') || lowerMessage.includes('simple')) {
        suggestedJourneyTypes.push('mvp-onboarding');
        keywords.push('mvp', 'quick setup', 'fast');
      }

      // Customer acquisition intent
      if (lowerMessage.includes('customer') || lowerMessage.includes('clients') || 
          lowerMessage.includes('grow') || lowerMessage.includes('acquire')) {
        suggestedJourneyTypes.push('customer-acquisition');
        keywords.push('customer acquisition', 'growth', 'clients');
      }

      // Content marketing intent
      if (lowerMessage.includes('blog') || lowerMessage.includes('content') || 
          lowerMessage.includes('marketing') || lowerMessage.includes('social media')) {
        suggestedJourneyTypes.push('content-marketing');
        keywords.push('content marketing', 'blog', 'social media');
      }

      // Sales optimization intent
      if (lowerMessage.includes('sales') || lowerMessage.includes('revenue') || 
          lowerMessage.includes('sell') || lowerMessage.includes('products')) {
        suggestedJourneyTypes.push('sales-optimization');
        keywords.push('sales', 'revenue', 'products');
      }

      // Product development intent
      if (lowerMessage.includes('product') || lowerMessage.includes('develop') || 
          lowerMessage.includes('launch') || lowerMessage.includes('new')) {
        suggestedJourneyTypes.push('product-development');
        keywords.push('product development', 'launch', 'innovation');
      }

      // Operational efficiency intent
      if (lowerMessage.includes('efficient') || lowerMessage.includes('process') || 
          lowerMessage.includes('optimize') || lowerMessage.includes('cost')) {
        suggestedJourneyTypes.push('operational-efficiency');
        keywords.push('efficiency', 'optimization', 'process');
      }

      // Digital transformation intent
      if (lowerMessage.includes('digital') || lowerMessage.includes('technology') || 
          lowerMessage.includes('automate') || lowerMessage.includes('modern')) {
        suggestedJourneyTypes.push('digital-transformation');
        keywords.push('digital transformation', 'technology', 'automation');
      }

      // Default to growth if no specific intent detected
      if (suggestedJourneyTypes.length === 0) {
        suggestedJourneyTypes.push('customer-acquisition');
        keywords.push('business growth', 'improvement');
      }

      const intent = suggestedJourneyTypes.length > 0 ? suggestedJourneyTypes[0] : 'general-growth';
      const confidence = Math.min(0.95, 0.7 + (suggestedJourneyTypes.length * 0.1));

      return {
        data: {
          intent,
          confidence,
          suggested_journey_types: suggestedJourneyTypes,
          keywords: [...new Set(keywords)]
        },
        error: null,
        success: true
      };
    }, `analyze intent from message`);
  }

  /**
   * Generate AI response based on conversation context
   */
  async generateAIResponse(
    session: JourneyIntakeSession, 
    userMessage: string
  ): Promise<ServiceResponse<{
    response: string;
    journey_identified?: JourneyType;
    next_questions: string[];
    confidence_score: number;
  }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('generateAIResponse', { session_id: session.id });

      // Analyze user intent
      const intentAnalysis = await this.analyzeIntent(userMessage);
      if (!intentAnalysis.success) {
        throw new Error('Failed to analyze user intent');
      }

      // Get journey types
      const journeyTypesResult = await this.getJourneyTypes();
      if (!journeyTypesResult.success) {
        throw new Error('Failed to get journey types');
      }

      const journeyTypes = journeyTypesResult.data;
      const suggestedJourneyType = journeyTypes.find(jt => 
        intentAnalysis.data.suggested_journey_types.includes(jt.id)
      );

      // Generate contextual response
      let response = '';
      let nextQuestions: string[] = [];
      const confidenceScore = intentAnalysis.data.confidence;

      if (session.conversation_history.length === 0) {
        // First message - welcome and gather initial information
        response = `Welcome to your business journey planning session! I'm here to help you identify the best path forward for your business goals.

I can see you're interested in ${intentAnalysis.data.keywords.join(', ')}. To better understand your specific needs, could you tell me more about:

1. What\'s your primary business goal right now?
2. What challenges are you currently facing?
3. What resources (time, budget, team) do you have available?`;
        
        nextQuestions = [
          'What industry are you in?',
          'How long have you been in business?',
          'What\'s your biggest pain point right now?'
        ];
      } else {
        // Follow-up conversation
        if (suggestedJourneyType) {
          response = `Based on what you've shared, I think the "${suggestedJourneyType.name}" journey might be perfect for you. 

This journey focuses on ${suggestedJourneyType.description.toLowerCase()} and typically takes ${suggestedJourneyType.estimated_duration}.

Would you like to:
1. Learn more about this specific journey?
2. Explore other options?
3. Start this journey right away?

What aspects of ${suggestedJourneyType.name.toLowerCase()} are most important to you?`;

          nextQuestions = [
            'What\'s your timeline for achieving this goal?',
            'What\'s your budget for this initiative?',
            'Do you have a team to support this journey?'
          ];
        } else {
          response = `I understand you're looking to improve your business. To help you choose the right journey, could you tell me more about:

1. Your specific business goals
2. Current challenges you're facing
3. What success looks like for you

This will help me recommend the most suitable journey for your situation.`;

          nextQuestions = [
            'What\'s your primary business objective?',
            'What\'s holding you back from achieving your goals?',
            'What would success look like in 6 months?'
          ];
        }
      }

      return {
        data: {
          response,
          journey_identified: suggestedJourneyType,
          next_questions: nextQuestions,
          confidence_score: confidenceScore
        },
        error: null,
        success: true
      };
    }, `generate AI response for session ${session.id}`);
  }

  /**
   * Generate AI response with enhanced context (user profile, business data, etc.)
   */
  async generateAIResponseWithContext(
    session: JourneyIntakeSession, 
    userMessage: string,
    enhancedContext?: any
  ): Promise<ServiceResponse<{
    response: string;
    journey_identified?: JourneyType;
    next_questions: string[];
    confidence_score: number;
  }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('generateAIResponseWithContext', { session_id: session.id });

      // Build enhanced system prompt with user context
      const systemPrompt = enhancedContext?.systemPrompt || 
        'You are an AI assistant helping with business operations.';

      // Use AIService with enhanced context
      const { AIService } = await import('@/services/ai/AIService');
      const aiService = new AIService();
      
      const aiResponse = await aiService.generateResponse(userMessage, {
        system: systemPrompt,
        userId: session.user_id,
        companyId: session.organization_id,
        context: enhancedContext
      });

      if (!aiResponse.success || !aiResponse.data) {
        throw new Error(aiResponse.error || 'AI response generation failed');
      }

      // Analyze intent for journey identification
      const intentAnalysis = await this.analyzeIntent(userMessage);
      const journeyTypesResult = await this.getJourneyTypes();
      
      let suggestedJourneyType: JourneyType | undefined;
      let nextQuestions: string[] = [];
      let confidenceScore = 0.8;

      if (intentAnalysis.success && journeyTypesResult.success) {
        const journeyTypes = journeyTypesResult.data;
        suggestedJourneyType = journeyTypes.find(jt => 
          intentAnalysis.data.suggested_journey_types.includes(jt.id)
        );
        confidenceScore = intentAnalysis.data.confidence;
      }

      // Generate contextual follow-up questions
      if (enhancedContext?.userContext) {
        nextQuestions = [
          'What specific business goals are you working on?',
          'How can I help you with your current challenges?',
          'What would success look like for you this quarter?'
        ];
      } else {
        nextQuestions = [
          'What industry are you in?',
          'How long have you been in business?',
          'What\'s your biggest pain point right now?'
        ];
      }

      return {
        data: {
          response: aiResponse.data.response,
          journey_identified: suggestedJourneyType,
          next_questions: nextQuestions,
          confidence_score: confidenceScore
        },
        error: null,
        success: true
      };
    }, `generate AI response with enhanced context`);
  }

  // ========================================================================
  // NEW API METHODS FOR JOURNEY INTAKE
  // ========================================================================

  /**
   * Start a new journey intake session via API
   */
  async startIntakeSession(organizationId: string, initialContext?: Record<string, any>): Promise<ServiceResponse<JourneyIntakeSession>> {
    return this.executeApiOperation(async () => {
      this.logMethodCall('startIntakeSession', { organizationId });

      const response = await this.apiClient.post('/journey-intake/session', {
        organization_id: organizationId,
        initial_context: initialContext || {}
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to start intake session');
      }

      return response.data;
    }, 'startIntakeSession');
  }

  /**
   * Add message to intake session via API
   */
  async addSessionMessage(sessionId: string, message: string, messageType: 'user' | 'ai' | 'system' = 'user'): Promise<ServiceResponse<any>> {
    return this.executeApiOperation(async () => {
      this.logMethodCall('addSessionMessage', { sessionId, messageType });

      const response = await this.apiClient.post(`/journey-intake/session/${sessionId}/message`, {
        message,
        message_type: messageType
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to add message');
      }

      return response.data;
    }, 'addSessionMessage');
  }

  /**
   * Complete intake session and create journey via API
   */
  async completeIntakeSession(sessionId: string, selectedJourneyId: string, journeyData?: Record<string, any>): Promise<ServiceResponse<any>> {
    return this.executeApiOperation(async () => {
      this.logMethodCall('completeIntakeSession', { sessionId, selectedJourneyId });

      const response = await this.apiClient.post(`/journey-intake/session/${sessionId}/complete`, {
        selected_journey_id: selectedJourneyId,
        journey_data: journeyData || {}
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to complete intake session');
      }

      return response.data;
    }, 'completeIntakeSession');
  }

  /**
   * Get session details and messages via API
   */
  async getSessionDetails(sessionId: string): Promise<ServiceResponse<{ session: JourneyIntakeSession; messages: any[] }>> {
    return this.executeApiOperation(async () => {
      this.logMethodCall('getSessionDetails', { sessionId });

      const response = await this.apiClient.get(`/journey-intake/session/${sessionId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get session details');
      }

      return response.data;
    }, 'getSessionDetails');
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const journeyIntakeService = new JourneyIntakeService();
