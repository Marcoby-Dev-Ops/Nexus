/**
 * Intake Agent Edge Function
 * 
 * Central router for all user inputs that creates brain tickets and routes
 * to appropriate agents and processes.
 * 
 * Now enhanced with LLM processing for intelligent analysis and routing
 */

const { query } = require('../database/connection');
const { createError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

// Import AI processing capabilities
const { processWithLLM } = require('../services/aiService');

/**
 * Convert hash string to UUID format
 * @param {string} hash - The hash string to convert
 * @returns {string} - UUID formatted string
 */
function hashToUUID(hash) {
  const normalizedHash = hash.replace(/[^a-f0-9]/gi, '').substring(0, 32);
  return [
    normalizedHash.substring(0, 8),
    normalizedHash.substring(8, 12),
    normalizedHash.substring(12, 16),
    normalizedHash.substring(16, 20),
    normalizedHash.substring(20, 32)
  ].join('-');
}

/**
 * Generate a default organization ID for users without one
 */
function getDefaultOrganizationId(userId) {
  // Use the user's ID to generate a consistent organization ID
  const userHash = hashToUUID(userId);
  // Create a deterministic organization ID based on user ID
  return userHash.replace(/[0-9]/g, 'a'); // Replace numbers with 'a' to make it different from user ID
}

/**
 * AI-powered input analysis with intelligent intent recognition
 */
async function analyzeInputWithAI(input, context = {}) {
  try {
    const analysisPrompt = `
You are an Intake Agent responsible for analyzing user input and determining the best routing and processing approach.

USER INPUT: "${input}"

CONTEXT:
- Source: ${context.source || 'unknown'}
- User ID: ${context.userId || 'unknown'}
- Organization: ${context.organization_id || 'unknown'}
- Previous interactions: ${context.previousInteractions || 'none'}
- User preferences: ${context.userPreferences || 'none'}

ANALYSIS TASKS:
1. Determine the user's primary intent and goal
2. Assess urgency and priority level
3. Identify complexity and scope
4. Detect emotional tone and sentiment
5. Recognize business context and domain
6. Suggest optimal routing and processing
7. Identify potential dependencies or related work
8. Assess actionability and next steps

Please provide your analysis in JSON format with the following structure:
{
  "intent": {
    "primary": "business_identity|business_planning|revenue_setup|cash_flow|operations_setup|technical_support|question|request|feedback",
    "secondary": ["additional intents"],
    "confidence": 0-100,
    "reasoning": "explanation of intent determination"
  },
  "priority": {
    "level": "low|medium|high|critical",
    "reasoning": "why this priority level",
    "urgency": "low|medium|high|immediate"
  },
  "complexity": {
    "level": "low|medium|high|expert",
    "factors": ["what makes it complex"],
    "estimatedEffort": "low|medium|high|extensive"
  },
  "topics": {
    "primary": "business|finance|marketing|operations|technology|strategy|team|customer",
    "secondary": ["additional topics"],
    "businessDomain": "startup|saas|ecommerce|consulting|manufacturing|service|other"
  },
  "emotionalTone": {
    "sentiment": "positive|negative|neutral|urgent|frustrated|excited",
    "intensity": "low|medium|high",
    "context": "what's driving the emotion"
  },
  "actionability": {
    "level": "low|medium|high|immediate",
    "nextSteps": ["specific actions needed"],
    "dependencies": ["what needs to happen first"]
  },
  "routing": {
    "recommendedAgent": "business-identity-consultant|business-strategy-consultant|revenue-specialist|finance-specialist|operations-specialist|technical-support|assistant",
    "recommendedPlaybook": "identity_setup|strategy_planning|revenue_setup|cash_flow_setup|operations_setup|technical_support|general_assistance",
    "confidence": 0-100,
    "reasoning": "why this routing recommendation"
  },
  "insights": {
    "patterns": ["any patterns you notice"],
    "opportunities": ["optimization opportunities"],
    "risks": ["potential issues or blockers"],
    "suggestions": ["additional recommendations"]
  }
}

Focus on understanding the user's business context and providing actionable, intelligent routing decisions.
`;

    const aiResponse = await processWithLLM(analysisPrompt, {
      model: 'zai/glm-4.7',
      temperature: 0.3,
      maxTokens: 2000
    });

    // Parse the AI response
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResponse.data.response);
    } catch (parseError) {
      logger.warn('Failed to parse AI analysis, using rule-based fallback', { error: parseError.message });
      return analyzeInput(input, context); // Fallback to rule-based
    }

    // Transform AI analysis to match expected format
    return {
      intent: aiAnalysis.intent.primary,
      priority: aiAnalysis.priority.level,
      complexity: aiAnalysis.complexity.level,
      urgency: aiAnalysis.priority.urgency,
      topics: [aiAnalysis.topics.primary, ...aiAnalysis.topics.secondary],
      emotions: aiAnalysis.emotionalTone.sentiment,
      actionability: aiAnalysis.actionability.level,
      estimatedEffort: aiAnalysis.complexity.estimatedEffort,
      confidence: aiAnalysis.intent.confidence / 100,
      aiInsights: {
        reasoning: aiAnalysis.intent.reasoning,
        routingConfidence: aiAnalysis.routing.confidence,
        patterns: aiAnalysis.insights.patterns,
        opportunities: aiAnalysis.insights.opportunities,
        risks: aiAnalysis.insights.risks,
        suggestions: aiAnalysis.insights.suggestions
      }
    };

  } catch (error) {
    logger.error('Error in AI input analysis:', error);
    return analyzeInput(input, context); // Fallback to rule-based
  }
}

