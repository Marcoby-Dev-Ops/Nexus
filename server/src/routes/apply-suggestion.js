const express = require('express');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');

const AuditService = require('../services/AuditService');
const router = express.Router();

// Allowed fields per targetType
const ALLOWED_FIELDS = {
  companies: [ 'name', 'domain', 'industry', 'size', 'description', 'website', 'logo_url', 'address', 'contact_info' ],
  identities: [ 'first_name', 'last_name', 'display_name', 'email', 'phone', 'title' ]
};

/** POST /api/apply-suggestion
 * Body: { sourceMessageId, targetType, targetId, suggestedChanges: [{field, new}], confidence, notes }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sourceMessageId, targetType, targetId, suggestedChanges, confidence, notes } = req.body;

    logger.info('Apply suggestion request', { userId, sourceMessageId, targetType, targetId });

    if (!sourceMessageId || !targetType || !targetId || !Array.isArray(suggestedChanges)) {
      throw createError('Invalid suggestion payload', 400);
    }

    const allowed = ALLOWED_FIELDS[targetType];
    if (!allowed) {
      throw createError('Unsupported targetType', 400);
    }

    // Filter and build update object
    const updates = {};
    for (const ch of suggestedChanges) {
      if (!ch.field || typeof ch.new === 'undefined') continue;
      if (!allowed.includes(ch.field)) {
        // ignore non-whitelisted fields
        continue;
      }
      updates[ch.field] = ch.new;
    }

    if (Object.keys(updates).length === 0) {
      throw createError('No valid fields to update', 400);
    }

    // Fetch existing record
    const selectSql = `SELECT * FROM ${targetType} WHERE id = $1`;
    const existing = await query(selectSql, [targetId]);
    if (existing.error) throw createError(`Failed to fetch target: ${existing.error}`, 500);
    if (!existing.data || existing.data.length === 0) throw createError('Target not found', 404);
    const before = existing.data[0];

    // Build update statement
    const fields = [];
    const params = [];
    let i = 1;
    for (const [k, v] of Object.entries(updates)) {
      fields.push(`${k} = $${i}`);
      params.push(typeof v === 'object' ? JSON.stringify(v) : v);
      i++;
    }
    params.push(targetId);

    const updateSql = `UPDATE ${targetType} SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;

    // Start DB actions: insert audit and update
    const auditSql = `INSERT INTO suggestions_audit (source_message_id, target_type, target_id, user_id, suggested_changes, before_snapshot, confidence, notes, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'applied') RETURNING id`;

    // Execute update
    const updateResult = await query(updateSql, params);
    if (updateResult.error) throw createError(`Failed to update target: ${updateResult.error}`, 500);
    const after = updateResult.data[0];

    // Insert audit record
    const auditParams = [sourceMessageId, targetType, targetId, userId, JSON.stringify(suggestedChanges), JSON.stringify(before), confidence || null, notes || null];
    const auditResult = await query(auditSql, auditParams);
    if (auditResult.error) throw createError(`Failed to write audit: ${auditResult.error}`, 500);

    // Record platform audit event for applied suggestion
    try {
      await AuditService.recordEvent({
        eventType: 'apply_suggestion',
        objectType: targetType,
        objectId: targetId,
        actorId: userId,
        endpoint: '/api/apply-suggestion',
        data: {
          sourceMessageId,
          suggestedChanges,
          before,
          after,
          suggestionsAuditId: auditResult.data[0].id
        }
      });
    } catch (auditErr) {
      logger.warn('Failed to record platform audit for apply-suggestion', { error: auditErr?.message || auditErr });
    }

    res.json({ success: true, data: after, auditId: auditResult.data[0].id });

  } catch (error) {
    logger.error('Apply suggestion error:', error);
    res.status(error.status || 500).json({ success: false, error: error.message || 'Failed to apply suggestion' });
  }
});

module.exports = router;
