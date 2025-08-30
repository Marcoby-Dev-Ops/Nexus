/**
 * Slack Connector
 * 
 * Implementation of the contract-first connector interface for Slack API
 * Provides access to channels, messages, users, and workspace data
 */

import { BaseConnector } from '../connector-base';
import type { ConnectorContext, SyncResult, WebhookEvent } from '../types';
import { PROVIDER_CONFIGS } from '../http-client';
import { SlackWebhookHandler } from '../webhooks';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// Slack API types
interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  email?: string;
  is_admin: boolean;
  is_owner: boolean;
  is_bot: boolean;
  deleted: boolean;
  profile: {
    display_name: string;
    real_name: string;
    email?: string;
    image_192: string;
  };
}

interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_private: boolean;
  is_archived: boolean;
  created: number;
  creator: string;
  members: string[];
  topic: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose: {
    value: string;
    creator: string;
    last_set: number;
  };
}

interface SlackMessage {
  type: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  reply_count?: number;
  reply_users_count?: number;
  latest_reply?: string;
  attachments?: any[];
  blocks?: any[];
}

interface SlackOAuthResponse {
  ok: boolean;
  access_token: string;
  scope: string;
  user_id: string;
  team_name: string;
  team_id: string;
  bot_user_id?: string;
  incoming_webhook?: {
    url: string;
    channel: string;
    channel_id: string;
    configuration_url: string;
  };
}

interface SlackAPIResponse<T> {
  ok: boolean;
  data: T;
  response_metadata?: {
    next_cursor?: string;
  };
}

// Configuration schema
const SlackConfigSchema = z.object({
  syncUsers: z.boolean().default(true),
  syncChannels: z.boolean().default(true),
  syncMessages: z.boolean().default(true),
  syncFiles: z.boolean().default(true),
  messageLimit: z.number().min(1).max(1000).default(100),
  includeThreads: z.boolean().default(true),
  batchSize: z.number().min(1).max(100).default(50),
  webhookEvents: z.array(z.string()).default([
    'message',
    'channel_created',
    'user_joined',
    'file_shared'
  ]),
  scopes: z.array(z.string()).default([
    'users:read',
    'channels:read',
    'channels:history',
    'files:read',
    'chat:write'
  ]),
});

export class SlackConnector extends BaseConnector {
  private webhookHandler: SlackWebhookHandler;
  private readonly slackApiBase = 'https://slack.com/api';

