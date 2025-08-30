/**
 * Prompt Management System
 * 
 * Dynamically selects and generates appropriate system prompts based on:
 * - Agent type and expertise
 * - User context and profile
 * - Conversation history
 * - Business context
 */

const { logger } = require('../utils/logger');
const { query } = require('../database/connection');

/**
 * Get expert from database by expert_id
 */
async function getExpertFromDatabase(expertId) {
  // Debug: Log the expertId parameter
  console.log('getExpertFromDatabase received expertId:', expertId);
  
  try {
    const result = await query(
      'SELECT * FROM ai_experts WHERE expert_id = $1 AND is_active = true',
      [expertId]
    );
    
    if (result.rows.length === 0) {
      logger.warn('Expert not found in database, using fallback', { expertId });
      return getFallbackExpert(expertId);
    }
    
    const expert = result.rows[0];
    return {
      base: expert.base_prompt,
      style: expert.conversation_style,
      focus: expert.focus_area,
      expertise_level: expert.expertise_level,
      years_experience: expert.years_experience,
      keywords: expert.keywords || [],
      topics: expert.topics || [],
      building_block_categories: expert.building_block_categories || []
    };
  } catch (error) {
    logger.error('Error fetching expert from database', { expertId, error: error.message });
    return getFallbackExpert(expertId);
  }
}

/**
 * Select the most appropriate prompt for the given context
 */
async function selectPromptForContext(expertId, context) {
  // Debug: Log the expertId parameter
  console.log('selectPromptForContext received expertId:', expertId);
  
  try {
    // Get all available prompts for this expert
    const result = await query(
      `SELECT * FROM ai_expert_prompts 
       WHERE expert_id = $1 AND is_active = true 
       ORDER BY priority DESC, success_rate DESC`,
      [expertId]
    );
    
    if (result.rows.length === 0) {
      logger.warn('No prompts found for expert, using fallback', { expertId });
      return getFallbackExpert(expertId).base;
    }
    
    // Score each prompt based on context match
    const scoredPrompts = result.rows.map(prompt => {
      const score = calculatePromptScore(prompt, context);
      return { ...prompt, score };
    });
    
    // Sort by score and return the best match
    scoredPrompts.sort((a, b) => b.score - a.score);
    const bestPrompt = scoredPrompts[0];
    
    logger.info('Selected prompt for context', {
      expertId,
      promptName: bestPrompt.prompt_name,
      promptType: bestPrompt.prompt_type,
      score: bestPrompt.score,
      totalPrompts: scoredPrompts.length
    });
    
    return bestPrompt.prompt_text;
    
  } catch (error) {
    logger.error('Error selecting prompt from database', { expertId, error: error.message });
    return getFallbackExpert(expertId).base;
  }
}

/**
 * Calculate how well a prompt matches the current context
 */
function calculatePromptScore(prompt, context) {
  let score = 0;
  const conditions = prompt.trigger_conditions || {};
  
  // Base score from priority
  score += prompt.priority * 10;
  
  // Score based on trigger conditions
  Object.entries(conditions).forEach(([key, condition]) => {
    const contextValue = getContextValue(context, key);
    if (contextValue !== undefined) {
      score += evaluateCondition(contextValue, condition);
    }
  });
  
  // Bonus for high success rate
  if (prompt.success_rate > 0.8) {
    score += 20;
  }
  
  // Bonus for specific task prompts when appropriate
  if (prompt.prompt_type === 'specific_task' && context.userProfileAnalysis?.completenessPercentage < 70) {
    score += 30;
  }
  
  return score;
}

/**
 * Get value from context using dot notation
 */
