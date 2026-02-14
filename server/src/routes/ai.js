const express = require('express');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const dns = require('dns').promises;
let mammoth = null;
try {
    mammoth = require('mammoth');
} catch (_error) {
    // Optional dependency for DOCX extraction
}
let pdfParse = null;
try {
    pdfParse = require('pdf-parse');
} catch (_error) {
    // Optional dependency for PDF extraction
}
let xlsx = null;
try {
    xlsx = require('xlsx');
} catch (_error) {
    // Optional dependency for spreadsheet extraction
}
let JSZip = null;
try {
    JSZip = require('jszip');
} catch (_error) {
    // Optional dependency for PPTX extraction
}
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { normalizeAgentId } = require('../config/agentCatalog');
const { assembleKnowledgeContext } = require('../services/knowledgeContextService');
const { getAgentRuntime } = require('../services/agentRuntime');
const { toolActivityBridge } = require('../services/toolActivityBridge');
const {
    INTENT_TYPES,
    PHASES,
    buildDiscoveryRefusalMessage,
    buildModelWayMetadata,
    buildOpenClawMessages,
    detectIntent,
    determinePhase,
    getLastUserMessage,
    isEmailConnectConfirmationFollowUp,
    isEmailConnectionFollowUp,
    shouldRefuseDirectExecutionInDiscovery,
    resolveTopicToConversationId
} = require('../services/aiChatOrchestration');
require('../../loadEnv');

const router = express.Router();

function toOpenClawAgentId(agentId) {
    // Use a dedicated OpenClaw agent workspace optimized for Nexus tool usage.
    if (agentId === 'executive-assistant') return 'nexus';
    return agentId;
}

function buildOpenClawSessionId(userId, conversationId) {
    const raw = `${userId}:${conversationId}`;
    return raw.replace(/[^a-zA-Z0-9:_-]/g, '_').slice(0, 200);
}

// OpenClaw configuration
const agentRuntime = getAgentRuntime();
const {
    TOOLS_NEXUS_BRIDGED,
    TOOLS_OPENCLAW_NATIVE,
    ALL_TOOLS,
    // Backward-compatible aliases
    TOOLS_BASE,
    TOOLS_NEXUS_INTEGRATIONS,
    DEFAULT_TOOLS,
    ENABLE_NEXUS_INTEGRATION_TOOLS
} = require('../config/agentTools');

const OPENCLAW_ENABLE_MODELWAY_TOOLS = process.env.OPENCLAW_ENABLE_MODELWAY_TOOLS !== 'false';
const OPENCLAW_ENABLE_NEXUS_INTEGRATION_TOOLS = ENABLE_NEXUS_INTEGRATION_TOOLS;
const OPENCLAW_MODELWAY_PROFILE = String(process.env.OPENCLAW_MODELWAY_PROFILE || 'lean').trim().toLowerCase();
const OPENCLAW_STRICT_GROUNDED_MODE = process.env.OPENCLAW_STRICT_GROUNDED_MODE !== 'false';
const OPENCLAW_HIDE_INTERNAL_PROCESS = process.env.OPENCLAW_HIDE_INTERNAL_PROCESS !== 'false';

// Only track Nexus-bridged tool IDs for intent routing.
// OpenClaw-native tools (web_search, create_skill, etc.) are managed by
// OpenClaw's own agent workspace tool policy — Nexus should not gate them.
const OPENCLAW_TOOLS_NEXUS_BRIDGED_IDS = TOOLS_NEXUS_BRIDGED.map(t => t.id);
const OPENCLAW_TOOLS_OPENCLAW_NATIVE_IDS = TOOLS_OPENCLAW_NATIVE.map(t => t.id);
const OPENCLAW_TOOLS_ALL_IDS = ALL_TOOLS.map(t => t.id);
// Backward-compatible aliases used by logging and assistantCore
const OPENCLAW_TOOLS_BASE = TOOLS_BASE.map(t => t.id);
const OPENCLAW_TOOLS_NEXUS_INTEGRATIONS = TOOLS_NEXUS_INTEGRATIONS.map(t => t.id);
const OPENCLAW_TOOLS_DEFAULT = DEFAULT_TOOLS.map(t => t.id);
const OPENCLAW_TOOLS_BY_INTENT = {
    // LEARN and SOLVE: OpenClaw-native tools are available via OpenClaw's plugin system;
    // Nexus-bridged tools are available for all intents when enabled.
    [INTENT_TYPES.LEARN.id]: OPENCLAW_ENABLE_NEXUS_INTEGRATION_TOOLS
        ? OPENCLAW_TOOLS_NEXUS_BRIDGED_IDS
        : [],
    [INTENT_TYPES.SOLVE.id]: OPENCLAW_ENABLE_NEXUS_INTEGRATION_TOOLS
        ? OPENCLAW_TOOLS_NEXUS_BRIDGED_IDS
        : [],
    [INTENT_TYPES.DECIDE.id]: OPENCLAW_ENABLE_NEXUS_INTEGRATION_TOOLS
        ? OPENCLAW_TOOLS_NEXUS_BRIDGED_IDS
        : [],
    [INTENT_TYPES.WRITE.id]: []
};
const MAX_ATTACHMENT_CONTEXT_BYTES = 200 * 1024;
const MAX_DOCX_CONTEXT_BYTES = 10 * 1024 * 1024;
const MAX_PDF_CONTEXT_BYTES = 15 * 1024 * 1024;
const MAX_SPREADSHEET_CONTEXT_BYTES = 10 * 1024 * 1024;
const MAX_PPTX_CONTEXT_BYTES = 20 * 1024 * 1024;
const MAX_ATTACHMENT_PREVIEW_CHARS = 4000;
const DOCUMENT_LINK_REGEX = /\b(?:https?:\/\/[^\s)]+|\/api\/chat\/attachments\/[^\s)]+|\/media\/[^\s)]+)\b/gi;
const DOCUMENT_EXTENSION_REGEX = /\.(pdf|doc|docx|txt|md|rtf|csv|xlsx|xls|ppt|pptx|json)(?:[?#].*)?$/i;
const CONTROL_RESOURCE_METHODS = {
    agents: 'listAgents',
    sessions: 'listSessions',
    channels: 'listChannels',
    plugins: 'listPlugins'
};
const EMAIL_ADDRESS_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const EMAIL_CONNECT_INTENT_REGEX = /(connect|set\s*up|setup|link|integrat|oauth|imap|inbox|mailbox|email\s+account)/i;
const PROVIDER_CONFIRMATION_QUESTION_REGEX = /(could you please confirm|please confirm if this is|is this (a|an)?\s*(microsoft|google)|another type of email provider|what provider|which provider)/i;
const FORCE_EMAIL_CONNECT_TOOLS = process.env.OPENCLAW_FORCE_EMAIL_CONNECT_TOOLS !== 'false';

// In-memory conversation tracking (in production, use database)
const conversations = new Map();

function getModelWayToolsForIntent(intentId) {
    if (!OPENCLAW_ENABLE_MODELWAY_TOOLS) return [];
    return OPENCLAW_TOOLS_BY_INTENT[intentId] || [];
}

function mergeUniqueToolIds(base = [], extra = []) {
    const merged = new Set([...(Array.isArray(base) ? base : []), ...(Array.isArray(extra) ? extra : [])]);
    return Array.from(merged).filter((toolId) => typeof toolId === 'string' && toolId.trim().length > 0);
}

function shouldForceEmailConnectTools(lastUserMessage = '', messages = [], guardState = null) {
    if (!FORCE_EMAIL_CONNECT_TOOLS) return false;
    if (guardState?.recommendation) return true;
    const normalized = String(lastUserMessage || '');
    return (
        EMAIL_CONNECT_INTENT_REGEX.test(normalized) ||
        isEmailConnectConfirmationFollowUp(messages, normalized) ||
        isEmailConnectionFollowUp(messages, normalized) ||
        hasEmailOnlyContent(normalized)
    );
}

function buildModelWayInstructionBlock(intent, phase) {
    const phaseName = phase.charAt(0).toUpperCase() + phase.slice(1);
    const intentName = intent?.name || 'Assist';
    const instructions = [
        'Model-Way Runtime Instructions:',
        `- Intent: ${intentName}`,
        `- Phase: ${phaseName}`,
        '- If the task requires external or current information, use web_search first.',
        '- If results are thin or blocked, use advanced_scrape for direct extraction.',
        '- For integration connect/status workflows, prefer Nexus tools: nexus_get_integration_status, nexus_search_emails, nexus_resolve_email_provider, nexus_start_email_connection, nexus_connect_imap, nexus_test_integration_connection, nexus_disconnect_integration.',
        '- When you use a Nexus integration tool, explicitly state which tool you used and summarize what it returned.',
        '- For email connection requests: confirm the target email first, then run nexus_resolve_email_provider before proposing any provider-specific flow.',
        '- For inbox requests (today, last week, last month, specific sender), use nexus_search_emails with the appropriate datePreset/from/query filters.',
        '- Prefer OAuth for Microsoft 365 and Google Workspace; fallback to nexus_connect_imap for custom/non-exchange providers.',
        '- Never claim direct visibility into OAuth tokens. Report live state using tool results only.',
        '- Keep markdown clean and readable: plain paragraphs first, bullets only when listing items, and short sections.',
        '- Use fenced code blocks only for real code/commands. Do not wrap normal text, domains, filenames, or branch names in code fences.',
        '- Use inline code for short technical tokens such as package names, file paths, and URLs.',
        '- Keep responses concise and direct. Avoid repetitive confirmations, apologies, or filler.',
        '- Include direct source links for external facts.'
    ];

    if (OPENCLAW_MODELWAY_PROFILE === 'full') {
        instructions.push('- For missing capability, use search_skills then install_skill before proposing custom implementation.');
    }

    if (OPENCLAW_STRICT_GROUNDED_MODE) {
        instructions.push('- Do not claim actions are completed unless tool output confirms completion.');
        instructions.push('- For repo/activity/date claims, run git commands first and include concrete commit IDs or ISO dates.');
        instructions.push('- If not yet verified, state that explicitly and ask for permission before claiming completion.');
    }

    if (OPENCLAW_HIDE_INTERNAL_PROCESS) {
        instructions.push('- Do not narrate internal thought process or speculative steps as completed work.');
        instructions.push('- Report only completed results and the immediate next action.');
    }

    return instructions.join('\n');
}

function buildSoulContext() {
    try {
        const soulPath = path.join(process.cwd(), 'SOUL.md');
        if (fs.existsSync(soulPath)) {
            const soulContent = fs.readFileSync(soulPath, 'utf8');
            return `## Agent Identity & Philosophy (SOUL)\n${soulContent}`;
        }
    } catch (error) {
        logger.warn('Failed to read SOUL.md', { error: error.message });
    }
    return null;
}

function buildCodebaseContext() {
    const codebasePath = process.env.NEXUS_CODEBASE_PATH || process.cwd();
    // Only provide context if we are likely in a repo (check for .git or package.json)
    const hasGit = fs.existsSync(path.join(codebasePath, '.git'));
    const hasPackage = fs.existsSync(path.join(codebasePath, 'package.json'));

    if (hasGit || hasPackage) {
        return [
            '## Codebase Environment',
            `You are running in a development environment.`,
            `The codebase is located at: ${codebasePath}`,
            `You have direct filesystem access to these files.`,
            `When asked to review or modify code, you should use your tools to read files from this path.`
        ].join('\n');
    }
    return null;
}

function buildToolCapabilityBlock() {
    if (!ALL_TOOLS || ALL_TOOLS.length === 0) return null;
    const toolList = ALL_TOOLS.map(t => `- ${t.name} (${t.id}): ${t.description}`).join('\n');
    return [
        '## Available Tools & Capabilities',
        'You have access to the following tools and MUST use them to take action on behalf of the user:',
        toolList,
        '',
        'IMPORTANT: You CAN take action. When a user asks you to do something (clone a repo, search the web, run a command, read/write files, check email, etc.), use your tools to do it directly.',
        'Do NOT tell the user you lack access or cannot perform actions — you are an agentic assistant with real execution capabilities.',
        'If a specific action is truly outside your tools, explain what alternative approach you can take instead.'
    ].join('\n');
}

function extractEmailFromText(text = '') {
    const normalized = String(text || '').trim().toLowerCase();
    const match = normalized.match(EMAIL_ADDRESS_REGEX);
    return match ? match[0] : null;
}

function extractMostRecentEmailFromMessages(messages = []) {
    if (!Array.isArray(messages) || messages.length === 0) return null;
    for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index];
        if (!message || typeof message.content !== 'string') continue;
        const email = extractEmailFromText(message.content);
        if (email) return email;
    }
    return null;
}

