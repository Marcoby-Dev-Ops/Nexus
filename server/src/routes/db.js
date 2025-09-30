// @ts-nocheck
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const { query, transaction } = require('../database/connection');
const { logger } = require('../utils/logger');

const router = express.Router();

// Comprehensive list of all allowed database tables
const getAllowedTables = () => [
  // AI & Chat Tables
  'ai_conversations', 'ai_expert_prompts', 'ai_experts', 'ai_memories', 'ai_messages',
  
  // Business & Organization Tables
  'building_blocks', 'business_health_snapshots', 'companies', 'company_members', 
  'organizations', 'user_organizations',
  
  // Knowledge & CKB Tables
  'ckb_documents', 'ckb_search_logs', 'ckb_storage_connections', 'knowledge_update_triggers',
  
  // Journey & Playbook Tables
  'journey_analytics', 'journey_context_notes', 'journey_items', 'journey_playbook_mapping',
  'journey_templates', 'playbook_items', 'playbook_knowledge_mappings', 'playbook_templates',
  'user_journey_progress', 'user_journey_responses', 'user_journeys',
  'user_playbook_progress', 'user_playbook_responses',
  
  // Maturity & Assessment Tables
  'maturity_assessments', 'maturity_domains', 'maturity_questions',
  
  // User & Profile Tables
  'user_profiles', 'user_preferences', 'user_integrations', 'user_building_block_implementations',
  
  // Integration & OAuth Tables
  'integrations', 'oauth_states', 'oauth_tokens',
  
  // AI Expert System Tables
  'expert_performance', 'expert_switching_rules',
  
  // Monitoring & Analytics Tables
  'monitoring_alerts', 'conversations', 'messages',
  
  // Legacy/Compatibility Tables (keeping for backward compatibility)
  'tasks', 'thoughts', 'documents', 'business_metrics', 'user_activities',
  'next_best_actions', 'user_action_executions', 'ai_models',
  'analytics_events', 'callback_events', 'user_onboarding_steps',
  'user_onboarding_completions', 'user_onboarding_phases', 'insight_feedback', 'initiative_acceptances',
  'quantum_business_profiles', 'ai_action_card_templates', 'user_contexts',
  'ai_agents'
];

/**
 * GET /api/db/:table - Get data from table with optional filtering
 */
router.get('/:table', authenticateToken, async (req, res) => {
  try {
    const { table } = req.params;
    const { columns, ...filters } = req.query;
    const userId = req.user.id;
    
    // Extract JWT payload from the request (set by auth middleware)
    const jwtPayload = req.user.jwtPayload || { sub: userId };

    // Validate table name to prevent SQL injection
    const allowedTables = getAllowedTables();

    if (!allowedTables.includes(table)) {
      throw createError(`Table '${table}' not allowed`, 400);
    }

    // Build SELECT query
    const selectColumns = columns || '*';
    let sql = `SELECT ${selectColumns} FROM ${table}`;
    const params = [];
    let paramIndex = 1;

    // Add user-based filtering for security (only for tables that don't use RLS)
    if (['user_profiles', 'user_integrations', 'tasks', 'thoughts', 'documents', 
         'user_activities', 'next_best_actions', 'user_action_executions', 'insight_feedback', 'initiative_acceptances', 'user_contexts'].includes(table)) {
      sql += ` WHERE user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    // For onboarding tables, use external user ID directly
    if (['user_onboarding_steps', 'user_onboarding_completions', 'user_onboarding_phases'].includes(table)) {
      sql += ` WHERE user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    // Add additional filters
    let orderByClause = null;
    
    if (filters && Object.keys(filters).length > 0) {
      const filterConditions = [];
      
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'filter') {
          // Handle nested filter object; accept stringified or object
          const filterObj = typeof value === 'string' ? JSON.parse(value) : value;
          Object.entries(filterObj).forEach(([filterKey, filterValue]) => {
            if (filterKey === 'order_by') {
              // Handle order_by as ORDER BY clause, not a filter
              orderByClause = filterValue;
            } else {
              filterConditions.push(`${filterKey} = $${paramIndex}`);
              params.push(filterValue);
              paramIndex++;
            }
          });
        } else if (key.startsWith('filter[') && key.endsWith(']')) {
          // Support filter[user_id]=... style
          const columnName = key.substring(7, key.length - 1);
          
          if (columnName === 'order_by') {
            // Handle order_by as ORDER BY clause, not a filter
            orderByClause = value;
          } else {
            filterConditions.push(`${columnName} = $${paramIndex}`);
            params.push(value);
            paramIndex++;
          }
        } else {
          filterConditions.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      });

      if (filterConditions.length > 0) {
        sql += sql.includes('WHERE') ? ' AND ' : ' WHERE ';
        sql += filterConditions.join(' AND ');
      }
    }

    // Add ordering
    if (orderByClause) {
      // Validate order_by to prevent SQL injection
      const allowedOrderByColumns = ['created_at', 'updated_at', 'title', 'name', 'date', 'timestamp', 'started_at'];
      const orderByParts = orderByClause.split('.');
      const column = orderByParts[0];
      const direction = orderByParts[1] || 'ASC';
      
      if (allowedOrderByColumns.includes(column) && ['ASC', 'DESC', 'asc', 'desc'].includes(direction.toUpperCase())) {
        sql += ` ORDER BY ${column} ${direction.toUpperCase()}`;
      } else {
        sql += ' ORDER BY created_at DESC';
      }
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    // Add limit for safety
    sql += ' LIMIT 1000';

    const result = await query(sql, params, jwtPayload);

    if (result.error) {
      throw createError(`Database query failed: ${result.error}`, 500);
    }

    res.json({
      success: true,
      data: result.data,
      count: result.rowCount
    });

  } catch (error) {
    logger.error('Database route error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Database operation failed'
    });
  }
});

