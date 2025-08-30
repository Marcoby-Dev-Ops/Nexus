/**
 * Ticket Management Agent Routes
 * 
 * Handles ticket lifecycle management, health monitoring, and intelligent
 * recommendations for brain tickets.
 */

const express = require('express');
const router = express.Router();
const ticket_management_agent = require('../edge-functions/ticket_management_agent');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

/**
 * POST /ticket-management/validate
 * Validate ticket structure and required elements
 */
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { ticketData } = req.body;
    const user = req.user;

    if (!ticketData) {
      return res.status(400).json({
        success: false,
        error: 'Ticket data is required'
      });
    }

    logger.info('Ticket validation request', {
      userId: user.id,
      ticketType: ticketData.ticket_type
    });

    const result = await ticket_management_agent({
      action: 'validate_ticket',
      updateData: ticketData
    }, user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info('Ticket validation completed', {
      userId: user.id,
      isValid: result.data.validation.isValid,
      errors: result.data.validation.errors.length
    });

    res.json(result);

  } catch (error) {
    logger.error('Ticket validation route error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to validate ticket'
    });
  }
});

/**
 * PUT /ticket-management/update/:ticketId
 * Update ticket with validation and health monitoring
 */
router.put('/update/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { updateData, useAI = true } = req.body;
    const user = req.user;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Update data is required'
      });
    }

    logger.info('Ticket update request', {
      userId: user.id,
      ticketId,
      updateFields: Object.keys(updateData),
      useAI
    });

    const result = await ticket_management_agent({
      action: 'update_ticket',
      ticketId,
      updateData,
      useAI
    }, user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info('Ticket update completed', {
      userId: user.id,
      ticketId,
      changes: result.data.validation.changes.length,
      healthScore: result.data.health.score,
      aiEnhanced: !!result.data.aiAnalysis
    });

    res.json(result);

  } catch (error) {
    logger.error('Ticket update route error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      ticketId: req.params.ticketId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update ticket'
    });
  }
});

/**
 * POST /ticket-management/close/:ticketId
 * Close ticket with proper completion process
 */
router.post('/close/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { completionData = {}, useAI = true } = req.body;
    const user = req.user;

    logger.info('Ticket close request', {
      userId: user.id,
      ticketId,
      completionData: Object.keys(completionData),
      useAI
    });

    const result = await ticket_management_agent({
      action: 'close_ticket',
      ticketId,
      completionData,
      useAI
    }, user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info('Ticket closed successfully', {
      userId: user.id,
      ticketId,
      completionScore: result.data.assessment.completionScore,
      aiAssessed: !!result.data.assessment.completionNotes
    });

    res.json(result);

  } catch (error) {
    logger.error('Ticket close route error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      ticketId: req.params.ticketId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to close ticket'
    });
  }
});

/**
 * GET /ticket-management/health
 * Monitor and report on ticket health
 */
router.get('/health', authenticateToken, async (req, res) => {
  try {
    const { useAI = true } = req.query;
    const user = req.user;

    logger.info('Ticket health monitoring request', {
      userId: user.id,
      useAI
    });

    const result = await ticket_management_agent({
      action: 'monitor_health',
      useAI: useAI === 'true'
    }, user);

    if (!result.success) {
      return res.status(500).json(result);
    }

    logger.info('Ticket health monitoring completed', {
      userId: user.id,
      totalTickets: result.data.totalTickets,
      activeTickets: result.data.activeTickets,
      overallHealthScore: result.data.overallHealthScore,
      aiGenerated: result.data.aiGenerated
    });

    res.json(result);

  } catch (error) {
    logger.error('Ticket health monitoring route error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to monitor ticket health'
    });
  }
});

/**
 * GET /ticket-management/analyze/:ticketId
 * Analyze specific ticket health and provide recommendations
 */
router.get('/analyze/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { useAI = true } = req.query;
    const user = req.user;

    logger.info('Ticket health analysis request', {
      userId: user.id,
      ticketId,
      useAI
    });

    const result = await ticket_management_agent({
      action: 'analyze_health',
      ticketId,
      useAI: useAI === 'true'
    }, user);

    if (!result.success) {
      return res.status(404).json(result);
    }

    logger.info('Ticket health analysis completed', {
      userId: user.id,
      ticketId,
      healthScore: result.data.health.score,
      risk: result.data.health.risk,
      aiEnhanced: !!result.data.aiAnalysis
    });

    res.json(result);

  } catch (error) {
    logger.error('Ticket health analysis route error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      ticketId: req.params.ticketId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to analyze ticket health'
    });
  }
});

/**
 * GET /ticket-management/status
 * Get overall ticket management system status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Get basic ticket statistics
    const { query } = require('../database/connection');
    const uuidUserId = require('../edge-functions/ticket_management_agent').hashToUUID(user.id);

    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tickets,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tickets,
        COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_tickets,
        COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_tickets,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tickets,
        AVG(CASE WHEN status = 'completed' THEN EXTRACT(EPOCH FROM (completed_at - created_at))/86400 END) as avg_completion_days,
        COUNT(CASE WHEN updated_at < NOW() - INTERVAL '7 days' AND status = 'active' THEN 1 END) as stale_tickets
       FROM brain_tickets 
       WHERE user_id = $1`,
      [uuidUserId]
    );

    const stats = statsResult.rows[0];

    // Calculate health metrics
    const healthMetrics = {
      completionRate: stats.total_tickets > 0 ? (stats.completed_tickets / stats.total_tickets * 100).toFixed(1) : 0,
      activeRate: stats.total_tickets > 0 ? (stats.active_tickets / stats.total_tickets * 100).toFixed(1) : 0,
      staleRate: stats.total_tickets > 0 ? (stats.stale_tickets / stats.total_tickets * 100).toFixed(1) : 0,
      avgCompletionDays: parseFloat(stats.avg_completion_days || 0).toFixed(1)
    };

    // Determine overall system health
    let systemHealth = 'excellent';
    if (healthMetrics.staleRate > 20 || healthMetrics.completionRate < 50) {
      systemHealth = 'poor';
    } else if (healthMetrics.staleRate > 10 || healthMetrics.completionRate < 70) {
      systemHealth = 'fair';
    } else if (healthMetrics.staleRate > 5 || healthMetrics.completionRate < 85) {
      systemHealth = 'good';
    }

    const status = {
      system: {
        status: 'operational',
        health: systemHealth,
        lastUpdated: new Date().toISOString()
      },
      user: {
        id: user.id,
        email: user.email
      },
      tickets: {
        total: parseInt(stats.total_tickets),
        active: parseInt(stats.active_tickets),
        completed: parseInt(stats.completed_tickets),
        paused: parseInt(stats.paused_tickets),
        critical: parseInt(stats.critical_tickets),
        highPriority: parseInt(stats.high_priority_tickets),
        stale: parseInt(stats.stale_tickets)
      },
      metrics: healthMetrics,
      recommendations: []
    };

    // Add recommendations based on metrics
    if (healthMetrics.staleRate > 10) {
      status.recommendations.push('Review and update stale tickets');
    }
    if (stats.critical_tickets > 0) {
      status.recommendations.push('Address critical priority tickets');
    }
    if (healthMetrics.completionRate < 70) {
      status.recommendations.push('Focus on completing active tickets');
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Ticket management status route error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get ticket management status'
    });
  }
});

module.exports = router;
