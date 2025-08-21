/**
 * HubSpot Connector
 * 
 * Example implementation of the contract-first connector interface
 * Demonstrates OAuth2 flow, data synchronization, and webhook handling
 */

import { BaseConnector } from '../connector-base';
import type { ConnectorContext, SyncResult, WebhookEvent } from '../types';
import { PROVIDER_CONFIGS } from '../http-client';
import { HubSpotWebhookHandler } from '../webhooks';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// HubSpot-specific types
interface HubSpotContact {
  id: string;
  properties: {
    email?: string;
    firstname?: string;
    lastname?: string;
    company?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
}

interface HubSpotCompany {
  id: string;
  properties: {
    name?: string;
    domain?: string;
    industry?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
}

interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
}

interface HubSpotOAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface HubSpotApiResponse<T> {
  results: T[];
  paging?: {
    next?: {
      after: string;
    };
  };
}

// Configuration schema
const HubSpotConfigSchema = z.object({
  syncContacts: z.boolean().default(true),
  syncCompanies: z.boolean().default(true),
  syncDeals: z.boolean().default(true),
  batchSize: z.number().min(1).max(100).default(50),
  webhookEvents: z.array(z.string()).default(['contact.creation', 'contact.propertyChange']),
});

export class HubSpotConnector extends BaseConnector {
  private webhookHandler: HubSpotWebhookHandler;

  constructor() {
    super(
      'hubspot',
      'HubSpot',
      '1.0.0',
      PROVIDER_CONFIGS.hubspot
    );
    
    this.webhookHandler = new HubSpotWebhookHandler();
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  getConfigSchema(): z.ZodSchema {
    return HubSpotConfigSchema;
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async authorize(ctx: ConnectorContext, code?: string): Promise<ConnectorContext> {
    this.logOperationStart('authorize', ctx);

    if (!code) {
      throw new Error('Authorization code is required');
    }

    try {
      const tokenResponse = await this.httpClient.post<HubSpotOAuthResponse>(
        '/oauth/v1/token',
        {
          grant_type: 'authorization_code',
          client_id: process.env.HUBSPOT_CLIENT_ID,
          client_secret: process.env.HUBSPOT_CLIENT_SECRET,
          redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
          code,
        }
      );

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.data.expires_in);

      const updatedCtx: ConnectorContext = {
        ...ctx,
        auth: {
          ...ctx.auth,
          accessToken: tokenResponse.data.access_token,
          refreshToken: tokenResponse.data.refresh_token,
          tokenType: tokenResponse.data.token_type,
          expiresAt: expiresAt.toISOString(),
        },
      };

      logger.info('HubSpot authorization successful', {
        tenantId: ctx.tenantId,
        installId: ctx.installId,
      });

      return updatedCtx;
    } catch (error) {
      await this.handleApiError(error, 'authorize', ctx);
    }
  }

  async refresh(ctx: ConnectorContext): Promise<ConnectorContext> {
    this.logOperationStart('refresh', ctx);

    if (!ctx.auth.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const tokenResponse = await this.httpClient.post<HubSpotOAuthResponse>(
        '/oauth/v1/token',
        {
          grant_type: 'refresh_token',
          client_id: process.env.HUBSPOT_CLIENT_ID,
          client_secret: process.env.HUBSPOT_CLIENT_SECRET,
          refresh_token: ctx.auth.refreshToken,
        }
      );

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.data.expires_in);

      const updatedCtx: ConnectorContext = {
        ...ctx,
        auth: {
          ...ctx.auth,
          accessToken: tokenResponse.data.access_token,
          refreshToken: tokenResponse.data.refresh_token || ctx.auth.refreshToken,
          tokenType: tokenResponse.data.token_type,
          expiresAt: expiresAt.toISOString(),
        },
      };

      logger.info('HubSpot token refresh successful', {
        tenantId: ctx.tenantId,
        installId: ctx.installId,
      });

      return updatedCtx;
    } catch (error) {
      await this.handleApiError(error, 'refresh', ctx);
    }
  }

  // ============================================================================
  // DATA SYNCHRONIZATION
  // ============================================================================

  async backfill(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    const startTime = Date.now();
    this.logOperationStart('backfill', ctx);

    const config = this.getConfigSchema().parse(ctx.config);
    const allData: any[] = [];
    const errors: string[] = [];

    try {
      // Sync contacts
      if (config.syncContacts) {
        const contactsResult = await this.syncContacts(ctx, cursor);
        allData.push(...contactsResult.data);
        errors.push(...contactsResult.errors);
      }

      // Sync companies
      if (config.syncCompanies) {
        const companiesResult = await this.syncCompanies(ctx, cursor);
        allData.push(...companiesResult.data);
        errors.push(...companiesResult.errors);
      }

      // Sync deals
      if (config.syncDeals) {
        const dealsResult = await this.syncDeals(ctx, cursor);
        allData.push(...dealsResult.data);
        errors.push(...dealsResult.errors);
      }

      const result = this.createSyncResult(
        errors.length === 0,
        allData,
        errors,
        undefined, // No cursor for backfill
        false
      );
      result.duration = Date.now() - startTime;

      this.logOperationComplete('backfill', ctx, result);
      return result;
    } catch (error) {
      await this.handleApiError(error, 'backfill', ctx);
    }
  }

