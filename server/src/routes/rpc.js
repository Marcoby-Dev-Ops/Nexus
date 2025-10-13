const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');
const userProfileService = require('../services/UserProfileService');
const CompanyService = require('../services/CompanyService');

const router = express.Router();
const companyService = new CompanyService();

/**
 * POST /api/rpc/:function - Execute RPC function
 */
router.post('/:function', authenticateToken, async (req, res) => {
  try {
    const { function: functionName } = req.params;
    const params = req.body;
    const userId = req.user.id;

    // Validate function name
    const allowedFunctions = [
      'match_documents',
      'match_thoughts',
      'get_user_profile',
      'ensure_user_profile',
      'get_company_data',
      'get_business_metrics',
      'get_next_best_actions',
      'get_user_integrations',
      'get_required_onboarding_steps',
      'get_business_identity',
      'update_business_identity',
      'ensure_business_identity',
      'get_company_health',
      'monitor_company_health',
      'get_company_ai_context',
      'get_company_next_action',
      'sync_authentik_user_data',
      'force_sync_authentik_user',
      'get_authentik_sync_status'
    ];

    if (!allowedFunctions.includes(functionName)) {
      throw createError(`Function '${functionName}' not allowed`, 400);
    }

    let result;

    switch (functionName) {
      case 'match_documents':
        result = await matchDocuments(params, userId);
        break;
      
      case 'match_thoughts':
        result = await matchThoughts(params, userId);
        break;
      
      case 'get_user_profile':
        result = await getUserProfile(userId);
        break;
      
      case 'ensure_user_profile':
        // Handle both parameter names: user_id (from App.tsx) and external_user_id (from UserService)
        const externalUserId = params.external_user_id || params.user_id || req.user.id;
        
        // Debug logging
        logger.info('ensure_user_profile called', {
          externalUserId,
          reqUserId: req.user?.id,
          reqUserEmail: req.user?.email,
          userExists: !!req.user
        });
        
        // Security check: allow if the target ID matches the authenticated user's ID
        // OR if the target ID is an email that matches the authenticated user's email
        const isDirectMatch = externalUserId === req.user.id;
        const isEmailMatch = externalUserId.includes('@') && req.user.jwtPayload?.email === externalUserId;
        
        if (!isDirectMatch && !isEmailMatch) {
          logger.warn('ensure_user_profile authorization failed', {
            externalUserId,
            reqUserId: req.user?.id,
            reqUserEmail: req.user.jwtPayload?.email,
            isDirectMatch,
            isEmailMatch
          });
          throw createError('Unauthorized: Can only ensure profile for authenticated user', 403);
        }
        
        result = await userProfileService.ensureUserProfile(
          externalUserId,
          req.user.jwtPayload?.email,
          {},
          req.user.jwtPayload
        );
        break;
      
      case 'get_company_data':
        result = await getCompanyData(userId);
        break;
      
      case 'get_business_metrics':
        result = await getBusinessMetrics(userId, params);
        break;
      
      case 'get_next_best_actions':
        result = await getNextBestActions(userId, params);
        break;
      
            case 'get_user_integrations':
        result = await getUserIntegrations(userId);
        break;
      
      case 'get_required_onboarding_steps':
        result = await getRequiredOnboardingSteps();
        break;
      
      case 'get_business_identity':
        const businessIdentityResult = await companyService.getBusinessIdentity(params.companyId, req.user.jwtPayload);
        result = businessIdentityResult.success ? businessIdentityResult.data : null;
        break;
      
      case 'update_business_identity':
        const updateIdentityResult = await companyService.updateBusinessIdentity(params.companyId, params.updates, req.user.jwtPayload);
        result = updateIdentityResult.success ? updateIdentityResult.data : null;
        break;
      
      case 'ensure_business_identity':
        const ensureIdentityResult = await companyService.ensureBusinessIdentity(params.companyId, params.identityData, req.user.jwtPayload);
        result = ensureIdentityResult.success ? ensureIdentityResult.data : null;
        break;
      
      case 'get_company_health':
        const companyHealthResult = await companyService.getCompanyHealth(params.companyId, req.user.jwtPayload);
        result = companyHealthResult.success ? companyHealthResult.data : null;
        break;
      
      case 'monitor_company_health':
        const monitorHealthResult = await companyService.monitorCompanyHealth(params.companyId, req.user.jwtPayload);
        result = monitorHealthResult.success ? monitorHealthResult.data : null;
        break;
      
      case 'get_company_ai_context':
        result = await companyService.getAIContext(params.companyId, req.user.jwtPayload);
        break;
      
      case 'get_company_next_action':
        result = await companyService.getNextAction(params.companyId, req.user.jwtPayload);
        break;
      
      case 'sync_authentik_user_data':
        // Sync user profile and company data from Authentik JWT
        result = await syncAuthentikUserData(params.user_id || userId, req.user.jwtPayload);
        break;
      
      case 'force_sync_authentik_user':
        // Force refresh user profile from Authentik
        result = await forceSyncAuthentikUser(params.user_id || userId, req.user.jwtPayload);
        break;
      
      case 'get_authentik_sync_status':
        // Get sync status for a user
        result = await getAuthentikSyncStatus(params.user_id || userId);
        break;
      
      default:
        throw createError(`Function '${functionName}' not implemented`, 501);
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('RPC function error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'RPC function failed'
    });
  }
});

