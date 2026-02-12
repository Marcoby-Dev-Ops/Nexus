const express = require('express');
const { logger } = require('../src/utils/logger');
const router = express.Router();

// Middleware to authenticate OpenClaw requests
const authenticateOpenClaw = (req, res, next) => {
  const apiKey = req.headers['x-openclaw-api-key'] || req.query.apiKey;
  
  // In production, validate against stored API keys
  // For now, accept any key or use environment variable
  const validApiKey = process.env.OPENCLAW_API_KEY || 'openclaw-default-key';
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      code: 'UNAUTHORIZED'
    });
  }
  
  if (apiKey !== validApiKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
      code: 'FORBIDDEN'
    });
  }
  
  next();
};

function getEffectiveUserId(req) {
  const headerUserId = req.headers['x-nexus-user-id'];
  const bodyUserId = req.body?.userId;
  const queryUserId = req.query?.userId;
  return String(headerUserId || bodyUserId || queryUserId || '').trim() || null;
}

function normalizeProvider(provider) {
  const value = String(provider || '').trim().toLowerCase();
  if (!value) return '';
  if (value === 'microsoft365') return 'microsoft';
  if (value === 'google_workspace' || value === 'googleworkspace') return 'google-workspace';
  if (value === 'google-workspace') return 'google-workspace';
  return value;
}

function getInternalApiBaseUrl(req) {
  if (process.env.INTERNAL_API_BASE_URL) return process.env.INTERNAL_API_BASE_URL;
  if (process.env.NEXUS_API_URL) return process.env.NEXUS_API_URL.replace(/\/+$/, '');
  const protocol = (req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const host = req.get('host') || `127.0.0.1:${process.env.PORT || 3001}`;
  return `${protocol}://${host}`;
}

async function executeToolByName(req, toolName, args = {}) {
  const userId = getEffectiveUserId(req);
  if (!userId) {
    throw new Error('userId is required (x-nexus-user-id header or body.userId)');
  }

  const internalApiBaseUrl = getInternalApiBaseUrl(req);
  const { query } = require('../src/database/connection');
  const safeName = String(toolName || '').trim();

  if (safeName === 'nexus_get_integration_status') {
    const result = await query(
      `SELECT
         ui.id,
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
      [userId]
    );
    if (result.error) throw new Error(result.error);
    const integrations = (result.data || []).map((row) => {
      const expiresAt = row.expires_at ? new Date(row.expires_at).toISOString() : null;
      const expired = expiresAt ? Date.parse(expiresAt) <= Date.now() : false;
      const status = expired
        ? 'expired'
        : (String(row.status || '').toLowerCase() === 'active' ? 'connected' : String(row.status || 'unknown'));
      return {
        integrationId: row.id,
        provider: row.integration_name,
        status,
        lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at).toISOString() : null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
        tokenExpiresAt: expiresAt
      };
    });
    return { userId, integrations, connectedCount: integrations.filter((i) => i.status === 'connected').length };
  }

  if (safeName === 'nexus_resolve_email_provider') {
    const email = String(args.email || '').trim();
    if (!email) throw new Error('email is required');
    const response = await fetch(`${internalApiBaseUrl}/api/oauth/email-provider/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || `Provider resolution failed (${response.status})`);
    return payload;
  }

  if (safeName === 'nexus_start_email_connection') {
    const providerRaw = String(args.provider || '').trim();
    if (!providerRaw) throw new Error('provider is required');
    const provider = normalizeProvider(providerRaw);
    const redirectUri = String(args.redirectUri || '').trim();
    const search = new URLSearchParams({ userId });
    if (redirectUri) search.set('redirectUri', redirectUri);
    const response = await fetch(`${internalApiBaseUrl}/api/oauth/${provider}/start?${search.toString()}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || `OAuth start failed (${response.status})`);
    return payload;
  }

  if (safeName === 'nexus_connect_imap') {
    const response = await fetch(`${internalApiBaseUrl}/api/oauth/imap/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email: args.email,
        host: args.host,
        port: args.port,
        username: args.username,
        password: args.password,
        useSSL: args.useSSL !== false,
        providerHint: args.providerHint || 'custom_imap'
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || `IMAP connect failed (${response.status})`);
    return payload;
  }

  if (safeName === 'nexus_test_integration_connection') {
    const providerRaw = String(args.provider || '').trim();
    if (!providerRaw) throw new Error('provider is required');
    const provider = normalizeProvider(providerRaw);
    const response = await fetch(`${internalApiBaseUrl}/api/oauth/${provider}/test-saved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || `Connection test failed (${response.status})`);
    return payload;
  }

  if (safeName === 'nexus_disconnect_integration') {
    const providerRaw = String(args.provider || '').trim();
    let integrationId = String(args.integrationId || '').trim();
    const provider = providerRaw ? normalizeProvider(providerRaw) : '';
    if (!integrationId) {
      if (!provider) throw new Error('integrationId or provider is required');
      const lookup = await query(
        `SELECT id
         FROM user_integrations
         WHERE user_id = $1 AND integration_name = $2
         ORDER BY updated_at DESC
         LIMIT 1`,
        [userId, provider]
      );
      if (lookup.error) throw new Error(lookup.error);
      integrationId = lookup.data?.[0]?.id || '';
      if (!integrationId) throw new Error(`No integration found for provider "${provider}"`);
    }

    const response = await fetch(`${internalApiBaseUrl}/api/oauth/disconnect/${integrationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, confirm: 'DISCONNECT' })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || `Disconnect failed (${response.status})`);
    return {
      success: true,
      integrationId,
      provider: provider || undefined
    };
  }

  throw new Error(`Unknown tool: ${safeName}`);
}

