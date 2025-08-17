// Browser-safe metrics implementation
// Only import prom-client on the server side

let client: any = null;
let registry: any = null;

// Export registry for server-side usage
export { registry };

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

if (!isBrowser) {
  // Only import prom-client on the server side
  try {
    client = require('prom-client');
    registry = new client.Registry();
    client.collectDefaultMetrics({ register: registry });
  } catch (error) {
    console.warn('Failed to initialize prom-client:', error);
  }
}

// Create browser-safe metric implementations
const createBrowserSafeMetric = (type: string, config: any) => {
  if (!isBrowser && client) {
    switch (type) {
      case 'Counter':
        return new client.Counter(config);
      case 'Gauge':
        return new client.Gauge(config);
      case 'Histogram':
        return new client.Histogram(config);
      default:
        return null;
    }
  }
  
  // Browser-safe fallback - no-op implementations
  return {
    inc: () => {},
    set: () => {},
    observe: () => {},
    registerMetric: () => {},
    metrics: async () => ''
  };
};

// AI Gateway specific metrics
export const reqCounter = createBrowserSafeMetric('Counter', {
  name: 'ai_gateway_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['provider', 'model', 'role', 'tenant', 'status'],
});

export const tokCounter = createBrowserSafeMetric('Counter', {
  name: 'ai_gateway_tokens_total',
  help: 'Total number of input/output tokens',
  labelNames: ['direction', 'provider', 'model', 'tenant'],
});

export const costCounter = createBrowserSafeMetric('Counter', {
  name: 'ai_gateway_cost_usd_total',
  help: 'Total estimated cost in USD',
  labelNames: ['provider', 'model', 'tenant'],
});

export const latencyHistogram = createBrowserSafeMetric('Histogram', {
  name: 'ai_gateway_request_duration_seconds',
  help: 'Request duration in seconds',
  labelNames: ['provider', 'model', 'role', 'tenant'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

export const circuitBreakerGauge = createBrowserSafeMetric('Gauge', {
  name: 'ai_gateway_circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=half_open, 2=open)',
  labelNames: ['provider', 'model'],
});

export const activeConnectionsGauge = createBrowserSafeMetric('Gauge', {
  name: 'ai_gateway_active_connections',
  help: 'Number of active connections to providers',
  labelNames: ['provider'],
});

// Register all metrics (only on server side)
if (!isBrowser && registry) {
  registry.registerMetric(reqCounter);
  registry.registerMetric(tokCounter);
  registry.registerMetric(costCounter);
  registry.registerMetric(latencyHistogram);
  registry.registerMetric(circuitBreakerGauge);
  registry.registerMetric(activeConnectionsGauge);
}

// Helper functions for recording metrics
export const recordRequest = (
  provider: string,
  model: string,
  role: string,
  tenant: string,
  status: 'success' | 'error' | 'timeout' | 'budget_exceeded'
) => {
  reqCounter.inc({ provider, model, role, tenant, status });
};

export const recordTokens = (
  direction: 'input' | 'output',
  provider: string,
  model: string,
  tenant: string,
  count: number
) => {
  tokCounter.inc({ direction, provider, model, tenant }, count);
};

export const recordCost = (
  provider: string,
  model: string,
  tenant: string,
  costUSD: number
) => {
  costCounter.inc({ provider, model, tenant }, costUSD);
};

export const recordLatency = (
  provider: string,
  model: string,
  role: string,
  tenant: string,
  durationSeconds: number
) => {
  latencyHistogram.observe({ provider, model, role, tenant }, durationSeconds);
};

export const recordCircuitBreakerState = (
  provider: string,
  model: string,
  state: 'closed' | 'half_open' | 'open'
) => {
  const stateValue = state === 'closed' ? 0 : state === 'half_open' ? 1 : 2;
  circuitBreakerGauge.set({ provider, model }, stateValue);
};

export const recordActiveConnections = (
  provider: string,
  count: number
) => {
  activeConnectionsGauge.set({ provider }, count);
};

// Get metrics as text for Prometheus scraping (only on server side)
export const getMetrics = async (): Promise<string> => {
  if (!isBrowser && registry) {
    return await registry.metrics();
  }
  return '';
};