/**
 * Match documents by vector similarity
 */
async function matchDocuments(params, userId) {
  const { query_embedding, match_count = 5, filter = {} } = params;

  if (!query_embedding || !Array.isArray(query_embedding)) {
    throw createError('query_embedding must be an array of numbers', 400);
  }

  if (match_count < 1 || match_count > 100) {
    throw createError('match_count must be between 1 and 100', 400);
  }

  let sql = `
    SELECT 
      id,
      content,
      metadata,
      1 - (embedding <=> $1) as similarity
    FROM documents 
    WHERE user_id = $2
  `;
  
  const sqlParams = [query_embedding, userId];
  let paramIndex = 3;

  // Add additional filters
  if (filter && Object.keys(filter).length > 0) {
    Object.entries(filter).forEach(([key, value]) => {
      if (key === 'metadata') {
        sql += ` AND metadata @> $${paramIndex}`;
        sqlParams.push(JSON.stringify(value));
      } else {
        sql += ` AND ${key} = $${paramIndex}`;
        sqlParams.push(value);
      }
      paramIndex++;
    });
  }

  sql += `
    ORDER BY embedding <=> $1
    LIMIT $${paramIndex}
  `;
  sqlParams.push(match_count);

  const result = await query(sql, sqlParams);

  if (result.error) {
    throw createError(`match_documents failed: ${result.error}`, 500);
  }

  return result.data || [];
}

/**
 * Match thoughts by vector similarity
 */
async function matchThoughts(params, userId) {
  const { query_embedding, match_count = 5, filter = {} } = params;

  if (!query_embedding || !Array.isArray(query_embedding)) {
    throw createError('query_embedding must be an array of numbers', 400);
  }

  if (match_count < 1 || match_count > 100) {
    throw createError('match_count must be between 1 and 100', 400);
  }

  let sql = `
    SELECT 
      id,
      content,
      metadata,
      1 - (embedding <=> $1) as similarity
    FROM thoughts 
    WHERE user_id = $2
  `;
  
  const sqlParams = [query_embedding, userId];
  let paramIndex = 3;

  // Add additional filters
  if (filter && Object.keys(filter).length > 0) {
    Object.entries(filter).forEach(([key, value]) => {
      if (key === 'metadata') {
        sql += ` AND metadata @> $${paramIndex}`;
        sqlParams.push(JSON.stringify(value));
      } else {
        sql += ` AND ${key} = $${paramIndex}`;
        sqlParams.push(value);
      }
      paramIndex++;
    });
  }

  sql += `
    ORDER BY embedding <=> $1
    LIMIT $${paramIndex}
  `;
  sqlParams.push(match_count);

  const result = await query(sql, sqlParams);

  if (result.error) {
    throw createError(`match_thoughts failed: ${result.error}`, 500);
  }

  return result.data || [];
}

