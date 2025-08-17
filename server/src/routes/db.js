const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { 
  createError, 
  createValidationError, 
  createNotFoundError,
  createForbiddenError 
} = require('../middleware/errorHandler');
const { query, transaction, testConnection, getPoolStats } = require('../database/connection');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/db/test - Test database connection
 */
router.get('/test', async (req, res) => {
  try {
    const result = await testConnection();
    
    if (!result.success) {
      throw createError('Database connection failed', 503, 'DATABASE_UNAVAILABLE');
    }

    res.json({
      success: true,
      data: {
        status: 'connected',
        version: result.version,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    logger.error('Database test failed:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/db/test-table/:tableName - Test table query without authentication
 */
router.get('/test-table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { columns = '*', filter, orderBy, order = 'ASC', limit = 10 } = req.query;
    
    if (!tableName || typeof tableName !== 'string') {
      throw createValidationError('Table name is required', 'tableName');
    }

    const limitNum = parseInt(String(limit));
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw createValidationError('Limit must be between 1 and 100', 'limit');
    }

    let sql = `SELECT ${columns} FROM "${tableName}"`;
    const params = [];
    let paramIndex = 1;

    // Parse filter if provided
    let filterObj = filter;
    if (typeof filter === 'string') {
      try {
        filterObj = JSON.parse(decodeURIComponent(filter));
      } catch (e) {
        const urlParams = new URLSearchParams(filter);
        filterObj = {};
        for (const [key, value] of urlParams.entries()) {
          if (key.startsWith('filter[') && key.endsWith(']')) {
            const actualKey = key.slice(7, -1);
            filterObj[actualKey] = value;
          }
        }
      }
    }

    if (filterObj && typeof filterObj === 'object') {
      const conditions = [];
      for (const [key, value] of Object.entries(filterObj)) {
        // Handle column name mapping for backward compatibility
        let columnName = key;
        if (key === 'user_id') {
          // Map user_id to userid for tables that use the old naming convention
          const tablesWithUserid = ['personal_thoughts', 'deals', 'contacts', 'business_health'];
          if (tablesWithUserid.includes(tableName)) {
            columnName = 'userid';
          }
          // For test routes, we need to handle the UUID conversion differently
          // Since this route doesn't have authentication, we'll need to handle it manually
          // For now, let's skip user_id filters in test routes to avoid UUID issues
          continue;
        }
        conditions.push(`"${columnName}" = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    if (orderBy && typeof orderBy === 'string') {
      const validOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      sql += ` ORDER BY "${orderBy}" ${validOrder}`;
    }

    sql += ` LIMIT $${paramIndex}`;
    params.push(limitNum);

    logger.info('Executing test table query', { 
      tableName,
      columns: String(columns),
      filter: filterObj,
      limit: limitNum,
      sql
    });

    const result = await query(sql, params);
    
    if (result.error) {
      throw createError(`Failed to query table '${tableName}': ${result.error}`, 500, 'QUERY_ERROR');
    }

    res.json({
      success: true,
      data: result.data,
      rowCount: result.rowCount,
      sql: sql,
      params: params
    });
  } catch (error) {
    logger.error('Failed to query test table:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'QUERY_ERROR'
    });
  }
});

/**
 * GET /api/db/stats - Get database pool statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = getPoolStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get pool stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database statistics',
      code: 'STATS_ERROR'
    });
  }
});

/**
 * POST /api/db/query - Execute a database query
 */
router.post('/query', authenticateToken, async (req, res) => {
  try {
    const { sql, params = [] } = req.body;

    // Validate input
    if (!sql || typeof sql !== 'string') {
      throw createValidationError('SQL query is required and must be a string', 'sql');
    }

    if (!Array.isArray(params)) {
      throw createValidationError('Parameters must be an array', 'params');
    }

    // Prevent dangerous operations
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE'];
    const upperSql = sql.toUpperCase();
    
    if (dangerousKeywords.some(keyword => upperSql.includes(keyword))) {
      throw createForbiddenError('Dangerous database operations are not allowed');
    }

    logger.info('Executing database query', { 
      userId: req.user?.id,
      sqlLength: sql.length,
      paramCount: params.length 
    });

    const result = await query(sql, params);
    
    if (result.error) {
      throw createError(`Database query failed: ${result.error}`, 500, 'QUERY_ERROR');
    }

    res.json({
      success: true,
      data: result.data,
      rowCount: result.rowCount
    });
  } catch (error) {
    logger.error('Database query failed:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'QUERY_ERROR'
    });
  }
});

/**
 * POST /api/db/transaction - Execute a database transaction
 */
router.post('/transaction', authenticateToken, async (req, res) => {
  try {
    const { operations } = req.body;

    // Validate input
    if (!Array.isArray(operations) || operations.length === 0) {
      throw createValidationError('Operations array is required and must not be empty', 'operations');
    }

    // Validate each operation
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      if (!op.sql || typeof op.sql !== 'string') {
        throw createValidationError(`Operation ${i} must have a valid SQL query`, `operations[${i}].sql`);
      }
      if (op.params && !Array.isArray(op.params)) {
        throw createValidationError(`Operation ${i} parameters must be an array`, `operations[${i}].params`);
      }
    }

    // Prevent dangerous operations
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE'];
    for (let i = 0; i < operations.length; i++) {
      const upperSql = operations[i].sql.toUpperCase();
      if (dangerousKeywords.some(keyword => upperSql.includes(keyword))) {
        throw createForbiddenError(`Dangerous operation detected in operation ${i}`);
      }
    }

    logger.info('Executing database transaction', { 
      userId: req.user?.id,
      operationCount: operations.length 
    });

    const result = await transaction(async (client) => {
      const results = [];
      for (const operation of operations) {
        const queryResult = await client.query(operation.sql, operation.params || []);
        results.push({
          data: queryResult.rows,
          rowCount: queryResult.rowCount
        });
      }
      return results;
    });

    if (result.error) {
      throw createError(`Transaction failed: ${result.error}`, 500, 'TRANSACTION_ERROR');
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Database transaction failed:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'TRANSACTION_ERROR'
    });
  }
});

/**
 * GET /api/db/tables - List database tables
 */
router.get('/tables', authenticateToken, async (req, res) => {
  try {
    const sql = `
      SELECT 
        table_name,
        table_schema,
        table_type
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name
    `;

    const result = await query(sql);
    
    if (result.error) {
      throw createError(`Failed to list tables: ${result.error}`, 500, 'QUERY_ERROR');
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Failed to list tables:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'QUERY_ERROR'
    });
  }
});

/**
 * GET /api/db/table/:tableName - Get table schema
 */
router.get('/table/:tableName', authenticateToken, async (req, res) => {
  try {
    const { tableName } = req.params;

    if (!tableName || typeof tableName !== 'string') {
      throw createValidationError('Table name is required', 'tableName');
    }

    const sql = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `;

    const result = await query(sql, [tableName]);
    
    if (result.error) {
      throw createError(`Failed to get table schema: ${result.error}`, 500, 'QUERY_ERROR');
    }

    if (result.data.length === 0) {
      throw createNotFoundError(`Table '${tableName}' not found`);
    }

    res.json({
      success: true,
      data: {
        tableName,
        columns: result.data
      }
    });
  } catch (error) {
    logger.error('Failed to get table schema:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'QUERY_ERROR'
    });
  }
});

/**
 * GET /api/db/table/:tableName/data - Get table data with pagination
 */
router.get('/table/:tableName/data', authenticateToken, async (req, res) => {
  try {
    const { tableName } = req.params;
    const page = req.query.page ? String(req.query.page) : '1';
    const limit = req.query.limit ? String(req.query.limit) : '50';
    const orderBy = req.query.orderBy ? String(req.query.orderBy) : undefined;
    const order = req.query.order ? String(req.query.order) : 'ASC';

    if (!tableName || typeof tableName !== 'string') {
      throw createValidationError('Table name is required', 'tableName');
    }

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      throw createValidationError('Page must be a positive integer', 'page');
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      throw createValidationError('Limit must be between 1 and 1000', 'limit');
    }

    const offset = (pageNum - 1) * limitNum;

    // Build query with optional ordering
    let sql = `SELECT * FROM "${tableName}"`;
    const params = [];

    if (orderBy && typeof orderBy === 'string') {
      const validOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      sql += ` ORDER BY "${orderBy}" ${validOrder}`;
    }

    sql += ` LIMIT $1 OFFSET $2`;
    params.push(limitNum, offset);

    const result = await query(sql, params);
    
    if (result.error) {
      throw createError(`Failed to get table data: ${result.error}`, 500, 'QUERY_ERROR');
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM "${tableName}"`);
    
    if (countResult.error) {
      logger.warn('Failed to get total count:', countResult.error);
    }

    const total = countResult.data?.[0]?.total || 0;

    res.json({
      success: true,
      data: {
        tableName,
        rows: result.data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: parseInt(total),
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get table data:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'QUERY_ERROR'
    });
  }
});

/**
 * POST /api/db/:tableName - Insert data into specific table
 */
router.post('/:tableName', authenticateToken, async (req, res) => {
  try {
    const { tableName } = req.params;
    const data = req.body;

    if (!tableName || typeof tableName !== 'string') {
      throw createValidationError('Table name is required', 'tableName');
    }

    if (!data || typeof data !== 'object') {
      throw createValidationError('Data object is required', 'data');
    }

    // Handle user_id conversion from external to internal ID
    let processedData = { ...data };
    if (data.user_id) {
      // For user_id fields, always use the authenticated user's internal ID
      // This ensures security and prevents users from inserting data for other users
      processedData.user_id = req.user?.id;
      
      if (!processedData.user_id) {
        logger.warn('No internal user ID available for insert', { 
          externalUserId: req.user?.externalId,
          requestedUserId: data.user_id 
        });
        throw createError('Authentication required for user_id operations', 401, 'AUTH_REQUIRED');
      }
    }

    const columns = Object.keys(processedData);
    const values = Object.values(processedData);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const sql = `
      INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    logger.info('Inserting data into table', { 
      userId: req.user?.id,
      tableName,
      columns: columns.length,
      originalUserId: data.user_id,
      processedUserId: processedData.user_id
    });

    const result = await query(sql, values);
    
    if (result.error) {
      throw createError(`Failed to insert into table '${tableName}': ${result.error}`, 500, 'QUERY_ERROR');
    }

    res.json({
      success: true,
      data: result.data?.[0] || null,
      rowCount: result.rowCount
    });
  } catch (error) {
    logger.error('Failed to insert into table:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'QUERY_ERROR'
    });
  }
});

/**
 * POST /api/db/:tableName/upsert - Upsert data into specific table
 */
router.post('/:tableName/upsert', authenticateToken, async (req, res) => {
  try {
    const { tableName } = req.params;
    const { data, onConflict } = req.body;

    if (!tableName || typeof tableName !== 'string') {
      throw createValidationError('Table name is required', 'tableName');
    }

    if (!data || typeof data !== 'object') {
      throw createValidationError('Data object is required', 'data');
    }

    if (!onConflict || typeof onConflict !== 'string') {
      throw createValidationError('OnConflict parameter is required', 'onConflict');
    }

    // Handle user_id conversion from external to internal ID
    let processedData = { ...data };
    if (data.user_id) {
      // For user_id fields, always use the authenticated user's internal ID
      // This ensures security and prevents users from upserting data for other users
      processedData.user_id = req.user?.id;
      
      if (!processedData.user_id) {
        logger.warn('No internal user ID available for upsert', { 
          externalUserId: req.user?.externalId,
          requestedUserId: data.user_id 
        });
        throw createError('Authentication required for user_id operations', 401, 'AUTH_REQUIRED');
      }
    }

    const columns = Object.keys(processedData);
    const values = Object.values(processedData);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    // Build the ON CONFLICT clause
    const conflictColumns = onConflict.split(',').map(col => col.trim());
    const conflictClause = conflictColumns.map(col => `"${col}"`).join(', ');

    const sql = `
      INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT (${conflictClause})
      DO UPDATE SET
        ${columns.map((col, index) => `"${col}" = EXCLUDED."${col}"`).join(', ')}
      RETURNING *
    `;

    logger.info('Upserting data into table', { 
      userId: req.user?.id,
      tableName,
      columns: columns.length,
      onConflict,
      originalUserId: data.user_id,
      processedUserId: processedData.user_id
    });

    const result = await query(sql, values);
    
    if (result.error) {
      throw createError(`Failed to upsert into table '${tableName}': ${result.error}`, 500, 'QUERY_ERROR');
    }

    res.json({
      success: true,
      data: result.data?.[0] || null,
      rowCount: result.rowCount
    });
  } catch (error) {
    logger.error('Failed to upsert into table:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'QUERY_ERROR'
    });
  }
});

/**
 * GET /api/db/:tableName/:id - Get specific record by ID
 */
router.get('/:tableName/:id', authenticateToken, async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const { idColumn = 'id' } = req.query;

    if (!tableName || typeof tableName !== 'string') {
      throw createValidationError('Table name is required', 'tableName');
    }

    if (!id) {
      throw createValidationError('ID is required', 'id');
    }

    // Handle user_id conversion from external to internal ID
    let queryId = id;
    if (idColumn === 'user_id' && id !== req.user?.externalId) {
      try {
        // Try to find the internal user ID from user_mappings first
        const mappingQuery = 'SELECT internal_user_id FROM user_mappings WHERE external_user_id = $1';
        const { data: mappings, error: mappingError } = await query(mappingQuery, [id]);
        
        if (!mappingError && mappings && mappings.length > 0) {
          queryId = mappings[0].internal_user_id;
        } else {
          // Try external_user_mappings as fallback
          const externalMappingQuery = 'SELECT internal_user_id FROM external_user_mappings WHERE external_user_id = $1';
          const { data: externalMappings, error: externalMappingError } = await query(externalMappingQuery, [id]);
          
          if (!externalMappingError && externalMappings && externalMappings.length > 0) {
            queryId = externalMappings[0].internal_user_id;
          }
        }
      } catch (error) {
        logger.warn('Failed to convert external user ID to internal ID for get', { externalUserId: id, error: error.message });
        // Use the authenticated user's internal ID as fallback
        queryId = req.user?.id;
      }
    } else if (idColumn === 'user_id' && id === req.user?.externalId) {
      // Use the authenticated user's internal ID
      queryId = req.user?.id;
    }

    const sql = `
      SELECT * FROM "${tableName}" 
      WHERE "${idColumn}" = $1
    `;

    logger.info('Getting record from table', { 
      userId: req.user?.id,
      tableName,
      originalId: id,
      queryId,
      idColumn 
    });

    const result = await query(sql, [queryId]);
    
    if (result.error) {
      throw createError(`Failed to get record from table '${tableName}': ${result.error}`, 500, 'QUERY_ERROR');
    }

    if (result.rowCount === 0) {
      throw createNotFoundError(`Record with ${idColumn} '${id}' not found in table '${tableName}'`);
    }

    res.json({
      success: true,
      data: result.data?.[0] || null,
      rowCount: result.rowCount
    });
  } catch (error) {
    logger.error('Failed to get record from table:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'QUERY_ERROR'
    });
  }
});

/**
 * PUT /api/db/:tableName/:id - Update data in specific table
 */
router.put('/:tableName/:id', authenticateToken, async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const { idColumn: bodyIdColumn, ...data } = req.body;
    const queryIdColumn = req.query.idColumn;
    const idColumn = bodyIdColumn || queryIdColumn || 'id';

    if (!tableName || typeof tableName !== 'string') {
      throw createValidationError('Table name is required', 'tableName');
    }

    if (!id) {
      throw createValidationError('ID is required', 'id');
    }

    if (!data || Object.keys(data).length === 0) {
      throw createValidationError('Update data is required', 'data');
    }

    // Handle user_id conversion from external to internal ID in update data
    let processedData = { ...data };
    if (data.user_id) {
      // For user_id fields, always use the authenticated user's internal ID
      // This ensures security and prevents users from updating data for other users
      processedData.user_id = req.user?.id;
      
      if (!processedData.user_id) {
        logger.warn('No internal user ID available for update', { 
          externalUserId: req.user?.externalId,
          requestedUserId: data.user_id 
        });
        throw createError('Authentication required for user_id operations', 401, 'AUTH_REQUIRED');
      }
    }

    // Handle conversion of the ID parameter in the URL path when idColumn is user_id
    let queryId = id;
    if (idColumn === 'user_id') {
      // For user_id as ID column, always use the authenticated user's internal ID
      // This ensures security and prevents users from updating other users' data
      queryId = req.user?.id;
      
      if (!queryId) {
        logger.warn('No internal user ID available for user_id query', { 
          externalUserId: req.user?.externalId,
          requestedId: id 
        });
        throw createError('Authentication required for user_id operations', 401, 'AUTH_REQUIRED');
      }
    }

    const columns = Object.keys(processedData);
    const values = Object.values(processedData);
    const setClause = columns.map((col, index) => `"${col}" = $${index + 1}`).join(', ');

    const sql = `
      UPDATE "${tableName}" 
      SET ${setClause}
      WHERE "${idColumn}" = $${values.length + 1}
      RETURNING *
    `;

    values.push(queryId);

    logger.info('Updating data in table', { 
      userId: req.user?.id,
      tableName,
      originalId: id,
      queryId,
      idColumn,
      columns: columns.length,
      originalUserId: data.user_id,
      processedUserId: processedData.user_id
    });

    const result = await query(sql, values);
    
    if (result.error) {
      throw createError(`Failed to update table '${tableName}': ${result.error}`, 500, 'QUERY_ERROR');
    }

    if (result.rowCount === 0) {
      throw createNotFoundError(`Record with ${idColumn} '${queryId}' not found in table '${tableName}'`);
    }

    res.json({
      success: true,
      data: result.data?.[0] || null,
      rowCount: result.rowCount
    });
  } catch (error) {
    logger.error('Failed to update table:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'QUERY_ERROR'
    });
  }
});

