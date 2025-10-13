import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';

// Import the getAuthHeaders function from api-client (re-exported by database)
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
   * Optionally accepts userEmail to retry authorization mismatch cases.
   */
  async get(userId: string, userEmail?: string): Promise<ServiceResponse<UserPreferences>> {
    // This service operates over the API in all environments.
    return this.getFromAPI(userId, userEmail);
  }

  /**
   * Create or update user preferences
   */
  async upsert(userId: string, preferences: Partial<UserPreferences>, userEmail?: string): Promise<ServiceResponse<UserPreferences>> {
    return this.upsertViaAPI(userId, preferences, userEmail);
  }

  /**
   * Update specific preference fields
   */
  async update(userId: string, updates: Partial<UserPreferences>, userEmail?: string): Promise<ServiceResponse<UserPreferences>> {
    return this.updateViaAPI(userId, updates, userEmail);
  }

  /**
   * Browser API methods
   */
  private async getFromAPI(userId: string, userEmail?: string): Promise<ServiceResponse<UserPreferences>> {
    try {
      const response = await fetch(`/api/user-preferences?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: await getAuthHeaders(),
      });

      const contentType = response.headers.get('content-type') ?? '';
      let payload: any;

      if (contentType.includes('application/json')) {
        payload = await response.json();
      } else {
        const rawText = await response.text();

        try {
          payload = JSON.parse(rawText);
        } catch {
          logger.warn('Received non-JSON response when fetching user preferences', {
            userId,
            status: response.status,
            preview: rawText.slice(0, 120),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Successful response but unexpected format – fall back to defaults
          return this.createSuccessResponse(this.getDefaultPreferences(userId));
        }
      }

      if (!response.ok) {
        // Handle common auth/route cases gracefully
        if (response.status === 401) {
          // Unauthenticated: return defaults to keep UI functional
          logger.warn('Unauthenticated when fetching user preferences; returning defaults', { userId });
          return this.createSuccessResponse(this.getDefaultPreferences(userId));
        }

        if (response.status === 403 && userEmail && userEmail !== userId) {
          // Mismatch between token userId and requested id; retry with email
          logger.warn('403 on preferences fetch, retrying with user email', { userId, userEmail });
          return this.getFromAPI(userEmail);
        }

        if (response.status === 404) {
          // In dev, try the unauthenticated test endpoint to diagnose proxy/route issues
          const isDev = typeof import.meta !== 'undefined' && (import.meta as any)?.env?.DEV;
          if (isDev) {
            try {
              const probe = await fetch(`/api/user-preferences/test?userId=${encodeURIComponent(userId)}`);
              logger.warn('Preferences route 404; test probe result', { status: probe.status });
            } catch (e) {
              logger.warn('Preferences test probe failed', { error: e instanceof Error ? e.message : String(e) });
            }
          }
          // Fall back to defaults
          return this.createSuccessResponse(this.getDefaultPreferences(userId));
        }

        const errorMessage =
          (payload && typeof payload === 'object' && 'error' in payload && (payload as any).error) ||
          `HTTP error! status: ${response.status}`;
        throw new Error(String(errorMessage));
      }

      if (payload?.success) {
        return this.createResponse(payload.data);
      }

      const error = payload?.error || 'Failed to fetch preferences';
      return this.createErrorResponse(error);
    } catch (error) {
      logger.warn('Failed to fetch user preferences from API, returning defaults', {
        userId,
        error,
      });
      return this.createSuccessResponse(this.getDefaultPreferences(userId));
    }
  }

  private async upsertViaAPI(userId: string, preferences: Partial<UserPreferences>, userEmail?: string): Promise<ServiceResponse<UserPreferences>> {
    try {
      const response = await fetch(`/api/user-preferences?userId=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        if (response.status === 403 && userEmail && userEmail !== userId) {
          logger.warn('403 on preferences upsert, retrying with user email', { userId, userEmail });
          return this.upsertViaAPI(userEmail, preferences);
        }
        if (response.status === 401 || response.status === 404) {
          // Don’t fail hard; return defaults
          return this.createSuccessResponse(this.getDefaultPreferences(userId));
        }
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

  private async updateViaAPI(userId: string, updates: Partial<UserPreferences>, userEmail?: string): Promise<ServiceResponse<UserPreferences>> {
    try {
      const response = await fetch(`/api/user-preferences?userId=${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 403 && userEmail && userEmail !== userId) {
          logger.warn('403 on preferences update, retrying with user email', { userId, userEmail });
          return this.updateViaAPI(userEmail, updates);
        }
        if (response.status === 401 || response.status === 404) {
          return this.createSuccessResponse(this.getDefaultPreferences(userId));
        }
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

  /**
   * Expose default preferences for consumers needing a safe fallback
   */
  public getDefaultPreferencesForUser(userId: string): UserPreferences {
    return this.getDefaultPreferences(userId);
  }
}

export const userPreferencesService = new UserPreferencesService();
