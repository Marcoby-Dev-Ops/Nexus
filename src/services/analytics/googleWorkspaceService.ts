/**
 * Google Workspace Integration Service
 * Provides OAuth and API functionality for Google Workspace integration
 */

export interface GoogleWorkspaceConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleWorkspaceUser {
  id: string;
  primaryEmail: string;
  name: {
    fullName: string;
    givenName: string;
    familyName: string;
  };
  isAdmin: boolean;
  suspended: boolean;
  creationTime: string;
  lastLoginTime?: string;
}

export interface GoogleWorkspaceDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  createdTime: string;
  modifiedTime: string;
  parents?: string[];
  webViewLink?: string;
}

export interface GoogleWorkspaceCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
}

export class GoogleWorkspaceService {
  private config: GoogleWorkspaceConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config?: Partial<GoogleWorkspaceConfig>) {
    this.config = {
      clientId: config?.clientId || import.meta.env.VITE_GOOGLE_WORKSPACE_CLIENT_ID || '',
      clientSecret: config?.clientSecret || import.meta.env.VITE_GOOGLE_WORKSPACE_CLIENT_SECRET || '',
      redirectUri: config?.redirectUri || `${window.location.origin}/integrations/google-workspace/callback`
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
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.readonly'
    ];

    const state = btoa(JSON.stringify({
      timestamp: Date.now(),
      service: 'google-workspace'
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
      localStorage.setItem('google_workspace_access_token', this.accessToken);
      localStorage.setItem('google_workspace_refresh_token', this.refreshToken);
      localStorage.setItem('google_workspace_token_expiry', this.tokenExpiry.toString());
    }
  }

  /**
   * Load tokens from storage
   */
  private loadTokens(): void {
    const accessToken = localStorage.getItem('google_workspace_access_token');
    const refreshToken = localStorage.getItem('google_workspace_refresh_token');
    const tokenExpiry = localStorage.getItem('google_workspace_token_expiry');

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

    const url = new URL(`https://www.googleapis.com${endpoint}`);
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
      throw new Error(`Google Workspace API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get workspace users
   */
  async getUsers(domain?: string): Promise<GoogleWorkspaceUser[]> {
    const params: Record<string, string> = {
      maxResults: '100'
    };

    if (domain) {
      params.domain = domain;
    }

    const data = await this.makeRequest('/admin/directory/v1/users', params);
    
    return data.users?.map((user: any) => ({
      id: user.id,
      primaryEmail: user.primaryEmail,
      name: {
        fullName: user.name?.fullName || '',
        givenName: user.name?.givenName || '',
        familyName: user.name?.familyName || ''
      },
      isAdmin: user.isAdmin || false,
      suspended: user.suspended || false,
      creationTime: user.creationTime,
      lastLoginTime: user.lastLoginTime
    })) || [];
  }

  /**
   * Get Drive files
   */
  async getDriveFiles(query?: string, maxResults: number = 50): Promise<GoogleWorkspaceDriveFile[]> {
    const params: Record<string, string> = {
      pageSize: maxResults.toString(),
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,parents,webViewLink)'
    };

    if (query) {
      params.q = query;
    }

    const data = await this.makeRequest('/drive/v3/files', params);
    
    return data.files?.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      parents: file.parents,
      webViewLink: file.webViewLink
    })) || [];
  }

  /**
   * Get Calendar events
   */
  async getCalendarEvents(calendarId: string = 'primary', timeMin?: string, timeMax?: string): Promise<GoogleWorkspaceCalendarEvent[]> {
    const params: Record<string, string> = {
      maxResults: '50',
      singleEvents: 'true',
      orderBy: 'startTime'
    };

    if (timeMin) {
      params.timeMin = timeMin;
    }

    if (timeMax) {
      params.timeMax = timeMax;
    }

    const data = await this.makeRequest(`/calendar/v3/calendars/${calendarId}/events`, params);
    
    return data.items?.map((event: any) => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      attendees: event.attendees
    })) || [];
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<{
    id: string;
    email: string;
    name: string;
    picture?: string;
  }> {
    const data = await this.makeRequest('/oauth2/v2/userinfo');
    
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture
    };
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getUserProfile();
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Sign out
   */
  signOut(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = 0;
    
    localStorage.removeItem('google_workspace_access_token');
    localStorage.removeItem('google_workspace_refresh_token');
    localStorage.removeItem('google_workspace_token_expiry');
  }
}

// Export singleton instance
export const googleWorkspaceService = new GoogleWorkspaceService(); 