const NEXUS_TOOL_CATALOG = [
  {
    name: 'nexus_get_integration_status',
    description: 'Get live integration connection status for the current Nexus user.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'nexus_resolve_email_provider',
    description: 'Resolve email provider by MX lookup and suggest connection workflow.',
    inputSchema: {
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string' } },
      additionalProperties: false
    }
  },
  {
    name: 'nexus_start_email_connection',
    description: 'Start OAuth connect flow for Microsoft or Google Workspace.',
    inputSchema: {
      type: 'object',
      required: ['provider'],
      properties: {
        provider: { type: 'string', enum: ['microsoft', 'microsoft365', 'google_workspace', 'google-workspace'] },
        redirectUri: { type: 'string' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'nexus_connect_imap',
    description: 'Connect custom IMAP account and persist credentials for Nexus use.',
    inputSchema: {
      type: 'object',
      required: ['email', 'host', 'port', 'username', 'password'],
      properties: {
        email: { type: 'string' },
        host: { type: 'string' },
        port: { type: 'number' },
        username: { type: 'string' },
        password: { type: 'string' },
        useSSL: { type: 'boolean' },
        providerHint: { type: 'string' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'nexus_test_integration_connection',
    description: 'Test saved OAuth connection health for a provider.',
    inputSchema: {
      type: 'object',
      required: ['provider'],
      properties: { provider: { type: 'string' } },
      additionalProperties: false
    }
  },
  {
    name: 'nexus_disconnect_integration',
    description: 'Disconnect an integration by ID or provider.',
    inputSchema: {
      type: 'object',
      properties: {
        integrationId: { type: 'string' },
        provider: { type: 'string' }
      },
      additionalProperties: false
    }
  }
];

// Health check for OpenClaw integration
router.get('/health', authenticateOpenClaw, (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'openclaw-integration',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Tool catalog for OpenClaw plugin/tool-runtime discovery
router.get('/tools/catalog', authenticateOpenClaw, (req, res) => {
  res.json({
    success: true,
    tools: NEXUS_TOOL_CATALOG
  });
});

// Execute Nexus integration tools from OpenClaw
router.post('/tools/execute', authenticateOpenClaw, async (req, res) => {
  try {
    const { tool, args = {} } = req.body || {};
    const toolName = String(tool || '').trim();
    if (!toolName) {
      return res.status(400).json({
        success: false,
        error: 'tool is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await executeToolByName(req, toolName, args);
    return res.json({
      success: true,
      tool: toolName,
      result
    });
  } catch (error) {
    logger.error('OpenClaw tool execution failed', {
      tool: req.body?.tool,
      error: error?.message || String(error)
    });
    return res.status(400).json({
      success: false,
      error: error?.message || 'Tool execution failed',
      code: 'TOOL_EXECUTION_ERROR'
    });
  }
});

// Sync a conversation from OpenClaw
router.post('/conversations/sync', authenticateOpenClaw, async (req, res) => {
  try {
    const {
      userId,
      conversationId,
      title,
      messages,
      model,
      systemPrompt,
      metadata
    } = req.body;
    
    // Validate required fields
    if (!userId || !conversationId || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, conversationId, and messages array are required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Validate messages structure
    for (const [index, message] of messages.entries()) {
      if (!message.id || !message.role || !message.content) {
        return res.status(400).json({
          success: false,
          error: `Message at index ${index} is missing required fields: id, role, or content`,
          code: 'VALIDATION_ERROR'
        });
      }
      
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        return res.status(400).json({
          success: false,
          error: `Message at index ${index} has invalid role: ${message.role}. Must be user, assistant, or system`,
          code: 'VALIDATION_ERROR'
        });
      }
    }
    
    logger.info('Syncing OpenClaw conversation', {
      userId,
      conversationId,
      messageCount: messages.length,
      title
    });
    
    // Import database client
    const { query } = require('../src/database/connection');
    
    // Use the sync function from migration
    const result = await query(
      `SELECT sync_openclaw_conversation(
        $1, $2, $3, $4::jsonb, $5, $6, $7::jsonb
      ) as conversation_id`,
      [
        userId,
        conversationId,
        title || 'OpenClaw Conversation',
        JSON.stringify(messages),
        model || 'openclaw',
        systemPrompt,
        metadata || {}
      ]
    );
    
    const nexusConversationId = result.rows[0].conversation_id;
    
    logger.info('OpenClaw conversation synced successfully', {
      userId,
      conversationId,
      nexusConversationId,
      messageCount: messages.length
    });
    
    res.json({
      success: true,
      data: {
        conversationId: nexusConversationId,
        externalId: conversationId,
        messageCount: messages.length,
        syncedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Failed to sync OpenClaw conversation:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get OpenClaw conversations for a user
router.get('/conversations', authenticateOpenClaw, async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId query parameter is required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    const { query } = require('../src/database/connection');
    
    const result = await query(
      `SELECT * FROM openclaw_conversations WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        conversations: result.rows,
        count: result.rows.length
      }
    });
    
  } catch (error) {
    logger.error('Failed to fetch OpenClaw conversations:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get a specific OpenClaw conversation
router.get('/conversations/:conversationId', authenticateOpenClaw, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;
    
    const { query: dbQuery } = require('../src/database/connection');
    
    let query = `SELECT * FROM openclaw_conversations WHERE id = $1`;
    let params = [conversationId];
    
    if (userId) {
      query += ` AND user_id = $2`;
      params.push(userId);
    }
    
    const result = await dbQuery(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Failed to fetch OpenClaw conversation:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Stream real-time conversation updates (SSE)
router.get('/conversations/stream', authenticateOpenClaw, (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId query parameter is required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({
      timestamp: new Date().toISOString(),
      userId
    })}\n\n`);
    
    logger.info('OpenClaw SSE connection established', { userId });
    
    // In a real implementation, you would:
    // 1. Subscribe to database changes (LISTEN/NOTIFY in PostgreSQL)
    // 2. Use Redis pub/sub for horizontal scaling
    // 3. Handle reconnections with last-event-id
    
    // For now, just keep the connection open
    const keepAlive = setInterval(() => {
      res.write(`: keepalive\n\n`);
    }, 30000);
    
    // Clean up on connection close
    req.on('close', () => {
      clearInterval(keepAlive);
      logger.info('OpenClaw SSE connection closed', { userId });
    });
    
  } catch (error) {
    logger.error('Failed to establish SSE connection:', error);
    res.status(500).end();
  }
});

module.exports = router;
