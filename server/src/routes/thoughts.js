const express = require('express');
const { logger } = require('../utils/logger');
const { query } = require('../database/connection');

const router = express.Router();

/**
 * GET /api/thoughts - Get all thoughts for a user
 */
router.get('/', async (req, res) => {
  try {
    const { user_id, company_id, category, limit = 50, offset = 0 } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (user_id) {
      whereClause += ` AND user_id = $${paramIndex++}`;
      params.push(user_id);
    }

    if (company_id) {
      whereClause += ` AND company_id = $${paramIndex++}`;
      params.push(company_id);
    }

    if (category) {
      whereClause += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    const result = await query(`
      SELECT id, user_id, company_id, title, content, category, 
             tags, metadata, created_at, updated_at
      FROM thoughts 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, parseInt(limit), parseInt(offset)]);

    if (result.error) {
      logger.error('Database query error:', result.error);
      return res.status(500).json({ error: 'Failed to fetch thoughts' });
    }

    res.json({ thoughts: result.data || [] });
  } catch (error) {
    logger.error('Error fetching thoughts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/thoughts - Create a new thought
 */
router.post('/', async (req, res) => {
  try {
    const { user_id, company_id, title, content, category = 'general', tags = [], metadata = {} } = req.body;

    if (!user_id || !content) {
      return res.status(400).json({ error: 'user_id and content are required' });
    }

    const result = await query(`
      INSERT INTO thoughts (
        id, user_id, company_id, title, content, category, 
        tags, metadata, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      ) RETURNING id, user_id, company_id, title, content, category, 
                  tags, metadata, created_at, updated_at
    `, [user_id, company_id, title, content, category, tags, JSON.stringify(metadata)]);

    if (result.error) {
      logger.error('Database query error:', result.error);
      return res.status(500).json({ error: 'Failed to create thought' });
    }

    res.status(201).json({ thought: result.data[0] });
  } catch (error) {
    logger.error('Error creating thought:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/thoughts/:id - Get a specific thought
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT id, user_id, company_id, title, content, category, 
             tags, metadata, created_at, updated_at
      FROM thoughts 
      WHERE id = $1
    `, [id]);

    if (result.error) {
      logger.error('Database query error:', result.error);
      return res.status(500).json({ error: 'Failed to fetch thought' });
    }

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ error: 'Thought not found' });
    }

    res.json({ thought: result.data[0] });
  } catch (error) {
    logger.error('Error fetching thought:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/thoughts/:id - Update a thought
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags, metadata } = req.body;

    const result = await query(`
      UPDATE thoughts 
      SET title = COALESCE($2, title),
          content = COALESCE($3, content),
          category = COALESCE($4, category),
          tags = COALESCE($5, tags),
          metadata = COALESCE($6, metadata),
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, user_id, company_id, title, content, category, 
                tags, metadata, created_at, updated_at
    `, [id, title, content, category, tags, metadata ? JSON.stringify(metadata) : null]);

    if (result.error) {
      logger.error('Database query error:', result.error);
      return res.status(500).json({ error: 'Failed to update thought' });
    }

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ error: 'Thought not found' });
    }

    res.json({ thought: result.data[0] });
  } catch (error) {
    logger.error('Error updating thought:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/thoughts/:id - Delete a thought
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      DELETE FROM thoughts 
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.error) {
      logger.error('Database query error:', result.error);
      return res.status(500).json({ error: 'Failed to delete thought' });
    }

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ error: 'Thought not found' });
    }

    res.json({ message: 'Thought deleted successfully' });
  } catch (error) {
    logger.error('Error deleting thought:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