/**
 * GET /api/db/:table/:id - Get single record by ID
 */
router.get('/:table/:id', authenticateToken, async (req, res) => {
  try {
    const { table, id } = req.params;
    const idColumnRaw = req.query.idColumn;
    const idColumn = typeof idColumnRaw === 'string' ? idColumnRaw : 'id';
    const userId = req.user.id;
    const jwtPayload = req.user.jwtPayload || { sub: userId };

    // Validate idColumn to prevent SQL injection
    const allowedIdColumns = ['id', 'user_id', 'integration_slug', 'email', 'username'];
    if (!allowedIdColumns.includes(idColumn)) {
      throw createError(`Invalid idColumn: ${idColumn}`, 400);
    }

    // Validate table name
    const allowedTables = getAllowedTables();

    if (!allowedTables.includes(table)) {
      throw createError(`Table '${table}' not allowed`, 400);
    }

    // Build query with user-based security
    let sql = `SELECT * FROM ${table} WHERE ${idColumn} = $1`;
    const params = [id];

    // Add user-based filtering for security
    if (table === 'user_profiles') {
      sql += ` AND user_id = $2`;
      params.push(userId);
    } else if (table === 'user_integrations') {
      sql += ` AND user_id = $2`;
      params.push(userId);
    } else if (table === 'tasks') {
      sql += ` AND user_id = $2`;
      params.push(userId);
    } else if (table === 'thoughts') {
      sql += ` AND user_id = $2`;
      params.push(userId);
    } else if (table === 'documents') {
      sql += ` AND user_id = $2`;
      params.push(userId);
    } else if (table === 'user_activities') {
      sql += ` AND user_id = $2`;
      params.push(userId);
    } else if (table === 'next_best_actions') {
      sql += ` AND user_id = $2`;
      params.push(userId);
    } else if (table === 'user_action_executions') {
      sql += ` AND user_id = $2`;
      params.push(userId);
    } else if (table === 'insight_feedback') {
      sql += ` AND user_id = $2`;
      params.push(userId);
    } else if (table === 'initiative_acceptances') {
      sql += ` AND user_id = $2`;
      params.push(userId);
    } else if (table === 'user_contexts') {
      sql += ` AND user_id = $2`;
      params.push(userId);
    }

    const result = await query(sql, params, jwtPayload);

    if (result.error) {
      throw createError(`Database query failed: ${result.error}`, 500);
    }

    if (!result.data || result.data.length === 0) {
      throw createError('Record not found', 404);
    }

    res.json({
      success: true,
      data: result.data[0]
    });

  } catch (error) {
    logger.error('Database GET by ID error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Database operation failed'
    });
  }
});

/**
 * POST /api/db/:table - Insert new record
 */
