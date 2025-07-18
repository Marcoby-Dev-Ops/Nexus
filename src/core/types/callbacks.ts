/**
 * Unified Callback Configuration System Types
 * Provides type-safe, extensible callback handling for all integrations
 */

export type CallbackType = 'oauth' | 'webhook' | 'api_key' | 'custom';
export type CallbackStatus = 'processing' | 'success' | 'error' | 'timeout';
export type CallbackMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Core callback configuration interface
 */
export interface CallbackConfig {
  /** Unique identifier for the callback */
  id: string;
  
  /** Integration slug this callback belongs to */
  integrationSlug: string;
  
  /** Type of callback */
  type: CallbackType;
  
  /** Path pattern for the callback (e.g., '/oauth/callback', '/webhook/:id') */
  path: string;
  
  /** HTTP methods this callback accepts */
  methods: CallbackMethod[];
  
  /** Handler function name or reference */
  handler: string | CallbackHandler;
  
  /** Configuration specific to this callback */
  config: CallbackSpecificConfig;
  
  /** Security settings */
  security: CallbackSecurity;
  
  /** Metadata */
  metadata: CallbackMetadata;
  
  /** Whether this callback is active */
  isActive: boolean;
  
  /** Created timestamp */
  createdAt: string;
  
  /** Updated timestamp */
  updatedAt?: string;
}

/**
 * Callback-specific configuration
 */
export interface CallbackSpecificConfig {
  /** OAuth-specific configuration */
  oauth?: {
    /** Expected state parameter validation */
    validateState: boolean;
    /** Required scopes */
    requiredScopes?: string[];
    /** Token exchange endpoint */
    tokenEndpoint?: string;
    /** Supabase function URL for OAuth handling */
    supabaseFunctionUrl?: string;
    /** Redirect URL after completion */
    redirectUrl?: string;
    /** Whether to use popup or redirect flow */
    flowType: 'popup' | 'redirect';
  };
  
  /** Webhook-specific configuration */
  webhook?: {
    /** Secret for webhook verification */
    secret?: string;
    /** Headers to validate */
    requiredHeaders?: string[];
    /** Payload validation schema */
    payloadSchema?: Record<string, unknown>;
    /** Retry configuration */
    retryConfig?: {
      maxRetries: number;
      backoffMs: number;
    };
  };
  
  /** API key-specific configuration */
  apiKey?: {
    /** Where to look for the API key */
    location: 'header' | 'query' | 'body';
    /** Parameter name */
    parameterName: string;
    /** Validation endpoint */
    validationEndpoint?: string;
  };
  
  /** Custom configuration */
  custom?: Record<string, unknown>;
}

/**
 * Security configuration for callbacks
 */
export interface CallbackSecurity {
  /** Whether to require authentication */
  requireAuth: boolean;
  
  /** CORS configuration */
  cors?: {
    origins: string[];
    methods: string[];
    headers: string[];
  };
  
  /** Rate limiting */
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  
  /** IP whitelist */
  ipWhitelist?: string[];
  
  /** Required headers for security */
  requiredHeaders?: string[];
  
  /** Signature verification */
  signatureVerification?: {
    algorithm: 'hmac-sha256' | 'hmac-sha1';
    secretKey: string;
    headerName: string;
  };
}

/**
 * Callback metadata
 */
export interface CallbackMetadata {
  /** Human-readable description */
  description?: string;
  
  /** Tags for categorization */
  tags?: string[];
  
  /** Integration version */
  version?: string;
  
  /** Environment (dev, staging, prod) */
  environment?: string;
  
  /** Analytics tracking */
  analytics?: {
    trackEvents: boolean;
    eventPrefix: string;
  };
  
  /** Error handling */
  errorHandling?: {
    logErrors: boolean;
    notifyOnError: boolean;
    errorWebhookUrl?: string;
  };
}

/**
 * Callback handler function signature
 */
export type CallbackHandler = (
  request: CallbackRequest,
  config: CallbackConfig
) => Promise<CallbackResponse>;

/**
 * Standardized callback request
 */
export interface CallbackRequest {
  /** HTTP method */
  method: CallbackMethod;
  
  /** Request path */
  path: string;
  
  /** Query parameters */
  query: Record<string, string>;
  
  /** Request body */
  body?: Record<string, unknown>;
  
  /** Request headers */
  headers: Record<string, string>;
  
