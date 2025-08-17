const { Router } = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { query } = require('../database/connection');

const router = Router();

// GET /api/auth/test - Test authentication without requiring token
router.get('/test', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    // Try to validate the token
    try {
      const validation = require('../middleware/auth').validateJWTToken(token);
      return res.status(200).json({
        success: true,
        data: {
          message: 'Token is valid',
          externalUserId: validation.externalUserId
        }
      });
    } catch (validationError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        details: validationError.message
      });
    }
  } catch (error) {
    logger.error('Error in auth test API', { error });
    return res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// GET /api/auth/session-info - Get session information for debugging
router.get('/session-info', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    // Try to validate the token and get user info
    try {
      const validation = require('../middleware/auth').validateJWTToken(token);
      
      // Get user mapping from user_mappings (single source of truth)
      const mappingQuery = `
        SELECT internal_user_id 
        FROM user_mappings 
        WHERE external_user_id = $1
      `;
      
      const { data: mappings, error: mappingError } = await query(mappingQuery, [validation.externalUserId]);
      
      if (mappingError) {
        logger.error('Failed to fetch user mapping', { error: mappingError, externalUserId: validation.externalUserId });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          message: 'Token is valid',
          externalUserId: validation.externalUserId,
          internalUserId: mappings?.[0]?.internal_user_id || null,
          hasMapping: mappings && mappings.length > 0,
          mappingError: mappingError || null
        }
      });
    } catch (validationError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        details: validationError.message
      });
    }
  } catch (error) {
    logger.error('Error in session info API', { error });
    return res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// GET /api/auth/user-mapping - Get internal user ID for authenticated user
router.get('/user-mapping', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const externalUserId = req.user.externalId; // This is the external ID from the token

    // Get the internal user ID from user_mappings (single source of truth)
    const mappingQuery = `
      SELECT internal_user_id 
      FROM user_mappings 
      WHERE external_user_id = $1
    `;
    
    const { data: mappings, error: mappingError } = await query(mappingQuery, [externalUserId]);
    
    if (mappingError) {
      logger.error('Failed to fetch user mapping', { error: mappingError, externalUserId });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user mapping'
      });
    }
    
    if (!mappings || mappings.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User mapping not found'
      });
    }

    const internalUserId = mappings[0].internal_user_id;

    // Check if user profile exists
    const profileQuery = `
      SELECT id FROM user_profiles WHERE user_id = $1
    `;
    const { data: profile, error: profileError } = await query(profileQuery, [internalUserId]);
    
    if (profileError) {
      logger.error('Failed to check user profile', { error: profileError, internalUserId });
    }
    
    const profileExists = profile && profile.length > 0;

    logger.info('Retrieved user mapping', { 
      externalUserId, 
      internalUserId,
      profileExists
    });

    return res.status(200).json({
      success: true,
      data: {
        externalUserId,
        internalUserId,
        profileExists
      }
    });
  } catch (error) {
    logger.error('Error in user mapping API', { error });
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

module.exports = router;
