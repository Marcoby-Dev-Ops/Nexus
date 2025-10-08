const { Router } = require('express');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { pushService } = require('../services/pushService');

const router = Router();

router.get('/vapid-public-key', (_req, res) => {
  const { publicKey } = pushService.getVapidConfig();

  if (!publicKey) {
    return res.status(503).json({
      success: false,
      error: 'VAPID public key is not configured'
    });
  }

  return res.json({
    success: true,
    publicKey
  });
});

router.post('/subscriptions', authenticateToken, (req, res) => {
  try {
    const subscription = pushService.saveSubscription({
      ...req.body,
      userId: req.user.id
    });

    logger.info('Push subscription stored', {
      endpoint: subscription.endpoint,
      userId: req.user.id
    });

    return res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error('Failed to store push subscription:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store push subscription'
    });
  }
});

router.delete('/subscriptions', authenticateToken, (req, res) => {
  try {
    const { endpoint } = req.body || {};

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Subscription endpoint is required'
      });
    }

    const removed = pushService.removeSubscription(endpoint);

    if (removed) {
      logger.info('Push subscription removed', { endpoint, userId: req.user.id });
    }

    return res.json({
      success: true,
      removed
    });
  } catch (error) {
    logger.error('Failed to remove push subscription:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove push subscription'
    });
  }
});

router.get('/subscriptions', authenticateToken, (req, res) => {
  try {
    const endpoint = req.query.endpoint;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Endpoint query parameter is required'
      });
    }

    const subscription = pushService.getSubscriptionByEndpoint(endpoint);

    return res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error('Failed to fetch push subscription:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch push subscription'
    });
  }
});

router.post('/test', authenticateToken, async (req, res) => {
  try {
    const result = await pushService.sendTestNotification({
      title: req.body?.title,
      body: req.body?.body,
      url: req.body?.url
    });

    return res.json({
      success: true,
      message:
        result.delivered > 0
          ? `Test notification sent to ${result.delivered} subscription(s)`
          : 'No active push subscriptions to notify',
      data: result
    });
  } catch (error) {
    logger.error('Failed to process test notification:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process test notification'
    });
  }
});

module.exports = router;
