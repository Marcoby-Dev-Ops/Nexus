const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { config } = require('dotenv');

// Import middleware
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { logger } = require('./src/utils/logger');

// Import database migration runner
const MigrationRunner = require('./src/database/migrate');

// Import routes
const dbRoutes = require('./src/routes/db');
const rpcRoutes = require('./src/routes/rpc');
const vectorRoutes = require('./src/routes/vector');
const edgeRoutes = require('./src/routes/edge');
const organizationRoutes = require('./src/routes/organizations');
const userPreferencesRoutes = require('./src/routes/user-preferences');
const varLeadsRoutes = require('./src/routes/var-leads');
const integrationRoutes = require('./src/routes/integrations');
const authRoutes = require('./src/routes/auth');
const oauthRoutes = require('./routes/oauth');

// Import AI Gateway routes
const aiGatewayRoutes = require('./routes/ai-gateway');
const aiInsightsRoutes = require('./routes/ai-insights');

// Import thoughts routes
const thoughtsRoutes = require('./src/routes/thoughts');

// Import analytics routes
const analyticsRoutes = require('./src/routes/analytics');

// Load environment variables
config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://nexus.marcoby.net']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb'
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging middleware
app.use((req, res, next) => {
  logger.logRequest(req, res, next);
});

// Health check endpoint with detailed status
app.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {}
    };

    // Database health check
    try {
      const { testConnection } = require('./src/database/connection');
      const dbHealth = await testConnection();
      healthStatus.checks.database = {
        status: dbHealth.success ? 'ok' : 'error',
        ...(dbHealth.success && { version: dbHealth.version }),
        ...(dbHealth.error && { error: dbHealth.error })
      };
    } catch (dbError) {
      healthStatus.checks.database = {
        status: 'error',
        error: dbError.message
      };
    }

    // Overall health status
    const allChecksPassed = Object.values(healthStatus.checks).every(check => check.status === 'ok');
    healthStatus.status = allChecksPassed ? 'ok' : 'degraded';

    const statusCode = allChecksPassed ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// API routes with error handling
app.use('/api/db', dbRoutes);
app.use('/api/rpc', rpcRoutes);
app.use('/api/vector', vectorRoutes);
app.use('/api/edge', edgeRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/var-leads', varLeadsRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/thoughts', thoughtsRoutes);

// AI Gateway routes
app.use('/api/ai', aiGatewayRoutes);
app.use('/api/ai-insights', aiInsightsRoutes);
app.use('/api/analytics', analyticsRoutes);
logger.info('AI Gateway routes mounted at /api/ai');

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  // Close database connections
  const { closePool } = require('./src/database/connection');
  closePool()
    .then(() => {
      logger.info('Database connections closed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.fatal('Unhandled Rejection:', { reason, promise });
  process.exit(1);
});

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  // Run database migrations before starting server
  const migrationRunner = new MigrationRunner();
  
  migrationRunner.runMigrations()
    .then((migrationResult) => {
      if (!migrationResult.success) {
        logger.warn('Migrations failed, but continuing with server startup', { 
          applied: migrationResult.applied, 
          total: migrationResult.total,
          error: migrationResult.results?.find(r => !r.success)?.error 
        });
      } else {
        logger.info(`Migrations completed: ${migrationResult.applied}/${migrationResult.total} applied`);
      }

      const server = app.listen(PORT, '0.0.0.0', () => {
        logger.info('🚀 API server started', {
          port: PORT,
          environment: process.env.NODE_ENV || 'development',
          healthCheck: `http://localhost:${PORT}/health`
        });
      });

      // Handle server errors
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${PORT} is already in use`);
        } else {
          logger.error('Server error:', error);
        }
        process.exit(1);
      });

    })
    .catch((error) => {
      logger.warn('Migration runner failed, but continuing with server startup', { error: error.message });
      
      // Start server even if migrations fail
      const server = app.listen(PORT, '0.0.0.0', () => {
        logger.info('🚀 API server started (migrations skipped)', {
          port: PORT,
          environment: process.env.NODE_ENV || 'development',
          healthCheck: `http://localhost:${PORT}/health`
        });
      });

      // Handle server errors
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${PORT} is already in use`);
        } else {
          logger.error('Server error:', error);
        }
        process.exit(1);
      });
    });
}

module.exports = app;
