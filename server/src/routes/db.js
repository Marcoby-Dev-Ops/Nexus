// @ts-nocheck
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const { query, transaction } = require('../database/connection');
const { logger } = require('../utils/logger');

const AuditService = require('../services/AuditService');
const router = express.Router();

// Comprehensive list of all allowed database tables
const getAllowedTables = () => [
  // AI & Chat Tables
  'ai_conversations', 'ai_expert_prompts', 'ai_experts', 'ai_memories', 'ai_messages', 'ai_message_attachments',
  'chat_usage_tracking',

  // Business & Organization Tables
  'building_blocks', 'business_health_snapshots', 'business_identity',
  'companies', 'company_members', 'identities',
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
  'tasks', 'thoughts', 'personal_thoughts', 'documents', 'business_metrics', 'user_activities',
  'next_best_actions', 'user_action_executions', 'ai_models',
  'analytics_events', 'callback_events', 'user_onboarding_steps',
  'user_onboarding_completions', 'user_onboarding_phases', 'insight_feedback', 'initiative_acceptances',
  'quantum_business_profiles', 'ai_action_card_templates', 'user_contexts',
  'ai_agents', 'user_licenses', 'contacts', 'deals'
];

const DEFAULT_AGENT_CATALOG = [
  {
    id: 'executive-assistant',
    name: 'Executive Assistant',
    type: 'executive',
    description: 'Strategic partner focused on executive decision support, high-level planning, and cross-functional coordination.',
    capabilities: [
      'strategic-planning',
      'executive-briefings',
      'cross-functional-coordination',
      'business-health-analysis'
    ],
    tools: ['contextual-rag', 'dashboard-insights', 'action-planning'],
    isActive: true
  },
  {
    id: 'concierge-director',
    name: 'Concierge Director',
    type: 'executive',
    description: 'User-first concierge that helps navigate Nexus, provides contextual guidance, and coordinates actions on behalf of the user.',
    capabilities: [
      'application-navigation',
      'context-aware-guidance',
      'intent-routing',
      'personalized-recommendations'
    ],
    tools: ['ui-state-awareness', 'journey-orchestration'],
    isActive: true
  },
  {
    id: 'sales-director',
    name: 'Sales Director',
    type: 'departmental',
    description: 'Revenue-focused leader who analyzes pipeline performance, forecasts revenue, and coaches sales teams.',
    capabilities: [
      'pipeline-analysis',
      'revenue-forecasting',
      'sales-coaching',
      'deal-strategy'
    ],
    tools: ['sales-insights', 'forecasting-engine'],
    isActive: true
  },
  {
    id: 'marketing-cmo',
    name: 'Marketing CMO',
    type: 'departmental',
    description: 'Growth-oriented marketing strategist specializing in campaign optimization, brand positioning, and customer acquisition.',
    capabilities: [
      'campaign-optimization',
      'brand-strategy',
      'customer-acquisition',
      'marketing-analytics'
    ],
    tools: ['campaign-dashboard', 'audience-insights'],
    isActive: true
  },
  {
    id: 'finance-controller',
    name: 'Finance Controller',
    type: 'departmental',
    description: 'Finance specialist focused on budgeting, cash flow management, and financial performance insights.',
    capabilities: [
      'cash-flow-analysis',
      'budget-planning',
      'profitability-insights',
      'risk-assessment'
    ],
    tools: ['financial-dashboard', 'variance-analysis'],
    isActive: true
  },
  {
    id: 'operations-strategist',
    name: 'Operations Strategist',
    type: 'specialist',
    description: 'Operational expert who optimizes workflows, improves efficiency, and drives process excellence.',
    capabilities: [
      'process-optimization',
      'resource-planning',
      'kpi-tracking',
      'continuous-improvement'
    ],
    tools: ['workflow-mapper', 'operations-scorecard'],
    isActive: true
  }
];

