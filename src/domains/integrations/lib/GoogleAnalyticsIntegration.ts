import { BaseIntegration } from '@/domains/integrations/lib/baseIntegration';
import type { SyncResult } from '@/domains/integrations/lib/baseIntegration';
import { syncIntegration } from '@/domains/integrations/lib/syncService';
import { OAuthTokenService } from '@/domains/integrations/lib/oauthTokenService';
import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';
import type { AuthType } from './authTypes';

interface GoogleAnalyticsProperty {
  id: string;
  name: string;
  websiteUrl: string;
  currency: string;
  timezone: string;
  level: string;
}

interface GoogleAnalyticsReport {
  dateRanges: Array<{
    startDate: string;
    endDate: string;
  }>;
  metrics: string[];
  dimensions: string[];
  data: Array<{
    dimensionValues: Array<{
      value: string;
    }>;
    metricValues: Array<{
      value: string;
    }>;
  }>;
}

interface GoogleAnalyticsData {
  overview: {
    totalUsers: { name: string; value: string; trend: string };
    sessions: { name: string; value: string; trend: string };
    pageViews: { name: string; value: string; trend: string };
    bounceRate: { name: string; value: string; trend: string };
    avgSessionDuration: { name: string; value: string; trend: string };
  };
  topPages: Array<{
    path: string;
    title: string;
    views: number;
    uniqueViews: number;
  }>;
  topSources: Array<{
    source: string;
    medium: string;
    sessions: number;
    users: number;
  }>;
  realTimeUsers: number;
  conversionEvents: Array<{
    eventName: string;
    count: number;
    conversionRate: number;
  }>;
}

export class GoogleAnalyticsIntegration extends BaseIntegration {
  id = 'google-analytics';
  name = 'Google Analytics';
  dataFields = ['overview', 'pages', 'sources', 'realtime', 'conversions'];
  authType: AuthType = 'oauth';

  private async getAccessToken(userId: string): Promise<string> {
    const token = await OAuthTokenService.getTokens('google-analytics');
    if (!token?.access_token) {
      throw new Error('No valid Google Analytics access token found. Please reconnect your account.');
    }
    return token.access_token;
  }