/**
 * AI-powered agent selection with intelligent reasoning
 */
async function selectAgentWithAI(analysis, context = {}) {
  try {
    const selectionPrompt = `
You are an Intake Agent selecting the most appropriate specialist agent for a user request.

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

CONTEXT:
${JSON.stringify(context, null, 2)}

AVAILABLE AGENTS:
- business-identity-consultant: Business naming, branding, identity, positioning
- business-strategy-consultant: Strategic planning, goals, roadmaps, business models
- revenue-specialist: Revenue models, pricing, monetization, sales strategies
- finance-specialist: Cash flow, budgeting, financial planning, accounting
- operations-specialist: Process optimization, workflows, efficiency, systems
- technical-support: Technical issues, bugs, system problems, integrations
- assistant: General questions, guidance, information, support

SELECTION CRITERIA:
1. Match intent to agent expertise
2. Consider complexity and user needs
3. Factor in urgency and priority
4. Account for user context and history
5. Optimize for best outcome

Provide your selection in JSON format:
{
  "selectedAgent": "agent-name",
  "confidence": 0-100,
  "reasoning": "detailed explanation of selection",
  "alternatives": ["backup agents if primary unavailable"],
  "specialInstructions": ["any specific guidance for the agent"],
  "expectedOutcome": "what the user should expect",
  "estimatedTimeframe": "immediate|1-2 days|1 week|ongoing"
}

Focus on matching the user's needs with the most capable and appropriate agent.
`;

    const aiResponse = await processWithLLM(selectionPrompt, {
      model: 'zai/glm-4.7',
      temperature: 0.2,
      maxTokens: 1000
    });

    let aiSelection;
    try {
      aiSelection = JSON.parse(aiResponse.data.response);
    } catch (parseError) {
      logger.warn('Failed to parse AI agent selection, using rule-based fallback', { error: parseError.message });
      return selectAgent(analysis, context); // Fallback to rule-based
    }

    return {
      agent: aiSelection.selectedAgent,
      confidence: aiSelection.confidence / 100,
      reasoning: aiSelection.reasoning,
      alternatives: aiSelection.alternatives || [],
      specialInstructions: aiSelection.specialInstructions || [],
      expectedOutcome: aiSelection.expectedOutcome,
      estimatedTimeframe: aiSelection.estimatedTimeframe
    };

  } catch (error) {
    logger.error('Error in AI agent selection:', error);
    return { agent: selectAgent(analysis, context) }; // Fallback to rule-based
  }
}

/**
 * AI-powered playbook selection with intelligent workflow planning
 */