  constructor() {
    super(
      'slack',
      'Slack',
      '1.0.0',
      PROVIDER_CONFIGS.slack
    );
    
    this.webhookHandler = new SlackWebhookHandler();
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  getConfigSchema(): z.ZodSchema {
    return SlackConfigSchema;
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async authorize(ctx: ConnectorContext, code?: string): Promise<ConnectorContext> {
    if (!code) {
      throw new Error('Authorization code is required for Slack OAuth');
    }

    try {
      const tokenResponse = await this.httpClient.post<SlackOAuthResponse>(
        `${this.slackApiBase}/oauth.v2.access`,
        new URLSearchParams({
          client_id: process.env.SLACK_CLIENT_ID!,
          client_secret: process.env.SLACK_CLIENT_SECRET!,
          code,
          redirect_uri: process.env.SLACK_REDIRECT_URI!,
        }).toString(),
        {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      );

      const updatedCtx: ConnectorContext = {
        ...ctx,
        auth: {
          accessToken: tokenResponse.data.access_token,
          refreshToken: '', // Slack doesn't use refresh tokens
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        },
        metadata: {
          ...ctx.metadata,
          scopes: tokenResponse.data.scope.split(','),
          teamId: tokenResponse.data.team_id,
          teamName: tokenResponse.data.team_name,
          userId: tokenResponse.data.user_id,
          lastAuth: new Date().toISOString(),
        },
      };

      logger.info('Slack authorization successful', {
        tenantId: ctx.tenantId,
        teamId: tokenResponse.data.team_id,
        scopes: tokenResponse.data.scope.split(','),
      });

      return updatedCtx;
    } catch (error) {
      logger.error('Slack authorization failed', {
        tenantId: ctx.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Slack authorization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async refresh(ctx: ConnectorContext): Promise<ConnectorContext> {
    // Slack tokens don't expire, so we just return the same context
    logger.info('Slack token refresh (no-op)', {
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

      // Sync channels
      if (ctx.config.syncChannels !== false) {
        const channelsResult = await this.syncChannels(ctx, cursor);
        results.recordsProcessed += channelsResult.recordsProcessed;
        results.data.push(...channelsResult.data);
        results.errors.push(...channelsResult.errors);
      }

      // Sync messages
      if (ctx.config.syncMessages !== false) {
        const messagesResult = await this.syncMessages(ctx, cursor);
        results.recordsProcessed += messagesResult.recordsProcessed;
        results.data.push(...messagesResult.data);
        results.errors.push(...messagesResult.errors);
      }

      results.duration = Date.now() - startTime;
      results.hasMore = !!results.cursor;

      logger.info('Slack backfill completed', {
        tenantId: ctx.tenantId,
        recordsProcessed: results.recordsProcessed,
        errors: results.errors.length,
        duration: results.duration,
      });

      return results;
    } catch (error) {
      logger.error('Slack backfill failed', {
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
    // For Slack, we can use cursor-based pagination for delta syncs
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
        limit: (ctx.config.batchSize || 50).toString(),
      });
      
      if (cursor) {
        params.append('cursor', cursor);
      }

      const response = await this.httpClient.get<SlackAPIResponse<{ members: SlackUser[] }>>(
        `${this.slackApiBase}/users.list?${params.toString()}`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.data.members.length,
        cursor: response.data.response_metadata?.next_cursor || undefined,
        data: response.data.data.members,
        errors: [],
        duration: 0,
        hasMore: !!response.data.response_metadata?.next_cursor,
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

  private async syncChannels(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      const params = new URLSearchParams({
        limit: (ctx.config.batchSize || 50).toString(),
        exclude_archived: 'true',
      });
      
      if (cursor) {
        params.append('cursor', cursor);
      }

      const response = await this.httpClient.get<SlackAPIResponse<{ channels: SlackChannel[] }>>(
        `${this.slackApiBase}/conversations.list?${params.toString()}`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      return {
        success: true,
        recordsProcessed: response.data.data.channels.length,
        cursor: response.data.response_metadata?.next_cursor || undefined,
        data: response.data.data.channels,
        errors: [],
        duration: 0,
        hasMore: !!response.data.response_metadata?.next_cursor,
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

  private async syncMessages(ctx: ConnectorContext, cursor?: string): Promise<SyncResult> {
    try {
      // Get channels first to sync messages from each
      const channelsResponse = await this.httpClient.get<SlackAPIResponse<{ channels: SlackChannel[] }>>(
        `${this.slackApiBase}/conversations.list?limit=100`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      const allMessages: SlackMessage[] = [];
      let totalProcessed = 0;

      // Sync messages from each channel
      for (const channel of channelsResponse.data.data.channels.slice(0, 5)) { // Limit to 5 channels for demo
        const params = new URLSearchParams({
          channel: channel.id,
          limit: (ctx.config.messageLimit || 100).toString(),
        });

        const messagesResponse = await this.httpClient.get<SlackAPIResponse<{ messages: SlackMessage[] }>>(
          `${this.slackApiBase}/conversations.history?${params.toString()}`,
          {
            Authorization: `Bearer ${ctx.auth.accessToken}`,
          }
        );

        allMessages.push(...messagesResponse.data.data.messages);
        totalProcessed += messagesResponse.data.data.messages.length;
      }

      return {
        success: true,
        recordsProcessed: totalProcessed,
        cursor: undefined, // No cursor for message sync
        data: allMessages,
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
    return await this.webhookHandler.handle(headers, body, 'slack');
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  async healthCheck(ctx: ConnectorContext): Promise<{ healthy: boolean; details?: any }> {
    try {
      // Test basic API access
      const response = await this.httpClient.get<SlackAPIResponse<{ team: any }>>(
        `${this.slackApiBase}/team.info`,
        {
          Authorization: `Bearer ${ctx.auth.accessToken}`,
        }
      );

      // Test specific scopes if configured
      const scopeTests = [];
      
      if (ctx.config.syncUsers !== false) {
        try {
          await this.httpClient.get(`${this.slackApiBase}/users.list?limit=1`, {
            Authorization: `Bearer ${ctx.auth.accessToken}`,
          });
          scopeTests.push({ scope: 'users', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'users', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      if (ctx.config.syncChannels !== false) {
        try {
          await this.httpClient.get(`${this.slackApiBase}/conversations.list?limit=1`, {
            Authorization: `Bearer ${ctx.auth.accessToken}`,
          });
          scopeTests.push({ scope: 'channels', status: 'ok' });
        } catch (error) {
          scopeTests.push({ scope: 'channels', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      return {
        healthy: true,
        details: {
          team: response.data.data.team.name,
          teamId: response.data.data.team.id,
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
           error?.message?.includes('token_revoked') ||
           error?.message?.includes('token_expired');
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
