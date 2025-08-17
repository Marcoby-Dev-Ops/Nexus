const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { query } = require('../database/connection');

const router = express.Router();

// POST /api/rpc/test/:functionName - Test RPC function without authentication
router.post('/test/:functionName', async (req, res) => {
  try {
    const { functionName } = req.params;
    const params = req.body;

    logger.info('Calling test RPC function', { functionName, params });

    // Build the function call based on the function name and parameters
    let queryText;
    let queryParams = [];

    switch (functionName) {
      case 'ensure_user_profile':
        if (!params.user_id) {
          throw createError('user_id parameter is required', 400);
        }
        
        // Step 1: Get internal user ID from user_mappings (Authentik → Nexus mapping)
        const userMappingQuery = 'SELECT internal_user_id FROM user_mappings WHERE external_user_id = $1';
        const { data: userMappings, error: userMappingError } = await query(userMappingQuery, [params.user_id]);
        
        if (userMappingError) {
          logger.error('Failed to get user mapping from user_mappings', { 
            error: userMappingError, 
            externalUserId: params.user_id 
          });
          throw createError(`Failed to get user mapping: ${userMappingError}`, 500);
        }
        
        if (!userMappings || userMappings.length === 0) {
          throw createError('User mapping not found in user_mappings table', 404);
        }
        
        const internalUserId = userMappings[0].internal_user_id;
        logger.info('Found user mapping in user_mappings table', { externalUserId: params.user_id, internalUserId });
        
        // Step 2: Check if profile exists
        const profileCheckQuery = 'SELECT * FROM user_profiles WHERE user_id = $1';
        const { data: existingProfiles, error: profileCheckError } = await query(profileCheckQuery, [internalUserId]);
        
        if (profileCheckError) {
          logger.error('Failed to check user profile', { error: profileCheckError, internalUserId });
          throw createError(`Failed to check user profile: ${profileCheckError}`, 500);
        }
        
        let profileData;
        
        if (existingProfiles && existingProfiles.length > 0) {
          // Profile exists, return it
          profileData = existingProfiles[0];
        } else {
          // Profile doesn't exist, create it
          const createProfileQuery = `
            INSERT INTO user_profiles (user_id, created_at, updated_at)
            VALUES ($1, NOW(), NOW())
            RETURNING *
          `;
          const { data: newProfiles, error: createError } = await query(createProfileQuery, [internalUserId]);
          
          if (createError) {
            logger.error('Failed to create user profile', { error: createError, internalUserId });
            throw createError(`Failed to create user profile: ${createError}`, 500);
          }
          
          if (!newProfiles || newProfiles.length === 0) {
            throw createError('Failed to create user profile', 500);
          }
          
          profileData = newProfiles[0];
        }
        
        logger.info('User profile ensured successfully', { externalUserId: params.user_id, internalUserId, profileId: profileData.id });
        
        res.json({
          success: true,
          data: [profileData]
        });
        return;
      
      case 'get_user_profile':
        if (!params.user_id) {
          throw createError('user_id parameter is required', 400);
        }
        queryText = 'SELECT get_user_profile($1)';
        queryParams = [params.user_id];
        break;
      
      case 'get_required_onboarding_steps':
        queryText = 'SELECT get_required_onboarding_steps()';
        queryParams = [];
        break;
      
      default:
        throw createError(`Unsupported RPC function: ${functionName}`, 400);
    }

    // Only execute query for non-ensure_user_profile functions
    if (functionName !== 'ensure_user_profile') {
      const { data, error } = await query(queryText, queryParams);

      if (error) {
        logger.error('RPC function error', { functionName, error, params });
        throw createError(`RPC error: ${error}`, 400);
      }

      logger.info('RPC function completed successfully', { functionName, params });

      res.json({
        success: true,
        data
      });
    }
  } catch (error) {
    logger.error('Error in test RPC route', { error: error.message, functionName: req.params.functionName });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/rpc/:functionName - Call RPC function
router.post('/:functionName', authenticateToken, async (req, res) => {
  try {
    const { functionName } = req.params;
    const params = req.body;

    logger.info('Calling RPC function', { functionName, params });

    // Build the function call based on the function name and parameters
    let queryText;
    let queryParams = [];

    switch (functionName) {
      case 'ensure_user_profile':
        if (!params.user_id) {
          throw createError('user_id parameter is required', 400);
        }
        
        // Step 1: Get internal user ID from user_mappings (Authentik → Nexus mapping)
        const userMappingQuery = 'SELECT internal_user_id FROM user_mappings WHERE external_user_id = $1';
        const { data: userMappings, error: userMappingError } = await query(userMappingQuery, [params.user_id]);
        
        if (userMappingError) {
          logger.error('Failed to get user mapping from user_mappings', { 
            error: userMappingError, 
            externalUserId: params.user_id 
          });
          throw createError(`Failed to get user mapping: ${userMappingError}`, 500);
        }
        
        if (!userMappings || userMappings.length === 0) {
          throw createError('User mapping not found in user_mappings table', 404);
        }
        
        const internalUserId = userMappings[0].internal_user_id;
        logger.info('Found user mapping in user_mappings table', { externalUserId: params.user_id, internalUserId });
        
        // Step 2: Check if profile exists
        const profileCheckQuery = 'SELECT * FROM user_profiles WHERE user_id = $1';
        const { data: existingProfiles, error: profileCheckError } = await query(profileCheckQuery, [internalUserId]);
        
        if (profileCheckError) {
          logger.error('Failed to check user profile', { error: profileCheckError, internalUserId });
          throw createError(`Failed to check user profile: ${profileCheckError}`, 500);
        }
        
        let profileData;
        
        if (existingProfiles && existingProfiles.length > 0) {
          // Profile exists, return it
          profileData = existingProfiles[0];
        } else {
          // Profile doesn't exist, create it
          const createProfileQuery = `
            INSERT INTO user_profiles (user_id, created_at, updated_at)
            VALUES ($1, NOW(), NOW())
            RETURNING *
          `;
          const { data: newProfiles, error: createError } = await query(createProfileQuery, [internalUserId]);
          
          if (createError) {
            logger.error('Failed to create user profile', { error: createError, internalUserId });
            throw createError(`Failed to create user profile: ${createError}`, 500);
          }
          
          if (!newProfiles || newProfiles.length === 0) {
            throw createError('Failed to create user profile', 500);
          }
          
          profileData = newProfiles[0];
        }
        
        logger.info('User profile ensured successfully', { externalUserId: params.user_id, internalUserId, profileId: profileData.id });
        
        res.json({
          success: true,
          data: [profileData]
        });
        return;
      
      case 'get_user_profile':
        if (!params.user_id) {
          throw createError('user_id parameter is required', 400);
        }
        queryText = 'SELECT get_user_profile($1)';
        queryParams = [params.user_id];
        break;
      
      case 'get_required_onboarding_steps':
        queryText = 'SELECT get_required_onboarding_steps()';
        queryParams = [];
        break;
      
      default:
        throw createError(`Unsupported RPC function: ${functionName}`, 400);
    }

    // Only execute query for non-ensure_user_profile functions
    if (functionName !== 'ensure_user_profile') {
      const { data, error } = await query(queryText, queryParams);

      if (error) {
        logger.error('RPC function error', { functionName, error, params });
        throw createError(`RPC error: ${error}`, 400);
      }

      logger.info('RPC function completed successfully', { functionName, params });

      res.json({
        success: true,
        data
      });
    }
  } catch (error) {
    logger.error('Error in RPC route', { error: error.message, functionName: req.params.functionName });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

module.exports = router;