  private async makeGoogleAnalyticsRequest<T>(endpoint: string, accessToken: string, body?: any): Promise<T> {
    const baseUrl = 'https: //analyticsdata.googleapis.com/v1beta';
    const url = `${baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ endpoint, status: response.status, error: errorText }, 'Google Analytics API request failed');
      throw new Error(`Google Analytics API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async fetchProviderData({ userId, fullSync = false }: { userId: string; fullSync?: boolean }): Promise<Record<string, any[]>> {
    try {
      logger.info({ userId, fullSync }, 'Starting Google Analytics data fetch');
      
      const accessToken = await this.getAccessToken(userId);
      
      // Get user's configured property ID
      const propertyId = await this.getUserPropertyId(userId);
      if (!propertyId) {
        throw new Error('No Google Analytics property configured. Please complete setup first.');
      }

      // Fetch data in parallel for better performance
      const [
        overview,
        topPages,
        topSources,
        realTime,
        conversions
      ] = await Promise.all([
        this.fetchOverviewData(accessToken, propertyId, fullSync),
        this.fetchTopPages(accessToken, propertyId, fullSync),
        this.fetchTopSources(accessToken, propertyId, fullSync),
        this.fetchRealTimeData(accessToken, propertyId),
        this.fetchConversionEvents(accessToken, propertyId, fullSync)
      ]);

      const result = {
        overview,
        topPages,
        topSources,
        realTime,
        conversions
      };

      logger.info({ 
        userId, 
        overviewCount: overview.length,
        topPagesCount: topPages.length,
        topSourcesCount: topSources.length,
        realTimeCount: realTime.length,
        conversionsCount: conversions.length
      }, 'Google Analytics data fetch completed');

      return result;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch Google Analytics data');
      throw error;
    }
  }

  private async getUserPropertyId(userId: string): Promise<string | null> {
    try {
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('config')
        .eq('user_id', userId)
        .eq('integration_id', this.id)
        .eq('status', 'active')
        .single();

      return integration?.config?.propertyId || null;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to get user property ID');
      return null;
    }
  }

  private async fetchOverviewData(accessToken: string, propertyId: string, fullSync: boolean): Promise<any[]> {
    try {
      const endDate = new Date();
      const startDate = fullSync 
        ? new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)) // 30 days ago for full sync: new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago for incremental

      const requestBody = {
        property: `properties/${propertyId}`,
        dateRanges: [{
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' }
        ]
      };

      const response = await this.makeGoogleAnalyticsRequest<GoogleAnalyticsReport>(
        '/properties/' + propertyId + ':runReport',
        accessToken,
        requestBody
      );

      if (response.data && response.data.length > 0) {
        const row = response.data[0];
        return [{
          totalUsers: parseInt(row.metricValues[0]?.value || '0'),
          sessions: parseInt(row.metricValues[1]?.value || '0'),
          pageViews: parseInt(row.metricValues[2]?.value || '0'),
          bounceRate: parseFloat(row.metricValues[3]?.value || '0'),
          avgSessionDuration: parseFloat(row.metricValues[4]?.value || '0'),
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        }];
      }

      return [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Google Analytics overview data');
      return [];
    }
  }

  private async fetchTopPages(accessToken: string, propertyId: string, fullSync: boolean): Promise<any[]> {
    try {
      const endDate = new Date();
      const startDate = fullSync 
        ? new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)) // 30 days ago for full sync: new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago for incremental

      const requestBody = {
        property: `properties/${propertyId}`,
        dateRanges: [{
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'totalUsers' }
        ],
        limit: 10
      };

      const response = await this.makeGoogleAnalyticsRequest<GoogleAnalyticsReport>(
        '/properties/' + propertyId + ':runReport',
        accessToken,
        requestBody
      );

      return (response.data || []).map(row => ({
        path: row.dimensionValues[0]?.value || '',
        views: parseInt(row.metricValues[0]?.value || '0'),
        uniqueViews: parseInt(row.metricValues[1]?.value || '0')
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Google Analytics top pages');
      return [];
    }
  }

  private async fetchTopSources(accessToken: string, propertyId: string, fullSync: boolean): Promise<any[]> {
    try {
      const endDate = new Date();
      const startDate = fullSync 
        ? new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)) // 30 days ago for full sync: new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago for incremental

      const requestBody = {
        property: `properties/${propertyId}`,
        dateRanges: [{
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }],
        dimensions: [
          { name: 'source' },
          { name: 'medium' }
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' }
        ],
        limit: 10
      };

      const response = await this.makeGoogleAnalyticsRequest<GoogleAnalyticsReport>(
        '/properties/' + propertyId + ':runReport',
        accessToken,
        requestBody
      );

      return (response.data || []).map(row => ({
        source: row.dimensionValues[0]?.value || '',
        medium: row.dimensionValues[1]?.value || '',
        sessions: parseInt(row.metricValues[0]?.value || '0'),
        users: parseInt(row.metricValues[1]?.value || '0')
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Google Analytics top sources');
      return [];
    }
  }

  private async fetchRealTimeData(accessToken: string, propertyId: string): Promise<any[]> {
    try {
      const requestBody = {
        property: `properties/${propertyId}`,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'activeUsers' }],
        limit: 10
      };

      const response = await this.makeGoogleAnalyticsRequest<any>(
        '/properties/' + propertyId + ':runRealtimeReport',
        accessToken,
        requestBody
      );

      return [{
        totalActiveUsers: response.data?.reduce((sum: number, row: any) => 
          sum + parseInt(row.metricValues[0]?.value || '0'), 0) || 0,
        topPages: (response.data || []).map((row: any) => ({
          path: row.dimensionValues[0]?.value || '',
          activeUsers: parseInt(row.metricValues[0]?.value || '0')
        }))
      }];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Google Analytics real-time data');
      return [];
    }
  }

  private async fetchConversionEvents(accessToken: string, propertyId: string, fullSync: boolean): Promise<any[]> {
    try {
      const endDate = new Date();
      const startDate = fullSync 
        ? new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)) // 30 days ago for full sync: new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago for incremental

      const requestBody = {
        property: `properties/${propertyId}`,
        dateRanges: [{
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }],
        dimensions: [{ name: 'eventName' }],
        metrics: [
          { name: 'eventCount' },
          { name: 'eventValue' }
        ],
        limit: 10
      };

      const response = await this.makeGoogleAnalyticsRequest<GoogleAnalyticsReport>(
        '/properties/' + propertyId + ':runReport',
        accessToken,
        requestBody
      );

      return (response.data || []).map(row => ({
        eventName: row.dimensionValues[0]?.value || '',
        count: parseInt(row.metricValues[0]?.value || '0'),
        value: parseFloat(row.metricValues[1]?.value || '0')
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Google Analytics conversion events');
      return [];
    }
  }

  async sync(options: { userId: string; fullSync?: boolean }): Promise<SyncResult> {
    try {
      logger.info({ userId: options.userId, fullSync: options.fullSync }, 'Starting Google Analytics sync');
      
      const result = await syncIntegration({ integration: this, ...options });
      
      // Store sync metadata
      await this.updateSyncMetadata(options.userId, {
        lastSync: new Date().toISOString(),
        syncType: options.fullSync ? 'full' : 'incremental',
        dataPoints: Object.values(result).reduce((sum: number, items: any[]) => sum + (Array.isArray(items) ? items.length: 0), 0)
      });

      logger.info({ userId: options.userId, result }, 'Google Analytics sync completed');
      return result;
    } catch (error) {
      logger.error({ userId: options.userId, error }, 'Google Analytics sync failed');
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
          integrationtype: 'oauth',
          lastsync_at: metadata.lastSync,
          updatedat: new Date().toISOString()
        }, { onConflict: 'user_id,integration_id' });
    } catch (error) {
      logger.error({ userId, error }, 'Failed to update Google Analytics sync metadata');
    }
  }

