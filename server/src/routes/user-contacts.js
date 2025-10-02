const { Router } = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query, transaction } = require('../database/connection');
const { logger } = require('../utils/logger');

const router = Router();

/**
 * Determine whether the authenticated user can manage the requested profile.
 */
function isAuthorizedUser(requestedUserId, reqUser) {
  if (!requestedUserId || !reqUser) {
    return false;
  }

  const normalizedRequested = String(requestedUserId);
  const authenticatedId = String(reqUser.id);
  const authenticatedEmail = reqUser.email ? String(reqUser.email) : null;
  const role = reqUser.role ? String(reqUser.role).toLowerCase() : null;
  const isSuperuser = reqUser.jwtPayload?.is_superuser === true;
  const tokenRoles = Array.isArray(reqUser.jwtPayload?.roles)
    ? reqUser.jwtPayload.roles.map(r => String(r).toLowerCase())
    : [];

  if (isSuperuser || tokenRoles.includes('admin') || tokenRoles.includes('owner')) {
    return true;
  }

  if (role && ['owner', 'admin'].includes(role)) {
    return true;
  }

  return (
    normalizedRequested === authenticatedId ||
    (authenticatedEmail && normalizedRequested.toLowerCase() === authenticatedEmail.toLowerCase())
  );
}

function normalizeEmail(email) {
  return email?.trim().toLowerCase() || '';
}

function normalizePhone(phone) {
  return phone?.trim() || '';
}

function buildEmailRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    email: row.email,
    label: row.label,
    is_primary: row.is_primary,
    is_shared: row.is_shared,
    verified: row.verified,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function buildPhoneRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    phone_number: row.phone_number,
    label: row.label,
    is_primary: row.is_primary,
    verified: row.verified,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

router.use(authenticateToken);

router.get('/:userId/emails', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isAuthorizedUser(userId, req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: user mismatch',
      });
    }

    const result = await query(
      `SELECT id, user_id, email, label, is_primary, is_shared, verified, created_at, updated_at
       FROM user_contact_emails
       WHERE user_id = $1
       ORDER BY is_primary DESC, created_at DESC`,
      [userId],
      req.user.jwtPayload || { sub: req.user.id }
    );

    if (result.error) {
      logger.error('Failed to load user contact emails', { userId, error: result.error });
      return res.status(500).json({ success: false, error: 'Failed to load emails' });
    }

    const emails = (result.data || []).map(buildEmailRow);
    return res.json({ success: true, data: emails });
  } catch (error) {
    logger.error('Unhandled error fetching user contact emails', { error });
    return res.status(500).json({ success: false, error: 'Failed to load emails' });
  }
});

router.post('/:userId/emails', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, label = null, is_primary = false, is_shared = false, verified = false } = req.body || {};

    if (!isAuthorizedUser(userId, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied: user mismatch' });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const payload = req.user.jwtPayload || { sub: req.user.id };

    const inserted = await transaction(async (client) => {
      if (is_primary) {
        await client.query(
          'UPDATE user_contact_emails SET is_primary = false WHERE user_id = $1',
          [userId]
        );
      }

      const insertResult = await client.query(
        `INSERT INTO user_contact_emails (user_id, email, label, is_primary, is_shared, verified)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id, email, label, is_primary, is_shared, verified, created_at, updated_at`,
        [userId, normalizedEmail, label, !!is_primary, !!is_shared, !!verified]
      );

      return insertResult.rows[0];
    }, payload);

    if (inserted.error) {
      logger.error('Failed to insert user contact email', { userId, email: normalizedEmail, error: inserted.error });

      const isUniqueViolation = inserted.error.includes('duplicate key value');
      const message = isUniqueViolation ? 'Email already exists for this user' : 'Failed to add email';
      return res.status(isUniqueViolation ? 409 : 500).json({ success: false, error: message });
    }

    return res.status(201).json({ success: true, data: buildEmailRow(inserted.data) });
  } catch (error) {
    logger.error('Unhandled error creating user contact email', { error });
    return res.status(500).json({ success: false, error: 'Failed to add email' });
  }
});

