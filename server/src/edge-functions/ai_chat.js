/**
 * AI Chat Edge Function
 * 
 * Handles AI chat conversations using actual AI models instead of predetermined responses
 */

const { query } = require('../database/connection');
const { createError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { 
  generateSystemPrompt, 
  selectAgent, 
  validatePrompt, 
  shouldSwitchPrompt 
} = require('./promptManager');

// Initialize conversation history using local database
let conversationHistoryEnabled = true;

// Test database connection for conversation history
(async () => {
  try {
    await query('SELECT 1');
    logger.info('Database connection available for conversation history');
  } catch (error) {
    logger.warn('Database connection not available, conversation history will use frontend messages');
    conversationHistoryEnabled = false;
  }
})();

// Initialize the AI Gateway service for actual AI responses
let aiGateway;
try {
  const { NexusAIGatewayService } = require('../../services/NexusAIGatewayService');
  aiGateway = new NexusAIGatewayService({
    enableOpenAI: true,
    enableOpenRouter: true,
    enableLocal: true,
    maxRetries: 3,
    retryDelayMs: 1000,
    enableUsageTracking: true,
    enableCircuitBreaker: true,
  });
  logger.info('AI Gateway service initialized for actual AI responses');
} catch (error) {
  logger.error('Failed to initialize AI Gateway service:', error.message);
  logger.warn('Chat will use fallback responses until AI Gateway is configured');
  aiGateway = null;
}

/**
 * Generate system prompt for the selected agent
 */
function generateAgentSystemPrompt(agentId, userContext = {}, businessHealth = {}) {
  const agentConfigs = {
    'executive-assistant': {
      name: 'Alex',
      role: 'Executive Assistant',
      expertise: 'business strategy, decision-making, and high-level planning',
      style: 'professional, strategic, and business-focused',
      background: '25+ years Fortune 500 executive experience'
    },
    'business-identity-consultant': {
      name: 'David',
      role: 'Business Identity Consultant',
      expertise: 'business identity definition, vision clarification, and value proposition development',
      style: 'consultative, encouraging, and business-focused',
      background: '7+ years digital marketing and brand strategy expertise'
    },
    'sales-dept': {
      name: 'Sarah',
      role: 'Sales Department Specialist',
      expertise: 'sales strategy, pipeline management, revenue optimization',
      style: 'relationship-focused and consultative',
      background: '5+ years B2B sales and customer success experience'
    },
    'finance-dept': {
      name: 'Emma',
      role: 'Finance Department Specialist',
      expertise: 'financial planning, budget analysis, cost optimization',
      style: 'detailed, analytical, and data-driven',
      background: '8+ years financial analysis and modeling expertise'
    },
    'operations-dept': {
      name: 'Michael',
      role: 'Operations Department Specialist',
      expertise: 'process optimization, workflow automation, operational efficiency',
      style: 'process-oriented and systematic',
      background: '10+ years process optimization and workflow management'
    },
    'marketing-dept': {
      name: 'David',
      role: 'Marketing Department Specialist',
      expertise: 'marketing strategy, campaign optimization, growth initiatives',
      style: 'creative and data-driven',
      background: '7+ years digital marketing and brand strategy expertise'
    },
    'analyst': {
      name: 'Emma',
      role: 'Business Analyst',
      expertise: 'data analysis, insights, and actionable recommendations',
      style: 'detailed, analytical, and data-driven',
      background: '8+ years financial analysis and modeling expertise'
    },
    'assistant': {
      name: 'Sarah',
      role: 'Business Assistant',
      expertise: 'user support, guidance, and practical assistance',
      style: 'helpful, supportive, and user-friendly',
      background: '5+ years B2B sales and customer success experience'
    },
    'specialist': {
      name: 'Michael',
      role: 'Business Specialist',
      expertise: 'specialized knowledge, best practices, and expert guidance',
      style: 'expert, knowledgeable, and domain-specific',
      background: '10+ years process optimization and workflow management'
    }
  };

  const agent = agentConfigs[agentId] || agentConfigs['assistant'];
  
  let systemPrompt = `You are ${agent.name}, a ${agent.role} with ${agent.background}. You specialize in ${agent.expertise}.

Your communication style is ${agent.style}. You should:
- Ask only ONE question at a time to maintain conversation pacing
- Build on previous answers before asking the next question
- Acknowledge what the user has shared before moving forward
- Be conversational and encouraging, not overwhelming
- Provide clear, actionable advice
- Keep responses focused and concise (under 200 words)
- Explain your reasoning when making recommendations

IMPORTANT: You are helping business owners and entrepreneurs who may not have formal business education. Make your advice approachable and easy to understand.`;

  // Add business health context if available
  if (businessHealth && Object.keys(businessHealth).length > 0) {
    systemPrompt += `\n\nBUSINESS HEALTH CONTEXT: The user has connected business health data. Use this information to provide more personalized insights.`;
  }

  // Add user context if available
  if (userContext && Object.keys(userContext).length > 0) {
    systemPrompt += `\n\nUSER CONTEXT: Consider the user's business context when providing recommendations.`;
  }

  return systemPrompt;
}

/**
 * Generate actual AI response using the AI Gateway
 */
async function generateAIResponse(message, systemPrompt, conversationHistory, agentId = 'assistant', businessHealth = {}) {
  try {
    // Check if AI Gateway is available
    if (!aiGateway) {
      logger.warn('AI Gateway not available, using fallback response');
      return generateFallbackResponse(message, agentId, businessHealth);
    }

    // Prepare conversation messages for the AI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Add business health context to the user message if available
    if (businessHealth && Object.keys(businessHealth).length > 0) {
      const healthContext = `Business Health Context: ${JSON.stringify(businessHealth, null, 2)}`;
      messages[messages.length - 1].content += `\n\n${healthContext}`;
    }

    logger.info('Generating AI response with messages:', {
      messageCount: messages.length,
      agentId,
      hasBusinessHealth: !!businessHealth && Object.keys(businessHealth).length > 0
    });

    // Call the AI Gateway service
    const response = await aiGateway.chat({
      messages,
      role: 'chat',
      sensitivity: 'internal',
      tenantId: 'nexus',
      budgetCents: 50, // 50 cents budget per request
      latencyTargetMs: 10000 // 10 second timeout
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate AI response');
    }

    const aiResponse = response.data?.message;
    if (!aiResponse) {
      throw new Error('No response content received from AI');
    }

    logger.info('AI response generated successfully', {
      responseLength: aiResponse.length,
      agentId
    });

    return aiResponse;

  } catch (error) {
    logger.error('Error generating AI response:', error);
    
    // Log the specific error for debugging
    if (error.message.includes('API key')) {
      logger.error('AI Gateway configuration issue - check API keys');
      return `I apologize, but the AI service is not properly configured. Please contact support.`;
    } else if (error.message.includes('No suitable AI provider')) {
      logger.error('No AI providers available');
      return `I apologize, but no AI providers are currently available. Please try again later.`;
    } else {
      logger.error('Unknown AI error:', error.message);
      return `I apologize, but I'm having trouble processing your request right now. Could you please try rephrasing your question or try again in a moment?`;
    }
  }
}

/**
 * Generate fallback response when AI Gateway is not available
 */
function generateFallbackResponse(message, agentId, businessHealth) {
  const userMessage = message.toLowerCase();
  
  // Simple keyword-based responses as fallback
  if (userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('hey')) {
    return "Hello! I'm here to help you with your business needs. What would you like to work on today?";
  }
  
  if (userMessage.includes('business') || userMessage.includes('company')) {
    return "I'd be happy to help you with your business. What specific aspect would you like to focus on?";
  }
  
  if (userMessage.includes('strategy') || userMessage.includes('plan')) {
    return "Business strategy is crucial for success. What's your primary goal right now?";
  }
  
  if (userMessage.includes('finance') || userMessage.includes('money') || userMessage.includes('revenue')) {
    return "Financial health is key to business sustainability. What financial aspect would you like to discuss?";
  }
  
  if (userMessage.includes('customer') || userMessage.includes('client')) {
    return "Understanding your customers is essential. What aspect of customer relationships would you like to explore?";
  }
  
  if (userMessage.includes('team') || userMessage.includes('people')) {
    return "Your team is your greatest asset. What aspect of team management would you like to discuss?";
  }
  
  if (userMessage.includes('growth') || userMessage.includes('expand')) {
    return "Business growth requires careful planning. What's your growth objective?";
  }
  
  return "I'm here to help you optimize your business. What specific area would you like to work on?";
}

/**
 * Analyze business health data and provide insights
 */
function analyzeBusinessHealth(businessHealth) {
  if (!businessHealth || Object.keys(businessHealth).length === 0) {
    return null;
  }
  
  const insights = [];
  const scores = {};
  
  // Analyze different business areas
  if (businessHealth.finance) {
    const financeScore = businessHealth.finance.score || 0;
    scores.finance = financeScore;
    if (financeScore >= 80) {
      insights.push("Your financial health is excellent with strong revenue and cash flow management.");
    } else if (financeScore >= 60) {
      insights.push("Your financial health is good but there's room for improvement in cash flow or profitability.");
    } else {
      insights.push("Your financial health needs attention - focus on improving cash flow and profitability.");
    }
  }
  
  if (businessHealth.operations) {
    const opsScore = businessHealth.operations.score || 0;
    scores.operations = opsScore;
    if (opsScore >= 80) {
      insights.push("Your operational efficiency is outstanding with streamlined processes.");
    } else if (opsScore >= 60) {
      insights.push("Your operations are solid but could benefit from process optimization.");
    } else {
      insights.push("Your operations need improvement - consider streamlining workflows and reducing inefficiencies.");
    }
  }
  
  if (businessHealth.customers) {
    const customerScore = businessHealth.customers.score || 0;
    scores.customers = customerScore;
    if (customerScore >= 80) {
      insights.push("Your customer satisfaction and retention are excellent.");
    } else if (customerScore >= 60) {
      insights.push("Your customer relationships are good but could be strengthened.");
    } else {
      insights.push("Your customer satisfaction needs work - focus on improving customer experience and retention.");
    }
  }
  
  return {
    insights,
    scores,
    overallHealth: Object.values(scores).length > 0 ? 
      Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length : 0
  };
}

/**
 * Main AI chat function
 */
async function ai_chat(payload, user) {
  logger.info('AI chat function called', { userId: user?.id });
  
  const { message, context = {}, attachments = [] } = payload;
  
  const {
    conversationId,
    agentId: initialAgentId = 'executive-assistant',
    previousMessages = [],
    userContext = {},
    dashboard = {},
    nextBestActions = [],
    businessHealth = {}
  } = context;
  
  let agentId = initialAgentId;

  try {
    if (!message || !message.trim()) {
      throw new Error('Message is required');
    }

    // Validate and sanitize the message
    const sanitizedMessage = message.trim();
    if (sanitizedMessage.length > 2000) {
      throw new Error('Message too long (max 2000 characters)');
    }

    // Generate system prompt for the agent
    const systemPrompt = generateAgentSystemPrompt(agentId, userContext, businessHealth);
    
    // Prepare conversation history
    const conversationHistory = previousMessages || [];
    
    // Generate AI response
    const aiResponse = await generateAIResponse(
      sanitizedMessage, 
      systemPrompt, 
      conversationHistory, 
      agentId, 
      businessHealth
    );

    // Create response object
    const response = {
      success: true,
      data: {
        message: aiResponse,
        agentId,
        conversationId,
        timestamp: new Date().toISOString(),
        sources: [],
        routing: {
          agent: agentId,
          confidence: 0.95,
          reasoning: 'AI-generated response based on conversation context'
        }
      }
    };

    logger.info('AI chat response generated successfully', {
      userId: user?.id,
      agentId,
      responseLength: aiResponse.length
    });

    return response;

  } catch (error) {
    logger.error('Error in AI chat:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to process chat message',
      data: {
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        agentId,
        conversationId,
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = { ai_chat };
