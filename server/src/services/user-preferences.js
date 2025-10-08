const { query } = require('../database/connection');
const { logger } = require('../utils/logger');

const DEFAULT_NOTIFICATION_SETTINGS = {
  global_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  channels: {
    email: {
      name: 'Email',
      type: 'email',
      enabled: true
    },
    push: {
      name: 'Push Notifications',
      type: 'push',
      enabled: true
    },
    in_app: {
      name: 'In-App',
      type: 'in_app',
      enabled: true
    }
  },
  categories: {
    security: {
      name: 'Security & Privacy',
      description: 'Login alerts, password changes, and security updates',
      channels: {
        email: true,
        push: true,
        sms: false,
        in_app: true
      },
      frequency: 'immediate'
    },
    business: {
      name: 'Business Updates',
      description: 'Important business metrics and performance alerts',
      channels: {
        email: true,
        push: false,
        sms: false,
        in_app: true
      },
      frequency: 'daily'
    },
    integrations: {
      name: 'Integration Status',
      description: 'Integration sync status and connection issues',
      channels: {
        email: false,
        push: true,
        sms: false,
        in_app: true
      },
      frequency: 'immediate'
    },
    team: {
      name: 'Team Activity',
      description: 'Team member activities and collaboration updates',
      channels: {
        email: false,
        push: false,
        sms: false,
        in_app: true
      },
      frequency: 'daily'
    },
    calendar: {
      name: 'Calendar & Events',
      description: 'Meeting reminders and calendar updates',
      channels: {
        email: true,
        push: true,
        sms: false,
        in_app: true
      },
      frequency: 'immediate'
    },
    documents: {
      name: 'Document Updates',
      description: 'Document changes and collaboration updates',
      channels: {
        email: false,
        push: false,
        sms: false,
        in_app: true
      },
      frequency: 'daily'
    },
    billing: {
      name: 'Billing & Payments',
      description: 'Payment confirmations and billing alerts',
      channels: {
        email: true,
        push: false,
        sms: false,
        in_app: true
      },
      frequency: 'immediate'
    },
    analytics: {
      name: 'Analytics & Insights',
      description: 'Performance reports and trend analysis',
      channels: {
        email: true,
        push: false,
        sms: false,
        in_app: true
      },
      frequency: 'weekly'
    }
  }
};

const cloneJson = (value) => JSON.parse(JSON.stringify(value));

const deepMerge = (target, source) => {
  if (!source || typeof source !== 'object') {
    return target;
  }

  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = deepMerge(
        target[key] && typeof target[key] === 'object' ? { ...target[key] } : {},
        value
      );
    } else {
      target[key] = value;
    }
  });

  return target;
};

const mergeNotificationSettings = (storedSettings) =>
  deepMerge(cloneJson(DEFAULT_NOTIFICATION_SETTINGS), storedSettings || {});

class UserPreferencesService {
  /**
   * Get user preferences by user ID
   */
  async get(userId) {
    try {
      logger.info('Fetching user preferences from database', { userId });

      // Use PostgreSQL function to get user preferences
      const sql = `SELECT * FROM get_user_preferences($1)`;
      
      const result = await query(sql, [userId]);
      
      if (!result || result.error) {
        // No preferences found, return default preferences
        logger.info('No preferences found, returning defaults', { userId });
        return { 
          data: this.getDefaultPreferences(userId), 
          error: null, 
          success: true 
        };
      }

      if (!result.data || result.data.length === 0) {
        // No preferences found, return default preferences
        logger.info('No preferences found, returning defaults', { userId });
        return { 
          data: this.getDefaultPreferences(userId), 
          error: null, 
          success: true 
        };
      }

      const preferences = result.data[0];
      logger.info('User preferences fetched successfully', { userId, preferencesId: preferences.id });
      return { data: preferences, error: null, success: true };
    } catch (error) {
      logger.error('Error fetching user preferences:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  }

  /**
   * Create or update user preferences
   */
  async upsert(userId, preferences) {
    try {
      logger.info('Upserting user preferences in database', { userId, preferences });

      // Use PostgreSQL function to upsert user preferences
      const sql = `SELECT * FROM upsert_user_preferences($1, $2)`;
      const preferencesJson = JSON.stringify(preferences);
      
      const result = await query(sql, [userId, preferencesJson]);
      
      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to upsert preferences');
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('No data returned from upsert operation');
      }

      const upsertedPreferences = result.data[0];
      logger.info('User preferences upserted successfully', { userId, preferencesId: upsertedPreferences.id });
      return { data: upsertedPreferences, error: null, success: true };
    } catch (error) {
      logger.error('Error upserting user preferences:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  }

  /**
   * Update specific preference fields
   */
  async update(userId, updates) {
    try {
      logger.info('Updating user preferences in database', { userId, updates });

      // Use PostgreSQL function to update user preferences
      const sql = `SELECT * FROM update_user_preferences($1, $2)`;
      const updatesJson = JSON.stringify(updates);
      
      const result = await query(sql, [userId, updatesJson]);
      
      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to update preferences');
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('No data returned from update operation');
      }

      const updatedPreferences = result.data[0];
      logger.info('User preferences updated successfully', { userId, preferencesId: updatedPreferences.id });
      return { data: updatedPreferences, error: null, success: true };
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      };
    }
  }

  /**
   * Get default preferences for a new user
   */
  getDefaultPreferences(userId) {
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
      updated_at: new Date().toISOString(),
      preferences: {
        notification_settings: cloneJson(DEFAULT_NOTIFICATION_SETTINGS)
      }
    };
  }

  getDefaultNotificationSettings() {
    return cloneJson(DEFAULT_NOTIFICATION_SETTINGS);
  }

  async getNotificationSettings(userId) {
    const result = await this.get(userId);

    if (!result.success) {
      return { data: null, error: result.error, success: false };
    }

    const storedPreferences =
      (result.data && result.data.preferences && result.data.preferences.notification_settings) || {};

    return {
      data: mergeNotificationSettings(storedPreferences),
      error: null,
      success: true
    };
  }

  async updateNotificationSettings(userId, notificationSettings = {}) {
    const mergedSettings = mergeNotificationSettings(notificationSettings);

    const updatesPayload = {
      notifications_enabled: mergedSettings.global_enabled,
      email_notifications: mergedSettings.channels?.email?.enabled ?? true,
      push_notifications: mergedSettings.channels?.push?.enabled ?? false,
      notification_settings: mergedSettings
    };

    const result = await this.update(userId, updatesPayload);

    if (!result.success) {
      return { data: null, error: result.error, success: false };
    }

    const updatedPreferences =
      (result.data && result.data.preferences && result.data.preferences.notification_settings) ||
      mergedSettings;

    return {
      data: mergeNotificationSettings(updatedPreferences),
      error: null,
      success: true
    };
  }
}

module.exports = { userPreferencesService: new UserPreferencesService() };
