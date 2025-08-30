/**
 * Shopify Connector
 * 
 * Implementation of the contract-first connector interface for Shopify API
 * Provides access to products, orders, customers, and e-commerce data
 */

import { BaseConnector } from '../connector-base';
import type { ConnectorContext, SyncResult, WebhookEvent } from '../types';
import { PROVIDER_CONFIGS } from '../http-client';
import { ShopifyWebhookHandler } from '../webhooks';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// Shopify API types
interface ShopifyProduct {
  id: number;
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  created_at: string;
  handle: string;
  updated_at: string;
  published_at?: string;
  template_suffix?: string;
  status: string;
  published_scope: string;
  tags: string;
  admin_graphql_api_id: string;
  variants: ShopifyProductVariant[];
  options: ShopifyProductOption[];
  images: ShopifyProductImage[];
  image?: ShopifyProductImage;
}

interface ShopifyProductVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku?: string;
  position: number;
  inventory_policy: string;
  compare_at_price?: string;
  fulfillment_service: string;
  inventory_management?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode?: string;
  grams: number;
  image_id?: number;
  weight: number;
  weight_unit: string;
  inventory_item_id: number;
  inventory_quantity: number;
  old_inventory_quantity: number;
  requires_shipping: boolean;
  admin_graphql_api_id: string;
}

interface ShopifyProductOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

interface ShopifyProductImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt?: string;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
  admin_graphql_api_id: string;
}

interface ShopifyOrder {
  id: number;
  email: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  number: number;
  note?: string;
  token: string;
  gateway?: string;
  test: boolean;
  total_price: string;
  subtotal_price: string;
  total_weight: number;
  total_tax: string;
  taxes_included: boolean;
  currency: string;
  financial_status: string;
  confirmed: boolean;
  total_discounts: string;
  total_line_items_price: string;
  cart_token?: string;
  buyer_accepts_marketing: boolean;
  name: string;
  referring_site?: string;
  landing_site?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  total_price_usd: string;
  checkout_token?: string;
  reference?: string;
  user_id?: number;
  location_id?: number;
  source_identifier?: string;
  source_url?: string;
  processed_at?: string;
  device_id?: number;
  phone?: string;
  customer_locale?: string;
  app_id?: number;
  browser_ip?: string;
  landing_site_ref?: string;
  order_number: number;
  discount_applications: any[];
  discount_codes: any[];
  note_attributes: any[];
  payment_gateway_names: string[];
  processing_method: string;
  checkout_id?: number;
  source_name: string;
  fulfillment_status?: string;
  tax_lines: any[];
  tags: string;
  contact_email: string;
  order_status_url: string;
  presentment_currency: string;
  total_line_items_price_set: any;
  total_discounts_set: any;
  total_shipping_price_set: any;
  subtotal_price_set: any;
  total_price_set: any;
  total_tax_set: any;
  line_items: ShopifyLineItem[];
  shipping_lines: any[];
  billing_address?: ShopifyAddress;
  shipping_address?: ShopifyAddress;
  fulfillments: any[];
  client_details?: any;
  refunds: any[];
  customer?: ShopifyCustomer;
  admin_graphql_api_id: string;
}

interface ShopifyLineItem {
  id: number;
  variant_id: number;
  title: string;
  quantity: number;
  sku?: string;
  variant_title?: string;
  vendor?: string;
  fulfillment_service: string;
  product_id: number;
  requires_shipping: boolean;
  taxable: boolean;
  gift_card: boolean;
  name: string;
  variant_inventory_management?: string;
  properties: any[];
  product_exists: boolean;
  fulfillable_quantity: number;
  grams: number;
  price: string;
  total_discount: string;
  fulfillment_status?: string;
  price_set: any;
  total_discount_set: any;
  discount_allocations: any[];
  duties: any[];
  admin_graphql_api_id: string;
  tax_lines: any[];
}

interface ShopifyCustomer {
  id: number;
  email: string;
  accepts_marketing: boolean;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  orders_count: number;
  state: string;
  total_spent: string;
  last_order_id?: number;
  note?: string;
  verified_email: boolean;
  multipass_identifier?: string;
  tax_exempt: boolean;
  tags: string;
  last_order_name?: string;
  currency: string;
  phone?: string;
  addresses: ShopifyAddress[];
  accepts_marketing_updated_at: string;
  marketing_opt_in_level?: string;
  tax_exemptions: string[];
  admin_graphql_api_id: string;
  default_address?: ShopifyAddress;
}

interface ShopifyAddress {
  id?: number;
  customer_id?: number;
  first_name?: string;
  last_name?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  country: string;
  zip?: string;
  phone?: string;
  name?: string;
  province_code?: string;
  country_code: string;
  country_name: string;
  default?: boolean;
}

interface ShopifyOAuthResponse {
  access_token: string;
  scope: string;
}

interface ShopifyAPIResponse<T> {
  [key: string]: T[];
}

