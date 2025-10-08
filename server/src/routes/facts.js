/* Minimal facts route
   This file is intentionally small and defensive. Some production images
   may not include the optional facts routes; providing this file ensures
   the server can `require` it safely and mount a lightweight router.
*/
const express = require('express');

const router = express.Router();

// Simple info endpoint used by lightweight deployments
router.get('/', (req, res) => {
  return res.json({
    success: true,
    message: 'Facts routes placeholder',
    timestamp: Date.now()
  });
});

// Example health-check style endpoint
router.get('/status', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

module.exports = router;
