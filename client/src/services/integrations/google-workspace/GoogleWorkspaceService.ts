import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, upsertOne, callEdgeFunction } from '@/lib/database';
import { logger } from '@/shared/utils/logger';
import { retryFetch } from '@/shared/utils/retry';
import { createGoogleWorkspaceAuthUrl } from './utils';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { getApiBaseUrl } from '@/core/apiBase';

// Google Workspace data types
export interface GoogleWorkspaceTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
}

export interface GoogleWorkspaceUser {
  id: string;
  primaryEmail: string;
  name: {
    givenName: string;
    familyName: string;
    fullName: string;
  };
  emails: Array<{
    address: string;
    primary: boolean;
  }>;
  organizations: Array<{
    title: string;
    department: string;
    location: string;
  }>;
  isAdmin: boolean;
  suspended: boolean;
  creationTime: string;
  lastLoginTime: string;
}

export interface GoogleWorkspaceGroup {
  id: string;
  email: string;
  name: string;
  description: string;
  adminCreated: boolean;
  directMembersCount: string;
  members: Array<{
    id: string;
    email: string;
    role: string;
  }>;
}

export interface GoogleWorkspaceDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  createdTime: string;
  modifiedTime: string;
  owners: Array<{
    displayName: string;
    emailAddress: string;
  }>;
  permissions: Array<{
    id: string;
    type: string;
    role: string;
    emailAddress?: string;
  }>;
  webViewLink: string;
  webContentLink?: string;
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
  attendees: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  organizer: {
    email: string;
    displayName?: string;
  };
  created: string;
  updated: string;
}

export interface GoogleWorkspaceIntegrationData {
  users: GoogleWorkspaceUser[];
  groups: GoogleWorkspaceGroup[];
  driveFiles: GoogleWorkspaceDriveFile[];
  calendarEvents: GoogleWorkspaceCalendarEvent[];
  lastSync: string;
}

export class GoogleWorkspaceService extends BaseService {
  private readonly apiBaseUrl = 'https://www.googleapis.com/admin/directory/v1';
  private readonly driveApiUrl = 'https://www.googleapis.com/drive/v3';
  private readonly calendarApiUrl = 'https://www.googleapis.com/calendar/v3';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  /**
   * Get valid Google Workspace tokens for a user
   * Automatically refreshes tokens if they're expired
   */
  async getValidTokens(userId: string): Promise<ServiceResponse<GoogleWorkspaceTokens>> {
    return this.executeDbOperation(async () => {
      try {
        // Get the user's Google Workspace integration
        const { data: userIntegration, success, error: integrationError } = await selectOne<any>(
          'user_integrations',
          { user_id: userId, integration_slug: 'Google Workspace' }
        );

        if (!success || !userIntegration) {
          return {
            data: null,
            error: integrationError || 'Google Workspace integration not found',
            success: false
          };
        }

        if (userIntegration.status !== 'connected') {
          return { data: null, error: 'Google Workspace integration is not connected', success: false };
        }

        const config = userIntegration.config as any;
        const expiresAt = new Date(config.expires_at);
        const now = new Date();

        // Check if token is expired (with 5 minute buffer)
        if (expiresAt.getTime() > now.getTime() + 300000) {
          // Token is still valid
          return {
            data: {
              access_token: config.access_token,
              refresh_token: config.refresh_token,
              expires_at: config.expires_at,
              scope: config.scope,
            },
            error: null,
            success: true
          };
        }

        // Token is expired, refresh it
        this.logger.info('Google Workspace token expired, refreshing...', { userId, expiresAt });

        const refreshResult = await this.refreshTokens(userId, config.refresh_token);

        if (!refreshResult.success) {
          return { data: null, error: refreshResult.error || 'Failed to refresh tokens', success: false };
        }

        return { data: refreshResult.data!, error: null, success: true };
      } catch (error) {
        this.logger.error('Error getting valid Google Workspace tokens', { error, userId });
        return { data: null, error: 'Failed to get valid tokens', success: false };
      }
    }, `get valid Google Workspace tokens for user ${userId}`);
  }

