const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const { executeLocalEdgeFunction } = require('../edge-functions');

const router = express.Router();

// POST /api/edge/:functionName - Call local edge function
router.post('/:functionName', authenticateToken, async (req, res) => {
  try {
    const { functionName } = req.params;
    const payload = req.body;

    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    // Execute the local edge function
    const result = await executeLocalEdgeFunction(functionName, payload, req.user);

    res.json(result);
  } catch (error) {
    console.error(`Edge function ${req.params.functionName} error:`, error);
    
    res.status(error.status || 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/edge/:functionName/public - Call local edge function without authentication
router.post('/:functionName/public', async (req, res) => {
  try {
    const { functionName } = req.params;
    const payload = req.body;

    // Execute the local edge function without user context
    const result = await executeLocalEdgeFunction(functionName, payload, null);

    res.json(result);
  } catch (error) {
    console.error(`Public edge function ${req.params.functionName} error:`, error);
    
    res.status(error.status || 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

module.exports = router;
