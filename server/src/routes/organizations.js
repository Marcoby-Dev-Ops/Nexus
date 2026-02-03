const express = require('express');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');
const { requireDecisionContext } = require('../middleware/atomPolicy');

const router = express.Router();

/**
 * GET /api/organizations/test
 * Test endpoint to get organizations without authentication
 */
router.get('/test', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    logger.info('Fetching organizations for user (test)', { userId });

    // Get user's organization memberships
    const membershipsQuery = `
      SELECT 
        uo.organization_id,
        uo.role,
        uo.permissions,
        uo.is_active,
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
    const orgIds = memberships.map(m => m.organization_id);

    // Fetch organizations by IDs
    const orgsQuery = `
      SELECT 
        id,
        name,
        description,
        slug,
        industry,
        size,
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
      orgIdToMembership.set(membership.organization_id, membership);
    }

    const result = organizations.map(org => ({
      ...org,
      role: orgIdToMembership.get(org.id)?.role,
      member_count: undefined
    }));

    logger.info('Successfully fetched organizations (test)', { 
      userId, 
      count: result.length 
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error in GET /api/organizations/test', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/organizations
 * Get all organizations for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      logger.error('No user ID found in request', { user: req.user });
      console.log('❌ [Organizations API] No user ID found in request');
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    console.log('🔍 [Organizations API] Fetching organizations for user ID:', userId);
    console.log('🔍 [Organizations API] User object:', req.user);

    logger.info('Fetching organizations for user', { userId, userIdType: typeof userId, userIdLength: userId?.length });

    // First, get user's organization memberships
    const membershipsQuery = `
      SELECT 
        uo.organization_id,
        uo.role,
        uo.permissions,
        uo.is_active,
        uo.joined_at
      FROM user_organizations uo
      WHERE uo.user_id = $1
    `;

    logger.info('Executing memberships query', { query: membershipsQuery, params: [userId] });
    
    // First, let's test if the table exists and check its structure
    const tableCheckQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_organizations' 
      ORDER BY ordinal_position
    `;
    
    const { data: tableInfo, error: tableError } = await query(tableCheckQuery, [], req.user.jwtPayload || { sub: userId });
    
    if (tableError) {
      logger.error('Failed to check table structure', { error: tableError });
      return res.status(500).json({
        success: false,
        error: 'Database configuration error'
      });
    }
    
    logger.info('Table structure check', { tableInfo });
    
    const { data: memberships, error: membershipsError } = await query(membershipsQuery, [userId], req.user.jwtPayload || { sub: userId });

    if (membershipsError) {
      logger.error('Failed to fetch user memberships', { error: membershipsError, userId });
      console.log('❌ [Organizations API] Failed to fetch memberships:', membershipsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch organization memberships'
      });
    }

    console.log('🔍 [Organizations API] Found memberships:', memberships);

    if (!memberships || memberships.length === 0) {
      console.log('❌ [Organizations API] No memberships found for user:', userId);
      return res.json({
        success: true,
        data: []
      });
    }

    // Get organization IDs from memberships
    const orgIds = memberships.map(m => m.organization_id);

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

    const { data: organizations, error: orgsError } = await query(orgsQuery, [orgIds], req.user.jwtPayload || { sub: userId });

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
      orgIdToMembership.set(membership.organization_id, membership);
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
      SELECT role, permissions, is_primary, created_at as joined_at
      FROM user_organizations
      WHERE user_id = $1 AND organization_id = $2
    `;

    const { data: memberships, error: membershipError } = await query(membershipQuery, [userId, orgId], req.user.jwtPayload || { sub: userId });

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

    const { data: organizations, error: orgError } = await query(orgQuery, [orgId], req.user.jwtPayload || { sub: userId });

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
      WHERE user_id = $1 AND organization_id = $2
    `;

    const { data: memberships, error: membershipError } = await query(membershipQuery, [userId, orgId], req.user.jwtPayload || { sub: userId });

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
        uo.organization_id as org_id,
        uo.role,
        uo.permissions,
        uo.is_primary,
        COALESCE(uo.created_at, uo.joined_at) as joined_at,
        up.id as user_profile_id,
        up.name,
        up.email
      FROM user_organizations uo
      LEFT JOIN user_profiles up ON uo.user_id = up.user_id
      WHERE uo.organization_id = $1
      ORDER BY COALESCE(uo.created_at, uo.joined_at) ASC
    `;

    const { data: members, error: membersError } = await query(membersQuery, [orgId], req.user.jwtPayload || { sub: userId });

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

/**
 * POST /api/organizations
 * Create a new organization
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, description, slug } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Organization name is required'
      });
    }

    logger.info('Creating organization', { userId, name });

    // Generate slug if not provided
    const orgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Create organization
    const createOrgQuery = `
      INSERT INTO organizations (name, description, slug, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;

    const { data: organizations, error: createError } = await query(createOrgQuery, [
      name.trim(),
      description?.trim() || null,
      orgSlug,
      userId // Use user ID as tenant_id for now
    ], req.user.jwtPayload || { sub: userId });

    if (createError) {
      logger.error('Failed to create organization', { error: createError, userId, name });
      return res.status(500).json({
        success: false,
        error: 'Failed to create organization'
      });
    }

    const organization = organizations[0];

    // Add user as owner of the organization
    const addMemberQuery = `
      INSERT INTO user_organizations (user_id, organization_id, role, permissions, is_primary, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    const { error: memberError } = await query(addMemberQuery, [
      userId,
      organization.id,
      'owner',
      JSON.stringify(['*']), // Owner has all permissions
      true // Set as primary organization
    ], req.user.jwtPayload || { sub: userId });

    if (memberError) {
      logger.error('Failed to add user as organization owner', { error: memberError, userId, orgId: organization.id });
      return res.status(500).json({
        success: false,
        error: 'Organization created but failed to set ownership'
      });
    }

    logger.info('Organization created successfully', { userId, orgId: organization.id, name });

    res.status(201).json({
      success: true,
      data: organization
    });

  } catch (error) {
    logger.error('Error in POST /api/organizations', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/organizations/:id
 * Update an organization
 */
router.put('/:id', authenticateToken, (req, res) => {
  // Nucleus mutations require explicit decision context (Energy)
  requireDecisionContext('organization', 'update')(req, res, async () => {
  try {
    const userId = req.user?.id;
    const orgId = req.params.id;
    const { name, description, slug, settings } = req.body;

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

    logger.info('Updating organization', { userId, orgId });

    // Check if user has permission to update this organization (owner or admin)
    const permissionQuery = `
      SELECT role FROM user_organizations
      WHERE user_id = $1 AND organization_id = $2 AND role IN ('owner', 'admin')
    `;

    const { data: permissions, error: permError } = await query(permissionQuery, [userId, orgId], req.user.jwtPayload || { sub: userId });

    if (permError) {
      logger.error('Failed to check organization permissions', { error: permError, userId, orgId });
      return res.status(500).json({
        success: false,
        error: 'Failed to verify organization access'
      });
    }

    if (!permissions || permissions.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to update organization'
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description?.trim() || null);
    }

    if (slug !== undefined) {
      updates.push(`slug = $${paramIndex++}`);
      values.push(slug);
    }

    if (settings !== undefined) {
      updates.push(`settings = $${paramIndex++}`);
      values.push(JSON.stringify(settings));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(orgId);

    const updateQuery = `
      UPDATE organizations 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const { data: organizations, error: updateError } = await query(updateQuery, values, req.user.jwtPayload || { sub: userId });

    if (updateError) {
      logger.error('Failed to update organization', { error: updateError, userId, orgId });
      return res.status(500).json({
        success: false,
        error: 'Failed to update organization'
      });
    }

    if (!organizations || organizations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    logger.info('Organization updated successfully', { userId, orgId });

    res.json({
      success: true,
      data: organizations[0]
    });

  } catch (error) {
    logger.error('Error in PUT /api/organizations/:id', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
  });
});

/**
 * DELETE /api/organizations/:id
 * Delete an organization (only owners can delete)
 */
router.delete('/:id', authenticateToken, (req, res) => {
  // Nucleus mutations require explicit decision context (Energy)
  requireDecisionContext('organization', 'delete')(req, res, async () => {
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

    logger.info('Deleting organization', { userId, orgId });

    // Check if user is the owner of this organization
    const ownershipQuery = `
      SELECT 1 FROM user_organizations
      WHERE user_id = $1 AND organization_id = $2 AND role = 'owner'
    `;

    const { data: ownership, error: ownershipError } = await query(ownershipQuery, [userId, orgId], req.user.jwtPayload || { sub: userId });

    if (ownershipError) {
      logger.error('Failed to check organization ownership', { error: ownershipError, userId, orgId });
      return res.status(500).json({
        success: false,
        error: 'Failed to verify organization ownership'
      });
    }

    if (!ownership || ownership.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Only organization owners can delete organizations'
      });
    }

    // Delete organization (cascade will handle user_organizations)
    const deleteQuery = `
      DELETE FROM organizations 
      WHERE id = $1
      RETURNING *
    `;

    const { data: deletedOrgs, error: deleteError } = await query(deleteQuery, [orgId], req.user.jwtPayload || { sub: userId });

    if (deleteError) {
      logger.error('Failed to delete organization', { error: deleteError, userId, orgId });
      return res.status(500).json({
        success: false,
        error: 'Failed to delete organization'
      });
    }

    if (!deletedOrgs || deletedOrgs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    logger.info('Organization deleted successfully', { userId, orgId });

    res.json({
      success: true,
      data: deletedOrgs[0]
    });

  } catch (error) {
    logger.error('Error in DELETE /api/organizations/:id', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
  });
});

module.exports = router;