/**
 * Get user profile
 */
async function getUserProfile(userId) {
  const sql = `
    SELECT 
      up.*,
      c.name as company_name,
      c.industry as company_industry
    FROM user_profiles up
    LEFT JOIN companies c ON up.company_id = c.id
    WHERE up.user_id = $1
  `;

  const result = await query(sql, [userId]);

  if (result.error) {
    throw createError(`get_user_profile failed: ${result.error}`, 500);
  }

  return result.data?.[0] || null;
}


/**
 * Get company data
 */
async function getCompanyData(userId) {
  const sql = `
    SELECT 
      c.*,
      COUNT(up.id) as employee_count
    FROM companies c
    LEFT JOIN user_profiles up ON c.id = up.company_id
    WHERE c.id IN (SELECT company_id FROM user_profiles WHERE user_id = $1)
    GROUP BY c.id
  `;

  const result = await query(sql, [userId]);

  if (result.error) {
    throw createError(`get_company_data failed: ${result.error}`, 500);
  }

  return result.data?.[0] || null;
}

/**
 * Get business metrics
 */
async function getBusinessMetrics(userId, params = {}) {
  const { timeRange = '30d', metricType } = params;

  let sql = `
    SELECT 
      metric_type,
      value,
      created_at
    FROM business_metrics bm
    WHERE bm.company_id IN (SELECT company_id FROM user_profiles WHERE user_id = $1)
  `;

  const sqlParams = [userId];
  let paramIndex = 2;

  if (metricType) {
    sql += ` AND metric_type = $${paramIndex}`;
    sqlParams.push(metricType);
    paramIndex++;
  }

  if (timeRange === '7d') {
    sql += ` AND created_at >= NOW() - INTERVAL '7 days'`;
  } else if (timeRange === '30d') {
    sql += ` AND created_at >= NOW() - INTERVAL '30 days'`;
  } else if (timeRange === '90d') {
    sql += ` AND created_at >= NOW() - INTERVAL '90 days'`;
  }

  sql += ` ORDER BY created_at DESC`;

  const result = await query(sql, sqlParams);

  if (result.error) {
    throw createError(`get_business_metrics failed: ${result.error}`, 500);
  }

  return result.data || [];
}

/**
 * Get next best actions
 */
async function getNextBestActions(userId, params = {}) {
  const { status, priority, limit = 10 } = params;

  let sql = `
    SELECT 
      id,
      title,
      description,
      priority,
      category,
      status,
      created_at
    FROM next_best_actions
    WHERE user_id = $1
  `;

  const sqlParams = [userId];
  let paramIndex = 2;

  if (status) {
    sql += ` AND status = $${paramIndex}`;
    sqlParams.push(status);
    paramIndex++;
  }

  if (priority) {
    sql += ` AND priority = $${paramIndex}`;
    sqlParams.push(priority);
    paramIndex++;
  }

  sql += ` ORDER BY 
    CASE priority 
      WHEN 'critical' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      WHEN 'low' THEN 4 
    END,
    created_at DESC
    LIMIT $${paramIndex}
  `;
  sqlParams.push(limit);

  const result = await query(sql, sqlParams);

  if (result.error) {
    throw createError(`get_next_best_actions failed: ${result.error}`, 500);
  }

  return result.data || [];
}

/**
 * Get user integrations
 */
