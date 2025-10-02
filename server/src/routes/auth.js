const { Router } = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { query } = require('../database/connection');

// Authentik configuration
const AUTHENTIK_BASE_URL = process.env.AUTHENTIK_BASE_URL || 'https://identity.marcoby.com';
const AUTHENTIK_API_TOKEN = process.env.AUTHENTIK_API_TOKEN;

const AuditService = require('../services/AuditService');
const router = Router();

// POST /api/auth/create-user - Create new user in Authentik
router.post('/create-user', async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      industry,
      companySize,
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
      const errorData = await createResponse.json();
      logger.error('Authentik user creation failed:', errorData);
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

    const response = await fetch(`${AUTHENTIK_BASE_URL}/api/v3/core/users/?search=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: 'Failed to check user existence'
      });
    }

    const data = await response.json();
    const userExists = data.results.some(user => user.email === email);

    res.json({
      success: true,
      exists: userExists
    });

  } catch (error) {
    logger.error('Error checking user existence:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
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

    const response = await fetch(`${AUTHENTIK_BASE_URL}/api/v3/core/users/?search=${encodeURIComponent(username)}`, {
      headers: {
        'Authorization': `Bearer ${AUTHENTIK_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: 'Failed to check username availability'
      });
    }

    const data = await response.json();
    const userExists = data.results.some(user => user.username === username);

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
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 'NO_TOKEN'
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
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        details: validationError.message
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
