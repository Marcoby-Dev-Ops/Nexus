const { query } = require('../database/connection');
const { logger } = require('../utils/logger');

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
      updated_at: new Date().toISOString()
    };
  }
}

module.exports = { userPreferencesService: new UserPreferencesService() };
