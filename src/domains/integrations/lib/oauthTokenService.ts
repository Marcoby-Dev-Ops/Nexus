import { supabase } from '@/core/supabase';
import { sessionUtils } from '@/core/supabase';

export interface OAuthToken {
  id: string;
  userid: string;
  integrationslug: string;
  accesstoken: string;
  refresh_token?: string;
  expires_at?: string;
  scope?: string;
  tokentype: string;
  createdat: string;
  updatedat: string;
}

export interface TokenResponse {
  accesstoken: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

export class OAuthTokenService {
  /**
   * Get stored tokens for an integration using service client with user validation
   */
  static async getTokens(integrationSlug: string): Promise<OAuthToken | null> {
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('No active session found');
        return null;
      }

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('OAuthTokenService: Session found, user ID: ', session.user.id);
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('OAuthTokenService: Session access token present:', !!session.access_token);

      // Use service client with user validation
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('OAuthTokenService: Using service client with user validation...');
      const { data: tokens, error: tokenError } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('integration_slug', integrationSlug)
        .maybeSingle();

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('OAuthTokenService: Service client result:', { 
        hasData: !!tokens, 
        error: tokenError?.message,
        code: tokenError?.code 
      });

      if (tokenError || !tokens) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('OAuthTokenService: No tokens found:', tokenError?.message);
        return null;
      }

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('OAuthTokenService: Successfully retrieved tokens');
      return tokens as OAuthToken;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error in getTokens: ', error);
      return null;
    }
  }

  /**
   * Store OAuth tokens for an integration
   */
  static async storeTokens(
    integrationSlug: string,
    tokenResponse: TokenResponse
  ): Promise<OAuthToken | null> {
    try {
      const userId = await this.ensureAuth();

      const expiresAt = tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : null;

      const tokenData = {
        userid: userId,
        integrationslug: integrationSlug,
        accesstoken: tokenResponse.access_token,
        refreshtoken: tokenResponse.refresh_token || null,
        expiresat: expiresAt,
        scope: tokenResponse.scope || '',
        tokentype: tokenResponse.token_type || 'Bearer',
      };

      // Try to insert first, if it fails due to unique constraint, update
      const { data, error } = await supabase
        .from('oauth_tokens')
        .upsert(tokenData, {
          onConflict: 'user_id,integration_slug'
        })
        .select()
        .single();

      if (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error storing tokens: ', error);
        return null;
      }

      return data as OAuthToken;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error in storeTokens: ', error);
      return null;
    }
  }

  /**
   * Check if tokens exist and are valid (not expired)
   */
  static async hasValidTokens(integrationSlug: string): Promise<boolean> {
    try {
      const tokens = await this.getTokens(integrationSlug);
      if (!tokens) {
        return false;
      }

      // If no expiration, assume valid
      if (!tokens.expires_at) {
        return true;
      }

      // Check if token is expired (with 5 minute buffer)
      const expiresAt = new Date(tokens.expires_at);
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

      return expiresAt.getTime() > (now.getTime() + bufferTime);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error checking token validity: ', error);
      return false;
    }
  }

  /**
   * Update tokens (e.g., after refresh)
   */
  static async updateTokens(
    integrationSlug: string,
    tokenResponse: TokenResponse
  ): Promise<OAuthToken | null> {
    return this.storeTokens(integrationSlug, tokenResponse);
  }

  /**
   * Delete tokens for an integration
   */
  static async deleteTokens(integrationSlug: string): Promise<boolean> {
    try {
      const userId = await this.ensureAuth();

      const { error } = await supabase
        .from('oauth_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('integration_slug', integrationSlug);

      if (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error deleting OAuth tokens: ', error);
        return false;
      }

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error in deleteTokens: ', error);
      return false;
    }
  }

  /**
   * Get all user's OAuth integrations
   */
  static async getUserIntegrations(): Promise<string[]> {
    try {
      const userId = await this.ensureAuth();

      const { data, error } = await supabase
        .from('oauth_tokens')
        .select('integration_slug')
        .eq('user_id', userId);

      if (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error retrieving user integrations: ', error);
        return [];
      }

      return data.map(row => row.integration_slug);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error in getUserIntegrations: ', error);
      return [];
    }
  }

  /**
   * Get access token for making API calls
   * Returns null if token is expired or doesn't exist
   */
  static async getAccessToken(integrationSlug: string): Promise<string | null> {
    try {
      const tokens = await this.getTokens(integrationSlug);
      if (!tokens) {
        return null;
      }

      // Check if token is expired
      if (tokens.expires_at) {
        const expiresAt = new Date(tokens.expires_at);
        const now = new Date();
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

        if (expiresAt.getTime() <= (now.getTime() + bufferTime)) {
          // Token is expired or will expire soon - try to refresh
          // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`Token for ${integrationSlug} is expired or will expire soon, attempting refresh`);
          const refreshedTokens = await this.refreshTokens(integrationSlug, tokens);
          return refreshedTokens?.access_token || null;
        }
      }

      return tokens.access_token;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error getting access token: ', error);
      return null;
    }
  }

  /**
   * Refresh OAuth tokens for an integration
   */
  static async refreshTokens(integrationSlug: string, currentTokens: OAuthToken): Promise<OAuthToken | null> {
    try {
      if (!currentTokens.refresh_token) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn(`No refresh token available for ${integrationSlug}`);
        return null;
      }

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`Refreshing tokens for ${integrationSlug}`);

      let tokenResponse: TokenResponse;

      switch (integrationSlug) {
        case 'microsoft':
          tokenResponse = await this.refreshMicrosoftTokens(currentTokens.refresh_token);
          break;
        case 'google-workspace':
          tokenResponse = await this.refreshGoogleTokens(currentTokens.refresh_token);
          break;
        case 'slack':
          tokenResponse = await this.refreshSlackTokens(currentTokens.refresh_token);
          break;
        case 'hubspot':
          tokenResponse = await this.refreshHubSpotTokens(currentTokens.refresh_token);
          break;
        case 'paypal':
          tokenResponse = await this.refreshPayPalTokens(currentTokens.refresh_token);
          break;
        case 'google-analytics':
          tokenResponse = await this.refreshGoogleAnalyticsTokens(currentTokens.refresh_token);
          break;
        default: // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn(`Token refresh not implemented for ${integrationSlug}`);
          return null;
      }

      // Store the refreshed tokens
      const refreshedTokens = await this.storeTokens(integrationSlug, tokenResponse);
      
      if (refreshedTokens) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`Successfully refreshed tokens for ${integrationSlug}`);
      } else {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`Failed to store refreshed tokens for ${integrationSlug}`);
      }

      return refreshedTokens;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`Error refreshing tokens for ${integrationSlug}:`, error);
      return null;
    }
  }

  /**
   * Refresh Microsoft 365 tokens
   */
  private static async refreshMicrosoftTokens(refreshToken: string): Promise<TokenResponse> {
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    
    const response = await fetch('https: //login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        clientid: clientId,
        granttype: 'refresh_token',
        refreshtoken: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Microsoft token refresh failed: ${errorData.error_description || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Refresh Google Workspace tokens
   */
  private static async refreshGoogleTokens(refreshToken: string): Promise<TokenResponse> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
    
    const response = await fetch('https: //oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        clientid: clientId,
        clientsecret: clientSecret,
        granttype: 'refresh_token',
        refreshtoken: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google token refresh failed: ${errorData.error_description || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Refresh Slack tokens
   */
  private static async refreshSlackTokens(refreshToken: string): Promise<TokenResponse> {
    const clientId = import.meta.env.VITE_SLACK_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SLACK_CLIENT_SECRET;
    
    const response = await fetch('https: //slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        clientid: clientId,
        clientsecret: clientSecret,
        granttype: 'refresh_token',
        refreshtoken: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Slack token refresh failed: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      accesstoken: data.access_token,
      refreshtoken: data.refresh_token,
      expiresin: data.expires_in,
      scope: data.scope,
      tokentype: data.token_type,
    };
  }

  /**
   * Refresh HubSpot tokens
   */
  private static async refreshHubSpotTokens(refreshToken: string): Promise<TokenResponse> {
    const clientId = import.meta.env.VITE_HUBSPOT_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_HUBSPOT_CLIENT_SECRET;
    
    const response = await fetch('https: //api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        granttype: 'refresh_token',
        clientid: clientId,
        clientsecret: clientSecret,
        refreshtoken: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HubSpot token refresh failed: ${errorData.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Refresh PayPal tokens
   */
  private static async refreshPayPalTokens(refreshToken: string): Promise<TokenResponse> {
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_PAYPAL_CLIENT_SECRET;
    const environment = import.meta.env.VITE_PAYPAL_ENV || 'sandbox';
    
    const baseUrl = environment === 'live' 
      ? 'https: //api.paypal.com' 
      : 'https://api.sandbox.paypal.com';
    
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        granttype: 'refresh_token',
        refreshtoken: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`PayPal token refresh failed: ${errorData.error_description || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Refresh Google Analytics tokens
   */
  private static async refreshGoogleAnalyticsTokens(refreshToken: string): Promise<TokenResponse> {
    const clientId = import.meta.env.VITE_GOOGLE_ANALYTICS_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_GOOGLE_ANALYTICS_CLIENT_SECRET;
    
    const response = await fetch('https: //oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        clientid: clientId,
        clientsecret: clientSecret,
        granttype: 'refresh_token',
        refreshtoken: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Analytics token refresh failed: ${errorData.error_description || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Ensure user is authenticated before making database queries
   */
  private static async ensureAuth(): Promise<string> {
    // Get authenticated client
    await sessionUtils.getAuthenticatedClient();

    // Get the user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    return user.id;
  }
} 