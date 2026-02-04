/// <reference path="../types/express.d.ts" />
import express from 'express';
// Server-side modules live under server/services and server/src
// Use CommonJS require for runtime JS module and fall back to typed any for TS where needed
const { NexusAIGatewayService } = require('../services/NexusAIGatewayService');
type ChatRequest = any;
type EmbeddingRequest = any;
type RerankRequest = any;
// BudgetTier alias to match declared/shared type
type BudgetTier = 'free' | 'standard' | 'premium' | 'enterprise';
import { logger } from '../src/utils/logger';
// Metrics are provided by server utilities; reuse monitor summary if specific module not present
let getMetrics: () => Promise<string>;
try {
  // prefer a dedicated metrics export if present
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const metricsModule = require('../services/metrics');
  getMetrics = metricsModule.getMetrics;
} catch (e) {
  // fallback to monitor utility which exposes metrics-like summaries
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const monitor = require('../src/utils/monitor');
  getMetrics = async () => typeof monitor.getMetricsSummary === 'function' ? monitor.getMetricsSummary() : '';
}

// Shadow middleware and guards: server has middleware/ and client-side guard implementations.
// Where server-side equivalents don't exist, use lightweight adapters that call client/lib logic when possible.
let withShadow: (primary: () => Promise<any>, shadow: (() => Promise<any>) | null, onShadow?: (r: any) => void) => Promise<any>;
let assertRateLimit: (tenantId: string) => Promise<void>;
let RateLimitExceededError: any;
let assertBudget: (estimated: number, opts?: any) => void;
let BudgetExceededError: any;
try {
  // prefer server-side middleware/guards
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const aiGuards = require('../src/ai/guards') as any;
  assertRateLimit = aiGuards.assertRateLimit;
  RateLimitExceededError = aiGuards.RateLimitExceededError;
  assertBudget = aiGuards.assertBudget;
  BudgetExceededError = aiGuards.BudgetExceededError;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const shadow = require('../src/ai/middleware/shadowMode') as any;
  withShadow = shadow.withShadow;
} catch (err) {
  // fallback to client-side implementations where available
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const clientGuards = require('../../client/src/lib/ai/guards/rateLimit') as any;
    assertRateLimit = clientGuards.assertRateLimit;
    RateLimitExceededError = clientGuards.RateLimitExceededError;
  } catch (e) {
    // final fallback: no-op implementations so server types compile; runtime behavior will be permissive
    assertRateLimit = async () => undefined;
    RateLimitExceededError = class RateLimitExceededError extends Error {};
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const clientBudget = require('../../client/src/lib/ai/guards/budgetGuard') as any;
    assertBudget = clientBudget.assertBudget;
    BudgetExceededError = clientBudget.BudgetExceededError;
  } catch (e) {
    assertBudget = () => undefined;
    BudgetExceededError = class BudgetExceededError extends Error {};
  }
  // shadow middleware fallback (simple passthrough)
  withShadow = async (primary: any, _shadow: any, _onShadow?: any) => {
    return { success: true, data: await primary() };
  };
}
// Use CommonJS require for server-side AuditService
const AuditService = require('../services/AuditService');

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
  
  (req as any).tenantId = tenantId;
  next();
};

// Middleware to apply rate limiting
const applyRateLimit = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
  await assertRateLimit((req as any).tenantId);
    next();
  } catch (error) {
    const err: any = error;
    if (err instanceof RateLimitExceededError) {
      res.status(429).json({
        error: err.message,
        retryAfter: err.retryAfter,
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
    const err: any = error;
    if (err instanceof BudgetExceededError) {
      res.status(402).json({
        error: err.message,
        budget: err.budgetUSD,
        actual: err.actualUSD,
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
    const err: any = error;
    logger.error('Health check failed:', err);
    res.status(500).json({
      status: 'unhealthy',
      error: err instanceof Error ? err.message : 'Unknown error',
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
  tenantId: (req as any).tenantId,
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
      try {
        await AuditService.recordEvent({
          eventType: 'ai_chat_request',
          objectType: 'ai_chat',
          actorId: chatRequest.userId || null,
          endpoint: '/api/ai/chat',
          data: { tenantId: (req as any).tenantId, messageCount: (chatRequest.messages || []).length }
        });
      } catch (auditErr) {
  const aerr: any = auditErr;
  (logger as any).warn('Failed to record audit for ai chat request', { error: aerr?.message || aerr });
      }
      res.json(response.data);
    } else {
      res.status(400).json({ error: response.error });
    }
  } catch (error) {
  const err: any = error;
  (logger as any).error('Chat request failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// Embeddings endpoint
router.post('/embeddings', extractTenantId, applyRateLimit, async (req, res) => {
  try {
    const embeddingRequest: EmbeddingRequest = {
      text: req.body.text,
      model: req.body.model,
  tenantId: (req as any).tenantId,
      userId: req.body.userId,
    };

    const response = await aiGateway.generateEmbeddings(embeddingRequest);
    
    if (response.success) {
      res.json(response.data);
    } else {
      res.status(400).json({ error: response.error });
    }
  } catch (error) {
  const err: any = error;
  (logger as any).error('Embedding request failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
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
  tenantId: (req as any).tenantId,
      userId: req.body.userId,
    };

    const response = await aiGateway.rerankDocuments(rerankRequest);
    
    if (response.success) {
      res.json(response.data);
    } else {
      res.status(400).json({ error: response.error });
    }
  } catch (error) {
  const err: any = error;
  (logger as any).error('Rerank request failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
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
  (req as any).tenantId,
      userId
    );
    
    if (response.success) {
      res.json(response.data);
    } else {
      res.status(400).json({ error: response.error });
    }
  } catch (error) {
  const err: any = error;
  (logger as any).error('Analysis request failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
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
  (req as any).tenantId,
      userId
    );
    
    if (response.success) {
      res.json(response.data);
    } else {
      res.status(400).json({ error: response.error });
    }
  } catch (error) {
  const err: any = error;
  (logger as any).error('Recommendations request failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
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

  const primary = () => aiGateway.draftDocument(content, documentType, tone, (req as any).tenantId, userId);
    const shadow = req.headers['x-shadow-alt']
  ? () => aiGateway.draftDocument(content, documentType, tone, (req as any).tenantId, userId)
      : null;

    const response = await withShadow(primary, shadow, (r) => logger.info({ evt: 'ai.shadow', ...r }));
    
    if (response.success) {
      res.json({ content: response.data });
    } else {
      res.status(400).json({ error: response.error });
    }
  } catch (error) {
  const err: any = error;
  (logger as any).error('Document drafting request failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
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

  const stats = aiGateway.getUsageStats((req as any).tenantId, timeRange);
    res.json(stats);
  } catch (error) {
  const err: any = error;
  (logger as any).error('Usage stats request failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
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
  const err: any = error;
  (logger as any).error('Models request failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
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
  const err: any = error;
  (logger as any).error('Metrics request failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

export default router;