async function selectPlaybookWithAI(analysis, context = {}) {
  try {
    const selectionPrompt = `
You are an Intake Agent selecting the most appropriate playbook (workflow template) for a user request.

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

CONTEXT:
${JSON.stringify(context, null, 2)}

AVAILABLE PLAYBOOKS:
- identity_setup: Business identity, branding, positioning workflow
- strategy_planning: Strategic planning, goal setting, roadmap creation
- revenue_setup: Revenue model development, pricing strategy, monetization
- cash_flow_setup: Cash flow management, budgeting, financial planning
- operations_setup: Process optimization, workflow design, efficiency improvement
- technical_support: Technical issue resolution, system troubleshooting
- general_assistance: General guidance, information, support workflow

SELECTION CRITERIA:
1. Match intent to playbook purpose
2. Consider complexity and scope
3. Factor in user readiness and resources
4. Account for dependencies and prerequisites
5. Optimize for successful completion

Provide your selection in JSON format:
{
  "selectedPlaybook": "playbook-name",
  "confidence": 0-100,
  "reasoning": "detailed explanation of selection",
  "customization": ["modifications needed for this specific case"],
  "prerequisites": ["what needs to be in place first"],
  "estimatedDuration": "1 hour|1 day|1 week|1 month|ongoing",
  "successCriteria": ["how to measure completion"],
  "riskFactors": ["potential challenges or blockers"]
}

Focus on selecting a playbook that will guide the user to successful completion of their goal.
`;

    const aiResponse = await processWithLLM(selectionPrompt, {
      model: 'zai/glm-4.7',
      temperature: 0.3,
      maxTokens: 1200
    });

    let aiSelection;
    try {
      aiSelection = JSON.parse(aiResponse.data.response);
    } catch (parseError) {
      logger.warn('Failed to parse AI playbook selection, using rule-based fallback', { error: parseError.message });
      return selectPlaybook(analysis, context); // Fallback to rule-based
    }

    return {
      playbook: aiSelection.selectedPlaybook,
      confidence: aiSelection.confidence / 100,
      reasoning: aiSelection.reasoning,
      customization: aiSelection.customization || [],
      prerequisites: aiSelection.prerequisites || [],
      estimatedDuration: aiSelection.estimatedDuration,
      successCriteria: aiSelection.successCriteria || [],
      riskFactors: aiSelection.riskFactors || []
    };

  } catch (error) {
    logger.error('Error in AI playbook selection:', error);
    return { playbook: selectPlaybook(analysis, context) }; // Fallback to rule-based
  }
}

/**
 * AI-powered brain ticket creation with intelligent categorization
 */