  async testConnection(userId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken(userId);
      const propertyId = await this.getUserPropertyId(userId);
      
      if (!propertyId) {
        return false;
      }

      // Test with a simple API call to get property info
      const response = await this.makeGoogleAnalyticsRequest<any>(`/properties/${propertyId}`, accessToken);
      return !!response.name;
    } catch (error) {
      logger.error({ userId, error }, 'Google Analytics connection test failed');
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
        return { connected: false, error: 'Not connected to Google Analytics' };
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
      logger.error({ userId, error }, 'Failed to get Google Analytics connection status');
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
      logger.info({ userId }, 'Testing Google Analytics integration');
      
      // Test connection
      const connected = await this.testConnection(userId);
      if (!connected) {
        return {
          success: false,
          message: 'Connection test failed',
          error: 'Unable to connect to Google Analytics API'
        };
      }

      // Test a simple API call
      const accessToken = await this.getAccessToken(userId);
      const propertyId = await this.getUserPropertyId(userId);
      
      if (!accessToken || !propertyId) {
        return {
          success: false,
          message: 'No valid access token or property ID',
          error: 'OAuth token not found or property not configured'
        };
      }

      // Test property info endpoint
      const propertyInfo = await this.makeGoogleAnalyticsRequest<any>(`/properties/${propertyId}`, accessToken);
      
      if (!propertyInfo.name) {
        return {
          success: false,
          message: 'Property info not accessible',
          error: 'Insufficient permissions or API error'
        };
      }
      
      return {
        success: true,
        message: 'Google Analytics integration is working correctly',
        data: {
          property: {
            id: propertyInfo.name,
            name: propertyInfo.displayName,
            websiteUrl: propertyInfo.websiteUri,
            currency: propertyInfo.currencyCode,
            timezone: propertyInfo.timeZone
          },
          scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
          lastTested: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error({ userId, error }, 'Google Analytics integration test failed');
      return {
        success: false,
        message: 'Integration test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 