const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const { query } = require('../database/connection');

const router = express.Router();

// GET /api/var-leads - Get all VAR leads
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const sql = 'SELECT * FROM var_leads ORDER BY created_at DESC';
    const { data: leads, error } = await query(sql);

    if (error) {
      throw createError(`Database error: ${error}`, 400);
    }

    res.json({
      success: true,
      data: leads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/var-leads/:id - Get specific VAR lead
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;

    const sql = 'SELECT * FROM var_leads WHERE id = $1 LIMIT 1';
    const { data: leads, error } = await query(sql, [id]);

    if (error) {
      throw createError(`Database error: ${error}`, 400);
    }

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'VAR lead not found'
      });
    }

    res.json({
      success: true,
      data: leads[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/var-leads - Create new VAR lead
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const leadData = {
      ...req.body,
      created_by: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const columns = Object.keys(leadData);
    const values = Object.values(leadData);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const sql = `
      INSERT INTO var_leads (${columns.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    
    const { data: result, error } = await query(sql, values);

    if (error) {
      throw createError(`Database error: ${error}`, 400);
    }

    res.status(201).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/var-leads/:id - Update VAR lead
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const setClause = Object.keys(updateData).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updateData)];

    const sql = `
      UPDATE var_leads 
      SET ${setClause} 
      WHERE id = $1 
      RETURNING *
    `;
    
    const { data: result, error } = await query(sql, values);

    if (error) {
      throw createError(`Database error: ${error}`, 400);
    }

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'VAR lead not found'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/var-leads/:id - Delete VAR lead
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;

    const sql = 'DELETE FROM var_leads WHERE id = $1';
    const { error } = await query(sql, [id]);

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

module.exports = router;
