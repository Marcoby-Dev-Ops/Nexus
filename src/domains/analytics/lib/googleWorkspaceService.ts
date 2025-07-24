/**
 * Google Workspace Integration Service
 * Comprehensive Google business tools integration
 * Pillar: 1,2,3 - Automates Google workspace data collection and insights
 */

import { logger } from '@/core/auth/logger';

interface GoogleWorkspaceConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  scope: string[];
}

interface GmailThread {
  id: string;
  snippet: string;
  historyId: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
}

interface GmailProfile {
  messagesTotal: number;
}

interface GmailThreads {
  threads: GmailThread[];
}

interface DriveAbout {
  storageQuota?: {
    usage: string;
    limit: string;
  };
}

interface DriveFiles {
  files: { id: string; name: string; size: string; mimeType: string }[];
}

interface Email {
    id: string;
    snippet: string;
    payload: {
        headers: { name: string, value: string }[]
    }
}

interface CalendarListResponse {
  items: CalendarEvent[];
}

interface SearchConsoleSites {
  siteEntry: { siteUrl: string }[];
}

// GoogleEmail type for Gmail API responses
export type GoogleEmail = {
    id: string;
    snippet: string;
    labelIds: string[];
    payload: {
        headers: { name: string, value: string }[];
    };
};