router.put('/:userId/emails/:emailId', async (req, res) => {
  try {
    const { userId, emailId } = req.params;
    const { email, label, is_primary, is_shared, verified } = req.body || {};

    if (!isAuthorizedUser(userId, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied: user mismatch' });
    }

    const payload = req.user.jwtPayload || { sub: req.user.id };

    const existing = await query(
      `SELECT id, user_id, email, label, is_primary, is_shared, verified, created_at, updated_at
       FROM user_contact_emails
       WHERE user_id = $1 AND id = $2`,
      [userId, emailId],
      payload
    );

    if (existing.error) {
      logger.error('Failed to load email before update', { userId, emailId, error: existing.error });
      return res.status(500).json({ success: false, error: 'Failed to update email' });
    }

    if (!existing.data || existing.data.length === 0) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    const updates = [];
    const params = [];

    if (email !== undefined) {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        return res.status(400).json({ success: false, error: 'Email must not be empty' });
      }
      updates.push(`email = $${updates.length + 1}`);
      params.push(normalizedEmail);
    }

    if (label !== undefined) {
      updates.push(`label = $${updates.length + 1}`);
      params.push(label);
    }

    if (is_shared !== undefined) {
      updates.push(`is_shared = $${updates.length + 1}`);
      params.push(!!is_shared);
    }

    if (verified !== undefined) {
      updates.push(`verified = $${updates.length + 1}`);
      params.push(!!verified);
    }

    const shouldUpdatePrimary = is_primary !== undefined;

    const result = await transaction(async (client) => {
      if (shouldUpdatePrimary && !!is_primary) {
        await client.query(
          'UPDATE user_contact_emails SET is_primary = false WHERE user_id = $1',
          [userId]
        );
      }

      if (shouldUpdatePrimary) {
        updates.push(`is_primary = $${updates.length + 1}`);
        params.push(!!is_primary);
      }

      if (updates.length === 0) {
        return existing.data[0];
      }

      const updateSql = `UPDATE user_contact_emails
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${updates.length + 1} AND user_id = $${updates.length + 2}
        RETURNING id, user_id, email, label, is_primary, is_shared, verified, created_at, updated_at`;

      const updateParams = [...params, emailId, userId];
      const updateResult = await client.query(updateSql, updateParams);
      return updateResult.rows[0];
    }, payload);

    if (result.error) {
      logger.error('Failed to update user contact email', { userId, emailId, error: result.error });
      const isUniqueViolation = result.error.includes('duplicate key value');
      const message = isUniqueViolation ? 'Email already exists for this user' : 'Failed to update email';
      return res.status(isUniqueViolation ? 409 : 500).json({ success: false, error: message });
    }

    return res.json({ success: true, data: buildEmailRow(result.data) });
  } catch (error) {
    logger.error('Unhandled error updating user contact email', { error });
    return res.status(500).json({ success: false, error: 'Failed to update email' });
  }
});

router.delete('/:userId/emails/:emailId', async (req, res) => {
  try {
    const { userId, emailId } = req.params;

    if (!isAuthorizedUser(userId, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied: user mismatch' });
    }

    const payload = req.user.jwtPayload || { sub: req.user.id };

    const result = await query(
      'DELETE FROM user_contact_emails WHERE id = $1 AND user_id = $2 RETURNING id',
      [emailId, userId],
      payload
    );

    if (result.error) {
      logger.error('Failed to delete user contact email', { userId, emailId, error: result.error });
      return res.status(500).json({ success: false, error: 'Failed to delete email' });
    }

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error('Unhandled error deleting user contact email', { error });
    return res.status(500).json({ success: false, error: 'Failed to delete email' });
  }
});

router.get('/:userId/phones', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isAuthorizedUser(userId, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied: user mismatch' });
    }

    const result = await query(
      `SELECT id, user_id, phone_number, label, is_primary, verified, created_at, updated_at
       FROM user_contact_phones
       WHERE user_id = $1
       ORDER BY is_primary DESC, created_at DESC`,
      [userId],
      req.user.jwtPayload || { sub: req.user.id }
    );

    if (result.error) {
      logger.error('Failed to load user contact phones', { userId, error: result.error });
      return res.status(500).json({ success: false, error: 'Failed to load phones' });
    }

    const phones = (result.data || []).map(buildPhoneRow);
    return res.json({ success: true, data: phones });
  } catch (error) {
    logger.error('Unhandled error fetching user contact phones', { error });
    return res.status(500).json({ success: false, error: 'Failed to load phones' });
  }
});

