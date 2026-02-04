const creditService = require('../services/CreditService.js');
const { logger } = require('../utils/logger');

/**
 * Middleware factory to enforce required capabilities on a route.
 * Usage: router.post('/code', requireCapability('coding'), controller)
 */
function requireCapability(requiredCap) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // System user bypass
      if (userId === '00000000-0000-0000-0000-000000000001') {
        return next();
      }

      const status = await creditService.getUserStatus(userId);
      const caps = status?.subscription?.features?.capabilities || [];

      // Check if user has the specific capability OR 'all'
      if (caps.includes(requiredCap) || caps.includes('all')) {
        return next();
      }

      logger.warn(`Access denied for ${userId}. Required: ${requiredCap}, Has: ${caps.join(',')}`);
      
      return res.status(403).json({ 
        success: false, 
        error: `Plan Upgrade Required: This feature requires the '${requiredCap}' capability.` 
      });

    } catch (err) {
      logger.error('Capability check failed', err);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };
}

module.exports = { requireCapability };
