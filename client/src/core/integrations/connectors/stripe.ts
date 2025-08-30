/**
 * Stripe Connector
 * 
 * Implementation of the contract-first connector interface for Stripe API
 * Provides access to payments, customers, subscriptions, and financial data
 */

import { BaseConnector } from '../connector-base';
import type { ConnectorContext, SyncResult, WebhookEvent } from '../types';
import { PROVIDER_CONFIGS } from '../http-client';
import { StripeWebhookHandler } from '../webhooks';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// Stripe API types
interface StripeCustomer {
  id: string;
  object: 'customer';
  created: number;
  email?: string;
  name?: string;
  phone?: string;
  description?: string;
  metadata: Record<string, string>;
  default_source?: string;
  currency?: string;
  delinquent: boolean;
  discount?: any;
  invoice_prefix: string;
  livemode: boolean;
  shipping?: any;
  tax_exempt: string;
  test_clock?: string;
}

interface StripePayment {
  id: string;
  object: 'payment_intent';
  amount: number;
  currency: string;
  status: string;
  created: number;
  customer?: string;
  description?: string;
  metadata: Record<string, string>;
  receipt_email?: string;
  transfer_data?: any;
  transfer_group?: string;
}

interface StripeSubscription {
  id: string;
  object: 'subscription';
  created: number;
  current_period_start: number;
  current_period_end: number;
  customer: string;
  status: string;
  items: {
    data: Array<{
      id: string;
      object: 'subscription_item';
      created: number;
      price: {
        id: string;
        object: 'price';
        active: boolean;
        currency: string;
        product: string;
        unit_amount: number;
        recurring?: any;
      };
      quantity: number;
    }>;
  };
  metadata: Record<string, string>;
}

interface StripeOAuthResponse {
  access_token: string;
  livemode: boolean;
  refresh_token: string;
  scope: string;
  stripe_user_id: string;
  stripe_publishable_key: string;
  token_type: string;
}

interface StripeAPIResponse<T> {
  object: 'list';
  data: T[];
  has_more: boolean;
  url: string;
  total_count?: number;
}

// Configuration schema
const StripeConfigSchema = z.object({
  syncCustomers: z.boolean().default(true),
  syncPayments: z.boolean().default(true),
  syncSubscriptions: z.boolean().default(true),
  syncInvoices: z.boolean().default(true),
  paymentLimit: z.number().min(1).max(1000).default(100),
  customerLimit: z.number().min(1).max(1000).default(100),
  batchSize: z.number().min(1).max(100).default(50),
  includeTestData: z.boolean().default(false),
  webhookEvents: z.array(z.string()).default([
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'customer.created',
    'customer.updated',
    'subscription.created',
    'subscription.updated',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
  ]),
  scopes: z.array(z.string()).default([
    'read_write',
    'customers',
    'payments',
    'subscriptions'
  ]),
});

export class StripeConnector extends BaseConnector {
  private webhookHandler: StripeWebhookHandler;
  private readonly stripeApiBase = 'https://api.stripe.com/v1';

