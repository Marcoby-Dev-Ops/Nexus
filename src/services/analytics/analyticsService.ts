import { z } from 'zod';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface, ServiceConfig } from '@/core/services/interfaces';
import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';

// Analytics Schemas
export const AnalyticsEventSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  company_id: z.string().optional(),
  event_type: z.string(),
  event_data: z.record(z.any()).optional(),
  timestamp: z.string().optional(),
  session_id: z.string().optional(),
  page_url: z.string().optional(),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
});

export const AnalyticsMetricsSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  company_id: z.string().optional(),
  metric_type: z.string(),
  metric_value: z.number(),
  metric_unit: z.string().optional(),
  timestamp: z.string().optional(),
  period: z.string().optional(), // daily, weekly, monthly
});

export const AnalyticsInsightSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  company_id: z.string().optional(),
  insight_type: z.string(),
  insight_data: z.record(z.any()),
  confidence_score: z.number().min(0).max(1).optional(),
  created_at: z.string().optional(),
  expires_at: z.string().optional(),
});

export const AnalyticsDashboardSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  company_id: z.string().optional(),
  dashboard_name: z.string(),
  dashboard_config: z.record(z.any()),
  is_default: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type AnalyticsMetrics = z.infer<typeof AnalyticsMetricsSchema>;
export type AnalyticsInsight = z.infer<typeof AnalyticsInsightSchema>;
export type AnalyticsDashboard = z.infer<typeof AnalyticsDashboardSchema>;

// Google Analytics Schemas
export const GoogleAnalyticsConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
});

export const GoogleAnalyticsPropertySchema = z.object({
  id: z.string(),
  name: z.string(),
  accountId: z.string(),
});

export const GoogleAnalyticsReportSchema = z.object({
  rows: z.array(z.record(z.string())),
  columnHeaders: z.array(z.object({
    name: z.string(),
    dataType: z.string(),
  })),
  totalsForAllResults: z.record(z.string()),
});

export const GoogleWorkspaceConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
});

export const GoogleWorkspaceUsageSchema = z.object({
  gmail: z.object({
    messagesSent: z.number(),
    storageUsed: z.number(),
    lastSync: z.string(),
  }),
  drive: z.object({
    filesCreated: z.number(),
    storageUsed: z.number(),
    lastSync: z.string(),
  }),
  calendar: z.object({
    eventsCreated: z.number(),
    meetingsScheduled: z.number(),
    lastSync: z.string(),
  }),
});

export type GoogleAnalyticsConfig = z.infer<typeof GoogleAnalyticsConfigSchema>;
export type GoogleAnalyticsProperty = z.infer<typeof GoogleAnalyticsPropertySchema>;
export type GoogleAnalyticsReport = z.infer<typeof GoogleAnalyticsReportSchema>;
export type GoogleWorkspaceConfig = z.infer<typeof GoogleWorkspaceConfigSchema>;
export type GoogleWorkspaceUsage = z.infer<typeof GoogleWorkspaceUsageSchema>;

// Service Configuration
const analyticsServiceConfig: ServiceConfig = {
  tableName: 'analytics_events', // Default table, will be overridden per operation
  schema: AnalyticsEventSchema,
  cacheEnabled: true,
  cacheTTL: 300, // 5 minutes
  enableLogging: true,
};

/**
 * AnalyticsService - Handles all analytics-related operations
 * 
 * Features:
 * - Event tracking and management
 * - Metrics calculation and aggregation
 * - Insights generation
 * - Dashboard management
 * - Real-time analytics
 * - Performance monitoring
 * - Google Analytics integration
 * - Google Workspace integration
 */
export class AnalyticsService extends BaseService implements CrudServiceInterface<AnalyticsEvent> {
  protected config = analyticsServiceConfig;