async function getUserIntegrations(userId) {
  const sql = `
    SELECT 
      ui.*,
      i.name as integration_name,
      i.description as integration_description,
      i.icon_url as integration_icon
    FROM user_integrations ui
    LEFT JOIN integrations i ON ui.integration_id = i.id
    WHERE ui.user_id = $1
    ORDER BY ui.created_at DESC
  `;

  const result = await query(sql, [userId]);

  if (result.error) {
    throw createError(`get_user_integrations failed: ${result.error}`, 500);
  }

  return result.data || [];
}

/**
 * Get required onboarding steps
 */
async function getRequiredOnboardingSteps() {
  const sql = `SELECT step_id FROM get_required_onboarding_steps() WHERE is_required = true ORDER BY step_order`;

  const result = await query(sql);

  if (result.error) {
    throw createError(`get_required_onboarding_steps failed: ${result.error}`, 500);
  }

  // Extract just the step_id values from the result
  const stepIds = result.data ? result.data.map(row => row.step_id) : [];
  return stepIds;
}

/**
 * Sync user profile and company data from Authentik JWT payload
 */
async function syncAuthentikUserData(userId, jwtPayload) {
  try {
    logger.info('Syncing Authentik user data via RPC', { userId });
    
    // Use the UserProfileService to ensure profile with Authentik data
    const result = await userProfileService.ensureUserProfile(
      userId,
      jwtPayload?.email,
      {},
      jwtPayload
    );
    
    if (!result.success) {
      throw createError(`Failed to sync Authentik user data: ${result.error}`, 500);
    }
    
    return {
      profile_synced: true,
      company_synced: !!result.data?.company_id,
      user_profile: result.data,
      company: result.company,
      last_sync: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error('Error syncing Authentik user data', { userId, error });
    throw createError(`Authentik sync failed: ${error.message}`, 500);
  }
}

/**
 * Force refresh user profile from Authentik
 * This calls the same sync logic but can be triggered manually
 */
async function forceSyncAuthentikUser(userId, jwtPayload) {
  try {
    logger.info('Force syncing Authentik user data via RPC', { userId });
    
    // Force a fresh sync by calling ensureUserProfile
    const result = await userProfileService.ensureUserProfile(
      userId,
      jwtPayload?.email,
      {}, // Empty updates to force sync
      jwtPayload
    );
    
    if (!result.success) {
      throw createError(`Failed to force sync Authentik user data: ${result.error}`, 500);
    }
    
    return {
      profile_synced: true,
      company_synced: !!result.data?.company_id,
      user_profile: result.data,
      company: result.company,
      forced_sync: true,
      last_sync: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error('Error force syncing Authentik user data', { userId, error });
    throw createError(`Authentik force sync failed: ${error.message}`, 500);
  }
}

/**
 * Get Authentik sync status for a user
 */
async function getAuthentikSyncStatus(userId) {
  try {
    // Get user profile to check sync status
    const result = await userProfileService.getUserProfile(userId);
    
    if (!result.success) {
      return {
        success: false,
        error: 'User profile not found'
      };
    }
    
    const profile = result.data;
    
    // Determine what fields have been synced from Authentik
    const syncedFields = [];
    if (profile.first_name) syncedFields.push('first_name');
    if (profile.last_name) syncedFields.push('last_name');
    if (profile.email) syncedFields.push('email');
    if (profile.phone) syncedFields.push('phone');
    if (profile.company_name) syncedFields.push('company_name');
    
    // Calculate completion percentage
    const totalFields = ['first_name', 'last_name', 'email', 'phone', 'company_name'];
    const completionPercentage = Math.round((syncedFields.length / totalFields.length) * 100);
    
    return {
      success: true,
      last_sync: profile.updated_at,
      synced_fields: syncedFields,
      completion_percentage: completionPercentage,
      profile_completion_percentage: profile.profile_completion_percentage || 0,
      signup_completed: profile.signup_completed || false,
      business_profile_completed: profile.business_profile_completed || false
    };
    
  } catch (error) {
    logger.error('Error getting Authentik sync status', { userId, error });
    throw createError(`Failed to get sync status: ${error.message}`, 500);
  }
}

module.exports = router;
