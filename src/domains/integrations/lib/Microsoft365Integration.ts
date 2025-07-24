import { BaseIntegration } from '@/domains/integrations/lib/baseIntegration';
import type { SyncResult } from '@/domains/integrations/lib/baseIntegration';
import { syncIntegration } from '@/domains/integrations/lib/syncService';
import { OAuthTokenService } from '@/domains/integrations/lib/oauthTokenService';
import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';
import type { AuthType } from './authTypes';

interface MicrosoftGraphResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

interface EmailMessage {
  id: string;
  subject: string;
  from: { emailAddress: { address: string; name: string } };
  toRecipients: Array<{ emailAddress: { address: string; name: string } }>;
  receivedDateTime: string;
  isRead: boolean;
  importance: string;
  bodyPreview: string;
  categories: string[];
}

interface CalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location: { displayName: string };
  attendees: Array<{ emailAddress: { address: string; name: string }; status: { response: string } }>;
  isAllDay: boolean;
  showAs: string;
  categories: string[];
}

interface DriveItem {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  webUrl: string;
  '@microsoft.graph.downloadUrl'?: string;
  file?: { mimeType: string };
  folder?: { childCount: number };
}

interface Contact {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  emailAddresses: Array<{ address: string; name: string }>;
  businessPhones: string[];
  mobilePhone: string;
  jobTitle: string;
  companyName: string;
  categories: string[];
}

interface TeamsMessage {
  id: string;
  content: string;
  createdDateTime: string;
  from: { user: { displayName: string; id: string } };
  importance: string;
  messageType: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  importance: string;
  dueDateTime?: { dateTime: string; timeZone: string };
  createdDateTime: string;
  categories: string[];
}

interface Note {
  id: string;
  title: string;
  content: string;
  lastModifiedDateTime: string;
  categories: string[];
}

export class Microsoft365Integration extends BaseIntegration {
  id = 'microsoft365';
  name = 'Microsoft 365';
  dataFields = ['emails', 'calendar', 'files', 'teams'];
  authType: AuthType = 'oauth';

  private async getAccessToken(userId: string): Promise<string> {
    const token = await OAuthTokenService.getTokens('microsoft');
    if (!token?.access_token) {
      throw new Error('No valid Microsoft 365 access token found. Please reconnect your account.');
    }
    return token.access_token;
  }

