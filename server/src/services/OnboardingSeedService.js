const { query } = require('../database/connection');
const { logger } = require('../utils/logger');
const userProfileService = require('./UserProfileService');

/**
 * Normalize a business name into a URL-safe slug.
 */
function slugify(name) {
  const base = (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return base || `org-${Date.now()}`;
}

async function generateUniqueSlug(baseSlug) {
  let attempt = 0;
  let candidate = baseSlug;

  while (attempt < 10) {
    const { data, error } = await query(
      'SELECT 1 FROM organizations WHERE slug = $1 LIMIT 1',
      [candidate]
    );

    if (error) {
      logger.warn('Failed to verify organization slug uniqueness', { error, candidate });
      break;
    }

    if (!data || data.length === 0) {
      return candidate;
    }

    attempt += 1;
    candidate = `${baseSlug}-${attempt}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

async function upsertUserProfile(userId, profileData, jwtPayload) {
  const ensured = await userProfileService.ensureUserProfile(
    userId,
    profileData.email,
    profileData,
    jwtPayload
  );

  if (!ensured.success) {
    throw new Error(ensured.error || 'Failed to ensure user profile');
  }

  return ensured.profile;
}

async function ensureOrganization(userId, organizationData, jwtPayload) {
  const existingMembership = await query(
    `SELECT uo.organization_id, uo.role, o.name
     FROM user_organizations uo
     JOIN organizations o ON o.id = uo.organization_id
     WHERE uo.user_id = $1
     ORDER BY uo.is_primary DESC, uo.joined_at ASC
     LIMIT 1`,
    [userId],
    jwtPayload
  );

  if (existingMembership.error) {
    throw new Error(existingMembership.error);
  }

  if (existingMembership.data && existingMembership.data.length > 0) {
    const orgId = existingMembership.data[0].organization_id;

    const updates = await query(
      `UPDATE organizations
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           industry = COALESCE($3, industry),
           size = COALESCE($4, size),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id` ,
      [
        organizationData.name,
        organizationData.description,
        organizationData.industry,
        organizationData.size,
        orgId,
      ],
      jwtPayload
    );

    if (updates.error) {
      logger.warn('Failed to update existing organization record', { error: updates.error, orgId });
    }

    return orgId;
  }

  const baseSlug = slugify(organizationData.name);
  const slug = await generateUniqueSlug(baseSlug);

  const created = await query(
    `INSERT INTO organizations (name, description, slug, tenant_id, industry, size, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING id`,
    [
      organizationData.name,
      organizationData.description,
      slug,
      userId,
      organizationData.industry,
      organizationData.size,
    ],
    jwtPayload
  );

  if (created.error || !created.data || created.data.length === 0) {
    throw new Error(created.error || 'Failed to create organization');
  }

  const orgId = created.data[0].id;

  const membership = await query(
    `INSERT INTO user_organizations (user_id, organization_id, role, permissions, is_primary, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id`,
    [
      userId,
      orgId,
      'owner',
      JSON.stringify(['*']),
      true,
    ],
    jwtPayload
  );

  if (membership.error) {
    logger.warn('Organization created but membership insert failed', { error: membership.error, orgId, userId });
  }

  return orgId;
}

async function seedUserContextFromSignup(payload) {
  const {
    userId,
    firstName,
    lastName,
    email,
    phone,
    businessName,
    businessType,
    industry,
    companySize,
    fundingStage,
    revenueRange,
    jwtPayload
  } = payload;

  if (!userId) {
    throw new Error('userId is required to seed onboarding context');
  }

  const profileData = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone || null,
    display_name: [firstName, lastName].filter(Boolean).join(' ') || null,
    company_name: businessName,
    role: 'owner',
    onboarding_completed: true,
    profile_completion_percentage: 60,
    preferences: {
      business_type: businessType || null,
      funding_stage: fundingStage || null,
      revenue_range: revenueRange || null,
    }
  };

  const profile = await upsertUserProfile(userId, profileData, jwtPayload);

  const organizationData = {
    name: businessName,
    description: `Organization for ${profile.display_name || firstName || 'user'}`,
    industry: industry || null,
    size: companySize || null,
  };

  const organizationId = await ensureOrganization(userId, organizationData, jwtPayload);

  logger.info('Seeded onboarding context for user', { userId, organizationId });

  return {
    profile,
    organizationId,
  };
}

module.exports = {
  seedUserContextFromSignup,
};

