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
      'get_company_next_action'
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

module.exports = router;
