const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { loadAtomRegistry, getRegistryPath } = require('../atom/registry');

const router = express.Router();

/**
 * GET /api/atom-registry
 * Returns the Atom Registry used by both backend enforcement and frontend visualization.
 */
router.get('/', authenticateToken, async (_req, res) => {
  try {
    const registry = loadAtomRegistry();
    res.json({
      success: true,
      data: registry,
      meta: {
        path: getRegistryPath(),
        version: registry?.version || 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load atom registry'
    });
  }
});

module.exports = router;
