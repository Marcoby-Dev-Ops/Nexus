const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { query } = require('../database/connection');

const router = express.Router();

/**
 * Middleware to require owner or admin role
 */
async function requireAdmin(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // Check JWT roles first
        const tokenRoles = Array.isArray(req.user?.jwtPayload?.roles)
            ? req.user.jwtPayload.roles.map(role => String(role || '').toLowerCase())
            : [];

        if (tokenRoles.includes('owner') || tokenRoles.includes('admin')) {
            return next();
        }

        // Fallback to database check
        const result = await query(
            'SELECT role FROM user_profiles WHERE user_id = $1 LIMIT 1',
            [userId],
            req.user?.jwtPayload
        );

        if (result.error) {
            logger.error('Failed to verify admin role', { userId, error: result.error });
            return res.status(500).json({ success: false, error: 'Failed to verify permissions' });
        }

        const profileRole = String(result.data?.[0]?.role || '').toLowerCase();
        if (profileRole === 'owner' || profileRole === 'admin') {
            return next();
        }

        return res.status(403).json({ success: false, error: 'Admin or Owner role required' });
    } catch (error) {
        logger.error('Admin check failed', { userId: req.user?.id, error: error.message });
        return res.status(500).json({ success: false, error: 'Permission check failed' });
    }
}

/**
 * GET /api/admin/soul
 * Read the SOUL.md file
 */
router.get('/soul', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const soulPath = path.join(process.cwd(), 'SOUL.md');
        if (!fs.existsSync(soulPath)) {
            return res.json({ success: true, content: '' });
        }

        const content = fs.readFileSync(soulPath, 'utf8');
        res.json({ success: true, content });
    } catch (error) {
        logger.error('Failed to read SOUL.md', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to read agent soul' });
    }
});

/**
 * PUT /api/admin/soul
 * Update the SOUL.md file
 */
router.put('/soul', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { content } = req.body;
        if (typeof content !== 'string') {
            return res.status(400).json({ success: false, error: 'Content must be a string' });
        }

        const soulPath = path.join(process.cwd(), 'SOUL.md');
        fs.writeFileSync(soulPath, content, 'utf8');

        logger.info('SOUL.md updated', { userId: req.user.id });
        res.json({ success: true, message: 'Agent soul updated successfully' });
    } catch (error) {
        logger.error('Failed to update SOUL.md', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to update agent soul' });
    }
});

module.exports = router;
