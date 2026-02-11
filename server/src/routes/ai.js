const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { normalizeAgentId } = require('../config/agentCatalog');
const { assembleKnowledgeContext } = require('../services/knowledgeContextService');
const { getAgentRuntime } = require('../services/agentRuntime');
const {
    INTENT_TYPES,
    PHASES,
    buildDiscoveryRefusalMessage,
    buildModelWayMetadata,
    buildOpenClawMessages,
    detectIntent,
    determinePhase,
    getLastUserMessage,
    shouldRefuseDirectExecutionInDiscovery,
    resolveTopicToConversationId
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
const agentRuntime = getAgentRuntime();
const OPENCLAW_ENABLE_MODELWAY_TOOLS = process.env.OPENCLAW_ENABLE_MODELWAY_TOOLS !== 'false';
const OPENCLAW_TOOLS_DEFAULT = [
    'web_search',
    'advanced_scrape',
    'summarize_strategy',
    'create_skill',
    'implement_action',
    'list_skills',
    'search_skills',
    'install_skill'
];
const OPENCLAW_TOOLS_BY_INTENT = {
    [INTENT_TYPES.LEARN.id]: OPENCLAW_TOOLS_DEFAULT,
    [INTENT_TYPES.SOLVE.id]: OPENCLAW_TOOLS_DEFAULT,
    [INTENT_TYPES.DECIDE.id]: ['web_search', 'advanced_scrape', 'summarize_strategy', 'list_skills', 'search_skills'],
    [INTENT_TYPES.WRITE.id]: ['web_search', 'advanced_scrape', 'summarize_strategy']
};
const MAX_ATTACHMENT_CONTEXT_BYTES = 200 * 1024;
const MAX_ATTACHMENT_PREVIEW_CHARS = 4000;
const DOCUMENT_LINK_REGEX = /\b(?:https?:\/\/[^\s)]+|\/api\/chat\/attachments\/[^\s)]+|\/media\/[^\s)]+)\b/gi;
const DOCUMENT_EXTENSION_REGEX = /\.(pdf|doc|docx|txt|md|rtf|csv|xlsx|xls|ppt|pptx|json)(?:[?#].*)?$/i;

// In-memory conversation tracking (in production, use database)
const conversations = new Map();

function getModelWayToolsForIntent(intentId) {
    if (!OPENCLAW_ENABLE_MODELWAY_TOOLS) return [];
    return OPENCLAW_TOOLS_BY_INTENT[intentId] || [];
}

function buildModelWayInstructionBlock(intent, phase) {
    const phaseName = phase.charAt(0).toUpperCase() + phase.slice(1);
    const intentName = intent?.name || 'Assist';

    return [
        'Model-Way Runtime Instructions:',
        `- Intent: ${intentName}`,
        `- Phase: ${phaseName}`,
        '- If the task requires external or current information, use web_search first.',
        '- If results are thin or blocked, use advanced_scrape for direct extraction.',
        '- For missing capability, use search_skills then install_skill before proposing custom implementation.',
        '- Include direct source links for external facts.'
    ].join('\n');
}

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
async function saveMessage(conversationId, role, content, metadata = {}) {
    const result = await query(
        'INSERT INTO ai_messages (conversation_id, role, content, metadata) VALUES ($1, $2, $3, $4) RETURNING id',
        [conversationId, role, content, JSON.stringify(metadata)]
    );

    if (result.error) {
        logger.error('Failed to save message', { error: result.error, conversationId, role });
        // Don't throw, just log - we don't want to break the chat flow if audit fails momentarily
    }
    return result.data?.[0]?.id;
}

function normalizeIncomingAttachments(attachments) {
    if (!Array.isArray(attachments)) return [];
    return attachments
        .filter((attachment) => attachment && typeof attachment === 'object')
        .map((attachment) => ({
            id: typeof attachment.id === 'string' ? attachment.id : null,
            name: typeof attachment.name === 'string' ? attachment.name : 'Attachment',
            type: typeof attachment.type === 'string' ? attachment.type : 'application/octet-stream',
            size: Number.isFinite(attachment.size) ? attachment.size : null,
            url: typeof attachment.url === 'string' ? attachment.url : '',
            downloadUrl: typeof attachment.downloadUrl === 'string' ? attachment.downloadUrl : ''
        }))
        .filter((attachment) => attachment.id);
}

function toAttachmentMetadataRow(attachmentRow) {
    const downloadUrl = `/api/chat/attachments/${attachmentRow.id}/download`;
    return {
        id: attachmentRow.id,
        name: attachmentRow.file_name,
        size: Number(attachmentRow.file_size) || 0,
        type: attachmentRow.file_type || 'application/octet-stream',
        url: downloadUrl,
        downloadUrl,
        status: 'uploaded'
    };
}

function isLikelyTextAttachment(attachmentRow) {
    const type = String(attachmentRow.file_type || '').toLowerCase();
    const fileName = String(attachmentRow.file_name || '').toLowerCase();

    if (
        type.startsWith('text/')
        || type.includes('json')
        || type.includes('xml')
        || type.includes('csv')
        || type.includes('markdown')
    ) {
        return true;
    }

    return /\.(txt|md|markdown|json|csv|xml|yaml|yml)$/i.test(fileName);
}

async function readAttachmentPreview(attachmentRow) {
    try {
        if (!isLikelyTextAttachment(attachmentRow)) return '';
        const fileSize = Number(attachmentRow.file_size) || 0;
        if (fileSize > MAX_ATTACHMENT_CONTEXT_BYTES) return '';

        const absolutePath = path.isAbsolute(attachmentRow.storage_path)
            ? attachmentRow.storage_path
            : path.join(process.cwd(), attachmentRow.storage_path);

        if (!fs.existsSync(absolutePath)) return '';

        const content = await fs.promises.readFile(absolutePath, 'utf8');
        if (!content) return '';
        if (content.length <= MAX_ATTACHMENT_PREVIEW_CHARS) return content;
        return `${content.slice(0, MAX_ATTACHMENT_PREVIEW_CHARS)}\n...[truncated]`;
    } catch (error) {
        logger.warn('Failed to read attachment preview', {
            attachmentId: attachmentRow.id,
            error: error instanceof Error ? error.message : String(error)
        });
        return '';
    }
}

async function fetchStoredAttachments(conversationId, userId, attachmentRefs, jwtPayload) {
    if (!attachmentRefs.length) return [];
    const attachmentIds = [...new Set(attachmentRefs.map((item) => item.id).filter(Boolean))];
    if (!attachmentIds.length) return [];

    const result = await query(
        `SELECT id, file_name, file_type, file_size, storage_path, created_at
         FROM ai_message_attachments
         WHERE conversation_id = $1
           AND user_id = $2
           AND id = ANY($3::uuid[])`,
        [conversationId, userId, attachmentIds],
        jwtPayload
    );

    if (result.error) {
        logger.error('Failed to load attachment metadata for OpenClaw context', {
            userId,
            conversationId,
            error: result.error
        });
        return [];
    }

    return result.data || [];
}

async function buildAttachmentContext(storedAttachments) {
    if (!storedAttachments.length) return '';

    const blocks = [];
    for (const attachment of storedAttachments) {
        const downloadUrl = `/api/chat/attachments/${attachment.id}/download`;
        const metaLine = `- ${attachment.file_name} (${attachment.file_type || 'unknown'}, ${Number(attachment.file_size) || 0} bytes)`;
        const preview = await readAttachmentPreview(attachment);
        if (preview) {
            blocks.push(`${metaLine}\n  Download URL: ${downloadUrl}\n  Preview:\n"""\n${preview}\n"""`);
        } else {
            blocks.push(`${metaLine}\n  Download URL: ${downloadUrl}`);
        }
    }

    return [
        'User uploaded attachments available for this request:',
        ...blocks,
        'If asked to create a document, provide a direct downloadable link and include the final file name.'
    ].join('\n');
}

function normalizeGeneratedAttachment(item, index = 0) {
    if (!item || typeof item !== 'object') return null;
    const name = typeof item.name === 'string'
        ? item.name
        : (typeof item.fileName === 'string' ? item.fileName : `Generated document ${index + 1}`);
    const type = typeof item.type === 'string'
        ? item.type
        : (typeof item.mimeType === 'string' ? item.mimeType : 'application/octet-stream');
    const size = Number.isFinite(item.size) ? item.size : 0;
    const url = typeof item.url === 'string'
        ? item.url
        : (typeof item.downloadUrl === 'string' ? item.downloadUrl : '');
    const downloadUrl = typeof item.downloadUrl === 'string' ? item.downloadUrl : url;

    if (!url && !downloadUrl) return null;

    return {
        id: typeof item.id === 'string' ? item.id : `generated-${Date.now()}-${index}`,
        name,
        size,
        type,
        url: url || downloadUrl,
        downloadUrl: downloadUrl || url,
        status: 'uploaded'
    };
}

function extractGeneratedAttachmentsFromPayload(payload) {
    if (!payload || typeof payload !== 'object') return [];

    const candidates = [];
    const direct = [
        payload.attachments,
        payload.generatedAttachments,
        payload.nexus_attachments,
        payload?.nexus?.generatedAttachments,
        payload?.nexus?.attachments,
        payload?.metadata?.attachments,
        payload?.metadata?.generatedAttachments,
        payload?.choices?.[0]?.message?.attachments,
        payload?.choices?.[0]?.delta?.attachments
    ];

    for (const bucket of direct) {
        if (Array.isArray(bucket)) {
            for (const item of bucket) {
                candidates.push(item);
            }
        }
    }

    return candidates
        .map((candidate, index) => normalizeGeneratedAttachment(candidate, index))
        .filter(Boolean);
}

function extractGeneratedAttachmentsFromText(content) {
    if (!content || typeof content !== 'string') return [];
    const matches = content.match(DOCUMENT_LINK_REGEX) || [];
    const results = [];

    for (const [index, rawMatch] of matches.entries()) {
        const sanitized = rawMatch.replace(/[),.;]+$/, '');
        const isDownloadRoute = sanitized.includes('/api/chat/attachments/');
        if (!isDownloadRoute && !DOCUMENT_EXTENSION_REGEX.test(sanitized)) continue;
        const fileName = sanitized.split('/').pop() || `generated-document-${index + 1}`;
        results.push({
            id: `generated-link-${index + 1}`,
            name: decodeURIComponent(fileName),
            size: 0,
            type: 'application/octet-stream',
            url: sanitized,
            downloadUrl: sanitized,
            status: 'uploaded'
        });
    }

    return results;
}

function mergeUniqueAttachments(...attachmentSets) {
    const merged = [];
    const seen = new Set();

    for (const set of attachmentSets) {
        if (!Array.isArray(set)) continue;
        for (const attachment of set) {
            if (!attachment) continue;
            const key = `${attachment.downloadUrl || attachment.url || ''}::${attachment.name || ''}`;
            if (!key || key === '::') continue;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(attachment);
        }
    }

    return merged;
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
        agentId: requestedAgentId,
        attachments = []
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, error: 'Messages array is required' });
    }

    let keepAliveIntervalId = null;
    const streamStartedAt = Date.now();
    let keepAliveTick = 0;
    let keepAliveFrames = ['Reviewing your request'];
    const setKeepAliveFrames = (frames = []) => {
        const filtered = frames.filter((frame) => typeof frame === 'string' && frame.trim().length > 0);
        keepAliveFrames = filtered.length > 0 ? filtered : ['Reviewing your request'];
    };
    const startKeepAlive = () => {
        if (!stream || keepAliveIntervalId) return;
        keepAliveIntervalId = setInterval(() => {
            if (!res.writableEnded) {
                keepAliveTick += 1;
                const elapsedSeconds = Math.floor((Date.now() - streamStartedAt) / 1000);
                const frame = keepAliveFrames[keepAliveTick % keepAliveFrames.length];
                writeSseEvent(
                    res,
                    buildStreamStatus('processing', 'Agent is still working', `${frame} (${elapsedSeconds}s elapsed)`)
                );
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

        const lastUserMessage = getLastUserMessage(messages);
        const intent = detectIntent(messages);

        // Handle Switching Intent BEFORE creating a conversation to prevent dummy threads
        if (intent.id === 'switch') {
            const targetId = await resolveTopicToConversationId(userId, lastUserMessage, query);
            if (targetId) {
                const switchMetadata = buildModelWayMetadata(intent, determinePhase(messages), targetId);
                const switchContent = `🔄 **Switching Context**\n\nI've located the conversation for: "${lastUserMessage.replace(/continue this:|switch to:/gi, '').trim()}". Switching your active session now...`;

                if (stream) {
                    beginSseStream(res);
                    writeSseEvent(res, {
                        metadata: {
                            modelWay: switchMetadata,
                            switchTarget: targetId
                        }
                    });
                    writeSseEvent(res, { content: switchContent });
                    res.write('data: [DONE]\n\n');
                    res.end();
                    return;
                }

                return res.json(structureResponse(switchContent, switchMetadata, {
                    success: true,
                    content: switchContent,
                    switchTarget: targetId
                }));
            } else {
                const failContent = `⚠️ **Conversation Not Found**\n\nI couldn't find a conversation matching: "${lastUserMessage.replace(/continue this:|switch to:/gi, '').trim()}". Please check the title and try again.`;
                if (stream) {
                    beginSseStream(res);
                    writeSseEvent(res, { content: failContent });
                    res.write('data: [DONE]\n\n');
                    res.end();
                    return;
                }
                return res.status(404).json({ success: false, error: 'Conversation not found' });
            }
        }

        // Persist Conversation and User Message
        const conversationId = await getOrCreateConversation(userId, providedConvId);
        const incomingAttachmentRefs = normalizeIncomingAttachments(attachments);
        const storedAttachments = await fetchStoredAttachments(
            conversationId,
            userId,
            incomingAttachmentRefs,
            req.user?.jwtPayload
        );
        const userAttachmentMetadata = storedAttachments.map(toAttachmentMetadataRow);

        const phase = determinePhase(messages);
        const modelWayMetadata = buildModelWayMetadata(intent, phase, conversationId);
        const historyTurns = messages.filter((item) => item?.role === 'user' || item?.role === 'assistant').length;
        setKeepAliveFrames([
            `Understanding your request (${intent.name}, ${phase} phase)`,
            `Reviewing ${historyTurns} recent conversation turns`,
            `Checking ${userAttachmentMetadata.length} uploaded attachment${userAttachmentMetadata.length === 1 ? '' : 's'}`
        ]);

        // PERSIST METADATA for continuity organization
        // Update the conversation context with intent and phase for Sidebar display
        await query(
            `UPDATE ai_conversations 
             SET context = jsonb_set(
                COALESCE(context, '{}'::jsonb), 
                '{modelWay}', 
                jsonb_build_object('intent', $1::text, 'phase', $2::text, 'last_topic', $3::text)
             ),
             updated_at = NOW()
             WHERE id = $4`,
            [intent.id, phase, lastUserMessage.substring(0, 100), conversationId]
        );

        // AUTO-TITLING: If the conversation has a generic or redundant title, update it
        const currentConv = await query('SELECT title FROM ai_conversations WHERE id = $1', [conversationId]);
        const currentTitle = currentConv.data?.[0]?.title;
        const isGeneric = !currentTitle ||
            currentTitle === 'New Conversation' ||
            currentTitle === 'Untitled Conversation' ||
            currentTitle.toLowerCase().startsWith('continue this:') ||
            currentTitle.toLowerCase().startsWith('switch to:');

        if (isGeneric) {
            const newTitle = lastUserMessage.replace(/^(continue this:|switch to:|hey|hi|hello|yo)\s*/i, '').trim();
            if (newTitle && newTitle.length > 5) {
                const truncatedTitle = newTitle.substring(0, 60) + (newTitle.length > 60 ? '...' : '');
                await query('UPDATE ai_conversations SET title = $1 WHERE id = $2', [truncatedTitle, conversationId]);
            }
        }

        conversations.set(conversationId, {
            intent: intent.id,
            phase,
            updatedAt: new Date().toISOString()
        });

        // Save the last user message
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'user') {
            const userMetadata = {
                ...(lastMessage.metadata || {}),
                attachments: userAttachmentMetadata
            };
            await saveMessage(conversationId, 'user', lastMessage.content, userMetadata);
        }

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
            writeSseEvent(
                res,
                buildStreamStatus(
                    'context_loading',
                    'Loading business context',
                    `Reviewing ${historyTurns} recent turns and ${userAttachmentMetadata.length} attachment${userAttachmentMetadata.length === 1 ? '' : 's'}.`
                )
            );
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
        const attachmentContext = await buildAttachmentContext(storedAttachments);
        if (attachmentContext) {
            contextSystemMessage = contextSystemMessage
                ? `${contextSystemMessage}\n\n${attachmentContext}`
                : attachmentContext;
        }
        const modelWayInstructionBlock = buildModelWayInstructionBlock(intent, phase);
        contextSystemMessage = contextSystemMessage
            ? `${contextSystemMessage}\n\n${modelWayInstructionBlock}`
            : modelWayInstructionBlock;
        const contextInjected = Boolean(contextSystemMessage);
        setKeepAliveFrames([
            `Synthesizing context for ${intent.name} (${phase})`,
            `Preparing agent instructions for ${resolvedAgentId}`,
            `Waiting for OpenClaw to generate the response`
        ]);
        if (stream && contextInjected) {
            writeSseEvent(res, buildStreamStatus('context_ready', 'Context ready', 'Business context was injected from backend knowledge.'));
        } else if (stream) {
            writeSseEvent(res, buildStreamStatus('context_ready', 'Context ready', 'Proceeding with conversation context only.'));
        }

        // Strip any system messages from client and inject deterministic backend context
        const openClawMessages = buildOpenClawMessages(messages, contextSystemMessage);

        const openClawSessionId = buildOpenClawSessionId(userId, conversationId);

        // Pure proxy payload: OpenClaw's agent runtime (SOUL.md, AGENTS.md) drives behavior
        const openClawPayload = {
            model: 'openclaw:main', // Route through OpenClaw agent runtime
            messages: openClawMessages,
            stream: stream,
            user: openClawSessionId, // Isolate OpenClaw memory by Nexus conversation
            conversationId,
            nexus: {
                conversationId,
                userId,
                attachments: userAttachmentMetadata
            }
        };
        const modelWayTools = getModelWayToolsForIntent(intent.id);
        if (modelWayTools.length > 0) {
            openClawPayload.tools = modelWayTools;
            openClawPayload.toolChoice = 'auto';
        }

        const runtimeInfo = agentRuntime.getRuntimeInfo();
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
            attachmentCount: userAttachmentMetadata.length,
            modelWayTools: modelWayTools.length > 0 ? modelWayTools : undefined,
            stream,
            runtime: runtimeInfo.id,
            endpoint: runtimeInfo.chatCompletionsUrl
        });
        if (stream) {
            writeSseEvent(
                res,
                buildStreamStatus(
                    'openclaw_request',
                    'Handing off to OpenClaw',
                    `Sending enriched prompt to ${openClawAgentId} for final response generation.`
                )
            );
        }

        // Call OpenClaw Chat Completions API
        const openClawResponse = await agentRuntime.chatCompletions(openClawPayload, {
            agentId: openClawAgentId
        });

        if (!openClawResponse.ok) {
            const errorText = await openClawResponse.text();
            throw new Error(`OpenClaw API error: ${openClawResponse.status} - ${errorText}`);
        }
        if (stream) {
            writeSseEvent(
                res,
                buildStreamStatus(
                    'openclaw_connected',
                    'OpenClaw connected',
                    'Generating final answer now.'
                )
            );
        }

        // Check if upstream response is JSON (non-streaming)
        const contentType = openClawResponse.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            // Handle non-streaming upstream response from Bridge
            const data = await openClawResponse.json();
            const content = data.choices?.[0]?.message?.content || '';
            const generatedAttachments = mergeUniqueAttachments(
                extractGeneratedAttachmentsFromPayload(data),
                extractGeneratedAttachmentsFromText(content)
            );

            // Audit: Save Assistant Response
            if (content || generatedAttachments.length) {
                const assistantMetadata = {
                    model: data.model || 'openclaw',
                    usage: data.usage || null,
                    modelWay: modelWayMetadata,
                    attachments: generatedAttachments
                };
                await saveMessage(conversationId, 'assistant', content || 'Generated documents attached.', assistantMetadata);
            }

            // If client wanted stream, emit it as an SSE event sequence
            if (stream) {
                writeSseEvent(res, buildStreamStatus('thinking', 'Agent is thinking', 'Preparing response with orchestration metadata.'));
                writeSseEvent(res, buildStreamStatus('responding', 'Agent is responding', 'Streaming response started.'));

                // 2. Content event
                if (content) {
                    writeSseEvent(res, { content });
                }
                if (generatedAttachments.length) {
                    writeSseEvent(res, { metadata: { generatedAttachments } });
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
                    usage: data.usage,
                    attachments: generatedAttachments
                }
                );
                return res.json(response);
            }
        }

        if (!stream) {
            // Non-streaming: return JSON response
            const data = await openClawResponse.json();
            const content = data.choices?.[0]?.message?.content || '';
            const generatedAttachments = mergeUniqueAttachments(
                extractGeneratedAttachmentsFromPayload(data),
                extractGeneratedAttachmentsFromText(content)
            );

            // Audit: Save Assistant Response
            if (content || generatedAttachments.length) {
                const assistantMetadata = {
                    model: data.model || 'openclaw',
                    usage: data.usage || null,
                    modelWay: modelWayMetadata,
                    attachments: generatedAttachments
                };
                await saveMessage(conversationId, 'assistant', content || 'Generated documents attached.', assistantMetadata);
            }

            const response = structureResponse(content, modelWayMetadata, {
                success: true,
                content,
                model: data.model,
                usage: data.usage,
                attachments: generatedAttachments
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
        let generatedAttachmentCandidates = [];

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    // Audit: Save collected assistant response
                    if (fullAssistantContent) {
                        const generatedAttachments = mergeUniqueAttachments(
                            generatedAttachmentCandidates,
                            extractGeneratedAttachmentsFromText(fullAssistantContent)
                        );
                        const assistantMetadata = {
                            model: 'openclaw:stream',
                            modelWay: modelWayMetadata,
                            attachments: generatedAttachments
                        };
                        await saveMessage(conversationId, 'assistant', fullAssistantContent, assistantMetadata);
                        if (generatedAttachments.length) {
                            writeSseEvent(res, { metadata: { generatedAttachments } });
                        }
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
                                const generatedAttachments = mergeUniqueAttachments(
                                    generatedAttachmentCandidates,
                                    extractGeneratedAttachmentsFromText(fullAssistantContent)
                                );
                                const assistantMetadata = {
                                    model: 'openclaw:stream',
                                    modelWay: modelWayMetadata,
                                    attachments: generatedAttachments
                                };
                                await saveMessage(conversationId, 'assistant', fullAssistantContent, assistantMetadata);
                                if (generatedAttachments.length) {
                                    writeSseEvent(res, { metadata: { generatedAttachments } });
                                }
                                fullAssistantContent = ''; // Prevent double save if loop continues
                            }
                            writeSseEvent(res, buildStreamStatus('completed', 'Response complete', null));
                            res.write('data: [DONE]\n\n');
                            stopKeepAlive();
                            continue;
                        }

                        try {
                            const chunk = JSON.parse(dataStr);
                            const chunkAttachments = extractGeneratedAttachmentsFromPayload(chunk);
                            if (chunkAttachments.length) {
                                generatedAttachmentCandidates = mergeUniqueAttachments(generatedAttachmentCandidates, chunkAttachments);
                            }
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
                const generatedAttachments = mergeUniqueAttachments(
                    generatedAttachmentCandidates,
                    extractGeneratedAttachmentsFromText(fullAssistantContent)
                );
                saveMessage(conversationId, 'assistant', fullAssistantContent, {
                    model: 'openclaw:stream-partial',
                    modelWay: modelWayMetadata,
                    attachments: generatedAttachments
                }).catch(e => logger.error('Failed to save partial message', e));
                if (generatedAttachments.length) {
                    writeSseEvent(res, { metadata: { generatedAttachments } });
                }
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
        const runtimeInfo = agentRuntime.getRuntimeInfo();
        const capabilities = agentRuntime.getCapabilities();
        const response = await agentRuntime.healthCheck({ timeoutMs: 5000 });

        if (response.ok) {
            return res.json({
                success: true,
                openclaw: 'connected',
                runtime: runtimeInfo.id,
                url: runtimeInfo.baseUrl,
                capabilities,
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
 * GET /api/ai/runtime
 * Inspect active agent runtime and capabilities
 */
router.get('/runtime', authenticateToken, async (req, res) => {
    try {
        const runtimeInfo = agentRuntime.getRuntimeInfo();
        const capabilities = agentRuntime.getCapabilities();

        let health = { ok: false, status: null, error: null };
        try {
            const healthResponse = await agentRuntime.healthCheck({ timeoutMs: 3000 });
            health = {
                ok: healthResponse.ok,
                status: healthResponse.status,
                error: null
            };
        } catch (error) {
            health = {
                ok: false,
                status: null,
                error: error.message
            };
        }

        res.json({
            success: true,
            runtime: runtimeInfo,
            capabilities,
            health
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to inspect runtime'
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
 * GET /api/ai/search
 * Global search across conversation titles and message content
 */
router.get('/search', authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const { q } = req.query;

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!q || q.trim().length < 2) {
        return res.json({ success: true, data: [] });
    }

    try {
        const searchTerm = `%${q}%`;
        const result = await query(
            `SELECT DISTINCT ON (c.id)
                c.id, 
                c.title, 
                c.updated_at,
                (
                    SELECT content 
                    FROM ai_messages m2 
                    WHERE m2.conversation_id = c.id 
                    AND m2.content ILIKE $2
                    ORDER BY m2.created_at DESC
                    LIMIT 1
                ) as snippet
             FROM ai_conversations c
             LEFT JOIN ai_messages m ON c.id = m.conversation_id
             WHERE c.user_id = $1
             AND (c.title ILIKE $2 OR m.content ILIKE $2)
             ORDER BY c.id, c.updated_at DESC
             LIMIT 20`,
            [userId, searchTerm],
            req.user.jwtPayload
        );

        if (result.error) {
            logger.error('Search failed', { error: result.error, userId, q });
            return res.status(500).json({ success: false, error: 'Search failed' });
        }

        res.json({ success: true, data: result.data || [] });
    } catch (error) {
        logger.error('Search error', { error: error.message, userId, q });
        res.status(500).json({ success: false, error: 'Search failed' });
    }
});

/**
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
 * GET /api/ai/conversations/:id
 * Get a single conversation by ID
 */
router.get('/conversations/:id', authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const result = await query(
            `SELECT id, title, model, system_prompt, message_count, is_archived,
                context, created_at, updated_at, user_id
             FROM ai_conversations
             WHERE id = $1 AND user_id = $2`,
            [id, userId],
            req.user.jwtPayload
        );

        if (result.error) {
            logger.error('Failed to fetch conversation', { error: result.error, userId, id });
            return res.status(500).json({ success: false, error: 'Failed to fetch conversation' });
        }

        if (!result.data || result.data.length === 0) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }

        res.json({ success: true, data: result.data[0] });
    } catch (error) {
        logger.error('Error fetching conversation', { error: error.message, userId, id });
        res.status(500).json({ success: false, error: 'Failed to fetch conversation' });
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