function buildDefaultAgentsResponse() {
  const timestamp = new Date().toISOString();
  return DEFAULT_AGENT_CATALOG.map(agent => ({
    createdAt: timestamp,
    updatedAt: timestamp,
    ...agent
  }));
}

const USER_SCOPED_TABLES = [
  'user_profiles',
  'user_integrations',
  'tasks',
  'thoughts',
  'documents',
  'user_activities',
  'next_best_actions',
  'user_action_executions',
  'user_onboarding_steps',
  'user_onboarding_completions',
  'user_onboarding_phases',
  'insight_feedback',
  'initiative_acceptances',
  'user_contexts'
];

async function enrichBusinessMetricsRecord(table, record, userId, jwtPayload) {
  if (table !== 'business_metrics') {
    return record;
  }

  const result = await query(
    'SELECT company_id FROM user_profiles WHERE user_id = $1',
    [userId],
    jwtPayload
  );

  if (result.data && result.data.length > 0) {
    return {
      ...record,
      company_id: result.data[0].company_id
    };
  }

  return record;
}

function toSnakeCaseKey(key = '') {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

function normalizeRecordKeys(record = {}) {
  return Object.keys(record).reduce((acc, key) => {
    const value = record[key];
    if (/[A-Z]/.test(key)) {
      const snakeKey = toSnakeCaseKey(key);
      if (!(snakeKey in acc)) {
        acc[snakeKey] = value;
        return acc;
      }
    }

    acc[key] = value;
    return acc;
  }, {});
}

async function insertRecord(table, payload, userId, jwtPayload) {
  const record = normalizeRecordKeys({ ...(payload || {}) });

  if (USER_SCOPED_TABLES.includes(table)) {
    record.user_id = userId;
  }

  const enrichedRecord = await enrichBusinessMetricsRecord(table, record, userId, jwtPayload);

  const timestamp = new Date().toISOString();
  enrichedRecord.created_at = enrichedRecord.created_at || timestamp;
  enrichedRecord.updated_at = enrichedRecord.updated_at || timestamp;

  const entries = Object.entries(enrichedRecord).filter(([, value]) => value !== undefined);
  const columns = entries.map(([column]) => column);
  const values = entries.map(([, value]) => value);

  if (columns.length === 0) {
    throw createError('No valid fields provided for insert operation', 400);
  }

  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

  const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

  const result = await query(sql, values, jwtPayload);

  if (result.error) {
    logger.error('Insert operation failed', {
      table,
      columns,
      error: result.error
    });
  }

  return result;
}


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

    const coerceValue = (value) => {
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (lower === 'true') return true;
        if (lower === 'false') return false;
        const numeric = Number(value);
        if (!Number.isNaN(numeric) && value.trim() !== '') {
          return numeric;
        }
      }
      return value;
    };

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
              params.push(coerceValue(filterValue));
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
            params.push(coerceValue(value));
            paramIndex++;
          }
        } else {
          filterConditions.push(`${key} = $${paramIndex}`);
          params.push(coerceValue(value));
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
    if (req.params?.table === 'ai_agents') {
      const message = error?.message || '';
      const relationMissing = typeof message === 'string' && message.includes('ai_agents') && message.toLowerCase().includes('does not exist');

      if (relationMissing) {
        logger.warn('ai_agents table not found. Returning default agent catalog.');
        return res.json({
          success: true,
          data: buildDefaultAgentsResponse(),
          count: DEFAULT_AGENT_CATALOG.length
        });
      }
    }

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

router.post('/insert', authenticateToken, async (req, res) => {
  try {
    const { table, data } = req.body || {};
    const userId = req.user.id;
    const jwtPayload = req.user.jwtPayload || { sub: userId };

    if (!table || typeof table !== 'string') {
      throw createError('Table name is required', 400);
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw createError('Data payload must be an object', 400);
    }

    const allowedTables = getAllowedTables();

    if (!allowedTables.includes(table)) {
      throw createError(`Table '${table}' not allowed`, 400);
    }

    const result = await insertRecord(table, data, userId, jwtPayload);

    if (result.error) {
      throw createError(`Database insert failed: ${result.error}`, 500);
    }

    // Record platform audit for insert
    try {
      const inserted = result.data && result.data[0] ? result.data[0] : null;
      await AuditService.recordEvent({
        eventType: 'db_insert',
        objectType: table,
        objectId: inserted && inserted.id ? inserted.id : null,
        actorId: userId,
        endpoint: '/api/db/insert',
        ip: req.ip,
        userAgent: req.get('User-Agent') || null,
        data: { inserted: inserted ? inserted : null }
      });
    } catch (auditErr) {
      logger.warn('Failed to record db_insert audit', { error: auditErr?.message || auditErr });
    }

    res.json({
      success: true,
      data: result.data[0]
    });

  } catch (error) {
    logger.error('Database POST (body payload) error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Database operation failed'
    });
  }
});

