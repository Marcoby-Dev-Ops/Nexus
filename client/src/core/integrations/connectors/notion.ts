/**
 * Notion Connector
 * 
 * Implementation of the contract-first connector interface for Notion API
 * Provides access to workspaces, pages, databases, and content management
 */

import { BaseConnector } from '../connector-base';
import type { ConnectorContext, SyncResult, WebhookEvent } from '../types';
import { PROVIDER_CONFIGS } from '../http-client';
import { NotionWebhookHandler } from '../webhooks';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// Notion API types
interface NotionUser {
  id: string;
  name?: string;
  avatar_url?: string;
  type: 'person' | 'bot';
  person?: {
    email?: string;
  };
  bot?: {
    workspace_name?: string;
  };
}

interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  created_by: NotionUser;
  last_edited_by: NotionUser;
  parent: {
    type: 'database_id' | 'page_id' | 'workspace_id';
    database_id?: string;
    page_id?: string;
    workspace_id?: boolean;
  };
  archived: boolean;
  url: string;
  public_url?: string;
  properties: Record<string, any>;
  content?: NotionBlock[];
}

interface NotionDatabase {
  id: string;
  created_time: string;
  last_edited_time: string;
  created_by: NotionUser;
  last_edited_by: NotionUser;
  title: Array<{
    type: 'text';
    text: {
      content: string;
      link?: string;
    };
    annotations?: {
      bold: boolean;
      italic: boolean;
      strikethrough: boolean;
      underline: boolean;
      code: boolean;
      color: string;
    };
    plain_text: string;
    href?: string;
  }>;
  description: Array<{
    type: 'text';
    text: {
      content: string;
      link?: string;
    };
    annotations?: {
      bold: boolean;
      italic: boolean;
      strikethrough: boolean;
      underline: boolean;
      code: boolean;
      color: string;
    };
    plain_text: string;
    href?: string;
  }>;
  properties: Record<string, any>;
  parent: {
    type: 'page_id' | 'workspace_id';
    page_id?: string;
    workspace_id?: boolean;
  };
  url: string;
  public_url?: string;
  archived: boolean;
}

interface NotionBlock {
  id: string;
  type: string;
  created_time: string;
  created_by: NotionUser;
  last_edited_time: string;
  last_edited_by: NotionUser;
  archived: boolean;
  has_children: boolean;
  [key: string]: any;
}

interface NotionOAuthResponse {
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_name: string;
  workspace_icon?: string;
  workspace_id: string;
  owner: {
    type: 'user';
    user: {
      object: 'user';
      id: string;
      name?: string;
      avatar_url?: string;
      type: 'person';
      person: {
        email: string;
      };
    };
  };
}

interface NotionAPIResponse<T> {
  object: 'list';
  results: T[];
  next_cursor?: string;
  has_more: boolean;
}

// Configuration schema
const NotionConfigSchema = z.object({
  syncPages: z.boolean().default(true),
  syncDatabases: z.boolean().default(true),
  syncBlocks: z.boolean().default(true),
  syncUsers: z.boolean().default(true),
  pageLimit: z.number().min(1).max(100).default(50),
  databaseLimit: z.number().min(1).max(100).default(50),
  includeArchived: z.boolean().default(false),
  syncContent: z.boolean().default(true),
  batchSize: z.number().min(1).max(100).default(50),
  webhookEvents: z.array(z.string()).default([
    'page.created',
    'page.updated',
    'page.deleted',
    'database.created',
    'database.updated',
    'database.deleted',
    'block.created',
    'block.updated',
    'block.deleted'
  ]),
  scopes: z.array(z.string()).default([
    'read_content',
    'update_content',
    'insert_content',
    'create_pages',
    'update_pages'
  ]),
});

export class NotionConnector extends BaseConnector {
  private webhookHandler: NotionWebhookHandler;
  private readonly notionApiBase = 'https://api.notion.com/v1';

