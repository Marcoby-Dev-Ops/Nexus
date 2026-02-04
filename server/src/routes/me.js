const { Router } = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');
const { authLimiter } = require('../middleware/rateLimit');

const AuditService = require('../services/AuditService');
const creditService = require('../../services/CreditService'); // Import CreditService

const router = Router();
router.use(authenticateToken);

/**
 * GET /me
 * Returns the current user's profile information
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const jwtPayload = req.user.jwtPayload || { sub: userId };

    // Fetch user profile
    const profileResult = await query(
      `SELECT
        up.*,
        u.email,
        u.name as auth_name
       FROM user_profiles up
       LEFT JOIN users u ON up.user_id = u.id
       WHERE up.user_id = $1
       LIMIT 1`,
      [userId],
      jwtPayload
    );

    if (!profileResult.data || profileResult.data.length === 0) {
      // Return minimal info if no profile exists yet
      return res.json({
        success: true,
        data: {
          user_id: userId,
          display_name: req.user.name || null,
          email: req.user.email || null
        }
      });
    }

    const profile = profileResult.data[0];
    return res.json({
      success: true,
      data: {
        user_id: profile.user_id,
        display_name: profile.display_name || profile.first_name || profile.auth_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        role: profile.role,
        job_title: profile.job_title,
        preferences: profile.preferences || {},
        company_id: profile.company_id
      }
    });
  } catch (error) {
    logger.error('Failed to fetch /me', { error });
    return res.status(500).json({ success: false, error: 'Failed to load profile' });
  }
});

/**
 * PATCH /me
 * Updates the current user's profile information
 */
router.patch('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const jwtPayload = req.user.jwtPayload || { sub: userId };
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = ['display_name', 'first_name', 'last_name', 'role', 'job_title', 'preferences'];
    const updateParts = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateParts.push(`${key} = $${paramIndex}`);
        values.push(key === 'preferences' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (updateParts.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    values.push(userId);

    // Check if profile exists
    const existsResult = await query(
      `SELECT id FROM user_profiles WHERE user_id = $1`,
      [userId],
      jwtPayload
    );

    let result;
    if (existsResult.data && existsResult.data.length > 0) {
      // Update existing profile
      result = await query(
        `UPDATE user_profiles
         SET ${updateParts.join(', ')}, updated_at = NOW()
         WHERE user_id = $${paramIndex}
         RETURNING *`,
        values,
        jwtPayload
      );
    } else {
      // Create new profile
      const insertFields = ['user_id'];
      const insertValues = [userId];
      const insertPlaceholders = ['$1'];
      let insertIndex = 2;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          insertFields.push(key);
          insertValues.push(key === 'preferences' ? JSON.stringify(value) : value);
          insertPlaceholders.push(`$${insertIndex}`);
          insertIndex++;
        }
      }

      result = await query(
        `INSERT INTO user_profiles (${insertFields.join(', ')})
         VALUES (${insertPlaceholders.join(', ')})
         RETURNING *`,
        insertValues,
        jwtPayload
      );
    }

    if (result.error) {
      throw new Error(result.error);
    }

    logger.info('User profile updated', { userId, fields: Object.keys(updates) });
    return res.json({ success: true, data: result.data[0] });
  } catch (error) {
    logger.error('Failed to update /me', { error });
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

/**
 * GET /me/subscription
 * Returns current plan, credit balance, and capabilities.
 * Used by frontend to gate UI features and show quota.
 * Auto-provisions Explorer plan for new users on first access.
 */
router.get('/subscription', authLimiter, async (req, res) => {
  try {
    let status = await creditService.getUserStatus(req.user.id);

    // If no subscription exists, provision the default Explorer plan
    if (!status?.subscription) {
      await creditService.ensureDefaultSubscription(req.user.id);
      // Re-fetch after provisioning
      status = await creditService.getUserStatus(req.user.id);
    }

    // Default fallback if still no subscription (shouldn't happen after ensure)
    const plan = status?.subscription || {
      name: 'Explorer',
      monthly_credit_allowance: 100,
      features: { tier: 'basic', allowed_models: ['zai/glm-4.7'], capabilities: ['chat', 'search'] }
    };

    const payload = {
      plan_name: plan.plan_name || plan.name,
      balance_cents: status?.balance_cents || 100,
      monthly_allowance: plan.monthly_credit_allowance,
      capabilities: plan.features?.capabilities || ['chat'],
      tier: plan.features?.tier || 'basic',
      can_inference: status?.can_run_inference ?? true // Default to true for new users with credits
    };

    return res.json({ success: true, data: payload });
  } catch (error) {
    logger.error('Failed to fetch subscription', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch subscription status' });
  }
});

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
