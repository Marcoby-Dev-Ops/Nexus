const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
require('../../loadEnv');

const router = express.Router();

// OpenClaw configuration
const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL || 'http://localhost:18789/v1';
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || 'sk-openclaw-local';

// Model-Way Framework Constants
const INTENT_TYPES = {
  BRAINSTORM: { id: 'brainstorm', name: '🧠 Brainstorm', emoji: '🧠', description: 'Generate ideas, explore possibilities' },
  SOLVE: { id: 'solve', name: '🛠 Solve', emoji: '🛠', description: 'Solve a problem, debug, fix issues' },
  WRITE: { id: 'write', name: '✍️ Write', emoji: '✍️', description: 'Draft content, emails, documents' },
  DECIDE: { id: 'decide', name: '📊 Decide', emoji: '📊', description: 'Make decisions, analyze options' },
  LEARN: { id: 'learn', name: '📚 Learn', emoji: '📚', description: 'Learn, research, understand concepts' }
};

const PHASES = {
  DISCOVERY: 'discovery',
  SYNTHESIS: 'synthesis', 
  DECISION: 'decision',
  EXECUTION: 'execution'
};

// In-memory conversation tracking (in production, use database)
const conversations = new Map();

/**
 * Model-Way: Detect intent from messages
 */
function detectIntent(messages) {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  
  // Simple keyword-based intent detection
  if (lastMessage.includes('brainstorm') || lastMessage.includes('idea') || lastMessage.includes('creative')) {
    return INTENT_TYPES.BRAINSTORM;
  }
  if (lastMessage.includes('solve') || lastMessage.includes('problem') || lastMessage.includes('fix') || lastMessage.includes('debug')) {
    return INTENT_TYPES.SOLVE;
  }
  if (lastMessage.includes('write') || lastMessage.includes('draft') || lastMessage.includes('email') || lastMessage.includes('document')) {
    return INTENT_TYPES.WRITE;
  }
  if (lastMessage.includes('decide') || lastMessage.includes('choose') || lastMessage.includes('option') || lastMessage.includes('analysis')) {
    return INTENT_TYPES.DECIDE;
  }
  if (lastMessage.includes('learn') || lastMessage.includes('research') || lastMessage.includes('understand') || lastMessage.includes('explain')) {
    return INTENT_TYPES.LEARN;
  }
  
  // Default to brainstorming for new conversations
  return INTENT_TYPES.BRAINSTORM;
}

/**
 * Model-Way: Determine current phase based on conversation
 */
function determinePhase(conversationId, messages) {
  const conversation = conversations.get(conversationId) || { phase: PHASES.DISCOVERY, messageCount: 0 };
  
  // Simple phase progression based on message count
  const messageCount = messages.length;
  
  if (messageCount <= 2) return PHASES.DISCOVERY;
  if (messageCount <= 4) return PHASES.SYNTHESIS;
  if (messageCount <= 6) return PHASES.DECISION;
  return PHASES.EXECUTION;
}

/**
 * Model-Way: Scaffold system prompt based on intent and phase
 */