  /** User context if authenticated */
  user?: {
    id: string;
    email?: string;
    metadata?: Record<string, unknown>;
  };
  
  /** Integration context */
  integration?: {
    id: string;
    slug: string;
    config: Record<string, unknown>;
  };
  
  /** Request metadata */
  metadata: {
    timestamp: string;
    requestId: string;
    userAgent?: string;
    ip?: string;
  };
}

/**
 * Standardized callback response
 */
export interface CallbackResponse {
  /** HTTP status code */
  status: number;
  
  /** Response body */
  body?: Record<string, unknown> | string;
  
  /** Response headers */
  headers?: Record<string, string>;
  
  /** Redirect URL if applicable */
  redirectUrl?: string;
  
  /** Whether to close popup window */
  closePopup?: boolean;
  
  /** Analytics events to track */
  analytics?: Array<{
    event: string;
    properties: Record<string, unknown>;
  }>;
  
  /** Errors if any */
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

/**
 * Callback execution context
 */
export interface CallbackContext {
  /** Request information */
  request: CallbackRequest;
  
  /** Configuration */
  config: CallbackConfig;
  
  /** Current status */
  status: CallbackStatus;
  
  /** Execution start time */
  startTime: string;
  
  /** Execution duration in ms */
  duration?: number;
  
  /** Retry count */
  retryCount: number;
  
  /** Error information */
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  
  /** Analytics data */
  analytics: {
    events: Array<{
      event: string;
      properties: Record<string, unknown>;
      timestamp: string;
    }>;
  };
}

/**
 * Callback registry configuration
 */
export interface CallbackRegistry {
  /** All registered callbacks */
  callbacks: Map<string, CallbackConfig>;
  
  /** Path to callback mapping */
  pathMap: Map<string, string>;
  
  /** Integration to callbacks mapping */
  integrationMap: Map<string, string[]>;
  
  /** Register a new callback */
  register: (config: CallbackConfig) => void;
  
  /** Unregister a callback */
  unregister: (id: string) => void;
  
  /** Get callback by ID */
  get: (id: string) => CallbackConfig | undefined;
  
  /** Get callbacks by integration */
  getByIntegration: (integrationSlug: string) => CallbackConfig[];
  
  /** Get callback by path */
  getByPath: (path: string) => CallbackConfig | undefined;
  
  /** Validate callback configuration */
  validate: (config: CallbackConfig) => ValidationResult;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  
  /** Validation errors */
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  
  /** Validation warnings */
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Callback execution metrics
 */
export interface CallbackMetrics {
  /** Total executions */
  totalExecutions: number;
  
  /** Successful executions */
  successfulExecutions: number;
  
  /** Failed executions */
  failedExecutions: number;
  
  /** Average execution time */
  averageExecutionTime: number;
  
  /** Success rate */
  successRate: number;
  
  /** Error breakdown */
  errorBreakdown: Record<string, number>;
  
  /** Execution history */
  executionHistory: Array<{
    timestamp: string;
    status: CallbackStatus;
    duration: number;
    error?: string;
  }>;
}

/**
 * Callback event types for analytics
 */
export enum CallbackEvent {
  CALLBACK_STARTED = 'callback_started',
  CALLBACK_COMPLETED = 'callback_completed',
  CALLBACK_FAILED = 'callback_failed',
  CALLBACK_TIMEOUT = 'callback_timeout',
  CALLBACK_RETRIED = 'callback_retried',
  OAUTH_STARTED = 'oauth_started',
  OAUTH_COMPLETED = 'oauth_completed',
  OAUTH_FAILED = 'oauth_failed',
  WEBHOOK_RECEIVED = 'webhook_received',
  WEBHOOK_PROCESSED = 'webhook_processed',
  WEBHOOK_FAILED = 'webhook_failed',
  API_KEY_VALIDATED = 'api_key_validated',
  API_KEY_INVALID = 'api_key_invalid'
}

/**
 * Pre-built callback configurations for common integrations
 */
export interface CallbackTemplate {
  /** Template ID */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Template description */
  description: string;
  
  /** Integration type this template is for */
  integrationType: string;
  
  /** Template configuration */
  template: Omit<CallbackConfig, 'id' | 'integrationSlug' | 'createdAt'>;
  
  /** Required environment variables */
  requiredEnvVars: string[];
  
  /** Setup instructions */
  setupInstructions: string;
  
  /** Example usage */
  exampleUsage?: string;
} 