  private googleAnalyticsConfig: GoogleAnalyticsConfig = {
    clientId: import.meta.env.VITE_GOOGLE_ANALYTICS_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_GOOGLE_ANALYTICS_CLIENT_SECRET || '',
    redirectUri: `${window.location.origin}/analytics/google/callback`
  };

  private googleWorkspaceConfig: GoogleWorkspaceConfig = {
    clientId: import.meta.env.VITE_GOOGLE_WORKSPACE_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_GOOGLE_WORKSPACE_CLIENT_SECRET || '',
    redirectUri: `${window.location.origin}/integrations/google-workspace/callback`
  };

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  // Event Management
  async trackEvent(event: Partial<AnalyticsEvent>) {
    this.logMethodCall('trackEvent', { event });
    
    const validatedEvent = AnalyticsEventSchema.parse({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });

    return this.create(validatedEvent);
  }

  async getEvents(filters?: Record<string, any>) {
    return this.list(filters);
  }

  async getEventById(eventId: string) {
    return this.get(eventId);
  }

  // Metrics Management
  async createMetric(metric: Partial<AnalyticsMetrics>) {
    this.logMethodCall('createMetric', { metric });
    
    const validatedMetric = AnalyticsMetricsSchema.parse({
      ...metric,
      timestamp: metric.timestamp || new Date().toISOString(),
    });

    return this.create(validatedMetric);
  }

  async getMetrics(filters?: Record<string, any>) {
    return this.list(filters);
  }

