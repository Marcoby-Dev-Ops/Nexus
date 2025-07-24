import { BaseIntegration } from '@/domains/integrations/lib/baseIntegration';
import type { SyncResult } from '@/domains/integrations/lib/baseIntegration';
import { syncIntegration } from '@/domains/integrations/lib/syncService';
import { OAuthTokenService } from '@/domains/integrations/lib/oauthTokenService';
import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';
import type { AuthType } from './authTypes';

interface SlackMessage {
  ts: string;
  text: string;
  user: string;
  channel: string;
  type: string;
  attachments?: any[];
  reactions?: Array<{
    name: string;
    count: number;
    users: string[];
  }>;
  thread_ts?: string;
  reply_count?: number;
  reply_users_count?: number;
}

interface SlackChannel {
  id: string;
  name: string;
  isprivate: boolean;
  isarchived: boolean;
  nummembers: number;
  topic?: {
    value: string;
    creator: string;
    lastset: number;
  };
  purpose?: {
    value: string;
    creator: string;
    lastset: number;
  };
  created: number;
  creator: string;
}

interface SlackUser {
  id: string;
  name: string;
  realname: string;
  displayname: string;
  email?: string;
  isadmin: boolean;
  isowner: boolean;
  isbot: boolean;
  isrestricted: boolean;
  isultrarestricted: boolean;
  deleted: boolean;
  profile: {
    avatarhash: string;
    statustext: string;
    statusemoji: string;
    realname: string;
    displayname: string;
    realnamenormalized: string;
    displaynamenormalized: string;
    email: string;
    imageoriginal: string;
    team: string;
  };
  tz: string;
  tzlabel: string;
  tzoffset: number;
  updated: number;
}

interface SlackFile {
  id: string;
  created: number;
  timestamp: number;
  name: string;
  title: string;
  mimetype: string;
  filetype: string;
  prettytype: string;
  user: string;
  editable: boolean;
  size: number;
  mode: string;
  isexternal: boolean;
  externaltype: string;
  ispublic: boolean;
  publicurlshared: boolean;
  displayasbot: boolean;
  username: string;
  urlprivate: string;
  urlprivatedownload: string;
  permalink: string;
  permalinkpublic: string;
  isstarred: boolean;
  hasrichpreview: boolean;
}

interface SlackReaction {
  name: string;
  count: number;
  users: string[];
}

export class SlackIntegration extends BaseIntegration {
  id = 'slack';
  name = 'Slack';
  dataFields = ['messages', 'channels', 'users', 'files', 'reactions', 'threads'];
  authType: AuthType = 'oauth';

  private async getAccessToken(userId: string): Promise<string> {
    const token = await OAuthTokenService.getTokens('slack');
    if (!token?.access_token) {
      throw new Error('No valid Slack access token found. Please reconnect your account.');
    }
    return token.access_token;
  }

  private async makeSlackRequest<T>(endpoint: string, accessToken: string, params?: Record<string, any>): Promise<T> {
    const baseUrl = 'https: //slack.com/api';
    const url = new URL(`${baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ endpoint, status: response.status, error: errorText }, 'Slack API request failed');
      throw new Error(`Slack API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.ok) {
      logger.error({ endpoint, error: data.error }, 'Slack API returned error');
      throw new Error(`Slack API error: ${data.error}`);
    }

    return data;
  }

  async fetchProviderData({ userId, fullSync = false }: { userId: string; fullSync?: boolean }): Promise<Record<string, any[]>> {
    try {
      logger.info({ userId, fullSync }, 'Starting Slack data fetch');
      
      const accessToken = await this.getAccessToken(userId);
      
      // Fetch data in parallel for better performance
      const [
        messages,
        channels,
        users,
        files,
        reactions,
        threads
      ] = await Promise.all([
        this.fetchMessages(accessToken, fullSync),
        this.fetchChannels(accessToken),
        this.fetchUsers(accessToken),
        this.fetchFiles(accessToken, fullSync),
        this.fetchReactions(accessToken, fullSync),
        this.fetchThreads(accessToken, fullSync)
      ]);

      const result = {
        messages,
        channels,
        users,
        files,
        reactions,
        threads
      };

      logger.info({ 
        userId, 
        messageCount: messages.length,
        channelCount: channels.length,
        userCount: users.length,
        fileCount: files.length,
        reactionCount: reactions.length,
        threadCount: threads.length
      }, 'Slack data fetch completed');

      return result;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch Slack data');
      throw error;
    }
  }

  private async fetchMessages(accessToken: string, fullSync: boolean): Promise<SlackMessage[]> {
    try {
      const channels = await this.fetchChannels(accessToken);
      const messages: SlackMessage[] = [];
      
      // Fetch messages from each channel
      for (const channel of channels) {
        const params: Record<string, any> = {
          channel: channel.id,
          limit: fullSync ? 1000 : 100 // More messages for full sync
        };
        
        if (!fullSync) {
          // For incremental sync, get recent messages
          const oneWeekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
          params.oldest = oneWeekAgo.toString();
        }

        const response = await this.makeSlackRequest<{ messages: SlackMessage[] }>(
          '/conversations.history',
          accessToken,
          params
        );

        messages.push(...(response.messages || []));
      }

      return messages;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Slack messages');
      return [];
    }
  }

  private async fetchChannels(accessToken: string): Promise<SlackChannel[]> {
    try {
      const response = await this.makeSlackRequest<{ channels: SlackChannel[] }>(
        '/conversations.list',
        accessToken,
        { types: 'public_channel,private_channel' }
      );

      return response.channels || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Slack channels');
      return [];
    }
  }