function hasEmailOnlyContent(text = '') {
    const normalized = String(text || '').trim().toLowerCase();
    if (!normalized) return false;
    const email = extractEmailFromText(normalized);
    if (!email) return false;
    const stripped = normalized.replace(email, '').replace(/[\s.,;:!?()[\]{}"'`-]/g, '');
    return stripped.length === 0;
}

function inferEmailProviderFromMxRecords(mxRecords = []) {
    const hosts = mxRecords
        .map((record) => String(record?.exchange || '').toLowerCase())
        .filter(Boolean);

    const hasHost = (fragments = []) =>
        hosts.some((host) => fragments.some((fragment) => host.includes(fragment)));

    if (hasHost(['protection.outlook.com', 'outlook.com', 'office365.com'])) {
        return {
            provider: 'microsoft',
            displayName: 'Microsoft 365',
            workflow: 'oauth',
            confidence: 'high'
        };
    }

    if (hasHost(['google.com', 'googlemail.com'])) {
        return {
            provider: 'google_workspace',
            displayName: 'Google Workspace',
            workflow: 'oauth',
            confidence: 'high'
        };
    }

    return {
        provider: 'custom_imap',
        displayName: 'Custom IMAP/SMTP',
        workflow: 'imap_manual',
        confidence: hosts.length ? 'medium' : 'low'
    };
}

async function resolveEmailProviderForGuard(lastUserMessage = '', messages = []) {
    const normalizedMessage = String(lastUserMessage || '');
    const isConnectFlowMessage =
        EMAIL_CONNECT_INTENT_REGEX.test(normalizedMessage) ||
        isEmailConnectConfirmationFollowUp(messages, normalizedMessage) ||
        isEmailConnectionFollowUp(messages, normalizedMessage) ||
        hasEmailOnlyContent(normalizedMessage);

    if (!isConnectFlowMessage) return null;

    const email = extractEmailFromText(normalizedMessage) || extractMostRecentEmailFromMessages(messages);
    if (!email) return null;

    const domainMatch = email.match(/^[^\s@]+@([^\s@]+\.[^\s@]+)$/);
    if (!domainMatch) return null;

    const domain = domainMatch[1];
    let mxRecords = [];

    try {
        mxRecords = await dns.resolveMx(domain);
        mxRecords.sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0));
    } catch (_error) {
        mxRecords = [];
    }

    const recommendation = inferEmailProviderFromMxRecords(mxRecords);
    return {
        email,
        domain,
        mxRecords,
        recommendation
    };
}

function buildEmailProviderGuardInstruction(guardState) {
    if (!guardState?.recommendation) return null;
    const { email, domain, recommendation } = guardState;
    if (!['microsoft', 'google_workspace'].includes(recommendation.provider)) return null;

    return [
        'Email Provider Guard (deterministic backend resolution):',
        `- Target email: ${email}`,
        `- Domain: ${domain}`,
        `- MX-resolved provider: ${recommendation.displayName} (${recommendation.provider})`,
        '- Do not ask the user to confirm provider type.',
        '- First run nexus_get_integration_status and inspect this provider for connected/expired state.',
        '- If already connected, run nexus_test_integration_connection for this provider.',
        '- If nexus_test_integration_connection returns connected=true, do not re-run OAuth; acknowledge existing connection and continue with the requested task.',
        '- Only run nexus_start_email_connection if provider is missing, disconnected, expired, or the saved-token test fails.'
    ].join('\n');
}

function enforceResolvedProviderResponse(content, guardState) {
    const original = String(content || '');
    if (!original) return original;
    if (!guardState?.recommendation) return original;

    const recommendation = guardState.recommendation;
    if (!['microsoft', 'google_workspace'].includes(recommendation.provider)) return original;
    if (!PROVIDER_CONFIRMATION_QUESTION_REGEX.test(original)) return original;

    return [
        `I resolved \`${guardState.email}\` via MX lookup to **${recommendation.displayName}**.`,
        'No provider confirmation is needed.',
        `I will verify whether ${recommendation.displayName} is already connected and only start OAuth if reconnection is required.`
    ].join('\n\n');
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
    if (typeof res.flush === 'function') {
        res.flush();
    }
}

