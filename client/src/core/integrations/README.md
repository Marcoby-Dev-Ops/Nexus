# Nexus Integration SDK

A robust, contract-first integration layer for reliable 3rd-party connections in Nexus.

## Features

- **Contract-first Connector Interface** - Every integration behaves consistently
- **Resilient HTTP Client** - Timeouts, retries, rate limiting, circuit breaker patterns
- **BullMQ Worker Orchestration** - Backfill, delta, webhook processing with exponential backoff
- **HMAC Webhook Verification** - Secure webhook handling with signature validation
- **Tenant Isolation** - Zero-retention design with proper data boundaries
- **Observability** - Comprehensive logging and metrics

## Quick Start

### 1. Install Dependencies

```bash
pnpm add bullmq redis uuid
```

### 2. Environment Configuration

Add these environment variables to your `.env` file:

```env
# Redis Configuration (for BullMQ workers)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_URL=redis://localhost:6379

# Integration SDK Configuration
INTEGRATION_WORKER_CONCURRENCY=5
INTEGRATION_MAX_RETRIES=3
INTEGRATION_BACKOFF_DELAY=2000

# HubSpot Configuration (example)
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
HUBSPOT_REDIRECT_URI=http://localhost:3000/integrations/hubspot/callback
HUBSPOT_WEBHOOK_SECRET=your_hubspot_webhook_secret
```

### 3. Initialize the Service

```typescript
import { integrationService } from '@/core/integrations';

// Initialize the integration service
await integrationService.initialize();
```

### 4. Start Workers

```bash
# Start the worker processes
pnpm run worker
```

## Architecture

### Core Components

1. **Connector Interface** (`types.ts`)
   - Defines the contract all integrations must follow
   - Standardizes authentication, sync, and webhook handling

2. **HTTP Client** (`http-client.ts`)
   - Resilient HTTP layer with retries and rate limiting
   - Provider-specific configurations

3. **Webhook Utilities** (`webhooks.ts`)
   - HMAC verification and event normalization
   - Secure webhook processing

4. **Base Connector** (`connector-base.ts`)
   - Abstract base class for all connectors
   - Common functionality and error handling

5. **Worker Orchestration** (`worker.ts`)
   - BullMQ-based job processing
   - Exponential backoff and dead letter queues

6. **Connector Registry** (`registry.ts`)
   - Central registry for all available integrations
   - Discovery and metadata management

### Data Flow

```
User Action → Integration Service → Connector → Worker Queue → Processing → Results
```

## Usage Examples

### Starting a Sync

```typescript
import { integrationService } from '@/core/integrations';

// Start a backfill sync
const jobId = await integrationService.startBackfill(
  'hubspot',
  'tenant-123',
  'install-456'
);

// Start a delta sync
const jobId = await integrationService.startDelta(
  'hubspot',
  'tenant-123',
  'install-456'
);
```

### Processing Webhooks

```typescript
// Process incoming webhook
const jobId = await integrationService.processWebhook(
  'hubspot',
  'tenant-123',
  'install-456',
  headers,
  body
);
```

### Health Checks

```typescript
// Schedule health check
const jobId = await integrationService.scheduleHealthCheck(
  'hubspot',
  'tenant-123',
  'install-456'
);

// Immediate health check
const health = await integrationService.healthCheckImmediate(
  'hubspot',
  connectorContext
);
```

### Getting Connector Information

```typescript
// Get all available connectors
const connectors = integrationService.getAvailableConnectors();

// Get specific connector
const hubspot = integrationService.getConnector('hubspot');

// Get connectors by feature
const webhookConnectors = integrationService.getWebhookSupportedConnectors();
```

## Creating a New Connector

### 1. Extend BaseConnector

```typescript
import { BaseConnector } from '@/core/integrations/connector-base';
import { ConnectorContext, SyncResult, WebhookEvent } from '@/core/integrations/types';
import { PROVIDER_CONFIGS } from '@/core/integrations/http-client';

export class MyConnector extends BaseConnector {
  constructor() {
    super(
      'my-provider',
      'My Provider',
      '1.0.0',
      PROVIDER_CONFIGS.myProvider // Add to PROVIDER_CONFIGS
    );
  }

  async authorize(ctx: ConnectorContext, code?: string): Promise<ConnectorContext> {
    // Implement OAuth flow
  }

  async refresh(ctx: ConnectorContext): Promise<ConnectorContext> {
    // Implement token refresh
  }

  async backfill(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    // Implement initial data sync
  }

  async delta(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    // Implement incremental sync
  }

  async handleWebhook(
    ctx: ConnectorContext,
    headers: Record<string, string>,
    body: any
  ): Promise<WebhookEvent[]> {
    // Implement webhook handling
  }
}
```

### 2. Register the Connector

```typescript
// In registry.ts
import { MyConnector } from './connectors/my-connector';

export function initializeConnectors(): void {
  // Register your connector
  const myConnector = new MyConnector();
  ConnectorFactory.register(myConnector);
}
```

### 3. Add Provider Configuration

```typescript
// In http-client.ts
export const PROVIDER_CONFIGS = {
  // ... existing configs
  myProvider: {
    name: 'My Provider',
    baseUrl: 'https://api.myprovider.com',
    authType: 'oauth2' as const,
    rateLimits: {
      requestsPerSecond: 2,
      burstSize: 5,
    },
    timeouts: {
      request: 30000,
      connect: 10000,
    },
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoff: 60000,
    },
  },
} as const;
```

