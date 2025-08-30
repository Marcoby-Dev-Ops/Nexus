/**
 * QuickBooks Connector
 * 
 * Implementation of the contract-first connector interface for QuickBooks API
 * Provides access to financial data, customers, invoices, and accounting information
 */

import { BaseConnector } from '../connector-base';
import type { ConnectorContext, SyncResult, WebhookEvent } from '../types';
import { PROVIDER_CONFIGS } from '../http-client';
import { QuickBooksWebhookHandler } from '../webhooks';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// QuickBooks API types
interface QuickBooksCustomer {
  Id: string;
  Title?: string;
  GivenName?: string;
  FamilyName?: string;
  DisplayName: string;
  PrintOnCheckName?: string;
  Active: boolean;
  PrimaryEmailAddr?: {
    Address: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  CompanyName?: string;
  BillAddr?: {
    Line1?: string;
    Line2?: string;
    City?: string;
    Country?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  ShipAddr?: {
    Line1?: string;
    Line2?: string;
    City?: string;
    Country?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  Notes?: string;
  Job?: boolean;
  BillWithParent?: boolean;
  ParentRef?: {
    value: string;
  };
  Level?: number;
  SalesTermRef?: {
    value: string;
  };
  PreferredDeliveryMethod?: string;
  ResaleNum?: string;
  Balance?: number;
  TotalExpense?: number;
  OpenBalanceDate?: string;
  BalanceWithJobs?: number;
  CurrencyRef?: {
    value: string;
    name: string;
  };
  MetaData?: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

interface QuickBooksInvoice {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  DueDate?: string;
  PrivateNote?: string;
  Line: Array<{
    Id: string;
    LineNum: number;
    Description?: string;
    Amount: number;
    DetailType: string;
    SalesItemLineDetail?: {
      ItemRef: {
        value: string;
        name: string;
      };
      UnitPrice: number;
      Qty: number;
    };
  }>;
  CustomerRef: {
    value: string;
    name: string;
  };
  CustomerMemo?: {
    value: string;
  };
  BillAddr?: {
    Line1?: string;
    Line2?: string;
    City?: string;
    Country?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  ShipAddr?: {
    Line1?: string;
    Line2?: string;
    City?: string;
    Country?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  ShipFromAddr?: {
    Line1?: string;
    Line2?: string;
    City?: string;
    Country?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  PONumber?: string;
  ShipMethodRef?: {
    value: string;
    name: string;
  };
  SubTotalAmt: number;
  DiscountAmt?: number;
  TaxAmt?: number;
  TotalAmt: number;
  ApplyTaxAfterDiscount?: boolean;
  PrintStatus?: string;
  EmailStatus?: string;
  BillEmail?: {
    Address: string;
  };
  DeliveryInfo?: {
    DeliveryType: string;
    DeliveryTime: string;
  };
  Balance: number;
  Deposit?: number;
  AllowIPNPayment?: boolean;
  AllowOnlinePayment?: boolean;
  AllowOnlineCreditCardPayment?: boolean;
  AllowOnlineACHPayment?: boolean;
  EInvoiceStatus?: string;
  EInvoiceStatusSpecified?: boolean;
  ExchangeRate?: number;
  HomeTotalAmt?: number;
  DeliveryInfoMetaData?: {
    DeliveryType: string;
    DeliveryTime: string;
  };
  MetaData?: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

interface QuickBooksPayment {
  Id: string;
  TxnDate: string;
  TotalAmt: number;
  UnappliedAmt?: number;
  ProcessPayment?: boolean;
  PaymentMethodRef?: {
    value: string;
    name: string;
  };
  PaymentRefNum?: string;
  DepositToAccountRef?: {
    value: string;
    name: string;
  };
  CreditCardPayment?: {
    CreditChargeInfo?: {
      Number?: string;
      Type?: string;
      NameOnAcct?: string;
      CcExpiryMonth?: number;
      CcExpiryYear?: number;
      BillAddrStreet?: string;
      PostalCode?: string;
      CommercialCardCode?: string;
      CCTxnMode?: string;
      CCTxnType?: string;
      PrevCCTransId?: string;
      Amount?: number;
      ProcessPaymentByAccount?: boolean;
      CreditCardAccountRef?: {
        value: string;
        name: string;
      };
    };
  };
  CheckNum?: string;
  Status?: string;
  ARAccountRef?: {
    value: string;
    name: string;
  };
  CustomerRef?: {
    value: string;
    name: string;
  };
  CurrencyRef?: {
    value: string;
    name: string;
  };
  ExchangeRate?: number;
  HomeTotalAmt?: number;
  Line?: Array<{
    Id: string;
    LineNum: number;
    Amount: number;
    LinkedTxn?: Array<{
      TxnId: string;
      TxnType: string;
    }>;
  }>;
  MetaData?: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

interface QuickBooksItem {
  Id: string;
  Name: string;
  Description?: string;
  Active: boolean;
  FullyQualifiedName: string;
  Taxable?: boolean;
  UnitPrice?: number;
  Type: string;
  IncomeAccountRef?: {
    value: string;
    name: string;
  };
  ExpenseAccountRef?: {
    value: string;
    name: string;
  };
  AssetAccountRef?: {
    value: string;
    name: string;
  };
  PurchaseDesc?: string;
  PurchaseCost?: number;
  PurchaseTaxIncluded?: boolean;
  TrackQtyOnHand?: boolean;
  QtyOnHand?: number;
  InvStartDate?: string;
  IncomeAccountRef?: {
    value: string;
    name: string;
  };
  ExpenseAccountRef?: {
    value: string;
    name: string;
  };
  AssetAccountRef?: {
    value: string;
    name: string;
  };
  MetaData?: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

interface QuickBooksOAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  id_token?: string;
  realmId: string;
}

interface QuickBooksAPIResponse<T> {
  QueryResponse: {
    [key: string]: T[];
    maxResults: number;
    startPosition: number;
    totalCount: number;
  };
  time: string;
}

// Configuration schema
const QuickBooksConfigSchema = z.object({
  syncCustomers: z.boolean().default(true),
  syncInvoices: z.boolean().default(true),
  syncPayments: z.boolean().default(true),
  syncItems: z.boolean().default(true),
  syncAccounts: z.boolean().default(true),
  customerLimit: z.number().min(1).max(1000).default(100),
  invoiceLimit: z.number().min(1).max(1000).default(100),
  paymentLimit: z.number().min(1).max(1000).default(100),
  includeInactive: z.boolean().default(false),
  syncFromDate: z.string().optional(),
  batchSize: z.number().min(1).max(100).default(50),
  webhookEvents: z.array(z.string()).default([
    'Customer.created',
    'Customer.updated',
    'Invoice.created',
    'Invoice.updated',
    'Payment.created',
    'Payment.updated'
  ]),
  scopes: z.array(z.string()).default([
    'com.intuit.quickbooks.accounting',
    'com.intuit.quickbooks.payment',
    'com.intuit.quickbooks.payroll'
  ]),
});

export class QuickBooksConnector extends BaseConnector {
  private webhookHandler: QuickBooksWebhookHandler;
  private readonly quickbooksApiBase = 'https://sandbox-accounts.platform.intuit.com/v1';

  constructor() {
    super(
      'quickbooks',
      'QuickBooks',
      '1.0.0',
      PROVIDER_CONFIGS.quickbooks
    );
    
    this.webhookHandler = new QuickBooksWebhookHandler();
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  getConfigSchema(): z.ZodSchema {
    return QuickBooksConfigSchema;
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async authorize(ctx: ConnectorContext, code?: string): Promise<ConnectorContext> {
    if (!code) {
      throw new Error('Authorization code is required for QuickBooks OAuth');
    }

    try {
      const tokenResponse = await this.httpClient.post<QuickBooksOAuthResponse>(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI!,
        }).toString(),
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`).toString('base64')}`,
        }
      );

      const updatedCtx: ConnectorContext = {
        ...ctx,
        auth: {
          accessToken: tokenResponse.data.access_token,
          refreshToken: tokenResponse.data.refresh_token,
          expiresAt: new Date(Date.now() + tokenResponse.data.expires_in * 1000).toISOString(),
        },
        metadata: {
          ...ctx.metadata,
          realmId: tokenResponse.data.realmId,
          lastAuth: new Date().toISOString(),
        },
      };

      logger.info('QuickBooks authorization successful', {
        tenantId: ctx.tenantId,
        realmId: tokenResponse.data.realmId,
      });

      return updatedCtx;
    } catch (error) {
      logger.error('QuickBooks authorization failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`QuickBooks authorization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async refresh(ctx: ConnectorContext): Promise<ConnectorContext> {
    if (!ctx.auth.refreshToken) {
      throw new Error('No refresh token available for QuickBooks');
    }

    try {
      const tokenResponse = await this.httpClient.post<QuickBooksOAuthResponse>(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: ctx.auth.refreshToken,
        }).toString(),
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`).toString('base64')}`,
        }
      );

      const updatedCtx: ConnectorContext = {
        ...ctx,
        auth: {
          accessToken: tokenResponse.data.access_token,
          refreshToken: tokenResponse.data.refresh_token || ctx.auth.refreshToken,
          expiresAt: new Date(Date.now() + tokenResponse.data.expires_in * 1000).toISOString(),
        },
        metadata: {
          ...ctx.metadata,
          lastRefresh: new Date().toISOString(),
        },
      };

      logger.info('QuickBooks token refresh successful', {
        tenantId: ctx.tenantId,
      });

      return updatedCtx;
    } catch (error) {
      logger.error('QuickBooks token refresh failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`QuickBooks token refresh failed: ${error instanceof Error ? error.message : String(error)}`);
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

      // Sync invoices
      if (ctx.config.syncInvoices !== false) {
        const invoicesResult = await this.syncInvoices(ctx, cursor);
        results.recordsProcessed += invoicesResult.recordsProcessed;
        results.data.push(...invoicesResult.data);
        results.errors.push(...invoicesResult.errors);
      }

      // Sync payments
      if (ctx.config.syncPayments !== false) {
        const paymentsResult = await this.syncPayments(ctx, cursor);
        results.recordsProcessed += paymentsResult.recordsProcessed;
        results.data.push(...paymentsResult.data);
        results.errors.push(...paymentsResult.errors);
      }

      // Sync items
      if (ctx.config.syncItems !== false) {
        const itemsResult = await this.syncItems(ctx, cursor);
        results.recordsProcessed += itemsResult.recordsProcessed;
        results.data.push(...itemsResult.data);
        results.errors.push(...itemsResult.errors);
      }

      results.duration = Date.now() - startTime;
      results.hasMore = !!results.cursor;

      logger.info('QuickBooks backfill completed', {
        tenantId: ctx.tenantId,
        recordsProcessed: results.recordsProcessed,
        errors: results.errors.length,
        duration: results.duration,
      });

      return results;
    } catch (error) {
      logger.error('QuickBooks backfill failed', {
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
    // For QuickBooks, we can use cursor-based pagination for delta syncs
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
        query: `SELECT * FROM Customer ${ctx.config.includeInactive ? '' : 'WHERE Active = true'} ORDER BY DisplayName MAXRESULTS ${ctx.config.customerLimit || 100}`,
      });
      
      if (cursor) {
        params.append('startposition', cursor);
      }

      const response = await this.httpClient.get<QuickBooksAPIResponse<QuickBooksCustomer>>(
        `https://sandbox-accounting.api.intuit.com/v3/company/${ctx.metadata.realmId}/query?${params.toString()}`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Accept': 'application/json',
        }
      );

      const customers = response.data.QueryResponse.Customer || [];

      return {
        success: true,
        recordsProcessed: customers.length,
        cursor: response.data.QueryResponse.startPosition + customers.length,
        data: customers,
        errors: [],
        duration: 0,
        hasMore: customers.length === (ctx.config.customerLimit || 100),
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

  private async syncInvoices(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        query: `SELECT * FROM Invoice ORDER BY TxnDate DESC MAXRESULTS ${ctx.config.invoiceLimit || 100}`,
      });
      
      if (cursor) {
        params.append('startposition', cursor);
      }

      const response = await this.httpClient.get<QuickBooksAPIResponse<QuickBooksInvoice>>(
        `https://sandbox-accounting.api.intuit.com/v3/company/${ctx.metadata.realmId}/query?${params.toString()}`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Accept': 'application/json',
        }
      );

      const invoices = response.data.QueryResponse.Invoice || [];

      return {
        success: true,
        recordsProcessed: invoices.length,
        cursor: response.data.QueryResponse.startPosition + invoices.length,
        data: invoices,
        errors: [],
        duration: 0,
        hasMore: invoices.length === (ctx.config.invoiceLimit || 100),
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
        query: `SELECT * FROM Payment ORDER BY TxnDate DESC MAXRESULTS ${ctx.config.paymentLimit || 100}`,
      });
      
      if (cursor) {
        params.append('startposition', cursor);
      }

      const response = await this.httpClient.get<QuickBooksAPIResponse<QuickBooksPayment>>(
        `https://sandbox-accounting.api.intuit.com/v3/company/${ctx.metadata.realmId}/query?${params.toString()}`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Accept': 'application/json',
        }
      );

      const payments = response.data.QueryResponse.Payment || [];

      return {
        success: true,
        recordsProcessed: payments.length,
        cursor: response.data.QueryResponse.startPosition + payments.length,
        data: payments,
        errors: [],
        duration: 0,
        hasMore: payments.length === (ctx.config.paymentLimit || 100),
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

  private async syncItems(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        query: `SELECT * FROM Item ${ctx.config.includeInactive ? '' : 'WHERE Active = true'} ORDER BY Name MAXRESULTS ${ctx.config.batchSize || 50}`,
      });
      
      if (cursor) {
        params.append('startposition', cursor);
      }

      const response = await this.httpClient.get<QuickBooksAPIResponse<QuickBooksItem>>(
        `https://sandbox-accounting.api.intuit.com/v3/company/${ctx.metadata.realmId}/query?${params.toString()}`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Accept': 'application/json',
        }
      );

      const items = response.data.QueryResponse.Item || [];

      return {
        success: true,
        recordsProcessed: items.length,
        cursor: response.data.QueryResponse.startPosition + items.length,
        data: items,
        errors: [],
        duration: 0,
        hasMore: items.length === (ctx.config.batchSize || 50),
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
    return await this.webhookHandler.handle(headers, body, 'quickbooks');
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  async healthCheck(ctx: ConnectorContext): Promise<{ healthy: boolean; details?: any }> {
    try {
      // Test basic API access
      const response = await this.httpClient.get<QuickBooksAPIResponse<QuickBooksCustomer>>(
        `https://sandbox-accounting.api.intuit.com/v3/company/${ctx.metadata.realmId}/query?query=SELECT * FROM Customer MAXRESULTS 1`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Accept': 'application/json',
        }
      );

      // Test specific scopes if configured
      const scopeTests = [];
      
      if (ctx.config.syncCustomers !== false) {
        try {
          await this.httpClient.get(
            `https://sandbox-accounting.api.intuit.com/v3/company/${ctx.metadata.realmId}/query?query=SELECT * FROM Customer MAXRESULTS 1`,
            {
              'Authorization': `Bearer ${ctx.auth.accessToken}`,
              'Accept': 'application/json',
            }
          );
          scopeTests.push({ scope: 'customers', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'customers', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      if (ctx.config.syncInvoices !== false) {
        try {
          await this.httpClient.get(
            `https://sandbox-accounting.api.intuit.com/v3/company/${ctx.metadata.realmId}/query?query=SELECT * FROM Invoice MAXRESULTS 1`,
            {
              'Authorization': `Bearer ${ctx.auth.accessToken}`,
              'Accept': 'application/json',
            }
          );
          scopeTests.push({ scope: 'invoices', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'invoices', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      return {
        healthy: true,
        details: {
          realmId: ctx.metadata.realmId,
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
           error?.message?.includes('token_expired');
  }

  protected isRateLimitError(error: any): boolean {
    return error?.response?.status === 429 ||
           error?.message?.includes('rate_limited') ||
           error?.message?.includes('throttled');
  }

  protected extractRetryAfter(error: any): number {
    const retryAfter = error?.response?.headers?.['retry-after'];
    return retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000; // Default 1 minute
  }
}