function beginSseStream(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    if (typeof res.flush === 'function') {
        res.flush();
    }
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

async function requireInstanceOwner(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        const tokenRoles = Array.isArray(req.user?.jwtPayload?.roles)
            ? req.user.jwtPayload.roles.map((role) => String(role || '').toLowerCase())
            : [];
        const tokenRoleClaim = String(req.user?.jwtPayload?.role || '').toLowerCase();
        if (tokenRoles.includes('owner') || tokenRoleClaim === 'owner') {
            return next();
        }

        const ownershipResult = await query(
            'SELECT role FROM user_profiles WHERE user_id = $1 LIMIT 1',
            [userId],
            req.user?.jwtPayload
        );

        if (ownershipResult.error) {
            logger.error('Failed to verify owner role for runtime control', {
                userId,
                error: ownershipResult.error
            });
            return res.status(500).json({
                success: false,
                error: 'Failed to verify permissions'
            });
        }

        const profileRole = String(ownershipResult.data?.[0]?.role || '').toLowerCase();
        if (profileRole !== 'owner') {
            return res.status(403).json({
                success: false,
                error: 'Owner role required'
            });
        }

        return next();
    } catch (error) {
        logger.error('Runtime control owner check failed', {
            userId: req.user?.id,
            error: error.message
        });
        return res.status(500).json({
            success: false,
            error: 'Permission check failed'
        });
    }
}

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

// Helper to fetch authoritative conversation history from DB
// This fixes "Short Term Memory" by ensuring the agent sees the full recorded history
// even if the client payload is truncated.
async function fetchConversationHistory(conversationId, limit = 50) {
    const result = await query(
        `SELECT role, content
         FROM ai_messages
         WHERE conversation_id = $1
         ORDER BY created_at ASC`, // Ascending order is critical for LLM context
        [conversationId]
    );

    if (result.error) {
        logger.warn('Failed to fetch conversation history', { conversationId, error: result.error });
        return [];
    }

    // Return all messages, let the runtime handle context window, 
    // but we could limit here if needed.
    const messages = result.data || [];
    if (limit && messages.length > limit) {
        return messages.slice(messages.length - limit);
    }
    return messages;
}

function normalizeIntegrationStatus(status) {
    const normalized = String(status || '').toLowerCase().trim();
    if (normalized === 'active' || normalized === 'connected') return 'connected';
    if (!normalized) return 'unknown';
    return normalized;
}

function toIsoStringOrNull(value) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
}

