const { Router } = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { query } = require('../database/connection');

// Authentik configuration
const AUTHENTIK_BASE_URL = process.env.AUTHENTIK_BASE_URL || 'https://identity.marcoby.com';
const AUTHENTIK_API_TOKEN = process.env.AUTHENTIK_API_TOKEN;

const AuditService = require('../services/AuditService');
const userProfileService = require('../services/UserProfileService');
const companyService = require('../services/CompanyService');
const router = Router();

// Helper: start linking an external provider via Authentik
// Redirects an authenticated Nexus user to the Authentik provider start endpoint
router.get('/link/twitter', authenticateToken, async (req, res) => {
  try {
    const next = req.query.next || process.env.FRONTEND_URL || 'https://napp.marcoby.net/profile';

    // Create an OAuth state via the local oauth state endpoint so the
    // token exchange can validate the request later. We POST to our own
    // /api/oauth/state route which will store the state and codeVerifier.
    const localStateUrl = `${req.protocol}://${req.get('host')}/api/oauth/state`;
    const body = JSON.stringify({ userId: String(req.user.id), integrationSlug: 'twitter', redirectUri: next });

    const stateResp = await fetch(localStateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    if (!stateResp.ok) {
      const txt = await stateResp.text().catch(() => '');
      logger.error('Failed to create OAuth state', { status: stateResp.status, details: txt });
      return res.status(500).json({ success: false, error: 'Failed to initialize OAuth state' });
    }

    const stateData = await stateResp.json();
    const state = stateData.data && stateData.data.state ? stateData.data.state : null;
    if (!state) {
      logger.error('OAuth state response malformed', { body: stateData });
      return res.status(500).json({ success: false, error: 'Invalid OAuth state' });
    }

    // Use provider slug 'twitter' (the provider you created in Authentik)
    const providerStart = `${AUTHENTIK_BASE_URL.replace(/\/+$/, '')}/if/flow/twitter/start`;
    const redirectUrl = `${providerStart}?state=${encodeURIComponent(state)}&next=${encodeURIComponent(next)}`;
    return res.redirect(302, redirectUrl);
  } catch (err) {
    logger.error('Failed to redirect to Authentik provider start', { error: err?.message || err });
    return res.status(500).json({ success: false, error: 'Failed to start provider link' });
  }
});

// POST /api/auth/sync/twitter - pull mapped Twitter attributes from Authentik and persist to Nexus profile
router.post('/sync/twitter', authenticateToken, async (req, res) => {
  try {
    const authentikUserId = String(req.user.id);
    if (!AUTHENTIK_BASE_URL || !AUTHENTIK_API_TOKEN) {
      return res.status(500).json({ success: false, error: 'Authentik integration not configured' });
    }

    const userResp = await fetch(`${AUTHENTIK_BASE_URL.replace(/\/+$/, '')}/api/v3/core/users/${encodeURIComponent(authentikUserId)}/`, {
      headers: { 'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`, 'Accept': 'application/json' }
    });

    if (!userResp.ok) {
      const txt = await userResp.text().catch(() => '');
      logger.error('Failed to fetch Authentik user for sync', { status: userResp.status, details: txt });
      return res.status(500).json({ success: false, error: 'Failed to fetch user from Authentik' });
    }

    const akUser = await userResp.json();

    // Extract mapped fields. Try attributes first, then fallback to common fields.
    const attrs = akUser.attributes || {};
    const twitterName = attrs.twitter_name || akUser.name || '';
    const twitterUsername = attrs.twitter_username || attrs.preferred_username || '';
    const twitterLocation = attrs.twitter_location || attrs.location || '';
    const twitterProfileUrl = attrs.twitter_profile_url || attrs.url || '';
    const twitterDescription = attrs.twitter_description || attrs.description || '';

    // Map into Nexus profile fields
    const updateData = {};
    if (twitterName) {
      const parts = String(twitterName).trim().split(/\s+/);
      updateData.first_name = parts.shift() || '';
      updateData.last_name = parts.join(' ') || null;
    }
    if (twitterLocation) updateData.location = twitterLocation;
    if (twitterDescription) updateData.bio = twitterDescription;
    if (twitterProfileUrl) updateData.website = twitterProfileUrl;

    // Ensure social_links contains twitter entry
    try {
      const { success, profile } = await userProfileService.getUserProfile(req.user.id);
      let socialLinks = (profile && profile.social_links) ? profile.social_links : null;
      if (!socialLinks) socialLinks = [];
      // Remove existing twitter entry
      socialLinks = socialLinks.filter(s => s.provider !== 'twitter');
      socialLinks.push({ provider: 'twitter', username: twitterUsername || null, url: twitterProfileUrl || null });
      updateData.social_links = JSON.stringify(socialLinks);
    } catch (e) {
      logger.warn('Failed to read existing social_links, will set new', { error: e.message });
      updateData.social_links = JSON.stringify([{ provider: 'twitter', username: twitterUsername || null, url: twitterProfileUrl || null }]);
    }

    // Persist updates to user profile
    const result = await userProfileService.updateProfileData(req.user.id, updateData, req.user.jwtPayload);
    if (!result.success) {
      logger.error('Failed to update Nexus profile with Twitter data', { error: result.error });
      return res.status(500).json({ success: false, error: 'Failed to update Nexus profile' });
    }

    return res.json({ success: true, profile: result.profile });
  } catch (error) {
    logger.error('sync/twitter failed', { error: error.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/auth/unlink/twitter - remove Twitter attributes from Authentik user and clear Nexus social_links
router.delete('/unlink/twitter', authenticateToken, async (req, res) => {
  try {
    const authentikUserId = String(req.user.id);
    if (!AUTHENTIK_BASE_URL || !AUTHENTIK_API_TOKEN) {
      return res.status(500).json({ success: false, error: 'Authentik integration not configured' });
    }

    // Fetch current user
    const userResp = await fetch(`${AUTHENTIK_BASE_URL.replace(/\/+$/, '')}/api/v3/core/users/${encodeURIComponent(authentikUserId)}/`, {
      headers: { 'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`, 'Accept': 'application/json' }
    });
    if (!userResp.ok) {
      const txt = await userResp.text().catch(() => '');
      logger.error('Failed to fetch Authentik user for unlink', { status: userResp.status, details: txt });
      return res.status(500).json({ success: false, error: 'Failed to fetch user from Authentik' });
    }

    const akUser = await userResp.json();
    const attrs = akUser.attributes || {};

    // Remove twitter-related attribute keys
    ['twitter_name','twitter_username','twitter_location','twitter_profile_url','twitter_description'].forEach(k => delete attrs[k]);

    // Update Authentik user attributes
    const updateBody = { ...akUser, attributes: attrs };
    const updateResp = await fetch(`${AUTHENTIK_BASE_URL.replace(/\/+$/, '')}/api/v3/core/users/${encodeURIComponent(authentikUserId)}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}` },
      body: JSON.stringify(updateBody)
    });
    if (!updateResp.ok) {
      const txt = await updateResp.text().catch(() => '');
      logger.error('Failed to update Authentik user to unlink twitter', { status: updateResp.status, details: txt });
      return res.status(500).json({ success: false, error: 'Failed to update Authentik user' });
    }

    // Remove twitter from Nexus social_links
    try {
      const { success, profile } = await userProfileService.getUserProfile(req.user.id);
      let socialLinks = (profile && profile.social_links) ? profile.social_links : null;
      if (socialLinks) {
        // ensure it's parsed
        if (typeof socialLinks === 'string') {
          try { socialLinks = JSON.parse(socialLinks); } catch (e) { socialLinks = []; }
        }
        socialLinks = socialLinks.filter(s => s.provider !== 'twitter');
        await userProfileService.updateProfileData(req.user.id, { social_links: JSON.stringify(socialLinks) }, req.user.jwtPayload);
      }
    } catch (e) {
      logger.warn('Failed to update Nexus social_links on unlink', { error: e.message });
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error('unlink/twitter failed', { error: error.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/create-user - Create new user in Authentik
router.post('/create-user', async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      industry,
      companySize,
      website,
      domain,
      firstName,
      lastName,
      email,
      phone,
      fundingStage,
      revenueRange,
      username
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !businessName || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, firstName, lastName, businessName, username'
      });
    }

    // Check if user already exists
    const existingUserResponse = await fetch(`${AUTHENTIK_BASE_URL}/api/v3/core/users/?search=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
    });

    if (existingUserResponse.ok) {
      const existingUserData = await existingUserResponse.json();
      const existingUser = existingUserData.results.find(user => user.email === email);
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User already exists. Please use the update endpoint instead.'
        });
      }
    }

    // Create new user in Authentik
    const newUserData = {
      username: username,
      email: email,
      name: `${firstName} ${lastName}`,
      is_active: true,
      attributes: {
        business_name: businessName,
        business_type: businessType || '',
        industry: industry || '',
        company_size: companySize || '',
        first_name: firstName,
        last_name: lastName,
        phone: phone || '',
        website: website || '',
        domain: (() => {
          try {
            const publicDomains = new Set(['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','proton.me','protonmail.com','aol.com','yandex.com','mail.com']);
            const inputDom = (domain || '').toLowerCase().trim();
            if (inputDom && !publicDomains.has(inputDom)) return inputDom;
            if (!email || !email.includes('@')) return '';
            const dom = email.split('@')[1].toLowerCase();
            return publicDomains.has(dom) ? '' : dom;
          } catch (_) {
            return '';
          }
        })(),
        funding_stage: fundingStage || '',
        revenue_range: revenueRange || '',
        signup_completed: true,
        signup_completion_date: new Date().toISOString(),
        business_profile_completed: true,
        created_via_signup: true
      }
    };

    const createResponse = await fetch(`${AUTHENTIK_BASE_URL}/api/v3/core/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
      body: JSON.stringify(newUserData),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      logger.error('Authentik user creation failed:', {
        status: createResponse.status,
        statusText: createResponse.statusText,
        errorData,
        requestData: {
          username,
          email,
          businessName
        }
      });

      // If Authentik reports an invalid or expired token, surface a clear 503 so
      // the frontend (and operator) know this is an upstream auth config issue.
      const detail = (errorData && errorData.detail) ? String(errorData.detail).toLowerCase() : '';
      if (createResponse.status === 401 || createResponse.status === 403 || /token invalid|expired/.test(detail)) {
        return res.status(503).json({
          success: false,
          error: 'Authentik API token invalid or expired',
          note: 'authentik-token-invalid'
        });
      }

      return res.status(400).json({
        success: false,
        error: `Failed to create user: ${errorData.detail || createResponse.statusText}`
      });
    }

    const createdUser = await createResponse.json();
    
    // Add user to Nexus Users group
    await addUserToGroup(createdUser.pk, 'Nexus Users');
    
    // Log user creation
    logger.info('User created successfully:', {
      userId: createdUser.pk,
      username: username,
      email,
      businessName,
      note: 'User created via signup flow'
    });

    try {
      await AuditService.recordEvent({
        eventType: 'user_create',
        objectType: 'auth_user',
        objectId: createdUser.pk && createdUser.pk.toString ? createdUser.pk.toString() : createdUser.pk,
        actorId: null,
        endpoint: '/api/auth/create-user',
        data: { username, email, businessName }
      });
    } catch (auditErr) {
      logger.warn('Failed to record audit for user creation', { error: auditErr?.message || auditErr });
    }

    res.json({
      success: true,
      userId: createdUser.pk.toString(),
      message: 'User created successfully! Please check your email to set your password and complete verification.'
    });

  } catch (error) {
    logger.error('Error creating user in Authentik:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/auth/update-business-info - Update existing user with business information after enrollment
router.post('/update-business-info', async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      industry,
      companySize,
      website,
      domain,
      firstName,
      lastName,
      email,
      phone,
      fundingStage,
      revenueRange,
      username
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !businessName || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, firstName, lastName, businessName, username'
      });
    }

    // Find existing user by email (user was created in Authentik enrollment flow)
    const userResponse = await fetch(`${AUTHENTIK_BASE_URL}/api/v3/core/users/?search=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
    });

    if (!userResponse.ok) {
      return res.status(500).json({
        success: false,
        error: 'Failed to find user'
      });
    }

    const userData = await userResponse.json();
    const existingUser = userData.results.find(user => user.email === email);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please complete the enrollment flow first.'
      });
    }

    // Update user attributes with business information
    // Derive domain from email when possible (avoid public email providers)
    const deriveDomain = (em) => {
      try {
        if (!em || !em.includes('@')) return '';
        const dom = em.split('@')[1].toLowerCase();
        const publicDomains = new Set(['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','proton.me','protonmail.com','aol.com','yandex.com','mail.com']);
        return publicDomains.has(dom) ? '' : dom;
      } catch (e) {
        return '';
      }
    };

    const updatedUserData = {
      ...existingUser,
      name: `${firstName} ${lastName}`,
      attributes: {
        ...existingUser.attributes,
        business_name: businessName,
        business_type: businessType || '',
        industry: industry || '',
        company_size: companySize || '',
        first_name: firstName,
        last_name: lastName,
        phone: phone || '',
        website: website || existingUser.attributes?.website || '',
        domain: (domain && domain.trim()) ? domain : (deriveDomain(email) || existingUser.attributes?.domain || ''),
        funding_stage: fundingStage || '',
        revenue_range: revenueRange || '',
        signup_completed: true,
        signup_completion_date: new Date().toISOString(),
        enrollment_flow_completed: true,
        business_profile_completed: true
      }
    };

    // Update user in Authentik
    const updateResponse = await fetch(`${AUTHENTIK_BASE_URL}/api/v3/core/users/${existingUser.pk}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
      body: JSON.stringify(updatedUserData),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      logger.error('Authentik user update failed:', errorData);
      return res.status(400).json({
        success: false,
        error: `Failed to update user: ${errorData.detail || updateResponse.statusText}`
      });
    }

    const updatedUser = await updateResponse.json();
    
    // Log user update
    logger.info('User business profile updated successfully:', {
      userId: updatedUser.pk,
      username: username,
      email,
      businessName,
      note: 'User completed enrollment flow and business information collection'
    });

    try {
      await AuditService.recordEvent({
        eventType: 'user_update',
        objectType: 'auth_user',
        objectId: updatedUser.pk && updatedUser.pk.toString ? updatedUser.pk.toString() : updatedUser.pk,
        actorId: null,
        endpoint: '/api/auth/update-business-info',
        data: { username, email, businessName }
      });
    } catch (auditErr) {
      logger.warn('Failed to record audit for user update', { error: auditErr?.message || auditErr });
    }

    // Sync company data to Nexus database
    // This ensures the company is created/updated with the correct business name
    // immediately when the user submits their business information
    try {
      const userId = updatedUser.pk.toString();
      
      // Prepare company data from the signup form
      const companyData = {
        businessName: businessName,
        companyName: businessName,
        industry: industry || 'Technology',
        companySize: companySize || '1-10',
        businessType: businessType || null,
        fundingStage: fundingStage || null,
        revenueRange: revenueRange || null,
        website: website || existingUser.attributes?.website || null,
        domain: (domain && domain.trim()) ? domain : (deriveDomain(email) || existingUser.attributes?.domain || null),
        // Pass along email to allow domain derivation deeper if needed
        emailForDomain: email
      };

      // Ensure company is created/updated with correct data
      const companyResult = await companyService.ensureCompanyForUser(
        userId,
        companyData,
        null // No JWT payload needed here since we have all the data
      );

      if (companyResult.success && companyResult.company) {
        logger.info('Company created/updated during signup', {
          userId: userId,
          companyId: companyResult.company.id,
          companyName: businessName
        });

        // Ensure user profile exists and is associated with the company
        await userProfileService.ensureUserProfile(
          userId,
          email,
          {
            company_id: companyResult.company.id,
            company_name: businessName,
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            signup_completed: true,
            business_profile_completed: true,
            onboarding_completed: true
          },
          {
            email: email,
            name: `${firstName} ${lastName}`,
            attributes: updatedUserData.attributes
          }
        );
        
        logger.info('User profile synced with company during signup', {
          userId: userId,
          email: email,
          companyId: companyResult.company.id
        });
      } else {
        logger.warn('Company creation failed during signup (non-blocking)', {
          userId: userId,
          error: companyResult.error || 'Unknown error'
        });
      }
    } catch (syncError) {
      logger.error('Failed to sync company during signup (non-blocking)', {
        error: syncError.message,
        stack: syncError.stack,
        userId: updatedUser.pk
      });
      // Don't fail the request - company can be created on next login
      // but log it prominently so we can monitor for issues
    }

    res.json({
      success: true,
      userId: updatedUser.pk.toString(),
      message: 'Business profile updated successfully! You can now access your Nexus dashboard.'
    });

  } catch (error) {
    logger.error('Error updating user business information:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/auth/check-user/:email - Check if a user already exists
router.get('/check-user/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter is required'
      });
    }

    if (!AUTHENTIK_BASE_URL || !AUTHENTIK_API_TOKEN) {
      logger.warn('AUTHENTIK config missing, returning user existence fallback', { email });
      return res.json({
        success: true,
        exists: false,
        note: 'authentik-unavailable-fallback'
      });
    }

    const response = await fetch(`${AUTHENTIK_BASE_URL}/api/v3/core/users/?search=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      logger.warn('Authentik user existence check failed, using fallback allow', { status: response.status, email });
      return res.json({
        success: true,
        exists: false,
        note: 'authentik-error-fallback'
      });
    }

    const data = await response.json();
    const userExists = data.results.some(user => (user.email || '').toLowerCase() === email.toLowerCase());

    res.json({
      success: true,
      exists: userExists
    });

  } catch (error) {
    logger.error('Error checking user existence:', { error, email: req.params?.email });
    res.json({
      success: true,
      exists: false,
      note: 'authentik-exception-fallback'
    });
  }
});

// PUT /api/auth/update-user - Update existing user with business information
router.put('/update-user', async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      industry,
      companySize,
      website,
      domain,
      firstName,
      lastName,
      email,
      phone,
      fundingStage,
      revenueRange,
      username
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !businessName || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, firstName, lastName, businessName, username'
      });
    }

    // Find existing user by email
    const userResponse = await fetch(`${AUTHENTIK_BASE_URL}/api/v3/core/users/?search=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
    });

    if (!userResponse.ok) {
      return res.status(500).json({
        success: false,
        error: 'Failed to find user'
      });
    }

    const userData = await userResponse.json();
    const existingUser = userData.results.find(user => user.email === email);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user attributes with business information
    // Derive domain from email when possible (avoid public email providers)
    const deriveDomain = (em) => {
      try {
        if (!em || !em.includes('@')) return '';
        const dom = em.split('@')[1].toLowerCase();
        const publicDomains = new Set(['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','proton.me','protonmail.com','aol.com','yandex.com','mail.com']);
        return publicDomains.has(dom) ? '' : dom;
      } catch (e) {
        return '';
      }
    };

    const updatedUserData = {
      ...existingUser,
      name: `${firstName} ${lastName}`,
      attributes: {
        ...existingUser.attributes,
        business_name: businessName,
        business_type: businessType || '',
        industry: industry || '',
        company_size: companySize || '',
        first_name: firstName,
        last_name: lastName,
        phone: phone || '',
        website: website || existingUser.attributes?.website || '',
        domain: (domain && domain.trim()) ? domain : (deriveDomain(email) || existingUser.attributes?.domain || ''),
        funding_stage: fundingStage || '',
        revenue_range: revenueRange || '',
        signup_completed: true,
        signup_completion_date: new Date().toISOString(),
        enrollment_flow_completed: true
      }
    };

    // Update user in Authentik
    const updateResponse = await fetch(`${AUTHENTIK_BASE_URL}/api/v3/core/users/${existingUser.pk}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
      body: JSON.stringify(updatedUserData),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      logger.error('Authentik user update failed:', errorData);
      return res.status(400).json({
        success: false,
        error: `Failed to update user: ${errorData.detail || updateResponse.statusText}`
      });
    }

    const updatedUser = await updateResponse.json();
    
    // Log user update
    logger.info('User updated successfully:', {
      userId: updatedUser.pk,
      username: username,
      email,
      businessName,
      note: 'User completed enrollment flow and business information collection'
    });

    res.json({
      success: true,
      userId: updatedUser.pk.toString(),
      message: 'User updated successfully with business information.'
    });

  } catch (error) {
    logger.error('Error updating user in Authentik:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/auth/user-details/:userId - Get user details by ID
router.get('/user-details/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID parameter is required'
      });
    }

    const response = await fetch(`${AUTHENTIK_BASE_URL}/api/v3/core/users/${userId}/`, {
      headers: {
        'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = await response.json();

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    logger.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/auth/check-username/:username - Check if a username is available
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username parameter is required'
      });
    }

    // Validate username format
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Username must be at least 3 characters long'
      });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username can only contain letters, numbers, underscores, and hyphens'
      });
    }

    // If Authentik configuration is missing, provide a non-blocking fallback
    if (!AUTHENTIK_BASE_URL || !AUTHENTIK_API_TOKEN) {
      logger.warn('AUTHENTIK config missing, returning username availability fallback', { username });
      return res.json({
        success: true,
        available: true,
        username,
        note: 'authentik-unavailable-fallback'
      });
    }

    const response = await fetch(`${AUTHENTIK_BASE_URL}/api/v3/core/users/?search=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
    }).catch((err) => {
      logger.warn('Failed to reach Authentik for check-user', { err: err?.message || err });
      return null;
    });

    if (!response) {
      // Authentik unreachable - return a safe fallback
      return res.status(503).json({
        success: false,
        error: 'Authentik service unavailable',
        note: 'authentik-unreachable'
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Authentik check-user failed', { status: response.status, errorData });
      const detail = (errorData && errorData.detail) ? String(errorData.detail).toLowerCase() : '';
      if (response.status === 401 || response.status === 403 || /token invalid|expired/.test(detail)) {
        return res.status(503).json({
          success: false,
          error: 'Authentik API token invalid or expired',
          note: 'authentik-token-invalid'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to check user existence',
        detail: errorData
      });
    }

    const data = await response.json();
    const userExists = Array.isArray(data.results) && data.results.some(user => user.email === email);

    res.json({
      success: true,
      exists: userExists
    });
    res.json({
      success: true,
      available: !userExists,
      username: username
    });

  } catch (error) {
    logger.error('Error checking username availability:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Helper functions
function generateUsername(email) {
  const baseUsername = email.split('@')[0];
  const timestamp = Date.now().toString().slice(-4);
  return `${baseUsername}${timestamp}`;
}

async function addUserToGroup(userId, groupName) {
  try {
    // Get group ID by name
    const groupsResponse = await fetch(`${AUTHENTIK_BASE_URL}/api/v3/core/groups/?search=${groupName}`, {
      headers: {
        'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
    });

    if (!groupsResponse.ok) {
      logger.error('Failed to fetch groups');
      return false;
    }

    const groupsData = await groupsResponse.json();
    const nexusUsersGroup = groupsData.results.find(group => 
      group.name.toLowerCase().includes('nexus users')
    );

    if (!nexusUsersGroup) {
      logger.error('Nexus Users group not found');
      return false;
    }

    // Add user to group
    const addToGroupResponse = await fetch(`${AUTHENTIK_BASE_URL}/api/v3/core/groups/${nexusUsersGroup.pk}/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
      body: JSON.stringify({ user: userId }),
    });

    return addToGroupResponse.ok;

  } catch (error) {
    logger.error('Error adding user to group:', error);
    return false;
  }
}

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
      // During public pages (e.g., signup), allow anonymous probe without error spam
      return res.status(200).json({
        success: true,
        data: {
          message: 'No token provided',
          userId: null,
          hasProfile: false
        }
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
      logger.debug('Invalid session token provided to session-info probe', {
        error: validationError instanceof Error ? validationError.message : String(validationError),
      });
      return res.status(200).json({
        success: true,
        data: {
          message: 'Invalid token',
          userId: null,
          hasProfile: false
        },
        code: 'INVALID_TOKEN'
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

// POST /api/auth/get-db-user-id - Get database user ID by email
router.post('/get-db-user-id', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Query the user_profiles table to get the user_id by email
    const userQuery = `
      SELECT user_id, email, first_name, last_name 
      FROM user_profiles 
      WHERE email = $1
      LIMIT 1
    `;
    
    const { data: users, error: queryError } = await query(userQuery, [email]);
    
    if (queryError) {
      logger.error('Failed to query user by email', { error: queryError, email });
      return res.status(500).json({
        success: false,
        error: 'Failed to query user'
      });
    }
    
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = users[0];
    
    logger.info('Found database user ID', { email, userId: user.user_id });

    return res.status(200).json({
      success: true,
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    });
  } catch (error) {
    logger.error('Error in get-db-user-id API', { error });
    return res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

module.exports = router;
