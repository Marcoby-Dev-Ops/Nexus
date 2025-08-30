/**
 * Core Integration Types
 * 
 * Contract-first connector interface for reliable 3rd-party connections
 * Every integration must implement this interface for consistent orchestration
 */

import { z } from 'zod';

// ============================================================================
// CORE CONNECTOR INTERFACE
// ============================================================================

export interface ConnectorContext {
  tenantId: string;
  installId: string;
  auth: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    tokenType?: string;
    [key: string]: any;
  };
  config: {
    [key: string]: any;
  };
  metadata: {
    provider: string;
    version: string;
    [key: string]: any;
  };
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  duration: number;
  cursor?: string;
  hasMore: boolean;
  data: any[];
}

export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  data: any;
  source: string;
  metadata?: Record<string, any>;
}

export interface Connector {
  id: string;
  name: string;
  version: string;
  
  // Authentication lifecycle
  authorize?(ctx: ConnectorContext, code?: string): Promise<ConnectorContext>;
  refresh?(ctx: ConnectorContext): Promise<ConnectorContext>;
  
  // Data synchronization
  backfill?(ctx: ConnectorContext, cursor?: string): Promise<SyncResult>;
  delta?(ctx: ConnectorContext, cursor?: string): Promise<SyncResult>;
  
  // Webhook handling
  handleWebhook?(ctx: ConnectorContext, headers: Record<string, string>, body: any): Promise<WebhookEvent[]>;
  
  // Health checks
  healthCheck?(ctx: ConnectorContext): Promise<{ healthy: boolean; details?: any }>;
  
  // Configuration
  getConfigSchema?(): z.ZodSchema;
  validateConfig?(config: any): boolean;
}

// ============================================================================
// WORKER JOB TYPES
// ============================================================================

export interface SyncJob {
  id: string;
  tenantId: string;
  installId: string;
  connectorId: string;
  type: 'backfill' | 'delta' | 'webhook';
  cursor?: string;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  scheduledFor?: string;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  cursor?: string;
  hasMore?: boolean;
  retryAfter?: number;
}

// ============================================================================
// HTTP CLIENT TYPES
// ============================================================================

export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  rateLimit?: {
    maxRequests: number;
    perWindow: number; // milliseconds
  };
  headers?: Record<string, string>;
}

export interface HttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface HttpResponse<T = any> {
  status: number;
  headers: Record<string, string>;
  data: T;
  url: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookConfig {
  secret?: string;
  algorithm?: 'sha256' | 'sha1';
  headerName?: string;
  tolerance?: number; // seconds
}

export interface WebhookVerification {
  isValid: boolean;
  signature?: string;
  timestamp?: string;
  body?: string;
}

// ============================================================================
// METRICS & MONITORING
// ============================================================================

export interface IntegrationMetrics {
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

export interface QueueMetrics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  activeJobs: number;
  averageProcessingTime: number;
  throughput: number;
}

export interface HealthStatus {
  healthy: boolean;
  connectorId: string;
  tenantId: string;
  lastCheck: string;
  details: {
    authValid: boolean;
    apiAccessible: boolean;
    rateLimitStatus?: string;
    errorCount?: number;
  };
}

// ============================================================================
// PROVIDER-SPECIFIC CONFIGS
// ============================================================================

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  authType: 'oauth2' | 'api_key' | 'bearer';
  rateLimits: {
    requestsPerSecond: number;
    burstSize: number;
  };
  timeouts: {
    request: number;
    connect: number;
  };
  retryConfig: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoff: number;
  };
  webhookConfig?: WebhookConfig;
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const ConnectorContextSchema = z.object({
  tenantId: z.string(),
  installId: z.string(),
  auth: z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresAt: z.string().optional(),
    tokenType: z.string().optional(),
  }).passthrough(),
  config: z.record(z.any()),
  metadata: z.object({
    provider: z.string(),
    version: z.string(),
  }).passthrough(),
});

export const SyncResultSchema = z.object({
  success: z.boolean(),
  recordsProcessed: z.number(),
  errors: z.array(z.string()),
  duration: z.number(),
  cursor: z.string().optional(),
  hasMore: z.boolean(),
  data: z.array(z.any()),
});

export const WebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.string(),
  data: z.any(),
  source: z.string(),
  metadata: z.record(z.any()).optional(),
});

export const SyncJobSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  installId: z.string(),
  connectorId: z.string(),
  type: z.enum(['backfill', 'delta', 'webhook']),
  cursor: z.string().optional(),
  priority: z.number(),
  retryCount: z.number(),
  maxRetries: z.number(),
  createdAt: z.string(),
  scheduledFor: z.string().optional(),
});
