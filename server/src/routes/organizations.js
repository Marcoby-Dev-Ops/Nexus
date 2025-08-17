const express = require('express');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/organizations
 * Get all organizations for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    logger.info('Fetching organizations for user', { userId });

    // First, get user's organization memberships
    const membershipsQuery = `
      SELECT 
        uo.org_id,
        uo.role,
        uo.permissions,
        uo.is_primary,
        uo.joined_at
      FROM user_organizations uo
      WHERE uo.user_id = $1
    `;

    const { data: memberships, error: membershipsError } = await query(membershipsQuery, [userId]);

    if (membershipsError) {
      logger.error('Failed to fetch user memberships', { error: membershipsError, userId });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch organization memberships'
      });
    }

    if (!memberships || memberships.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get organization IDs from memberships
    const orgIds = memberships.map(m => m.org_id);

    // Fetch organizations by IDs
    const orgsQuery = `
      SELECT 
        id,
        name,
        description,
        slug,
        tenant_id,
        org_group_id,
        settings,
        created_at,
        updated_at
      FROM organizations
      WHERE id = ANY($1)
    `;

    const { data: organizations, error: orgsError } = await query(orgsQuery, [orgIds]);

    if (orgsError) {
      logger.error('Failed to fetch organizations', { error: orgsError, orgIds });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch organizations'
      });
    }

    // Merge role info from memberships
    const orgIdToMembership = new Map();
    for (const membership of memberships) {
      orgIdToMembership.set(membership.org_id, membership);
    }

    const result = organizations.map(org => ({
      ...org,
      role: orgIdToMembership.get(org.id)?.role,
      member_count: undefined
    }));

    logger.info('Successfully fetched organizations', { 
      userId, 
      count: result.length 
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error in GET /api/organizations', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/organizations/:id
 * Get a specific organization by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    logger.info('Fetching organization details', { userId, orgId });

    // Check if user is a member of this organization
    const membershipQuery = `
      SELECT role, permissions, is_primary, joined_at
      FROM user_organizations
      WHERE user_id = $1 AND org_id = $2
    `;

    const { data: memberships, error: membershipError } = await query(membershipQuery, [userId, orgId]);

    if (membershipError) {
      logger.error('Failed to check organization membership', { error: membershipError, userId, orgId });
      return res.status(500).json({
        success: false,
        error: 'Failed to verify organization access'
      });
    }

    if (!memberships || memberships.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to organization'
      });
    }

    // Fetch organization details
    const orgQuery = `
      SELECT 
        id,
        name,
        description,
        slug,
        tenant_id,
        org_group_id,
        settings,
        created_at,
        updated_at
      FROM organizations
      WHERE id = $1
    `;

    const { data: organizations, error: orgError } = await query(orgQuery, [orgId]);

    if (orgError) {
      logger.error('Failed to fetch organization', { error: orgError, orgId });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch organization'
      });
    }

    if (!organizations || organizations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    const organization = {
      ...organizations[0],
      role: memberships[0].role
    };

    logger.info('Successfully fetched organization', { userId, orgId });

    res.json({
      success: true,
      data: organization
    });

  } catch (error) {
    logger.error('Error in GET /api/organizations/:id', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/organizations/:id/members
 * Get organization members
 */
router.get('/:id/members', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    logger.info('Fetching organization members', { userId, orgId });

    // Check if user is a member of this organization
    const membershipQuery = `
      SELECT 1 FROM user_organizations
      WHERE user_id = $1 AND org_id = $2
    `;

    const { data: memberships, error: membershipError } = await query(membershipQuery, [userId, orgId]);

    if (membershipError) {
      logger.error('Failed to check organization membership', { error: membershipError, userId, orgId });
      return res.status(500).json({
        success: false,
        error: 'Failed to verify organization access'
      });
    }

    if (!memberships || memberships.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to organization'
      });
    }

    // Fetch organization members with user profiles
    const membersQuery = `
      SELECT 
        uo.id,
        uo.user_id,
        uo.org_id,
        uo.role,
        uo.permissions,
        uo.is_primary,
        uo.joined_at,
        up.id as user_profile_id,
        up.name,
        up.email
      FROM user_organizations uo
      LEFT JOIN user_profiles up ON uo.user_id = up.id
      WHERE uo.org_id = $1
      ORDER BY uo.joined_at ASC
    `;

    const { data: members, error: membersError } = await query(membersQuery, [orgId]);

    if (membersError) {
      logger.error('Failed to fetch organization members', { error: membersError, orgId });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch organization members'
      });
    }

    const result = members.map(member => ({
      id: member.id,
      user_id: member.user_id,
      org_id: member.org_id,
      role: member.role,
      permissions: member.permissions || [],
      is_primary: member.is_primary,
      joined_at: member.joined_at,
      user: member.user_profile_id ? {
        id: member.user_profile_id,
        name: member.name,
        email: member.email
      } : undefined
    }));

    logger.info('Successfully fetched organization members', { 
      userId, 
      orgId, 
      memberCount: result.length 
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error in GET /api/organizations/:id/members', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
