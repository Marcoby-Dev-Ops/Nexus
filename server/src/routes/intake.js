/**
 * Intake Agent Routes
 * 
 * Handles all intake requests and routes them to appropriate agents and processes.
 */

const express = require('express');
const router = express.Router();
const intake_agent = require('../edge-functions/intake_agent');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

/**
 * POST /intake
 * Process any user input and create brain tickets with routing
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { input, context = {}, source = 'api' } = req.body;
    const user = req.user;

    if (!input || !input.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Input is required'
      });
    }

    logger.info('Intake request received', {
      userId: user.id,
      inputLength: input.length,
      source
    });

    // Process through intake agent
    const result = await intake_agent({
      input,
      context,
      source
    }, user);

    if (!result.success) {
      return res.status(500).json(result);
    }

    logger.info('Intake request processed successfully', {
      userId: user.id,
      intent: result.data.analysis.intent,
      confidence: result.data.analysis.confidence,
      agent: result.data.routing.agent
    });

    res.json(result);

  } catch (error) {
    logger.error('Intake route error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process intake request'
    });
  }
});

/**
 * POST /intake/chat
 * Process chat messages through intake agent
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, conversationContext = {} } = req.body;
    const user = req.user;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    logger.info('Chat intake request received', {
      userId: user.id,
      messageLength: message.length
    });

    // Process through intake agent with chat context
    const result = await intake_agent({
      input: message,
      context: {
        ...conversationContext,
        source: 'chat',
        conversationType: 'ai_chat'
      },
      source: 'chat'
    }, user);

    if (!result.success) {
      return res.status(500).json(result);
    }

    logger.info('Chat intake processed successfully', {
      userId: user.id,
      intent: result.data.analysis.intent,
      agent: result.data.routing.agent
    });

    res.json(result);

  } catch (error) {
    logger.error('Chat intake route error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process chat intake'
    });
  }
});

/**
 * POST /intake/form
 * Process form submissions through intake agent
 */
router.post('/form', authenticateToken, async (req, res) => {
  try {
    const { formData, formType, context = {} } = req.body;
    const user = req.user;

    if (!formData || !formType) {
      return res.status(400).json({
        success: false,
        error: 'Form data and type are required'
      });
    }

    logger.info('Form intake request received', {
      userId: user.id,
      formType
    });

    // Convert form data to input string
    const input = Object.entries(formData)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    // Process through intake agent with form context
    const result = await intake_agent({
      input,
      context: {
        ...context,
        source: 'form',
        formType,
        formData
      },
      source: 'form'
    }, user);

    if (!result.success) {
      return res.status(500).json(result);
    }

    logger.info('Form intake processed successfully', {
      userId: user.id,
      formType,
      intent: result.data.analysis.intent
    });

    res.json(result);

  } catch (error) {
    logger.error('Form intake route error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process form intake'
    });
  }
});

/**
 * GET /intake/status
 * Get intake processing status and statistics
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Get recent brain tickets created by intake agent
    const { query } = require('../database/connection');
    const uuidUserId = require('../edge-functions/intake_agent').hashToUUID(user.id);

    const result = await query(
      `SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as tickets_24h,
        COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_tickets,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tickets,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tickets
       FROM brain_tickets 
       WHERE user_id = $1 AND source = 'intake_agent'`,
      [uuidUserId]
    );

    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        stats,
        user: {
          id: user.id,
          email: user.email
        },
        system: {
          status: 'operational',
          lastUpdated: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Intake status route error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get intake status'
    });
  }
});

module.exports = router;
