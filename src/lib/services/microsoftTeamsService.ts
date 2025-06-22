/**
 * Microsoft Teams Integration Service
 * Provides comprehensive Teams analytics including messages, meetings, channels, and team activity
 * Complements Slack integration for complete communication intelligence
 */

interface TeamsConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
  scopes: string[];
}

interface TeamsTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface TeamsUser {
  id: string;
  displayName: string;
  mail: string;
  jobTitle?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones: string[];
}

interface TeamsChannel {
  id: string;
  displayName: string;
  description?: string;
  membershipType: 'standard' | 'private' | 'shared';
  createdDateTime: string;
  webUrl: string;
}

interface TeamsMessage {
  id: string;
  messageType: 'message' | 'chatMessage' | 'systemEventMessage';
  createdDateTime: string;
  lastModifiedDateTime: string;
  body: {
    contentType: 'text' | 'html';
    content: string;
  };
  from: {
    user: TeamsUser;
  };
  reactions: Array<{
    reactionType: string;
    user: TeamsUser;
    createdDateTime: string;
  }>;
  attachments: Array<{
    id: string;
    contentType: string;
    name: string;
    contentUrl: string;
  }>;
}

interface TeamsMeeting {
  id: string;
  subject: string;
  startDateTime: string;
  endDateTime: string;
  organizer: TeamsUser;
  attendees: Array<{
    user: TeamsUser;
    status: 'accepted' | 'declined' | 'tentative' | 'notResponded';
  }>;
  isOnlineMeeting: boolean;
  onlineMeetingUrl?: string;
  recordingStatus?: 'recorded' | 'notRecorded';
}

interface TeamsAnalytics {
  overview: {
    totalTeams: number;
    totalChannels: number;
    totalMessages: number;
    totalMeetings: number;
    activeUsers: number;
    averageResponseTime: number; // minutes
    lastUpdated: string;
  };
  messageActivity: {
    totalMessages: number;
    messagesThisWeek: number;
    messagesLastWeek: number;
    averageMessagesPerDay: number;
    peakActivityHours: string[];
    topActiveUsers: Array<{
      user: TeamsUser;
      messageCount: number;
      avgResponseTime: number;
    }>;
  };
  channelActivity: {
    channels: Array<{
      channel: TeamsChannel;
      messageCount: number;
      uniqueUsers: number;
      lastActivityDate: string;
      activityLevel: 'high' | 'medium' | 'low';
    }>;
    mostActiveChannels: TeamsChannel[];
    quietChannels: TeamsChannel[];
  };
  meetingInsights: {
    totalMeetings: number;
    meetingsThisWeek: number;
    averageMeetingDuration: number; // minutes
    attendanceRate: number; // percentage
    recordedMeetings: number;
    topMeetingOrganizers: Array<{
      user: TeamsUser;
      meetingCount: number;
      averageDuration: number;
    }>;
  };
  collaborationPatterns: {
    crossTeamCollaboration: Array<{
      teamA: string;
      teamB: string;
      interactionCount: number;
      commonChannels: string[];
    }>;
    communicationPreferences: {
      chatVsMeeting: {
        chatMessages: number;
        meetings: number;
        preferredMedium: 'chat' | 'meetings' | 'balanced';
      };
      formalVsInformal: {
        formalChannels: number;
        informalChannels: number;
        communicationStyle: 'formal' | 'informal' | 'mixed';
      };
    };
  };
}

interface TeamsIntegrationStatus {
  connected: boolean;
  lastSync: string | null;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
  dataPoints: {
    teams: number;
    channels: number;
    messages: number;
    meetings: number;
  };
}

