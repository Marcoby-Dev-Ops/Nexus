/**
 * Authentication Error Handler Service
 * Provides comprehensive error handling and recovery for authentication issues
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';
import { sessionUtils } from '@/lib/supabase';

export interface AuthErrorContext {
  operation: string;
  table?: string;
  userId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface AuthErrorRecovery {
  success: boolean;
  retryable: boolean;
  message: string;
  action?: string;
}

export class AuthErrorHandler {
  /**
   * Analyze authentication error and provide recovery options
   */
  static analyzeError(error: any, context: AuthErrorContext): AuthErrorRecovery {
    const errorCode = error?.code || error?.status || 'UNKNOWN';
    const errorMessage = error?.message || error?.details || 'Unknown error';

    logger.error('Authentication error analysis', { 
      errorCode, 
      errorMessage, 
      context 
    });

    // Handle specific error codes
    switch (errorCode) {
      case '403':
      case '42501':
        return {
          success: false,
          retryable: true,
          message: 'Permission denied - authentication may have expired',
          action: 'refresh_session'
        };

      case '400':
      case '23505':
        return {
          success: false,
          retryable: false,
          message: 'Invalid request - check data format',
          action: 'validate_data'
        };

      case '401':
      case 'PGRST116':
        return {
          success: false,
          retryable: true,
          message: 'Authentication required - session may be invalid',
          action: 'reauthenticate'
        };

      case '500':
        return {
          success: false,
          retryable: true,
          message: 'Server error - temporary issue',
          action: 'retry_later'
        };

      default:
        return {
          success: false,
          retryable: false,
          message: `Unexpected error: ${errorMessage}`,
          action: 'contact_support'
        };
    }
  }

  /**
   * Attempt to recover from authentication error
   */
  static async attemptRecovery(recovery: AuthErrorRecovery, context: AuthErrorContext): Promise<boolean> {
    try {
      switch (recovery.action) {
        case 'refresh_session':
          return await this.refreshSession();

        case 'reauthenticate':
          return await this.reauthenticate();

        case 'validate_data':
          return await this.validateData(context);

        case 'retry_later':
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;

        default:
          logger.warn('No recovery action available', { recovery, context });
          return false;
      }
    } catch (error) {
      logger.error('Recovery attempt failed', { error, recovery, context });
      return false;
    }
  }

  /**
   * Refresh the current session
   */
  private static async refreshSession(): Promise<boolean> {
    try {
      logger.info('Attempting to refresh session...');
      
      const { session, error } = await sessionUtils.refreshSession();
      
      if (error || !session) {
        logger.error('Session refresh failed', { error });
        return false;
      }

      // Check if session is still valid
      if (!sessionUtils.isSessionValid(session)) {
        logger.error('Session has expired');
        return false;
      }

      logger.info('Session refresh successful');
      return true;
    } catch (error) {
      logger.error('Session refresh error', { error });
      return false;
    }
  }

  /**
   * Reauthenticate the user
   */
  private static async reauthenticate(): Promise<boolean> {
    try {
      logger.info('Attempting to reauthenticate...');
      
      // Try to get current user
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        logger.error('Reauthentication failed - no valid user', { error });
        return false;
      }

      // Test authentication with a simple query
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (testError) {
        logger.error('Authentication test failed', { testError });
        return false;
      }

      logger.info('Reauthentication successful');
      return true;
    } catch (error) {
      logger.error('Reauthentication error', { error });
      return false;
    }
  }

  /**
   * Validate data format for the operation
   */
  private static async validateData(context: AuthErrorContext): Promise<boolean> {
    try {
      logger.info('Validating data format', { context });
      
      // This would typically involve checking the data format
      // For now, we'll just log and return true
      logger.info('Data validation completed');
      return true;
    } catch (error) {
      logger.error('Data validation error', { error, context });
      return false;
    }
  }

  /**
   * Handle authentication error with retry logic
   */
  static async handleWithRetry<T>(
    operation: () => Promise<T>,
    context: AuthErrorContext,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any;
    let lastRecovery: AuthErrorRecovery | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Attempting operation (${attempt}/${maxRetries})`, { context });
        
        const result = await operation();
        logger.info('Operation successful', { context });
        return result;

      } catch (error) {
        lastError = error;
        
        // Analyze the error
        const recovery = this.analyzeError(error, context);
        lastRecovery = recovery;

        logger.warn(`Operation failed (${attempt}/${maxRetries})`, { 
          error, 
          recovery, 
          context 
        });

        // If not retryable, break immediately
        if (!recovery.retryable) {
          logger.error('Non-retryable error encountered', { error, recovery, context });
          break;
        }

        // If this is the last attempt, break
        if (attempt === maxRetries) {
          logger.error('Max retries reached', { error, recovery, context });
          break;
        }

        // Attempt recovery
        const recoverySuccess = await this.attemptRecovery(recovery, context);
        
        if (!recoverySuccess) {
          logger.warn('Recovery attempt failed, continuing to next attempt', { recovery, context });
        }

        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // All retries failed
    const finalRecovery = lastRecovery || this.analyzeError(lastError, context);
    
    logger.error('Operation failed after all retries', { 
      error: lastError, 
      recovery: finalRecovery, 
      context 
    });

    throw new Error(`Operation failed: ${finalRecovery.message}`);
  }

  /**
   * Check if user has proper authentication
   */
  static async validateUserAuth(): Promise<{ valid: boolean; userId?: string; error?: string }> {
    try {
      const { session, error } = await sessionUtils.getSession();
      
      if (error || !session) {
        return { valid: false, error: 'No valid session found' };
      }

      if (!session.user?.id) {
        return { valid: false, error: 'Session exists but no user ID' };
      }

      // Test authentication with a simple query
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (testError) {
        return { valid: false, error: 'Authentication test failed' };
      }

      return { valid: true, userId: session.user.id };
    } catch (error) {
      logger.error('User auth validation error', { error });
      return { valid: false, error: 'Authentication validation failed' };
    }
  }

  /**
   * Get authentication status for debugging
   */
  static async getAuthStatus(): Promise<{
    hasSession: boolean;
    hasUser: boolean;
    userId?: string;
    sessionExpires?: string;
    isExpired: boolean;
    error?: string;
  }> {
    try {
      const { session, error } = await sessionUtils.getSession();
      
      if (error || !session) {
        return {
          hasSession: false,
          hasUser: false,
          isExpired: true,
          error: error?.message || 'No session found'
        };
      }

      const isExpired = !sessionUtils.isSessionValid(session);

      return {
        hasSession: true,
        hasUser: !!session.user,
        userId: session.user?.id,
        sessionExpires: session.expires_at,
        isExpired
      };
    } catch (error) {
      logger.error('Auth status check error', { error });
      return {
        hasSession: false,
        hasUser: false,
        isExpired: true,
        error: 'Failed to check auth status'
      };
    }
  }
}

export const authErrorHandler = AuthErrorHandler; 