  constructor() {
    super(
      'stripe',
      'Stripe',
      '1.0.0',
      PROVIDER_CONFIGS.stripe
    );
    
    this.webhookHandler = new StripeWebhookHandler();
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  getConfigSchema(): z.ZodSchema {
    return StripeConfigSchema;
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async authorize(ctx: ConnectorContext, code?: string): Promise<ConnectorContext> {
    if (!code) {
      throw new Error('Authorization code is required for Stripe OAuth');
    }

    try {
      const tokenResponse = await this.httpClient.post<StripeOAuthResponse>(
        'https://connect.stripe.com/oauth/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.STRIPE_CLIENT_ID!,
          client_secret: process.env.STRIPE_CLIENT_SECRET!,
          code,
          redirect_uri: process.env.STRIPE_REDIRECT_URI!,
        }).toString(),
        {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      );

      const updatedCtx: ConnectorContext = {
        ...ctx,
        auth: {
          accessToken: tokenResponse.data.access_token,
          refreshToken: tokenResponse.data.refresh_token,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        },
        metadata: {
          ...ctx.metadata,
          scopes: tokenResponse.data.scope.split(','),
          stripeUserId: tokenResponse.data.stripe_user_id,
          stripePublishableKey: tokenResponse.data.stripe_publishable_key,
          livemode: tokenResponse.data.livemode,
          lastAuth: new Date().toISOString(),
        },
      };

      logger.info('Stripe authorization successful', {
        tenantId: ctx.tenantId,
        stripeUserId: tokenResponse.data.stripe_user_id,
        scopes: tokenResponse.data.scope.split(','),
      });

      return updatedCtx;
    } catch (error) {
      logger.error('Stripe authorization failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Stripe authorization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async refresh(ctx: ConnectorContext): Promise<ConnectorContext> {
    try {
      const tokenResponse = await this.httpClient.post<StripeOAuthResponse>(
        'https://connect.stripe.com/oauth/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.STRIPE_CLIENT_ID!,
          client_secret: process.env.STRIPE_CLIENT_SECRET!,
          refresh_token: ctx.auth.refreshToken,
        }).toString(),
        {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      );

      const updatedCtx: ConnectorContext = {
        ...ctx,
        auth: {
          accessToken: tokenResponse.data.access_token,
          refreshToken: tokenResponse.data.refresh_token,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };

      logger.info('Stripe token refresh successful', {
        tenantId: ctx.tenantId,
      });

      return updatedCtx;
    } catch (error) {
      logger.error('Stripe token refresh failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Stripe token refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================================================
  // DATA SYNCHRONIZATION
  // ============================================================================

  async backfill(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    const startTime = Date.now();
    const results: SyncResult = {
      success: true,
      recordsProcessed: 0,
      cursor: cursor,
      data: [],
      errors: [],
      duration: 0,
      hasMore: false,
    };

    try {
      // Sync customers
      if (ctx.config.syncCustomers !== false) {
        const customersResult = await this.syncCustomers(ctx, cursor);
        results.recordsProcessed += customersResult.recordsProcessed;
        results.data.push(...customersResult.data);
        results.errors.push(...customersResult.errors);
      }

      // Sync payments
      if (ctx.config.syncPayments !== false) {
        const paymentsResult = await this.syncPayments(ctx, cursor);
        results.recordsProcessed += paymentsResult.recordsProcessed;
        results.data.push(...paymentsResult.data);
        results.errors.push(...paymentsResult.errors);
      }

      // Sync subscriptions
      if (ctx.config.syncSubscriptions !== false) {
        const subscriptionsResult = await this.syncSubscriptions(ctx, cursor);
        results.recordsProcessed += subscriptionsResult.recordsProcessed;
        results.data.push(...subscriptionsResult.data);
        results.errors.push(...subscriptionsResult.errors);
      }

      results.duration = Date.now() - startTime;
      results.hasMore = !!results.cursor;

      logger.info('Stripe backfill completed', {
        tenantId: ctx.tenantId,
        recordsProcessed: results.recordsProcessed,
        errors: results.errors.length,
        duration: results.duration,
      });

      return results;
    } catch (error) {
      logger.error('Stripe backfill failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        recordsProcessed: results.recordsProcessed,
        cursor: cursor,
        data: results.data,
        errors: [...results.errors, error instanceof Error ? error.message : String(error)],
        duration: Date.now() - startTime,
        hasMore: false,
      };
    }
  }

  async delta(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    // For Stripe, we can use cursor-based pagination for delta syncs
    const deltaCtx = {
      ...ctx,
      config: {
        ...ctx.config,
        batchSize: Math.min(ctx.config.batchSize || 50, 25), // Smaller batches for delta
      },
    };

    return await this.backfill(deltaCtx, cursor);
  }

  // ============================================================================
  // SPECIFIC SYNC METHODS
  // ============================================================================

  private async syncCustomers(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        limit: (ctx.config.batchSize || 50).toString(),
      });
      
      if (cursor) {
        params.append('starting_after', cursor);
      }

      const response = await this.httpClient.get<StripeAPIResponse<StripeCustomer>>(
        `${this.stripeApiBase}/customers?${params.toString()}`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.data.length,
        cursor: response.data.data.length > 0 ? response.data.data[response.data.data.length - 1].id : undefined,
        data: response.data.data,
        errors: [],
        duration: 0,
        hasMore: response.data.has_more,
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        cursor: cursor,
        data: [],
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0,
        hasMore: false,
      };
    }
  }

  private async syncPayments(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        limit: (ctx.config.paymentLimit || 100).toString(),
      });
      
      if (cursor) {
        params.append('starting_after', cursor);
      }

      const response = await this.httpClient.get<StripeAPIResponse<StripePayment>>(
        `${this.stripeApiBase}/payment_intents?${params.toString()}`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.data.length,
        cursor: response.data.data.length > 0 ? response.data.data[response.data.data.length - 1].id : undefined,
        data: response.data.data,
        errors: [],
        duration: 0,
        hasMore: response.data.has_more,
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        cursor: cursor,
        data: [],
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0,
        hasMore: false,
      };
    }
  }

