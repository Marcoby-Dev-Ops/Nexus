const { query } = require('../database/connection');
const { createError } = require('../middleware/errorHandler');

/**
 * Complete onboarding edge function
 * Handles user onboarding completion, organization creation, and profile updates
 */
async function completeOnboardingHandler(payload, user) {
  try {
    const {
      userId,
      firstName,
      lastName,
      email,
      displayName,
      jobTitle,
      phone,
      company,
      industry,
      companySize,
      primaryGoals,
      businessChallenges,
      selectedIntegrations,
      selectedUseCases,
      completedAt
    } = payload;

    // Validate required fields
    if (!userId) {
      throw createError('userId is required', 400);
    }

    if (!firstName || !lastName) {
      throw createError('firstName and lastName are required', 400);
    }

    console.log('Complete onboarding called for user:', userId);

    // Get internal user ID from external user ID
    const internalUserResult = await query(
      'SELECT id FROM user_profiles WHERE external_user_id = $1',
      [userId]
    );

    if (internalUserResult.rows.length === 0) {
      throw createError('User not found', 404);
    }

    const internalUserId = internalUserResult.rows[0].id;

    // Start transaction
    await query('BEGIN');

    try {
      // 1. Update user profile with onboarding data
      const profileUpdates = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        display_name: displayName || `${firstName} ${lastName}`,
        job_title: jobTitle,
        phone: phone,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      await query(
        `UPDATE user_profiles 
         SET first_name = $1, last_name = $2, email = $3, display_name = $4, job_title = $5, 
             phone = $6, onboarding_completed = $7, updated_at = $8
         WHERE id = $9`,
        [
          profileUpdates.first_name,
          profileUpdates.last_name,
          profileUpdates.email,
          profileUpdates.display_name,
          profileUpdates.job_title,
          profileUpdates.phone,
          profileUpdates.onboarding_completed,
          profileUpdates.updated_at,
          internalUserId
        ]
      );

      console.log('User profile updated successfully');

      // 2. Check if user already has an organization
      const existingOrgResult = await query(
        `SELECT uo.organization_id 
         FROM user_organizations uo 
         WHERE uo.user_id = $1 AND uo.is_primary = true`,
        [internalUserId]
      );

      let organizationId = null;
      let organizationCreated = false;

      if (existingOrgResult.rows.length > 0) {
        // User already has an organization
        organizationId = existingOrgResult.rows[0].organization_id;
        console.log('User already has organization:', organizationId);
      } else {
        // Create new organization using the organizations API
        const organizationData = {
          name: company || `${firstName}'s Organization`,
          description: `Organization for ${firstName} ${lastName}`,
          industry: industry || 'Technology',
          size: companySize || '1-10'
        };

        // Create organization directly in the database
        const newOrgResult = await query(
          `INSERT INTO organizations (name, description, industry, size, tenant_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           RETURNING id`,
          [
            organizationData.name,
            organizationData.description,
            organizationData.industry,
            organizationData.size,
            internalUserId // Use user ID as tenant_id
          ]
        );

        organizationId = newOrgResult.rows[0].id;
        organizationCreated = true;

        console.log('New organization created:', organizationId);

        // Add user as owner of the organization
        await query(
          `INSERT INTO user_organizations (user_id, organization_id, role, permissions, is_primary, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            internalUserId,
            organizationId,
            'owner',
            JSON.stringify(['*']), // Owner has all permissions
            true // Set as primary organization
          ]
        );

        console.log('User associated with organization as owner');
      }

      // 3. Store onboarding preferences and selections
      const onboardingData = {
        primary_goals: primaryGoals || [],
        business_challenges: businessChallenges || [],
        selected_integrations: selectedIntegrations || [],
        selected_use_cases: selectedUseCases || [],
        company: company,
        industry: industry,
        company_size: companySize
      };

      // Store onboarding data in user_onboarding_phases table
      const phaseData = {
        phase_id: 'complete',
        phase_data: onboardingData,
        completed_at: completedAt || new Date().toISOString()
      };

      // Check if onboarding phase already exists
      const existingOnboardingResult = await query(
        'SELECT user_id FROM user_onboarding_phases WHERE user_id = $1 AND phase_id = $2',
        [internalUserId, 'complete']
      );

      if (existingOnboardingResult.rows.length > 0) {
        // Update existing onboarding phase
        await query(
          `UPDATE user_onboarding_phases 
           SET phase_data = $1, completed_at = $2, updated_at = $3
           WHERE user_id = $4 AND phase_id = $5`,
          [
            JSON.stringify(phaseData.phase_data),
            phaseData.completed_at,
            new Date().toISOString(),
            internalUserId,
            'complete'
          ]
        );
      } else {
        // Insert new onboarding phase
        await query(
          `INSERT INTO user_onboarding_phases 
           (user_id, phase_id, phase_data, completed_at)
           VALUES ($1, $2, $3, $4)`,
          [
            internalUserId,
            'complete',
            JSON.stringify(phaseData.phase_data),
            phaseData.completed_at
          ]
        );
      }

      console.log('Onboarding data stored successfully');

      // Commit transaction
      await query('COMMIT');

      return {
        userId,
        organizationId,
        onboardingCompleted: true,
        profileUpdated: true,
        organizationCreated
      };

    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Complete onboarding error:', error);
    throw error;
  }
}

module.exports = completeOnboardingHandler;