  constructor() {
    super(
      'notion',
      'Notion',
      '1.0.0',
      PROVIDER_CONFIGS.notion
    );
    
    this.webhookHandler = new NotionWebhookHandler();
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  getConfigSchema(): z.ZodSchema {
    return NotionConfigSchema;
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async authorize(ctx: ConnectorContext, code?: string): Promise<ConnectorContext> {
    if (!code) {
      throw new Error('Authorization code is required for Notion OAuth');
    }

    try {
      const tokenResponse = await this.httpClient.post<NotionOAuthResponse>(
        'https://api.notion.com/v1/oauth/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.NOTION_REDIRECT_URI!,
        }).toString(),
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64')}`,
        }
      );

      const updatedCtx: ConnectorContext = {
        ...ctx,
        auth: {
          accessToken: tokenResponse.data.access_token,
          refreshToken: '', // Notion doesn't use refresh tokens
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        },
        metadata: {
          ...ctx.metadata,
          workspaceId: tokenResponse.data.workspace_id,
          workspaceName: tokenResponse.data.workspace_name,
          workspaceIcon: tokenResponse.data.workspace_icon,
          botId: tokenResponse.data.bot_id,
          ownerId: tokenResponse.data.owner.user.id,
          lastAuth: new Date().toISOString(),
        },
      };

      logger.info('Notion authorization successful', {
        tenantId: ctx.tenantId,
        workspaceId: tokenResponse.data.workspace_id,
        workspaceName: tokenResponse.data.workspace_name,
      });

      return updatedCtx;
    } catch (error) {
      logger.error('Notion authorization failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Notion authorization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async refresh(ctx: ConnectorContext): Promise<ConnectorContext> {
    // Notion tokens don't expire, so we just return the same context
    logger.info('Notion token refresh (no-op)', {
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
      // Sync users
      if (ctx.config.syncUsers !== false) {
        const usersResult = await this.syncUsers(ctx, cursor);
        results.recordsProcessed += usersResult.recordsProcessed;
        results.data.push(...usersResult.data);
        results.errors.push(...usersResult.errors);
      }

      // Sync databases
      if (ctx.config.syncDatabases !== false) {
        const databasesResult = await this.syncDatabases(ctx, cursor);
        results.recordsProcessed += databasesResult.recordsProcessed;
        results.data.push(...databasesResult.data);
        results.errors.push(...databasesResult.errors);
      }

      // Sync pages
      if (ctx.config.syncPages !== false) {
        const pagesResult = await this.syncPages(ctx, cursor);
        results.recordsProcessed += pagesResult.recordsProcessed;
        results.data.push(...pagesResult.data);
        results.errors.push(...pagesResult.errors);
      }

      // Sync blocks (content)
      if (ctx.config.syncBlocks !== false) {
        const blocksResult = await this.syncBlocks(ctx, cursor);
        results.recordsProcessed += blocksResult.recordsProcessed;
        results.data.push(...blocksResult.data);
        results.errors.push(...blocksResult.errors);
      }

      results.duration = Date.now() - startTime;
      results.hasMore = !!results.cursor;

      logger.info('Notion backfill completed', {
        tenantId: ctx.tenantId,
        recordsProcessed: results.recordsProcessed,
        errors: results.errors.length,
        duration: results.duration,
      });

      return results;
    } catch (error) {
      logger.error('Notion backfill failed', {
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
    // For Notion, we can use cursor-based pagination for delta syncs
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
        page_size: (ctx.config.batchSize || 50).toString(),
      });
      
      if (cursor) {
        params.append('start_cursor', cursor);
      }

      const response = await this.httpClient.get<NotionAPIResponse<NotionUser>>(
        `${this.notionApiBase}/users?${params.toString()}`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Notion-Version': '2022-06-28',
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.results.length,
        cursor: response.data.next_cursor || undefined,
        data: response.data.results,
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

  private async syncDatabases(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        page_size: (ctx.config.databaseLimit || 50).toString(),
      });
      
      if (cursor) {
        params.append('start_cursor', cursor);
      }

      const response = await this.httpClient.post<NotionAPIResponse<NotionDatabase>>(
        `${this.notionApiBase}/databases/query?${params.toString()}`,
        JSON.stringify({
          filter: ctx.config.includeArchived ? {} : { property: 'archived', checkbox: { equals: false } },
        }),
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.results.length,
        cursor: response.data.next_cursor || undefined,
        data: response.data.results,
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

  private async syncPages(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        page_size: (ctx.config.pageLimit || 50).toString(),
      });
      
      if (cursor) {
        params.append('start_cursor', cursor);
      }

      const response = await this.httpClient.post<NotionAPIResponse<NotionPage>>(
        `${this.notionApiBase}/pages/query?${params.toString()}`,
        JSON.stringify({
          filter: ctx.config.includeArchived ? {} : { property: 'archived', checkbox: { equals: false } },
        }),
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.results.length,
        cursor: response.data.next_cursor || undefined,
        data: response.data.results,
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

  private async syncBlocks(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      // Get pages first to sync their blocks
      const pagesResponse = await this.httpClient.post<NotionAPIResponse<NotionPage>>(
        `${this.notionApiBase}/pages/query`,
        JSON.stringify({
          page_size: Math.min(ctx.config.batchSize || 50, 10), // Limit pages for block sync
          filter: ctx.config.includeArchived ? {} : { property: 'archived', checkbox: { equals: false } },
        }),
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        }
      );

      const allBlocks: NotionBlock[] = [];
      let totalProcessed = 0;

      // Sync blocks from each page
      for (const page of pagesResponse.data.results) {
        const blocksResponse = await this.httpClient.get<NotionAPIResponse<NotionBlock>>(
          `${this.notionApiBase}/blocks/${page.id}/children`,
          {
            'Authorization': `Bearer ${ctx.auth.accessToken}`,
            'Notion-Version': '2022-06-28',
          }
        );

        allBlocks.push(...blocksResponse.data.results);
        totalProcessed += blocksResponse.data.results.length;
      }

      return {
        success: true,
        recordsProcessed: totalProcessed,
        cursor: undefined, // No cursor for block sync
        data: allBlocks,
        errors: [],
        duration: 0,
        hasMore: false,
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
    return await this.webhookHandler.handle(headers, body, 'notion');
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  async healthCheck(ctx: ConnectorContext): Promise<{ healthy: boolean; details?: any }> {
    try {
      // Test basic API access
      const response = await this.httpClient.get<{ results: NotionUser[] }>(
        `${this.notionApiBase}/users?page_size=1`,
        {
          'Authorization': `Bearer ${ctx.auth.accessToken}`,
          'Notion-Version': '2022-06-28',
        }
      );

      // Test specific scopes if configured
      const scopeTests = [];
      
      if (ctx.config.syncPages !== false) {
        try {
          await this.httpClient.post(
            `${this.notionApiBase}/pages/query`,
            JSON.stringify({ page_size: 1 }),
            {
              'Authorization': `Bearer ${ctx.auth.accessToken}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json',
            }
          );
          scopeTests.push({ scope: 'pages', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'pages', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      if (ctx.config.syncDatabases !== false) {
        try {
          await this.httpClient.post(
            `${this.notionApiBase}/databases/query`,
            JSON.stringify({ page_size: 1 }),
            {
              'Authorization': `Bearer ${ctx.auth.accessToken}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json',
            }
          );
          scopeTests.push({ scope: 'databases', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'databases', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      return {
        healthy: true,
        details: {
          workspaceId: ctx.metadata.workspaceId,
          workspaceName: ctx.metadata.workspaceName,
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
           error?.message?.includes('invalid_token');
  }

  protected isRateLimitError(error: any): boolean {
    return error?.response?.status === 429 ||
           error?.message?.includes('rate_limited');
  }

  protected extractRetryAfter(error: any): number {
    const retryAfter = error?.response?.headers?.['retry-after'];
    return retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000; // Default 1 minute
  }
}
