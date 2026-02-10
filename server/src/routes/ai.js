const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { normalizeAgentId } = require('../config/agentCatalog');
const { assembleKnowledgeContext } = require('../services/knowledgeContextService');
const {
    INTENT_TYPES,
    PHASES,
    buildDiscoveryRefusalMessage,
    buildModelWayMetadata,
    buildOpenClawMessages,
    detectIntent,
    determinePhase,
    getLastUserMessage,
    shouldRefuseDirectExecutionInDiscovery
} = require('../services/aiChatOrchestration');
require('../../loadEnv');

const router = express.Router();

function toOpenClawAgentId(agentId) {
    if (agentId === 'executive-assistant') return 'main';
    return agentId;
}

function buildOpenClawSessionId(userId, conversationId) {
    const raw = `${userId}:${conversationId}`;
    return raw.replace(/[^a-zA-Z0-9:_-]/g, '_').slice(0, 200);
}

// OpenClaw configuration
const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL || 'http://127.0.0.1:18790/v1';
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || 'sk-openclaw-local';

// In-memory conversation tracking (in production, use database)
const conversations = new Map();

// Helper to structure metadata without injecting prompt logic
function structureResponse(content, modelWayMetadata, originalResponse = {}) {
    return {
        ...originalResponse,
        content,
        metadata: {
            ...(originalResponse.metadata || {}),
            modelWay: modelWayMetadata
        }
    };
}

