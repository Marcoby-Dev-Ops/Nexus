/**
 * Microsoft 365 Connector
 * 
 * Implementation of the contract-first connector interface for Microsoft Graph API
 * Provides access to Teams, Outlook, OneDrive, SharePoint, and other Microsoft 365 services
 */

import { BaseConnector } from '../connector-base';
import type { ConnectorContext, SyncResult, WebhookEvent } from '../types';
import { PROVIDER_CONFIGS } from '../http-client';
import { Microsoft365WebhookHandler } from '../webhooks';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// Microsoft Graph API types
interface MicrosoftUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  businessPhones?: string[];
  officeLocation?: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
}

interface MicrosoftTeam {
  id: string;
  displayName: string;
  description?: string;
  visibility: 'private' | 'public';
  createdDateTime: string;
  lastUpdatedDateTime: string;
}

interface MicrosoftChannel {
  id: string;
  displayName: string;
  description?: string;
  createdDateTime: string;
  lastUpdatedDateTime: string;
}

interface MicrosoftMessage {
  id: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  subject?: string;
  body: {
    content: string;
    contentType: 'text' | 'html';
  };
  from: {
    user: {
      displayName: string;
      email: string;
    };
  };
  toRecipients: Array<{
    user: {
      displayName: string;
      email: string;
    };
  }>;
}

interface MicrosoftEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
    status: {
      response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded';
    };
  }>;
  organizer: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
}

interface MicrosoftDriveItem {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  createdDateTime: string;
  '@microsoft.graph.downloadUrl'?: string;
  file?: {
    mimeType: string;
  };
  folder?: {
    childCount: number;
  };
}

interface MicrosoftOAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface MicrosoftGraphResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

// Configuration schema
const Microsoft365ConfigSchema = z.object({
  syncUsers: z.boolean().default(true),
  syncTeams: z.boolean().default(true),
  syncEmails: z.boolean().default(true),
  syncCalendar: z.boolean().default(true),
  syncFiles: z.boolean().default(true),
  syncSharePoint: z.boolean().default(true),
  emailLimit: z.number().min(1).max(1000).default(100),
  includeAttachments: z.boolean().default(false),
  batchSize: z.number().min(1).max(100).default(50),
  webhookEvents: z.array(z.string()).default([
    'users.read',
    'teams.read',
    'mail.read',
    'calendars.read',
    'files.read'
  ]),
  scopes: z.array(z.string()).default([
    'User.Read',
    'Team.ReadBasic.All',
    'Mail.Read',
    'Calendars.Read',
    'Files.Read'
  ]),
});

export class Microsoft365Connector extends BaseConnector {
  private webhookHandler: Microsoft365WebhookHandler;
  private readonly graphApiBase = 'https://graph.microsoft.com/v1.0';

