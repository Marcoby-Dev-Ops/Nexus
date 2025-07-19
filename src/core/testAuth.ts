/**
 * Authentication Test Utility
 * Used to verify that authentication is working correctly
 */

import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';

export async function testAuthentication(): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  canAccessDebugLogs: boolean;
  canAccessUserIntegrations: boolean;
  error?: string;
}> {
  try {
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logger.error({ error: sessionError }, 'Failed to get session');
      return {
        isAuthenticated: false,
        canAccessDebugLogs: false,
        canAccessUserIntegrations: false,
        error: sessionError.message
      };
    }

    if (!session) {
      logger.debug('No session found');
      return {
        isAuthenticated: false,
        canAccessDebugLogs: false,
        canAccessUserIntegrations: false,
        error: 'No authentication session'
      };
    }

    logger.info({ userId: session.user.id }, 'User is authenticated');

    // Test access to debug_logs table
    let canAccessDebugLogs = false;
    try {
      const { error: debugLogsError } = await supabase
        .from('debug_logs')
        .select('id')
        .limit(1);

      if (debugLogsError) {
        logger.error({ error: debugLogsError }, 'Failed to access debug_logs table');
        canAccessDebugLogs = false;
      } else {
        logger.info('Successfully accessed debug_logs table');
        canAccessDebugLogs = true;
      }
    } catch (error) {
      logger.error({ error }, 'Exception accessing debug_logs table');
      canAccessDebugLogs = false;
    }

    // Test access to user_integrations table
    let canAccessUserIntegrations = false;
    try {
      const { error: integrationsError } = await supabase
        .from('user_integrations')
        .select('id')
        .limit(1);

      if (integrationsError) {
        logger.error({ error: integrationsError }, 'Failed to access user_integrations table');
        canAccessUserIntegrations = false;
      } else {
        logger.info('Successfully accessed user_integrations table');
        canAccessUserIntegrations = true;
      }
    } catch (error) {
      logger.error({ error }, 'Exception accessing user_integrations table');
      canAccessUserIntegrations = false;
    }

    return {
      isAuthenticated: true,
      userId: session.user.id,
      canAccessDebugLogs,
      canAccessUserIntegrations
    };

  } catch (error) {
    logger.error({ error }, 'Error during authentication test');
    return {
      isAuthenticated: false,
      canAccessDebugLogs: false,
      canAccessUserIntegrations: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function testInsertDebugLog(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'No authentication session'
      };
    }

    const { data, error } = await supabase
      .from('debug_logs')
      .insert([
        {
          user_id: session.user.id,
          message: 'Test log entry from authentication test',
          level: 'info',
          metadata: { test: true, timestamp: new Date().toISOString() }
        }
      ])
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Failed to insert test debug log');
      return {
        success: false,
        error: error.message
      };
    }

    logger.info({ logId: data.id }, 'Successfully inserted test debug log');
    return { success: true };

  } catch (error) {
    logger.error({ error }, 'Exception during debug log insertion test');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 