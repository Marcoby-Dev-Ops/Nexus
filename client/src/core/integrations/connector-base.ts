/**
 * Base Connector Class
 * 
 * Provides common functionality and enforces the connector contract
 * All integrations must extend this class
 */

import type { 
  Connector, 
  ConnectorContext, 
  SyncResult, 
  WebhookEvent,
  ProviderConfig 
} from './types';
import type { HttpClient} from './http-client';
import { HttpClientFactory, PROVIDER_CONFIGS } from './http-client';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

export abstract class BaseConnector implements Connector {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  
  protected httpClient: HttpClient;
  protected providerConfig: ProviderConfig;

  constructor(
    id: string,
    name: string,
    version: string,
    providerConfig: ProviderConfig
  ) {
    this.id = id;
    this.name = name;
    this.version = version;
    this.providerConfig = providerConfig;

    // Create HTTP client with provider-specific config
    this.httpClient = HttpClientFactory.createClient(id, {
      baseUrl: providerConfig.baseUrl,
      timeout: providerConfig.timeouts.request,
      maxRetries: providerConfig.retryConfig.maxRetries,
      retryDelay: providerConfig.retryConfig.backoffMultiplier * 1000,
      rateLimit: {
        maxRequests: providerConfig.rateLimits.burstSize,
        perWindow: 1000 / providerConfig.rateLimits.requestsPerSecond,
      },
    });
  }

  // ============================================================================
  // ABSTRACT METHODS (must be implemented by subclasses)
  // ============================================================================

  /**
   * Authorize the connector (OAuth flow)
   */
  abstract authorize(ctx: ConnectorContext, code?: string): Promise<ConnectorContext>;

  /**
   * Refresh authentication tokens
   */
  abstract refresh(ctx: ConnectorContext): Promise<ConnectorContext>;

  /**
   * Perform initial data backfill
   */
  abstract backfill(ctx: ConnectorContext, cursor?: string): Promise<SyncResult>;

  /**
   * Perform delta sync (incremental changes)
   */
  abstract delta(ctx: ConnectorContext, cursor?: string): Promise<SyncResult>;

  /**
   * Handle incoming webhooks
   */
  abstract handleWebhook(
    ctx: ConnectorContext, 
    headers: Record<string, string>, 
    body: any
  ): Promise<WebhookEvent[]>;

  // ============================================================================
  // OPTIONAL METHODS (can be overridden)
  // ============================================================================

  /**
   * Health check for the connector
   */
  async healthCheck(ctx: ConnectorContext): Promise<{ healthy: boolean; details?: any }> {
    try {
      // Default health check: try to make a simple API call
      const response = await this.httpClient.get('/health', {
        'Authorization': `Bearer ${ctx.auth.accessToken}`,
      });

      return {
        healthy: response.status === 200,
        details: {
          status: response.status,
          responseTime: Date.now(),
        },
      };
    } catch (error) {
      logger.error('Health check failed', {
        connectorId: this.id,
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Get configuration schema for validation
   */
  getConfigSchema(): z.ZodSchema {
    // Default empty schema - override in subclasses
    return z.object({});
  }

  /**
   * Validate connector configuration
   */
  validateConfig(config: any): boolean {
    try {
      const schema = this.getConfigSchema();
      schema.parse(config);
      return true;
    } catch (error) {
      logger.error('Config validation failed', {
        connectorId: this.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Create a standardized sync result
   */
  protected createSyncResult(
    success: boolean,
    data: any[] = [],
    errors: string[] = [],
    cursor?: string,
    hasMore: boolean = false
  ): SyncResult {
    return {
      success,
      recordsProcessed: data.length,
      errors,
      duration: 0, // Will be set by caller
      cursor,
      hasMore,
      data,
    };
  }

  /**
   * Handle API errors with retry logic
   */
  protected async handleApiError(
    error: any,
    operation: string,
    ctx: ConnectorContext
  ): Promise<never> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('API operation failed', {
      connectorId: this.id,
      tenantId: ctx.tenantId,
      operation,
      error: errorMessage,
    });

    // Check if token needs refresh
    if (this.isTokenExpiredError(error)) {
      logger.info('Token expired, attempting refresh', {
        connectorId: this.id,
        tenantId: ctx.tenantId,
      });

      try {
        const refreshedCtx = await this.refresh(ctx);
        // Retry the operation with refreshed context
        throw new Error('TOKEN_REFRESHED'); // Signal to retry
      } catch (refreshError) {
        logger.error('Token refresh failed', {
          connectorId: this.id,
          tenantId: ctx.tenantId,
          error: refreshError instanceof Error ? refreshError.message : String(refreshError),
        });
        throw new Error(`Authentication failed: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`);
      }
    }

    // Check for rate limiting
    if (this.isRateLimitError(error)) {
      const retryAfter = this.extractRetryAfter(error);
      logger.warn('Rate limit hit', {
        connectorId: this.id,
        tenantId: ctx.tenantId,
        retryAfter,
      });
      throw new Error(`Rate limited: retry after ${retryAfter}s`);
    }

    throw new Error(`API Error: ${errorMessage}`);
  }

  /**
   * Check if error indicates expired token
   */
  protected isTokenExpiredError(error: any): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('401') || 
           message.includes('unauthorized') || 
           message.includes('token expired') ||
           message.includes('invalid_token');
  }

  /**
   * Check if error indicates rate limiting
   */
  protected isRateLimitError(error: any): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('429') || 
           message.includes('rate limit') || 
           message.includes('too many requests');
  }

  /**
   * Extract retry-after header from error
   */
  protected extractRetryAfter(error: any): number {
    // Default to 60 seconds if we can't extract the value
    return 60;
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(): ProviderConfig {
    return this.providerConfig;
  }

  /**
   * Get HTTP client
   */
  getHttpClient(): HttpClient {
    return this.httpClient;
  }

  /**
   * Log operation start
   */
  protected logOperationStart(operation: string, ctx: ConnectorContext): void {
    logger.info('Starting connector operation', {
      connectorId: this.id,
      tenantId: ctx.tenantId,
      operation,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log operation completion
   */
  protected logOperationComplete(
    operation: string, 
    ctx: ConnectorContext, 
    result: SyncResult
  ): void {
    logger.info('Completed connector operation', {
      connectorId: this.id,
      tenantId: ctx.tenantId,
      operation,
      success: result.success,
      recordsProcessed: result.recordsProcessed,
      errors: result.errors.length,
      duration: result.duration,
    });
  }
}

/**
 * Connector Factory
 * 
 * Creates and manages connector instances
 */
export class ConnectorFactory {
  private static connectors = new Map<string, BaseConnector>();

  /**
   * Register a connector
   */
  static register(connector: BaseConnector): void {
    this.connectors.set(connector.id, connector);
    logger.info('Connector registered', {
      id: connector.id,
      name: connector.name,
      version: connector.version,
    });
  }

  /**
   * Get a connector by ID
   */
  static get(id: string): BaseConnector | undefined {
    return this.connectors.get(id);
  }

  /**
   * Get all registered connectors
   */
  static getAll(): BaseConnector[] {
    return Array.from(this.connectors.values());
  }

  /**
   * Check if connector exists
   */
  static exists(id: string): boolean {
    return this.connectors.has(id);
  }

  /**
   * Remove a connector
   */
  static remove(id: string): boolean {
    return this.connectors.delete(id);
  }

  /**
   * Clear all connectors
   */
  static clear(): void {
    this.connectors.clear();
  }
}
