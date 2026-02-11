# Nexus AI Gateway

A provider-agnostic, policy-driven routing layer for AI operations in Nexus. This gateway provides intelligent model selection, cost optimization, and unified access to multiple AI providers.

## 🏗️ Architecture Overview

The Nexus AI Gateway implements a three-layer architecture:

### Layer 1: AI Gateway (Your Code)
- **Unified Interface**: Single API for all AI operations
- **Intelligent Routing**: Policy-driven model selection
- **Cost Management**: Budget tracking and optimization
- **Circuit Breakers**: Automatic failover and retry logic
- **Usage Tracking**: Comprehensive analytics and monitoring

### Layer 2: Providers
- **OpenAI**: High-quality, reliable function calling
- **OpenRouter**: Breadth of models, cost-effective alternatives
- **Local Inference**: Privacy, cost control, and offline capabilities

### Layer 3: Business Logic
- **RAG Pipeline**: Hybrid retrieval with reranking
- **Business Analysis**: Financial, operational, and strategic insights
- **Document Generation**: Proposals, reports, and communications

## 🚀 Quick Start

### 1. Environment Setup

Add these environment variables to your `.env` file:

```bash
# OpenAI (for high-quality tasks)
OPENAI_API_KEY=your_openai_api_key

# OpenRouter (for cost-effective alternatives)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# Local Inference (for privacy and cost control)
LOCAL_OPENAI_URL=http://localhost:8000
LOCAL_API_KEY=sk-local
```

### 2. Basic Usage

```typescript
import { NexusAIGatewayService } from '@/ai/services/NexusAIGatewayService';

// Initialize the gateway
const aiGateway = new NexusAIGatewayService({
  enableOpenAI: true,
  enableOpenRouter: true,
  enableLocal: true,
});

// Chat with AI
const response = await aiGateway.chat({
  messages: [
    { role: 'user', content: 'What are the key principles of business growth?' }
  ],
  tenantId: 'your-tenant-id',
  role: 'chat',
  sensitivity: 'internal',
});

console.log(response.data.message);
```

### 3. Start Local Services

```bash
# Start local inference services
docker-compose -f docker-compose.ai.yml up -d

# Check health
curl http://localhost:8000/health
```

## 📊 Model Routing Decision Matrix

| Task Type | Default Provider | Backup Provider | Local Option | Use Case |
|-----------|------------------|-----------------|--------------|----------|
| **Complex Chat + Tools** | OpenAI | OpenRouter (Claude) | 14-70B Instruct | Mission-critical UX |
| **Fast Q&A, Drafts** | OpenRouter | OpenAI Mini | 7-8B Instruct | Cost optimization |
| **Embeddings** | Local (BGE-M3) | OpenAI/Cohere | — | Scale and privacy |
| **Reranking** | Local (BGE-Reranker) | Cohere/Voyage | — | Quality improvement |
| **Business Analysis** | OpenAI | OpenRouter | — | Structured insights |
| **Document Drafting** | OpenRouter | OpenAI | Local 7-8B | Cost-effective creation |

## 🔧 API Reference

### Chat Operations

```typescript
// Basic chat
const chatResponse = await aiGateway.chat({
  messages: ChatMessage[],
  tenantId: string,
  role?: 'reasoning' | 'chat' | 'draft',
  sensitivity?: 'public' | 'internal' | 'restricted',
  budgetCents?: number,
  latencyTargetMs?: number,
  json?: boolean,
  tools?: any[],
});
```

### Embeddings

```typescript
// Generate embeddings
const embeddingResponse = await aiGateway.generateEmbeddings({
  text: string,
  tenantId: string,
  model?: string,
});
```

### Business Analysis

```typescript
// Analyze business data
const analysisResponse = await aiGateway.analyzeBusinessData(
  data: any,
  analysisType: 'financial' | 'operational' | 'strategic',
  tenantId: string,
);
```

### Recommendations

```typescript
// Generate business recommendations
const recommendationsResponse = await aiGateway.generateRecommendations(
  context: string,
  recommendationType: 'growth' | 'efficiency' | 'risk' | 'opportunity',
  tenantId: string,
);
```

### Document Drafting

```typescript
// Draft business documents
const draftResponse = await aiGateway.draftDocument(
  content: string,
  documentType: 'proposal' | 'report' | 'plan' | 'email',
  tone: 'professional' | 'casual' | 'formal',
  tenantId: string,
);
```