  constructor() {
    super(
      'microsoft365',
      'Microsoft 365',
      '1.0.0',
      PROVIDER_CONFIGS.microsoft365
    );
    
    this.webhookHandler = new Microsoft365WebhookHandler();
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  getConfigSchema(): z.ZodSchema {
    return Microsoft365ConfigSchema;
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async authorize(ctx: ConnectorContext, code?: string): Promise<ConnectorContext> {
    if (!code) {
      throw new Error('Authorization code is required for Microsoft 365 OAuth');
    }

    try {
      const tokenResponse = await this.httpClient.post<MicrosoftOAuthResponse>(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
          scope: ctx.config.scopes?.join(' ') || 'User.Read Team.ReadBasic.All Mail.Read Calendars.Read Files.Read',
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
            expiresAt: new Date(Date.now() + tokenResponse.data.expires_in * 1000).toISOString(),
          },
          metadata: {
            ...ctx.metadata,
            scopes: tokenResponse.data.scope.split(' '),
            lastAuth: new Date().toISOString(),
          },
        };

              logger.info('Microsoft 365 authorization successful', {
          tenantId: ctx.tenantId,
          scopes: tokenResponse.data.scope.split(' '),
        });

      return updatedCtx;
    } catch (error) {
      logger.error('Microsoft 365 authorization failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Microsoft 365 authorization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async refresh(ctx: ConnectorContext): Promise<ConnectorContext> {
    if (!ctx.auth.refreshToken) {
      throw new Error('No refresh token available for Microsoft 365');
    }

    try {
      const tokenResponse = await this.httpClient.post<MicrosoftOAuthResponse>(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          refresh_token: ctx.auth.refreshToken,
          grant_type: 'refresh_token',
          scope: ctx.config.scopes?.join(' ') || 'User.Read Team.ReadBasic.All Mail.Read Calendars.Read Files.Read',
        }).toString(),
        {
          'Content-Type': 'application/x-www-form-urlencoded',
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

      logger.info('Microsoft 365 token refresh successful', {
        tenantId: ctx.tenantId,
      });

      return updatedCtx;
    } catch (error) {
      logger.error('Microsoft 365 token refresh failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Microsoft 365 token refresh failed: ${error instanceof Error ? error.message : String(error)}`);
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
      // Sync users
      if (ctx.config.syncUsers !== false) {
        const usersResult = await this.syncUsers(ctx, cursor);
        results.recordsProcessed += usersResult.recordsProcessed;
        results.data.push(...usersResult.data);
        results.errors.push(...usersResult.errors);
      }

      // Sync teams
      if (ctx.config.syncTeams !== false) {
        const teamsResult = await this.syncTeams(ctx, cursor);
        results.recordsProcessed += teamsResult.recordsProcessed;
        results.data.push(...teamsResult.data);
        results.errors.push(...teamsResult.errors);
      }

      // Sync emails
      if (ctx.config.syncEmails !== false) {
        const emailsResult = await this.syncEmails(ctx, cursor);
        results.recordsProcessed += emailsResult.recordsProcessed;
        results.data.push(...emailsResult.data);
        results.errors.push(...emailsResult.errors);
      }

      // Sync calendar events
      if (ctx.config.syncCalendar !== false) {
        const calendarResult = await this.syncCalendar(ctx, cursor);
        results.recordsProcessed += calendarResult.recordsProcessed;
        results.data.push(...calendarResult.data);
        results.errors.push(...calendarResult.errors);
      }

      // Sync files
      if (ctx.config.syncFiles !== false) {
        const filesResult = await this.syncFiles(ctx, cursor);
        results.recordsProcessed += filesResult.recordsProcessed;
        results.data.push(...filesResult.data);
        results.errors.push(...filesResult.errors);
      }

      results.duration = Date.now() - startTime;
      results.hasMore = !!results.cursor;

      logger.info('Microsoft 365 backfill completed', {
        tenantId: ctx.tenantId,
        recordsProcessed: results.recordsProcessed,
        errors: results.errors.length,
        duration: results.duration,
      });

      return results;
    } catch (error) {
      logger.error('Microsoft 365 backfill failed', {
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
    // For Microsoft Graph, we can use delta queries for some resources
    // For now, we'll do a full sync but with smaller batch sizes
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

  private async syncUsers(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        $select: 'id,displayName,mail,userPrincipalName,businessPhones,officeLocation,jobTitle,department,companyName',
        $top: (ctx.config.batchSize || 50).toString(),
        $orderby: 'displayName',
      });
      
      if (cursor) {
        params.append('$skiptoken', cursor);
      }

      const response = await this.httpClient.get<MicrosoftGraphResponse<MicrosoftUser>>(
        `${this.graphApiBase}/users?${params.toString()}`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.value.length,
        cursor: response.data['@odata.nextLink'] || undefined,
        data: response.data.value,
        errors: [],
        duration: 0,
        hasMore: !!response.data['@odata.nextLink'],
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

  private async syncTeams(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        $select: 'id,displayName,description,visibility,createdDateTime,lastUpdatedDateTime',
        $top: (ctx.config.batchSize || 50).toString(),
        $orderby: 'displayName',
      });
      
      if (cursor) {
        params.append('$skiptoken', cursor);
      }

      const response = await this.httpClient.get<MicrosoftGraphResponse<MicrosoftTeam>>(
        `${this.graphApiBase}/teams?${params.toString()}`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.value.length,
        cursor: response.data['@odata.nextLink'] || undefined,
        data: response.data.value,
        errors: [],
        duration: 0,
        hasMore: !!response.data['@odata.nextLink'],
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

  private async syncEmails(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        $select: 'id,createdDateTime,lastModifiedDateTime,subject,body,from,toRecipients',
        $top: (ctx.config.batchSize || 50).toString(),
        $orderby: 'receivedDateTime desc',
        $filter: 'receivedDateTime ge 2024-01-01', // Last year
      });
      
      if (cursor) {
        params.append('$skiptoken', cursor);
      }

      const response = await this.httpClient.get<MicrosoftGraphResponse<MicrosoftMessage>>(
        `${this.graphApiBase}/me/messages?${params.toString()}`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.value.length,
        cursor: response.data['@odata.nextLink'] || undefined,
        data: response.data.value,
        errors: [],
        duration: 0,
        hasMore: !!response.data['@odata.nextLink'],
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

  private async syncCalendar(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        $select: 'id,subject,start,end,location,attendees,organizer',
        $top: (ctx.config.batchSize || 50).toString(),
        $orderby: 'start/dateTime desc',
        $filter: 'start/dateTime ge 2024-01-01', // Last year
      });
      
      if (cursor) {
        params.append('$skiptoken', cursor);
      }

      const response = await this.httpClient.get<MicrosoftGraphResponse<MicrosoftEvent>>(
        `${this.graphApiBase}/me/events?${params.toString()}`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.value.length,
        cursor: response.data['@odata.nextLink'] || undefined,
        data: response.data.value,
        errors: [],
        duration: 0,
        hasMore: !!response.data['@odata.nextLink'],
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

  private async syncFiles(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        $select: 'id,name,size,lastModifiedDateTime,createdDateTime,file,folder',
        $top: (ctx.config.batchSize || 50).toString(),
        $orderby: 'lastModifiedDateTime desc',
      });
      
      if (cursor) {
        params.append('$skiptoken', cursor);
      }

      const response = await this.httpClient.get<MicrosoftGraphResponse<MicrosoftDriveItem>>(
        `${this.graphApiBase}/me/drive/root/children?${params.toString()}`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.value.length,
        cursor: response.data['@odata.nextLink'] || undefined,
        data: response.data.value,
        errors: [],
        duration: 0,
        hasMore: !!response.data['@odata.nextLink'],
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
    return await this.webhookHandler.handle(headers, body, 'microsoft365');
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  async healthCheck(ctx: ConnectorContext): Promise<{ healthy: boolean; details?: any }> {
    try {
      // Test basic API access
      const response = await this.httpClient.get(
        `${this.graphApiBase}/me`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      // Test specific scopes if configured
      const scopeTests = [];
      
              if (ctx.config.syncTeams !== false) {
          try {
            await this.httpClient.get(`${this.graphApiBase}/teams?$top=1`, {
              Authorization: `Bearer ${ctx.auth.accessToken}`,
            });
            scopeTests.push({ scope: 'teams', status: 'ok' });
          } catch (error) {
            scopeTests.push({ scope: 'teams', status: 'error', error: error instanceof Error ? error.message : String(error) });
          }
        }

        if (ctx.config.syncEmails !== false) {
          try {
            await this.httpClient.get(`${this.graphApiBase}/me/messages?$top=1`, {
              Authorization: `Bearer ${ctx.auth.accessToken}`,
            });
            scopeTests.push({ scope: 'emails', status: 'ok' });
          } catch (error) {
            scopeTests.push({ scope: 'emails', status: 'error', error: error instanceof Error ? error.message : String(error) });
          }
        }

              return {
          healthy: true,
          details: {
            user: response.data.displayName,
            email: response.data.mail,
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
           error?.message?.includes('access_denied') ||
           error?.message?.includes('invalid_token');
  }

  protected isRateLimitError(error: any): boolean {
    return error?.response?.status === 429 ||
           error?.message?.includes('rate_limit') ||
           error?.message?.includes('too_many_requests');
  }

  protected extractRetryAfter(error: any): number {
    const retryAfter = error?.response?.headers?.['retry-after'];
    return retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000; // Default 1 minute
  }
}
