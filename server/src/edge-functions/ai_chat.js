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
const { getAgentConfig } = require('../config/agentCatalog');
const { ALL_TOOLS } = require('../config/agentTools');

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
    enableOpenClaw: true,
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
function formatUserContextSummary(userContext = {}) {
  if (!userContext || typeof userContext !== 'object') {
    return null;
  }

  const profile = userContext.profile && typeof userContext.profile === 'object'
    ? userContext.profile
    : {};

  const company = userContext.company && typeof userContext.company === 'object'
    ? userContext.company
    : {};

  const details = [];

  const fallbackCompanyName = profile.companyName || profile.company || profile.profileCompanyName;
  const resolvedCompanyName = company.name || fallbackCompanyName;

  const fullName = profile.displayName
    || [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()
    || profile.fullName
    || profile.name;

  if (fullName) {
    details.push(`Name: ${fullName}`);
  }

  if (profile.email) {
    details.push(`Primary Email: ${profile.email}`);
  } else if (profile.businessEmail) {
    details.push(`Primary Email: ${profile.businessEmail}`);
  }

  if (profile.role) {
    details.push(`Internal Role: ${profile.role}`);
  }

  if (profile.jobTitle) {
    details.push(`Job Title: ${profile.jobTitle}`);
  }

  if (resolvedCompanyName) {
    details.push(`Company: ${resolvedCompanyName}`);
  }

  if (company.industry) {
    details.push(`Industry: ${company.industry}`);
  }

  if (company.size) {
    details.push(`Company Size: ${company.size}`);
  }

  if (profile.location) {
    details.push(`Location: ${profile.location}`);
  }

  if (profile.preferences && typeof profile.preferences === 'object') {
    const { goals, focusAreas } = profile.preferences;
    if (Array.isArray(goals) && goals.length > 0) {
      details.push(`Goals: ${goals.join(', ')}`);
    }
    if (Array.isArray(focusAreas) && focusAreas.length > 0) {
      details.push(`Focus Areas: ${focusAreas.join(', ')}`);
    }
  }

  if (details.length === 0) {
    return null;
  }

  return details.map(detail => `- ${detail}`).join('\n');
}

function generateAgentSystemPrompt(agentId, userContext = {}, businessHealth = {}) {
  const agent = getAgentConfig(agentId);

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

  // Add tool/capability awareness so the agent knows what it can do
  if (ALL_TOOLS && ALL_TOOLS.length > 0) {
    const toolList = ALL_TOOLS.map(t => `- ${t.name}: ${t.description}`).join('\n');
    systemPrompt += `

AVAILABLE CAPABILITIES:
You have access to the following tools and can use them to take action on behalf of the user:
${toolList}

IMPORTANT: You CAN take action. When a user asks you to do something (clone a repo, run a command, search the web, create a file, etc.), use your available tools to do it. Do NOT tell the user you lack access or cannot perform actions — you are an agentic assistant with real execution capabilities. If a specific action is truly outside your tools, explain what alternative approach you can take instead.`;
  }

  // Add business health context if available
  if (businessHealth && Object.keys(businessHealth).length > 0) {
    systemPrompt += `\n\nBUSINESS HEALTH CONTEXT: The user has connected business health data. Use this information to provide more personalized insights.`;
  }

  // Add user context if available
  const userContextSummary = formatUserContextSummary(userContext);
  if (userContextSummary) {
    systemPrompt += `\n\nUSER CONTEXT:\n${userContextSummary}\nUse these details when responding to questions about the user. If the user asks about their identity or requests personal information, rely on the profile data above.`;
  } else if (userContext && Object.keys(userContext).length > 0) {
    systemPrompt += `\n\nUSER CONTEXT: Consider the user's business context when providing recommendations.`;
  }

  return systemPrompt;
}

async function buildUserProfileContext(userId, providedContext = {}, fallbackUser = null) {
  const safeContext = providedContext && typeof providedContext === 'object'
    ? { ...providedContext }
    : {};

  const existingProfile = safeContext.profile && typeof safeContext.profile === 'object'
    ? { ...safeContext.profile }
    : {};

  if (fallbackUser && typeof fallbackUser === 'object') {
    if (fallbackUser.email && !existingProfile.email) {
      existingProfile.email = fallbackUser.email;
    }
    const fallbackFirstName = fallbackUser.firstName || fallbackUser.first_name;
    if (fallbackFirstName && !existingProfile.firstName) {
      existingProfile.firstName = fallbackFirstName;
    }
    const fallbackLastName = fallbackUser.lastName || fallbackUser.last_name;
    if (fallbackLastName && !existingProfile.lastName) {
      existingProfile.lastName = fallbackLastName;
    }
    const fallbackDisplayName = fallbackUser.displayName || fallbackUser.display_name;
    if (fallbackDisplayName && !existingProfile.displayName) {
      existingProfile.displayName = fallbackDisplayName;
    }

    if (Object.keys(existingProfile).length > 0) {
      safeContext.profile = existingProfile;
    }
  } else if (Object.keys(existingProfile).length > 0) {
    safeContext.profile = existingProfile;
  }

  if (!userId) {
    return safeContext;
  }

  try {
    const { data, error } = await query(
      `SELECT 
        up.user_id,
        up.email,
        up.first_name,
        up.last_name,
        up.display_name,
        up.company_name AS profile_company_name,
        up.company_id,
        up.job_title,
        up.role,
        up.department,
        up.location,
        up.business_email,
        up.personal_email,
        up.preferences,
        c.name AS company_name,
        c.industry AS company_industry,
        c.size AS company_size,
        c.website AS company_website
      FROM user_profiles up
      LEFT JOIN companies c ON up.company_id = c.id
      WHERE up.user_id = $1
      LIMIT 1`,
      [userId]
    );

    if (error) {
      throw new Error(error);
    }

    if (!data || data.length === 0) {
      logger.info('No user profile context found for AI chat', { userId });
      return safeContext;
    }

    const profile = data[0];

    const profileContext = {
      userId: profile.user_id,
      email: profile.email || profile.business_email || profile.personal_email,
      businessEmail: profile.business_email,
      personalEmail: profile.personal_email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      displayName: profile.display_name,
      fullName: profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim(),
      companyName: profile.profile_company_name || profile.company_name,
      companyId: profile.company_id,
      jobTitle: profile.job_title,
      role: profile.role,
      department: profile.department,
      location: profile.location,
      preferences: profile.preferences || existingProfile.preferences
    };

    safeContext.profile = {
      ...safeContext.profile,
      ...profileContext
    };

    if (profile.company_id || profile.company_name || profile.company_industry) {
      const companyContext = {
        id: profile.company_id,
        name: profile.company_name || profile.profile_company_name,
        industry: profile.company_industry,
        size: profile.company_size,
        website: profile.company_website
      };

      safeContext.company = {
        ...(safeContext.company && typeof safeContext.company === 'object' ? safeContext.company : {}),
        ...companyContext
      };
    }

    return safeContext;
  } catch (error) {
    logger.warn('Failed to build user profile context for AI chat', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return safeContext;
  }
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
    userContext: providedUserContext = {},
    user: contextUser = null,
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
    const userContext = await buildUserProfileContext(user?.id, providedUserContext, contextUser);

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
        userContext,
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