/**
 * POST /api/db/delete - Delete record by filters (compat with client deleteOne)
 * Supported: { table, filters: { id, idColumn? } }
 */
router.post('/delete', authenticateToken, async (req, res) => {
  try {
    const { table, filters } = req.body || {};
    const userId = req.user.id;
    const jwtPayload = req.user.jwtPayload || { sub: userId };

    if (!table || typeof table !== 'string') {
      throw createError('Table name is required', 400);
    }
    if (!filters || typeof filters !== 'object') {
      throw createError('Filters object is required', 400);
    }

    const allowedTables = getAllowedTables();
    if (!allowedTables.includes(table)) {
      throw createError(`Table '${table}' not allowed`, 400);
    }

    // Support { id } or a single column equality
    const entries = Object.entries(filters).filter(([, v]) => v !== undefined && v !== null);
    if (entries.length === 0) {
      throw createError('At least one filter must be provided', 400);
    }

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    for (const [key, value] of entries) {
      const column = key === 'idColumn' ? null : key;
      if (!column) continue;
      conditions.push(`${column} = $${paramIdx++}`);
      params.push(value);
    }

    if (conditions.length === 0 && filters.id) {
      conditions.push(`id = $${paramIdx++}`);
      params.push(filters.id);
    }

    if (conditions.length === 0) {
      throw createError('Invalid filters for delete', 400);
    }

    // User scoping (for user-scoped tables)
    if (USER_SCOPED_TABLES.includes(table)) {
      conditions.push(`user_id = $${paramIdx++}`);
      params.push(userId);
    }

    const sql = `DELETE FROM ${table} WHERE ${conditions.join(' AND ')} RETURNING *`;
    const result = await query(sql, params, jwtPayload);

    if (result.error) {
      throw createError(`Database delete failed: ${result.error}`, 500);
    }

    res.json({ success: true, data: result.data?.[0] || null });
  } catch (error) {
    logger.error('Database POST delete error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Database operation failed'
    });
  }
});

