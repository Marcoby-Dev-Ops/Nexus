const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/telemetry/batch
 * Accepts an array of telemetry events { type, timestamp, payload }
 */
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const ev of events) {
      // Minimal validation
      if (!ev || !ev.type) continue;
      // Attach user context if missing
      ev.userId = ev.userId || req.user?.id || null;
      logger.info('telemetry.event', { type: ev.type, payload: ev.payload || {}, userId: ev.userId, ts: ev.timestamp || Date.now() });
    }

    res.json({ success: true, received: events.length });
  } catch (err) {
    logger.error('telemetry.batch failed', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

module.exports = router;