function writeSseEvent(res, payload) {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function beginSseStream(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
}

function buildStreamStatus(stage, label, detail) {
    return {
        status: {
            stage,
            label,
            detail: detail || null,
            timestamp: new Date().toISOString()
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

    const {
        messages,
        stream = true,
        conversationId: providedConvId,
        agentId: requestedAgentId
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, error: 'Messages array is required' });
    }

    let keepAliveIntervalId = null;
    const startKeepAlive = () => {
        if (!stream || keepAliveIntervalId) return;
        keepAliveIntervalId = setInterval(() => {
            if (!res.writableEnded) {
                res.write(': keepalive\n\n');
            }
        }, 15000);
    };
    const stopKeepAlive = () => {
        if (keepAliveIntervalId) {
            clearInterval(keepAliveIntervalId);
            keepAliveIntervalId = null;
        }
    };

    try {
        const resolvedAgentId = normalizeAgentId(typeof requestedAgentId === 'string' ? requestedAgentId : undefined);
        const openClawAgentId = toOpenClawAgentId(resolvedAgentId);

        // Persist Conversation and User Message
        const conversationId = await getOrCreateConversation(userId, providedConvId);
        const intent = detectIntent(messages);
        const phase = determinePhase(messages);
        const modelWayMetadata = buildModelWayMetadata(intent, phase, conversationId);
        conversations.set(conversationId, {
            intent: intent.id,
            phase,
            updatedAt: new Date().toISOString()
        });

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

        const lastUserMessage = getLastUserMessage(messages);
        if (shouldRefuseDirectExecutionInDiscovery(phase, lastUserMessage)) {
            const refusalContent = buildDiscoveryRefusalMessage();
            await saveMessage(conversationId, 'assistant', refusalContent);

            if (stream) {
                beginSseStream(res);

                writeSseEvent(res, buildStreamStatus('policy_guard', 'Discovery guard active', 'Nexus requested one clarifying input before implementation.'));
                writeSseEvent(res, {
                    metadata: {
                        modelWay: modelWayMetadata,
                        contextInjected: false
                    }
                });
                writeSseEvent(res, { content: refusalContent });
                res.write('data: [DONE]\n\n');
                res.end();
                return;
            }

            return res.json(structureResponse(refusalContent, modelWayMetadata, {
                success: true,
                content: refusalContent,
                model: 'nexus:policy-guard',
                usage: null
            }));
        }

        if (stream) {
            beginSseStream(res);
            startKeepAlive();
            writeSseEvent(res, buildStreamStatus('accepted', 'Request accepted', 'Preparing context and connecting to agent runtime.'));
            writeSseEvent(res, {
                metadata: {
                    modelWay: modelWayMetadata,
                    contextInjected: false
                }
            });
        }

        let contextSystemMessage = null;
        try {
            const context = await assembleKnowledgeContext({
                userId,
                jwtPayload: req.user?.jwtPayload,
                agentId: resolvedAgentId,
                conversationId,
                includeShort: true,
                includeMedium: true,
                includeLong: true,
                maxBlocks: 8
            });

            if (context?.systemContext) {
                contextSystemMessage = [
                    'Nexus Working Context (source-of-truth from backend):',
                    context.systemContext,
                    `Context Digest: ${context.contextDigest}`
                ].join('\n\n');
            }
        } catch (contextError) {
            logger.warn('Failed to inject assembled knowledge context into chat', {
                userId,
                conversationId,
                agentId: resolvedAgentId,
                error: contextError instanceof Error ? contextError.message : String(contextError)
            });
        }
        const contextInjected = Boolean(contextSystemMessage);
        if (stream && contextInjected) {
            writeSseEvent(res, buildStreamStatus('context_ready', 'Context ready', 'Business context was injected from backend knowledge.'));
        }

        // Strip any system messages from client and inject deterministic backend context
        const openClawMessages = buildOpenClawMessages(messages, contextSystemMessage);

        const openClawSessionId = buildOpenClawSessionId(userId, conversationId);

        // Pure proxy payload: OpenClaw's agent runtime (SOUL.md, AGENTS.md) drives behavior
        const openClawPayload = {
            model: 'openclaw:main', // Route through OpenClaw agent runtime
            messages: openClawMessages,
            stream: stream,
            user: openClawSessionId // Isolate OpenClaw memory by Nexus conversation
        };

        logger.info('Chat proxy request', {
            userId,
            conversationId,
            messageCount: openClawMessages.length,
            intent: intent.id,
            phase,
            agentId: resolvedAgentId,
            openClawAgentId,
            openClawSessionId,
            injectedContext: contextInjected,
            stream,
            endpoint: `${OPENCLAW_API_URL}/chat/completions`
        });

        // Call OpenClaw Chat Completions API
        const openClawResponse = await fetch(`${OPENCLAW_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENCLAW_API_KEY}`,
                'x-openclaw-agent-id': openClawAgentId
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
                writeSseEvent(res, buildStreamStatus('thinking', 'Agent is thinking', 'Preparing response with orchestration metadata.'));
                writeSseEvent(res, buildStreamStatus('responding', 'Agent is responding', 'Streaming response started.'));

                // 2. Content event
                if (content) {
                    writeSseEvent(res, { content });
                }

                // 3. Done event
                writeSseEvent(res, buildStreamStatus('completed', 'Response complete', null));
                res.write('data: [DONE]\n\n');
                stopKeepAlive();
                res.end();
                return;
            } else {
                // return normal JSON if client didn't want stream
                const response = structureResponse(content, modelWayMetadata, {
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

            const response = structureResponse(content, modelWayMetadata, {
                success: true,
                content,
                model: data.model,
                usage: data.usage
            }
            );

            return res.json(response);
        }

        // Streaming: set up SSE with metadata in initial event
        writeSseEvent(res, buildStreamStatus('thinking', 'Agent is thinking', 'Preparing response stream.'));
        writeSseEvent(res, buildStreamStatus('responding', 'Agent is responding', 'Streaming response started.'));

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
                    writeSseEvent(res, buildStreamStatus('completed', 'Response complete', null));
                    res.write('data: [DONE]\n\n');
                    stopKeepAlive();
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
                            writeSseEvent(res, buildStreamStatus('completed', 'Response complete', null));
                            res.write('data: [DONE]\n\n');
                            stopKeepAlive();
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
            writeSseEvent(res, buildStreamStatus('error', 'Response interrupted', streamErr.message));
            writeSseEvent(res, { error: streamErr.message });
        } finally {
            stopKeepAlive();
            res.end();
        }

    } catch (error) {
        logger.error('Chat proxy error', {
            error: error.message,
            stack: error.stack,
            userId
        });
        stopKeepAlive();

        // If headers already sent (streaming started), send error via SSE
        if (res.headersSent) {
            writeSseEvent(res, buildStreamStatus('error', 'Request failed', error.message));
            writeSseEvent(res, { error: error.message });
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
