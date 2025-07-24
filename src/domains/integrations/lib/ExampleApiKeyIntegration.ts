import { BaseIntegration } from '@/domains/integrations/lib/baseIntegration';
import type { SyncResult } from '@/domains/integrations/lib/baseIntegration';
import { syncIntegration } from '@/domains/integrations/lib/syncService';
import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';
import type { AuthType } from './authTypes';

interface ExampleData {
  id: string;
  name: string;
  status: string;
  createdat: string;
  updatedat: string;
}

export class ExampleApiKeyIntegration extends BaseIntegration {
  id = 'example-api-key';
  name = 'Example API Key Integration';
  dataFields = ['items', 'metrics', 'reports'];
  authType: AuthType = 'api_key';

  private async getAccessToken(userId: string): Promise<string> {
    // For API key integrations, we get the API key from credentials
    const credentials = await this.getCredentials(_userId);
    if (!credentials || credentials.type !== 'api_key') {
      throw new Error('No valid API key found. Please reconnect your account.');
    }
    return credentials.api_key;
  }

  private async makeApiRequest<T>(endpoint: string, apiKey: string, params?: Record<string, any>): Promise<T> {
    const baseUrl = 'https: //api.example.com';
    const url = new URL(`${baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': apiKey, // API key in header
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ endpoint, status: response.status, error: errorText }, 'API request failed');
      throw new Error(`API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async fetchProviderData({ userId, fullSync = false }: { userId: string; fullSync?: boolean }): Promise<Record<string, any[]>> {
    try {
      logger.info({ userId, fullSync }, 'Starting API key integration data fetch');
      
      const apiKey = await this.getAccessToken(userId);
      
      // Fetch data in parallel for better performance
      const [items, metrics, reports] = await Promise.all([
        this.fetchItems(apiKey, fullSync),
        this.fetchMetrics(apiKey, fullSync),
        this.fetchReports(apiKey, fullSync)
      ]);

      const result = {
        items,
        metrics,
        reports
      };

      logger.info({ 
        userId, 
        itemCount: items.length,
        metricCount: metrics.length,
        reportCount: reports.length
      }, 'API key integration data fetch completed');

      return result;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch API key integration data');
      throw error;
    }
  }

  private async fetchItems(apiKey: string, fullSync: boolean): Promise<ExampleData[]> {
    try {
      const params: Record<string, any> = {
        limit: fullSync ? 100 : 50
      };
      
      if (!fullSync) {
        // For incremental sync, get recent items
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.updated_after = oneWeekAgo.toISOString();
      }

      const response = await this.makeApiRequest<{ data: ExampleData[] }>(
        '/v1/items',
        apiKey,
        params
      );

      return response.data || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch items');
      return [];
    }
  }

  private async fetchMetrics(apiKey: string, fullSync: boolean): Promise<ExampleData[]> {
    try {
      const params: Record<string, any> = {
        limit: fullSync ? 100 : 50
      };
      
      if (!fullSync) {
        // For incremental sync, get recent metrics
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.updated_after = oneWeekAgo.toISOString();
      }

      const response = await this.makeApiRequest<{ data: ExampleData[] }>(
        '/v1/metrics',
        apiKey,
        params
      );

      return response.data || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch metrics');
      return [];
    }
  }

  private async fetchReports(apiKey: string, fullSync: boolean): Promise<ExampleData[]> {
    try {
      const params: Record<string, any> = {
        limit: fullSync ? 100 : 50
      };
      
      if (!fullSync) {
        // For incremental sync, get recent reports
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.updated_after = oneWeekAgo.toISOString();
      }

      const response = await this.makeApiRequest<{ data: ExampleData[] }>(
        '/v1/reports',
        apiKey,
        params
      );

      return response.data || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch reports');
      return [];
    }
  }

  async sync(options: { userId: string; fullSync?: boolean }): Promise<SyncResult> {
    try {
      logger.info({ userId: options.userId, fullSync: options.fullSync }, 'Starting API key integration sync');
      
      const result = await syncIntegration({ integration: this, ...options });
      
      // Store sync metadata
      await this.updateSyncMetadata(options.userId, {
        lastSync: new Date().toISOString(),
        syncType: options.fullSync ? 'full' : 'incremental',
        dataPoints: Object.values(result).reduce((sum: number, items: any[]) => sum + (Array.isArray(items) ? items.length: 0), 0)
      });

      logger.info({ userId: options.userId, result }, 'API key integration sync completed');
      return result;
    } catch (error) {
      logger.error({ userId: options.userId, error }, 'API key integration sync failed');
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
      logger.error({ userId, error }, 'Failed to update API key integration sync metadata');
    }
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKeyConnection(userId: string): Promise<boolean> {
    try {
      const apiKey = await this.getAccessToken(userId);
      
      // Make a test request to validate the API key
      const response = await this.makeApiRequest<any>(
        '/v1/health', // Health check endpoint
        apiKey
      );
      
      return !!response.status;
    } catch (error) {
      logger.error({ userId, error }, 'API key validation failed');
      return false;
    }
  }

  /**
   * Override testConnection for API key specific validation
   */
  protected async testConnection(userId: string): Promise<boolean> {
    return await this.validateApiKeyConnection(userId);
  }
} 