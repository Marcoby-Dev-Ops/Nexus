const { Pool } = require('pg');
const { logger } = require('../utils/logger');

// Database connection pool
let pool = null;
let connectionRetries = 0;
const MAX_RETRIES = 3;

/**
 * Get the database connection pool with improved error handling
 */
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db';

    pool = new Pool({
      connectionString,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Increased from 2s to 10s
      statement_timeout: 30000, // 30 second query timeout
      query_timeout: 30000, // 30 second query timeout
      application_name: 'nexus-api-server',
    });

    // Handle pool errors with retry logic
    pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
      
      // Reset pool on critical errors
      if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND') {
        logger.warn('Critical database error, resetting pool');
        pool = null;
      }
    });

    // Handle connect events
    pool.on('connect', (client) => {
      logger.info('New database client connected');
      connectionRetries = 0; // Reset retry counter on successful connection
    });

    // Handle acquire events
    pool.on('acquire', (client) => {
      logger.debug('Client acquired from pool');
    });

    // Handle release events
    pool.on('release', (client) => {
      logger.debug('Client released to pool');
    });
  }

  return pool;
}

/**
 * Set JWT claims on database connection for RLS policies
 */
async function setJWTClaims(client, jwtPayload) {
  if (!jwtPayload) {
    // Clear JWT claims if no payload provided
    await client.query("SELECT set_config('request.jwt.claims', '', true)");
    return;
  }

  try {
    // Set JWT claims as a JSON string that PostgreSQL can parse
    const claimsJson = JSON.stringify(jwtPayload);
    await client.query("SELECT set_config('request.jwt.claims', $1, true)", [claimsJson]);
    logger.debug('JWT claims set on database connection', { 
      sub: jwtPayload.sub,
      hasAdmin: !!jwtPayload.is_superuser 
    });
  } catch (error) {
    logger.warn('Failed to set JWT claims on database connection', { error: error.message });
    // Continue without JWT claims - this will cause RLS policies to fail
  }
}

/**
 * Test database connection with retry logic
 */
async function testConnection() {
  try {
    const result = await query('SELECT version() as version, current_timestamp as timestamp');
    if (result.error) {
      throw new Error(result.error);
    }
    return { 
      success: true, 
      version: result.data?.[0]?.version,
      timestamp: result.data?.[0]?.timestamp
    };
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Execute a query with automatic connection management and retry logic
 */
async function query(text, params, jwtPayload = null, retryCount = 0) {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  try {
    const client = await getPool().connect();
    
    try {
      // Set JWT claims for RLS policies
      await setJWTClaims(client, jwtPayload);
      
      const result = await client.query(text, params);
      return {
        data: result.rows,
        error: null,
        rowCount: result.rowCount
      };
    } catch (queryError) {
      logger.error('Database query error:', {
        error: queryError.message,
        code: queryError.code,
        query: text.substring(0, 100) + '...',
        params: params ? JSON.stringify(params).substring(0, 100) + '...' : 'none'
      });

      // Retry on specific errors
      if (retryCount < maxRetries && (
        queryError.code === 'ECONNRESET' ||
        queryError.code === 'ENOTFOUND' ||
        queryError.code === 'ETIMEDOUT' ||
        queryError.message.includes('connection')
      )) {
        logger.warn(`Retrying query (attempt ${retryCount + 1}/${maxRetries})`);
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return query(text, params, jwtPayload, retryCount + 1);
      }

      return {
        data: null,
        error: queryError instanceof Error ? queryError.message : 'Unknown database error',
        code: queryError.code
      };
    } finally {
      client.release();
    }
  } catch (connectionError) {
    logger.error('Database connection error:', connectionError);
    
    // Retry connection on specific errors
    if (retryCount < maxRetries && (
      connectionError.code === 'ECONNRESET' ||
      connectionError.code === 'ENOTFOUND' ||
      connectionError.code === 'ETIMEDOUT'
    )) {
      logger.warn(`Retrying connection (attempt ${retryCount + 1}/${maxRetries})`);
      
      // Reset pool on connection errors
      if (pool) {
        await pool.end();
        pool = null;
      }
      
      const delay = baseDelay * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return query(text, params, jwtPayload, retryCount + 1);
    }

    return {
      data: null,
      error: connectionError instanceof Error ? connectionError.message : 'Database connection failed',
      code: connectionError.code
    };
  }
}

/**
 * Execute a transaction with automatic rollback on error
 */
async function transaction(callback, jwtPayload = null) {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    
    // Set JWT claims for RLS policies
    await setJWTClaims(client, jwtPayload);
    
    const result = await callback(client);
    await client.query('COMMIT');
    return { data: result, error: null };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Transaction failed'
    };
  } finally {
    client.release();
  }
}

/**
 * Close the database pool
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

/**
 * Get pool statistics
 */
function getPoolStats() {
  if (!pool) {
    return { totalCount: 0, idleCount: 0, waitingCount: 0 };
  }
  
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

module.exports = { 
  query, 
  testConnection, 
  closePool, 
  transaction,
  getPoolStats
};
