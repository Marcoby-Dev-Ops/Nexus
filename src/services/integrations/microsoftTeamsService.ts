/**
 * Microsoft Teams Integration Service
 * Provides OAuth and API functionality for Microsoft Teams integration
 */

export interface MicrosoftTeamsConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tenantId?: string;
}

export interface MicrosoftTeamsChannel {
  id: string;
  displayName: string;
  description?: string;
  isPrivate: boolean;
  memberCount: number;
}

export interface MicrosoftTeamsTeam {
  id: string;
  displayName: string;
  description?: string;
  visibility: 'Private' | 'Public';
  memberCount: number;
  channels: MicrosoftTeamsChannel[];
}

export interface MicrosoftTeamsMessage {
  id: string;
  content: string;
  createdDateTime: string;
  from: {
    user: {
      displayName: string;
      id: string;
    };
  };
}

export class MicrosoftTeamsService {
  private config: MicrosoftTeamsConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config?: Partial<MicrosoftTeamsConfig>) {
    this.config = {
      clientId: config?.clientId || import.meta.env.VITE_MICROSOFT_TEAMS_CLIENT_ID || '',
      clientSecret: config?.clientSecret || import.meta.env.VITE_MICROSOFT_TEAMS_CLIENT_SECRET || '',
      redirectUri: config?.redirectUri || `${window.location.origin}/integrations/microsoft-teams/callback`,
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
   * Initialize OAuth flow
   */
  async initializeOAuth(): Promise<string> {
    const scopes = [
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/Team.ReadBasic.All',
      'https://graph.microsoft.com/Channel.ReadBasic.All',
      'https://graph.microsoft.com/Chat.Read',
      'https://graph.microsoft.com/ChatMessage.Read'
    ];

    const state = btoa(JSON.stringify({
      timestamp: Date.now(),
      service: 'microsoft-teams'
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
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`Microsoft OAuth failed: ${response.statusText}`);
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
      localStorage.setItem('microsoft_teams_access_token', this.accessToken);
      localStorage.setItem('microsoft_teams_refresh_token', this.refreshToken);
      localStorage.setItem('microsoft_teams_token_expiry', this.tokenExpiry.toString());
    }
  }

  /**
   * Load tokens from storage
   */
  private loadTokens(): void {
    const accessToken = localStorage.getItem('microsoft_teams_access_token');
    const refreshToken = localStorage.getItem('microsoft_teams_refresh_token');
    const tokenExpiry = localStorage.getItem('microsoft_teams_token_expiry');

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
      throw new Error(`Microsoft Graph API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user's teams
   */
  async getTeams(): Promise<MicrosoftTeamsTeam[]> {
    const data = await this.makeRequest('/me/joinedTeams');
    
    return data.value?.map((team: any) => ({
      id: team.id,
      displayName: team.displayName,
      description: team.description,
      visibility: team.visibility,
      memberCount: team.memberCount || 0,
      channels: []
    })) || [];
  }

  /**
   * Get channels for a team
   */
  async getChannels(teamId: string): Promise<MicrosoftTeamsChannel[]> {
    const data = await this.makeRequest(`/teams/${teamId}/channels`);
    
    return data.value?.map((channel: any) => ({
      id: channel.id,
      displayName: channel.displayName,
      description: channel.description,
      isPrivate: channel.membershipType === 'private',
      memberCount: channel.memberCount || 0
    })) || [];
  }

  /**
   * Get messages from a channel
   */
  async getChannelMessages(teamId: string, channelId: string, limit: number = 50): Promise<MicrosoftTeamsMessage[]> {
    const data = await this.makeRequest(`/teams/${teamId}/channels/${channelId}/messages`, {
      $top: limit.toString(),
      $orderby: 'createdDateTime desc'
    });
    
    return data.value?.map((message: any) => ({
      id: message.id,
      content: message.body?.content || '',
      createdDateTime: message.createdDateTime,
      from: message.from
    })) || [];
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<{
    id: string;
    displayName: string;
    mail: string;
    userPrincipalName: string;
  }> {
    const data = await this.makeRequest('/me');
    
    return {
      id: data.id,
      displayName: data.displayName,
      mail: data.mail,
      userPrincipalName: data.userPrincipalName
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
    
    localStorage.removeItem('microsoft_teams_access_token');
    localStorage.removeItem('microsoft_teams_refresh_token');
    localStorage.removeItem('microsoft_teams_token_expiry');
  }
}

// Export singleton instance
export const microsoftTeamsService = new MicrosoftTeamsService(); 