function scaffoldSystemPrompt(intent, phase, userId, originalSystemPrompt = '') {
  const modelWayPrompt = `You are a Nexus AI assistant using the Model-Way Framework.

User: ${userId}
Intent: ${intent.name} (${intent.description})
Current Phase: ${phase.charAt(0).toUpperCase() + phase.slice(1)}

Please structure your response according to the Model-Way Framework.`;

  const phasePrompts = {
    [PHASES.DISCOVERY]: `We're in the Discovery phase. Focus on:
- Asking clarifying questions
- Exploring the problem space
- Identifying key variables and constraints
- Gathering initial insights

Keep responses exploratory and open-ended.`,
    
    [PHASES.SYNTHESIS]: `We're in the Synthesis phase. Focus on:
- Organizing information and patterns
- Connecting dots between insights
- Identifying core principles or themes
- Preparing for decision-making

Structure your response with clear sections and summaries.`,
    
    [PHASES.DECISION]: `We're in the Decision phase. Focus on:
- Presenting clear options with pros/cons
- Making recommendations with rationale
- Assessing risks and opportunities
- Providing actionable next steps

Be decisive and recommendation-oriented.`,
    
    [PHASES.EXECUTION]: `We're in the Execution phase. Focus on:
- Concrete action steps
- Timeline and responsibilities
- Success metrics and checkpoints
- Potential obstacles and solutions

Be specific, actionable, and practical.`
  };
  
  const intentPrompts = {
    [INTENT_TYPES.BRAINSTORM.id]: `Intent: Brainstorming
- Generate diverse ideas without judgment
- Encourage creative thinking
- Build on ideas with "yes, and..."
- Quantity over quality initially`,
    
    [INTENT_TYPES.SOLVE.id]: `Intent: Problem Solving
- Define the problem clearly
- Analyze root causes
- Generate potential solutions
- Evaluate and recommend best approach`,
    
    [INTENT_TYPES.WRITE.id]: `Intent: Writing
- Understand audience and purpose
- Structure content logically
- Use appropriate tone and style
- Provide drafts with clear next steps`,
    
    [INTENT_TYPES.DECIDE.id]: `Intent: Decision Making
- Frame the decision clearly
- Identify criteria for evaluation
- Analyze options objectively
- Make and justify recommendations`,
    
    [INTENT_TYPES.LEARN.id]: `Intent: Learning
- Assess current knowledge level
- Provide clear explanations
- Use examples and analogies
- Suggest resources for deeper learning`
  };
  
  // Combine original system prompt with Model-Way scaffolding
  const combinedPrompt = originalSystemPrompt 
    ? `${originalSystemPrompt}\n\n${modelWayPrompt}`
    : modelWayPrompt;
  
  return `${combinedPrompt}

${phasePrompts[phase]}

${intentPrompts[intent.id]}

Remember: You're using the Model-Way Framework to teach effective AI collaboration.`;
}

/**
 * Model-Way: Structure the response with metadata
 */
function structureResponse(content, intent, phase, conversationId, originalResponse = {}) {
  const phaseProgress = {
    [PHASES.DISCOVERY]: 25,
    [PHASES.SYNTHESIS]: 50,
    [PHASES.DECISION]: 75,
    [PHASES.EXECUTION]: 100
  };
  
  return {
    ...originalResponse,
    content,
    metadata: {
      ...(originalResponse.metadata || {}),
      modelWay: {
        intent: {
          id: intent.id,
          name: intent.name,
          emoji: intent.emoji,
          description: intent.description
        },
        phase: {
          id: phase,
          name: phase.charAt(0).toUpperCase() + phase.slice(1),
          progress: phaseProgress[phase] || 0
        },
        conversationId,
        timestamp: new Date().toISOString()
      }
    }
  };
}

/**
 * POST /api/ai/chat
 * Streaming chat endpoint with Model-Way Framework
 */
