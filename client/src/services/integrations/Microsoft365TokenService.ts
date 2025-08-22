import { msalInstance } from '@/shared/auth/msal';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { selectData, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';

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
    return this.executeDbOperation(async () => {
      try {
        logger.info('Getting Microsoft 365 token for user', { userId });

        const { data, error } = await selectData('user_integrations', '*', {
          user_id: userId,
          integration_slug: 'microsoft365'
        });

        if (error) throw error;
        
        const integration = data && data.length > 0 ? data[0] : null;
        if (!integration) {
          return this.createErrorResponse('No Microsoft 365 integration found');
        }

        const token: Microsoft365Token = {
          access_token: integration.access_token || '',
          refresh_token: integration.refresh_token,
          expires_at: integration.expires_at || '',
          scope: integration.scope || '',
          user_id: userId,
          integration_id: integration.id,
        };

        return this.createSuccessResponse(token);
      } catch (error) {
        logger.error('Error getting Microsoft 365 token', { error, userId });
        return this.createErrorResponse('Failed to get Microsoft 365 token');
      }
    }, 'get Microsoft 365 token');
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
   * Refresh Microsoft 365 token using MSAL's built-in refresh capabilities
   */
  async refreshToken(userId: string): Promise<ServiceResponse<Microsoft365Token>> {
    return this.executeDbOperation(async () => {
      try {
        logger.info('Attempting to refresh Microsoft 365 token', { userId });

        // Get current token
        const tokenResult = await this.getToken(userId);
        if (!tokenResult.success || !tokenResult.data) {
          return this.createErrorResponse('No token found to refresh');
        }

        const currentToken = tokenResult.data;

        // Try to refresh using MSAL's silent token acquisition
        try {
          const account = msalInstance.getActiveAccount();
          if (!account) {
            logger.warn('No active MSAL account found, attempting to get from cache');
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length === 0) {
              return this.createErrorResponse('No MSAL account found. Please reconnect your Microsoft 365 account.');
            }
            // Use the first available account
            msalInstance.setActiveAccount(accounts[0]);
          }

          const activeAccount = msalInstance.getActiveAccount();
          if (!activeAccount) {
            return this.createErrorResponse('No active MSAL account found');
          }

          // Attempt silent token acquisition with offline_access scope
          const silentResult = await msalInstance.acquireTokenSilent({
            scopes: currentToken.scope.split(' ').filter(scope => scope !== 'offline_access'),
            account: activeAccount,
          });

          if (silentResult.accessToken) {
            // Update token in database
            const updatedToken = await this.updateToken(userId, {
              access_token: silentResult.accessToken,
              expires_at: silentResult.expiresOn?.toISOString() || new Date(Date.now() + 3600000).toISOString(),
              scope: currentToken.scope,
            });

            logger.info('Successfully refreshed Microsoft 365 token via MSAL', { userId });
            return this.createSuccessResponse(updatedToken);
          }
        } catch (msalError) {
          logger.warn('MSAL silent token acquisition failed', { error: msalError, userId });
          
          // If MSAL refresh fails, the user needs to re-authenticate
          // This is the proper way to handle token refresh with MSAL
          return this.createErrorResponse('Token refresh failed. Please reconnect your Microsoft 365 account.');
        }

        return this.createErrorResponse('Failed to refresh token');
      } catch (error) {
        logger.error('Error refreshing Microsoft 365 token', { error, userId });
        return this.createErrorResponse('Failed to refresh Microsoft 365 token');
      }
    }, 'refresh Microsoft 365 token');
  }

  /**
   * Update token in database
   */
  private async updateToken(userId: string, tokenData: Partial<Microsoft365Token>): Promise<Microsoft365Token> {
    const { data, error } = await updateOne('user_integrations', 
      { user_id: userId, integration_slug: 'microsoft365' },
      {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        scope: tokenData.scope,
        updated_at: new Date().toISOString(),
      }
    );

    if (error) {
      throw new Error(`Failed to update token: ${error}`);
    }

    return {
      access_token: data.access_token || '',
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || '',
      scope: data.scope || '',
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

      return this.createSuccessResponse(token);
    } catch (error) {
      logger.error('Error getting valid token', { error, userId });
      return this.createErrorResponse('Failed to get valid token');
    }
  }

  /**
   * Force reauthentication by clearing tokens and redirecting
   */
  async forceReauthentication(userId: string): Promise<ServiceResponse<void>> {
    return this.executeDbOperation(async () => {
      try {
        logger.info('Forcing Microsoft 365 reauthentication', { userId });

        // Clear current tokens
        await updateOne('user_integrations', 
          { user_id: userId, integration_slug: 'microsoft365' },
          {
            access_token: null,
            refresh_token: null,
            expires_at: null,
            scope: null,
            status: 'disconnected',
            updated_at: new Date().toISOString(),
          }
        );

        // Clear MSAL cache
        msalInstance.clearCache();

        // Redirect to Microsoft 365 setup
        window.location.href = '/integrations/microsoft365';

        return this.createSuccessResponse(undefined);
      } catch (error) {
        logger.error('Error forcing reauthentication', { error, userId });
        return this.createErrorResponse('Failed to force reauthentication');
      }
    }, 'force Microsoft 365 reauthentication');
  }
}

// Export singleton instance
export const microsoft365TokenService = Microsoft365TokenService.getInstance();