  /**
   * Refresh Google Workspace tokens using the refresh token
   */
  async refreshTokens(userId: string, refreshToken: string): Promise<ServiceResponse<GoogleWorkspaceTokens>> {
    try {
      const result = await authentikAuthService.getSession();
      const session = result.data;

      if (!session?.accessToken) {
        return this.createErrorResponse('No valid session found');
      }

      const response = await retryFetch(`${getApiBaseUrl()}/api/google/workspace/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse(`Token refresh failed: ${errorData.error || response.statusText}`);
      }

      const tokenData = await response.json();

      // Update the stored tokens
      const { success: updateSuccess, error: updateError } = await updateOne(
        'user_integrations',
        { user_id: userId, integration_slug: 'Google Workspace' },
        {
          config: {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || refreshToken,
            expires_at: tokenData.expires_at,
            scope: tokenData.scope,
          },
          updated_at: new Date().toISOString(),
        }
      );

      if (updateError) {
        this.logger.error('Failed to update refreshed tokens', { error: updateError, userId });
        return this.createErrorResponse('Failed to update refreshed tokens');
      }

      return this.createSuccessResponse({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken,
        expires_at: tokenData.expires_at,
        scope: tokenData.scope,
      });
    } catch (error) {
      return this.handleError(error, 'refresh Google Workspace tokens');
    }
  }

  /**
   * Check if user has a valid Google Workspace connection
   */
  async hasValidConnection(userId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: userIntegration, success, error } = await selectOne<any>(
          'user_integrations',
          { user_id: userId, integration_name: 'Google Workspace' }
        );

        if (!success || !userIntegration) {
          return { data: false, error: error || null, success: true };
        }

        if (userIntegration.status !== 'connected') {
          return { data: false, error: null, success: true };
        }

        // Check if token is expired
        const config = userIntegration.config as any;
        if (!config.expires_at) {
          return { data: false, error: null, success: true };
        }

        const expiresAt = new Date(config.expires_at);
        const now = new Date();
        const isValid = expiresAt.getTime() > now.getTime() + 300000; // 5 minute buffer

        return { data: isValid, error: null, success: true };
      } catch (error) {
        this.logger.error('Error checking Google Workspace connection', { error, userId });
        return { data: false, error: null, success: true };
      }
    }, `check Google Workspace connection for user ${userId}`);
  }

  /**
   * Get connection status for Google Workspace integration
   */
  async getConnectionStatus(userId: string): Promise<ServiceResponse<{
    connected: boolean;
    status: string;
    lastSync?: string;
    expiresAt?: string;
  }>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: userIntegration, success, error } = await selectOne<any>(
          'user_integrations',
          { user_id: userId, integration_name: 'Google Workspace' }
        );

        if (!success || !userIntegration) {
          return {
            data: {
              connected: false,
              status: 'not_connected',
            },
            error: error || null,
            success: true
          } as ServiceResponse<{
            connected: boolean;
            status: string;
            lastSync?: string;
            expiresAt?: string;
          }>;
        }

        const config = userIntegration.config as any;
        const expiresAt = config?.expires_at ? new Date(config.expires_at) : null;
        const now = new Date();
        const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() + 300000 : true;

        return {
          data: {
            connected: userIntegration.status === 'connected' && !isExpired,
            status: userIntegration.status,
            lastSync: userIntegration.last_sync,
            expiresAt: config?.expires_at,
          },
          error: null,
          success: true
        };
      } catch (error) {
        this.logger.error('Error getting Google Workspace connection status', { error, userId });
        return { data: null, error: 'Failed to get connection status', success: false };
      }
    }, `get Google Workspace connection status for user ${userId}`);
  }

  /**
   * Sync Google Workspace data with intelligence
   */
  async syncGoogleWorkspaceDataWithIntelligence(userId: string): Promise<ServiceResponse<{
    usersSynced: number;
    groupsSynced: number;
    driveFilesSynced: number;
    calendarEventsSynced: number;
    lastSync: string;
  }>> {
    try {
      // Get valid access token
      const tokenResult = await this.getValidTokens(userId);
      if (!tokenResult.success || !tokenResult.data) {
        return this.createErrorResponse('Failed to get valid access token');
      }

      const accessToken = tokenResult.data.access_token;

      // Fetch data from Google Workspace APIs
      const [users, groups, driveFiles, calendarEvents] = await Promise.all([
        this.fetchGoogleWorkspaceUsers(accessToken),
        this.fetchGoogleWorkspaceGroups(accessToken),
        this.fetchGoogleWorkspaceDriveFiles(accessToken),
        this.fetchGoogleWorkspaceCalendarEvents(accessToken),
      ]);

      // Store data in database
      const [usersSynced, groupsSynced, driveFilesSynced, calendarEventsSynced] = await Promise.all([
        this.storeUsers(users, userId),
        this.storeGroups(groups, userId),
        this.storeDriveFiles(driveFiles, userId),
        this.storeCalendarEvents(calendarEvents, userId),
      ]);

      // Update integration status
      await this.updateIntegrationStatus(userId, {
        last_sync: new Date().toISOString(),
        status: 'connected',
      });

      const lastSync = new Date().toISOString();

      this.logger.info('Google Workspace data sync completed', {
        userId,
        usersSynced,
        groupsSynced,
        driveFilesSynced,
        calendarEventsSynced,
        lastSync,
      });

      return this.createSuccessResponse({
        usersSynced,
        groupsSynced,
        driveFilesSynced,
        calendarEventsSynced,
        lastSync,
      });
    } catch (error) {
      return this.handleError(error, 'sync Google Workspace data');
    }
  }

  /**
   * Fetch Google Workspace users
   */
  private async fetchGoogleWorkspaceUsers(accessToken: string): Promise<GoogleWorkspaceUser[]> {
    try {
      const response = await retryFetch(`${this.apiBaseUrl}/users?maxResults=500`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data = await response.json();
      return data.users || [];
    } catch (error) {
      this.logger.error('Error fetching Google Workspace users', { error });
      return [];
    }
  }

  /**
   * Fetch Google Workspace groups
   */
  private async fetchGoogleWorkspaceGroups(accessToken: string): Promise<GoogleWorkspaceGroup[]> {
    try {
      const response = await retryFetch(`${this.apiBaseUrl}/groups?maxResults=500`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.statusText}`);
      }

      const data = await response.json();
      return data.groups || [];
    } catch (error) {
      this.logger.error('Error fetching Google Workspace groups', { error });
      return [];
    }
  }

  /**
   * Fetch Google Workspace Drive files
   */
  private async fetchGoogleWorkspaceDriveFiles(accessToken: string): Promise<GoogleWorkspaceDriveFile[]> {
    try {
      const response = await retryFetch(`${this.driveApiUrl}/files?pageSize=1000&fields=files(id,name,mimeType,size,createdTime,modifiedTime,owners,permissions,webViewLink,webContentLink)`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Drive files: ${response.statusText}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      this.logger.error('Error fetching Google Workspace Drive files', { error });
      return [];
    }
  }

  /**
   * Fetch Google Workspace Calendar events
   */
  private async fetchGoogleWorkspaceCalendarEvents(accessToken: string): Promise<GoogleWorkspaceCalendarEvent[]> {
    try {
      const response = await retryFetch(`${this.calendarApiUrl}/calendars/primary/events?maxResults=2500&timeMin=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Calendar events: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      this.logger.error('Error fetching Google Workspace Calendar events', { error });
      return [];
    }
  }

  /**
   * Store users in database
   */
  private async storeUsers(users: GoogleWorkspaceUser[], userId: string): Promise<number> {
    try {
      const userData = users.map(user => ({
        user_id: userId,
        integration_name: 'Google Workspace',
        data_type: 'users',
        external_id: user.id,
        data: user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      for (const data of userData) {
        const { success, error } = await upsertOne(
          'integration_data',
          data,
          'user_id,integration_name,data_type,external_id'
        );
        if (!success) {
          this.logger.error('Error storing Google Workspace users', { error });
        }
      }

      return users.length;
    } catch (error) {
      this.logger.error('Error storing Google Workspace users', { error });
      return 0;
    }
  }

  /**
   * Store groups in database
   */
  private async storeGroups(groups: GoogleWorkspaceGroup[], userId: string): Promise<number> {
    try {
      const groupData = groups.map(group => ({
        user_id: userId,
        integration_name: 'Google Workspace',
        data_type: 'groups',
        external_id: group.id,
        data: group,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      for (const data of groupData) {
        const { success, error } = await upsertOne(
          'integration_data',
          data,
          'user_id,integration_name,data_type,external_id'
        );
        if (!success) {
          this.logger.error('Error storing Google Workspace groups', { error });
        }
      }

      return groups.length;
    } catch (error) {
      this.logger.error('Error storing Google Workspace groups', { error });
      return 0;
    }
  }

  /**
   * Store Drive files in database
   */
  private async storeDriveFiles(files: GoogleWorkspaceDriveFile[], userId: string): Promise<number> {
    try {
      const fileData = files.map(file => ({
        user_id: userId,
        integration_name: 'Google Workspace',
        data_type: 'drive_files',
        external_id: file.id,
        data: file,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      for (const data of fileData) {
        const { success, error } = await upsertOne(
          'integration_data',
          data,
          'user_id,integration_name,data_type,external_id'
        );
        if (!success) {
          this.logger.error('Error storing Google Workspace files', { error });
        }
      }

      return files.length;
    } catch (error) {
      this.logger.error('Error storing Google Workspace Drive files', { error });
      return 0;
    }
  }

  /**
   * Store Calendar events in database
   */
  private async storeCalendarEvents(events: GoogleWorkspaceCalendarEvent[], userId: string): Promise<number> {
    try {
      const eventData = events.map(event => ({
        user_id: userId,
        integration_name: 'Google Workspace',
        data_type: 'calendar_events',
        external_id: event.id,
        data: event,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      for (const data of eventData) {
        const { success, error } = await upsertOne(
          'integration_data',
          data,
          'user_id,integration_name,data_type,external_id'
        );
        if (!success) {
          this.logger.error('Error storing Google Workspace events', { error });
        }
      }

      return events.length;
    } catch (error) {
      this.logger.error('Error storing Google Workspace Calendar events', { error });
      return 0;
    }
  }

  /**
   * Update integration status
   */
  private async updateIntegrationStatus(userId: string, status: any): Promise<void> {
    try {
      const { success, error } = await updateOne(
        'user_integrations',
        { user_id: userId, integration_name: 'Google Workspace' },
        {
          status: status.status,
          last_sync: status.last_sync,
          updated_at: new Date().toISOString(),
        }
      );

      if (error) {
        this.logger.error('Error updating Google Workspace integration status', { error });
      }
    } catch (error) {
      this.logger.error('Error updating Google Workspace integration status', { error });
    }
  }

  /**
   * Get Google Workspace integration data
   */
  async getGoogleWorkspaceData(userId: string): Promise<ServiceResponse<GoogleWorkspaceIntegrationData>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: integrationData, success, error } = await select<any>({
          table: 'integration_data',
          filters: {
            user_id: userId,
            integration_name: 'Google Workspace'
          }
        });

        if (!success || !integrationData) {
          return { data: null, error: error || 'Failed to fetch integration data', success: false };
        }

        const users = integrationData
          .filter(item => item.data_type === 'users')
          .map(item => item.data as GoogleWorkspaceUser);

        const groups = integrationData
          .filter(item => item.data_type === 'groups')
          .map(item => item.data as GoogleWorkspaceGroup);

        const driveFiles = integrationData
          .filter(item => item.data_type === 'drive_files')
          .map(item => item.data as GoogleWorkspaceDriveFile);

        const calendarEvents = integrationData
          .filter(item => item.data_type === 'calendar_events')
          .map(item => item.data as GoogleWorkspaceCalendarEvent);

        const lastSync = integrationData.length > 0
          ? Math.max(...integrationData.map(item => new Date(item.updated_at).getTime()))
          : new Date().toISOString();

        return {
          data: {
            users,
            groups,
            driveFiles,
            calendarEvents,
            lastSync: new Date(lastSync).toISOString(),
          },
          error: null,
          success: true
        };
      } catch (error) {
        this.logger.error('Error getting Google Workspace data', { error, userId });
        return { data: null, error: 'Failed to get integration data', success: false };
      }
    }, `get Google Workspace data for user ${userId}`);
  }
}