  private async fetchUsers(accessToken: string): Promise<SlackUser[]> {
    try {
      const response = await this.makeSlackRequest<{ members: SlackUser[] }>(
        '/users.list',
        accessToken
      );

      return response.members || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Slack users');
      return [];
    }
  }

  private async fetchFiles(accessToken: string, fullSync: boolean): Promise<SlackFile[]> {
    try {
      const params: Record<string, any> = {
        count: fullSync ? 1000 : 100
      };
      
      if (!fullSync) {
        // For incremental sync, get recent files
        const oneWeekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
        params.ts_from = oneWeekAgo.toString();
      }

      const response = await this.makeSlackRequest<{ files: SlackFile[] }>(
        '/files.list',
        accessToken,
        params
      );

      return response.files || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Slack files');
      return [];
    }
  }

  private async fetchReactions(accessToken: string, fullSync: boolean): Promise<SlackReaction[]> {
    try {
      const messages = await this.fetchMessages(accessToken, fullSync);
      const reactions: SlackReaction[] = [];
      
      // Extract reactions from messages
      messages.forEach(message => {
        if (message.reactions) {
          reactions.push(...message.reactions);
        }
      });

      return reactions;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Slack reactions');
      return [];
    }
  }

  private async fetchThreads(accessToken: string, fullSync: boolean): Promise<SlackMessage[]> {
    try {
      const channels = await this.fetchChannels(accessToken);
      const threads: SlackMessage[] = [];
      
      // Fetch threads from each channel
      for (const channel of channels) {
        const params: Record<string, any> = {
          channel: channel.id,
          limit: fullSync ? 1000 : 100
        };
        
        if (!fullSync) {
          const oneWeekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
          params.oldest = oneWeekAgo.toString();
        }

        const response = await this.makeSlackRequest<{ messages: SlackMessage[] }>(
          '/conversations.history',
          accessToken,
          params
        );

        // Filter for messages with thread_ts (thread replies)
        const threadMessages = (response.messages || []).filter(msg => msg.thread_ts);
        threads.push(...threadMessages);
      }

      return threads;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Slack threads');
      return [];
    }
  }

  async sync(options: { userId: string; fullSync?: boolean }): Promise<SyncResult> {
    try {
      logger.info({ userId: options.userId, fullSync: options.fullSync }, 'Starting Slack sync');
      
      const result = await syncIntegration({ integration: this, ...options });
      
      // Store sync metadata
      await this.updateSyncMetadata(options.userId, {
        lastSync: new Date().toISOString(),
        syncType: options.fullSync ? 'full' : 'incremental',
        dataPoints: Object.values(result).reduce((sum: number, items: any[]) => sum + (Array.isArray(items) ? items.length: 0), 0)
      });

      logger.info({ userId: options.userId, result }, 'Slack sync completed');
      return result;
    } catch (error) {
      logger.error({ userId: options.userId, error }, 'Slack sync failed');
      throw error;
    }
  }

  private async updateSyncMetadata(userId: string, metadata: any): Promise<void> {
    try {
      await supabase
        .from('user_integrations')
        .upsert({
          userid: userId,
          integrationid: this.id,
          integrationname: this.name,
          integrationtype: this.authType,
          lastsync_at: metadata.lastSync,
          updatedat: new Date().toISOString()
        }, { onConflict: 'user_id,integration_id' });
    } catch (error) {
      logger.error({ userId, error }, 'Failed to update Slack sync metadata');
    }
  }

  async testConnection(userId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken(userId);
      // Test with auth.test endpoint
      const response = await this.makeSlackRequest<any>('/auth.test', accessToken);
      return !!response.ok;
    } catch (error) {
      logger.error({ userId, error }, 'Slack connection test failed');
      return false;
    }
  }

  async getConnectionStatus(userId: string): Promise<{
    connected: boolean;
    lastSync?: string;
    dataPoints?: number;
    error?: string;
  }> {
    try {
      const connected = await this.testConnection(userId);
      
      if (!connected) {
        return { connected: false, error: 'Not connected to Slack' };
      }

      // Get sync metadata
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('last_sync_at')
        .eq('user_id', userId)
        .eq('integration_id', this.id)
        .single();

      return {
        connected: true,
        lastSync: integration?.last_sync_at || undefined,
        dataPoints: 0 // Will be calculated from actual data
      };
    } catch (error) {
      logger.error({ userId, error }, 'Failed to get Slack connection status');
      return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Test the integration with a simple API call
   */
  async testIntegration(userId: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
  }> {
    try {
      logger.info({ userId }, 'Testing Slack integration');
      
      // Test connection
      const connected = await this.testConnection(userId);
      if (!connected) {
        return {
          success: false,
          message: 'Connection test failed',
          error: 'Unable to connect to Slack API'
        };
      }

      // Test a simple API call
      const accessToken = await this.getAccessToken(userId);
      if (!accessToken) {
        return {
          success: false,
          message: 'No valid access token',
          error: 'OAuth token not found or expired'
        };
      }

      // Test auth.test endpoint
      const authTest = await this.makeSlackRequest<any>('/auth.test', accessToken);
      
      if (!authTest.ok) {
        return {
          success: false,
          message: 'Authentication test failed',
          error: 'Insufficient permissions or API error'
        };
      }
      
      return {
        success: true,
        message: 'Slack integration is working correctly',
        data: {
          workspace: {
            name: authTest.team,
            id: authTest.team_id,
            domain: authTest.team_domain,
            user: authTest.user,
            userId: authTest.user_id
          },
          scopes: authTest.scope || [],
          lastTested: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error({ userId, error }, 'Slack integration test failed');
      return {
        success: false,
        message: 'Integration test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 