async function buildIntegrationSystemContext(userId, jwtPayload) {
    const result = await query(
        `SELECT
           ui.integration_name,
           ui.status,
           ui.last_sync_at,
           ui.updated_at,
           ot.expires_at,
           CASE
             WHEN ot.expires_at IS NOT NULL AND ot.expires_at <= NOW() THEN true
             ELSE false
           END AS token_expired
         FROM user_integrations ui
         LEFT JOIN oauth_tokens ot
           ON ot.user_id = ui.user_id
          AND ot.integration_slug = ui.integration_name
         WHERE ui.user_id = $1
         ORDER BY updated_at DESC
         LIMIT 25`,
        [userId],
        jwtPayload
    );

    if (result.error) {
        logger.warn('Failed to load integration context for chat prompt', {
            userId,
            error: result.error
        });
        return null;
    }

    const rows = result.data || [];

    if (!rows.length) {
        return [
            'Nexus Integration Context (live backend state):',
            '- No integrations are currently connected for this user.',
            '- Supported email workflows: Microsoft 365 OAuth (`microsoft`), Google Workspace OAuth (`google_workspace`), and custom IMAP manual setup.'
        ].join('\n');
    }

    const lines = rows.slice(0, 15).map((row) => {
        const name = String(row.integration_name || 'unknown');
        const status = row.token_expired
            ? 'expired'
            : normalizeIntegrationStatus(row.status);
        const lastSync = toIsoStringOrNull(row.last_sync_at);
        const updatedAt = toIsoStringOrNull(row.updated_at);
        const expiresAt = toIsoStringOrNull(row.expires_at);
        const statusDetails = [
            lastSync ? `last_sync=${lastSync}` : 'last_sync=none',
            updatedAt ? `updated_at=${updatedAt}` : 'updated_at=unknown',
            expiresAt ? `token_expires=${expiresAt}` : 'token_expires=unknown'
        ].join(', ');
        return `- ${name}: ${status} (${statusDetails})`;
    });

    return [
        'Nexus Integration Context (live backend state):',
        ...lines,
        '- OAuth credentials/tokens are stored server-side and are never exposed to the assistant model.',
        '- If a user asks to connect email, first confirm the address, then route to provider-specific workflow (Microsoft, Google Workspace, or manual IMAP).'
    ].join('\n');
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

function resolveModelName(modelId) {
    if (modelId === 'openclaw:nexus') return 'DeepSeek v3.2 (via OpenClaw)';
    if (typeof modelId === 'string' && modelId.startsWith('openclaw:')) {
        return `${modelId.replace('openclaw:', '')} (via OpenClaw)`;
    }
    return modelId || 'default';
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

function isDocxAttachment(attachmentRow) {
    const type = String(attachmentRow.file_type || '').toLowerCase();
    const fileName = String(attachmentRow.file_name || '').toLowerCase();

    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return true;
    }

    return fileName.endsWith('.docx');
}

function isPdfAttachment(attachmentRow) {
    const type = String(attachmentRow.file_type || '').toLowerCase();
    const fileName = String(attachmentRow.file_name || '').toLowerCase();
    return type === 'application/pdf' || fileName.endsWith('.pdf');
}

function isSpreadsheetAttachment(attachmentRow) {
    const type = String(attachmentRow.file_type || '').toLowerCase();
    const fileName = String(attachmentRow.file_name || '').toLowerCase();

    if (
        type.includes('spreadsheet')
        || type.includes('excel')
        || type.includes('csv')
    ) {
        return true;
    }

    return /\.(csv|xlsx|xls)$/i.test(fileName);
}

function isPptxAttachment(attachmentRow) {
    const type = String(attachmentRow.file_type || '').toLowerCase();
    const fileName = String(attachmentRow.file_name || '').toLowerCase();
    return type.includes('presentationml') || fileName.endsWith('.pptx');
}

function decodeXmlEntities(raw) {
    return String(raw || '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

function clipPreview(text) {
    const normalized = String(text || '').replace(/\r/g, '').trim();
    if (!normalized) return '';
    if (normalized.length <= MAX_ATTACHMENT_PREVIEW_CHARS) return normalized;
    return `${normalized.slice(0, MAX_ATTACHMENT_PREVIEW_CHARS)}\n...[truncated]`;
}

async function readDocxPreview(absolutePath) {
    if (!mammoth) return '';

    const result = await mammoth.extractRawText({ path: absolutePath });
    return clipPreview(result?.value || '');
}

async function readPdfPreview(absolutePath) {
    if (!pdfParse) return '';

    const buffer = await fs.promises.readFile(absolutePath);
    const result = await pdfParse(buffer);
    return clipPreview(result?.text || '');
}

async function readSpreadsheetPreview(absolutePath) {
    if (!xlsx) return '';

    const workbook = xlsx.readFile(absolutePath, { dense: true });
    const lines = [];
    const sheetNames = (workbook.SheetNames || []).slice(0, 3);

    for (const sheetName of sheetNames) {
        const sheet = workbook.Sheets?.[sheetName];
        if (!sheet) continue;

        lines.push(`Sheet: ${sheetName}`);
        const rows = xlsx.utils.sheet_to_json(sheet, {
            header: 1,
            raw: false,
            defval: ''
        });

        const limitedRows = rows.slice(0, 50);
        for (const row of limitedRows) {
            if (!Array.isArray(row)) continue;
            const cells = row.slice(0, 12).map((cell) => String(cell ?? '').trim());
            if (cells.every((value) => !value)) continue;
            lines.push(cells.join(' | '));
        }
    }

    return clipPreview(lines.join('\n'));
}

function collectPptxSlideText(xmlContent) {
    const matches = xmlContent.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
    const parts = [];

    for (const fragment of matches) {
        const text = fragment
            .replace(/^<a:t[^>]*>/, '')
            .replace(/<\/a:t>$/, '');
        const decoded = decodeXmlEntities(text).trim();
        if (decoded) {
            parts.push(decoded);
        }
    }

    return parts.join(' ');
}

async function readPptxPreview(absolutePath) {
    if (!JSZip) return '';

    const buffer = await fs.promises.readFile(absolutePath);
    const zip = await JSZip.loadAsync(buffer);
    const slidePaths = Object.keys(zip.files)
        .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
        .sort((a, b) => {
            const aNum = Number((a.match(/slide(\d+)\.xml/i) || [])[1] || 0);
            const bNum = Number((b.match(/slide(\d+)\.xml/i) || [])[1] || 0);
            return aNum - bNum;
        })
        .slice(0, 20);

    const lines = [];
    for (const slidePath of slidePaths) {
        const xmlContent = await zip.files[slidePath].async('string');
        const slideText = collectPptxSlideText(xmlContent);
        if (!slideText) continue;
        const slideNumber = (slidePath.match(/slide(\d+)\.xml/i) || [])[1] || '?';
        lines.push(`Slide ${slideNumber}: ${slideText}`);
    }

    return clipPreview(lines.join('\n'));
}

async function readAttachmentPreview(attachmentRow) {
    try {
        const fileSize = Number(attachmentRow.file_size) || 0;
        const isDocx = isDocxAttachment(attachmentRow);
        const isPdf = isPdfAttachment(attachmentRow);
        const isSpreadsheet = isSpreadsheetAttachment(attachmentRow);
        const isPptx = isPptxAttachment(attachmentRow);
        const maxBytes = isDocx
            ? MAX_DOCX_CONTEXT_BYTES
            : isPdf
                ? MAX_PDF_CONTEXT_BYTES
                : isSpreadsheet
                    ? MAX_SPREADSHEET_CONTEXT_BYTES
                    : isPptx
                        ? MAX_PPTX_CONTEXT_BYTES
                        : MAX_ATTACHMENT_CONTEXT_BYTES;
        if (fileSize > maxBytes) return '';

        const isTextAttachment = isLikelyTextAttachment(attachmentRow);
        if (!isDocx && !isPdf && !isSpreadsheet && !isPptx && !isTextAttachment) return '';

        const absolutePath = path.isAbsolute(attachmentRow.storage_path)
            ? attachmentRow.storage_path
            : path.join(process.cwd(), attachmentRow.storage_path);

        if (!fs.existsSync(absolutePath)) return '';

        if (isDocx) {
            return await readDocxPreview(absolutePath);
        }
        if (isPdf) {
            return await readPdfPreview(absolutePath);
        }
        if (isSpreadsheet) {
            return await readSpreadsheetPreview(absolutePath);
        }
        if (isPptx) {
            return await readPptxPreview(absolutePath);
        }

        const content = await fs.promises.readFile(absolutePath, 'utf8');
        return clipPreview(content);
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

function extractToolArgKeys(rawArgs) {
    if (typeof rawArgs !== 'string' || !rawArgs.trim()) return [];
    try {
        const parsed = JSON.parse(rawArgs);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
        return Object.keys(parsed).slice(0, 20);
    } catch (_error) {
        return [];
    }
}

function normalizeToolCallCandidate(candidate, index = 0) {
    if (!candidate || typeof candidate !== 'object') return null;
    const fn = candidate.function && typeof candidate.function === 'object' ? candidate.function : null;
    const nameRaw = typeof fn?.name === 'string'
        ? fn.name
        : (typeof candidate.name === 'string'
            ? candidate.name
            : (typeof candidate.tool === 'string'
                ? candidate.tool
                : (typeof candidate.tool_name === 'string' ? candidate.tool_name : '')));
    const name = String(nameRaw || '').trim();
    if (!name) return null;

    const rawArgs = typeof fn?.arguments === 'string'
        ? fn.arguments
        : (typeof candidate.arguments === 'string' ? candidate.arguments : '');
    const argKeys = extractToolArgKeys(rawArgs);

    return {
        id: typeof candidate.id === 'string' ? candidate.id : null,
        index: Number.isFinite(candidate.index) ? Number(candidate.index) : index,
        type: typeof candidate.type === 'string' ? candidate.type : 'function',
        name,
        argKeys
    };
}

function extractToolCallsFromPayload(payload) {
    if (!payload || typeof payload !== 'object') return [];

    const choice0 = Array.isArray(payload?.choices) ? payload.choices[0] : null;
    const message = choice0?.message || {};
    const delta = choice0?.delta || {};
    const candidates = [];

    const buckets = [
        payload.tool_calls,
        payload?.metadata?.tool_calls,
        message.tool_calls,
        delta.tool_calls
    ];
    for (const bucket of buckets) {
        if (!Array.isArray(bucket)) continue;
        for (const entry of bucket) {
            candidates.push(entry);
        }
    }

    // OpenAI-compatible legacy function_call support.
    if (message?.function_call && typeof message.function_call === 'object') {
        candidates.push({ type: 'function', function: message.function_call });
    }
    if (delta?.function_call && typeof delta.function_call === 'object') {
        candidates.push({ type: 'function', function: delta.function_call });
    }

    return candidates
        .map((candidate, index) => normalizeToolCallCandidate(candidate, index))
        .filter(Boolean);
}

function mergeObservedToolCalls(existing = [], incoming = []) {
    const byKey = new Map();

    for (const call of existing) {
        if (!call || !call.name) continue;
        const key = call.id || `${call.name}::${call.index}`;
        byKey.set(key, { ...call });
    }

    for (const call of incoming) {
        if (!call || !call.name) continue;
        const key = call.id || `${call.name}::${call.index}`;
        const previous = byKey.get(key);
        if (!previous) {
            byKey.set(key, { ...call });
            continue;
        }
        const mergedArgKeys = [...new Set([...(previous.argKeys || []), ...(call.argKeys || [])])];
        byKey.set(key, {
            ...previous,
            ...call,
            argKeys: mergedArgKeys
        });
    }

    return [...byKey.values()];
}

function summarizeToolUsage(toolCalls = []) {
    const toolNames = [...new Set(toolCalls.map((call) => call?.name).filter(Boolean))];
    return {
        used: toolNames.length > 0,
        tools: toolNames,
        callCount: toolCalls.length
    };
}

function extractReasoningText(payload) {
    if (!payload || typeof payload !== 'object') return '';

    const delta = payload?.choices?.[0]?.delta || {};
    const directCandidates = [
        delta.reasoning_content,
        delta.reasoning,
        delta.thinking,
        payload.reasoning_content,
        payload.reasoning,
        payload.thinking,
        payload.thought
    ];

    for (const candidate of directCandidates) {
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
            return candidate;
        }
    }

    const listCandidates = [
        delta.reasoning_details,
        payload.reasoning_details,
        delta.reasoning_trace,
        payload.reasoning_trace
    ];

    for (const candidate of listCandidates) {
        if (!Array.isArray(candidate)) continue;
        const flattened = candidate
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object') {
                    if (typeof item.text === 'string') return item.text;
                    if (typeof item.content === 'string') return item.content;
                }
                return '';
            })
            .filter(Boolean)
            .join('\n');

        if (flattened.trim().length > 0) {
            return flattened;
        }
    }

    return '';
}

function extractModelFromPayload(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const choice0 = Array.isArray(payload?.choices) ? payload.choices[0] : null;
    const delta = choice0?.delta || {};
    const message = choice0?.message || {};
    const candidates = [
        payload.model,
        choice0?.model,
        delta?.model,
        message?.model,
        payload?.metadata?.model,
        payload?.response?.model
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
        }
    }

    return null;
}

function extractUsageFromPayload(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const candidates = [
        payload.usage,
        payload?.choices?.[0]?.usage,
        payload?.metadata?.usage
    ];

    for (const candidate of candidates) {
        if (candidate && typeof candidate === 'object') {
            return candidate;
        }
    }

    return null;
}

function extractResponseIdFromPayload(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const candidates = [
        payload.id,
        payload.response_id,
        payload.request_id,
        payload?.metadata?.response_id,
        payload?.metadata?.request_id
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
        }
    }

    return null;
}

