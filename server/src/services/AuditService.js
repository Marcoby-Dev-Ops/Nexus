const { query } = require('../database/connection');
const { logger } = require('../utils/logger');

class AuditService {
  /**
   * Record a generic platform audit event.
   * @param {{eventType: string, objectType?: string, objectId?: string, actorId?: string, targetUserId?: string, endpoint?: string, ip?: string, userAgent?: string, data?: object}} opts
   */
  static async recordEvent(opts) {
    const { eventType, objectType = null, objectId = null, actorId = null, targetUserId = null, endpoint = null, ip = null, userAgent = null, data = null } = opts;
    try {
      const sql = `
        INSERT INTO platform_audit (event_type, object_type, object_id, actor_id, target_user_id, endpoint, ip, user_agent, data)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id, created_at
      `;
      const params = [eventType, objectType, objectId, actorId, targetUserId, endpoint, ip, userAgent, data ? JSON.stringify(data) : null];
      const result = await query(sql, params, null);
      if (!result || !result.data || result.data.length === 0) {
        logger.warn('AuditService.recordEvent: insert returned no rows', { eventType, objectType, objectId });
        return null;
      }
      return result.data[0];
    } catch (error) {
      logger.error('AuditService.recordEvent failed', { error: error.message, eventType, objectType, objectId });
      return null;
    }
  }

  /**
   * Record a PII access event to both platform_audit (generic) and pii_access_audit (specialized)
   */
  static async recordPIIAccess(opts) {
    const { userId, actorId = null, endpoint, field, exposed = false, ip = null, userAgent = null, meta = null } = opts;
    try {
      // Generic platform audit
      await AuditService.recordEvent({
        eventType: 'pii_access',
        objectType: 'user_profiles',
        objectId: userId,
        actorId,
        targetUserId: userId,
        endpoint,
        ip,
        userAgent,
        data: { field, exposed, meta }
      });

      // Also insert into dedicated pii_access_audit table for quick queries
      const sql = `
        INSERT INTO pii_access_audit (user_id, actor_id, endpoint, field, exposed, ip, user_agent, meta)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at
      `;
      const params = [userId, actorId, endpoint, field, exposed, ip, userAgent, meta ? JSON.stringify(meta) : null];
      const result = await query(sql, params, null);
      if (!result || !result.data || result.data.length === 0) {
        logger.warn('AuditService: pii insert returned no rows', { userId, endpoint, field });
        return null;
      }
      return result.data[0];
    } catch (error) {
      logger.error('AuditService.recordPIIAccess failed', { error: error.message, userId, endpoint, field });
      return null;
    }
  }
}

module.exports = AuditService;
