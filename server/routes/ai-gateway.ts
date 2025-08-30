import express from 'express';
import { NexusAIGatewayService } from '../src/ai/services/NexusAIGatewayService';
import type { ChatRequest, EmbeddingRequest, RerankRequest } from '../src/ai/services/NexusAIGatewayService';
import { logger } from '../src/utils/logger';
import { getMetrics } from '../src/ai/observability/metrics';
import { withShadow } from '../src/ai/middleware/shadowMode';
import { assertRateLimit, RateLimitExceededError } from '../src/ai/guards/rateLimit';
import { assertBudget, BudgetExceededError, type BudgetTier } from '../src/ai/guards/budgetGuard';

const router = express.Router();

// Initialize the AI Gateway service
const aiGateway = new NexusAIGatewayService({
  enableOpenAI: true,
  enableOpenRouter: true,
  enableLocal: true,
  maxRetries: 3,
  retryDelayMs: 1000,
  enableUsageTracking: true,
  enableCircuitBreaker: true,
});

// Middleware to extract tenant ID from request
const extractTenantId = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Extract tenant ID from headers, query params, or JWT token
  const tenantId = req.headers['x-tenant-id'] as string || 
                   req.query.tenantId as string || 
                   'default-tenant'; // Fallback for development
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }
  
  req.tenantId = tenantId;
  next();
};

// Middleware to apply rate limiting
const applyRateLimit = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await assertRateLimit(req.tenantId);
    next();
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      res.status(429).json({
        error: error.message,
        retryAfter: error.retryAfter,
      });
    } else {
      next(error);
    }
  }
};

// Middleware to check budget
const checkBudget = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const budgetTier = (req.headers['x-budget-tier'] as BudgetTier) || 'standard';
    const estimatedCost = req.body.estimatedCost || 0;
    
    assertBudget(estimatedCost, { tier: budgetTier });
    next();
  } catch (error) {
    if (error instanceof BudgetExceededError) {
      res.status(402).json({
        error: error.message,
        budget: error.budgetUSD,
        actual: error.actualUSD,
      });
    } else {
      next(error);
    }
  }
};

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
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
router.post('/chat', extractTenantId, applyRateLimit, async (req, res) => {
  try {
    const chatRequest: ChatRequest = {
      messages: req.body.messages || [],
      system: req.body.system,
      role: req.body.role,
      sensitivity: req.body.sensitivity || 'internal',
      budgetCents: req.body.budgetCents,
      latencyTargetMs: req.body.latencyTargetMs,
      json: req.body.json,
      tools: req.body.tools,
      tenantId: req.tenantId,
      userId: req.body.userId,
    };

    const shadow = req.headers['x-shadow-alt']
      ? () => aiGateway.chat({ ...chatRequest, role: 'draft' })
      : null;

    const response = await withShadow(
      () => aiGateway.chat(chatRequest),
      shadow,
      (record) => logger.info({ evt: 'ai.shadow', ...record })
    );
    
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

// Embeddings endpoint
router.post('/embeddings', extractTenantId, applyRateLimit, async (req, res) => {
  try {
    const embeddingRequest: EmbeddingRequest = {
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

// Rerank endpoint
router.post('/rerank', extractTenantId, applyRateLimit, async (req, res) => {
  try {
    const rerankRequest: RerankRequest = {
      query: req.body.query,
      documents: req.body.documents || [],
      model: req.body.model,
      tenantId: req.tenantId,
      userId: req.body.userId,
    };

    const response = await aiGateway.rerankDocuments(rerankRequest);
    
    if (response.success) {
      res.json(response.data);
    } else {
      res.status(400).json({ error: response.error });
    }
  } catch (error) {
    logger.error('Rerank request failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Business analysis endpoint
router.post('/analyze', extractTenantId, applyRateLimit, async (req, res) => {
  try {
    const { data, analysisType, userId } = req.body;
    
    if (!data || !analysisType) {
      return res.status(400).json({ error: 'Data and analysis type are required' });
    }

    const response = await aiGateway.analyzeBusinessData(
      data,
      analysisType,
      req.tenantId,
      userId
    );
    
    if (response.success) {
      res.json(response.data);
    } else {
      res.status(400).json({ error: response.error });
    }
  } catch (error) {
    logger.error('Analysis request failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Recommendations endpoint
router.post('/recommendations', extractTenantId, applyRateLimit, async (req, res) => {
  try {
    const { context, recommendationType, userId } = req.body;
    
    if (!context || !recommendationType) {
      return res.status(400).json({ error: 'Context and recommendation type are required' });
    }

    const response = await aiGateway.generateRecommendations(
      context,
      recommendationType,
      req.tenantId,
      userId
    );
    
    if (response.success) {
      res.json(response.data);
    } else {
      res.status(400).json({ error: response.error });
    }
  } catch (error) {
    logger.error('Recommendations request failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Document drafting endpoint
router.post('/draft', extractTenantId, applyRateLimit, async (req, res) => {
  try {
    const { content, documentType, tone, userId } = req.body;
    
    if (!content || !documentType || !tone) {
      return res.status(400).json({ error: 'Content, document type, and tone are required' });
    }

    const primary = () => aiGateway.draftDocument(content, documentType, tone, req.tenantId, userId);
    const shadow = req.headers['x-shadow-alt']
      ? () => aiGateway.draftDocument(content, documentType, tone, req.tenantId, userId)
      : null;

    const response = await withShadow(primary, shadow, (r) => logger.info({ evt: 'ai.shadow', ...r }));
    
    if (response.success) {
      res.json({ content: response.data });
    } else {
      res.status(400).json({ error: response.error });
    }
  } catch (error) {
    logger.error('Document drafting request failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Usage statistics endpoint
router.get('/usage', extractTenantId, (req, res) => {
  try {
    const { start, end } = req.query;
    let timeRange;
    
    if (start && end) {
      timeRange = {
        start: new Date(start as string),
        end: new Date(end as string),
      };
    }

    const stats = aiGateway.getUsageStats(req.tenantId, timeRange);
    res.json(stats);
  } catch (error) {
    logger.error('Usage stats request failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Available models endpoint
router.get('/models', (req, res) => {
  try {
    const { role } = req.query;
    const models = aiGateway.getAvailableModels(role as string);
    res.json(models);
  } catch (error) {
    logger.error('Models request failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Prometheus metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Metrics request failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
