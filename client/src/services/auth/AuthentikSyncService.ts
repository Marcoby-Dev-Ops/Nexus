/**
 * Authentik User Sync Service
 * 
 * Handles synchronization of user profile and company data from Authentik
 * to the Nexus user profile and company records on login/authentication.
 */

import { logger } from '@/shared/utils/logger';

export interface AuthentikSyncResult {
  success: boolean;
  userProfile?: any;
  company?: any;
  error?: string;
  synced?: {
    profile: boolean;
    company: boolean;
  };
}

class AuthentikSyncService {
  /**
   * Sync user profile and company data from Authentik on login
   * This is called automatically during the authentication process
   */
  async syncUserOnLogin(userId: string): Promise<AuthentikSyncResult> {
    try {
      logger.info('Starting Authentik user sync on login', { userId });

      // Call the server-side RPC to sync user data
      // The server will use the JWT payload to extract Authentik data
      const { data, error } = await callRPC('sync_authentik_user_data', { 
        user_id: userId 
      });

      if (error) {
        logger.error('Failed to sync Authentik user data', { userId, error });
        return {
          success: false,
          error: error.message || 'Failed to sync user data from Authentik'
        };
      }

      logger.info('Authentik user sync completed successfully', { 
        userId,
        profileSynced: data?.profile_synced || false,
        companySynced: data?.company_synced || false
      });

      return {
        success: true,
        userProfile: data?.user_profile,
        company: data?.company,
        synced: {
          profile: data?.profile_synced || false,
          company: data?.company_synced || false
        }
      };

    } catch (error) {
      logger.error('Error during Authentik user sync', { userId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      };
    }
  }

  /**
   * Force refresh user profile data from Authentik
   * This can be called manually to re-sync data
   */
  async forceRefreshFromAuthentik(userId: string): Promise<AuthentikSyncResult> {
    try {
      logger.info('Force refreshing user data from Authentik', { userId });

      const { data, error } = await callRPC('force_sync_authentik_user', { 
        user_id: userId 
      });

      if (error) {
        logger.error('Failed to force refresh from Authentik', { userId, error });
        return {
          success: false,
          error: error.message || 'Failed to refresh user data from Authentik'
        };
      }

      return {
        success: true,
        userProfile: data?.user_profile,
        company: data?.company,
        synced: {
          profile: data?.profile_synced || false,
          company: data?.company_synced || false
        }
      };

    } catch (error) {
      logger.error('Error during forced Authentik refresh', { userId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown refresh error'
      };
    }
  }

  /**
   * Get sync status for a user
   * Shows what data has been synced from Authentik
   */
  async getSyncStatus(userId: string): Promise<{
    success: boolean;
    lastSync?: string;
    syncedFields?: string[];
    completionPercentage?: number;
    error?: string;
  }> {
    try {
      const { data, error } = await callRPC('get_authentik_sync_status', { 
        user_id: userId 
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to get sync status'
        };
      }

      return {
        success: true,
        lastSync: data?.last_sync,
        syncedFields: data?.synced_fields || [],
        completionPercentage: data?.completion_percentage || 0
      };

    } catch (error) {
      logger.error('Error getting Authentik sync status', { userId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown status error'
      };
    }
  }
}

// Export singleton instance
export const authentikSyncService = new AuthentikSyncService();