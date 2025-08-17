import { msalInstance } from '@/shared/auth/msal';
import { BaseService } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
export interface Microsoft365Token {
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  scope: string;
  user_id: string;
  integration_id: string;
}

export class Microsoft365TokenService extends BaseService {
  private static instance: Microsoft365TokenService;

  public static getInstance(): Microsoft365TokenService {
    if (!Microsoft365TokenService.instance) {
      Microsoft365TokenService.instance = new Microsoft365TokenService();
    }
    return Microsoft365TokenService.instance;
  }

  /**
   * Get current Microsoft 365 token for user
   */
  async getToken(userId: string): Promise<ServiceResponse<Microsoft365Token>> {
    try {
      logger.info('Getting Microsoft 365 token for user', { userId });

      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('integration_type', 'microsoft365')
        .single();

      if (error || !data) {
        return this.handleError(error || 'No Microsoft 365 integration found');
      }

      const token: Microsoft365Token = {
        access_token: data.credentials?.access_token || '',
        refresh_token: data.credentials?.refresh_token,
        expires_at: data.credentials?.expires_at || '',
        scope: data.credentials?.scope || '',
        user_id: userId,
        integration_id: data.id,
      };

      return this.createResponse(token);
    } catch (error) {
      logger.error('Error getting Microsoft 365 token', { error, userId });
      return this.handleError(error);
    }
  }

  /**
   * Check if token is expired or will expire soon
   */
  isTokenExpired(token: Microsoft365Token, bufferMinutes: number = 5): boolean {
    if (!token.expires_at) return true;
    
    const expiresAt = new Date(token.expires_at);
    const bufferTime = new Date(Date.now() + (bufferMinutes * 60 * 1000));
    
    return expiresAt <= bufferTime;
  }

  /**
   * Refresh Microsoft 365 token using MSAL
   */
  async refreshToken(userId: string): Promise<ServiceResponse<Microsoft365Token>> {
    try {
      logger.info('Attempting to refresh Microsoft 365 token', { userId });

      // Get current token
      const tokenResult = await this.getToken(userId);
      if (!tokenResult.success || !tokenResult.data) {
        return this.handleError('No token found to refresh');
      }

      const currentToken = tokenResult.data;

      // Check if we have a refresh token
      if (!currentToken.refresh_token) {
        logger.warn('No refresh token available, user needs to reconnect', { userId });
        return this.handleError('No refresh token available. Please reconnect your Microsoft 365 account.');
      }

      // Try to refresh using MSAL
      try {
        const account = msalInstance.getActiveAccount();
        if (!account) {
          return this.handleError('No active MSAL account found');
        }

        // Attempt silent token acquisition
        const silentResult = await msalInstance.acquireTokenSilent({
          scopes: currentToken.scope.split(' '),
          account: account,
        });

        if (silentResult.accessToken) {
          // Update token in database
          const updatedToken = await this.updateToken(userId, {
            access_token: silentResult.accessToken,
            expires_at: silentResult.expiresOn?.toISOString() || new Date(Date.now() + 3600000).toISOString(),
            scope: currentToken.scope,
          });

          logger.info('Successfully refreshed Microsoft 365 token', { userId });
          return this.createResponse(updatedToken);
        }
      } catch (msalError) {
        logger.warn('MSAL silent token acquisition failed', { error: msalError, userId });
      }

      // If MSAL refresh fails, try manual refresh
      return await this.manualRefreshToken(currentToken);
    } catch (error) {
      logger.error('Error refreshing Microsoft 365 token', { error, userId });
      return this.handleError(error);
    }
  }

  /**
   * Manual token refresh using refresh token
   */
  private async manualRefreshToken(token: Microsoft365Token): Promise<ServiceResponse<Microsoft365Token>> {
    try {
      logger.info('Attempting manual token refresh', { userId: token.user_id });

      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
          scope: token.scope,
          refresh_token: token.refresh_token || '',
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('Manual token refresh failed', { error: errorData, userId: token.user_id });
        return this.handleError(`Token refresh failed: ${errorData.error_description || errorData.error}`);
      }

      const refreshData = await response.json();

      // Update token in database
      const updatedToken = await this.updateToken(token.user_id, {
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token || token.refresh_token,
        expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString(),
        scope: token.scope,
      });

      logger.info('Successfully refreshed token manually', { userId: token.user_id });
      return this.createResponse(updatedToken);
    } catch (error) {
      logger.error('Manual token refresh failed', { error, userId: token.user_id });
      return this.handleError(error);
    }
  }

  /**
   * Update token in database
   */
  private async updateToken(userId: string, tokenData: Partial<Microsoft365Token>): Promise<Microsoft365Token> {
    const { data, error } = await supabase
      .from('user_integrations')
      .update({
        credentials: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_at,
          scope: tokenData.scope,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('integration_type', 'microsoft365')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update token: ${error.message}`);
    }

    return {
      access_token: data.credentials?.access_token || '',
      refresh_token: data.credentials?.refresh_token,
      expires_at: data.credentials?.expires_at || '',
      scope: data.credentials?.scope || '',
      user_id: userId,
      integration_id: data.id,
    };
  }

  /**
   * Get valid token (refresh if needed)
   */
  async getValidToken(userId: string): Promise<ServiceResponse<Microsoft365Token>> {
    try {
      const tokenResult = await this.getToken(userId);
      if (!tokenResult.success || !tokenResult.data) {
        return tokenResult;
      }

      const token = tokenResult.data;

      // Check if token is expired or will expire soon
      if (this.isTokenExpired(token)) {
        logger.info('Token expired or expiring soon, attempting refresh', { userId });
        return await this.refreshToken(userId);
      }

      return this.createResponse(token);
    } catch (error) {
      logger.error('Error getting valid token', { error, userId });
      return this.handleError(error);
    }
  }

  /**
   * Force reauthentication by clearing tokens and redirecting
   */
  async forceReauthentication(userId: string): Promise<ServiceResponse<void>> {
    try {
      logger.info('Forcing Microsoft 365 reauthentication', { userId });

      // Clear current tokens
      await supabase
        .from('user_integrations')
        .update({
          credentials: null,
          status: 'disconnected',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('integration_type', 'microsoft365');

      // Clear MSAL cache
      msalInstance.clearCache();

      // Redirect to Microsoft 365 setup
      window.location.href = '/integrations/microsoft365';

      return this.createResponse(undefined);
    } catch (error) {
      logger.error('Error forcing reauthentication', { error, userId });
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const microsoft365TokenService = Microsoft365TokenService.getInstance();
