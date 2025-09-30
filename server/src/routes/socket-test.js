/**
 * Socket.IO Test Routes
 * 
 * Provides endpoints for testing Socket.IO functionality
 */

const express = require('express');
const { logger } = require('../utils/logger');
const socketService = require('../services/SocketService');

const router = express.Router();

/**
 * POST /api/socket-test/insight
 * Test endpoint to emit an actionable insight
 */
router.post('/insight', async (req, res) => {
  try {
    const { type = 'at-risk-deal-detected', data } = req.body;

    // Default test data if none provided
    const defaultData = {
      id: 'test-deal-' + Date.now(),
      name: 'Enterprise Software License',
      value: 50000,
      customerName: 'Acme Corporation',
      riskLevel: 'high',
      lastActivity: '7 days ago',
      nextAction: 'Send re-engagement email sequence'
    };

    const insight = {
      type,
      data: data || defaultData,
      userId: req.body.userId || null
    };

    logger.info('Emitting test actionable insight', { insight });

    // Emit the insight
    socketService.emitActionableInsight(insight);

    res.json({
      success: true,
      message: 'Actionable insight emitted successfully',
      insight
    });

  } catch (error) {
    logger.error('Failed to emit test insight', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to emit test insight'
    });
  }
});

/**
 * GET /api/socket-test/stats
 * Get Socket.IO connection statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = socketService.getConnectionStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get socket stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get socket stats'
    });
  }
});

/**
 * POST /api/socket-test/notification
 * Test endpoint to emit a user notification
 */
router.post('/notification', async (req, res) => {
  try {
    const { userId, notification } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const defaultNotification = {
      id: 'test-notification-' + Date.now(),
      title: 'Test Notification',
      message: 'This is a test notification from the Socket.IO service',
      type: 'info',
      timestamp: new Date().toISOString()
    };

    const notificationData = notification || defaultNotification;

    logger.info('Emitting test user notification', { userId, notification: notificationData });

    // Emit the notification
    socketService.emitUserNotification(userId, notificationData);

    res.json({
      success: true,
      message: 'User notification emitted successfully',
      notification: notificationData
    });

  } catch (error) {
    logger.error('Failed to emit test notification', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to emit test notification'
    });
  }
});

module.exports = router;