function extractProviderFromPayload(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const candidates = [
        payload.provider,
        payload?.metadata?.provider
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
        }
    }

    return null;
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
        }, 6000);
    };
    const stopKeepAlive = () => {
        if (keepAliveIntervalId) {
            clearInterval(keepAliveIntervalId);
            keepAliveIntervalId = null;
        }
    };

    // IMMEDIATE STREAMING START for Cloudflare 524 avoidance
    // We must send headers and initial data immediately, before any DB or AI work.
    if (stream) {
        beginSseStream(res);
        startKeepAlive();
        writeSseEvent(res, buildStreamStatus('accepted', 'Request accepted', 'Connection established. Reviewing your request...'));
        toolActivityBridge.register(userId, res, writeSseEvent, buildStreamStatus);
    }

    try {
        const resolvedAgentId = normalizeAgentId(typeof requestedAgentId === 'string' ? requestedAgentId : undefined);
        const openClawAgentId = toOpenClawAgentId(resolvedAgentId);

        const intent = detectIntent(messages);
        const lastUserMessage = getLastUserMessage(messages);
        // OPTIMIZATION: Start email guard lookup early (it's slow DNS), but don't await yet
        const emailProviderGuardPromise = resolveEmailProviderForGuard(lastUserMessage, messages);

        // Handle Switching Intent BEFORE creating a conversation to prevent dummy threads
        if (intent.id === 'switch') {
            const targetId = await resolveTopicToConversationId(userId, lastUserMessage, query);
            if (targetId) {
                const switchMetadata = buildModelWayMetadata(intent, determinePhase(messages), targetId);
                const switchContent = `🔄 **Switching Context**\n\nI've located the conversation for: "${lastUserMessage.replace(/continue this:|switch to:/gi, '').trim()}". Switching your active session now...`;

                if (stream) {
                    writeSseEvent(res, {
                        metadata: {
                            modelWay: switchMetadata,
                            switchTarget: targetId
                        }
                    });
                    writeSseEvent(res, { content: switchContent });
                    res.write('data: [DONE]\n\n');
                    if (typeof res.flush === 'function') res.flush();
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
                    writeSseEvent(res, { content: failContent });
                    res.write('data: [DONE]\n\n');
                    if (typeof res.flush === 'function') res.flush();
                    res.end();
                    return;
                }
                return res.status(404).json({ success: false, error: 'Conversation not found' });
            }
        }

        // Persist Conversation and User Message
        const [conversationId, emailProviderGuard] = await Promise.all([
            getOrCreateConversation(userId, providedConvId),
            emailProviderGuardPromise
        ]);
        const preContextStart = performance.now();

        // PARALLEL BLOCK: Run all major context gathering and persistence concurrently
        // 1. Save the user message (doesn't block history fetch because message is in RAM)
        // 2. Fetch history (needed for OpenClaw context)
        // 3. Fetch attachment data (needed for attachment context)
        // 4. Assemble Knowledge Context (heavy DB ops)
        // 5. Build Integration Context (DB ops)
        const incomingAttachmentRefs = normalizeIncomingAttachments(attachments);

        const [
            // saveMessage result (we don't strictly need it, just that it completes)
            ,
            dbConversationHistory,
            storedAttachments,
            knowledgeContext,
            integrationContextRaw
        ] = await Promise.all([
            saveMessage(conversationId, 'user', lastUserMessage),
            fetchConversationHistory(conversationId),
            fetchStoredAttachments(conversationId, userId, incomingAttachmentRefs, req.user?.jwtPayload),
            assembleKnowledgeContext({
                userId,
                jwtPayload: req.user?.jwtPayload,
                agentId: resolvedAgentId,
                conversationId,
                includeShort: false, // Usage of dbConversationHistory makes this redundant
                includeMedium: true,
                includeLong: true,
                maxBlocks: 8
            }).catch(err => {
                logger.warn('Failed to assemble knowledge context', { error: err.message });
                return null;
            }),
            buildIntegrationSystemContext(userId, req.user?.jwtPayload).catch(err => {
                logger.warn('Failed to build integration context', { error: err.message });
                return null;
            })
        ]);

        const preContextEnd = performance.now();
        logger.info('Chat context assembly timing', {
            userId,
            conversationId,
            durationMs: Math.round(preContextEnd - preContextStart)
        });

        const userAttachmentMetadata = storedAttachments.map(toAttachmentMetadataRow);

        const phase = determinePhase(messages);
        const modelWayMetadata = buildModelWayMetadata(intent, phase, conversationId);
        const historyTurns = messages.filter((item) => item?.role === 'user' || item?.role === 'assistant').length;

        if (stream) {
            setKeepAliveFrames([
                `Understanding your request (${intent.name}, ${phase} phase)`,
                `Reviewing ${historyTurns} recent conversation turns`,
                `Checking ${userAttachmentMetadata.length} uploaded attachment${userAttachmentMetadata.length === 1 ? '' : 's'}`
            ]);

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

        // Process Knowledge Context Result
        if (knowledgeContext?.systemContext) {
            contextSystemMessage = [
                'Nexus Working Context (source-of-truth from backend):',
                knowledgeContext.systemContext,
                `Context Digest: ${knowledgeContext.contextDigest}`
            ].join('\n\n');
        }

        // Process Integration Context Result
        if (integrationContextRaw) {
            contextSystemMessage = contextSystemMessage
                ? `${contextSystemMessage}\n\n${integrationContextRaw}`
                : integrationContextRaw;
        }

        // Build Attachment Context (Dependent on storedAttachments)
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
        const emailProviderGuardInstruction = buildEmailProviderGuardInstruction(emailProviderGuard);
        if (emailProviderGuardInstruction) {
            contextSystemMessage = contextSystemMessage
                ? `${contextSystemMessage}\n\n${emailProviderGuardInstruction}`
                : emailProviderGuardInstruction;
        }


        // Inject Soul, Codebase, and Tool Capability Context
        const soulContext = buildSoulContext();
        const codebaseContext = buildCodebaseContext();
        const toolCapabilityBlock = buildToolCapabilityBlock();
        const preambleParts = [];
        if (soulContext) preambleParts.push(soulContext);
        if (codebaseContext) preambleParts.push(codebaseContext);
        if (toolCapabilityBlock) preambleParts.push(toolCapabilityBlock);

        if (preambleParts.length > 0) {
            const preamble = preambleParts.join('\n\n');
            contextSystemMessage = contextSystemMessage
                ? `${preamble}\n\n${contextSystemMessage}`
                : preamble;
        }

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
        // Use dbConversationHistory instead of client messages to ensure full context
        const openClawMessages = buildOpenClawMessages(dbConversationHistory, contextSystemMessage);

        const openClawSessionId = buildOpenClawSessionId(userId, conversationId);

        // Pure proxy payload: OpenClaw's agent runtime (SOUL.md, AGENTS.md) drives behavior
        const openClawPayload = {
            model: `openclaw:${openClawAgentId}`, // Route through OpenClaw agent runtime
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
        const forceEmailConnectTools = shouldForceEmailConnectTools(lastUserMessage, messages, emailProviderGuard);
        const modelWayTools = getModelWayToolsForIntent(intent.id);
        // NOTE: Do not send `tools` to OpenClaw's /v1/chat/completions endpoint.
        // That field is for OpenAI "client tools" (delegated execution), and OpenClaw
        // will not treat string tool IDs as valid schemas. OpenClaw should surface
        // real tools via plugins + its own tool policy (openclaw.json).

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
            forceEmailConnectTools,
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
            agentId: openClawAgentId,
            timeoutMs: 300000 // 5m timeout for initial response (increased from 60s to handle long reasoning chains)
        });

        if (!openClawResponse.ok) {
            const errorText = await openClawResponse.text();
            throw new Error(`OpenClaw API error: ${openClawResponse.status} - ${errorText}`);
        }
        const upstreamRequestId =
            openClawResponse.headers.get('x-request-id')
            || openClawResponse.headers.get('x-openai-request-id')
            || openClawResponse.headers.get('openai-request-id')
            || null;
        const baseModelTrace = {
            runtimeId: runtimeInfo.id,
            runtimeEndpoint: runtimeInfo.chatCompletionsUrl,
            requestedModel: openClawPayload.model,
            nexusAgentId: resolvedAgentId,
            openClawAgentId,
            conversationId,
            streamRequested: Boolean(stream),
            upstreamRequestId,
            upstreamStatus: openClawResponse.status
        };
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
            const rawContent = data.choices?.[0]?.message?.content || '';
            const content = enforceResolvedProviderResponse(rawContent, emailProviderGuard);
            const resolvedModel = extractModelFromPayload(data) || openClawPayload.model || 'openclaw';
            const usage = extractUsageFromPayload(data) || data.usage || null;
            const responseId = extractResponseIdFromPayload(data);
            const provider = extractProviderFromPayload(data);
            const systemFingerprint = typeof data?.system_fingerprint === 'string' ? data.system_fingerprint : null;
            const observedToolCalls = extractToolCallsFromPayload(data);
            const toolUsage = summarizeToolUsage(observedToolCalls);
            const generatedAttachments = mergeUniqueAttachments(
                extractGeneratedAttachmentsFromPayload(data),
                extractGeneratedAttachmentsFromText(content)
            );

            // Audit: Save Assistant Response
            if (content || generatedAttachments.length) {
                const assistantMetadata = {
                    model: resolvedModel,
                    usage,
                    modelWay: modelWayMetadata,
                    toolCalls: observedToolCalls,
                    toolUsage,
                    attachments: generatedAttachments,
                    modelTrace: {
                        ...baseModelTrace,
                        responseId,
                        provider,
                        systemFingerprint,
                        resolvedModel,
                        observedModels: resolvedModel ? [resolvedModel] : []
                    }
                };
                await saveMessage(conversationId, 'assistant', content || 'Generated documents attached.', assistantMetadata);
                logger.info('Chat model trace', {
                    userId,
                    conversationId,
                    stream: Boolean(stream),
                    requestedModel: baseModelTrace.requestedModel,
                    resolvedModel,
                    runtimeId: baseModelTrace.runtimeId,
                    openClawAgentId: baseModelTrace.openClawAgentId,
                    nexusAgentId: baseModelTrace.nexusAgentId,
                    upstreamRequestId: baseModelTrace.upstreamRequestId,
                    responseId,
                    provider
                });
                if (toolUsage.used) {
                    logger.info('OpenClaw tool usage observed', {
                        userId,
                        conversationId,
                        stream: Boolean(stream),
                        tools: toolUsage.tools,
                        callCount: toolUsage.callCount
                    });
                }
            }
            if (toolUsage.used && !(content || generatedAttachments.length)) {
                logger.info('OpenClaw tool usage observed', {
                    userId,
                    conversationId,
                    stream: Boolean(stream),
                    tools: toolUsage.tools,
                    callCount: toolUsage.callCount
                });
            }

            // If client wanted stream, emit it as an SSE event sequence
            if (stream) {
                writeSseEvent(res, buildStreamStatus('thinking', 'Agent is thinking', 'Preparing response with orchestration metadata.'));
                writeSseEvent(res, buildStreamStatus('responding', 'Agent is responding', 'Streaming response started.'));
                if (toolUsage.used) {
                    writeSseEvent(res, buildStreamStatus('tool_invocation', 'Tool invocation', `Used: ${toolUsage.tools.join(', ')}`));
                    writeSseEvent(res, { metadata: { toolUsage, toolCalls: observedToolCalls } });
                }

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
                if (typeof res.flush === 'function') res.flush();
                stopKeepAlive();
                res.end();
                return;
            } else {
                // return normal JSON if client didn't want stream
                const response = structureResponse(content, modelWayMetadata, {
                    success: true,
                    content,
                    model: resolvedModel,
                    usage,
                    attachments: generatedAttachments,
                    metadata: {
                        toolUsage,
                        toolCalls: observedToolCalls
                    }
                }
                );
                return res.json(response);
            }
        }

        if (!stream) {
            // Non-streaming: return JSON response
            const data = await openClawResponse.json();
            const rawContent = data.choices?.[0]?.message?.content || '';
            const content = enforceResolvedProviderResponse(rawContent, emailProviderGuard);
            const resolvedModel = resolveModelName(extractModelFromPayload(data) || openClawPayload.model || 'openclaw');
            const usage = extractUsageFromPayload(data) || data.usage || null;
            const responseId = extractResponseIdFromPayload(data);
            const provider = extractProviderFromPayload(data);
            const systemFingerprint = typeof data?.system_fingerprint === 'string' ? data.system_fingerprint : null;
            const observedToolCalls = extractToolCallsFromPayload(data);
            const toolUsage = summarizeToolUsage(observedToolCalls);
            const generatedAttachments = mergeUniqueAttachments(
                extractGeneratedAttachmentsFromPayload(data),
                extractGeneratedAttachmentsFromText(content)
            );

            // Audit: Save Assistant Response
            if (content || generatedAttachments.length) {
                const assistantMetadata = {
                    model: resolvedModel,
                    usage,
                    modelWay: modelWayMetadata,
                    toolCalls: observedToolCalls,
                    toolUsage,
                    attachments: generatedAttachments,
                    modelTrace: {
                        ...baseModelTrace,
                        responseId,
                        provider,
                        systemFingerprint,
                        resolvedModel,
                        observedModels: resolvedModel ? [resolvedModel] : []
                    }
                };
                await saveMessage(conversationId, 'assistant', content || 'Generated documents attached.', assistantMetadata);
                logger.info('Chat model trace', {
                    userId,
                    conversationId,
                    stream: false,
                    requestedModel: baseModelTrace.requestedModel,
                    resolvedModel,
                    runtimeId: baseModelTrace.runtimeId,
                    openClawAgentId: baseModelTrace.openClawAgentId,
                    nexusAgentId: baseModelTrace.nexusAgentId,
                    upstreamRequestId: baseModelTrace.upstreamRequestId,
                    responseId,
                    provider
                });
                if (toolUsage.used) {
                    logger.info('OpenClaw tool usage observed', {
                        userId,
                        conversationId,
                        stream: false,
                        tools: toolUsage.tools,
                        callCount: toolUsage.callCount
                    });
                }
            }
            if (toolUsage.used && !(content || generatedAttachments.length)) {
                logger.info('OpenClaw tool usage observed', {
                    userId,
                    conversationId,
                    stream: false,
                    tools: toolUsage.tools,
                    callCount: toolUsage.callCount
                });
            }

            const response = structureResponse(content, modelWayMetadata, {
                success: true,
                content,
                model: resolvedModel,
                usage,
                attachments: generatedAttachments,
                metadata: {
                    toolUsage,
                    toolCalls: observedToolCalls
                }
            }
            );

            // Update resolved model on conversation
            if (resolvedModel && resolvedModel !== 'default' && resolvedModel !== 'openclaw') {
                await query('UPDATE ai_conversations SET model = $1 WHERE id = $2', [resolvedModel, conversationId]);
            }

            return res.json(response);
        }

        // Streaming: set up SSE with metadata in initial event
        writeSseEvent(res, buildStreamStatus('thinking', 'Agent is thinking', 'Preparing response stream.'));
        writeSseEvent(res, buildStreamStatus('responding', 'Agent is responding', 'Streaming response started.'));

        const reader = openClawResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullAssistantContent = ''; // Accumulate for audit
        let fullReasoningContent = ''; // Accumulate reasoning
        let generatedAttachmentCandidates = [];
        const observedStreamModels = new Set();
        let streamResolvedModel = null;
        let streamUsage = null;
        let streamResponseId = null;
        let streamProvider = null;
        let streamSystemFingerprint = null;
        let observedToolCalls = [];
        const emittedToolNames = new Set();
        const holdAssistantChunksForProviderGuard = Boolean(emailProviderGuard?.recommendation && ['microsoft', 'google_workspace'].includes(emailProviderGuard.recommendation.provider));
        const responseHeaderModel = openClawResponse.headers.get('x-model') || openClawResponse.headers.get('openai-model');
        if (typeof responseHeaderModel === 'string' && responseHeaderModel.trim()) {
            streamResolvedModel = responseHeaderModel.trim();
            observedStreamModels.add(streamResolvedModel);
        }

        const buildStreamingAssistantMetadata = (generatedAttachments, partial = false) => {
            const toolUsage = summarizeToolUsage(observedToolCalls);
            return {
                model: resolveModelName(streamResolvedModel || openClawPayload.model || (partial ? 'openclaw:stream-partial' : 'openclaw:stream')),
                usage: streamUsage || null,
                modelWay: modelWayMetadata,
                toolCalls: observedToolCalls,
                toolUsage,
                attachments: generatedAttachments,
                reasoning: fullReasoningContent || undefined,
                modelTrace: {
                    ...baseModelTrace,
                    responseId: streamResponseId,
                    provider: streamProvider,
                    systemFingerprint: streamSystemFingerprint,
                    resolvedModel: streamResolvedModel || null,
                    observedModels: Array.from(observedStreamModels),
                    partial
                }
            };
        };

        let streamDoneHandled = false;
        try {
            streamLoop: while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    if (streamDoneHandled) break streamLoop;
                    streamDoneHandled = true;

                    const finalGuardedContent = enforceResolvedProviderResponse(fullAssistantContent, emailProviderGuard);
                    if (holdAssistantChunksForProviderGuard && finalGuardedContent) {
                        writeSseEvent(res, { content: finalGuardedContent });
                    }
                    fullAssistantContent = finalGuardedContent;
                    // Audit: Save collected assistant response
                    if (fullAssistantContent || fullReasoningContent) {
                        const generatedAttachments = mergeUniqueAttachments(
                            generatedAttachmentCandidates,
                            extractGeneratedAttachmentsFromText(fullAssistantContent)
                        );
                        const assistantMetadata = buildStreamingAssistantMetadata(generatedAttachments);
                        await saveMessage(conversationId, 'assistant', fullAssistantContent || (fullReasoningContent ? '' : '...'), assistantMetadata);
                        logger.info('Chat model trace', {
                            userId,
                            conversationId,
                            stream: true,
                            requestedModel: baseModelTrace.requestedModel,
                            resolvedModel: assistantMetadata.model,
                            runtimeId: baseModelTrace.runtimeId,
                            openClawAgentId: baseModelTrace.openClawAgentId,
                            nexusAgentId: baseModelTrace.nexusAgentId,
                            upstreamRequestId: baseModelTrace.upstreamRequestId,
                            responseId: streamResponseId,
                            provider: streamProvider,
                            partial: false
                        });
                        if (assistantMetadata.toolUsage?.used) {
                            logger.info('OpenClaw tool usage observed', {
                                userId,
                                conversationId,
                                stream: true,
                                tools: assistantMetadata.toolUsage.tools,
                                callCount: assistantMetadata.toolUsage.callCount
                            });
                        }
                        if (generatedAttachments.length) {
                            writeSseEvent(res, { metadata: { generatedAttachments } });
                        }
                        if (assistantMetadata.toolUsage?.used) {
                            writeSseEvent(res, {
                                metadata: {
                                    toolUsage: assistantMetadata.toolUsage,
                                    toolCalls: assistantMetadata.toolCalls
                                }
                            });
                        }
                    }
                    writeSseEvent(res, buildStreamStatus('completed', 'Response complete', null));
                    res.write('data: [DONE]\n\n');
                    if (typeof res.flush === 'function') res.flush();
                    stopKeepAlive();
                    break streamLoop;
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
                            if (streamDoneHandled) break streamLoop;
                            streamDoneHandled = true;

                            const finalGuardedContent = enforceResolvedProviderResponse(fullAssistantContent, emailProviderGuard);
                            if (holdAssistantChunksForProviderGuard && finalGuardedContent) {
                                writeSseEvent(res, { content: finalGuardedContent });
                            }
                            fullAssistantContent = finalGuardedContent;
                            // Audit: Save collected assistant response on upstream done
                            if (fullAssistantContent || fullReasoningContent) {
                                const generatedAttachments = mergeUniqueAttachments(
                                    generatedAttachmentCandidates,
                                    extractGeneratedAttachmentsFromText(fullAssistantContent)
                                );
                                const assistantMetadata = buildStreamingAssistantMetadata(generatedAttachments);
                                await saveMessage(conversationId, 'assistant', fullAssistantContent || (fullReasoningContent ? '' : '...'), assistantMetadata);
                                logger.info('Chat model trace', {
                                    userId,
                                    conversationId,
                                    stream: true,
                                    requestedModel: baseModelTrace.requestedModel,
                                    resolvedModel: assistantMetadata.model,
                                    runtimeId: baseModelTrace.runtimeId,
                                    openClawAgentId: baseModelTrace.openClawAgentId,
                                    nexusAgentId: baseModelTrace.nexusAgentId,
                                    upstreamRequestId: baseModelTrace.upstreamRequestId,
                                    responseId: streamResponseId,
                                    provider: streamProvider,
                                    partial: false
                                });
                                if (assistantMetadata.toolUsage?.used) {
                                    logger.info('OpenClaw tool usage observed', {
                                        userId,
                                        conversationId,
                                        stream: true,
                                        tools: assistantMetadata.toolUsage.tools,
                                        callCount: assistantMetadata.toolUsage.callCount
                                    });
                                }
                                if (generatedAttachments.length) {
                                    writeSseEvent(res, { metadata: { generatedAttachments } });
                                }
                                if (assistantMetadata.toolUsage?.used) {
                                    writeSseEvent(res, {
                                        metadata: {
                                            toolUsage: assistantMetadata.toolUsage,
                                            toolCalls: assistantMetadata.toolCalls
                                        }
                                    });
                                }
                                fullAssistantContent = ''; // Prevent double save if loop continues
                                fullReasoningContent = '';

                                // Update resolved model on conversation for streaming path
                                if (assistantMetadata.model && assistantMetadata.model !== 'default' && assistantMetadata.model !== 'openclaw') {
                                    await query('UPDATE ai_conversations SET model = $1 WHERE id = $2', [assistantMetadata.model, conversationId]);
                                }
                            }
                            writeSseEvent(res, buildStreamStatus('completed', 'Response complete', null));
                            res.write('data: [DONE]\n\n');
                            if (typeof res.flush === 'function') res.flush();
                            stopKeepAlive();
                            break streamLoop;
                        }

                        try {
                            const chunk = JSON.parse(dataStr);
                            const chunkAttachments = extractGeneratedAttachmentsFromPayload(chunk);
                            if (chunkAttachments.length) {
                                generatedAttachmentCandidates = mergeUniqueAttachments(generatedAttachmentCandidates, chunkAttachments);
                            }
                            const chunkModel = extractModelFromPayload(chunk);
                            if (chunkModel) {
                                observedStreamModels.add(chunkModel);
                                if (!streamResolvedModel) {
                                    streamResolvedModel = chunkModel;
                                }
                            }
                            const chunkUsage = extractUsageFromPayload(chunk);
                            if (chunkUsage) {
                                streamUsage = chunkUsage;
                            }
                            const chunkResponseId = extractResponseIdFromPayload(chunk);
                            if (chunkResponseId && !streamResponseId) {
                                streamResponseId = chunkResponseId;
                            }
                            const chunkProvider = extractProviderFromPayload(chunk);
                            if (chunkProvider && !streamProvider) {
                                streamProvider = chunkProvider;
                            }
                            const chunkToolCalls = extractToolCallsFromPayload(chunk);
                            if (chunkToolCalls.length) {
                                observedToolCalls = mergeObservedToolCalls(observedToolCalls, chunkToolCalls);
                                const newToolNames = [];
                                for (const call of chunkToolCalls) {
                                    const name = String(call?.name || '').trim();
                                    if (!name || emittedToolNames.has(name)) continue;
                                    emittedToolNames.add(name);
                                    newToolNames.push(name);
                                }
                                if (newToolNames.length) {
                                    writeSseEvent(
                                        res,
                                        buildStreamStatus('tool_invocation', 'Tool invocation', `Calling ${newToolNames.join(', ')}`)
                                    );
                                    writeSseEvent(res, {
                                        metadata: {
                                            toolUsage: summarizeToolUsage(observedToolCalls),
                                            toolCalls: observedToolCalls
                                        }
                                    });
                                }
                            }
                            if (typeof chunk?.system_fingerprint === 'string' && chunk.system_fingerprint.trim()) {
                                streamSystemFingerprint = chunk.system_fingerprint.trim();
                            }
                            const content = chunk.choices?.[0]?.delta?.content;
                            const reasoning = extractReasoningText(chunk);

                            if (reasoning) {
                                fullReasoningContent += reasoning;
                                // Forward reasoning as "thought" event
                                writeSseEvent(res, { thought: reasoning });
                            }

                            if (content) {
                                fullAssistantContent += content;
                                if (!holdAssistantChunksForProviderGuard) {
                                    // Forward the content to the client unless deterministic guard is active.
                                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                                    if (typeof res.flush === 'function') res.flush();
                                }
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
            if (fullAssistantContent || fullReasoningContent) {
                const generatedAttachments = mergeUniqueAttachments(
                    generatedAttachmentCandidates,
                    extractGeneratedAttachmentsFromText(fullAssistantContent)
                );
                const partialMetadata = buildStreamingAssistantMetadata(generatedAttachments, true);
                saveMessage(conversationId, 'assistant', fullAssistantContent, partialMetadata)
                    .then(() => {
                        logger.info('Chat model trace', {
                            userId,
                            conversationId,
                            stream: true,
                            requestedModel: baseModelTrace.requestedModel,
                            resolvedModel: partialMetadata.model,
                            runtimeId: baseModelTrace.runtimeId,
                            openClawAgentId: baseModelTrace.openClawAgentId,
                            nexusAgentId: baseModelTrace.nexusAgentId,
                            upstreamRequestId: baseModelTrace.upstreamRequestId,
                            responseId: streamResponseId,
                            provider: streamProvider,
                            partial: true
                        });
                        if (partialMetadata.toolUsage?.used) {
                            logger.info('OpenClaw tool usage observed', {
                                userId,
                                conversationId,
                                stream: true,
                                tools: partialMetadata.toolUsage.tools,
                                callCount: partialMetadata.toolUsage.callCount
                            });
                        }
                    })
                    .catch(e => logger.error('Failed to save partial message', e));
                if (generatedAttachments.length) {
                    writeSseEvent(res, { metadata: { generatedAttachments } });
                }
                if (partialMetadata.toolUsage?.used) {
                    writeSseEvent(res, {
                        metadata: {
                            toolUsage: partialMetadata.toolUsage,
                            toolCalls: partialMetadata.toolCalls
                        }
                    });
                }
            }
            writeSseEvent(res, buildStreamStatus('error', 'Response interrupted', streamErr.message));
            writeSseEvent(res, { error: streamErr.message });
        } finally {
            stopKeepAlive();
            toolActivityBridge.unregister(userId);
            res.end();
        }

    } catch (error) {
        logger.error('Chat proxy error', {
            error: error.message,
            stack: error.stack,
            userId
        });
        stopKeepAlive();
        toolActivityBridge.unregister(userId);

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

async function readRuntimeResponsePayload(response) {
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('application/json')) {
        return response.json();
    }
    return { raw: await response.text() };
}