  async delta(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    const startTime = Date.now();
    this.logOperationStart('delta', ctx);

    try {
      // For HubSpot, we can use the /crm/v3/objects/contacts/search endpoint
      // with a date filter to get recent changes
      const since = cursor ? new Date(cursor) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

      const response = await this.httpClient.post<HubSpotApiResponse<HubSpotContact>>(
        '/crm/v3/objects/contacts/search',
        {
          filterGroups: [{
            filters: [{
              propertyName: 'lastmodifieddate',
              operator: 'GTE',
              value: since.toISOString(),
            }],
          }],
          limit: 100,
        },
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
        }
      );

      const contacts = response.data.results.map(contact => ({
        id: contact.id,
        type: 'contact',
        data: contact,
        source: 'hubspot',
        timestamp: contact.properties.lastmodifieddate || new Date().toISOString(),
      }));

      const result = this.createSyncResult(
        true,
        contacts,
        [],
        response.data.paging?.next?.after,
        !!response.data.paging?.next
      );
      result.duration = Date.now() - startTime;

      this.logOperationComplete('delta', ctx, result);
      return result;
    } catch (error) {
      await this.handleApiError(error, 'delta', ctx);
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
    this.logOperationStart('webhook', ctx);

    try {
      const events = await this.webhookHandler.handle(headers, body, 'hubspot');
      
      // Transform HubSpot-specific events to our format
      const normalizedEvents = events.map(event => ({
        ...event,
        data: this.normalizeHubSpotEvent(event.data),
      }));

      logger.info('HubSpot webhook processed', {
        tenantId: ctx.tenantId,
        installId: ctx.installId,
        eventCount: normalizedEvents.length,
      });

      return normalizedEvents;
    } catch (error) {
      logger.error('HubSpot webhook processing failed', {
        tenantId: ctx.tenantId,
        installId: ctx.installId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async syncContacts(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    const config = this.getConfigSchema().parse(ctx.config);
    const contacts: any[] = [];
    const errors: string[] = [];

    try {
      let after = cursor;
      
      do {
        const response = await this.httpClient.get<HubSpotApiResponse<HubSpotContact>>(
          `/crm/v3/objects/contacts?limit=${config.batchSize}${after ? `&after=${after}` : ''}`,
          {
            'Authorization': `Bearer ${ctx.auth.accessToken}`,
          }
        );

        contacts.push(...response.data.results.map(contact => ({
          id: contact.id,
          type: 'contact',
          data: contact,
          source: 'hubspot',
          timestamp: contact.properties.lastmodifieddate || new Date().toISOString(),
        })));

        after = response.data.paging?.next?.after;
      } while (after);

      return this.createSyncResult(true, contacts, errors, after, !!after);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return this.createSyncResult(false, contacts, errors);
    }
  }

  private async syncCompanies(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    const config = this.getConfigSchema().parse(ctx.config);
    const companies: any[] = [];
    const errors: string[] = [];

    try {
      let after = cursor;
      
      do {
        const response = await this.httpClient.get<HubSpotApiResponse<HubSpotCompany>>(
          `/crm/v3/objects/companies?limit=${config.batchSize}${after ? `&after=${after}` : ''}`,
          {
            'Authorization': `Bearer ${ctx.auth.accessToken}`,
          }
        );

        companies.push(...response.data.results.map(company => ({
          id: company.id,
          type: 'company',
          data: company,
          source: 'hubspot',
          timestamp: company.properties.lastmodifieddate || new Date().toISOString(),
        })));

        after = response.data.paging?.next?.after;
      } while (after);

      return this.createSyncResult(true, companies, errors, after, !!after);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return this.createSyncResult(false, companies, errors);
    }
  }

  private async syncDeals(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    const config = this.getConfigSchema().parse(ctx.config);
    const deals: any[] = [];
    const errors: string[] = [];

    try {
      let after = cursor;
      
      do {
        const response = await this.httpClient.get<HubSpotApiResponse<HubSpotDeal>>(
          `/crm/v3/objects/deals?limit=${config.batchSize}${after ? `&after=${after}` : ''}`,
          {
            'Authorization': `Bearer ${ctx.auth.accessToken}`,
          }
        );

        deals.push(...response.data.results.map(deal => ({
          id: deal.id,
          type: 'deal',
          data: deal,
          source: 'hubspot',
          timestamp: deal.properties.lastmodifieddate || new Date().toISOString(),
        })));

        after = response.data.paging?.next?.after;
      } while (after);

      return this.createSyncResult(true, deals, errors, after, !!after);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return this.createSyncResult(false, deals, errors);
    }
  }

  private normalizeHubSpotEvent(event: any): any {
    // Normalize HubSpot webhook event to our standard format
    return {
      id: event.objectId || event.id,
      type: event.subscriptionType || event.eventType,
      timestamp: event.occurredAt || new Date().toISOString(),
      data: event,
      source: 'hubspot',
    };
  }
}