/**
 * POST /api/db/update - Update record by filters (compat with client updateOne)
 * Supported: { table, filters: { id, idColumn? }, data: { ... } }
 */
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const { table, filters, data } = req.body || {};
    const userId = req.user.id;
    const jwtPayload = req.user.jwtPayload || { sub: userId };

    if (!table || typeof table !== 'string') {
      throw createError('Table name is required', 400);
    }
    if (!filters || typeof filters !== 'object') {
      throw createError('Filters object is required', 400);
    }
    if (!data || typeof data !== 'object') {
      throw createError('Data object is required', 400);
    }

    const allowedTables = getAllowedTables();
    if (!allowedTables.includes(table)) {
      throw createError(`Table '${table}' not allowed`, 400);
    }

    // Add updated_at timestamp
    data.updated_at = new Date().toISOString();

    const dataEntries = Object.entries(data);
    if (dataEntries.length === 0) {
      throw createError('No data provided to update', 400);
    }

    // Build UPDATE query
    const setClause = dataEntries.map(([col], idx) => `${col} = $${idx + 1}`).join(', ');
    const values = dataEntries.map(([, val]) => val);
    let paramIdx = values.length + 1;

    // Filter conditions
    const conditions = [];
    const filterParams = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'idColumn') return; // Skip metadata
      conditions.push(`${key} = $${paramIdx++}`);
      filterParams.push(value);
    });

    if (conditions.length === 0) {
      throw createError('At least one filter condition is required', 400);
    }

    // User scoping (for user-scoped tables)
    if (USER_SCOPED_TABLES.includes(table)) {
      conditions.push(`user_id = $${paramIdx++}`);
      filterParams.push(userId);
    }

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${conditions.join(' AND ')} RETURNING *`;
    const params = [...values, ...filterParams];

    const result = await query(sql, params, jwtPayload);

    if (result.error) {
      throw createError(`Database update failed: ${result.error}`, 500);
    }

    // Record audit for update
    try {
      const updated = result.data && result.data[0] ? result.data[0] : null;
      if (updated) {
        await AuditService.recordEvent({
          eventType: 'db_update',
          objectType: table,
          objectId: updated.id,
          actorId: userId,
          endpoint: '/api/db/update',
          ip: req.ip,
          userAgent: req.get('User-Agent') || null,
          data: { updated, filters }
        });
      }
    } catch (auditErr) {
      logger.warn('Failed to record db_update audit', { error: auditErr?.message || auditErr });
    }

    res.json({
      success: true,
      data: result.data[0]
    });

  } catch (error) {
    logger.error('Database POST update error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Database operation failed'
    });
  }
});

/**
 * POST /api/db/:table - Insert new record (legacy signature)
 */
router.post('/:table', authenticateToken, async (req, res) => {
  try {
    const { table } = req.params;
    const payload = req.body;
    const userId = req.user.id;
    const jwtPayload = req.user.jwtPayload || { sub: userId };

    // Validate table name
    const allowedTables = getAllowedTables();

    if (!allowedTables.includes(table)) {
      throw createError(`Table '${table}' not allowed`, 400);
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw createError('Request body must be an object', 400);
    }

    const result = await insertRecord(table, payload, userId, jwtPayload);

    if (result.error) {
      throw createError(`Database insert failed: ${result.error}`, 500);
    }

    // Record audit for update
    try {
      const updated = result.data && result.data[0] ? result.data[0] : null;
      await AuditService.recordEvent({
        eventType: 'db_update',
        objectType: table,
        objectId: updated && updated.id ? updated.id : id,
        actorId: userId,
        endpoint: `/api/db/${table}/${id}`,
        ip: req.ip,
        userAgent: req.get('User-Agent') || null,
        data: { updated }
      });
    } catch (auditErr) {
      logger.warn('Failed to record db_update audit', { error: auditErr?.message || auditErr });
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

    // Record audit for delete
    try {
      const deleted = result.data && result.data[0] ? result.data[0] : null;
      await AuditService.recordEvent({
        eventType: 'db_delete',
        objectType: table,
        objectId: deleted && deleted.id ? deleted.id : id,
        actorId: userId,
        endpoint: `/api/db/${table}/${id}`,
        ip: req.ip,
        userAgent: req.get('User-Agent') || null,
        data: { deleted }
      });
    } catch (auditErr) {
      logger.warn('Failed to record db_delete audit', { error: auditErr?.message || auditErr });
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

    // Record audit for upsert
    try {
      const upserted = result.data && result.data[0] ? result.data[0] : null;
      await AuditService.recordEvent({
        eventType: 'db_upsert',
        objectType: table,
        objectId: upserted && upserted.id ? upserted.id : null,
        actorId: userId,
        endpoint: `/api/db/${table}/upsert`,
        ip: req.ip,
        userAgent: req.get('User-Agent') || null,
        data: { upserted }
      });
    } catch (auditErr) {
      logger.warn('Failed to record db_upsert audit', { error: auditErr?.message || auditErr });
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