function getRuntimeControlQuery(req) {
    const query = {};
    Object.entries(req.query || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        query[key] = value;
    });
    return query;
}

router.get('/runtime/control', authenticateToken, requireInstanceOwner, async (req, res) => {
    try {
        const runtimeInfo = agentRuntime.getRuntimeInfo();
        const capabilities = agentRuntime.getCapabilities();

        if (!capabilities.controlPlane) {
            return res.status(501).json({
                success: false,
                error: 'Active runtime does not support control-plane operations',
                runtime: runtimeInfo.id
            });
        }

        if (typeof agentRuntime.getControlPlaneStatus !== 'function') {
            return res.status(501).json({
                success: false,
                error: 'Control-plane status method is not available on this runtime',
                runtime: runtimeInfo.id
            });
        }

        const status = await agentRuntime.getControlPlaneStatus({ query: getRuntimeControlQuery(req) });

        return res.json({
            success: true,
            runtime: runtimeInfo,
            capabilities,
            controlPlane: status
        });
    } catch (error) {
        return res.status(502).json({
            success: false,
            error: error.message || 'Failed to query runtime control-plane'
        });
    }
});

router.post('/runtime/control/proxy', authenticateToken, requireInstanceOwner, async (req, res) => {
    try {
        const runtimeInfo = agentRuntime.getRuntimeInfo();
        const capabilities = agentRuntime.getCapabilities();
        const { method = 'GET', path: requestPath = '/', query = {}, body = undefined, timeoutMs } = req.body || {};

        if (!capabilities.controlPlane || !capabilities.controlProxy) {
            return res.status(501).json({
                success: false,
                error: 'Active runtime does not support control-plane proxy operations',
                runtime: runtimeInfo.id
            });
        }

        if (typeof agentRuntime.controlPlaneRequest !== 'function') {
            return res.status(501).json({
                success: false,
                error: 'Control-plane proxy method is not available on this runtime',
                runtime: runtimeInfo.id
            });
        }

        const safePath = String(requestPath || '').trim();
        if (!safePath.startsWith('/')) {
            return res.status(400).json({
                success: false,
                error: 'path must start with "/"'
            });
        }

        const upperMethod = String(method || 'GET').toUpperCase();
        const allowedMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
        if (!allowedMethods.has(upperMethod)) {
            return res.status(400).json({
                success: false,
                error: `Unsupported method "${upperMethod}". Allowed methods: ${[...allowedMethods].join(', ')}`
            });
        }

        const response = await agentRuntime.controlPlaneRequest({
            method: upperMethod,
            path: safePath,
            query,
            body,
            timeoutMs
        });
        const payload = await readRuntimeResponsePayload(response);

        return res.status(response.status).json({
            success: response.ok,
            runtime: runtimeInfo.id,
            request: {
                method: upperMethod,
                path: safePath
            },
            data: payload
        });
    } catch (error) {
        return res.status(502).json({
            success: false,
            error: error.message || 'Runtime control-plane proxy request failed'
        });
    }
});

