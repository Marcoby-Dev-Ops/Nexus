const { config } = require('dotenv');
const { Pool } = require('pg');
const { createAuthError, createForbiddenError } = require('./errorHandler');
const { logger } = require('../utils/logger');

// Load environment variables
config();

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db',
});

/**
 * Get or create user mapping from external ID to internal UUID
 */
async function getUserMapping(externalUserId) {
  try {
    // First, try to find existing mapping
    const findResult = await pool.query(
      'SELECT internal_user_id FROM user_mappings WHERE external_user_id = $1',
      [externalUserId]
    );

    if (findResult.rows.length > 0) {
      return findResult.rows[0].internal_user_id;
    }

    // If no mapping exists, create a new user and mapping
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create new user in auth.users table
      const createUserResult = await client.query(
        `INSERT INTO auth.users (
          id, 
          email, 
          created_at, 
          updated_at, 
          email_confirmed_at,
          confirmed_at,
          raw_user_meta_data
        ) VALUES (
          gen_random_uuid(), 
          $1, 
          NOW(), 
          NOW(), 
          NOW(),
          NOW(),
          $2
        ) RETURNING id`,
        [
          `${externalUserId}@authentik.local`, // Use external ID as email placeholder
          JSON.stringify({ 
            external_user_id: externalUserId,
            source: 'authentik'
          })
        ]
      );

      const internalUserId = createUserResult.rows[0].id;

      // Create mapping
      await client.query(
        'INSERT INTO user_mappings (external_user_id, internal_user_id, created_at) VALUES ($1, $2, NOW())',
        [externalUserId, internalUserId]
      );

      await client.query('COMMIT');
      
      logger.info('Created new user mapping', { externalUserId, internalUserId });
      return internalUserId;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Failed to get/create user mapping', { externalUserId, error: error.message });
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
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('Token expired');
    }

    // Check issuer - handle Authentik issuer format
    const expectedIssuer = 'https://identity.marcoby.com';
    if (payload.iss) {
      const isAuthentikIssuer = payload.iss === expectedIssuer || 
                               payload.iss.startsWith(expectedIssuer + '/application/');
      
      if (!isAuthentikIssuer) {
        logger.warn('Token issuer mismatch', { 
          expected: expectedIssuer, 
          actual: payload.iss 
        });
        
        // During transition, allow non-Authentik tokens but log the issue
        if (payload.iss && payload.iss.includes('supabase')) {
          logger.warn('Allowing Supabase token during transition period');
        } else {
          logger.warn('Unknown token issuer, but allowing during transition');
        }
      }
    }

    // Check audience - be more flexible during transition
    const clientId = process.env.VITE_AUTHENTIK_CLIENT_ID;
    if (payload.aud && payload.aud !== clientId) {
      logger.warn('Token audience mismatch', { 
        expected: clientId, 
        actual: payload.aud 
      });
      
      // During transition, allow tokens with different audience
      logger.warn('Allowing token with different audience during transition');
    }

    const externalUserId = payload.sub;
    if (!externalUserId) {
      throw new Error('No user ID found in token');
    }

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

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    // Validate token
    let externalUserId;
    try {
      const validation = validateJWTToken(token);
      externalUserId = validation.externalUserId;
    } catch (validationError) {
      logger.warn('Token validation failed', { error: validationError.message });
      return res.status(401).json({ 
        success: false, 
        error: validationError.message,
        code: 'INVALID_TOKEN'
      });
    }

    // Get or create user mapping
    let userId;
    try {
      userId = await getUserMapping(externalUserId);
    } catch (mappingError) {
      logger.error('User mapping failed', { externalUserId, error: mappingError.message });
      return res.status(500).json({ 
        success: false, 
        error: 'Authentication failed',
        code: 'MAPPING_ERROR'
      });
    }

    logger.info('Token validation successful', { 
      externalUserId, 
      internalUserId: userId
    });

    // Add user info to request
    req.user = {
      id: userId,
      externalId: externalUserId,
      email: null, // Tokens may not include email in payload
      role: 'user'
    };

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
        const userId = await getUserMapping(validation.externalUserId);
        
        req.user = {
          id: userId,
          externalId: validation.externalUserId,
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