## 🌐 REST API Endpoints

### Health Check
```bash
GET /api/ai/health
```

### Chat
```bash
POST /api/ai/chat
Content-Type: application/json
X-Tenant-ID: your-tenant-id

{
  "messages": [
    {"role": "user", "content": "Hello, how can you help me?"}
  ],
  "role": "chat",
  "sensitivity": "internal"
}
```

### Embeddings
```bash
POST /api/ai/embeddings
Content-Type: application/json
X-Tenant-ID: your-tenant-id

{
  "text": "Your text to embed",
  "model": "bge-m3"
}
```

### Business Analysis
```bash
POST /api/ai/analyze
Content-Type: application/json
X-Tenant-ID: your-tenant-id

{
  "data": {...},
  "analysisType": "financial"
}
```

### Usage Statistics
```bash
GET /api/ai/usage?start=2024-01-01&end=2024-01-31
X-Tenant-ID: your-tenant-id
```

## 🐳 Local Deployment

### 1. Start Local Services

```bash
# Start all AI services
docker-compose -f docker-compose.ai.yml up -d

# Check service status
docker-compose -f docker-compose.ai.yml ps
```

### 2. Verify Services

```bash
# Check vLLM server
curl http://localhost:8000/v1/models

# Check BGE embeddings
curl http://localhost:8001/v1/models

# Check BGE reranker
curl http://localhost:8002/v1/models
```

### 3. Test the Gateway

```bash
# Run the example script
npm run demo:ai

# Or run directly
npx tsx scripts/ai-gateway-example.ts
```

## 📈 Monitoring and Analytics

### Usage Statistics

```typescript
// Get usage stats for a tenant
const stats = aiGateway.getUsageStats('tenant-id', {
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
});

console.log({
  totalRequests: stats.totalRequests,
  totalCost: stats.totalCost,
  successRate: stats.successRate,
  averageLatency: stats.averageLatency,
});
```

### Provider Health

```typescript
// Check provider health
const health = await aiGateway.getProviderHealth();
console.log(health);
```

### Connection Testing

```typescript
// Test all provider connections
const connections = await aiGateway.testConnections();
console.log(connections);
```

## 📡 Observability & Metrics

- Prometheus metrics are available at `/api/ai/metrics`
- Metrics exposed:
  - `ai_gateway_requests_total{provider,model,role,tenant,status}`
  - `ai_gateway_tokens_total{direction,provider,model,tenant}`
  - `ai_gateway_cost_usd_total{provider,model,tenant}`
  - `ai_gateway_request_duration_seconds{provider,model,role,tenant}`
  - `ai_gateway_circuit_breaker_state{provider,model}`

## 🛡️ Guardrails

- Rate limiting per tenant (60/min, 1k/hr, 10k/day by default)
- Budget caps per request and daily per tenant (tiers: low/standard/premium)
- Circuit breaker with rolling failure tracking and auto reset

## 🧪 Shadow Mode

- Enable by setting header `X-Tenant-ID` and `X-Shadow-Alt: 1` on `/api/ai/chat` or `/api/ai/draft`
- Alternate path runs in the background; diffs logged with `evt: ai.shadow`

## 📚 RAG Pipeline

- Helpers in `src/ai/rag/pipeline.ts`: `embed()` and `ragQuery()`
- Wire `upsertVectors` and `searchVectors` to Postgres/pgvector implementation

## 🔒 Security and Privacy

### Data Sensitivity Levels

- **Public**: Non-sensitive data, can use any provider
- **Internal**: Business data, prefer OpenAI with enterprise terms
- **Restricted**: Sensitive data, use local models when possible

### Budget Controls

```typescript
// Set budget limits
const response = await aiGateway.chat({
  messages: [...],
  tenantId: 'tenant-id',
  budgetCents: 100, // $1.00 limit
});
```

### Circuit Breakers

The gateway automatically implements circuit breakers to prevent cascading failures:

- **Failure Threshold**: 5 consecutive failures
- **Recovery Time**: Automatic reset on success
- **Fallback**: Automatic provider switching

## 🎯 Best Practices

### 1. Model Selection