router.post('/:userId/phones', async (req, res) => {
  try {
    const { userId } = req.params;
    const { phone, label = null, is_primary = false, verified = false } = req.body || {};

    if (!isAuthorizedUser(userId, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied: user mismatch' });
    }

    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const payload = req.user.jwtPayload || { sub: req.user.id };

    const inserted = await transaction(async (client) => {
      if (is_primary) {
        await client.query(
          'UPDATE user_contact_phones SET is_primary = false WHERE user_id = $1',
          [userId]
        );
      }

      const insertResult = await client.query(
        `INSERT INTO user_contact_phones (user_id, phone_number, label, is_primary, verified)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, phone_number, label, is_primary, verified, created_at, updated_at`,
        [userId, normalizedPhone, label, !!is_primary, !!verified]
      );

      return insertResult.rows[0];
    }, payload);

    if (inserted.error) {
      logger.error('Failed to insert user contact phone', { userId, phone: normalizedPhone, error: inserted.error });
      const isUniqueViolation = inserted.error.includes('duplicate key value');
      const message = isUniqueViolation ? 'Phone already exists for this user' : 'Failed to add phone';
      return res.status(isUniqueViolation ? 409 : 500).json({ success: false, error: message });
    }

    return res.status(201).json({ success: true, data: buildPhoneRow(inserted.data) });
  } catch (error) {
    logger.error('Unhandled error creating user contact phone', { error });
    return res.status(500).json({ success: false, error: 'Failed to add phone' });
  }
});

router.put('/:userId/phones/:phoneId', async (req, res) => {
  try {
    const { userId, phoneId } = req.params;
    const { phone, label, is_primary, verified } = req.body || {};

    if (!isAuthorizedUser(userId, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied: user mismatch' });
    }

    const payload = req.user.jwtPayload || { sub: req.user.id };

    const existing = await query(
      `SELECT id, user_id, phone_number, label, is_primary, verified, created_at, updated_at
       FROM user_contact_phones
       WHERE user_id = $1 AND id = $2`,
      [userId, phoneId],
      payload
    );

    if (existing.error) {
      logger.error('Failed to load phone before update', { userId, phoneId, error: existing.error });
      return res.status(500).json({ success: false, error: 'Failed to update phone' });
    }

    if (!existing.data || existing.data.length === 0) {
      return res.status(404).json({ success: false, error: 'Phone not found' });
    }

    const updates = [];
    const params = [];

    if (phone !== undefined) {
      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) {
        return res.status(400).json({ success: false, error: 'Phone number must not be empty' });
      }
      updates.push(`phone_number = $${updates.length + 1}`);
      params.push(normalizedPhone);
    }

    if (label !== undefined) {
      updates.push(`label = $${updates.length + 1}`);
      params.push(label);
    }

    if (verified !== undefined) {
      updates.push(`verified = $${updates.length + 1}`);
      params.push(!!verified);
    }

    const shouldUpdatePrimary = is_primary !== undefined;

    const result = await transaction(async (client) => {
      if (shouldUpdatePrimary && !!is_primary) {
        await client.query(
          'UPDATE user_contact_phones SET is_primary = false WHERE user_id = $1',
          [userId]
        );
      }

      if (shouldUpdatePrimary) {
        updates.push(`is_primary = $${updates.length + 1}`);
        params.push(!!is_primary);
      }

      if (updates.length === 0) {
        return existing.data[0];
      }

      const updateSql = `UPDATE user_contact_phones
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${updates.length + 1} AND user_id = $${updates.length + 2}
        RETURNING id, user_id, phone_number, label, is_primary, verified, created_at, updated_at`;

      const updateParams = [...params, phoneId, userId];
      const updateResult = await client.query(updateSql, updateParams);
      return updateResult.rows[0];
    }, payload);

    if (result.error) {
      logger.error('Failed to update user contact phone', { userId, phoneId, error: result.error });
      const isUniqueViolation = result.error.includes('duplicate key value');
      const message = isUniqueViolation ? 'Phone already exists for this user' : 'Failed to update phone';
      return res.status(isUniqueViolation ? 409 : 500).json({ success: false, error: message });
    }

    return res.json({ success: true, data: buildPhoneRow(result.data) });
  } catch (error) {
    logger.error('Unhandled error updating user contact phone', { error });
    return res.status(500).json({ success: false, error: 'Failed to update phone' });
  }
});

router.delete('/:userId/phones/:phoneId', async (req, res) => {
  try {
    const { userId, phoneId } = req.params;

    if (!isAuthorizedUser(userId, req.user)) {
      return res.status(403).json({ success: false, error: 'Access denied: user mismatch' });
    }

    const payload = req.user.jwtPayload || { sub: req.user.id };

    const result = await query(
      'DELETE FROM user_contact_phones WHERE id = $1 AND user_id = $2 RETURNING id',
      [phoneId, userId],
      payload
    );

    if (result.error) {
      logger.error('Failed to delete user contact phone', { userId, phoneId, error: result.error });
      return res.status(500).json({ success: false, error: 'Failed to delete phone' });
    }

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ success: false, error: 'Phone not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error('Unhandled error deleting user contact phone', { error });
    return res.status(500).json({ success: false, error: 'Failed to delete phone' });
  }
});

module.exports = router;
