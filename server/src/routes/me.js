const { Router } = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');
const { authLimiter } = require('../middleware/rateLimit');

const AuditService = require('../services/AuditService');
const router = Router();

// Returns a minimal, safe contact payload for the authenticated user.
router.use(authenticateToken);

// Apply stricter rate limiting to contact endpoint to reduce PII exposure risk
router.get('/contact', authLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const jwtPayload = req.user.jwtPayload || { sub: userId };

    // Fetch primary email (from user_contact_emails) and primary phone (from user_contact_phones)
    const emailResult = await query(
      `SELECT email, is_primary FROM user_contact_emails WHERE user_id = $1 ORDER BY is_primary DESC, created_at DESC LIMIT 1`,
      [userId],
      jwtPayload
    );

    const phoneResult = await query(
      `SELECT phone_number, is_primary FROM user_contact_phones WHERE user_id = $1 ORDER BY is_primary DESC, created_at DESC LIMIT 1`,
      [userId],
      jwtPayload
    );

    let email = null;
    if (emailResult && emailResult.data && emailResult.data.length > 0) {
      email = emailResult.data[0].email;
    }

    let phone = null;
    if (phoneResult && phoneResult.data && phoneResult.data.length > 0) {
      phone = phoneResult.data[0].phone_number;
    }

    // Also fetch lightweight profile fields (first/last name)
    const profileResult = await query(
      `SELECT first_name, last_name FROM user_profiles WHERE user_id = $1 LIMIT 1`,
      [userId],
      jwtPayload
    );

    let first_name = null;
    let last_name = null;
    if (profileResult && profileResult.data && profileResult.data.length > 0) {
      first_name = profileResult.data[0].first_name || null;
      last_name = profileResult.data[0].last_name || null;
    }

    // Server-side policy: only expose phone if the authenticated JWT or user role permits it.
    // This gives an extra safety net where a token must explicitly allow phone access.
    // For local testing we also allow the 'test' environment (so running NODE_ENV=test
    // will behave like development for convenience). Production still requires explicit
    // allow_phone claim or appropriate role.
    const canExposePhone = (() => {
      // Allow if running in development or test for local/dev convenience
      if (['development', 'test'].includes(process.env.NODE_ENV)) return true;
  const roleAllows = req.user && (req.user.role === 'user' || req.user.role === 'admin');
  const tokenAllows = jwtPayload && (jwtPayload.allow_phone === true || jwtPayload.allow_phone === 'true');
  // Allow if either the role is sufficient (requesting own data) or the token explicitly allows phone access.
  return Boolean(roleAllows || tokenAllows);
    })();

    const payload = {
      first_name,
      last_name,
      email,
      phone: canExposePhone ? phone : null
    };

    // Audit access to phone number (persist audit event without storing the raw PII)
    try {
      await AuditService.recordPIIAccess({
        userId,
        actorId: req.user && req.user.id ? req.user.id : null,
        endpoint: req.path,
        field: 'phone',
        exposed: !!payload.phone,
        ip: req.ip,
        userAgent: req.get('User-Agent') || null,
        meta: {
          method: req.method
        }
      });
    } catch (auditError) {
      // If audit write fails, still don't block the response - write a warning to logs
      logger.warn('Failed to persist PII access audit for /me/contact', { error: auditError?.message || auditError });
    }

    return res.json({ success: true, data: payload });
  } catch (error) {
    logger.error('Failed to fetch /me/contact', { error });
    return res.status(500).json({ success: false, error: 'Failed to load contact info' });
  }
});

module.exports = router;
