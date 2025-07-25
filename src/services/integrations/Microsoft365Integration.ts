/**
 * Microsoft 365 Integration Service
 * Provides comprehensive access to Microsoft 365 services through unified OAuth
 */

export interface Microsoft365Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tenantId?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  lastSync?: string;
  dataPoints?: number;
  error?: string;
}

export interface SyncProgress {
  emails: number;
  calendarEvents: number;
  files: number;
  contacts: number;
  teams: number;
  tasks: number;
  notes: number;
}

export interface Microsoft365User {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

export interface EmailMessage {
  id: string;
  subject: string;
  from: { emailAddress: { address: string; name: string } };
  receivedDateTime: string;
  bodyPreview: string;
  importance: 'low' | 'normal' | 'high';
}

export interface CalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  organizer: { emailAddress: { address: string; name: string } };
  attendees: Array<{ emailAddress: { address: string; name: string }; status: { response: string } }>;
}

export interface OneDriveFile {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  webUrl: string;
  '@microsoft.graph.downloadUrl'?: string;
}

export interface TeamsMessage {
  id: string;
  content: string;
  createdDateTime: string;
  from: { user: { displayName: string; id: string } };
}

export class Microsoft365Integration {
  private config: Microsoft365Config;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config?: Partial<Microsoft365Config>) {
    this.config = {
      clientId: config?.clientId || import.meta.env.VITE_MICROSOFT_365_CLIENT_ID || '',
      clientSecret: config?.clientSecret || import.meta.env.VITE_MICROSOFT_365_CLIENT_SECRET || '',
      redirectUri: config?.redirectUri || `${window.location.origin}/integrations/microsoft-365/callback`,
      tenantId: config?.tenantId || import.meta.env.VITE_MICROSOFT_TENANT_ID
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.accessToken && Date.now() < this.tokenExpiry);
  }

  /**
   * Initialize OAuth flow for Microsoft 365
   */
  async initializeOAuth(): Promise<string> {
    const scopes = [
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Calendars.Read',
      'https://graph.microsoft.com/Files.Read.All',
      'https://graph.microsoft.com/Sites.Read.All',
      'https://graph.microsoft.com/Team.ReadBasic.All',
      'https://graph.microsoft.com/Channel.ReadBasic.All',
      'https://graph.microsoft.com/Chat.Read',
      'https://graph.microsoft.com/Tasks.Read'
    ];

    const state = btoa(JSON.stringify({
      timestamp: Date.now(),
      service: 'microsoft-365'
    }));

    const tenantId = this.config.tenantId || 'common';
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      response_mode: 'query',
      state
    });

    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<void> {
    const tenantId = this.config.tenantId || 'common';
    
    const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    this.storeTokens();
  }

  /**
   * Get connection status for a user
   */
  async getConnectionStatus(userId: string): Promise<ConnectionStatus> {
    try {
      if (!this.isAuthenticated()) {
        return { connected: false, error: 'Not authenticated' };
      }

      // Test connection by making a simple API call
      const userProfile = await this.getUserProfile();
      
      // Get last sync info from database (mock for now)
      const lastSync = new Date().toISOString();
      const dataPoints = 0; // This would be calculated from actual data

      return {
        connected: true,
        lastSync,
        dataPoints
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sync Microsoft 365 data
   */
  async syncData(userId: string, onProgress?: (progress: SyncProgress) => void): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const progress: SyncProgress = {
      emails: 0,
      calendarEvents: 0,
      files: 0,
      contacts: 0,
      teams: 0,
      tasks: 0,
      notes: 0
    };

    try {
      // Sync emails
      const emails = await this.getEmails();
      progress.emails = emails.length;
      onProgress?.(progress);

      // Sync calendar events
      const calendarEvents = await this.getCalendarEvents();
      progress.calendarEvents = calendarEvents.length;
      onProgress?.(progress);

      // Sync OneDrive files
      const files = await this.getOneDriveFiles();
      progress.files = files.length;
      onProgress?.(progress);

      // Sync Teams messages
      const teamsMessages = await this.getTeamsMessages();
      progress.teams = teamsMessages.length;
      onProgress?.(progress);

      // Store sync results in database
      await this.storeSyncResults(userId, progress);

    } catch (error) {
      throw new Error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<Microsoft365User> {
    const response = await this.makeRequest('/me');
    return {
      id: response.id,
      displayName: response.displayName,
      mail: response.mail,
      userPrincipalName: response.userPrincipalName
    };
  }

  /**
   * Get emails from Outlook
   */
  async getEmails(limit: number = 100): Promise<EmailMessage[]> {
    const response = await this.makeRequest('/me/messages', {
      $top: limit.toString(),
      $orderby: 'receivedDateTime desc'
    });

    return response.value.map((msg: any) => ({
      id: msg.id,
      subject: msg.subject,
      from: msg.from,
      receivedDateTime: msg.receivedDateTime,
      bodyPreview: msg.bodyPreview,
      importance: msg.importance
    }));
  }

  /**
   * Get calendar events
   */
  async getCalendarEvents(limit: number = 100): Promise<CalendarEvent[]> {
    const response = await this.makeRequest('/me/events', {
      $top: limit.toString(),
      $orderby: 'start/dateTime desc'
    });

    return response.value.map((event: any) => ({
      id: event.id,
      subject: event.subject,
      start: event.start,
      end: event.end,
      organizer: event.organizer,
      attendees: event.attendees || []
    }));
  }

  /**
   * Get OneDrive files
   */
  async getOneDriveFiles(limit: number = 100): Promise<OneDriveFile[]> {
    const response = await this.makeRequest('/me/drive/root/children', {
      $top: limit.toString(),
      $orderby: 'lastModifiedDateTime desc'
    });

    return response.value.map((file: any) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      lastModifiedDateTime: file.lastModifiedDateTime,
      webUrl: file.webUrl,
      '@microsoft.graph.downloadUrl': file['@microsoft.graph.downloadUrl']
    }));
  }

  /**
   * Get Teams messages
   */
  async getTeamsMessages(limit: number = 100): Promise<TeamsMessage[]> {
    // Get user's teams first
    const teams = await this.makeRequest('/me/joinedTeams');
    const messages: TeamsMessage[] = [];

    for (const team of teams.value) {
      try {
        const channels = await this.makeRequest(`/teams/${team.id}/channels`);
        
        for (const channel of channels.value) {
          try {
            const channelMessages = await this.makeRequest(
              `/teams/${team.id}/channels/${channel.id}/messages`,
              { $top: Math.floor(limit / teams.value.length).toString() }
            );
            
            messages.push(...channelMessages.value.map((msg: any) => ({
              id: msg.id,
              content: msg.body.content,
              createdDateTime: msg.createdDateTime,
              from: msg.from
            })));
          } catch (error) {
            // Skip channels that can't be accessed
            continue;
          }
        }
      } catch (error) {
        // Skip teams that can't be accessed
        continue;
      }
    }

    return messages.slice(0, limit);
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isAuthenticated()) {
        return { success: false, message: 'Not authenticated' };
      }

      const userProfile = await this.getUserProfile();
      return { 
        success: true, 
        message: `Connected as ${userProfile.displayName}` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }

  /**
   * Store sync results in database
   */
  private async storeSyncResults(userId: string, progress: SyncProgress): Promise<void> {
    // This would store the sync results in the database
    // For now, just log the results
    console.log('Sync results:', { userId, progress });
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const tenantId = this.config.tenantId || 'common';
    
    const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
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
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    this.storeTokens();
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('microsoft365_access_token', this.accessToken || '');
      localStorage.setItem('microsoft365_refresh_token', this.refreshToken || '');
      localStorage.setItem('microsoft365_token_expiry', this.tokenExpiry.toString());
    }
  }

  /**
   * Load tokens from localStorage
   */
  private loadTokens(): void {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('microsoft365_access_token');
      this.refreshToken = localStorage.getItem('microsoft365_refresh_token');
      const expiry = localStorage.getItem('microsoft365_token_expiry');
      this.tokenExpiry = expiry ? parseInt(expiry) : 0;
    }
  }

  /**
   * Make authenticated request to Microsoft Graph API
   */
  private async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    if (!this.accessToken) {
      this.loadTokens();
    }

    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.refreshAccessToken();
    }

    const url = new URL(`https://graph.microsoft.com/v1.0${endpoint}`);
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
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Sign out and clear tokens
   */
  signOut(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = 0;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('microsoft365_access_token');
      localStorage.removeItem('microsoft365_refresh_token');
      localStorage.removeItem('microsoft365_token_expiry');
    }
  }
} 