```typescript
// For high-quality reasoning
const response = await aiGateway.chat({
  messages: [...],
  role: 'reasoning', // Uses OpenAI GPT-4o
  tenantId: 'tenant-id',
});

// For cost-effective drafting
const response = await aiGateway.chat({
  messages: [...],
  role: 'draft', // Uses OpenRouter Llama
  tenantId: 'tenant-id',
});
```

### 2. Budget Management

```typescript
// Set appropriate budgets based on task importance
const response = await aiGateway.chat({
  messages: [...],
  budgetCents: 50, // $0.50 for routine tasks
  tenantId: 'tenant-id',
});
```

### 3. Error Handling

```typescript
try {
  const response = await aiGateway.chat({
    messages: [...],
    tenantId: 'tenant-id',
  });
  
  if (response.success) {
    // Handle success
  } else {
    // Handle business logic errors
    console.error(response.error);
  }
} catch (error) {
  // Handle system errors
  console.error('System error:', error);
}
```

## 🔧 Configuration

### Gateway Configuration

```typescript
const aiGateway = new NexusAIGatewayService({
  enableOpenAI: true,
  enableOpenRouter: true,
  enableLocal: true,
  maxRetries: 3,
  retryDelayMs: 1000,
  enableUsageTracking: true,
  enableCircuitBreaker: true,
});
```

### Environment Variables

```bash
# Provider Configuration
OPENAI_API_KEY=sk-...
VITE_OPENROUTER_API_KEY=sk-or-...
LOCAL_OPENAI_URL=http://localhost:8000
LOCAL_API_KEY=sk-local

# Application Configuration
VITE_NEXT_PUBLIC_APP_URL=https://nexus.marcoby.net
```

## 🚀 Performance Optimization

### 1. Caching

```typescript
// The gateway automatically caches responses
// Use Redis for distributed caching
const redis = new Redis(process.env.REDIS_URL);
```

### 2. Batch Operations

```typescript
// For multiple embeddings, batch them
const texts = ['text1', 'text2', 'text3'];
const embeddings = await Promise.all(
  texts.map(text => aiGateway.generateEmbeddings({ text, tenantId }))
);
```

### 3. Async Processing

```typescript
// For non-critical operations, use async processing
const draftPromise = aiGateway.draftDocument(
  content,
  'proposal',
  'professional',
  tenantId
);

// Continue with other work
const result = await draftPromise;
```

## 🔄 Migration Guide

### From Direct API Calls

**Before:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI();
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }],
});
```

**After:**
```typescript
import { NexusAIGatewayService } from '@/ai/services/NexusAIGatewayService';

const aiGateway = new NexusAIGatewayService();
const response = await aiGateway.chat({
  messages: [{ role: 'user', content: 'Hello' }],
  tenantId: 'tenant-id',
});
```

### From Multiple Providers

**Before:**
```typescript
// Manual provider selection
if (task === 'critical') {
  const response = await openai.chat.completions.create({...});
} else {
  const response = await openrouter.chat.completions.create({...});
}
```

**After:**
```typescript
// Automatic provider selection
const response = await aiGateway.chat({
  messages: [...],
  role: task === 'critical' ? 'reasoning' : 'draft',
  tenantId: 'tenant-id',
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Provider Connection Failed**
   ```bash
   # Check API keys
   echo $OPENAI_API_KEY
   echo $VITE_OPENROUTER_API_KEY
   
   # Test connections
   curl http://localhost:8000/health
   ```

2. **Local Services Not Starting**
   ```bash
   # Check Docker resources
   docker system df
   docker stats
   
   # Check logs
   docker-compose -f docker-compose.ai.yml logs
   ```

3. **High Latency**
   ```bash
   # Check provider health
   curl http://localhost:8000/health
   
   # Monitor usage
   curl http://localhost:8000/api/ai/usage
   ```

### Debug Mode

```typescript
// Enable debug logging
const aiGateway = new NexusAIGatewayService({
  enableOpenAI: true,
  enableOpenRouter: true,
  enableLocal: true,
});

// Check provider status
const health = await aiGateway.getProviderHealth();
console.log('Provider health:', health);
```

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [vLLM Documentation](https://docs.vllm.ai/)
- [BGE Embeddings](https://huggingface.co/BAAI/bge-m3)
- [Nexus Business Platform](https://nexus.marcoby.net)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is part of the Nexus business platform and follows the same licensing terms.