  async aggregateMetrics(metricType: string, period: string, filters?: Record<string, any>) {
    this.logMethodCall('aggregateMetrics', { metricType, period, filters });
    
    try {
      const { data, error } = await this.supabase
        .from('analytics_metrics')
        .select('*')
        .eq('metric_type', metricType)
        .eq('period', period)
        .match(filters || {});

      if (error) throw error;

      const aggregated = data?.reduce((acc, metric) => {
        return acc + (metric.metric_value || 0);
      }, 0) || 0;

      return {
        data: { aggregated, count: data?.length || 0 },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('aggregateMetrics', error);
    }
  }

  // Insights Management
  async createInsight(insight: Partial<AnalyticsInsight>) {
    this.logMethodCall('createInsight', { insight });
    
    const validatedInsight = AnalyticsInsightSchema.parse({
      ...insight,
      created_at: insight.created_at || new Date().toISOString(),
    });

    return this.create(validatedInsight);
  }

  async getInsights(filters?: Record<string, any>) {
    return this.list(filters);
  }

  async generateInsights(userId: string, data: any) {
    this.logMethodCall('generateInsights', { userId });
    
    try {
      // AI-powered insights generation
      const insights = await this.generateAIInsights(data);
      
      const insightPromises = insights.map(insight => 
        this.createInsight({
          user_id: userId,
          insight_type: insight.type,
          insight_data: insight.data,
          confidence_score: insight.confidence,
        })
      );

      const results = await Promise.all(insightPromises);
      
      return {
        data: results.map(r => r.data).filter(Boolean),
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('generateInsights', error);
    }
  }

  // Dashboard Management
  async createDashboard(dashboard: Partial<AnalyticsDashboard>) {
    this.logMethodCall('createDashboard', { dashboard });
    
    const validatedDashboard = AnalyticsDashboardSchema.parse({
      ...dashboard,
      created_at: dashboard.created_at || new Date().toISOString(),
      updated_at: dashboard.updated_at || new Date().toISOString(),
    });

    return this.create(validatedDashboard);
  }

  async getDashboards(userId: string) {
    return this.list({ user_id: userId });
  }

  async updateDashboard(dashboardId: string, updates: Partial<AnalyticsDashboard>) {
    return this.update(dashboardId, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }

  // Real-time Analytics
  async getRealTimeMetrics(userId: string) {
    this.logMethodCall('getRealTimeMetrics', { userId });
    
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const { data, error } = await this.supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', fiveMinutesAgo.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const metrics = {
        eventsLast5Minutes: data?.length || 0,
        uniqueEvents: new Set(data?.map(e => e.event_type)).size,
        topEvents: this.getTopEvents(data || []),
        sessionCount: this.getSessionCount(data || []),
      };

      return {
        data: metrics,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('getRealTimeMetrics', error);
    }
  }

  // Performance Monitoring
  async trackPerformance(performanceData: {
    userId: string;
    pageLoadTime: number;
    apiResponseTime: number;
    memoryUsage: number;
    errors: any[];
  }) {
    this.logMethodCall('trackPerformance', { performanceData });
    
    const event = {
      user_id: performanceData.userId,
      event_type: 'performance_metrics',
      event_data: {
        pageLoadTime: performanceData.pageLoadTime,
        apiResponseTime: performanceData.apiResponseTime,
        memoryUsage: performanceData.memoryUsage,
        errors: performanceData.errors,
      },
      timestamp: new Date().toISOString(),
    };

    return this.trackEvent(event);
  }

  // Business Intelligence
  async getBusinessMetrics(userId: string, companyId?: string) {
    this.logMethodCall('getBusinessMetrics', { userId, companyId });
    
    try {
      const filters = { user_id: userId };
      if (companyId) filters.company_id = companyId;

      const [events, metrics, insights] = await Promise.all([
        this.getEvents(filters),
        this.getMetrics(filters),
        this.getInsights(filters),
      ]);

      const businessMetrics = {
        totalEvents: events.data?.length || 0,
        totalMetrics: metrics.data?.length || 0,
        totalInsights: insights.data?.length || 0,
        topPerformingFeatures: this.getTopPerformingFeatures(events.data || []),
        userEngagement: this.calculateUserEngagement(events.data || []),
        conversionRates: this.calculateConversionRates(events.data || []),
      };

      return {
        data: businessMetrics,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('getBusinessMetrics', error);
    }
  }

  // Google Analytics Integration
  async connectGoogleAnalytics(userId: string): Promise<{ authUrl: string }> {
    this.logMethodCall('connectGoogleAnalytics', { userId });
    
    try {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${this.googleAnalyticsConfig.clientId}&` +
        `redirect_uri=${encodeURIComponent(this.googleAnalyticsConfig.redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/analytics.readonly')}&` +
        `state=${userId}`;

      return { authUrl };
    } catch (error) {
      return this.handleError('connectGoogleAnalytics', error);
    }
  }

  async handleGoogleAnalyticsCallback(code: string, state: string): Promise<{ success: boolean }> {
    this.logMethodCall('handleGoogleAnalyticsCallback', { code: code.substring(0, 10), state });
    
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: this.googleAnalyticsConfig.clientId,
          client_secret: this.googleAnalyticsConfig.clientSecret,
          redirect_uri: this.googleAnalyticsConfig.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (tokens.error) {
        throw new Error(`Token exchange failed: ${tokens.error}`);
      }

      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
      this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);

      // Store tokens in database
      await this.storeGoogleTokens(state, tokens);

      return { success: true };
    } catch (error) {
      return this.handleError('handleGoogleAnalyticsCallback', error);
    }
  }

  async fetchGA4Metrics(params: {
    startDate: string;
    endDate: string;
    metrics: string[];
    dimensions?: string[];
    filters?: string;
    sort?: string;
    maxResults?: number;
  }): Promise<GoogleAnalyticsReport> {
    this.logMethodCall('fetchGA4Metrics', { params });
    
    try {
      await this.ensureValidToken();

      const activeProperty = await this.getActiveProperty();
      if (!activeProperty) {
        throw new Error('No active property selected');
      }

      const requestParams: Record<string, string> = {
        ids: `ga:${activeProperty}`,
        'start-date': params.startDate,
        'end-date': params.endDate,
        metrics: params.metrics.join(','),
      };

      if (params.dimensions) {
        requestParams.dimensions = params.dimensions.join(',');
      }

      if (params.filters) {
        requestParams.filters = params.filters;
      }

      if (params.sort) {
        requestParams.sort = params.sort;
      }

      if (params.maxResults) {
        requestParams['max-results'] = params.maxResults.toString();
      }

      const response = await fetch(`https://www.googleapis.com/analytics/v3/data/ga?${new URLSearchParams(requestParams)}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`GA API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        rows: data.rows || [],
        columnHeaders: data.columnHeaders || [],
        totalsForAllResults: data.totalsForAllResults || {},
      };
    } catch (error) {
      return this.handleError('fetchGA4Metrics', error);
    }
  }

  async getGoogleAnalyticsOverview(): Promise<{
    sessions: number;
    users: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
  }> {
    this.logMethodCall('getGoogleAnalyticsOverview');
    
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const report = await this.fetchGA4Metrics({
        startDate,
        endDate,
        metrics: ['ga:sessions', 'ga:users', 'ga:pageviews', 'ga:bounceRate', 'ga:avgSessionDuration'],
      });

      const rows = report.rows?.[0] || [];
      
      return {
        sessions: parseInt(rows[0] || '0'),
        users: parseInt(rows[1] || '0'),
        pageViews: parseInt(rows[2] || '0'),
        bounceRate: parseFloat(rows[3] || '0'),
        avgSessionDuration: parseFloat(rows[4] || '0'),
      };
    } catch (error) {
      logger.error('Error getting GA overview:', error);
      return {
        sessions: 0,
        users: 0,
        pageViews: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
      };
    }
  }

  // Google Workspace Integration
  async connectGoogleWorkspace(userId: string): Promise<{ authUrl: string }> {
    this.logMethodCall('connectGoogleWorkspace', { userId });
    
    try {
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/calendar.readonly',
      ].join(' ');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${this.googleWorkspaceConfig.clientId}&` +
        `redirect_uri=${encodeURIComponent(this.googleWorkspaceConfig.redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${userId}`;

      return { authUrl };
    } catch (error) {
      return this.handleError('connectGoogleWorkspace', error);
    }
  }

  async handleGoogleWorkspaceCallback(code: string, state: string): Promise<{ success: boolean }> {
    this.logMethodCall('handleGoogleWorkspaceCallback', { code: code.substring(0, 10), state });
    
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: this.googleWorkspaceConfig.clientId,
          client_secret: this.googleWorkspaceConfig.clientSecret,
          redirect_uri: this.googleWorkspaceConfig.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (tokens.error) {
        throw new Error(`Token exchange failed: ${tokens.error}`);
      }

      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
      this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);

      // Store tokens in database
      await this.storeGoogleTokens(state, tokens);

      return { success: true };
    } catch (error) {
      return this.handleError('handleGoogleWorkspaceCallback', error);
    }
  }

  async getWorkspaceUsage(): Promise<GoogleWorkspaceUsage> {
    this.logMethodCall('getWorkspaceUsage');
    
    try {
      await this.ensureValidToken();

      const [gmailUsage, driveUsage, calendarUsage] = await Promise.all([
        this.getGmailUsage(),
        this.getDriveUsage(),
        this.getCalendarUsage(),
      ]);

      return {
        gmail: gmailUsage,
        drive: driveUsage,
        calendar: calendarUsage,
      };
    } catch (error) {
      logger.error('Error getting workspace usage:', error);
      return {
        gmail: {
          messagesSent: 0,
          storageUsed: 0,
          lastSync: new Date().toISOString(),
        },
        drive: {
          filesCreated: 0,
          storageUsed: 0,
          lastSync: new Date().toISOString(),
        },
        calendar: {
          eventsCreated: 0,
          meetingsScheduled: 0,
          lastSync: new Date().toISOString(),
        },
      };
    }
  }

  // Private helper methods
  private async generateAIInsights(data: any): Promise<any[]> {
    // This would integrate with AI service for insights generation
    // For now, return mock insights
    return [
      {
        type: 'usage_trend',
        data: { trend: 'increasing', confidence: 0.85 },
        confidence: 0.85,
      },
      {
        type: 'performance_optimization',
        data: { recommendation: 'Optimize API calls', impact: 'high' },
        confidence: 0.92,
      },
    ];
  }

  private getTopEvents(events: AnalyticsEvent[]): Record<string, number> {
    const eventCounts: Record<string, number> = {};
    events.forEach(event => {
      eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
    });
    return eventCounts;
  }

  private getSessionCount(events: AnalyticsEvent[]): number {
    const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean));
    return uniqueSessions.size;
  }

  private getTopPerformingFeatures(events: AnalyticsEvent[]): any[] {
    const featureUsage = events
      .filter(e => e.event_type.startsWith('feature_'))
      .reduce((acc, event) => {
        const feature = event.event_type.replace('feature_', '');
        acc[feature] = (acc[feature] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(featureUsage)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculateUserEngagement(events: AnalyticsEvent[]): number {
    const uniqueDays = new Set(events.map(e => 
      new Date(e.timestamp || '').toDateString()
    )).size;
    return uniqueDays;
  }

  private calculateConversionRates(events: AnalyticsEvent[]): Record<string, number> {
    const conversions = events.filter(e => e.event_type.includes('conversion')).length;
    const total = events.length;
    return {
      overall: total > 0 ? (conversions / total) * 100 : 0,
      conversions,
      total,
    };
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      if (this.refreshToken) {
        await this.refreshAccessToken();
      } else {
        throw new Error('No valid access token available');
      }
    }
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: this.refreshToken!,
          client_id: this.googleAnalyticsConfig.clientId,
          client_secret: this.googleAnalyticsConfig.clientSecret,
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await response.json();
      
      if (tokens.error) {
        throw new Error(`Token refresh failed: ${tokens.error}`);
      }

      this.accessToken = tokens.access_token;
      this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw error;
    }
  }

  private async getActiveProperty(): Promise<string | null> {
    const stored = localStorage.getItem('google_analytics_active_property');
    if (stored) {
      return stored;
    }

    try {
      const response = await fetch('https://www.googleapis.com/analytics/v3/management/accounts/~all/webproperties', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.statusText}`);
      }

      const data = await response.json();
      const firstProperty = data.items?.[0];
      
      if (firstProperty) {
        localStorage.setItem('google_analytics_active_property', firstProperty.id);
        return firstProperty.id;
      }
    } catch (error) {
      logger.error('Error getting active property:', error);
    }

    return null;
  }

  private async storeGoogleTokens(userId: string, tokens: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_integrations')
        .upsert({
          user_id: userId,
          platform: 'google_analytics',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        logger.error('Error storing Google tokens:', error);
      }
    } catch (error) {
      logger.error('Error storing Google tokens:', error);
    }
  }

  private async getGmailUsage(): Promise<{
    messagesSent: number;
    storageUsed: number;
    lastSync: string;
  }> {
    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Gmail API request failed: ${response.statusText}`);
      }

      const profile = await response.json();
      
      return {
        messagesSent: profile.messagesTotal || 0,
        storageUsed: profile.historyId || 0,
        lastSync: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting Gmail usage:', error);
      return {
        messagesSent: 0,
        storageUsed: 0,
        lastSync: new Date().toISOString(),
      };
    }
  }

  private async getDriveUsage(): Promise<{
    filesCreated: number;
    storageUsed: number;
    lastSync: string;
  }> {
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Drive API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        filesCreated: 0, // Would need additional API call to get file count
        storageUsed: data.storageQuota?.usage || 0,
        lastSync: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting Drive usage:', error);
      return {
        filesCreated: 0,
        storageUsed: 0,
        lastSync: new Date().toISOString(),
      };
    }
  }

  private async getCalendarUsage(): Promise<{
    eventsCreated: number;
    meetingsScheduled: number;
    lastSync: string;
  }> {
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Calendar API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        eventsCreated: data.items?.length || 0,
        meetingsScheduled: data.items?.length || 0,
        lastSync: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting Calendar usage:', error);
      return {
        eventsCreated: 0,
        meetingsScheduled: 0,
        lastSync: new Date().toISOString(),
      };
    }
  }

  // CRUD Methods required by CrudServiceInterface
  async get(id: string): Promise<ServiceResponse<AnalyticsEvent>> {
    this.logMethodCall('get', { id });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const validatedData = this.config.schema.parse(data);
      return { data: validatedData, error: null };
    }, `get analytics event ${id}`);
  }

  async create(data: Partial<AnalyticsEvent>): Promise<ServiceResponse<AnalyticsEvent>> {
    this.logMethodCall('create', { data });
    
    return this.executeDbOperation(async () => {
      const { data: result, error } = await supabase
        .from('analytics_events')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `create analytics event`);
  }

  async update(id: string, data: Partial<AnalyticsEvent>): Promise<ServiceResponse<AnalyticsEvent>> {
    this.logMethodCall('update', { id, data });
    
    return this.executeDbOperation(async () => {
      const { data: result, error } = await supabase
        .from('analytics_events')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `update analytics event ${id}`);
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('delete', { id });
    
    return this.executeDbOperation(async () => {
      const { error } = await supabase
        .from('analytics_events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { data: true, error: null };
    }, `delete analytics event ${id}`);
  }

  async list(filters?: Record<string, any>): Promise<ServiceResponse<AnalyticsEvent[]>> {
    this.logMethodCall('list', { filters });
    
    return this.executeDbOperation(async () => {
      let query = supabase
        .from('analytics_events')
        .select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const validatedData = data.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `list analytics events`);
  }

  // Fire Cycle Analytics Methods
  async getFireCycleMetrics(userId: string, filters?: any) {
    this.logMethodCall('getFireCycleMetrics', { userId, filters });
    
    try {
      // Mock data for now - replace with actual Fire Cycle metrics
      const mockMetrics = {
        totalCycles: 24,
        activeCycles: 3,
        completedCycles: 21,
        averageCycleDuration: 14.5,
        successRate: 87.5,
        topPerformingAreas: [
          'Customer Acquisition',
          'Product Development',
          'Team Collaboration'
        ],
        areasForImprovement: [
          'Marketing ROI',
          'Sales Conversion',
          'Customer Retention'
        ]
      };

      return {
        data: mockMetrics,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('getFireCycleMetrics', error);
    }
  }

  // Integration Analytics Methods
  async getIntegrationAnalytics(userId: string, filters?: any) {
    this.logMethodCall('getIntegrationAnalytics', { userId, filters });
    
    try {
      // Get integration data from database
      const { data: integrations, error } = await supabase
        .from('user_integrations')
        .select(`
          id,
          name,
          status,
          last_sync_at,
          total_syncs,
          error_message,
          integrations (
            name,
            auth_type,
            category
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const activeIntegrations = integrations?.filter(i => i.status === 'active') || [];
      const totalDataPoints = activeIntegrations.reduce((sum, integration) => {
        return sum + (integration.total_syncs || 0);
      }, 0);

      const mockAnalytics = {
        totalIntegrations: integrations?.length || 0,
        activeIntegrations: activeIntegrations.length,
        totalDataPoints,
        lastSync: integrations?.[0]?.last_sync_at || null,
        avgSyncDuration: 2.5, // Mock value
        syncSuccessRate: 92.5, // Mock value
        topIntegrations: activeIntegrations.slice(0, 5).map(integration => ({
          name: integration.name,
          dataPoints: integration.total_syncs || 0,
          lastSync: integration.last_sync_at || 'Never',
          status: integration.status
        }))
      };

      return {
        data: mockAnalytics,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('getIntegrationAnalytics', error);
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService(); 
