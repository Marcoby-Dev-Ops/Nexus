const express = require('express');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/companies/:id - Get company by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    logger.info('Fetching company by ID', { companyId: id, userId });

    // Get company data with employee count
    const sql = `
      SELECT 
        c.*,
        COUNT(up.id) as employee_count
      FROM companies c
      LEFT JOIN user_profiles up ON c.id = up.company_id
      WHERE c.id = $1
      GROUP BY c.id
    `;

    const result = await query(sql, [id]);

    if (result.error) {
      throw createError(`Failed to fetch company: ${result.error}`, 500);
    }

    if (!result.data || result.data.length === 0) {
      throw createError('Company not found', 404);
    }

    // Verify user has access to this company (either owner or member)
    const company = result.data[0];
    const userCompanyQuery = `
      SELECT company_id FROM user_profiles WHERE user_id = $1
    `;
    const userCompanyResult = await query(userCompanyQuery, [userId]);
    
    if (userCompanyResult.error) {
      throw createError(`Failed to verify user company access: ${userCompanyResult.error}`, 500);
    }

    const userCompanyId = userCompanyResult.data?.[0]?.company_id;
    if (userCompanyId !== id) {
      throw createError('Access denied to company', 403);
    }

    res.json({
      success: true,
      data: company
    });

  } catch (error) {
    logger.error('Company GET error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to fetch company'
    });
  }
});

/**
 * GET /api/companies - Get companies for user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info('Fetching companies for user', { userId });

    // Get companies where user is a member
    const sql = `
      SELECT 
        c.*,
        COUNT(up.id) as employee_count,
        CASE WHEN c.owner_id = $1 THEN 'owner' ELSE 'member' END as user_role
      FROM companies c
      LEFT JOIN user_profiles up ON c.id = up.company_id
      WHERE c.id IN (
        SELECT company_id FROM user_profiles WHERE user_id = $1
      )
      GROUP BY c.id
    `;

    const result = await query(sql, [userId]);

    if (result.error) {
      throw createError(`Failed to fetch companies: ${result.error}`, 500);
    }

    res.json({
      success: true,
      data: result.data || []
    });

  } catch (error) {
    logger.error('Companies GET error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to fetch companies'
    });
  }
});

/**
 * POST /api/companies - Create new company
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyData = req.body;

    logger.info('Creating new company', { userId, companyData: { name: companyData.name } });

    // Validate required fields
    if (!companyData.name) {
      throw createError('Company name is required', 400);
    }

    // Create company
    const createSql = `
      INSERT INTO companies (
        name, domain, industry, size, description, website, 
        logo_url, address, contact_info, tax_info, billing_info,
        owner_id, is_active, settings, subscription_plan, max_users
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *
    `;

    const params = [
      companyData.name,
      companyData.domain || null,
      companyData.industry || null,
      companyData.size || null,
      companyData.description || null,
      companyData.website || null,
      companyData.logo_url || null,
      companyData.address ? JSON.stringify(companyData.address) : '{}',
      companyData.contact_info ? JSON.stringify(companyData.contact_info) : '{}',
      companyData.tax_info ? JSON.stringify(companyData.tax_info) : '{}',
      companyData.billing_info ? JSON.stringify(companyData.billing_info) : '{}',
      userId,
      companyData.is_active !== false,
      companyData.settings ? JSON.stringify(companyData.settings) : '{}',
      companyData.subscription_plan || 'free',
      companyData.max_users || 5
    ];

    const result = await query(createSql, params);

    if (result.error) {
      throw createError(`Failed to create company: ${result.error}`, 500);
    }

    const company = result.data[0];

    // Update user profile to link to new company
    const updateUserSql = `
      UPDATE user_profiles 
      SET company_id = $1, role = $2, updated_at = NOW()
      WHERE user_id = $3
      RETURNING *
    `;

    const updateResult = await query(updateUserSql, [company.id, 'owner', userId]);

    if (updateResult.error) {
      logger.warn('Failed to update user profile with company_id', { 
        error: updateResult.error, 
        companyId: company.id, 
        userId 
      });
    }

    res.status(201).json({
      success: true,
      data: company
    });

  } catch (error) {
    logger.error('Company POST error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to create company'
    });
  }
});

/**
 * PUT /api/companies/:id - Update company
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    logger.info('Updating company', { companyId: id, userId, updateFields: Object.keys(updateData) });

    // Verify user has permission to update this company
    const checkSql = `
      SELECT owner_id FROM companies WHERE id = $1
    `;
    const checkResult = await query(checkSql, [id]);

    if (checkResult.error) {
      throw createError(`Failed to verify company ownership: ${checkResult.error}`, 500);
    }

    if (!checkResult.data || checkResult.data.length === 0) {
      throw createError('Company not found', 404);
    }

    if (checkResult.data[0].owner_id !== userId) {
      throw createError('Only company owner can update company', 403);
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'domain', 'industry', 'size', 'description', 'website',
      'logo_url', 'address', 'contact_info', 'tax_info', 'billing_info',
      'is_active', 'settings', 'subscription_plan', 'max_users'
    ];

    Object.entries(updateData).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        if (typeof value === 'object' && value !== null) {
          updateFields.push(`${key} = $${paramIndex}`);
          params.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = $${paramIndex}`);
          params.push(value);
        }
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw createError('No valid fields to update', 400);
    }

    params.push(id); // Add company ID as last parameter

    const updateSql = `
      UPDATE companies 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateSql, params);

    if (result.error) {
      throw createError(`Failed to update company: ${result.error}`, 500);
    }

    res.json({
      success: true,
      data: result.data[0]
    });

  } catch (error) {
    logger.error('Company PUT error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to update company'
    });
  }
});

module.exports = router;