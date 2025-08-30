const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const { query } = require('../database/connection');

const router = express.Router();

// GET /api/integrations - Get all integrations for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const sql = `
      SELECT ui.*, i.* 
      FROM user_integrations ui
      LEFT JOIN integrations i ON ui.integration_id = i.id
      WHERE ui.user_id = $1
      ORDER BY ui.created_at DESC
    `;
    const { data: integrations, error } = await query(sql, [req.user.id]);

    if (error) {
      throw createError(`Database error: ${error}`, 400);
    }

    res.json({
      success: true,
      data: integrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/integrations/:id - Get specific integration
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;

    const sql = `
      SELECT ui.*, i.* 
      FROM user_integrations ui
      LEFT JOIN integrations i ON ui.integration_id = i.id
      WHERE ui.id = $1 AND ui.user_id = $2
      LIMIT 1
    `;
    const { data: integrations, error } = await query(sql, [id, req.user.id]);

    if (error) {
      throw createError(`Database error: ${error}`, 400);
    }

    if (!integrations || integrations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    res.json({
      success: true,
      data: integrations[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/integrations - Create new integration
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const integrationData = {
      ...req.body,
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const columns = Object.keys(integrationData);
    const values = Object.values(integrationData);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const sql = `
      INSERT INTO user_integrations (${columns.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    
    const { data: result, error } = await query(sql, values);

    if (error) {
      throw createError(`Database error: ${error}`, 400);
    }

    // Get the created integration with join data
    const joinSql = `
      SELECT ui.*, i.* 
      FROM user_integrations ui
      LEFT JOIN integrations i ON ui.integration_id = i.id
      WHERE ui.id = $1
      LIMIT 1
    `;
    const { data: integration, error: joinError } = await query(joinSql, [result[0].id]);

    if (joinError) {
      throw createError(`Database error: ${joinError}`, 400);
    }

    res.status(201).json({
      success: true,
      data: integration[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/integrations/:id - Update integration
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const setClause = Object.keys(updateData).map((key, index) => `${key} = $${index + 3}`).join(', ');
    const values = [id, req.user.id, ...Object.values(updateData)];

    const sql = `
      UPDATE user_integrations 
      SET ${setClause} 
      WHERE id = $1 AND user_id = $2 
      RETURNING *
    `;
    
    const { data: result, error } = await query(sql, values);

    if (error) {
      throw createError(`Database error: ${error}`, 400);
    }

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    // Get the updated integration with join data
    const joinSql = `
      SELECT ui.*, i.* 
      FROM user_integrations ui
      LEFT JOIN integrations i ON ui.integration_id = i.id
      WHERE ui.id = $1
      LIMIT 1
    `;
    const { data: integration, error: joinError } = await query(joinSql, [id]);

    if (joinError) {
      throw createError(`Database error: ${joinError}`, 400);
    }

    res.json({
      success: true,
      data: integration[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/integrations/:id - Delete integration
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;

    const sql = 'DELETE FROM user_integrations WHERE id = $1 AND user_id = $2';
    const { error } = await query(sql, [id, req.user.id]);

    if (error) {
      throw createError(`Database error: ${error}`, 400);
    }

    res.json({
      success: true,
      data: { deleted: true }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/integrations/:id/insights - Get integration insights
router.get('/:id/insights', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;

    // Check if user owns this integration
    const checkSql = 'SELECT id FROM user_integrations WHERE id = $1 AND user_id = $2 LIMIT 1';
    const { data: integration, error: integrationError } = await query(checkSql, [id, req.user.id]);

    if (integrationError || !integration || integration.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    // Get insights for this integration
    const insightsSql = 'SELECT * FROM integration_insights WHERE integration_id = $1 ORDER BY created_at DESC';
    const { data: insights, error } = await query(insightsSql, [id]);

    if (error) {
      throw createError(`Database error: ${error}`, 400);
    }

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

module.exports = router;
