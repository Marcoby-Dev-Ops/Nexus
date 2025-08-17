/**
 * Error handling middleware with improved categorization and logging
 */
const errorHandler = (error, req, res, next) => {
  // Check if response has already been sent
  if (res.headersSent) {
    return next(error);
  }

  // Determine error type and appropriate status code
  let statusCode = 500;
  let errorMessage = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';

  // Categorize errors based on type and properties
  if (error.statusCode) {
    statusCode = error.statusCode;
    errorMessage = error.message || errorMessage;
    errorCode = error.code || getErrorCode(statusCode);
  } else if (error.code) {
    // Database errors
    switch (error.code) {
      case '23505': // unique_violation
        statusCode = 409;
        errorMessage = 'Resource already exists';
        errorCode = 'DUPLICATE_RESOURCE';
        break;
      case '23503': // foreign_key_violation
        statusCode = 400;
        errorMessage = 'Invalid reference';
        errorCode = 'INVALID_REFERENCE';
        break;
      case '42P01': // undefined_table
        statusCode = 500;
        errorMessage = 'Database schema error';
        errorCode = 'SCHEMA_ERROR';
        break;
      case 'ECONNREFUSED':
      case 'ENOTFOUND':
        statusCode = 503;
        errorMessage = 'Database service unavailable';
        errorCode = 'DATABASE_UNAVAILABLE';
        break;
      case 'ETIMEDOUT':
        statusCode = 504;
        errorMessage = 'Database request timeout';
        errorCode = 'DATABASE_TIMEOUT';
        break;
      default:
        if (error.code.startsWith('23')) {
          statusCode = 400;
          errorMessage = 'Data validation error';
          errorCode = 'VALIDATION_ERROR';
        } else if (error.code.startsWith('42')) {
          statusCode = 500;
          errorMessage = 'Database error';
          errorCode = 'DATABASE_ERROR';
        }
    }
  } else if (error.name) {
    // JavaScript errors
    switch (error.name) {
      case 'ValidationError':
        statusCode = 400;
        errorMessage = error.message || 'Validation failed';
        errorCode = 'VALIDATION_ERROR';
        break;
      case 'UnauthorizedError':
        statusCode = 401;
        errorMessage = error.message || 'Authentication required';
        errorCode = 'UNAUTHORIZED';
        break;
      case 'ForbiddenError':
        statusCode = 403;
        errorMessage = error.message || 'Access denied';
        errorCode = 'FORBIDDEN';
        break;
      case 'NotFoundError':
        statusCode = 404;
        errorMessage = error.message || 'Resource not found';
        errorCode = 'NOT_FOUND';
        break;
      case 'SyntaxError':
        statusCode = 400;
        errorMessage = 'Invalid request format';
        errorCode = 'INVALID_FORMAT';
        break;
      case 'TypeError':
        statusCode = 400;
        errorMessage = 'Invalid data type';
        errorCode = 'INVALID_TYPE';
        break;
    }
  }

  // Log error with appropriate level
  const logData = {
    message: error.message || errorMessage,
    stack: error.stack,
    url: req.url,
    method: req.method,
    statusCode,
    errorCode,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString()
  };

  if (statusCode >= 500) {
    console.error('Server Error:', logData);
  } else if (statusCode >= 400) {
    console.warn('Client Error:', logData);
  } else {
    console.info('Application Error:', logData);
  }

  // Don't expose internal errors to clients
  const clientMessage = statusCode >= 500 ? 'Internal server error' : errorMessage;

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: clientMessage,
    code: errorCode,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error.message 
    })
  });
};

/**
 * Get error code based on status code
 */
function getErrorCode(statusCode) {
  const errorCodes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT'
  };
  return errorCodes[statusCode] || 'UNKNOWN_ERROR';
}

/**
 * Create custom error with proper categorization
 */
const createError = (message, statusCode = 500, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code || getErrorCode(statusCode);
  return error;
};

/**
 * Create validation error
 */
const createValidationError = (message, field = null) => {
  const error = createError(message, 400, 'VALIDATION_ERROR');
  error.field = field;
  return error;
};

/**
 * Create authentication error
 */
const createAuthError = (message = 'Authentication required') => {
  return createError(message, 401, 'UNAUTHORIZED');
};

/**
 * Create authorization error
 */
const createForbiddenError = (message = 'Access denied') => {
  return createError(message, 403, 'FORBIDDEN');
};

/**
 * Create not found error
 */
const createNotFoundError = (message = 'Resource not found') => {
  return createError(message, 404, 'NOT_FOUND');
};

/**
 * Create conflict error
 */
const createConflictError = (message = 'Resource conflict') => {
  return createError(message, 409, 'CONFLICT');
};

/**
 * 404 handler with improved logging
 */
const notFound = (req, res) => {
  console.warn('Route not found:', {
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  createError,
  createValidationError,
  createAuthError,
  createForbiddenError,
  createNotFoundError,
  createConflictError,
  notFound
};
