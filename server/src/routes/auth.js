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
      
      // With Authentik user IDs, the external user ID is the primary key
      // No need for mapping table anymore
      const userId = validation.externalUserId;
      
      return res.status(200).json({
        success: true,
        data: {
          message: 'Token is valid',
          userId: userId,
          hasProfile: true // We'll create profile on demand if needed
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

// GET /api/auth/user-mapping - Get user info for authenticated user
router.get('/user-mapping', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const userId = req.user.externalId; // This is the Authentik user ID

    // Check if user profile exists in user_profiles table
    const profileQuery = `
      SELECT user_id, email, first_name, last_name, display_name 
      FROM user_profiles 
      WHERE user_id = $1
    `;
    const { data: profile, error: profileError } = await query(profileQuery, [userId]);
    
    if (profileError) {
      logger.error('Failed to check user profile', { error: profileError, userId });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user profile'
      });
    }
    
    const profileExists = profile && profile.length > 0;

    logger.info('Retrieved user info', { 
      userId,
      profileExists
    });

    return res.status(200).json({
      success: true,
      data: {
        userId: userId,
        profile: profileExists ? profile[0] : null,
        profileExists: profileExists
      }
    });
  } catch (error) {
    logger.error('Error in user mapping API', { error });
    return res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

module.exports = router;
