const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
require('../../loadEnv');

const router = express.Router();

// OpenClaw configuration
const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL || 'http://localhost:18789/v1';
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || 'sk-openclaw-local';

// Model-Way Framework Constants - Preserved for metadata consistency
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

// Helper to structure metadata without injecting prompt logic
function structureResponse(content, conversationId, originalResponse = {}) {
  // Mock metadata for compatibility
  const phaseProgress = 25; 
  
  return {
    ...originalResponse,
    content,
    metadata: {
      ...(originalResponse.metadata || {}),
      modelWay: {
        intent: INTENT_TYPES.BRAINSTORM, // Default
        phase: {
          id: PHASES.DISCOVERY,
          name: 'Discovery',
          progress: phaseProgress
        },
        conversationId,
        timestamp: new Date().toISOString()
      }
    }
  };
}

/**
 * POST /api/ai/chat
 * Streaming chat endpoint - Pure Proxy to OpenClaw
 */
router.post('/chat', authenticateToken, async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { messages, stream = true, conversationId: providedConvId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, error: 'Messages array is required' });
    }

    try {
        const conversationId = providedConvId || `conv-${userId}-${Date.now()}`;
        
        // Pure proxy payload: No system prompt injection
        const openClawPayload = {
            messages: messages, // Pass user messages directly
            stream: stream,
            user: userId // Critical for OpenClaw memory
        };

        logger.info('Chat proxy request', {
            userId,
            conversationId,
            messageCount: messages.length,
            stream,
            endpoint: `${OPENCLAW_API_URL}/chat/completions`
        });

        // Call OpenClaw API
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
            throw new Error(`OpenClaw API error: ${openClawResponse.status} - ${errorText}`);
        }

        // Check if upstream response is JSON (non-streaming)
        const contentType = openClawResponse.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
             // Handle non-streaming upstream response from Bridge
             const data = await openClawResponse.json();
             const content = data.choices?.[0]?.message?.content || '';
             
             // If client wanted stream, emit it as an SSE event sequence
             if (stream) {
                 res.setHeader('Content-Type', 'text/event-stream');
                 res.setHeader('Cache-Control', 'no-cache');
                 res.setHeader('Connection', 'keep-alive');
                 res.setHeader('X-Accel-Buffering', 'no');
                 res.flushHeaders();

                 // 1. Metadata event (Minimal for compatibility)
                 res.write(`data: ${JSON.stringify({
                    metadata: {
                        modelWay: {
                            intent: INTENT_TYPES.BRAINSTORM,
                            phase: { id: PHASES.DISCOVERY, name: 'Discovery', progress: 25 },
                            conversationId,
                            timestamp: new Date().toISOString()
                        }
                    }
                 })}\n\n`);

                 // 2. Content event
                 if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                 }

                 // 3. Done event
                 res.write('data: [DONE]\n\n');
                 res.end();
                 return;
             } else {
                 // return normal JSON if client didn't want stream
                 const response = structureResponse(content, conversationId, {
                        success: true,
                        content,
                        model: data.model,
                        usage: data.usage
                    }
                );
                return res.json(response);
             }
        }

        if (!stream) {
            // Non-streaming: return JSON response
            const data = await openClawResponse.json();
            const content = data.choices?.[0]?.message?.content || '';

            const response = structureResponse(content, conversationId, {
                    success: true,
                    content,
                    model: data.model,
                    usage: data.usage
                }
            );

            return res.json(response);
        }

        // Streaming: set up SSE with metadata in initial event
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
        res.flushHeaders();

        // Send metadata as first event
        res.write(`data: ${JSON.stringify({
            metadata: {
                modelWay: {
                    intent: INTENT_TYPES.BRAINSTORM,
                    phase: { id: PHASES.DISCOVERY, name: 'Discovery', progress: 25 },
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