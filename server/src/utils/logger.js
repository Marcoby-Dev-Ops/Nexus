/**
 * Server-side Logger Utility
 * 
 * Provides consistent logging for the API server with improved formatting and levels
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

class Logger {
  /**
   * Format log message with timestamp and structured data
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(data && typeof data === 'object' ? data : { data })
    };

    // In development, pretty print the log
    if (process.env.NODE_ENV === 'development') {
      return `${timestamp} [${level.toUpperCase()}] ${message}${data ? ` ${JSON.stringify(data, null, 2)}` : ''}`;
    }

    // In production, use structured JSON logging
    return JSON.stringify(logEntry);
  }

  /**
   * Log debug messages
   */
  debug(message, data = null) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }

  /**
   * Log info messages
   */
  info(message, data = null) {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  /**
   * Log warning messages
   */
  warn(message, data = null) {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  /**
   * Log error messages
   */
  error(message, data = null) {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage('ERROR', message, data));
    }
  }

  /**
   * Log fatal messages
   */
  fatal(message, data = null) {
    if (currentLogLevel <= LOG_LEVELS.FATAL) {
      console.error(this.formatMessage('FATAL', message, data));
    }
  }

  /**
   * Log HTTP request details
   */
  logRequest(req, res, next) {
    const startTime = Date.now();
    
    // Log request start
    this.info('HTTP Request Started', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || 'anonymous'
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime;
      
      logger.info('HTTP Request Completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length') || 0,
        userId: req.user?.id || 'anonymous'
      });

      originalEnd.call(this, chunk, encoding);
    };

    next();
  }

  /**
   * Log database operations
   */
  logDatabaseOperation(operation, table, duration, rowCount = null, error = null) {
    const logData = {
      operation,
      table,
      duration: `${duration}ms`,
      ...(rowCount !== null && { rowCount }),
      ...(error && { error: error.message })
    };

    if (error) {
      this.error('Database Operation Failed', logData);
    } else {
      this.debug('Database Operation Completed', logData);
    }
  }

  /**
   * Log authentication events
   */
  logAuthEvent(event, userId, success, details = null) {
    this.info('Authentication Event', {
      event,
      userId,
      success,
      ...(details && { details })
    });
  }

  /**
   * Log API errors with context
   */
  logApiError(error, req, context = {}) {
    this.error('API Error', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      url: req?.url,
      method: req?.method,
      userId: req?.user?.id,
      userAgent: req?.get('User-Agent'),
      ip: req?.ip || req?.connection?.remoteAddress,
      ...context
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation, duration, metadata = {}) {
    this.info('Performance Metric', {
      operation,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  /**
   * Log security events
   */
  logSecurityEvent(event, details = {}) {
    this.warn('Security Event', {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(context) {
    return {
      debug: (message, data) => this.debug(message, { ...context, ...data }),
      info: (message, data) => this.info(message, { ...context, ...data }),
      warn: (message, data) => this.warn(message, { ...context, ...data }),
      error: (message, data) => this.error(message, { ...context, ...data }),
      fatal: (message, data) => this.fatal(message, { ...context, ...data })
    };
  }
}

// Create singleton logger instance
const logger = new Logger();

// Export both the class and instance
module.exports = { 
  logger,
  Logger,
  LOG_LEVELS
};