// Configuration schema
const ShopifyConfigSchema = z.object({
  syncProducts: z.boolean().default(true),
  syncOrders: z.boolean().default(true),
  syncCustomers: z.boolean().default(true),
  syncInventory: z.boolean().default(true),
  productLimit: z.number().min(1).max(250).default(50),
  orderLimit: z.number().min(1).max(250).default(50),
  customerLimit: z.number().min(1).max(250).default(50),
  includeDraft: z.boolean().default(false),
  syncFromDate: z.string().optional(),
  batchSize: z.number().min(1).max(250).default(50),
  webhookEvents: z.array(z.string()).default([
    'products/create',
    'products/update',
    'products/delete',
    'orders/create',
    'orders/updated',
    'orders/paid',
    'orders/fulfilled',
    'customers/create',
    'customers/update',
    'inventory_levels/update'
  ]),
  scopes: z.array(z.string()).default([
    'read_products',
    'write_products',
    'read_orders',
    'write_orders',
    'read_customers',
    'write_customers',
    'read_inventory',
    'write_inventory'
  ]),
});

export class ShopifyConnector extends BaseConnector {
  private webhookHandler: ShopifyWebhookHandler;
  private readonly shopifyApiBase: string;

  constructor() {
    super(
      'shopify',
      'Shopify',
      '1.0.0',
      PROVIDER_CONFIGS.shopify
    );
    
    this.webhookHandler = new ShopifyWebhookHandler();
    this.shopifyApiBase = ''; // Will be set during authorization
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  getConfigSchema(): z.ZodSchema {
    return ShopifyConfigSchema;
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async authorize(ctx: ConnectorContext, code?: string): Promise<ConnectorContext> {
    if (!code) {
      throw new Error('Authorization code is required for Shopify OAuth');
    }

    try {
      const tokenResponse = await this.httpClient.post<ShopifyOAuthResponse>(
        `https://${ctx.metadata.shop || ctx.metadata.shopDomain}/admin/oauth/access_token`,
        new URLSearchParams({
          client_id: process.env.SHOPIFY_CLIENT_ID!,
          client_secret: process.env.SHOPIFY_CLIENT_SECRET!,
          code,
          redirect_uri: process.env.SHOPIFY_REDIRECT_URI!,
        }).toString(),
        {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      );

      const shopDomain = ctx.metadata.shop || ctx.metadata.shopDomain;
      const apiBase = `https://${shopDomain}/admin/api/2023-10`;

      const updatedCtx: ConnectorContext = {
        ...ctx,
        auth: {
          accessToken: tokenResponse.data.access_token,
          refreshToken: '', // Shopify doesn't use refresh tokens
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        },
        metadata: {
          ...ctx.metadata,
          shopDomain,
          apiBase,
          scope: tokenResponse.data.scope,
          lastAuth: new Date().toISOString(),
        },
      };

      logger.info('Shopify authorization successful', {
        tenantId: ctx.tenantId,
        shopDomain,
        scope: tokenResponse.data.scope,
      });

      return updatedCtx;
    } catch (error) {
      logger.error('Shopify authorization failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Shopify authorization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async refresh(ctx: ConnectorContext): Promise<ConnectorContext> {
    // Shopify tokens don't expire, so we just return the same context
    logger.info('Shopify token refresh (no-op)', {
      tenantId: ctx.tenantId,
    });
    return ctx;
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
      // Sync products
      if (ctx.config.syncProducts !== false) {
        const productsResult = await this.syncProducts(ctx, cursor);
        results.recordsProcessed += productsResult.recordsProcessed;
        results.data.push(...productsResult.data);
        results.errors.push(...productsResult.errors);
      }

      // Sync orders
      if (ctx.config.syncOrders !== false) {
        const ordersResult = await this.syncOrders(ctx, cursor);
        results.recordsProcessed += ordersResult.recordsProcessed;
        results.data.push(...ordersResult.data);
        results.errors.push(...ordersResult.errors);
      }

      // Sync customers
      if (ctx.config.syncCustomers !== false) {
        const customersResult = await this.syncCustomers(ctx, cursor);
        results.recordsProcessed += customersResult.recordsProcessed;
        results.data.push(...customersResult.data);
        results.errors.push(...customersResult.errors);
      }

      results.duration = Date.now() - startTime;
      results.hasMore = !!results.cursor;

      logger.info('Shopify backfill completed', {
        tenantId: ctx.tenantId,
        recordsProcessed: results.recordsProcessed,
        errors: results.errors.length,
        duration: results.duration,
      });

      return results;
    } catch (error) {
      logger.error('Shopify backfill failed', {
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
    // For Shopify, we can use cursor-based pagination for delta syncs
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

  private async syncProducts(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        limit: (ctx.config.productLimit || 50).toString(),
        status: ctx.config.includeDraft ? 'any' : 'active',
      });
      
      if (cursor) {
        params.append('page_info', cursor);
      }

      const response = await this.httpClient.get<ShopifyAPIResponse<ShopifyProduct>>(
        `${ctx.metadata.apiBase}/products.json?${params.toString()}`,
        {
          'X-Shopify-Access-Token': ctx.auth.accessToken,
          'Content-Type': 'application/json',
        }
      );

      const products = response.data.products || [];
      const nextPageInfo = this.extractNextPageInfo(response);

      return {
        success: true,
        recordsProcessed: products.length,
        cursor: nextPageInfo,
        data: products,
        errors: [],
        duration: 0,
        hasMore: !!nextPageInfo,
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

  private async syncOrders(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        limit: (ctx.config.orderLimit || 50).toString(),
        status: 'any',
      });
      
      if (cursor) {
        params.append('page_info', cursor);
      }

      if (ctx.config.syncFromDate) {
        params.append('created_at_min', ctx.config.syncFromDate);
      }

      const response = await this.httpClient.get<ShopifyAPIResponse<ShopifyOrder>>(
        `${ctx.metadata.apiBase}/orders.json?${params.toString()}`,
        {
          'X-Shopify-Access-Token': ctx.auth.accessToken,
          'Content-Type': 'application/json',
        }
      );

      const orders = response.data.orders || [];
      const nextPageInfo = this.extractNextPageInfo(response);

      return {
        success: true,
        recordsProcessed: orders.length,
        cursor: nextPageInfo,
        data: orders,
        errors: [],
        duration: 0,
        hasMore: !!nextPageInfo,
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

  private async syncCustomers(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        limit: (ctx.config.customerLimit || 50).toString(),
      });
      
      if (cursor) {
        params.append('page_info', cursor);
      }

      const response = await this.httpClient.get<ShopifyAPIResponse<ShopifyCustomer>>(
        `${ctx.metadata.apiBase}/customers.json?${params.toString()}`,
        {
          'X-Shopify-Access-Token': ctx.auth.accessToken,
          'Content-Type': 'application/json',
        }
      );

      const customers = response.data.customers || [];
      const nextPageInfo = this.extractNextPageInfo(response);

      return {
        success: true,
        recordsProcessed: customers.length,
        cursor: nextPageInfo,
        data: customers,
        errors: [],
        duration: 0,
        hasMore: !!nextPageInfo,
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

  private extractNextPageInfo(response: any): string | undefined {
    const linkHeader = response.headers?.link;
    if (!linkHeader) return undefined;

    const nextLink = linkHeader.split(',').find((link: string) => link.includes('rel="next"'));
    if (!nextLink) return undefined;

    const match = nextLink.match(/page_info=([^&>]+)/);
    return match ? match[1] : undefined;
  }

  // ============================================================================
  // WEBHOOK HANDLING
  // ============================================================================

  async handleWebhook(
    ctx: ConnectorContext,
    headers: Record<string, string>,
    body: any
  ): Promise<WebhookEvent[]> {
    return await this.webhookHandler.handle(headers, body, 'shopify');
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  async healthCheck(ctx: ConnectorContext): Promise<{ healthy: boolean; details?: any }> {
    try {
      // Test basic API access
      const response = await this.httpClient.get<{ shop: any }>(
        `${ctx.metadata.apiBase}/shop.json`,
        {
          'X-Shopify-Access-Token': ctx.auth.accessToken,
          'Content-Type': 'application/json',
        }
      );

      // Test specific scopes if configured
      const scopeTests = [];
      
      if (ctx.config.syncProducts !== false) {
        try {
          await this.httpClient.get(
            `${ctx.metadata.apiBase}/products.json?limit=1`,
            {
              'X-Shopify-Access-Token': ctx.auth.accessToken,
              'Content-Type': 'application/json',
            }
          );
          scopeTests.push({ scope: 'products', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'products', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      if (ctx.config.syncOrders !== false) {
        try {
          await this.httpClient.get(
            `${ctx.metadata.apiBase}/orders.json?limit=1`,
            {
              'X-Shopify-Access-Token': ctx.auth.accessToken,
              'Content-Type': 'application/json',
            }
          );
          scopeTests.push({ scope: 'orders', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'orders', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      return {
        healthy: true,
        details: {
          shop: response.data.shop,
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
           error?.message?.includes('unauthorized') ||
           error?.message?.includes('invalid_token') ||
           error?.message?.includes('Invalid API key');
  }

  protected isRateLimitError(error: any): boolean {
    return error?.response?.status === 429 ||
           error?.message?.includes('rate_limited') ||
           error?.message?.includes('API rate limit exceeded') ||
           error?.response?.headers?.['x-shopify-shop-api-call-limit'];
  }

  protected extractRetryAfter(error: any): number {
    const retryAfter = error?.response?.headers?.['retry-after'];
    return retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000; // Default 1 minute
  }
}
