const { createClient } = require('redis');
const { logger } = require('./logger');

let client = null;
let isConnecting = false;

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function connect() {
    if (client && (client.isOpen || isConnecting)) {
        return client;
    }

    isConnecting = true;

    try {
        client = createClient({
            url: REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Redis max retries reached. Giving up.');
                        return new Error('Redis max retries reached');
                    }
                    const delay = Math.min(retries * 100, 3000);
                    return delay;
                }
            }
        });

        client.on('error', (err) => logger.error('Redis Client Error', err));
        client.on('connect', () => logger.info('Redis Client Connected'));
        client.on('reconnecting', () => logger.info('Redis Client Reconnecting'));

        await client.connect();
        isConnecting = false;
        return client;
    } catch (error) {
        isConnecting = false;
        logger.error('Failed to connect to Redis', error);
        // Don't throw, just return null so app can continue without cache
        return null;
    }
}

async function disconnect() {
    if (client && client.isOpen) {
        await client.quit();
        logger.info('Redis Client Disconnected');
    }
}

function getClient() {
    return client;
}

/**
 * Get a value from Redis and parse as JSON
 * @param {string} key 
 * @returns {Promise<any|null>}
 */
async function get(key) {
    if (!client || !client.isOpen) return null;
    try {
        const value = await client.get(key);
        if (!value) return null;
        return JSON.parse(value);
    } catch (error) {
        logger.error(`Redis Get Error for key ${key}`, error);
        return null;
    }
}

/**
 * Set a value in Redis (stored as JSON)
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds 
 */
async function set(key, value, ttlSeconds = 300) {
    if (!client || !client.isOpen) return;
    try {
        const stringValue = JSON.stringify(value);
        await client.set(key, stringValue, {
            EX: ttlSeconds
        });
    } catch (error) {
        logger.error(`Redis Set Error for key ${key}`, error);
    }
}

async function del(key) {
    if (!client || !client.isOpen) return;
    try {
        await client.del(key);
    } catch (error) {
        logger.error(`Redis Del Error for key ${key}`, error);
    }
}

module.exports = {
    connect,
    disconnect,
    getClient,
    get,
    set,
    del
};
