const { Router } = require('express');
const { userPreferencesService } = require('../services/user-preferences');
const { logger } = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

// Get user preferences (test endpoint without authentication)
router.get('/test', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    logger.info('Fetching user preferences via test API', { userId });

    const result = await userPreferencesService.get(userId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error fetching user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user preferences'
    });
  }
});

// Get user preferences (temporarily without authentication for testing)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Validate that the authenticated user matches the requested user ID
    // Accept either the Authentik user ID or the user's email
    const authenticatedUserId = req.user.id;
    const authenticatedUserEmail = req.user.email;
    
    const isAuthorized = authenticatedUserId === userId || authenticatedUserEmail === userId;
    
    if (!isAuthorized) {
      logger.warn('User ID mismatch', { 
        authenticatedUserId, 
        authenticatedUserEmail,
        requestedUserId: userId 
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied: User ID mismatch'
      });
    }

    logger.info('Fetching user preferences via API', { userId });

    const result = await userPreferencesService.get(userId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error fetching user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user preferences'
    });
  }
});

// Create or update user preferences (upsert)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.query.userId;
    const preferences = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Validate that the authenticated user matches the requested user ID
    // Accept either the Authentik user ID or the user's email
    const authenticatedUserId = req.user.id;
    const authenticatedUserEmail = req.user.email;
    
    const isAuthorized = authenticatedUserId === userId || authenticatedUserEmail === userId;
    
    if (!isAuthorized) {
      logger.warn('User ID mismatch', { 
        authenticatedUserId, 
        authenticatedUserEmail,
        requestedUserId: userId 
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied: User ID mismatch'
      });
    }

    logger.info('Upserting user preferences via API', { userId, preferences });

    const result = await userPreferencesService.upsert(userId, preferences);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error upserting user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upsert user preferences'
    });
  }
});

// Update user preferences
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.query.userId;
    const updates = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Validate that the authenticated user matches the requested user ID
    // Accept either the Authentik user ID or the user's email
    const authenticatedUserId = req.user.id;
    const authenticatedUserEmail = req.user.email;
    
    const isAuthorized = authenticatedUserId === userId || authenticatedUserEmail === userId;
    
    if (!isAuthorized) {
      logger.warn('User ID mismatch', { 
        authenticatedUserId, 
        authenticatedUserEmail,
        requestedUserId: userId 
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied: User ID mismatch'
      });
    }

    logger.info('Updating user preferences via API', { userId, updates });

    const result = await userPreferencesService.update(userId, updates);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error updating user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user preferences'
    });
  }
});

module.exports = router;
