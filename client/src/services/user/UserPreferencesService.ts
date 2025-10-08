import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';

// Import the getAuthHeaders function from api-client
import { getAuthHeaders } from '@/lib/database';

export interface UserPreferences {
  id?: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  dashboard_layout?: Record<string, any>;
  sidebar_collapsed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferencesFormData {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  sidebar_collapsed: boolean;
}

export class UserPreferencesService extends BaseService {
  private tableName = 'user_preferences';
  private isBrowser = typeof window !== 'undefined';

  /**
   * Get user preferences by user ID
   */
  async get(userId: string): Promise<ServiceResponse<UserPreferences>> {
    if (this.isBrowser) {
      return this.getFromAPI(userId);
    }
    
    return this.executeDbOperation(async () => {
      logger.info('Fetching user preferences', { userId });

      // Check if database is available
      if (!this.isDatabaseAvailable()) {
        logger.warn('Database not available, returning default preferences', { userId });
        return { data: this.getDefaultPreferences(userId), error: null };
      }

      // Use PostgreSQL function to get user preferences
      const sql = `SELECT * FROM get_user_preferences($1)`;
      
      const result = await this.db?.query(sql, [userId]);
      
      if (!result || result.error) {
        // No preferences found, return default preferences
        logger.info('No preferences found, returning defaults', { userId });
        return { data: this.getDefaultPreferences(userId), error: null };
      }

      if (!result.data || result.data.length === 0) {
        // No preferences found, return default preferences
        logger.info('No preferences found, returning defaults', { userId });
        return { data: this.getDefaultPreferences(userId), error: null };
      }

      const preferences = result.data[0] as UserPreferences;
      logger.info('User preferences fetched successfully', { userId, preferencesId: preferences.id });
      return { data: preferences, error: null };
    }, `get user preferences for user ${userId}`);
  }

  /**
   * Create or update user preferences
   */
  async upsert(userId: string, preferences: Partial<UserPreferences>): Promise<ServiceResponse<UserPreferences>> {
    if (this.isBrowser) {
      return this.upsertViaAPI(userId, preferences);
    }
    
    return this.executeDbOperation(async () => {
      logger.info('Upserting user preferences', { userId, preferences });

      // Check if database is available
      if (!this.isDatabaseAvailable()) {
        logger.warn('Database not available, returning default preferences', { userId });
        return { data: this.getDefaultPreferences(userId), error: null };
      }

      // Use PostgreSQL function to upsert user preferences
      const sql = `SELECT * FROM upsert_user_preferences($1, $2)`;
      const preferencesJson = JSON.stringify(preferences);
      
      const result = await this.db?.query(sql, [userId, preferencesJson]);
      
      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to upsert preferences');
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('No data returned from upsert operation');
      }

      const upsertedPreferences = result.data[0] as UserPreferences;
      logger.info('User preferences upserted successfully', { userId, preferencesId: upsertedPreferences.id });
      return { data: upsertedPreferences, error: null };
    }, `upsert user preferences for user ${userId}`);
  }

  /**
   * Update specific preference fields
   */
  async update(userId: string, updates: Partial<UserPreferences>): Promise<ServiceResponse<UserPreferences>> {
    if (this.isBrowser) {
      return this.updateViaAPI(userId, updates);
    }
    
    return this.executeDbOperation(async () => {
      logger.info('Updating user preferences', { userId, updates });

      // Check if database is available
      if (!this.isDatabaseAvailable()) {
        logger.warn('Database not available, returning default preferences', { userId });
        return { data: this.getDefaultPreferences(userId), error: null };
      }

      // Use PostgreSQL function to update user preferences
      const sql = `SELECT * FROM update_user_preferences($1, $2)`;
      const updatesJson = JSON.stringify(updates);
      
      const result = await this.db?.query(sql, [userId, updatesJson]);
      
      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to update preferences');
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('No data returned from update operation');
      }

      const updatedPreferences = result.data[0] as UserPreferences;
      logger.info('User preferences updated successfully', { userId, preferencesId: updatedPreferences.id });
      return { data: updatedPreferences, error: null };
    }, `update user preferences for user ${userId}`);
  }

  /**
   * Browser API methods
   */
  private async getFromAPI(userId: string): Promise<ServiceResponse<UserPreferences>> {
    try {
      const response = await fetch(`/api/user-preferences?userId=${userId}`, {
        method: 'GET',
        headers: await getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return this.createResponse(result.data);
      } else {
        return this.createErrorResponse(result.error || 'Failed to fetch preferences');
      }
    } catch (error) {
      return this.handleError(error, 'Failed to fetch user preferences from API');
    }
  }

  private async upsertViaAPI(userId: string, preferences: Partial<UserPreferences>): Promise<ServiceResponse<UserPreferences>> {
    try {
      const response = await fetch(`/api/user-preferences?userId=${userId}`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return this.createResponse(result.data);
      } else {
        return this.createErrorResponse(result.error || 'Failed to upsert preferences');
      }
    } catch (error) {
      return this.handleError(error, 'Failed to upsert user preferences via API');
    }
  }

  private async updateViaAPI(userId: string, updates: Partial<UserPreferences>): Promise<ServiceResponse<UserPreferences>> {
    try {
      const response = await fetch(`/api/user-preferences?userId=${userId}`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return this.createResponse(result.data);
      } else {
        return this.createErrorResponse(result.error || 'Failed to update preferences');
      }
    } catch (error) {
      return this.handleError(error, 'Failed to update user preferences via API');
    }
  }

  /**
   * Get default preferences for a new user
   */
  private getDefaultPreferences(userId: string): UserPreferences {
    return {
      user_id: userId,
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      notifications_enabled: true,
      email_notifications: true,
      push_notifications: false,
      dashboard_layout: {},
      sidebar_collapsed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

export const userPreferencesService = new UserPreferencesService();

