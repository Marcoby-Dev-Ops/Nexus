const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
require('../../loadEnv');

const router = express.Router();

// OpenClaw configuration
const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL || 'http://127.0.0.1:18790/v1';
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
// Database helpers
const { query } = require('../database/connection');

// Helper to get or create conversation
async function getOrCreateConversation(userId, providedId, title = 'New Conversation') {
    // If providedId is a valid UUID, check if it exists
    if (providedId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providedId)) {
        const check = await query('SELECT id FROM ai_conversations WHERE id = $1 AND user_id = $2', [providedId, userId]);
        if (check.data && check.data.length > 0) {
            return check.data[0].id;
        }
    }

    // Create new conversation
    const result = await query(
        'INSERT INTO ai_conversations (user_id, title) VALUES ($1, $2) RETURNING id',
        [userId, title]
    );

    if (result.error) {
        logger.error('Failed to create conversation', { error: result.error, userId });
        throw new Error('Failed to start conversation');
    }

    return result.data[0].id;
}

// Helper to save message
async function saveMessage(conversationId, role, content) {
    const result = await query(
        'INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING id',
        [conversationId, role, content]
    );

    if (result.error) {
        logger.error('Failed to save message', { error: result.error, conversationId, role });
        // Don't throw, just log - we don't want to break the chat flow if audit fails momentarily
    }
    return result.data?.[0]?.id;
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
        // Persist Conversation and User Message
        const conversationId = await getOrCreateConversation(userId, providedConvId);

        // Save the last user message (assuming the array is history + new message)
        // Ideally we save all new ones, but usually client sends history. 
        // We'll simplisticly save the LAST message having role 'user' to avoid dupes if client resends whole history?
        // Better: The client usually sends the NEW prompt. Nexus assumes 'messages' is the full context.
        // We really should only save the *newest* user message.
        // Simple logic: Find the last message in array. If it's user, save it.
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'user') {
            await saveMessage(conversationId, 'user', lastMessage.content);
        }

        // Strip any system messages from client - let OpenClaw's soul/system docs handle personality
        const userMessages = messages.filter(m => m.role !== 'system');

        // Pure proxy payload: OpenClaw's agent runtime (SOUL.md, AGENTS.md) drives behavior
        const openClawPayload = {
            model: 'openclaw:main', // Route through OpenClaw agent runtime
            messages: userMessages,
            stream: stream,
            user: userId // Critical for OpenClaw per-user session isolation
        };

        logger.info('Chat proxy request', {
            userId,
            conversationId,
            messageCount: userMessages.length,
            stream,
            endpoint: `${OPENCLAW_API_URL}/chat/completions`
        });

        // Call OpenClaw Chat Completions API
        const openClawResponse = await fetch(`${OPENCLAW_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENCLAW_API_KEY}`,
                'x-openclaw-agent-id': 'main'
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

            // Audit: Save Assistant Response
            if (content) {
                await saveMessage(conversationId, 'assistant', content);
            }

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

            // Audit: Save Assistant Response
            if (content) {
                await saveMessage(conversationId, 'assistant', content);
            }

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
        let fullAssistantContent = ''; // Accumulate for audit

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    // Audit: Save collected assistant response
                    if (fullAssistantContent) {
                        await saveMessage(conversationId, 'assistant', fullAssistantContent);
                    }
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
                            // Audit: Save collected assistant response on upstream done
                            if (fullAssistantContent) {
                                await saveMessage(conversationId, 'assistant', fullAssistantContent);
                                fullAssistantContent = ''; // Prevent double save if loop continues
                            }
                            res.write('data: [DONE]\n\n');
                            continue;
                        }

                        try {
                            const chunk = JSON.parse(dataStr);
                            const content = chunk.choices?.[0]?.delta?.content;

                            if (content) {
                                fullAssistantContent += content;
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
            // Attempt to save partial content if error occurs
            if (fullAssistantContent) {
                saveMessage(conversationId, 'assistant', fullAssistantContent).catch(e => logger.error('Failed to save partial message', e));
            }
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

/**
 * GET /api/ai/conversations
 * List non-archived conversations for the authenticated user
 */
router.get('/conversations', authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const result = await query(
            `SELECT id, title, model, system_prompt, message_count, is_archived,
                    context, created_at, updated_at, user_id
             FROM ai_conversations
             WHERE user_id = $1 AND is_archived = false
             ORDER BY updated_at DESC
             LIMIT 200`,
            [userId],
            req.user.jwtPayload
        );

        if (result.error) {
            logger.error('Failed to fetch conversations', { error: result.error, userId });
            return res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
        }

        res.json({ success: true, data: result.data || [] });
    } catch (error) {
        logger.error('Error fetching conversations', { error: error.message, userId });
        res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
    }
});

/**
 * GET /api/ai/conversations/:id/messages
 * Fetch all messages for a conversation with ownership check
 */
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const conversationId = req.params.id;

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        // Verify ownership
        const convCheck = await query(
            'SELECT id FROM ai_conversations WHERE id = $1 AND user_id = $2',
            [conversationId, userId],
            req.user.jwtPayload
        );

        if (!convCheck.data || convCheck.data.length === 0) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }

        const result = await query(
            `SELECT id, conversation_id, role, content, metadata, created_at, updated_at
             FROM ai_messages
             WHERE conversation_id = $1
             ORDER BY created_at ASC`,
            [conversationId],
            req.user.jwtPayload
        );

        if (result.error) {
            logger.error('Failed to fetch messages', { error: result.error, conversationId });
            return res.status(500).json({ success: false, error: 'Failed to fetch messages' });
        }

        res.json({ success: true, data: result.data || [] });
    } catch (error) {
        logger.error('Error fetching messages', { error: error.message, conversationId });
        res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
});

/**
 * PATCH /api/ai/conversations/:id
 * Update conversation title or archived status
 */
router.patch('/conversations/:id', authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const conversationId = req.params.id;
    const { title, is_archived } = req.body;

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const updates = [];
        const values = [];
        let paramIdx = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramIdx++}`);
            values.push(String(title).substring(0, 255));
        }
        if (is_archived !== undefined) {
            updates.push(`is_archived = $${paramIdx++}`);
            values.push(Boolean(is_archived));
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'No fields to update' });
        }

        updates.push('updated_at = NOW()');
        values.push(conversationId, userId);

        const result = await query(
            `UPDATE ai_conversations SET ${updates.join(', ')}
             WHERE id = $${paramIdx++} AND user_id = $${paramIdx}
             RETURNING *`,
            values,
            req.user.jwtPayload
        );

        if (result.error || !result.data || result.data.length === 0) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }

        res.json({ success: true, data: result.data[0] });
    } catch (error) {
        logger.error('Error updating conversation', { error: error.message, conversationId });
        res.status(500).json({ success: false, error: 'Failed to update conversation' });
    }
});

/**
 * DELETE /api/ai/conversations/:id
 * Hard delete a conversation (messages cascade via FK)
 */
router.delete('/conversations/:id', authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const conversationId = req.params.id;

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const result = await query(
            'DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2 RETURNING id',
            [conversationId, userId],
            req.user.jwtPayload
        );

        if (result.error || !result.data || result.data.length === 0) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }

        res.json({ success: true, data: { id: conversationId, deleted: true } });
    } catch (error) {
        logger.error('Error deleting conversation', { error: error.message, conversationId });
        res.status(500).json({ success: false, error: 'Failed to delete conversation' });
    }
});

module.exports = router;