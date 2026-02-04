const { v4: uuidv4 } = require('uuid');
const { getPool, setJWTClaims } = require('../database/connection');
const { logger } = require('../utils/logger');

async function ensureAuditTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ops_audit_log (
      id uuid PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      actor_user_id text,
      actor_email text,
      action text NOT NULL,
      target_type text NOT NULL,
      target_uuid text,
      target_name text,
      request jsonb,
      result jsonb
    );
  `);
}

async function writeAuditEvent({
  actor,
  jwtPayload,
  action,
  target,
  request,
  result
}) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await setJWTClaims(client, jwtPayload);
    await ensureAuditTable(client);

    const id = uuidv4();

    await client.query(
      `
      INSERT INTO ops_audit_log (
        id,
        actor_user_id,
        actor_email,
        action,
        target_type,
        target_uuid,
        target_name,
        request,
        result
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        id,
        actor?.id || null,
        actor?.email || null,
        action,
        target?.type || 'unknown',
        target?.uuid || null,
        target?.name || null,
        request ? JSON.stringify(request) : null,
        result ? JSON.stringify(result) : null
      ]
    );

    return { success: true, id };
  } catch (error) {
    logger.warn('Failed to write ops audit event', { error: error.message, action, target });
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

async function listAuditEvents({ limit = 50 } = {}) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await ensureAuditTable(client);
    const res = await client.query(
      `
      SELECT id, created_at, actor_user_id, actor_email, action, target_type, target_uuid, target_name, request, result
      FROM ops_audit_log
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit]
    );
    return { success: true, data: res.rows };
  } catch (error) {
    logger.warn('Failed to list ops audit events', { error: error.message });
    return { success: false, error: error.message, data: [] };
  } finally {
    client.release();
  }
}

module.exports = {
  writeAuditEvent,
  listAuditEvents
};