async function createBrainTicketWithAI(user, analysis, input, context = {}) {
  try {
    const ticketPrompt = `
You are an Intake Agent creating a brain ticket (actionable work item) from user input.

USER INPUT: "${input}"

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

CONTEXT:
${JSON.stringify(context, null, 2)}

TICKET CREATION TASKS:
1. Create a clear, actionable title
2. Write a comprehensive description
3. Set appropriate priority and category
4. Add relevant tags for organization
5. Include AI insights and routing information
6. Suggest initial next steps
7. Identify success criteria

Provide your ticket data in JSON format:
{
  "title": "clear, actionable title (max 100 chars)",
  "description": "comprehensive description including context, goals, and requirements",
  "priority": "low|medium|high|critical",
  "category": "business|finance|marketing|operations|technology|strategy|team|customer",
  "tags": ["relevant", "tags", "for", "organization"],
  "ai_insights": {
    "intent": "primary intent",
    "confidence": 0-100,
    "analysis": "detailed analysis summary",
    "routing": {
      "agent": "selected agent",
      "playbook": "selected playbook",
      "reasoning": "routing explanation"
    },
    "nextSteps": ["immediate actions to take"],
    "successCriteria": ["how to measure completion"],
    "estimatedEffort": "low|medium|high|extensive",
    "timeframe": "immediate|1-2 days|1 week|1 month|ongoing"
  }
}

Focus on creating a ticket that clearly captures the user's intent and provides actionable guidance for completion.
`;

    const aiResponse = await processWithLLM(ticketPrompt, {
      model: 'zai/glm-4.7',
      temperature: 0.3,
      maxTokens: 1500
    });

    let aiTicketData;
    try {
      aiTicketData = JSON.parse(aiResponse.data.response);
    } catch (parseError) {
      logger.warn('Failed to parse AI ticket data, using rule-based fallback', { error: parseError.message });
      return createBrainTicket(user, analysis, input, context); // Fallback to rule-based
    }

    // Create the ticket with AI-generated data
    const uuidUserId = hashToUUID(user.id);
    
    const ticketData = {
      organization_id: context.organization_id || getDefaultOrganizationId(user.id),
      user_id: uuidUserId,
      title: aiTicketData.title,
      description: aiTicketData.description,
      ticket_type: analysis.intent,
      priority: aiTicketData.priority,
      category: aiTicketData.category,
      source: 'intake_agent',
      source_id: 'intake',
      tags: aiTicketData.tags,
      ai_insights: aiTicketData.ai_insights
    };

    // Insert brain ticket
    await query(
      `INSERT INTO brain_tickets (
        organization_id, user_id, title, description, ticket_type, priority, 
        category, source, source_id, tags, ai_insights, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [
        ticketData.organization_id,
        ticketData.user_id,
        ticketData.title,
        ticketData.description,
        ticketData.ticket_type,
        ticketData.priority,
        ticketData.category,
        ticketData.source,
        ticketData.source_id,
        ticketData.tags,
        JSON.stringify(ticketData.ai_insights)
      ]
    );

    logger.info('AI-enhanced brain ticket created from intake', {
      user_id: user.id,
      intent: analysis.intent,
      confidence: analysis.confidence,
      priority: ticketData.priority,
      aiGenerated: true
    });

    return ticketData;

  } catch (error) {
    logger.error('Error in AI brain ticket creation:', error);
    return createBrainTicket(user, analysis, input, context); // Fallback to rule-based
  }
}

/**
 * Analyze user input for intent and classification
 */
function analyzeInput(input, context = {}) {
  const analysis = {
    intent: 'unknown',
    priority: 'medium',
    complexity: 'low',
    urgency: 'low',
    topics: [],
    emotions: 'neutral',
    actionability: 'low',
    estimatedEffort: 'low',
    confidence: 0.5
  };

  const content = input.toLowerCase();
  
  // Intent Classification Dictionary
  const intentPatterns = {
    // Business Development
    business_identity: ['business name', 'brand', 'identity', 'logo', 'mission', 'vision', 'values', 'positioning'],
    business_planning: ['plan', 'strategy', 'roadmap', 'goal', 'objective', 'target', 'forecast'],
    business_setup: ['start', 'launch', 'create', 'establish', 'found', 'begin'],
    
    // Financial
    revenue_setup: ['revenue', 'income', 'sales', 'pricing', 'monetization', 'profit'],
    cash_flow: ['cash', 'money', 'finance', 'budget', 'expense', 'cost', 'payment'],
    financial_analysis: ['financial', 'accounting', 'bookkeeping', 'tax', 'audit'],
    
    // Operations
    operations_setup: ['process', 'workflow', 'operation', 'efficiency', 'productivity'],
    delivery_setup: ['delivery', 'fulfillment', 'shipping', 'service', 'customer service'],
    systems_setup: ['system', 'software', 'technology', 'automation', 'integration'],
    
    // People
    people_setup: ['team', 'hire', 'employee', 'staff', 'recruitment', 'culture'],
    leadership: ['lead', 'manage', 'leadership', 'decision', 'strategy'],
    
    // Knowledge
    knowledge_setup: ['learn', 'training', 'education', 'knowledge', 'documentation'],
    research: ['research', 'market', 'competitor', 'analysis', 'study'],
    
    // Technical
    technical_support: ['problem', 'issue', 'error', 'bug', 'fix', 'broken', 'not working'],
    technical_setup: ['setup', 'configure', 'install', 'integrate', 'connect'],
    
    // General
    question: ['what', 'how', 'why', 'when', 'where', 'which', 'question'],
    request: ['help', 'assist', 'support', 'need', 'want', 'would like'],
    feedback: ['feedback', 'review', 'comment', 'suggestion', 'improve']
  };

  // Priority Classification
  const priorityPatterns = {
    critical: ['urgent', 'emergency', 'critical', 'immediate', 'asap', 'now', 'deadline'],
    high: ['important', 'priority', 'need', 'must', 'should', 'problem', 'issue'],
    medium: ['want', 'would like', 'consider', 'think about', 'maybe'],
    low: ['curious', 'wondering', 'explore', 'learn', 'understand']
  };

  // Complexity Classification
  const complexityPatterns = {
    high: ['complex', 'complicated', 'advanced', 'sophisticated', 'detailed', 'comprehensive'],
    medium: ['moderate', 'standard', 'normal', 'typical', 'regular'],
    low: ['simple', 'basic', 'easy', 'quick', 'straightforward', 'simple']
  };

  // Topic Detection
  const topicPatterns = {
    business: ['business', 'company', 'organization', 'enterprise', 'startup', 'venture'],
    finance: ['money', 'finance', 'revenue', 'profit', 'cash', 'budget', 'cost', 'investment'],
    marketing: ['marketing', 'advertising', 'promotion', 'brand', 'customer', 'market', 'sales'],
    operations: ['process', 'operation', 'workflow', 'efficiency', 'productivity', 'management'],
    technology: ['tech', 'technology', 'software', 'system', 'platform', 'digital', 'automation'],
    strategy: ['strategy', 'planning', 'goal', 'objective', 'vision', 'mission', 'roadmap'],
    team: ['team', 'people', 'staff', 'employee', 'leadership', 'culture'],
    customer: ['customer', 'client', 'user', 'service', 'support', 'experience']
  };

  // Emotional Tone
  const emotionPatterns = {
    positive: ['excited', 'happy', 'great', 'excellent', 'amazing', 'wonderful', 'success'],
    negative: ['frustrated', 'angry', 'upset', 'worried', 'concerned', 'disappointed', 'failed'],
    urgent: ['urgent', 'critical', 'emergency', 'immediate', 'asap', 'now'],
    neutral: ['neutral', 'normal', 'standard', 'regular', 'typical']
  };

  // Analyze intent
  let maxConfidence = 0;
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    const matches = patterns.filter(pattern => content.includes(pattern));
    if (matches.length > 0) {
      const confidence = matches.length / patterns.length;
      if (confidence > maxConfidence) {
        analysis.intent = intent;
        maxConfidence = confidence;
      }
    }
  }
  analysis.confidence = maxConfidence;

  // Analyze priority
  for (const [priority, patterns] of Object.entries(priorityPatterns)) {
    if (patterns.some(pattern => content.includes(pattern))) {
      analysis.priority = priority;
      break;
    }
  }

  // Analyze complexity
  for (const [complexity, patterns] of Object.entries(complexityPatterns)) {
    if (patterns.some(pattern => content.includes(pattern))) {
      analysis.complexity = complexity;
      break;
    }
  }

  // Detect topics
  for (const [topic, patterns] of Object.entries(topicPatterns)) {
    if (patterns.some(pattern => content.includes(pattern))) {
      analysis.topics.push(topic);
    }
  }

  // Analyze emotions
  for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
    if (patterns.some(pattern => content.includes(pattern))) {
      analysis.emotions = emotion;
      break;
    }
  }

  // Determine urgency
  if (analysis.priority === 'critical') {
    analysis.urgency = 'high';
  } else if (analysis.priority === 'high') {
    analysis.urgency = 'medium';
  }

  // Determine actionability
  if (analysis.intent.includes('setup') || analysis.intent.includes('create') || analysis.intent.includes('implement')) {
    analysis.actionability = 'high';
  } else if (analysis.intent.includes('question') || analysis.intent.includes('learn')) {
    analysis.actionability = 'low';
  } else {
    analysis.actionability = 'medium';
  }

  // Estimate effort
  if (analysis.complexity === 'high' || analysis.topics.length > 3) {
    analysis.estimatedEffort = 'high';
  } else if (analysis.complexity === 'medium' || analysis.topics.length > 1) {
    analysis.estimatedEffort = 'medium';
  }

  return analysis;
}

/**
 * Select appropriate agent based on analysis
 */
function selectAgent(analysis, context = {}) {
  const agentMapping = {
    // Business Development
    business_identity: 'business-identity-consultant',
    business_planning: 'business-strategy-consultant',
    business_setup: 'business-setup-specialist',
    
    // Financial
    revenue_setup: 'revenue-specialist',
    cash_flow: 'finance-specialist',
    financial_analysis: 'finance-analyst',
    
    // Operations
    operations_setup: 'operations-specialist',
    delivery_setup: 'delivery-specialist',
    systems_setup: 'systems-specialist',
    
    // People
    people_setup: 'hr-specialist',
    leadership: 'leadership-consultant',
    
    // Knowledge
    knowledge_setup: 'knowledge-specialist',
    research: 'research-analyst',
    
    // Technical
    technical_support: 'technical-support',
    technical_setup: 'technical-specialist',
    
    // General
    question: 'assistant',
    request: 'assistant',
    feedback: 'feedback-specialist'
  };

  // Default to assistant if no specific agent found
  return agentMapping[analysis.intent] || 'assistant';
}

/**
 * Select appropriate playbook based on analysis
 */
function selectPlaybook(analysis, context = {}) {
  const playbookMapping = {
    business_identity: 'identity_setup',
    business_planning: 'strategy_planning',
    business_setup: 'business_setup',
    revenue_setup: 'revenue_setup',
    cash_flow: 'cash_flow_setup',
    financial_analysis: 'financial_analysis',
    operations_setup: 'operations_setup',
    delivery_setup: 'delivery_setup',
    systems_setup: 'systems_setup',
    people_setup: 'people_setup',
    leadership: 'leadership_development',
    knowledge_setup: 'knowledge_setup',
    research: 'market_research',
    technical_support: 'technical_support',
    technical_setup: 'technical_setup'
  };

  return playbookMapping[analysis.intent] || 'general_assistance';
}

/**
 * Create brain ticket from intake analysis
 */
async function createBrainTicket(user, analysis, input, context = {}) {
  try {
    const uuidUserId = hashToUUID(user.id);
    
    const ticketData = {
      organization_id: context.organization_id || getDefaultOrganizationId(user.id),
      user_id: uuidUserId,
      title: input.length > 50 ? input.substring(0, 50) + '...' : input,
      description: `Intake Request: ${input}\n\nAnalysis: ${JSON.stringify(analysis, null, 2)}`,
      ticket_type: analysis.intent,
      priority: analysis.priority,
      category: analysis.topics.length > 0 ? analysis.topics[0] : 'general',
      source: 'intake_agent',
      source_id: 'intake',
      tags: ['intake', analysis.intent, ...analysis.topics],
      ai_insights: {
        intent: analysis.intent,
        confidence: analysis.confidence,
        analysis: analysis,
        context: context,
        routing: {
          agent: selectAgent(analysis, context),
          playbook: selectPlaybook(analysis, context),
          reasoning: `Routed based on intent: ${analysis.intent} with ${Math.round(analysis.confidence * 100)}% confidence`
        }
      }
    };

    // Insert brain ticket
    await query(
      `INSERT INTO brain_tickets (
        organization_id, user_id, title, description, ticket_type, priority, 
        category, source, source_id, tags, ai_insights, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [
        ticketData.organization_id,
        ticketData.user_id,
        ticketData.title,
        ticketData.description,
        ticketData.ticket_type,
        ticketData.priority,
        ticketData.category,
        ticketData.source,
        ticketData.source_id,
        ticketData.tags,
        JSON.stringify(ticketData.ai_insights)
      ]
    );

    logger.info('Brain ticket created from intake', {
      user_id: user.id,
      intent: analysis.intent,
      confidence: analysis.confidence,
      priority: analysis.priority
    });

    return ticketData;

  } catch (error) {
    logger.error('Error creating brain ticket from intake:', error);
    throw error;
  }
}

/**
 * Main intake agent function
 */
async function intake_agent(payload, user) {
  const { input, context = {}, source = 'unknown', useAI = true } = payload;

  try {
    if (!input || !input.trim()) {
      throw new Error('Input is required');
    }

    if (!user) {
      throw new Error('User authentication required');
    }

    logger.info('Processing intake request', {
      userId: user.id,
      inputLength: input.length,
      source,
      useAI
    });

    // Step 1: Analyze input (AI-powered or rule-based)
    let analysis;
    if (useAI) {
      try {
        analysis = await analyzeInputWithAI(input, { ...context, userId: user.id });
      } catch (aiError) {
        logger.warn('AI analysis failed, using rule-based fallback', { error: aiError.message });
        analysis = analyzeInput(input, context);
      }
    } else {
      analysis = analyzeInput(input, context);
    }
    
    // Step 2: Select agent and playbook (AI-powered or rule-based)
    let agentSelection, playbookSelection;
    if (useAI) {
      try {
        agentSelection = await selectAgentWithAI(analysis, context);
        playbookSelection = await selectPlaybookWithAI(analysis, context);
      } catch (aiError) {
        logger.warn('AI selection failed, using rule-based fallback', { error: aiError.message });
        agentSelection = { agent: selectAgent(analysis, context) };
        playbookSelection = { playbook: selectPlaybook(analysis, context) };
      }
    } else {
      agentSelection = { agent: selectAgent(analysis, context) };
      playbookSelection = { playbook: selectPlaybook(analysis, context) };
    }
    
    // Step 3: Create brain ticket (AI-powered or rule-based)
    let brainTicket;
    if (useAI) {
      try {
        brainTicket = await createBrainTicketWithAI(user, analysis, input, context);
      } catch (aiError) {
        logger.warn('AI ticket creation failed, using rule-based fallback', { error: aiError.message });
        brainTicket = await createBrainTicket(user, analysis, input, context);
      }
    } else {
      brainTicket = await createBrainTicket(user, analysis, input, context);
    }
    
    // Step 4: Prepare routing response
    const routingResponse = {
      brainTicket: {
        id: brainTicket.id,
        title: brainTicket.title,
        type: brainTicket.ticket_type,
        priority: brainTicket.priority,
        status: 'active'
      },
      routing: {
        agent: agentSelection.agent,
        playbook: playbookSelection.playbook,
        confidence: analysis.confidence,
        reasoning: agentSelection.reasoning || `Intent: ${analysis.intent} (${Math.round(analysis.confidence * 100)}% confidence)`,
        agentConfidence: agentSelection.confidence,
        playbookConfidence: playbookSelection.confidence,
        estimatedTimeframe: agentSelection.estimatedTimeframe,
        expectedOutcome: agentSelection.expectedOutcome
      },
      analysis: {
        intent: analysis.intent,
        priority: analysis.priority,
        complexity: analysis.complexity,
        urgency: analysis.urgency,
        topics: analysis.topics,
        emotions: analysis.emotions,
        actionability: analysis.actionability,
        estimatedEffort: analysis.estimatedEffort,
        aiInsights: analysis.aiInsights
      },
      nextSteps: [
        `Route to ${agentSelection.agent} agent`,
        `Apply ${playbookSelection.playbook} playbook`,
        `Begin execution with priority: ${analysis.priority}`,
        ...(agentSelection.specialInstructions || []),
        ...(playbookSelection.nextSteps || [])
      ]
    };

    logger.info('Intake processing completed', {
      userId: user.id,
      intent: analysis.intent,
      agent: agentSelection.agent,
      playbook: playbookSelection.playbook,
      confidence: analysis.confidence,
      aiEnhanced: useAI
    });

    return {
      success: true,
      data: routingResponse
    };

  } catch (error) {
    logger.error('Intake agent error:', {
      message: error.message,
      stack: error.stack,
      userId: user?.id,
      input: input?.substring(0, 100)
    });
    
    return {
      success: false,
      error: error.message || 'Failed to process intake request'
    };
  }
}

module.exports = intake_agent;
