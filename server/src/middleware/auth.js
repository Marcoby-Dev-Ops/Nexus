require('../../loadEnv');

const { createAuthError, createForbiddenError } = require('./errorHandler');
const { logger } = require('../utils/logger');
const userProfileService = require('../services/UserProfileService');

/**
 * Get or create user profile using unified service
 */
async function getOrCreateUserProfile(authentikUserId, userEmail = null, jwtPayload = null) {
  try {
    const result = await userProfileService.ensureUserProfile(authentikUserId, userEmail, {}, jwtPayload);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    logger.info('User profile ready', { 
      authentikUserId, 
      profileExists: true,
      wasCreated: result.created 
    });
    
    return authentikUserId;

  } catch (error) {
    logger.error('Failed to get/create user profile', { authentikUserId, error: error.message });
    throw new Error('Failed to authenticate user');
  }
}

/**
 * Validate JWT token with improved error handling
 */
function validateJWTToken(token) {
  try {
    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Log the full payload for debugging
    logger.info('Token validation - payload:', {
      sub: payload.sub,
      iss: payload.iss,
      aud: payload.aud,
      exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
      iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
      now: new Date().toISOString()
    });
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      logger.warn('Token expired', {
        tokenExp: new Date(payload.exp * 1000).toISOString(),
        now: new Date().toISOString()
      });
      throw new Error('Token expired');
    }

    // Check issuer - be more permissive during debugging
    const expectedIssuer = 'https://identity.marcoby.com';
    if (payload.iss) {
      const isAuthentikIssuer = payload.iss === expectedIssuer || 
                               payload.iss.startsWith(expectedIssuer + '/application/');
      
      if (!isAuthentikIssuer) {
        logger.warn('Token issuer mismatch', { 
          expected: expectedIssuer, 
          actual: payload.iss 
        });
        
        // Strict issuer validation for production
        throw new Error('Invalid token issuer');
      }
    }

    // Check audience - be more permissive during debugging
    const clientId = process.env.AUTHENTIK_CLIENT_ID;
    if (payload.aud && payload.aud !== clientId) {
      logger.warn('Token audience mismatch', { 
        expected: clientId, 
        actual: payload.aud 
      });
      
      // Strict audience validation for production
      throw new Error('Invalid token audience');
    }

    const externalUserId = payload.sub;
    if (!externalUserId) {
      throw new Error('No user ID found in token');
    }

    logger.info('Token validation successful', { externalUserId });
    return { externalUserId, payload };

  } catch (error) {
    logger.warn('Token validation failed', { error: error.message });
    throw error;
  }
}

/**
 * Authenticate token middleware with improved error handling
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    logger.info('Authentication attempt', {
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      tokenLength: token?.length,
      endpoint: req.path,
      method: req.method
    });



    if (!token) {
      logger.warn('No token provided', { endpoint: req.path });
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    // Validate token
    let externalUserId;
    let jwtPayload;
    try {
      logger.info('Validating token...');
      const validation = validateJWTToken(token);
      externalUserId = validation.externalUserId;
      jwtPayload = validation.payload;
      logger.info('Token validation successful', { externalUserId });
    } catch (validationError) {
      logger.warn('Token validation failed', { 
        error: validationError.message,
        endpoint: req.path 
      });
      return res.status(401).json({ 
        success: false, 
        error: validationError.message,
        code: 'INVALID_TOKEN'
      });
    }

    // Get or create user profile
    let userId;
    try {
      logger.info('Getting/creating user profile', { externalUserId, email: jwtPayload.email });
      userId = await getOrCreateUserProfile(externalUserId, jwtPayload.email, jwtPayload);
      logger.info('User profile ready', { externalUserId, userId });
    } catch (profileError) {
      logger.error('User profile creation failed', { 
        externalUserId, 
        error: profileError.message 
      });
      return res.status(500).json({ 
        success: false, 
        error: 'Authentication failed',
        code: 'PROFILE_ERROR'
      });
    }

    logger.info('Authentication successful', { 
      authentikUserId: externalUserId,
      internalUserId: userId
    });

    // Add user info to request
    req.user = {
      id: userId, // This is now the Authentik user ID
      email: jwtPayload.email || null, // Extract email from JWT payload
      role: 'user',
      jwtPayload: jwtPayload // Pass JWT payload for database RLS
    };

    // Debug logging
    logger.info('Authentication successful - user set in request', {
      authentikUserId: externalUserId,
      internalUserId: userId,
      jwtSub: jwtPayload.sub,
      userObject: req.user
    });

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication middleware
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const validation = validateJWTToken(token);
        const userId = await getOrCreateUserProfile(validation.externalUserId, validation.payload?.email, validation.payload);
        
        req.user = {
          id: userId, // This is now the Authentik user ID
          email: null,
          role: 'user'
        };
      } catch (error) {
        // Continue without authentication for optional routes
        logger.warn('Optional auth failed, continuing without user', { error: error.message });
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional routes
    logger.warn('Optional auth error (continuing):', error);
    next();
  }
};

/**
 * Require specific role middleware
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

/**
 * Require admin role middleware
 */
const requireAdmin = requireRole('admin');

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  validateJWTToken
};
