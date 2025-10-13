const redis = require('redis');
const { logger } = require('../utils/logger');

let redisClient = null;
let isRedisConnected = false;

/**
 * Initialize and return Redis client for rate limiting
 * Falls back gracefully if Redis is not available
 */
async function getRedisClient() {
  // Return existing client if already connected
  if (redisClient && isRedisConnected) {
    return redisClient;
  }

  // Check if Redis is enabled
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.warn('REDIS_URL not configured - rate limiting will use in-memory store (not recommended for production)');
    return null;
  }

  try {
    // Create Redis client
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          // Retry with exponential backoff, max 10 seconds
          if (retries > 10) {
            logger.error('Redis connection failed after 10 retries');
            return new Error('Redis connection retry limit exceeded');
          }
          const delay = Math.min(retries * 100, 10000);
          logger.info(`Redis reconnection attempt ${retries}, waiting ${delay}ms`);
          return delay;
        },
        connectTimeout: 10000
      }
    });

    // Error handling
    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
      isRedisConnected = true;
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis client reconnecting...');
      isRedisConnected = false;
    });

    redisClient.on('end', () => {
      logger.info('Redis client connection ended');
      isRedisConnected = false;
    });

    // Connect to Redis
    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    logger.info('Redis connection established successfully');
    
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    logger.warn('Rate limiting will fall back to in-memory store');
    redisClient = null;
    isRedisConnected = false;
    return null;
  }
}

/**
 * Close Redis connection gracefully
 */
async function closeRedisClient() {
  if (redisClient && isRedisConnected) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
      // Force disconnect if graceful quit fails
      try {
        await redisClient.disconnect();
      } catch (disconnectError) {
        logger.error('Error disconnecting Redis:', disconnectError);
      }
    }
    redisClient = null;
    isRedisConnected = false;
  }
}

/**
 * Check if Redis is connected
 */
function isConnected() {
  return isRedisConnected && redisClient !== null;
}

module.exports = {
  getRedisClient,
  closeRedisClient,
  isConnected
};