router.post('/:table', authenticateToken, async (req, res) => {
  try {
    const { table } = req.params;
    const data = req.body;
    const userId = req.user.id;
    const jwtPayload = req.user.jwtPayload || { sub: userId };

    // Validate table name
    const allowedTables = getAllowedTables();

    if (!allowedTables.includes(table)) {
      throw createError(`Table '${table}' not allowed`, 400);
    }

    // Add user_id to data for user-scoped tables
    if (['user_profiles', 'user_integrations', 'tasks', 'thoughts', 'documents', 
         'user_activities', 'next_best_actions', 'user_action_executions',
         'user_onboarding_steps', 'user_onboarding_completions', 'user_onboarding_phases', 'insight_feedback', 'initiative_acceptances', 'user_contexts'].includes(table)) {
      data.user_id = userId;
    }

    // Add company_id if user has one (only for business_metrics)
    if (['business_metrics'].includes(table)) {
      const userProfile = await query(
        'SELECT company_id FROM user_profiles WHERE user_id = $1',
        [userId],
        jwtPayload
      );
      
      if (userProfile.data && userProfile.data.length > 0) {
        data.company_id = userProfile.data[0].company_id;
      }
    }

    // Add timestamps
    data.created_at = new Date().toISOString();
    data.updated_at = new Date().toISOString();

    // Build INSERT query
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await query(sql, values, jwtPayload);

    if (result.error) {
      throw createError(`Database insert failed: ${result.error}`, 500);
    }

    res.json({
      success: true,
      data: result.data[0]
    });

  } catch (error) {
    logger.error('Database POST error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Database operation failed'
    });
  }
});

/**
 * PUT /api/db/:table/:id - Update record
 */
router.put('/:table/:id', authenticateToken, async (req, res) => {
  try {
    const { table, id } = req.params;
    const idColumn = req.query.idColumn || 'id';
    const data = req.body;
    const userId = req.user.id;
    const jwtPayload = req.user.jwtPayload || { sub: userId };

    // Validate idColumn to prevent SQL injection
    const allowedIdColumns = ['id', 'user_id', 'integration_slug', 'email', 'username'];
    if (!allowedIdColumns.includes(idColumn)) {
      throw createError(`Invalid idColumn: ${idColumn}`, 400);
    }

    // Validate table name
    const allowedTables = getAllowedTables();

    if (!allowedTables.includes(table)) {
      throw createError(`Table '${table}' not allowed`, 400);
    }

    // Add updated_at timestamp
    data.updated_at = new Date().toISOString();

    // Build UPDATE query with user-based security
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, index) => `${col} = $${index + 2}`).join(', ');

    let sql = `UPDATE ${table} SET ${setClause} WHERE ${idColumn} = $1`;
    const params = [id, ...values];

    // Add user-based filtering for security
    if (['user_profiles', 'user_integrations', 'tasks', 'thoughts', 'documents', 
         'user_activities', 'next_best_actions', 'user_action_executions', 'insight_feedback', 'initiative_acceptances', 'user_contexts'].includes(table)) {
      sql += ` AND user_id = $${params.length + 1}`;
      params.push(userId);
    }
    
    // For onboarding tables, use external user ID directly
    if (['user_onboarding_steps', 'user_onboarding_completions', 'user_onboarding_phases'].includes(table)) {
      sql += ` AND user_id = $${params.length + 1}`;
      params.push(userId);
    }

    sql += ' RETURNING *';

    const result = await query(sql, params, jwtPayload);

    if (result.error) {
      throw createError(`Database update failed: ${result.error}`, 500);
    }

    if (!result.data || result.data.length === 0) {
      throw createError('Record not found or access denied', 404);
    }

    res.json({
      success: true,
      data: result.data[0]
    });

  } catch (error) {
    logger.error('Database PUT error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Database operation failed'
    });
  }
});

/**
 * DELETE /api/db/:table/:id - Delete record
 */
router.delete('/:table/:id', authenticateToken, async (req, res) => {
  try {
    const { table, id } = req.params;
    const idColumnRaw = req.query.idColumn;
    const idColumn = typeof idColumnRaw === 'string' ? idColumnRaw : 'id';
    const userId = req.user.id;
    const jwtPayload = req.user.jwtPayload || { sub: userId };

    // Validate table name
    const allowedTables = getAllowedTables();

    if (!allowedTables.includes(table)) {
      throw createError(`Table '${table}' not allowed`, 400);
    }

    // Build DELETE query with user-based security
    let sql = `DELETE FROM ${table} WHERE ${idColumn} = $1`;
    const params = [id];

    // Add user-based filtering for security
    if (['user_profiles', 'user_integrations', 'tasks', 'thoughts', 'documents', 
         'user_activities', 'next_best_actions', 'user_action_executions', 'insight_feedback', 'initiative_acceptances', 'user_contexts'].includes(table)) {
      sql += ` AND user_id = $2`;
      params.push(userId);
    }
    
    // For onboarding tables, use external user ID directly
    if (['user_onboarding_steps', 'user_onboarding_completions', 'user_onboarding_phases'].includes(table)) {
      sql += ` AND user_id = $2`;
      params.push(userId);
    }

    sql += ' RETURNING *';

    const result = await query(sql, params, jwtPayload);

    if (result.error) {
      throw createError(`Database delete failed: ${result.error}`, 500);
    }

    if (!result.data || result.data.length === 0) {
      throw createError('Record not found or access denied', 404);
    }

    res.json({
      success: true,
      data: result.data[0]
    });

  } catch (error) {
    logger.error('Database DELETE error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Database operation failed'
    });
  }
});

