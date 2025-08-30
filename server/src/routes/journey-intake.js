const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../database/connection');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/journey-intake/types
 * Get available journey types for selection
 */
router.get('/types', authenticateToken, async (req, res) => {
  try {
    logger.info('Fetching available journey types', { userId: req.user.id });

    // Get active playbook templates
    const result = await query(`
      SELECT 
        id,
        name,
        description,
        category,
        complexity,
        estimated_duration_hours,
        success_metrics,
        prerequisites
      FROM playbook_templates 
      WHERE is_active = true 
      ORDER BY priority ASC, name ASC
    `);

    if (result.error) {
      logger.error('Database error fetching journey types', { error: result.error });
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch journey types' 
      });
    }

    // Transform to match frontend expectations
    const journeyTypes = result.data.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      complexity: template.complexity,
      estimated_duration: `${template.estimated_duration_hours} hour${template.estimated_duration_hours !== 1 ? 's' : ''}`,
      success_metrics: template.success_metrics || [],
      prerequisites: template.prerequisites || []
    }));

    logger.info('Journey types fetched successfully', { 
      userId: req.user.id, 
      count: journeyTypes.length 
    });

    res.json({
      success: true,
      data: journeyTypes
    });

  } catch (error) {
    logger.error('Error in journey types endpoint', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/journey-intake/session
 * Create a new journey intake session
 */
router.post('/session', authenticateToken, async (req, res) => {
  try {
    const { organization_id, initial_context } = req.body;
    
    if (!organization_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Organization ID is required' 
      });
    }

    logger.info('Creating journey intake session', { 
      userId: req.user.id, 
      organizationId: organization_id 
    });

    // Create session record
    const sessionResult = await query(`
      INSERT INTO journey_intake_sessions (
        user_id, organization_id, initial_context, status, created_at
      ) VALUES ($1, $2, $3, 'active', NOW())
      RETURNING id, user_id, organization_id, initial_context, status, created_at
    `, [req.user.id, organization_id, initial_context || {}]);

    if (sessionResult.error) {
      logger.error('Database error creating session', { error: sessionResult.error });
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create session' 
      });
    }

    const session = sessionResult.data[0];

    logger.info('Journey intake session created', { 
      userId: req.user.id, 
      sessionId: session.id 
    });

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    logger.error('Error creating journey intake session', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/journey-intake/session/:sessionId/message
 * Add a message to the journey intake session
 */
router.post('/session/:sessionId/message', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, message_type = 'user' } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    logger.info('Adding message to session', { 
      userId: req.user.id, 
      sessionId, 
      messageType: message_type 
    });

    // Add message to session
    const messageResult = await query(`
      INSERT INTO journey_intake_messages (
        session_id, user_id, message, message_type, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, session_id, message, message_type, created_at
    `, [sessionId, req.user.id, message, message_type]);

    if (messageResult.error) {
      logger.error('Database error adding message', { error: messageResult.error });
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to add message' 
      });
    }

    const newMessage = messageResult.data[0];

    logger.info('Message added to session', { 
      userId: req.user.id, 
      sessionId, 
      messageId: newMessage.id 
    });

    res.json({
      success: true,
      data: newMessage
    });

  } catch (error) {
    logger.error('Error adding message to session', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/journey-intake/session/:sessionId/complete
 * Complete the journey intake session and create a journey
 */
router.post('/session/:sessionId/complete', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { selected_journey_id, journey_data } = req.body;

    if (!selected_journey_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Selected journey ID is required' 
      });
    }

    logger.info('Completing journey intake session', { 
      userId: req.user.id, 
      sessionId, 
      selectedJourneyId: selected_journey_id 
    });

    // Get the selected journey template
    const templateResult = await query(`
      SELECT * FROM playbook_templates WHERE id = $1 AND is_active = true
    `, [selected_journey_id]);

    if (templateResult.error || !templateResult.data.length) {
      logger.error('Journey template not found', { 
        selectedJourneyId: selected_journey_id 
      });
      return res.status(404).json({ 
        success: false, 
        error: 'Journey template not found' 
      });
    }

    const template = templateResult.data[0];

    // Get session details
    const sessionResult = await query(`
      SELECT * FROM journey_intake_sessions WHERE id = $1 AND user_id = $2
    `, [sessionId, req.user.id]);

    if (sessionResult.error || !sessionResult.data.length) {
      logger.error('Session not found', { sessionId, userId: req.user.id });
      return res.status(404).json({ 
        success: false, 
        error: 'Session not found' 
      });
    }

    const session = sessionResult.data[0];

    // Create user playbook progress record
    const progressResult = await query(`
      INSERT INTO user_playbook_progress (
        user_id, organization_id, playbook_id, status, progress_percentage, 
        started_at, metadata
      ) VALUES ($1, $2, $3, 'not_started', 0, NOW(), $4)
      ON CONFLICT (user_id, organization_id, playbook_id) 
      DO UPDATE SET 
        status = 'not_started',
        progress_percentage = 0,
        started_at = NOW(),
        updated_at = NOW()
      RETURNING id, user_id, playbook_id, status, progress_percentage
    `, [req.user.id, session.organization_id, selected_journey_id, journey_data || {}]);

    if (progressResult.error) {
      logger.error('Database error creating progress record', { error: progressResult.error });
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create journey progress' 
      });
    }

    // Update session status to completed
    await query(`
      UPDATE journey_intake_sessions 
      SET status = 'completed', completed_at = NOW(), selected_journey_id = $1
      WHERE id = $2
    `, [selected_journey_id, sessionId]);

    const progress = progressResult.data[0];

    logger.info('Journey intake completed successfully', { 
      userId: req.user.id, 
      sessionId, 
      journeyId: progress.id,
      templateName: template.name 
    });

    res.json({
      success: true,
      data: {
        journey_id: progress.id,
        playbook_id: selected_journey_id,
        template_name: template.name,
        status: progress.status,
        progress_percentage: progress.progress_percentage
      }
    });

  } catch (error) {
    logger.error('Error completing journey intake', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/journey-intake/session/:sessionId
 * Get session details and conversation history
 */
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    logger.info('Fetching session details', { 
      userId: req.user.id, 
      sessionId 
    });

    // Get session details
    const sessionResult = await query(`
      SELECT * FROM journey_intake_sessions 
      WHERE id = $1 AND user_id = $2
    `, [sessionId, req.user.id]);

    if (sessionResult.error || !sessionResult.data.length) {
      logger.error('Session not found', { sessionId, userId: req.user.id });
      return res.status(404).json({ 
        success: false, 
        error: 'Session not found' 
      });
    }

    const session = sessionResult.data[0];

    // Get conversation messages
    const messagesResult = await query(`
      SELECT * FROM journey_intake_messages 
      WHERE session_id = $1 
      ORDER BY created_at ASC
    `, [sessionId]);

    if (messagesResult.error) {
      logger.error('Database error fetching messages', { error: messagesResult.error });
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch messages' 
      });
    }

    logger.info('Session details fetched successfully', { 
      userId: req.user.id, 
      sessionId,
      messageCount: messagesResult.data.length 
    });

    res.json({
      success: true,
      data: {
        session,
        messages: messagesResult.data
      }
    });

  } catch (error) {
    logger.error('Error fetching session details', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