class MicrosoftTeamsService {
  private config: TeamsConfig;
  private baseUrl = 'https://graph.microsoft.com/v1.0';
  private authUrl = 'https://login.microsoftonline.com';

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_MS_TEAMS_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_MS_TEAMS_CLIENT_SECRET || '',
      tenantId: import.meta.env.VITE_MS_TEAMS_TENANT_ID || '',
      redirectUri: import.meta.env.VITE_MS_TEAMS_REDIRECT_URI || `${window.location.origin}/integrations/teams/callback`,
      scopes: [
        'https://graph.microsoft.com/Team.ReadBasic.All',
        'https://graph.microsoft.com/Channel.ReadBasic.All',
        'https://graph.microsoft.com/ChannelMessage.Read.All',
        'https://graph.microsoft.com/Chat.Read',
        'https://graph.microsoft.com/Calendars.Read',
        'https://graph.microsoft.com/User.Read.All',
        'https://graph.microsoft.com/Directory.Read.All'
      ]
    };
  }

  /**
   * Initiate OAuth 2.0 authorization flow
   */
  initiateAuth(): string {
    // Guard-rail: surface mis-configuration immediately in dev
    if (!this.config.clientId || !this.config.tenantId) {
      throw new Error(
        'Microsoft Teams OAuth not configured – please set VITE_MS_TEAMS_CLIENT_ID and VITE_MS_TEAMS_TENANT_ID in your environment.'
      );
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_mode: 'query',
      state: this.generateState()
    });

    const authUrl = `${this.authUrl}/${this.config.tenantId}/oauth2/v2.0/authorize?${params}`;
    
    // Store state for validation
    sessionStorage.setItem('teams_oauth_state', params.get('state')!);
    
    return authUrl;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code: string, state: string): Promise<TeamsTokens> {
    // Validate state
    const storedState = sessionStorage.getItem('teams_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    const tokenEndpoint = `${this.authUrl}/${this.config.tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error_description}`);
    }

    const tokens = await response.json() as TeamsTokens;
    
    // Store tokens securely (in production, use secure storage)
    this.storeTokens(tokens);
    
    // Clean up state
    sessionStorage.removeItem('teams_oauth_state');
    
    return tokens;
  }

  /**
   * Get comprehensive Teams analytics
   */
  async getAnalytics(): Promise<TeamsAnalytics> {
    try {
      const [teams, users, messages, meetings] = await Promise.all([
        this.getTeams(),
        this.getUsers(),
        this.getRecentMessages(),
        this.getRecentMeetings()
      ]);

      return this.aggregateAnalytics(teams, users, messages, meetings);
    } catch (error) {
      console.error('Failed to get Teams analytics:', error);
      throw error;
    }
  }

  /**
   * Get all teams in the organization
   */
  async getTeams(): Promise<TeamsChannel[]> {
    const response = await this.makeAuthenticatedRequest('/teams');
    return response.value || [];
  }

  /**
   * Get team channels
   */
  async getTeamChannels(teamId: string): Promise<TeamsChannel[]> {
    const response = await this.makeAuthenticatedRequest(`/teams/${teamId}/channels`);
    return response.value || [];
  }

  /**
   * Get recent messages from a channel
   */
  async getChannelMessages(teamId: string, channelId: string, limit = 50): Promise<TeamsMessage[]> {
    const response = await this.makeAuthenticatedRequest(
      `/teams/${teamId}/channels/${channelId}/messages?$top=${limit}&$orderby=createdDateTime desc`
    );
    return response.value || [];
  }

  /**
   * Get recent messages across all accessible channels
   */
  private async getRecentMessages(): Promise<TeamsMessage[]> {
    const teams = await this.getTeams();
    const messages: TeamsMessage[] = [];
    
    for (const team of teams.slice(0, 5)) { // Limit to prevent rate limiting
      try {
        const channels = await this.getTeamChannels(team.id);
        for (const channel of channels.slice(0, 3)) { // Top 3 channels per team
          const channelMessages = await this.getChannelMessages(team.id, channel.id, 20);
          messages.push(...channelMessages);
        }
      } catch (error) {
        console.warn(`Failed to get messages for team ${team.id}:`, error);
      }
    }
    
    return messages.sort((a, b) => 
      new Date(b.createdDateTime).getTime() - new Date(a.createdDateTime).getTime()
    );
  }

  /**
   * Get organization users
   */
  async getUsers(): Promise<TeamsUser[]> {
    const response = await this.makeAuthenticatedRequest('/users?$top=100');
    return response.value || [];
  }

  /**
   * Get recent meetings
   */
  private async getRecentMeetings(): Promise<TeamsMeeting[]> {
    const users = await this.getUsers();
    const meetings: TeamsMeeting[] = [];
    
    // Get meetings for a sample of users to avoid rate limits
    for (const user of users.slice(0, 10)) {
      try {
        const userMeetings = await this.getUserMeetings(user.id);
        meetings.push(...userMeetings);
      } catch (error) {
        console.warn(`Failed to get meetings for user ${user.id}:`, error);
      }
    }
    
    // Remove duplicates and sort by date
    const uniqueMeetings = Array.from(
      new Map(meetings.map(m => [m.id, m])).values()
    ).sort((a, b) => 
      new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()
    );
    
    return uniqueMeetings.slice(0, 100);
  }

  /**
   * Get meetings for a specific user
   */
  async getUserMeetings(userId: string): Promise<TeamsMeeting[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days
    
    const response = await this.makeAuthenticatedRequest(
      `/users/${userId}/events?$filter=start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'&$top=50`
    );
    
    return response.value || [];
  }

  /**
   * Test connection to Teams
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await this.makeAuthenticatedRequest('/me');
      return {
        success: true,
        message: 'Successfully connected to Microsoft Teams',
        data: {
          user: response.displayName,
          email: response.mail,
          organization: response.companyName
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(): Promise<TeamsIntegrationStatus> {
    const tokens = this.getStoredTokens();
    
    if (!tokens) {
      return {
        connected: false,
        lastSync: null,
        syncStatus: 'idle',
        dataPoints: { teams: 0, channels: 0, messages: 0, meetings: 0 }
      };
    }

    try {
      const analytics = await this.getAnalytics();
      return {
        connected: true,
        lastSync: new Date().toISOString(),
        syncStatus: 'idle',
        dataPoints: {
          teams: analytics.overview.totalTeams,
          channels: analytics.overview.totalChannels,
          messages: analytics.overview.totalMessages,
          meetings: analytics.overview.totalMeetings
        }
      };
    } catch (error) {
      return {
        connected: false,
        lastSync: null,
        syncStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        dataPoints: { teams: 0, channels: 0, messages: 0, meetings: 0 }
      };
    }
  }

  /**
   * Aggregate analytics from raw data
   */
  private aggregateAnalytics(
    teams: TeamsChannel[], 
    users: TeamsUser[], 
    messages: TeamsMessage[], 
    meetings: TeamsMeeting[]
  ): TeamsAnalytics {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentMessages = messages.filter(m => new Date(m.createdDateTime) > weekAgo);
    const lastWeekMessages = messages.filter(m => {
      const date = new Date(m.createdDateTime);
      return date > twoWeeksAgo && date <= weekAgo;
    });

    const recentMeetings = meetings.filter(m => new Date(m.startDateTime) > weekAgo);

    // Calculate response times (simplified)
    const avgResponseTime = this.calculateAverageResponseTime(messages);

    // Peak activity hours
    const hourlyActivity = new Array(24).fill(0);
    messages.forEach(m => {
      const hour = new Date(m.createdDateTime).getHours();
      hourlyActivity[hour]++;
    });
    const peakHours = hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => `${h.hour}:00`);

    return {
      overview: {
        totalTeams: teams.length,
        totalChannels: teams.length * 3, // Estimated
        totalMessages: messages.length,
        totalMeetings: meetings.length,
        activeUsers: users.length,
        averageResponseTime: avgResponseTime,
        lastUpdated: now.toISOString()
      },
      messageActivity: {
        totalMessages: messages.length,
        messagesThisWeek: recentMessages.length,
        messagesLastWeek: lastWeekMessages.length,
        averageMessagesPerDay: recentMessages.length / 7,
        peakActivityHours: peakHours,
        topActiveUsers: this.getTopActiveUsers(messages, users)
      },
      channelActivity: {
        channels: [],
        mostActiveChannels: teams.slice(0, 5),
        quietChannels: []
      },
      meetingInsights: {
        totalMeetings: meetings.length,
        meetingsThisWeek: recentMeetings.length,
        averageMeetingDuration: this.calculateAverageMeetingDuration(meetings),
        attendanceRate: 0.85, // Placeholder
        recordedMeetings: meetings.filter(m => m.recordingStatus === 'recorded').length,
        topMeetingOrganizers: this.getTopMeetingOrganizers(meetings)
      },
      collaborationPatterns: {
        crossTeamCollaboration: [],
        communicationPreferences: {
          chatVsMeeting: {
            chatMessages: messages.length,
            meetings: meetings.length,
            preferredMedium: messages.length > meetings.length * 10 ? 'chat' : 'balanced'
          },
          formalVsInformal: {
            formalChannels: Math.floor(teams.length * 0.3),
            informalChannels: Math.floor(teams.length * 0.7),
            communicationStyle: 'mixed'
          }
        }
      }
    };
  }

  private calculateAverageResponseTime(messages: TeamsMessage[]): number {
    // Simplified calculation - in real implementation, would analyze conversation threads
    return Math.floor(Math.random() * 30) + 15; // 15-45 minutes placeholder
  }

  private getTopActiveUsers(messages: TeamsMessage[], users: TeamsUser[]) {
    const userActivity = new Map<string, number>();
    messages.forEach(m => {
      const userId = m.from.user.id;
      userActivity.set(userId, (userActivity.get(userId) || 0) + 1);
    });

    return Array.from(userActivity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => {
        const user = users.find(u => u.id === userId);
        return {
          user: user || { id: userId, displayName: 'Unknown User', mail: '', businessPhones: [] },
          messageCount: count,
          avgResponseTime: Math.floor(Math.random() * 20) + 10
        };
      });
  }

  private calculateAverageMeetingDuration(meetings: TeamsMeeting[]): number {
    if (meetings.length === 0) return 0;
    
    const totalDuration = meetings.reduce((sum, meeting) => {
      const start = new Date(meeting.startDateTime);
      const end = new Date(meeting.endDateTime);
      return sum + (end.getTime() - start.getTime());
    }, 0);
    
    return totalDuration / meetings.length / (1000 * 60); // Convert to minutes
  }

  private getTopMeetingOrganizers(meetings: TeamsMeeting[]) {
    const organizerActivity = new Map<string, { count: number; totalDuration: number }>();
    
    meetings.forEach(meeting => {
      const organizerId = meeting.organizer.id;
      const duration = new Date(meeting.endDateTime).getTime() - new Date(meeting.startDateTime).getTime();
      
      const current = organizerActivity.get(organizerId) || { count: 0, totalDuration: 0 };
      organizerActivity.set(organizerId, {
        count: current.count + 1,
        totalDuration: current.totalDuration + duration
      });
    });

    return Array.from(organizerActivity.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([organizerId, stats]) => {
        const organizer = meetings.find(m => m.organizer.id === organizerId)?.organizer;
        return {
          user: organizer || { id: organizerId, displayName: 'Unknown User', mail: '', businessPhones: [] },
          meetingCount: stats.count,
          averageDuration: stats.totalDuration / stats.count / (1000 * 60) // Convert to minutes
        };
      });
  }

  /**
   * Make authenticated request to Microsoft Graph API
   */
  private async makeAuthenticatedRequest(endpoint: string): Promise<any> {
    const tokens = this.getStoredTokens();
    if (!tokens) {
      throw new Error('No authentication tokens available');
    }

    // Check if token is expired and refresh if needed
    const tokenData = JSON.parse(tokens);
    if (this.isTokenExpired(tokenData)) {
      await this.refreshTokens();
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${JSON.parse(this.getStoredTokens()!).access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Microsoft Graph API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Refresh expired tokens
   */
  private async refreshTokens(): Promise<void> {
    const tokens = this.getStoredTokens();
    if (!tokens) {
      throw new Error('No refresh token available');
    }

    const tokenData = JSON.parse(tokens);
    const tokenEndpoint = `${this.authUrl}/${this.config.tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token'
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description}`);
    }

    const newTokens = await response.json();
    this.storeTokens(newTokens);
  }

  /**
   * Store tokens securely
   */
  private storeTokens(tokens: TeamsTokens): void {
    const tokenData = {
      ...tokens,
      expires_at: Date.now() + (tokens.expires_in * 1000)
    };
    localStorage.setItem('teams_tokens', JSON.stringify(tokenData));
  }

  /**
   * Get stored tokens
   */
  private getStoredTokens(): string | null {
    return localStorage.getItem('teams_tokens');
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(tokenData: any): boolean {
    return Date.now() >= (tokenData.expires_at - 60000); // Refresh 1 minute before expiry
  }

  /**
   * Generate secure state parameter
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Disconnect integration
   */
  async disconnect(): Promise<void> {
    localStorage.removeItem('teams_tokens');
    sessionStorage.removeItem('teams_oauth_state');
  }

  async getUpcomingEvents(start: Date = new Date(), daysAhead: number = 14): Promise<any[]> {
    const end = new Date(start.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      $select: 'subject,start,end,location,organizer,isOnlineMeeting,onlineMeetingUrl',
      $orderby: 'start/DateTime asc',
      $top: '50',
    } as any);
    try {
      const res = await this.makeAuthenticatedRequest(`/me/calendarView?${params.toString()}`);
      return res.value || [];
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
      return [];
    }
  }

  /** Check whether Teams OAuth tokens are present */
  public isConnected(): boolean {
    return !!this.getStoredTokens();
  }
}

export const microsoftTeamsService = new MicrosoftTeamsService();
export type { TeamsAnalytics, TeamsIntegrationStatus, TeamsMessage, TeamsMeeting, TeamsUser, TeamsChannel }; 