router.get('/runtime/control/:resource', authenticateToken, requireInstanceOwner, async (req, res) => {
    try {
        const runtimeInfo = agentRuntime.getRuntimeInfo();
        const capabilities = agentRuntime.getCapabilities();
        const resource = String(req.params.resource || '').toLowerCase();
        const methodName = CONTROL_RESOURCE_METHODS[resource];

        if (!methodName) {
            return res.status(404).json({
                success: false,
                error: `Unsupported control resource "${resource}"`,
                supportedResources: Object.keys(CONTROL_RESOURCE_METHODS)
            });
        }

        if (!capabilities.controlPlane) {
            return res.status(501).json({
                success: false,
                error: 'Active runtime does not support control-plane operations',
                runtime: runtimeInfo.id
            });
        }

        if (typeof agentRuntime[methodName] !== 'function') {
            return res.status(501).json({
                success: false,
                error: `Control resource method "${methodName}" is not available on runtime`,
                runtime: runtimeInfo.id
            });
        }

        const response = await agentRuntime[methodName]({
            query: getRuntimeControlQuery(req)
        });
        const payload = await readRuntimeResponsePayload(response);

        return res.status(response.status).json({
            success: response.ok,
            runtime: runtimeInfo.id,
            resource,
            data: payload
        });
    } catch (error) {
        return res.status(502).json({
            success: false,
            error: error.message || 'Failed to query runtime control resource'
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
 * GET /api/ai/integrations/context
 * Returns live integration context used for OpenClaw prompt injection.
 */
router.get('/integrations/context', authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const context = await buildIntegrationSystemContext(userId, req.user?.jwtPayload);
        const integrationsResult = await query(
            `SELECT
               ui.integration_name,
               ui.status,
               ui.last_sync_at,
               ui.updated_at,
               ot.expires_at
             FROM user_integrations ui
             LEFT JOIN oauth_tokens ot
               ON ot.user_id = ui.user_id
              AND ot.integration_slug = ui.integration_name
             WHERE ui.user_id = $1
             ORDER BY ui.updated_at DESC`,
            [userId],
            req.user?.jwtPayload
        );

        if (integrationsResult.error) {
            return res.status(500).json({ success: false, error: integrationsResult.error });
        }

        const integrations = (integrationsResult.data || []).map((row) => {
            const expiresAt = toIsoStringOrNull(row.expires_at);
            const isExpired = Boolean(expiresAt && Date.parse(expiresAt) <= Date.now());
            return {
                provider: row.integration_name,
                status: isExpired ? 'expired' : normalizeIntegrationStatus(row.status),
                lastSyncAt: toIsoStringOrNull(row.last_sync_at),
                updatedAt: toIsoStringOrNull(row.updated_at),
                tokenExpiresAt: expiresAt
            };
        });

        return res.json({
            success: true,
            userId,
            context,
            integrations
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to load integration context'
        });
    }
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
