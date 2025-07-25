/**
 * Google Analytics Service
 * Provides OAuth and API functionality for Google Analytics integration
 */

export interface GoogleAnalyticsConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleAnalyticsProperty {
  id: string;
  name: string;
  accountId: string;
  accountName: string;
  websiteUrl?: string;
  level: 'STANDARD' | 'PREMIUM';
}

export interface GoogleAnalyticsReport {
  rows: Array<Array<string>>;
  columnHeaders: Array<{
    name: string;
    columnType: string;
    dataType: string;
  }>;
  totalsForAllResults: Record<string, string>;
}

export class GoogleAnalyticsService {
  private config: GoogleAnalyticsConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config?: Partial<GoogleAnalyticsConfig>) {
    this.config = {
      clientId: config?.clientId || import.meta.env.VITE_GOOGLE_ANALYTICS_CLIENT_ID || '',
      clientSecret: config?.clientSecret || import.meta.env.VITE_GOOGLE_ANALYTICS_CLIENT_SECRET || '',
      redirectUri: config?.redirectUri || `${window.location.origin}/analytics/google/callback`
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.accessToken && Date.now() < this.tokenExpiry);
  }

  /**
   * Initialize OAuth flow
   */
  async initializeOAuth(): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/analytics.edit'
    ];

    const state = btoa(JSON.stringify({
      timestamp: Date.now(),
      service: 'google-analytics'
    }));

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<void> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`Google OAuth failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    // Store tokens securely
    this.storeTokens();
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    // Update stored tokens
    this.storeTokens();
  }

  /**
   * Store tokens securely
   */
  private storeTokens(): void {
    if (this.accessToken && this.refreshToken) {
      localStorage.setItem('google_analytics_access_token', this.accessToken);
      localStorage.setItem('google_analytics_refresh_token', this.refreshToken);
      localStorage.setItem('google_analytics_token_expiry', this.tokenExpiry.toString());
    }
  }

  /**
   * Load tokens from storage
   */
  private loadTokens(): void {
    const accessToken = localStorage.getItem('google_analytics_access_token');
    const refreshToken = localStorage.getItem('google_analytics_refresh_token');
    const tokenExpiry = localStorage.getItem('google_analytics_token_expiry');

    if (accessToken && refreshToken && tokenExpiry) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.tokenExpiry = parseInt(tokenExpiry);
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    // Load tokens if not already loaded
    if (!this.accessToken) {
      this.loadTokens();
    }

    // Refresh token if expired
    if (this.accessToken && Date.now() >= this.tokenExpiry) {
      await this.refreshAccessToken();
    }

    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const url = new URL(`https://analytics.googleapis.com/analytics/v3${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Analytics API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get available properties
   */
  async getAvailableProperties(): Promise<GoogleAnalyticsProperty[]> {
    const data = await this.makeRequest('/management/accounts/~all/webproperties/~all/profiles');
    
    return data.items?.map((item: any) => ({
      id: item.id,
      name: item.name,
      accountId: item.accountId,
      accountName: item.accountName,
      websiteUrl: item.websiteUrl,
      level: item.level
    })) || [];
  }

  /**
   * Set active property
   */
  async setActiveProperty(propertyId: string): Promise<void> {
    localStorage.setItem('google_analytics_active_property', propertyId);
  }

  /**
   * Get active property
   */
  getActiveProperty(): string | null {
    return localStorage.getItem('google_analytics_active_property');
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const activeProperty = this.getActiveProperty();
      if (!activeProperty) {
        return { success: false, message: 'No active property selected' };
      }

      // Try to get a simple report
      await this.makeRequest('/data/ga', {
        ids: `ga:${activeProperty}`,
        'start-date': '7daysAgo',
        'end-date': 'today',
        metrics: 'ga:sessions',
        dimensions: 'ga:date'
      });

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Get analytics report
   */
  async getReport(params: {
    startDate: string;
    endDate: string;
    metrics: string[];
    dimensions?: string[];
    filters?: string;
    sort?: string;
    maxResults?: number;
  }): Promise<GoogleAnalyticsReport> {
    const activeProperty = this.getActiveProperty();
    if (!activeProperty) {
      throw new Error('No active property selected');
    }

    const requestParams: Record<string, string> = {
      ids: `ga:${activeProperty}`,
      'start-date': params.startDate,
      'end-date': params.endDate,
      metrics: params.metrics.join(',')
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

    return this.makeRequest('/data/ga', requestParams);
  }

  /**
   * Get basic analytics overview
   */
  async getOverview(): Promise<{
    sessions: number;
    users: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
  }> {
    const report = await this.getReport({
      startDate: '7daysAgo',
      endDate: 'today',
      metrics: [
        'ga:sessions',
        'ga:users',
        'ga:pageviews',
        'ga:bounceRate',
        'ga:avgSessionDuration'
      ]
    });

    const row = report.rows?.[0] || ['0', '0', '0', '0', '0'];

    return {
      sessions: parseInt(row[0]) || 0,
      users: parseInt(row[1]) || 0,
      pageViews: parseInt(row[2]) || 0,
      bounceRate: parseFloat(row[3]) || 0,
      avgSessionDuration: parseFloat(row[4]) || 0
    };
  }

  /**
   * Sign out
   */
  signOut(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = 0;
    
    localStorage.removeItem('google_analytics_access_token');
    localStorage.removeItem('google_analytics_refresh_token');
    localStorage.removeItem('google_analytics_token_expiry');
    localStorage.removeItem('google_analytics_active_property');
  }
}

// Export singleton instance
export const googleAnalyticsService = new GoogleAnalyticsService(); 