  private async makeGraphRequest<T>(endpoint: string, accessToken: string): Promise<T[]> {
    const baseUrl = 'https: //graph.microsoft.com/v1.0';
    const url = `${baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ endpoint, status: response.status, error: errorText }, 'Microsoft Graph API request failed');
      throw new Error(`Microsoft Graph API error: ${response.status} ${errorText}`);
    }

    const data: MicrosoftGraphResponse<T> = await response.json();
    return data.value || [];
  }

  async fetchProviderData({ userId, fullSync = false }: { userId: string; fullSync?: boolean }): Promise<Record<string, any[]>> {
    try {
      logger.info({ userId, fullSync }, 'Starting Microsoft 365 data fetch');
      
      const accessToken = await this.getAccessToken(userId);
      
      // Fetch data in parallel for better performance
      const [
        emails,
        calendarEvents,
        files,
        contacts,
        teamsMessages,
        tasks,
        notes
      ] = await Promise.all([
        this.fetchEmails(accessToken, fullSync),
        this.fetchCalendarEvents(accessToken, fullSync),
        this.fetchFiles(accessToken, fullSync),
        this.fetchContacts(accessToken, fullSync),
        this.fetchTeamsMessages(accessToken, fullSync),
        this.fetchTasks(accessToken, fullSync),
        this.fetchNotes(accessToken, fullSync)
      ]);

      const result = {
        emails,
        calendarEvents,
        files,
        contacts,
        teams: teamsMessages, // Map teams messages to teams field
        tasks,
        notes
      };

      logger.info({ 
        userId, 
        emailCount: emails.length,
        calendarCount: calendarEvents.length,
        fileCount: files.length,
        contactCount: contacts.length,
        teamsCount: teamsMessages.length,
        taskCount: tasks.length,
        noteCount: notes.length
      }, 'Microsoft 365 data fetch completed');

      return result;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch Microsoft 365 data');
      throw error;
    }
  }

  private async fetchEmails(accessToken: string, fullSync: boolean): Promise<EmailMessage[]> {
    try {
      const endpoint = '/me/messages?$top=50&$filter=receivedDateTime ge 2024-01-01&$orderby=receivedDateTime desc';
      
      return await this.makeGraphRequest<EmailMessage>(endpoint, accessToken);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch emails');
      return [];
    }
  }

  private async fetchCalendarEvents(accessToken: string, fullSync: boolean): Promise<CalendarEvent[]> {
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
      const endDate = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days from now
      
      const endpoint = `/me/calendarView?startDateTime=${startDate.toISOString()}&endDateTime=${endDate.toISOString()}&$top=100`;
      
      return await this.makeGraphRequest<CalendarEvent>(endpoint, accessToken);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch calendar events');
      return [];
    }
  }

  private async fetchFiles(accessToken: string, fullSync: boolean): Promise<DriveItem[]> {
    try {
      const endpoint = _fullSync 
        ? '/me/drive/root/children?$top=100'
        : '/me/drive/root/children?$top=50&$orderby=lastModifiedDateTime desc';
      
      return await this.makeGraphRequest<DriveItem>(endpoint, accessToken);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch files');
      return [];
    }
  }

  private async fetchContacts(accessToken: string, fullSync: boolean): Promise<Contact[]> {
    try {
      const endpoint = _fullSync 
        ? '/me/contacts?$top=100'
        : '/me/contacts?$top=50&$orderby=displayName';
      
      return await this.makeGraphRequest<Contact>(endpoint, accessToken);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch contacts');
      return [];
    }
  }

  private async fetchTeamsMessages(accessToken: string, fullSync: boolean): Promise<TeamsMessage[]> {
    try {
      // First get user's teams
      const teams = await this.makeGraphRequest<any>('/me/joinedTeams', accessToken);
      
      if (teams.length === 0) {
        return [];
      }

      // Get messages from the first team's general channel
      const teamId = teams[0].id;
      const channels = await this.makeGraphRequest<any>(`/teams/${teamId}/channels`, accessToken);
      
      if (channels.length === 0) {
        return [];
      }

      const channelId = channels[0].id;
      const endpoint = _fullSync 
        ? `/teams/${teamId}/channels/${channelId}/messages?$top=50`
        : `/teams/${teamId}/channels/${channelId}/messages?$top=25&$orderby=createdDateTime desc`;
      
      return await this.makeGraphRequest<TeamsMessage>(endpoint, accessToken);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Teams messages');
      return [];
    }
  }

  private async fetchTasks(accessToken: string, fullSync: boolean): Promise<Task[]> {
    try {
      // Microsoft To Do tasks
      const endpoint = _fullSync 
        ? '/me/todo/lists/tasks/tasks?$top=100'
        : '/me/todo/lists/tasks/tasks?$top=50&$filter=status ne \'completed\'';
      
      return await this.makeGraphRequest<Task>(endpoint, accessToken);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch tasks');
      return [];
    }
  }

  private async fetchNotes(accessToken: string, fullSync: boolean): Promise<Note[]> {
    try {
      // OneNote pages
      const notebooks = await this.makeGraphRequest<any>('/me/onenote/notebooks', accessToken);
      
      if (notebooks.length === 0) {
        return [];
      }

      const notebookId = notebooks[0].id;
      const sections = await this.makeGraphRequest<any>(`/me/onenote/notebooks/${notebookId}/sections`, accessToken);
      
      if (sections.length === 0) {
        return [];
      }

      const sectionId = sections[0].id;
      const endpoint = _fullSync 
        ? `/me/onenote/sections/${sectionId}/pages?$top=100`
        : `/me/onenote/sections/${sectionId}/pages?$top=50&$orderby=lastModifiedDateTime desc`;
      
      return await this.makeGraphRequest<Note>(endpoint, accessToken);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch notes');
      return [];
    }
  }

  async sync(options: { userId: string; fullSync?: boolean }): Promise<SyncResult> {
    try {
      logger.info({ userId: options.userId, fullSync: options.fullSync }, 'Starting Microsoft 365 sync');
      
      const result = await syncIntegration({ integration: this, ...options });
      
      // Store sync metadata
      await this.updateSyncMetadata(options.userId, {
        lastSync: new Date().toISOString(),
        syncType: options.fullSync ? 'full' : 'incremental',
        dataPoints: Object.values(result).reduce((sum: number, items: any[]) => sum + (Array.isArray(items) ? items.length: 0), 0)
      });

      logger.info({ userId: options.userId, result }, 'Microsoft 365 sync completed');
      return result;
    } catch (error) {
      logger.error({ userId: options.userId, error }, 'Microsoft 365 sync failed');
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
      logger.error({ userId, error }, 'Failed to update sync metadata');
    }
  }

  async testConnection(userId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken(userId);
      const userInfo = await this.makeGraphRequest<any>('/me', accessToken);
      return userInfo.length > 0;
    } catch (error) {
      logger.error({ userId, error }, 'Microsoft 365 connection test failed');
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
        return { connected: false, error: 'Not connected to Microsoft 365' };
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
      logger.error({ userId, error }, 'Failed to get Microsoft 365 connection status');
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
      logger.info({ userId }, 'Testing Microsoft 365 integration');
      
      // Test connection
      const connected = await this.testConnection(userId);
      if (!connected) {
        return {
          success: false,
          message: 'Connection test failed',
          error: 'Unable to connect to Microsoft Graph API'
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

      // Test user info endpoint
      const userInfo = await this.makeGraphRequest<any>('/me', accessToken);
      
      if (userInfo.length === 0) {
        return {
          success: false,
          message: 'User info not accessible',
          error: 'Insufficient permissions or API error'
        };
      }

      const user = userInfo[0];
      
      return {
        success: true,
        message: 'Microsoft 365 integration is working correctly',
        data: {
          user: {
            id: user.id,
            displayName: user.displayName,
            mail: user.mail,
            userPrincipalName: user.userPrincipalName
          },
          scopes: user.scopes || [],
          lastTested: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error({ userId, error }, 'Microsoft 365 integration test failed');
      return {
        success: false,
        message: 'Integration test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 