  private async syncSubscriptions(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        limit: (ctx.config.batchSize || 50).toString(),
      });
      
      if (cursor) {
        params.append('starting_after', cursor);
      }

      const response = await this.httpClient.get<StripeAPIResponse<StripeSubscription>>(
        `${this.stripeApiBase}/subscriptions?${params.toString()}`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.data.length,
        cursor: response.data.data.length > 0 ? response.data.data[response.data.data.length - 1].id : undefined,
        data: response.data.data,
        errors: [],
        duration: 0,
        hasMore: response.data.has_more,
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        cursor: cursor,
        data: [],
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0,
        hasMore: false,
      };
    }
  }

  // ============================================================================
  // WEBHOOK HANDLING
  // ============================================================================

  async handleWebhook(
    ctx: ConnectorContext,
    headers: Record<string, string>,
    body: any
  ): Promise<WebhookEvent[]> {
    return await this.webhookHandler.handle(headers, body, 'stripe');
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  async healthCheck(ctx: ConnectorContext): Promise<{ healthy: boolean; details?: any }> {
    try {
      // Test basic API access
      const response = await this.httpClient.get<{ object: string; id: string }>(
        `${this.stripeApiBase}/account`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      // Test specific scopes if configured
      const scopeTests = [];
      
      if (ctx.config.syncCustomers !== false) {
        try {
          await this.httpClient.get(`${this.stripeApiBase}/customers?limit=1`, {
            Authorization: `Bearer ${ctx.auth.accessToken}`,
          });
          scopeTests.push({ scope: 'customers', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'customers', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      if (ctx.config.syncPayments !== false) {
        try {
          await this.httpClient.get(`${this.stripeApiBase}/payment_intents?limit=1`, {
            Authorization: `Bearer ${ctx.auth.accessToken}`,
          });
          scopeTests.push({ scope: 'payments', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'payments', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      return {
        healthy: true,
        details: {
          accountId: response.data.id,
          scopeTests,
          lastCheck: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : String(error),
          lastCheck: new Date().toISOString(),
        },
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  protected isTokenExpiredError(error: any): boolean {
    return error?.response?.status === 401 || 
           error?.message?.includes('invalid_grant') ||
           error?.message?.includes('token_expired');
  }

  protected isRateLimitError(error: any): boolean {
    return error?.response?.status === 429 ||
           error?.message?.includes('rate_limit');
  }

  protected extractRetryAfter(error: any): number {
    const retryAfter = error?.response?.headers?.['retry-after'];
    return retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000; // Default 1 minute
  }
}
