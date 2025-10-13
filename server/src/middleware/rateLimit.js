const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

// Lazy-loaded Redis dependencies
let RedisStore = null;
let redisClient = null;

/**
 * Initialize Redis store for rate limiting (if REDIS_URL is set)
 * Falls back to in-memory store if Redis is not configured or fails to connect
 */
function initializeRedisStore() {
  const redisUrl = process.env.REDIS_URL;
  logger.info(`Initializing rate limit store. REDIS_URL configured: ${Boolean(redisUrl)}`);

  if (!redisUrl) {
    logger.warn('REDIS_URL not configured - using in-memory rate limiting store (OK for dev, not for multi-instance prod)');
    return false;
  }

  try {
    const redis = require('redis');
    // eslint-disable-next-line import/no-extraneous-dependencies
    RedisStore = require('rate-limit-redis').default;

    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnect retry limit exceeded');
            return new Error('Redis reconnect retry limit exceeded');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => logger.error('Redis client error:', err));
    redisClient.on('connect', () => logger.info('Redis client connected'));
    redisClient.on('ready', () => logger.info('Redis client ready for rate limiting'));
    redisClient.on('reconnecting', () => logger.warn('Redis client reconnecting...'));

    // Connect asynchronously; if this fails, the memory store will be used
    redisClient.connect().catch((err) => {
      logger.error('Failed to connect to Redis:', err);
      logger.warn('Rate limiting will fall back to in-memory store');
    });

    logger.info('Redis store initialization triggered');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Redis rate limiting store:', error);
    logger.warn('Falling back to in-memory rate limiting store');
    return false;
  }
}

// Initialize Redis at module load
const useRedis = initializeRedisStore();

/**
 * Create a Redis-backed store instance for express-rate-limit if available
 */
function createStore(prefix) {
  if (useRedis && RedisStore && redisClient) {
    try {
      return new RedisStore({
        // Bridge to node-redis v4 command format
        // @ts-expect-error: rate-limit-redis expects a sendCommand function signature
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: `rl:${prefix}:`
      });
    } catch (error) {
      logger.error(`Failed to create Redis store for ${prefix}:`, error);
      return undefined; // Fallback to in-memory
    }
  }
  return undefined; // In-memory store
}

/**
 * Key generator:
 * - If authenticated, use user:{id}
 * - Otherwise, use the request IP (as provided by Express trust proxy settings)
 */
function keyGenerator(req) {
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  return req.ip;
}

/**
 * Standard 429 handler with accurate retryAfter (seconds until reset)
 */
function createRateLimitHandler(limiterName, errorMessage, errorCode) {
  return (req, res) => {
    const resetTime = req.rateLimit?.resetTime ?? Date.now();
    const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));

    logger.warn(`${limiterName} rate limit exceeded`, {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      retryAfter
    });

    res.status(429).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      retryAfter
    });
  };
}

/**
 * General API rate limiter - applies to all routes by default
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('general'),
  keyGenerator,
  validate: false, // Suppress IPv6 validation warning for custom keyGenerator
  handler: createRateLimitHandler('General', 'Too many requests, please try again later.', 'RATE_LIMIT_EXCEEDED')
});

/**
 * Strict rate limiter for authentication endpoints
 * Only counts failed authentication attempts
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  // Do not rate limit lightweight public GETs like username checks
  skip: (req) => {
    const url = req.originalUrl || req.url;
    if (req.method === 'GET') {
      return /\/api\/auth\/check-username\//.test(url) || 
             /\/api\/auth\/check-user\//.test(url) ||
             /\/api\/auth\/session-info\b/.test(url);
    }

    if (req.method === 'POST') {
      return /\/api\/auth\/create-user\b/.test(url);
    }

    return false;
  },
  store: createStore('auth'),
  keyGenerator,
  validate: false,
  handler: createRateLimitHandler('Auth', 'Too many authentication attempts, please try again later.', 'AUTH_RATE_LIMIT_EXCEEDED')
});

/**
 * Database operations rate limiter
 */
const dbLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('db'),
  keyGenerator,
  validate: false,
  handler: createRateLimitHandler('Database', 'Too many database operations, please try again later.', 'DB_RATE_LIMIT_EXCEEDED')
});

/**
 * AI/ML operations rate limiter (more restrictive due to cost)
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('ai'),
  keyGenerator,
  validate: false,
  handler: createRateLimitHandler('AI', 'Too many AI operations, please try again later.', 'AI_RATE_LIMIT_EXCEEDED')
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('upload'),
  keyGenerator,
  validate: false,
  handler: createRateLimitHandler('Upload', 'Too many file uploads, please try again later.', 'UPLOAD_RATE_LIMIT_EXCEEDED')
});

/**
 * Development mode rate limiter (more permissive)
 * Optional: use Redis in dev if RATE_LIMIT_DEV_USE_REDIS=true
 */
const devUseRedis = String(process.env.RATE_LIMIT_DEV_USE_REDIS || '').toLowerCase() === 'true';
const devLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  store: devUseRedis ? createStore('dev') : undefined,
  keyGenerator,
  validate: false,
  handler: createRateLimitHandler('Development', 'Development rate limit exceeded.', 'DEV_RATE_LIMIT_EXCEEDED')
});

module.exports = {
  generalLimiter,
  authLimiter,
  dbLimiter,
  aiLimiter,
  uploadLimiter,
  devLimiter
};