export class GoogleWorkspaceService {
  private config: GoogleWorkspaceConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    const stored = localStorage.getItem('google_workspace_config');
    if (stored) {
      this.config = JSON.parse(stored);
    }
  }

  isAuthenticated(): boolean {
    return this.config !== null && !!this.config.accessToken;
  }

  /**
   * Initialize OAuth 2.0 flow for Google Workspace
   */
  async initializeOAuth(): Promise<string> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/integrations/google-workspace/callback`;
    
    // Comprehensive scopes for all Google business tools
    const scopes = [
      // Gmail
      'https: //www.googleapis.com/auth/gmail.readonly',
      'https: //www.googleapis.com/auth/gmail.metadata',
      
      // Drive
      'https: //www.googleapis.com/auth/drive.readonly',
      'https: //www.googleapis.com/auth/drive.metadata.readonly',
      
      // Calendar
      'https: //www.googleapis.com/auth/calendar.readonly',
      'https: //www.googleapis.com/auth/calendar.events.readonly',
      
      // Contacts
      'https: //www.googleapis.com/auth/contacts.readonly',
      
      // Business Profile (Google My Business)
      'https: //www.googleapis.com/auth/business.manage',
      
      // Analytics (for comprehensive data)
      'https: //www.googleapis.com/auth/analytics.readonly',
      
      // Search Console
      'https: //www.googleapis.com/auth/webmasters.readonly',
      
      // Admin SDK (if admin)
      'https: //www.googleapis.com/auth/admin.directory.user.readonly',
      'https: //www.googleapis.com/auth/admin.reports.audit.readonly'
    ];

    const params = new URLSearchParams({
      clientid: clientId,
      redirecturi: redirectUri,
      responsetype: 'code',
      scope: scopes.join(' '),
      accesstype: 'offline',
      prompt: 'consent'
    });

    return `https: //accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<void> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
    const redirectUri = `${window.location.origin}/integrations/google-workspace/callback`;

    const response = await fetch('https: //oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        clientid: clientId,
        clientsecret: clientSecret,
        code,
        granttype: 'authorization_code',
        redirecturi: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await response.json();
    
    this.config = {
      clientId,
      clientSecret,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope?.split(' ') || []
    };

    localStorage.setItem('google_workspace_config', JSON.stringify(this.config));
  }

  /**
   * Get comprehensive Google Workspace metrics
   */
  async getWorkspaceMetrics(): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Workspace');
    }

    try {
      const [emailMetrics, driveMetrics, calendarMetrics, businessMetrics] = await Promise.all([
        this.getGmailMetrics(),
        this.getDriveMetrics(),
        this.getCalendarMetrics(),
        this.getBusinessMetrics()
      ]);

      return {
        emailVolume: emailMetrics,
        storage: driveMetrics,
        meetings: calendarMetrics,
        productivity: businessMetrics
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch Google Workspace metrics');
      throw error;
    }
  }

  /**
   * Get Gmail metrics
   */
  private async getGmailMetrics() {
    const response = (await this.makeAuthenticatedRequest(
      'https: //gmail.googleapis.com/gmail/v1/users/me/profile'
    )) as GmailProfile;

    const threadsResponse = (await this.makeAuthenticatedRequest(
      'https: //gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=100'
    )) as GmailThreads;

    return {
      sent: response.messagesTotal || 0,
      received: response.messagesTotal || 0,
      unread: (threadsResponse.threads as GmailThread[])?.filter((t: GmailThread) => t.snippet?.includes('UNREAD')).length || 0
    };
  }

  /**
   * Get Google Drive metrics
   */
  private async getDriveMetrics() {
    const aboutResponse = (await this.makeAuthenticatedRequest(
      'https: //www.googleapis.com/drive/v3/about?fields=storageQuota,user'
    )) as DriveAbout;

    const filesResponse = (await this.makeAuthenticatedRequest(
      'https: //www.googleapis.com/drive/v3/files?pageSize=1000&fields=files(id,name,size,mimeType)'
    )) as DriveFiles;

    const quota = aboutResponse.storageQuota;
    
    return {
      used: parseInt(quota?.usage || '0'),
      total: parseInt(quota?.limit || '0'),
      fileCount: filesResponse.files?.length || 0
    };
  }

  /**
   * Get Google Calendar metrics
   */
  private async getCalendarMetrics() {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const params = new URLSearchParams({
      timeMin: today.toISOString(),
      timeMax: nextWeek.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime'
    });

    const response = await this.makeAuthenticatedRequest(
      `https: //www.googleapis.com/auth/calendar/v3/calendars/primary/events?${params.toString()}`
    );

    const totalMeetings = response.items.length;
    const totalDuration = response.items.reduce((acc: number, item: any) => {
      const start = new Date(item.start.dateTime || item.start.date);
      const end = new Date(item.end.dateTime || item.end.date);
      return acc + (end.getTime() - start.getTime());
    }, 0) / (1000 * 60); // duration in minutes

    const participants = response.items.reduce((acc: number, item: any) => {
      return acc + (item.attendees?.length || 0);
    }, 0);

    return {
      total: totalMeetings,
      duration: Math.round(totalDuration),
      participants
    };
  }

  /**
   * Get Google Calendar events for a given time range
   */
  async getCalendarEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Workspace');
    }

    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100'
    });
    
    const response = await this.makeAuthenticatedRequest(
      `https: //www.googleapis.com/v1/calendars/primary/events?${params.toString()}`
    );

    return response.items || [];
  }

  /**
   * Get business productivity metrics
   */
  private async getBusinessMetrics() {
    // These would make calls to Google My Business API, etc.
    // For now, returning mock data
    return {
      activeUsers: 1, // Current user
      collaborationScore: 85, // Based on sharing activity
      documentSharing: 45, // Based on Drive sharing
      customerInteractions: 0
    };
  }

  /**
   * Get Google My Business insights
   */
  async getBusinessProfileMetrics() {
    const response = await this.makeAuthenticatedRequest(
      'https: //mybusinessbusinessinformation.googleapis.com/v1/accounts'
    );

    if (!response.accounts || response.accounts.length === 0) {
      return { locations: 0, reviews: 0, rating: 0 };
    }

    const accountName = response.accounts[0].name;
    const locationsResponse = await this.makeAuthenticatedRequest(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`
    );

    return {
      locations: locationsResponse.locations?.length || 0,
      reviews: 0, // Additional API calls needed for reviews
      rating: 0
    };
  }

  /**
   * Test connection to Google Workspace
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const metrics = await this.getWorkspaceMetrics();
      if (metrics) {
        return { success: true, message: 'Successfully connected to Google Workspace' };
      } else {
        return { success: false, message: 'Failed to fetch metrics, but no error thrown' };
      }
    } catch (error) {
      logger.error({ err: error }, 'Google Workspace connection test failed');
      return { 
        success: false, 
        message: 'Connection test failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Make authenticated request to Google API
   */
  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<any> {
    if (!this.config?.accessToken) {
      throw new Error('Not authenticated');
    }

    let currentToken = this.config.accessToken;

    const authOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${currentToken}`
      }
    };

    let response = await fetch(url, authOptions);

    if (response.status === 401) {
      await this.refreshAccessToken();
      currentToken = this.config.accessToken;
      
      // Retry request with new token
      authOptions.headers = {
        ...authOptions.headers,
        'Authorization': `Bearer ${currentToken}`
      };
      response = await fetch(url, authOptions);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error({
        err: {
          message: `API request failed: ${response.statusText}`,
          status: response.status,
          url,
          errorData
        }
      }, 'Google Workspace API request failed');
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.config?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https: //oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        clientid: this.config.clientId,
        clientsecret: this.config.clientSecret,
        refreshtoken: this.config.refreshToken,
        granttype: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const tokens = await response.json();
    this.config.accessToken = tokens.access_token;
    localStorage.setItem('google_workspace_config', JSON.stringify(this.config));
  }

  /**
   * Get available Google services based on scopes
   */
  getAvailableServices(): string[] {
    if (!this.config?.scope) return [];

    const serviceMap: Record<string, string> = {
      'gmail': 'Gmail',
      'drive': 'Google Drive',
      'calendar': 'Google Calendar',
      'contacts': 'Google Contacts',
      'business.manage': 'Google Business Profile',
      'analytics': 'Google Analytics',
      'webmasters': 'Google Search Console',
      'admin.directory': 'Google Admin SDK'
    };
    
    return this.config.scope
      .map(s => {
        const key = Object.keys(serviceMap).find(k => s.includes(k));
        return key ? serviceMap[key] : null;
      })
      .filter((v, i, a) => v && a.indexOf(v) === i) as string[];
  }

  /**
   * Get recent emails from Gmail
   */
  async getEmails(limit = 10): Promise<GoogleEmail[]> {
    const response = await this.makeAuthenticatedRequest(
      `https: //gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}`
    );

    const emailPromises = response.messages.map((msg: { id: string; }) =>
      this.makeAuthenticatedRequest(
        `https: //gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`
      )
    );
    
    return Promise.all(emailPromises);
  }

  /**
   * Mark a Gmail message as read by removing the UNREAD label
   */
  public async markEmailAsRead(emailId: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Workspace');
    }
    await this.makeAuthenticatedRequest(
      `https: //gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
      }
    );
  }
}

export const googleWorkspaceService = new GoogleWorkspaceService(); 