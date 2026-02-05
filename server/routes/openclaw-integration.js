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
    const db = require('../src/utils/database');
    
    // Use the sync function from migration
    const result = await db.query(
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
    
    const db = require('../src/utils/database');
    
    const result = await db.query(
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
    
    const db = require('../src/utils/database');
    
    let query = `SELECT * FROM openclaw_conversations WHERE id = $1`;
    let params = [conversationId];
    
    if (userId) {
      query += ` AND user_id = $2`;
      params.push(userId);
    }
    
    const result = await db.query(query, params);
    
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