router.post('/chat', authenticateToken, async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { messages, system, stream = true, conversationId: providedConvId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, error: 'Messages array is required' });
    }

    try {
        // Model-Way Framework processing
        const conversationId = providedConvId || `conv-${userId}-${Date.now()}`;
        const intent = detectIntent(messages);
        const phase = determinePhase(conversationId, messages);
        
        // Update conversation tracking
        conversations.set(conversationId, {
            intent,
            phase,
            messageCount: messages.length,
            lastUpdated: new Date().toISOString()
        });
        
        // Scaffold system prompt with Model-Way Framework
        const modelWaySystemPrompt = scaffoldSystemPrompt(intent, phase, userId, system);
        
        // Build messages array with Model-Way system prompt
        const openClawMessages = [];

        if (modelWaySystemPrompt) {
            openClawMessages.push({ role: 'system', content: modelWaySystemPrompt });
        }

        // Add conversation messages
        for (const msg of messages) {
            openClawMessages.push({
                role: msg.role || 'user',
                content: msg.content
            });
        }

        const openClawPayload = {
            messages: openClawMessages,
            stream: stream,
            user: userId // Critical for OpenClaw memory
        };

        logger.info('Proxying chat request to OpenClaw with Model-Way Framework', {
            userId,
            conversationId,
            intent: intent.name,
            phase,
            messageCount: openClawMessages.length,
            stream,
            endpoint: `${OPENCLAW_API_URL}/chat/completions`
        });

        const openClawResponse = await fetch(`${OPENCLAW_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENCLAW_API_KEY}`
            },
            body: JSON.stringify(openClawPayload)
        });

        if (!openClawResponse.ok) {
            const errorText = await openClawResponse.text();
            logger.error('OpenClaw API error', {
                status: openClawResponse.status,
                error: errorText
            });
            return res.status(openClawResponse.status).json({
                success: false,
                error: `OpenClaw error: ${openClawResponse.status} ${errorText}`
            });
        }

        if (!stream) {
            // Non-streaming: return JSON response with Model-Way metadata
            const data = await openClawResponse.json();
            const content = data.choices?.[0]?.message?.content || '';

            const response = structureResponse(
                content,
                intent,
                phase,
                conversationId,
                {
                    success: true,
                    content,
                    model: data.model,
                    usage: data.usage
                }
            );

            return res.json(response);
        }

        // Streaming: set up SSE with Model-Way metadata in initial event
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
        res.flushHeaders();

        // Send Model-Way metadata as first event
        res.write(`data: ${JSON.stringify({
            metadata: {
                modelWay: {
                    intent: {
                        id: intent.id,
                        name: intent.name,
                        emoji: intent.emoji,
                        description: intent.description
                    },
                    phase: {
                        id: phase,
                        name: phase.charAt(0).toUpperCase() + phase.slice(1),
                        progress: phaseProgress[phase] || 0
                    },
                    conversationId,
                    timestamp: new Date().toISOString()
                }
            }
        })}\n\n`);

        const reader = openClawResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    res.write('data: [DONE]\n\n');
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    if (trimmed.startsWith('data: ')) {
                        const dataStr = trimmed.slice(6);

                        if (dataStr === '[DONE]') {
                            res.write('data: [DONE]\n\n');
                            continue;
                        }

                        try {
                            const chunk = JSON.parse(dataStr);
                            const content = chunk.choices?.[0]?.delta?.content;

                            if (content) {
                                // Forward the content to the client
                                res.write(`data: ${JSON.stringify({ content })}\n\n`);
                            }
                        } catch (parseErr) {
                            // Skip malformed JSON chunks
                            logger.debug('Skipping malformed SSE chunk', { dataStr });
                        }
                    }
                }
            }
        } catch (streamErr) {
            logger.error('Stream reading error', { error: streamErr.message });
            res.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
        } finally {
            res.end();
        }

    } catch (error) {
        logger.error('Chat proxy error', {
            error: error.message,
            stack: error.stack,
            userId
        });

        // If headers already sent (streaming started), send error via SSE
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        } else {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to process chat request'
            });
        }
    }
});

/**
 * GET /api/ai/health
 * Health check for OpenClaw connectivity
 */
router.get('/health', async (req, res) => {
    try {
        const response = await fetch(`${OPENCLAW_API_URL.replace('/v1', '')}/health`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${OPENCLAW_API_KEY}`
            },
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            return res.json({
                success: true,
                openclaw: 'connected',
                url: OPENCLAW_API_URL,
                modelWay: true,
                intents: Object.values(INTENT_TYPES).map(i => ({ id: i.id, name: i.name, emoji: i.emoji })),
                phases: Object.values(PHASES)
            });
        }

        return res.status(503).json({
            success: false,
            openclaw: 'unreachable',
            status: response.status
        });
    } catch (error) {
        return res.status(503).json({
            success: false,
            openclaw: 'unreachable',
            error: error.message
        });
    }
});

/**
 * GET /api/ai/modelway/intents
 * Get Model-Way Framework intents and phases
 */
router.get('/modelway/intents', authenticateToken, (req, res) => {
    res.json({
        intents: Object.values(INTENT_TYPES),
        phases: Object.values(PHASES),
        framework: 'Model-Way Framework v1.0'
    });
});

module.exports = router;