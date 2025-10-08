const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('./loadEnv');

// Import middleware
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { logger } = require('./src/utils/logger');

// Import rate limiting middleware
const { 
  generalLimiter, 
  authLimiter, 
  dbLimiter, 
  aiLimiter, 
  uploadLimiter, 
  devLimiter 
} = require('./src/middleware/rateLimit');

// Import database migration runner
const MigrationRunner = require('./src/database/migrate');

// Import routes
const dbRoutes = require('./src/routes/db');
const rpcRoutes = require('./src/routes/rpc');
const vectorRoutes = require('./src/routes/vector');
let factsRoutes = null;
try {
  // facts route is optional in some production builds/images; require defensively so the
  // server can still start even if the file wasn't copied into the image by accident.
  factsRoutes = require('./src/routes/facts');
} catch (err) {
  logger.warn('Facts routes not available, skipping /api/facts mounting', { error: err.message });
}

let telemetryRoutes = null;
try {
  telemetryRoutes = require('./src/routes/telemetry');
} catch (err) {
  logger.warn('Telemetry routes not available, skipping /api/telemetry mounting', { error: err.message });
}
const edgeRoutes = require('./src/routes/edge');
const chatRoutes = require('./src/routes/chat');
const organizationRoutes = require('./src/routes/organizations');
const userPreferencesRoutes = require('./src/routes/user-preferences');
const userContactsRoutes = require('./src/routes/user-contacts');
const meRoutes = require('./src/routes/me');
const varLeadsRoutes = require('./src/routes/var-leads');
const integrationRoutes = require('./src/routes/integrations');
const authRoutes = require('./src/routes/auth');
const companyRoutes = require('./src/routes/companies');
const oauthRoutes = require('./routes/oauth');
const applySuggestionRoutes = require('./src/routes/apply-suggestion');

// Import AI Gateway routes
const aiGatewayRoutes = require('./routes/ai-gateway');
const aiInsightsRoutes = require('./routes/ai-insights');

// Import thoughts routes
const thoughtsRoutes = require('./src/routes/thoughts');

// Import analytics routes
const analyticsRoutes = require('./src/routes/analytics');

// Import intake agent routes
const intakeRoutes = require('./src/routes/intake');

// Import ticket management agent routes
const ticketManagementRoutes = require('./src/routes/ticket-management');

// Import CKB routes
const ckbRoutes = require('./routes/ckb');

// Import journey intake routes
const journeyIntakeRoutes = require('./src/routes/journey-intake');

// Import Socket.IO service
const socketService = require('./src/services/SocketService');

// Import Socket.IO test routes
const socketTestRoutes = require('./src/routes/socket-test');
const pushRoutes = require('./src/routes/push');

const app = express();
const server = createServer(app);
const PORT = process.env.API_PORT || 3001;

// When running behind a reverse proxy (nginx, load balancer), enable trust proxy
// so Express's req.ip and rate limiting use the originating client IP instead of the proxy's IP.
// This prevents the auth rate limiter from treating all requests as coming from a single IP.
if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  logger.info('Express trust proxy enabled (using X-Forwarded-For) for proper client IP detection');
}

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'https://nexus.marcoby.net']
      : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.sub || decoded.id;
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Socket.IO client connected', { 
    socketId: socket.id, 
    userId: socket.userId 
  });

  // Join user to their personal room
  socket.join(`user:${socket.userId}`);

  // Handle actionable insights subscription
  socket.on('subscribe-insights', (data) => {
    logger.info('Client subscribed to insights', { 
      socketId: socket.id, 
      userId: socket.userId,
      data 
    });
    socket.join('insights');
  });

  // Handle actionable insights unsubscription
  socket.on('unsubscribe-insights', () => {
    logger.info('Client unsubscribed from insights', { 
      socketId: socket.id, 
      userId: socket.userId 
    });
    socket.leave('insights');
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    logger.info('Socket.IO client disconnected', { 
      socketId: socket.id, 
      userId: socket.userId,
      reason 
    });
  });

  // Handle errors
  socket.on('error', (error) => {
    logger.error('Socket.IO error', { 
      socketId: socket.id, 
      userId: socket.userId,
      error: error.message 
    });
  });
});

// Make io available to other modules
app.set('io', io);

// Initialize Socket.IO service
socketService.initialize(io);

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

// Rate limiting middleware - apply based on environment
if (process.env.NODE_ENV === 'production') {
  // Production: Apply general rate limiting to all routes
  app.use(generalLimiter);
  logger.info('Production rate limiting enabled');
} else {
  // Development: Apply more permissive rate limiting
  app.use(devLimiter);
  logger.info('Development rate limiting enabled');
}

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

// API routes with specific rate limiting

// Database operations - apply DB rate limiting
app.use('/api/db', dbLimiter, dbRoutes);

// Authentication routes - apply strict auth rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/companies', authLimiter, companyRoutes);
app.use('/api/oauth', authLimiter, oauthRoutes);

// AI/ML routes - apply AI rate limiting (cost-sensitive)
app.use('/api/ai', aiLimiter, aiGatewayRoutes);
app.use('/api/ai-insights', aiLimiter, aiInsightsRoutes);

// Other API routes - use general rate limiting
app.use('/api/rpc', rpcRoutes);
app.use('/api/vector', vectorRoutes);
if (factsRoutes) {
  app.use('/api/facts', factsRoutes);
  logger.info('Facts routes mounted at /api/facts');
} else {
  logger.warn('Facts routes not mounted because they are not available');
}
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/edge', edgeRoutes);
app.use('/api/chat', uploadLimiter, chatRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/user-contacts', userContactsRoutes);
app.use('/api/me', meRoutes);
app.use('/api/var-leads', varLeadsRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/thoughts', thoughtsRoutes);
app.use('/api/push', pushRoutes);

// Apply suggestion endpoint (audit + apply)
app.use('/api/apply-suggestion', generalLimiter, applySuggestionRoutes);

// Agent routes - use general rate limiting
app.use('/api/intake', intakeRoutes);
app.use('/api/journey-intake', journeyIntakeRoutes);
app.use('/api/ticket-management', ticketManagementRoutes);

// Analytics and CKB routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ckb', ckbRoutes);

// Socket.IO test routes (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/socket-test', socketTestRoutes);
  logger.info('Socket.IO test routes mounted at /api/socket-test');
}

logger.info('AI Gateway routes mounted at /api/ai');
logger.info('CKB routes mounted at /api/ckb');

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

      server.listen(PORT, '0.0.0.0', () => {
        logger.info('🚀 API server started with Socket.IO', {
          port: PORT,
          environment: process.env.NODE_ENV || 'development',
          healthCheck: `http://localhost:${PORT}/health`,
          socketIO: `ws://localhost:${PORT}/socket.io/`
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
      server.listen(PORT, '0.0.0.0', () => {
        logger.info('🚀 API server started with Socket.IO (migrations skipped)', {
          port: PORT,
          environment: process.env.NODE_ENV || 'development',
          healthCheck: `http://localhost:${PORT}/health`,
          socketIO: `ws://localhost:${PORT}/socket.io/`
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
