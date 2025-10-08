const express = require('express');
const { logger } = require('../src/utils/logger');

const router = express.Router();

// Initialize the AI Gateway service
let aiGateway;
try {
  // Try to import the AI Gateway service - handle gracefully if not available
  logger.info('Attempting to import NexusAIGatewayService...');
  const { NexusAIGatewayService } = require('../services/NexusAIGatewayService');
  logger.info('NexusAIGatewayService imported successfully');
  
  logger.info('Attempting to instantiate NexusAIGatewayService...');
  aiGateway = new NexusAIGatewayService({
    enableOpenAI: true,
    enableOpenRouter: true,
    enableLocal: true,
    maxRetries: 3,
    retryDelayMs: 1000,
    enableUsageTracking: true,
    enableCircuitBreaker: true,
  });
  logger.info('AI Gateway service initialized successfully');
} catch (error) {
  logger.error('Failed to initialize AI Gateway service:', error.message);
  logger.error('Error stack:', error.stack);
  logger.info('AI Gateway routes will be available but service functionality will be limited');
  
  // Create a mock service for development
  aiGateway = {
    testConnections: async () => ({ status: 'mock' }),
    getProviderHealth: async () => ({ status: 'mock' }),
    chat: async () => ({ success: false, error: 'AI Gateway service not available' }),
    generateEmbeddings: async () => ({ success: false, error: 'AI Gateway service not available' })
  };
}

// Middleware to extract tenant ID from request
const extractTenantId = (req, res, next) => {
  // Extract tenant ID from headers, query params, or JWT token
  const tenantId = req.headers['x-tenant-id'] || 
                   req.query.tenantId || 
                   'default-tenant'; // Fallback for development
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }
  
  req.tenantId = tenantId;
  next();
};

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    if (!aiGateway) {
      return res.status(503).json({
        status: 'unhealthy',
        error: 'AI Gateway service not available',
        timestamp: new Date().toISOString(),
      });
    }

    const connections = await aiGateway.testConnections();
    const health = await aiGateway.getProviderHealth();
    
    res.json({
      status: 'healthy',
      connections,
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Chat endpoint
router.post('/chat', extractTenantId, async (req, res) => {
  try {
    if (!aiGateway) {
      return res.status(503).json({ error: 'AI Gateway service not available' });
    }

    const chatRequest = {
      messages: req.body.messages || [],
      system: req.body.system,
      role: req.body.role || 'chat',
      sensitivity: req.body.sensitivity || 'internal',
      budgetCents: req.body.budgetCents,
      latencyTargetMs: req.body.latencyTargetMs,
      json: req.body.json,
      tools: req.body.tools,
      tenantId: req.tenantId,
      userId: req.body.userId,
    };

    const response = await aiGateway.chat(chatRequest);
    
    if (response.success) {
      res.json(response.data);
    } else {
      res.status(400).json({ error: response.error });
    }
  } catch (error) {
    logger.error('Chat request failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get conversation endpoint
router.get('/chat/:conversationId', extractTenantId, async (req, res) => {
  try {
    if (!aiGateway) {
      return res.status(503).json({ error: 'AI Gateway service not available' });
    }

    const { conversationId } = req.params;
    
    // For now, return a simple response since conversation storage is handled elsewhere
    res.json({
      conversationId,
      messages: [],
      success: true
    });
  } catch (error) {
    logger.error('Get conversation failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Embeddings endpoint
router.post('/embeddings', extractTenantId, async (req, res) => {
  try {
    if (!aiGateway) {
      return res.status(503).json({ error: 'AI Gateway service not available' });
    }

    const embeddingRequest = {
      text: req.body.text,
      model: req.body.model,
      tenantId: req.tenantId,
      userId: req.body.userId,
    };

    const response = await aiGateway.generateEmbeddings(embeddingRequest);
    
    if (response.success) {
      res.json(response.data);
    } else {
      res.status(400).json({ error: response.error });
    }
  } catch (error) {
    logger.error('Embedding request failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

module.exports = router;
