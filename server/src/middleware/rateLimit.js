const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

function computeRetryAfterSeconds(req) {
  try {
    const reset = req.rateLimit?.resetTime;
    if (reset instanceof Date) {
      return Math.max(0, Math.ceil((reset.getTime() - Date.now()) / 1000));
    }
    if (typeof reset === 'number') {
      // Some versions may expose a timestamp number
      return Math.max(0, Math.ceil((reset - Date.now()) / 1000));
    }
    return 60; // Fallback default
  } catch (e) {
    return 60;
  }
}

/**
 * General API rate limiter - applies to all routes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: computeRetryAfterSeconds(req)
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: computeRetryAfterSeconds(req)
    });
  }
});

/**
 * Dedicated limiter for OAuth token exchanges (slightly higher than authLimiter)
 * Allows a few retries (PKCE/state issues, StrictMode double invoke) without opening flood gates.
 */
const authTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    error: 'Too many OAuth token exchanges, please try again later.',
    code: 'AUTH_TOKEN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('OAuth token exchange rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: 'Too many OAuth token exchanges, please try again later.',
      code: 'AUTH_TOKEN_RATE_LIMIT_EXCEEDED',
      retryAfter: computeRetryAfterSeconds(req)
    });
  }
});

/**
 * OAuth state generation limiter (less strict than authLimiter)
 * Rationale: /api/oauth/state is a lightweight, non-destructive operation and
 * can legitimately be called multiple times while a user tests providers.
 */
const oauthStateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Allow up to 60 state requests per IP per window
  message: {
    success: false,
    error: 'Too many OAuth initiation attempts, please slow down.',
    code: 'OAUTH_STATE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('OAuth state rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: 'Too many OAuth initiation attempts, please slow down.',
      code: 'OAUTH_STATE_RATE_LIMIT_EXCEEDED',
      retryAfter: computeRetryAfterSeconds(req)
    });
  }
});

/**
 * Database operations rate limiter
 */
const dbLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many database operations, please try again later.',
    code: 'DB_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Database rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: 'Too many database operations, please try again later.',
      code: 'DB_RATE_LIMIT_EXCEEDED',
      retryAfter: computeRetryAfterSeconds(req)
    });
  }
});

/**
 * AI/ML operations rate limiter (more restrictive due to cost)
 */
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    error: 'Too many AI operations, please try again later.',
    code: 'AI_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: 'Too many AI operations, please try again later.',
      code: 'AI_RATE_LIMIT_EXCEEDED',
      retryAfter: computeRetryAfterSeconds(req)
    });
  }
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 uploads per windowMs
  message: {
    success: false,
    error: 'Too many file uploads, please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      error: 'Too many file uploads, please try again later.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: computeRetryAfterSeconds(req)
    });
  }
});

/**
 * Development mode rate limiter (more permissive)
 */
const devLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10000, // Much higher limit for development
  message: {
    success: false,
    error: 'Development rate limit exceeded.',
    code: 'DEV_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  authLimiter,
  authTokenLimiter,
  oauthStateLimiter,
  dbLimiter,
  aiLimiter,
  uploadLimiter,
  devLimiter
};