function getContextValue(context, key) {
  const keys = key.split('.');
  let value = context;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * Evaluate a condition against a context value
 */
function evaluateCondition(contextValue, condition) {
  if (!condition || typeof condition !== 'object') return 0;
  
  const { operator, value } = condition;
  
  switch (operator) {
    case '<':
      return contextValue < value ? 50 : 0;
    case '>':
      return contextValue > value ? 50 : 0;
    case '===':
    case '=':
      return contextValue === value ? 50 : 0;
    case 'includes':
      return contextValue && contextValue.includes ? contextValue.includes(value) ? 50 : 0 : 0;
    default:
      return 0;
  }
}

/**
 * Fallback expert definitions (used if database is unavailable)
 */
function getFallbackExpert(expertId) {
  // If database is unavailable, return a minimal fallback
  logger.warn('Database unavailable, using minimal fallback expert', { expertId });
  
  return {
    base: `You are a business intelligence assistant. Your role is to provide clear, actionable insights and guidance to help users optimize their business operations.`,
    style: 'friendly and supportive',
    focus: 'general business assistance and guidance'
  };
}

// Context-specific prompt enhancements
const CONTEXT_ENHANCEMENTS = {
  profile_incomplete: {
    condition: (userProfile) => userProfile && userProfile.completenessPercentage < 70,
    enhancement: (userProfile) => `IMPORTANT: The user's profile is only ${userProfile.completenessPercentage}% complete. When they ask about their profile or missing information, provide specific guidance on what they need to add and why it's important.`
  },
  business_health_available: {
    condition: (businessHealth) => businessHealth && Object.keys(businessHealth).length > 0,
    enhancement: () => `You have access to the user's business health data. Use this information to provide personalized insights and recommendations based on their actual performance metrics.`
  },
  conversation_history: {
    condition: (conversationHistory) => conversationHistory && conversationHistory.length > 0,
    enhancement: () => `Maintain conversation context and build on previous discussions. Reference earlier points when relevant and avoid repeating information already covered.`
  },
  user_goals: {
    condition: (userProfile) => userProfile && userProfile.hasGoals,
    enhancement: () => `The user has defined business goals. Align your recommendations with their stated objectives and help them progress toward their targets.`
  },
  user_challenges: {
    condition: (userProfile) => userProfile && userProfile.hasChallenges,
    enhancement: () => `The user has identified specific challenges. Focus your guidance on addressing these pain points and providing solutions to their stated problems.`
  }
};

// Conversation pacing rules
const CONVERSATION_PACING_RULES = `
IMPORTANT CONVERSATION PACING RULES:
1. Ask ONLY ONE question at a time - never ask multiple questions in a single response
2. Build on their previous answers before asking the next question
3. Acknowledge what they've shared before moving forward
4. Be conversational and encouraging, not overwhelming
5. When you have enough information, provide a structured summary
6. Keep responses focused and concise
7. Don't overwhelm with too much information at once
`;

/**
 * Generate a dynamic system prompt based on context
 */
async function generateSystemPrompt(agentId, context) {
  // Debug: Log the agentId parameter
  console.log('generateSystemPrompt received agentId:', agentId);
  
  const {
    user,
    conversationHistory = [],
    dashboard = {},
    businessHealth = {},
    nextBestActions = [],
    userContext = {},
    userProfileAnalysis = {},
    pacingInsights = {}
  } = context;

  // Get expert from database
  const expert = await getExpertFromDatabase(agentId);
  
  // Select the most appropriate prompt for this context
  const selectedPrompt = await selectPromptForContext(agentId, context);
  
  // Start with selected prompt
  let systemPrompt = `${selectedPrompt}

${CONVERSATION_PACING_RULES}

Your conversation style should be ${expert.style}.
Your focus should be on ${expert.focus}.

Current context:
- User: ${user?.firstName || 'User'} ${user?.lastName || ''} (${user?.email || 'No email'})
- Dashboard data available: ${Object.keys(dashboard).length > 0 ? 'Yes' : 'No'}
- Business health data available: ${Object.keys(businessHealth).length > 0 ? 'Yes' : 'No'}
- Next best actions: ${nextBestActions.length} available
- User context: ${Object.keys(userContext).length > 0 ? 'Available' : 'Not available'}
- Conversation history: ${conversationHistory.length} previous messages`;

  // Add user profile analysis if available
  if (userProfileAnalysis && Object.keys(userProfileAnalysis).length > 0) {
    systemPrompt += `

USER PROFILE ANALYSIS:
- Profile completeness: ${userProfileAnalysis.completenessPercentage || 0}%
- Profile status: ${userProfileAnalysis.profileStatus || 'unknown'}
- Missing fields: ${userProfileAnalysis.missingFields?.join(', ') || 'None'}
- Recommendations: ${userProfileAnalysis.recommendations?.join('; ') || 'Profile is complete'}

IMPORTANT: When users ask about their profile, missing information, or what they need to complete, use the profile analysis above to provide specific, actionable answers. Tell them exactly what information is missing and why it's important.`;
  }

  // Add context-specific enhancements
  Object.entries(CONTEXT_ENHANCEMENTS).forEach(([key, enhancement]) => {
    if (enhancement.condition(context[key] || context)) {
      const enhancementText = typeof enhancement.enhancement === 'function' 
        ? enhancement.enhancement(context[key] || context)
        : enhancement.enhancement;
      systemPrompt += `\n\n${enhancementText}`;
    }
  });

  // Add personalized insights if available
  if (pacingInsights && Object.keys(pacingInsights).length > 0) {
    systemPrompt += `

Personalized insights for this user:
- Preferred response length: ~${pacingInsights.preferredResponseLength || 300} characters
- Pacing success rate: ${Math.round((pacingInsights.successRate || 0.8) * 100)}%
- Common issues to avoid: ${pacingInsights.commonIssues?.join(', ') || 'None detected'}
- Personalized tips: ${pacingInsights.personalizedTips?.join('; ') || 'Use standard pacing'}`;
  }

  // Add final instructions
  systemPrompt += `

Remember to:
1. Ask only ONE question at a time
2. Acknowledge their previous responses
3. Build on what they've shared
4. Keep responses focused and helpful
5. Be encouraging and supportive
6. Use available context to provide personalized insights
7. Follow the conversation pacing rules strictly`;

  // Add agent-specific instructions
  if (agentId === 'business-identity-consultant') {
    systemPrompt += `

SPECIFIC BUSINESS IDENTITY CONSULTANT INSTRUCTIONS:
You are helping an entrepreneur define their business identity. Your role is to:
1. Ask thoughtful follow-up questions to understand their business better
2. Help them clarify their vision, mission, and values
3. Identify their unique value proposition
4. Define their target audience and market positioning
5. Suggest a business name and tagline if appropriate

CRITICAL: You must ask exactly ONE question per response. If you accidentally write multiple questions, only keep the first one.
Start with the first question from the initial prompt and work through them one by one.`;
  }

  logger.info('Generated system prompt', {
    agentId,
    promptLength: systemPrompt.length,
    hasProfileAnalysis: !!(userProfileAnalysis && Object.keys(userProfileAnalysis).length > 0),
    hasBusinessHealth: !!(businessHealth && Object.keys(businessHealth).length > 0),
    conversationHistoryLength: conversationHistory.length
  });

  return systemPrompt;
}

/**
 * Select the most appropriate agent based on user message and context
 */
function selectAgent(userMessage, context) {
  const message = userMessage.toLowerCase();
  const { conversationHistory = [], userProfileAnalysis = {}, businessHealth = {} } = context;
  
  // Check for explicit agent requests first (7 Building Blocks + Executive Assistant)
  if (message.includes('switch to') || message.includes('use') || message.includes('need')) {
    // 7 Building Blocks
    if (message.includes('identity') || message.includes('brand') || message.includes('mission') || message.includes('vision')) {
      return 'business-identity-consultant';
    }
    if (message.includes('revenue') || message.includes('sales') || message.includes('pipeline') || message.includes('customers')) {
      return 'sales-expert';
    }
    if (message.includes('cash') || message.includes('finance') || message.includes('budget') || message.includes('cash flow')) {
      return 'finance-expert';
    }
    if (message.includes('delivery') || message.includes('operation') || message.includes('process') || message.includes('efficiency')) {
      return 'operations-expert';
    }
    if (message.includes('people') || message.includes('team') || message.includes('culture') || message.includes('hr')) {
      return 'people-expert';
    }
    if (message.includes('knowledge') || message.includes('data') || message.includes('insights') || message.includes('learning')) {
      return 'knowledge-expert';
    }
    if (message.includes('systems') || message.includes('automation') || message.includes('tools') || message.includes('processes')) {
      return 'systems-expert';
    }
    // Executive Assistant
    if (message.includes('strategy') || message.includes('executive') || message.includes('leadership') || message.includes('coordination')) {
      return 'executive-assistant';
    }
    // Legacy mappings
    if (message.includes('marketing') || message.includes('campaign') || message.includes('growth')) {
      return 'marketing-expert';
    }
  }
  
  // Analyze conversation context for topic shifts
  const conversationTopics = analyzeConversationTopics(conversationHistory);
  const currentTopic = detectCurrentTopic(message, conversationTopics);
  
  // Check for topic-based agent switching
  if (currentTopic && shouldSwitchAgent(currentTopic, context)) {
    return getAgentForTopic(currentTopic);
  }
  
  // Check for user profile completeness - if incomplete, use business-identity-consultant
  // But don't switch for simple greetings and require minimum conversation length
  if (userProfileAnalysis.completenessPercentage < 50 && 
      !isSimpleGreeting(message) && 
      conversationHistory.length >= 3) {
    return 'business-identity-consultant';
  }
  
  // Check for business health issues - if problems detected, use appropriate expert
  if (businessHealth.issues && businessHealth.issues.length > 0) {
    const primaryIssue = businessHealth.issues[0].category;
    return getAgentForBusinessIssue(primaryIssue);
  }
  
  // Default to executive-assistant (Executive Assistant)
  return 'executive-assistant';
}

/**
 * Analyze conversation topics from history
 */
function analyzeConversationTopics(conversationHistory) {
  const topics = {
    sales: 0,
    marketing: 0,
    finance: 0,
    operations: 0,
    strategy: 0,
    businessIdentity: 0
  };
  
  conversationHistory.forEach(msg => {
    const content = msg.content.toLowerCase();
    if (content.includes('sales') || content.includes('revenue') || content.includes('pipeline')) topics.sales++;
    if (content.includes('marketing') || content.includes('campaign') || content.includes('growth')) topics.marketing++;
    if (content.includes('finance') || content.includes('budget') || content.includes('cash')) topics.finance++;
    if (content.includes('operation') || content.includes('process') || content.includes('efficiency')) topics.operations++;
    if (content.includes('strategy') || content.includes('executive') || content.includes('leadership')) topics.strategy++;
    if (content.includes('business identity') || content.includes('brand') || content.includes('vision')) topics.businessIdentity++;
  });
  
  return topics;
}

/**
 * Check if message is a simple greeting
 */
function isSimpleGreeting(message) {
  const simpleGreetings = [
    'hello', 'hi', 'hey', 'yo', 'sup', 'whats up',
    'good morning', 'good afternoon', 'good evening',
    'morning', 'afternoon', 'evening'
  ];
  
  const messageLower = message.toLowerCase().trim();
  
  // Check for exact matches
  if (simpleGreetings.includes(messageLower)) {
    return true;
  }
  
  // Check for greetings with basic modifiers
  if (messageLower.startsWith('hello ') || messageLower.startsWith('hi ') || messageLower.startsWith('hey ')) {
    const afterGreeting = messageLower.substring(messageLower.indexOf(' ') + 1).trim();
    // If it's just a name or very short, consider it a simple greeting
    if (afterGreeting.length < 20 && !afterGreeting.includes('help') && !afterGreeting.includes('business')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect current topic from user message
 */
function detectCurrentTopic(message, conversationTopics) {
  const messageLower = message.toLowerCase();
  
  // Check for explicit topic mentions
  if (messageLower.includes('sales') || messageLower.includes('revenue') || messageLower.includes('pipeline')) return 'sales';
  if (messageLower.includes('marketing') || messageLower.includes('campaign') || messageLower.includes('growth')) return 'marketing';
  if (messageLower.includes('finance') || messageLower.includes('budget') || messageLower.includes('cash')) return 'finance';
  if (messageLower.includes('operation') || messageLower.includes('process') || messageLower.includes('efficiency')) return 'operations';
  if (messageLower.includes('strategy') || messageLower.includes('executive') || messageLower.includes('leadership')) return 'strategy';
  if (messageLower.includes('business identity') || messageLower.includes('brand') || messageLower.includes('vision')) return 'businessIdentity';
  
  // Check conversation history for dominant topic
  const dominantTopic = Object.entries(conversationTopics)
    .sort(([,a], [,b]) => b - a)[0];
  
  return dominantTopic && dominantTopic[1] > 0 ? dominantTopic[0] : null;
}

/**
 * Determine if we should switch agents based on topic
 */
function shouldSwitchAgent(currentTopic, context) {
  const { conversationHistory = [], lastAgentId = 'executive-assistant' } = context;
  
  // Don't switch if we're already using the right agent
  if (getAgentForTopic(currentTopic) === lastAgentId) {
    return false;
  }
  
  // Switch if this is a new topic and we have enough context
  if (conversationHistory.length > 4) {
    const recentMessages = conversationHistory.slice(-5);
    const topicMentions = recentMessages.filter(msg => 
      msg.content.toLowerCase().includes(currentTopic)
    ).length;
    
    return topicMentions >= 3; // Topic mentioned in 3+ recent messages (more conservative)
  }
  
  return false;
}

/**
 * Get appropriate agent for topic
 */
function getAgentForTopic(topic) {
  const topicAgents = {
    // 7 Building Blocks
    identity: 'business-identity-consultant',
    revenue: 'sales-expert',
    cash: 'finance-expert',
    delivery: 'operations-expert',
    people: 'people-expert',
    knowledge: 'knowledge-expert',
    systems: 'systems-expert',
    // Legacy mappings
    sales: 'sales-expert',
    marketing: 'marketing-expert',
    finance: 'finance-expert',
    operations: 'operations-expert',
    strategy: 'executive-assistant',
    businessIdentity: 'business-identity-consultant'
  };
  
  return topicAgents[topic] || 'executive-assistant';
}

/**
 * Get appropriate agent for business issues
 */
function getAgentForBusinessIssue(issueCategory) {
  const issueAgents = {
    // 7 Building Blocks
    'identity': 'business-identity-consultant',
    'revenue': 'sales-expert',
    'cash': 'finance-expert',
    'cash-flow': 'finance-expert',
    'delivery': 'operations-expert',
    'people': 'people-expert',
    'knowledge': 'knowledge-expert',
    'systems': 'systems-expert',
    // Legacy mappings
    'efficiency': 'operations-expert',
    'growth': 'marketing-expert',
    'strategy': 'executive-assistant'
  };
  
  return issueAgents[issueCategory] || 'executive-assistant';
}

/**
 * Validate prompt quality and completeness
 */
function validatePrompt(prompt, context) {
  const validation = {
    isValid: true,
    issues: [],
    suggestions: []
  };

  // Check for required components
  if (!prompt.includes('Ask only ONE question')) {
    validation.issues.push('Missing conversation pacing rules');
    validation.isValid = false;
  }

  if (!prompt.includes('Current context:')) {
    validation.issues.push('Missing context information');
    validation.suggestions.push('Include current user and business context');
  }

  if (prompt.length < 500) {
    validation.suggestions.push('Prompt may be too brief for comprehensive guidance');
  }

  if (prompt.length > 3000) {
    validation.issues.push('Prompt may be too long and could confuse the AI');
    validation.isValid = false;
  }

  return validation;
}

/**
 * Track prompt switching decisions and reasons
 */
function trackPromptSwitch(oldAgentId, newAgentId, reason, context) {
  const switchLog = {
    timestamp: new Date().toISOString(),
    oldAgent: oldAgentId,
    newAgent: newAgentId,
    reason: reason,
    conversationLength: context.conversationHistory?.length || 0,
    userMessage: context.userMessage?.substring(0, 100) || '',
    topics: analyzeConversationTopics(context.conversationHistory || [])
  };
  
  logger.info('Agent switch decision', switchLog);
  return switchLog;
}

/**
 * Determine if prompt should be switched based on conversation analysis
 */
function shouldSwitchPrompt(currentAgentId, userMessage, context) {
  console.log('shouldSwitchPrompt received currentAgentId:', currentAgentId);
  console.log('shouldSwitchPrompt received userMessage:', userMessage);
  const newAgentId = selectAgent(userMessage, context);
  console.log('shouldSwitchPrompt selectAgent returned:', newAgentId);
  
  if (newAgentId === currentAgentId) {
    return { shouldSwitch: false, reason: 'Same agent appropriate' };
  }
  
  // Determine reason for switch
  let reason = 'Unknown';
  const { conversationHistory = [], userProfileAnalysis = {}, businessHealth = {} } = context;
  
  // Require minimum conversation length for most switches (except explicit requests)
  const hasMinimumConversation = conversationHistory.length >= 3;
  
  if (userMessage.toLowerCase().includes('switch to') || userMessage.toLowerCase().includes('use')) {
    reason = 'Explicit user request';
  } else if (userProfileAnalysis.completenessPercentage < 50 && hasMinimumConversation) {
    reason = 'Incomplete user profile detected after conversation established';
  } else if (businessHealth.issues && businessHealth.issues.length > 0 && hasMinimumConversation) {
    reason = 'Business health issues detected after conversation established';
  } else if (conversationHistory.length > 4) {
    // Require more conversation history for topic-based switching
    const topics = analyzeConversationTopics(conversationHistory);
    const currentTopic = detectCurrentTopic(userMessage, topics);
    if (currentTopic && getAgentForTopic(currentTopic) !== currentAgentId) {
      reason = `Topic shift detected: ${currentTopic}`;
    }
  }
  
  return {
    shouldSwitch: true,
    newAgentId,
    reason,
    switchLog: trackPromptSwitch(currentAgentId, newAgentId, reason, context)
  };
}

module.exports = {
  generateSystemPrompt,
  selectAgent,
  validatePrompt,
  shouldSwitchPrompt,
  analyzeConversationTopics,
  detectCurrentTopic,
  isSimpleGreeting,
  trackPromptSwitch,
  selectPromptForContext,
  getExpertFromDatabase,
  calculatePromptScore,
  CONVERSATION_PACING_RULES
};