## Worker Management

### Starting Workers

```bash
# Development
pnpm run worker

# Production
NODE_ENV=production pnpm run worker
```

### Monitoring Workers

```typescript
// Get queue statistics
const stats = await integrationService.getQueueStats();

// Get connector statistics
const connectorStats = integrationService.getConnectorStats();
```

### Worker Configuration

```typescript
// Queue configuration in worker.ts
const queueConfigs = [
  { name: 'integration-backfill', concurrency: 2 },
  { name: 'integration-delta', concurrency: 5 },
  { name: 'integration-webhook', concurrency: 10 },
  { name: 'integration-health', concurrency: 3 },
];
```

## Security Features

### Webhook Verification

All webhooks are verified using HMAC signatures:

```typescript
// Automatic verification in webhook handlers
const events = await connector.handleWebhook(ctx, headers, body);
```

### Tenant Isolation

Every operation carries tenant context:

```typescript
const ctx: ConnectorContext = {
  tenantId: 'tenant-123',
  installId: 'install-456',
  auth: { /* ... */ },
  config: { /* ... */ },
  metadata: { /* ... */ },
};
```

### Rate Limiting

Provider-specific rate limits are automatically enforced:

```typescript
// HubSpot: 4 requests/second, burst of 10
// Slack: 1 request/second, burst of 3
// Salesforce: 2 requests/second, burst of 5
```

## Error Handling

### Automatic Retries

- Exponential backoff with jitter
- Configurable max retries per operation
- Dead letter queues for failed jobs

### Token Refresh

Automatic token refresh on 401 errors:

```typescript
// Handled automatically in BaseConnector
if (this.isTokenExpiredError(error)) {
  const refreshedCtx = await this.refresh(ctx);
  // Retry operation with refreshed context
}
```

### Rate Limit Handling

Automatic rate limit detection and backoff:

```typescript
if (this.isRateLimitError(error)) {
  const retryAfter = this.extractRetryAfter(error);
  // Schedule retry after delay
}
```

## Monitoring and Observability

### Logging

Comprehensive logging with structured data:

```typescript
logger.info('Starting connector operation', {
  connectorId: this.id,
  tenantId: ctx.tenantId,
  operation: 'backfill',
  timestamp: new Date().toISOString(),
});
```

### Metrics

Integration metrics for monitoring:

```typescript
interface IntegrationMetrics {
  connectorId: string;
  tenantId: string;
  timestamp: string;
  operation: 'backfill' | 'delta' | 'webhook' | 'auth' | 'refresh';
  duration: number;
  success: boolean;
  recordsProcessed?: number;
  errorCode?: string;
  retryCount?: number;
}
```

### Health Checks

Regular health checks for all connectors:

```typescript
// Scheduled health checks
await integrationService.scheduleHealthCheck('hubspot', tenantId, installId);

// Health check results
{
  healthy: boolean;
  details: {
    authValid: boolean;
    apiAccessible: boolean;
    rateLimitStatus?: string;
    errorCount?: number;
  };
}
```

## Production Checklist

- [ ] Configure Redis for production
- [ ] Set up proper environment variables
- [ ] Configure webhook secrets
- [ ] Set up monitoring and alerting
- [ ] Configure rate limits per tenant
- [ ] Set up dead letter queue monitoring
- [ ] Configure backup and recovery
- [ ] Set up log aggregation
- [ ] Configure metrics collection
- [ ] Test failure scenarios

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis is running
   - Verify connection string
   - Check firewall settings

2. **Webhook Verification Failed**
   - Verify webhook secret
   - Check signature algorithm
   - Validate timestamp tolerance

3. **Rate Limit Errors**
   - Check provider rate limits
   - Verify burst size configuration
   - Monitor queue backlogs

4. **Token Refresh Failures**
   - Check refresh token validity
   - Verify OAuth configuration
   - Check provider API status

### Debug Mode

Enable debug logging:

```typescript
// Set log level to debug
process.env.LOG_LEVEL = 'debug';
```

## API Reference

### IntegrationService

- `initialize()` - Initialize the service
- `startBackfill()` - Start backfill sync
- `startDelta()` - Start delta sync
- `processWebhook()` - Process webhook
- `scheduleHealthCheck()` - Schedule health check
- `getAvailableConnectors()` - Get all connectors
- `getConnector()` - Get specific connector
- `validateConnectorConfig()` - Validate configuration

### BaseConnector

- `authorize()` - OAuth authorization
- `refresh()` - Token refresh
- `backfill()` - Initial data sync
- `delta()` - Incremental sync
- `handleWebhook()` - Webhook processing
- `healthCheck()` - Health check

### Worker Manager

- `scheduleBackfillJob()` - Schedule backfill
- `scheduleDeltaJob()` - Schedule delta
- `scheduleWebhookJob()` - Schedule webhook
- `getQueueStats()` - Get queue statistics

## Contributing

1. Follow the contract-first interface
2. Implement all required methods
3. Add proper error handling
4. Include comprehensive tests
5. Update documentation
6. Add provider configuration
7. Register in connector registry
