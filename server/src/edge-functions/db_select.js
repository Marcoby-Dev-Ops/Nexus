const { query } = require('../database/connection');
const { createError } = require('../middleware/errorHandler');

const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const ALLOWED_TABLES = new Set([
  // AI & Chat Tables
  'ai_conversations', 'ai_expert_prompts', 'ai_experts', 'ai_memories', 'ai_messages', 'ai_message_attachments',
  'chat_usage_tracking',

  // Business & Organization Tables
  'building_blocks', 'business_health_snapshots', 'companies', 'company_members', 'identities',
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

  // Legacy/Compatibility Tables
  'tasks', 'thoughts', 'documents', 'business_metrics', 'user_activities',
  'next_best_actions', 'user_action_executions', 'ai_models',
  'analytics_events', 'callback_events', 'user_onboarding_steps',
  'user_onboarding_completions', 'user_onboarding_phases', 'insight_feedback', 'initiative_acceptances',
  'quantum_business_profiles', 'ai_action_card_templates', 'user_contexts',
  'ai_agents', 'user_licenses', 'company_intelligence_profiles'
]);

const USER_SCOPED_TABLES = new Set([
  'user_profiles',
  'user_preferences',
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
  'user_contexts',
  'ai_conversations',
  'ai_messages'
]);

function assertIdentifier(name, type = 'column') {
  if (!VALID_IDENTIFIER.test(name)) {
    throw createError(`Invalid ${type} identifier: ${name}`, 400);
  }
  return name;
}

function buildSelectColumns(columns) {
  if (!columns) {
    return '*';
  }

  if (Array.isArray(columns)) {
    if (columns.length === 0) {
      return '*';
    }
    return columns.map(col => assertIdentifier(col)).join(', ');
  }

  if (typeof columns === 'string') {
    return columns;
  }

  throw createError('Invalid columns parameter', 400);
}

function buildWhereClause(where = {}, params = [], userId) {
  const conditions = [];
  let paramIndex = params.length + 1;

  if (where && typeof where === 'object' && !Array.isArray(where)) {
    Object.entries(where).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      assertIdentifier(key);

      if (Array.isArray(value)) {
        const placeholders = value.map((_, idx) => `$${paramIndex + idx}`);
        conditions.push(`${key} = ANY(ARRAY[${placeholders.join(', ')}])`);
        params.push(...value);
        paramIndex += value.length;
      } else {
        conditions.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex += 1;
      }
    });
  }

  if (conditions.length === 0) {
    return { clause: '', params };
  }

  const clause = ` WHERE ${conditions.join(' AND ')}`;
  return { clause, params };
}

function applyUserScope(table, clauseInfo, userId) {
  if (!userId || !USER_SCOPED_TABLES.has(table)) {
    return clauseInfo;
  }

  const { clause, params } = clauseInfo;
  const paramIndex = params.length + 1;
  const userCondition = `user_id = $${paramIndex}`;

  const newClause = clause ? `${clause} AND ${userCondition}` : ` WHERE ${userCondition}`;
  return {
    clause: newClause,
    params: [...params, userId]
  };
}

function buildOrderBy(orderBy) {
  if (!orderBy) {
    return '';
  }

  const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
  const parts = clauses
    .map(entry => {
      if (!entry) return null;

      if (typeof entry === 'string') {
        const [column, dir] = entry.split('.');
        const direction = (dir || 'ASC').toUpperCase();
        assertIdentifier(column);
        return `${column} ${direction === 'DESC' ? 'DESC' : 'ASC'}`;
      }

      if (typeof entry === 'object') {
        const column = assertIdentifier(entry.column);
        const direction = (entry.direction || entry.ascending === false ? 'DESC' : 'ASC').toUpperCase();
        return `${column} ${direction === 'DESC' ? 'DESC' : 'ASC'}`;
      }

      return null;
    })
    .filter(Boolean);

  if (!parts.length) {
    return '';
  }

  return ` ORDER BY ${parts.join(', ')}`;
}

async function dbSelect(payload = {}, user = {}) {
  const { table, columns, where, limit = 100, offset = 0, orderBy } = payload;

  if (!table || typeof table !== 'string') {
    throw createError("'table' parameter is required", 400);
  }

  if (!ALLOWED_TABLES.has(table)) {
    throw createError(`Table '${table}' not allowed`, 400);
  }

  const selectColumns = buildSelectColumns(columns);
  let params = [];

  const whereInfo = buildWhereClause(where, params, user?.id);
  const scopedWhere = applyUserScope(table, whereInfo, user?.id);
  params = scopedWhere.params;

  let sql = `SELECT ${selectColumns} FROM ${table}${scopedWhere.clause}`;

  sql += buildOrderBy(orderBy);

  if (limit) {
    params.push(limit);
    sql += ` LIMIT $${params.length}`;
  }

  if (offset) {
    params.push(offset);
    sql += ` OFFSET $${params.length}`;
  }

  const jwtPayload = user?.jwtPayload || (user?.id ? { sub: user.id } : null);
  const result = await query(sql, params, jwtPayload);

  if (result.error) {
    throw createError(result.error, 500);
  }

  return {
    success: true,
    data: result.data || [],
    count: result.rowCount || 0
  };
}

module.exports = dbSelect;
