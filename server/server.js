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
const chatRoutes = require('./src/routes/chat');
const organizationRoutes = require('./src/routes/organizations');
const userPreferencesRoutes = require('./src/routes/user-preferences');
const userContactsRoutes = require('./src/routes/user-contacts');
const meRoutes = require('./src/routes/me');
const authRoutes = require('./src/routes/auth');
const companyRoutes = require('./src/routes/companies');
const dbRoutes = require('./src/routes/db');
const rpcRoutes = require('./src/routes/rpc');
const aiRoutes = require('./src/routes/ai');
const vectorRoutes = require('./src/routes/vector');
const knowledgeRoutes = require('./src/routes/knowledge');
const adminRoutes = require('./src/routes/admin');
const { getAgentRuntime } = require('./src/services/agentRuntime');

// Import OpenClaw integration routes
const openclawIntegrationRoutes = require('./routes/openclaw-integration');

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

// CORS / allowed origins
// Goal: allow "whatever is added to the domain field" without hardcoding each hostname.
// In practice, we safely allow same-site origins (subdomains) for marcoby.{net,com}.
// - Supports credentials (cookies) by reflecting the Origin when allowed.
// - Still allows explicit overrides via CORS_ORIGINS / FRONTEND_URL.
const prodOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOriginRegexes = [
  // Allow any subdomain of marcoby.net and marcoby.com over https
  /^https:\/\/([a-z0-9-]+\.)*marcoby\.net$/i,
  /^https:\/\/([a-z0-9-]+\.)*marcoby\.com$/i,
];

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? prodOrigins
  : ['http://localhost:5173', 'http://localhost:3000'];

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // same-origin / server-to-server
  if (allowedOrigins.includes(origin)) return true; // explicit allowlist
  return allowedOriginRegexes.some((re) => re.test(origin));
};

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
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

// ...existing code...

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      // Allow Cloudflare Insights (if enabled) and a specific inline script hash seen in production.
      // Prefer nonces/hashes over 'unsafe-inline'.
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://static.cloudflareinsights.com",
        "'sha256-d2YSkA49HLdjngaF+0EcXMxNSRwoe/GEriqK+A2G0UU='",
        "'sha256-vDRXYtG0JCx4vG4d/wsNH83cpGjOwjcVNBo8EnvTw+U='",
      ],
      // Some browsers separate elem/directives; keep consistent.
      scriptSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "https://static.cloudflareinsights.com",
        "'sha256-d2YSkA49HLdjngaF+0EcXMxNSRwoe/GEriqK+A2G0UU='",
        "'sha256-vDRXYtG0JCx4vG4d/wsNH83cpGjOwjcVNBo8EnvTw+U='",
      ],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
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

