import { supabase } from '@/core/supabase';
import { logger } from '@/shared/utils/logger';

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export interface TokenRefreshResult {
  success: boolean;
  tokens?: TokenData;
  error?: string;
  requiresReauth?: boolean;
}

export class TokenManager {
  private static instance: TokenManager;
  
  private constructor() {}
  
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Get valid tokens for a provider, refreshing if necessary
   */
  async getValidTokens(provider: string): Promise<TokenData> {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Get stored tokens from database
      const { data: tokens, error } = await supabase
        .from('oauth_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', session.user.id)
        .eq('integration_slug', provider)
        .single();

      if (error || !tokens || !tokens.access_token || !tokens.refresh_token || !tokens.expires_at) {
        throw new Error(`No valid tokens found for ${provider}`);
      }

      // Check if token is expired or expiring soon (within 5 minutes)
      const now = new Date();
      const expiresAt = new Date(tokens.expires_at);
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (expiresAt <= fiveMinutesFromNow) {
        logger.info({ 
          provider, 
          userId: session.user.id,
          expiresAt: tokens.expires_at,
          currentTime: now.toISOString()
        }, 'Token expired or expiring soon, attempting refresh');

        const refreshResult = await this.refreshTokens(provider, tokens.refresh_token);
        
        if (refreshResult.success && refreshResult.tokens) {
          return refreshResult.tokens;
        } else {
          throw new Error(refreshResult.error || 'Token refresh failed');
        }
      }

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at
      };
    } catch (error) {
      logger.error({ error, provider }, 'Error getting valid tokens');
      throw error;
    }
  }

  /**
   * Refresh tokens using client-side OAuth flow
   */
  private async refreshTokens(provider: string, refreshToken: string): Promise<TokenRefreshResult> {
    try {
      if (provider === 'microsoft') {
        return await this.refreshMicrosoftTokens(refreshToken);
      }

      // For other providers, return error
      return {
        success: false,
        error: `Token refresh not implemented for ${provider}`,
        requiresReauth: true
      };
    } catch (error) {
      logger.error({ error, provider }, 'Token refresh error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requiresReauth: true
      };
    }
  }

  /**
   * Refresh Microsoft tokens using client-side OAuth
   */
  private async refreshMicrosoftTokens(refreshToken: string): Promise<TokenRefreshResult> {
    try {
      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
      
      if (!clientId) {
        return {
          success: false,
          error: 'Microsoft OAuth configuration not found',
          requiresReauth: true
        };
      }

      const params = new URLSearchParams({
        client_id: clientId,
        scope: 'User.Read Organization.Read.All openid profile email offline_access',
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error({ 
          status: response.status,
          error: errorData 
        }, 'Microsoft token refresh failed');

        // Check if refresh token is invalid
        if (errorData.error === 'invalid_grant' || errorData.error === 'invalid_client') {
          return {
            success: false,
            error: 'Refresh token is invalid or expired',
            requiresReauth: true
          };
        }

        return {
          success: false,
          error: `Token refresh failed: ${errorData.error_description || 'Unknown error'}`
        };
      }

      const tokenData = await response.json();
      
      // Calculate expiration time (Microsoft tokens typically expire in 1 hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const newTokens: TokenData = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken, // Keep old refresh token if new one not provided
        expires_at: expiresAt.toISOString()
      };

      // Update tokens in database
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { error: updateError } = await supabase
        .from('oauth_tokens')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expires_at: newTokens.expires_at
        })
        .eq('user_id', session.user.id)
        .eq('integration_slug', 'microsoft');

      if (updateError) {
        logger.error({ error: updateError }, 'Failed to update tokens in database');
        return {
          success: false,
          error: `Failed to update tokens: ${updateError.message}`
        };
      }

      logger.info({ 
        userId: session.user.id,
        provider: 'microsoft'
      }, 'Successfully refreshed Microsoft tokens');

      return {
        success: true,
        tokens: newTokens
      };
    } catch (error) {
      logger.error({ error }, 'Microsoft token refresh error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requiresReauth: true
      };
    }
  }

  /**
   * Remove tokens for a provider (when re-authentication is needed)
   */
  async removeTokens(provider: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      const { error } = await supabase
        .from('oauth_tokens')
        .delete()
        .eq('user_id', session.user.id)
        .eq('integration_slug', provider);

      if (error) {
        logger.error({ error, provider }, 'Failed to remove tokens');
      } else {
        logger.info({ provider, userId: session.user.id }, 'Successfully removed tokens');
      }
    } catch (error) {
      logger.error({ error, provider }, 'Error removing tokens');
    }
  }

  /**
   * Check if tokens exist for a provider
   */
  async hasTokens(provider: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return false;
      }

      const { data, error } = await supabase
        .from('oauth_tokens')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('integration_slug', provider)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance(); 