/**
 * Server Monitoring Utility
 * 
 * Provides comprehensive monitoring for error detection and prevention
 */

const { logger } = require('./logger');
const { getPoolStats, testConnection } = require('../database/connection');
const { getAgentRuntime } = require('../services/agentRuntime');

class ServerMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        errors: 0,
        byStatus: {},
        byEndpoint: {},
        responseTimes: []
      },
      database: {
        queries: 0,
        errors: 0,
        slowQueries: 0,
        connectionPool: {}
      },
      system: {
        memory: [],
        cpu: [],
        uptime: 0
      },
      errors: {
        byType: {},
        recent: []
      },
      runtime: {
        status: 'unknown',
        error: null
      }
    };

    this.startTime = Date.now();
    this.isMonitoring = false;
  }

  /**
   * Start monitoring
   */
  start() {
    if (this.isMonitoring) {
      logger.warn('Monitoring already started');
      return;
    }

    this.isMonitoring = true;
    logger.info('Server monitoring started');

    // Start periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds

    // Start system metrics collection
    this.systemMetricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 60000); // Every minute

    // Start database monitoring
    this.databaseMetricsInterval = setInterval(() => {
      this.collectDatabaseMetrics();
    }, 15000); // Every 15 seconds
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
    }
    if (this.databaseMetricsInterval) {
      clearInterval(this.databaseMetricsInterval);
    }

    logger.info('Server monitoring stopped');
  }

  /**
   * Record HTTP request
   */
  recordRequest(req, res, duration, error = null) {
    if (!this.isMonitoring) return;

    this.metrics.requests.total++;

    const statusCode = res.statusCode;
    const endpoint = req.route?.path || req.path;

    // Record by status code
    this.metrics.requests.byStatus[statusCode] =
      (this.metrics.requests.byStatus[statusCode] || 0) + 1;

    // Record by endpoint
    this.metrics.requests.byEndpoint[endpoint] =
      (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;

    // Record response time
    this.metrics.requests.responseTimes.push(duration);

    // Keep only last 1000 response times
    if (this.metrics.requests.responseTimes.length > 1000) {
      this.metrics.requests.responseTimes.shift();
    }

    // Record errors
    if (error || statusCode >= 400) {
      this.metrics.requests.errors++;
      this.recordError(error || new Error(`HTTP ${statusCode}`), req);
    }
  }

  /**
   * Record database operation
   */
  recordDatabaseOperation(operation, table, duration, error = null) {
    if (!this.isMonitoring) return;

    this.metrics.database.queries++;

    if (error) {
      this.metrics.database.errors++;
      this.recordError(error, null, { operation, table });
    }

    // Track slow queries (> 1 second)
    if (duration > 1000) {
      this.metrics.database.slowQueries++;
      logger.warn('Slow database query detected', {
        operation,
        table,
        duration: `${duration}ms`
      });
    }
  }

  /**
   * Record error
   */
  recordError(error, req = null, context = {}) {
    if (!this.isMonitoring) return;

    const errorType = error.name || 'UnknownError';
    this.metrics.errors.byType[errorType] =
      (this.metrics.errors.byType[errorType] || 0) + 1;

    // Record recent errors (keep last 100)
    const errorRecord = {
      timestamp: new Date().toISOString(),
      type: errorType,
      message: error.message,
      stack: error.stack,
      url: req?.url,
      method: req?.method,
      userId: req?.user?.id,
      ...context
    };

    this.metrics.errors.recent.push(errorRecord);

    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent.shift();
    }

    // Log critical errors
    if (error.statusCode >= 500) {
      logger.error('Critical error recorded', errorRecord);
    }
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    try {
      const healthStatus = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: null,
        metrics: this.getMetricsSummary()
      };

      // Check database health
      try {
        const dbHealth = await testConnection();
        healthStatus.database = {
          status: dbHealth.success ? 'ok' : 'error',
          ...(dbHealth.success && { version: dbHealth.version }),
          ...(dbHealth.error && { error: dbHealth.error })
        };
      } catch (dbError) {
        healthStatus.database = {
          status: 'error',
          error: dbError.message
        };
      }

      // Check agent runtime health
      try {
        const runtime = getAgentRuntime();
        const runtimeHealth = await runtime.healthCheck({ timeoutMs: 5000 });
        healthStatus.runtime = {
          status: runtimeHealth.ok ? 'ok' : 'error',
          statusCode: runtimeHealth.status
        };
        this.metrics.runtime.status = healthStatus.runtime.status;
      } catch (runtimeError) {
        healthStatus.runtime = {
          status: 'error',
          error: runtimeError.message
        };
        this.metrics.runtime.status = 'error';
        this.metrics.runtime.error = runtimeError.message;
      }

      // Check for critical issues
      const issues = this.detectIssues(healthStatus);

      if (issues.length > 0) {
        logger.warn('Health check issues detected', { issues, healthStatus });
      }

      return healthStatus;

    } catch (error) {
      logger.error('Health check failed:', error);
      return null;
    }
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      this.metrics.system.memory.push({
        timestamp: new Date().toISOString(),
        ...memoryUsage
      });

      this.metrics.system.uptime = uptime;

      // Keep only last 60 memory readings
      if (this.metrics.system.memory.length > 60) {
        this.metrics.system.memory.shift();
      }

      // Check for memory leaks
      if (this.metrics.system.memory.length > 10) {
        const recentMemory = this.metrics.system.memory.slice(-10);
        const memoryGrowth = recentMemory[recentMemory.length - 1].heapUsed -
          recentMemory[0].heapUsed;

        if (memoryGrowth > 50 * 1024 * 1024) { // 50MB growth
          logger.warn('Potential memory leak detected', {
            growth: `${Math.round(memoryGrowth / 1024 / 1024)}MB`
          });
        }
      }

    } catch (error) {
      logger.error('Failed to collect system metrics:', error);
    }
  }

  /**
   * Collect database metrics
   */
  async collectDatabaseMetrics() {
    try {
      const poolStats = getPoolStats();
      this.metrics.database.connectionPool = poolStats;

      // Check for connection pool issues
      if (poolStats.totalCount > 15) {
        logger.warn('High database connection usage', poolStats);
      }

    } catch (error) {
      logger.error('Failed to collect database metrics:', error);
    }
  }

  /**
   * Detect potential issues
   */
  detectIssues(healthStatus) {
    const issues = [];

    // Check error rate
    const errorRate = this.metrics.requests.total > 0 ?
      (this.metrics.requests.errors / this.metrics.requests.total) * 100 : 0;

    if (errorRate > 10) {
      issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
    }

    // Check 500 errors
    const serverErrors = this.metrics.requests.byStatus[500] || 0;
    if (serverErrors > 5) {
      issues.push(`Multiple 500 errors: ${serverErrors}`);
    }

    // Check database errors
    if (this.metrics.database.errors > 10) {
      issues.push(`High database error count: ${this.metrics.database.errors}`);
    }

    // Check slow queries
    if (this.metrics.database.slowQueries > 5) {
      issues.push(`Multiple slow queries: ${this.metrics.database.slowQueries}`);
    }

    // Check memory usage
    const memoryUsage = healthStatus.memory;
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;

    if (heapUsedMB > 500) { // 500MB
      issues.push(`High memory usage: ${Math.round(heapUsedMB)}MB`);
    }

    // Check database health
    if (healthStatus.database?.status === 'error') {
      issues.push('Database connection issues');
    }

    return issues;
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const responseTimes = this.metrics.requests.responseTimes;
    const avgResponseTime = responseTimes.length > 0 ?
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    return {
      requests: {
        total: this.metrics.requests.total,
        errors: this.metrics.requests.errors,
        errorRate: this.metrics.requests.total > 0 ?
          (this.metrics.requests.errors / this.metrics.requests.total) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
        byStatus: this.metrics.requests.byStatus
      },
      database: {
        queries: this.metrics.database.queries,
        errors: this.metrics.database.errors,
        slowQueries: this.metrics.database.slowQueries,
        connectionPool: this.metrics.database.connectionPool
      },
      errors: {
        byType: this.metrics.errors.byType,
        recentCount: this.metrics.errors.recent.length
      },
      uptime: this.metrics.system.uptime
    };
  }

  /**
   * Get detailed metrics
   */
  getDetailedMetrics() {
    return {
      ...this.metrics,
      startTime: new Date(this.startTime).toISOString(),
      isMonitoring: this.isMonitoring
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        errors: 0,
        byStatus: {},
        byEndpoint: {},
        responseTimes: []
      },
      database: {
        queries: 0,
        errors: 0,
        slowQueries: 0,
        connectionPool: {}
      },
      system: {
        memory: [],
        cpu: [],
        uptime: 0
      },
      errors: {
        byType: {},
        recent: []
      }
    };

    logger.info('Metrics reset');
  }
}

// Create singleton monitor instance
const serverMonitor = new ServerMonitor();

module.exports = {
  serverMonitor,
  ServerMonitor
};