/**
 * DELETE /api/db/:tableName/:id - Delete data from specific table
 */
router.delete('/:tableName/:id', authenticateToken, async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const { idColumn = 'id' } = req.query;

    if (!tableName || typeof tableName !== 'string') {
      throw createValidationError('Table name is required', 'tableName');
    }

    if (!id) {
      throw createValidationError('ID is required', 'id');
    }

    const sql = `
      DELETE FROM "${tableName}" 
      WHERE "${idColumn}" = $1
      RETURNING *
    `;

    logger.info('Deleting data from table', { 
      userId: req.user?.id,
      tableName,
      id,
      idColumn 
    });

    const result = await query(sql, [id]);
    
    if (result.error) {
      throw createError(`Failed to delete from table '${tableName}': ${result.error}`, 500, 'QUERY_ERROR');
    }

    if (result.rowCount === 0) {
      throw createNotFoundError(`Record with ${idColumn} '${id}' not found in table '${tableName}'`);
    }

    res.json({
      success: true,
      data: result.data?.[0] || null,
      rowCount: result.rowCount
    });
  } catch (error) {
    logger.error('Failed to delete from table:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'QUERY_ERROR'
    });
  }
});

/**
 * GET /api/db/:tableName - Get data from specific table with filtering
 */
router.get('/:tableName', authenticateToken, async (req, res) => {
  try {
    const { tableName } = req.params;
    const { columns = '*', filter, orderBy, order = 'ASC', limit = 1000 } = req.query;

    if (!tableName || typeof tableName !== 'string') {
      throw createValidationError('Table name is required', 'tableName');
    }

    // Validate limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      throw createValidationError('Limit must be between 1 and 1000', 'limit');
    }

    // Build SELECT clause
    let sql = `SELECT ${columns} FROM "${tableName}"`;
    const params = [];
    let paramIndex = 1;

    // Add WHERE clause for filters
    // Handle both object and URL-encoded filter formats
    let filterObj = filter;
    if (typeof filter === 'string') {
      try {
        filterObj = JSON.parse(decodeURIComponent(filter));
      } catch (e) {
        // Try parsing as URL-encoded key-value pairs
        const urlParams = new URLSearchParams(filter);
        filterObj = {};
        for (const [key, value] of urlParams.entries()) {
          if (key.startsWith('filter[') && key.endsWith(']')) {
            const actualKey = key.slice(7, -1); // Remove 'filter[' and ']'
            filterObj[actualKey] = value;
          }
        }
      }
    }

    if (filterObj && typeof filterObj === 'object') {
      const conditions = [];
      for (const [key, value] of Object.entries(filterObj)) {
        // Handle user_id conversion from external to internal ID
        if (key === 'user_id') {
          // For user_id filters, always use the authenticated user's internal ID
          // This ensures security and prevents users from accessing other users' data
          const internalUserId = req.user?.id;
          
          if (internalUserId) {
            conditions.push(`"${key}" = $${paramIndex}`);
            params.push(internalUserId);
            paramIndex++;
          } else {
            logger.warn('No internal user ID available for user_id filter', { 
              externalUserId: req.user?.externalId,
              requestedUserId: value 
            });
            // Skip this condition if no internal user ID is available
          }
        } else {
          conditions.push(`"${key}" = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    // Add ORDER BY clause
    if (orderBy && typeof orderBy === 'string') {
      const validOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      sql += ` ORDER BY "${orderBy}" ${validOrder}`;
    }

    // Add LIMIT clause
    sql += ` LIMIT $${paramIndex}`;
    params.push(limitNum);

    logger.info('Executing table query', { 
      userId: req.user?.id,
      tableName,
      columns,
      filter: filterObj,
      limit: limitNum 
    });

    const result = await query(sql, params);
    
    if (result.error) {
      throw createError(`Failed to query table '${tableName}': ${result.error}`, 500, 'QUERY_ERROR');
    }

    res.json({
      success: true,
      data: result.data,
      rowCount: result.rowCount
    });
  } catch (error) {
    logger.error('Failed to query table:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      code: error.code || 'QUERY_ERROR'
    });
  }
});



module.exports = router;