// Shared health check logic for /health and /healthz
async function performAllHealthChecks(verbose = false) {
  const runtime = getAgentRuntime();
  const runtimeInfo = runtime.getRuntimeInfo();
  const runtimeCapabilities = runtime.getCapabilities();
  const runtimeRequired = (
    process.env.AGENT_RUNTIME || 'openclaw'
  ).toLowerCase() !== 'mock' && process.env.HEALTH_REQUIRE_RUNTIME === 'true';

  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  if (verbose) {
    healthStatus.version = process.env.npm_package_version || '1.0.0';
    healthStatus.uptime = process.uptime();
    healthStatus.memory = process.memoryUsage();
    healthStatus.checks = {};
  }

  // Agent runtime (OpenClaw) health check
  try {
    const runtimeHealthResponse = await runtime.healthCheck({ timeoutMs: 2500 });
    const runtimeOk = runtimeHealthResponse.ok;
    const runtimeSummary = {
      status: runtimeOk ? 'ok' : 'error',
      runtime: runtimeInfo.id,
      required: runtimeRequired
    };

    if (verbose) {
      healthStatus.checks.runtime = {
        ...runtimeSummary,
        url: runtimeInfo.baseUrl,
        statusCode: runtimeHealthResponse.status,
        capabilities: runtimeCapabilities
      };
    } else {
      healthStatus.runtime = runtimeOk ? 'ok' : 'error';
    }
  } catch (runtimeError) {
    const runtimeSummary = {
      status: runtimeRequired ? 'error' : 'degraded',
      runtime: runtimeInfo.id,
      required: runtimeRequired,
      error: runtimeError.message
    };

    if (verbose) {
      healthStatus.checks.runtime = {
        ...runtimeSummary,
        url: runtimeInfo.baseUrl,
        capabilities: runtimeCapabilities
      };
    } else {
      healthStatus.runtime = runtimeRequired ? 'error' : 'degraded';
    }
  }

  // Database health check
  try {
    const { testConnection } = require('./src/database/connection');
    const dbHealth = await testConnection();
    if (verbose) {
      healthStatus.checks.database = {
        status: dbHealth.success ? 'ok' : 'error',
        ...(dbHealth.success && { version: dbHealth.version }),
        ...(dbHealth.error && { error: dbHealth.error })
      };
    } else {
      healthStatus.database = dbHealth.success ? 'ok' : 'error';
    }
  } catch (dbError) {
    if (verbose) {
      healthStatus.checks.database = { status: 'error', error: dbError.message };
    } else {
      healthStatus.database = 'error';
    }
  }

  // Determine overall status
  const runtimeCheck = healthStatus.checks?.runtime || { status: healthStatus.runtime };
  const dbCheck = healthStatus.checks?.database || { status: healthStatus.database };

  const dbOk = dbCheck.status === 'ok';
  const runtimeOk = runtimeRequired ? runtimeCheck.status === 'ok' : runtimeCheck.status !== 'error';

  healthStatus.status = (dbOk && runtimeOk) ? 'ok' : 'degraded';
  if (!dbOk && runtimeRequired) healthStatus.status = 'error';
  if (!runtimeOk && runtimeRequired) healthStatus.status = 'error';

  return healthStatus;
}

// Health check endpoint with detailed status
app.get('/health', async (req, res) => {
  try {
    const verbose = process.env.HEALTH_VERBOSE === 'true' || process.env.NODE_ENV !== 'production';
    const healthStatus = await performAllHealthChecks(verbose);
    const statusCode = healthStatus.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({ status: 'error', timestamp: new Date().toISOString(), error: 'Health check failed' });
  }
});

// Simple healthz endpoint for orchestration (Kubernetes/Coolify)
app.get('/healthz', async (req, res) => {
  try {
    const healthStatus = await performAllHealthChecks(false);
    const statusCode = healthStatus.status === 'ok' ? 200 : 503;
    res.set('Cache-Control', 'no-store');
    res.status(statusCode).json({ ok: healthStatus.status === 'ok', status: healthStatus.status });
  } catch (error) {
    res.status(503).json({ ok: false, error: 'Health check failed' });
  }
});

// API routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/companies', authLimiter, companyRoutes);
app.use('/api/chat', uploadLimiter, chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/vector', dbLimiter, vectorRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/user-contacts', userContactsRoutes);
app.use('/api/me', meRoutes);
app.use('/api/db', dbLimiter, dbRoutes);
app.use('/api/rpc', dbLimiter, rpcRoutes);
app.use('/api/admin', adminRoutes);

// OpenClaw integration routes
const openclawWorkspaceRoutes = require('./routes/openclaw-workspace');
app.use('/api/openclaw/workspace', openclawWorkspaceRoutes);
app.use('/api/openclaw', openclawIntegrationRoutes);

// OAuth routes
const oauthRoutes = require('./src/routes/oauth');
app.use('/api/oauth', authLimiter, oauthRoutes);

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Close database connections
    // Close database connections
    const { closePool } = require('./src/database/connection');
    await closePool();

    // Close Redis connection
    const redis = require('./src/utils/redis');
    await redis.disconnect();

    logger.info('Database and Redis connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
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

      server.listen(PORT, '0.0.0.0', async () => {
        // Connect to Redis
        try {
          const redis = require('./src/utils/redis');
          await redis.connect();
        } catch (err) {
          logger.warn('Failed to connect to Redis on startup', err);
        }

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
      server.listen(PORT, '0.0.0.0', async () => {
        // Connect to Redis
        try {
          const redis = require('./src/utils/redis');
          await redis.connect();
        } catch (err) {
          logger.warn('Failed to connect to Redis on startup', err);
        }

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