/**
 * POST /api/db/:table/upsert - Upsert record
 */
router.post('/:table/upsert', authenticateToken, async (req, res) => {
  try {
    const { table } = req.params;
    const { data, onConflict = 'id' } = req.body;
    const userId = req.user.id;
    const jwtPayload = req.user.jwtPayload || { sub: userId };

    // Validate table name
    const allowedTables = getAllowedTables();

    if (!allowedTables.includes(table)) {
      throw createError(`Table '${table}' not allowed`, 400);
    }

    // Add user_id to data for user-scoped tables
    if (['user_profiles', 'user_integrations', 'tasks', 'thoughts', 'documents', 
         'user_activities', 'next_best_actions', 'user_action_executions',
         'user_onboarding_steps', 'user_onboarding_completions', 'user_onboarding_phases', 'insight_feedback', 'initiative_acceptances', 'user_contexts'].includes(table)) {
      data.user_id = userId;
    }

    // Add timestamps
    data.updated_at = new Date().toISOString();
    if (!data.created_at) {
      data.created_at = new Date().toISOString();
    }

    // Build UPSERT query with proper conflict resolution
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    // Determine the correct conflict resolution based on table
    let conflictColumns = onConflict;
    if (['user_onboarding_steps', 'user_onboarding_completions', 'user_onboarding_phases'].includes(table)) {
      if (table === 'user_onboarding_steps') {
        conflictColumns = 'user_id,step_id';
      } else if (table === 'user_onboarding_phases') {
        conflictColumns = 'user_id,phase_id';
      } else if (table === 'user_onboarding_completions') {
        conflictColumns = 'user_id';
      }
    }
    
    const updateClause = columns
      .filter(col => !conflictColumns.split(',').includes(col))
      .map((col) => `${col} = EXCLUDED.${col}`)
      .join(', ');

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (${conflictColumns}) 
      DO UPDATE SET ${updateClause}
      RETURNING *
    `;

    const result = await query(sql, values, jwtPayload);

    if (result.error) {
      throw createError(`Database upsert failed: ${result.error}`, 500);
    }

    res.json({
      success: true,
      data: result.data[0]
    });

  } catch (error) {
    logger.error('Database UPSERT error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Database operation failed'
    });
  }
});

/**
 * POST /api/db/:table/query - Advanced query with options
 */
router.post('/:table/query', authenticateToken, async (req, res) => {
  try {
    const { table } = req.params;
    const { filter, orderBy, limit = 100 } = req.body;
    const userId = req.user.id;
    const jwtPayload = req.user.jwtPayload || { sub: userId };

    // Validate table name
    const allowedTables = getAllowedTables();

    if (!allowedTables.includes(table)) {
      throw createError(`Table '${table}' not allowed`, 400);
    }

    // Build SELECT query
    let sql = `SELECT * FROM ${table}`;
    const params = [];
    let paramIndex = 1;

    // Add user-based filtering for security
    if (['user_profiles', 'user_integrations', 'tasks', 'thoughts', 'documents', 
         'user_activities', 'next_best_actions', 'user_action_executions', 'insight_feedback', 'initiative_acceptances', 'user_contexts'].includes(table)) {
      sql += ` WHERE user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    // For onboarding tables, use external user ID directly
    if (['user_onboarding_steps', 'user_onboarding_completions', 'user_onboarding_phases'].includes(table)) {
      sql += ` WHERE user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    // Add additional filters
    if (filter && Object.keys(filter).length > 0) {
      const filterConditions = [];
      
      Object.entries(filter).forEach(([key, value]) => {
        filterConditions.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      });

      if (filterConditions.length > 0) {
        sql += sql.includes('WHERE') ? ' AND ' : ' WHERE ';
        sql += filterConditions.join(' AND ');
      }
    }

    // Add ordering
    if (orderBy) {
      const direction = orderBy.ascending ? 'ASC' : 'DESC';
      sql += ` ORDER BY ${orderBy.column} ${direction}`;
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    // Add limit
    sql += ` LIMIT ${Math.min(limit, 1000)}`;

    const result = await query(sql, params, jwtPayload);

    if (result.error) {
      throw createError(`Database query failed: ${result.error}`, 500);
    }

    res.json({
      success: true,
      data: result.data,
      count: result.data?.length || 0
    });

  } catch (error) {
    logger.error('Database advanced query error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Database operation failed'
    });
  }
});

module.exports = router;
