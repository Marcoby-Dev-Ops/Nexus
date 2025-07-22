import { supabase } from '@/core/supabase';
import { sessionUtils } from '@/core/supabase';

export interface OAuthToken {
  id: string;
  user_id: string;
  integration_slug: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scope?: string;
  token_type: string;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
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
        console.error('No active session found');
        return null;
      }

      console.log('OAuthTokenService: Session found, user ID:', session.user.id);
      console.log('OAuthTokenService: Session access token present:', !!session.access_token);

      // Use service client with user validation
      console.log('OAuthTokenService: Using service client with user validation...');
      const { data: tokens, error: tokenError } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('integration_slug', integrationSlug)
        .single();

      console.log('OAuthTokenService: Service client result:', { 
        hasData: !!tokens, 
        error: tokenError?.message,
        code: tokenError?.code 
      });

      if (tokenError || !tokens) {
        console.log('OAuthTokenService: No tokens found:', tokenError?.message);
        return null;
      }

      console.log('OAuthTokenService: Successfully retrieved tokens');
      return tokens as OAuthToken;
    } catch (error) {
      console.error('Error in getTokens:', error);
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
        user_id: userId,
        integration_slug: integrationSlug,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || null,
        expires_at: expiresAt,
        scope: tokenResponse.scope || '',
        token_type: tokenResponse.token_type || 'Bearer',
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
        console.error('Error storing tokens:', error);
        return null;
      }

      return data as OAuthToken;
    } catch (error) {
      console.error('Error in storeTokens:', error);
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
      console.error('Error checking token validity:', error);
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
        console.error('Error deleting OAuth tokens:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTokens:', error);
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
        console.error('Error retrieving user integrations:', error);
        return [];
      }

      return data.map(row => row.integration_slug);
    } catch (error) {
      console.error('Error in getUserIntegrations:', error);
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
          // Token is expired or will expire soon
          // TODO: Implement token refresh logic here
          console.warn(`Token for ${integrationSlug} is expired or will expire soon`);
          return null;
        }
      }

      return tokens.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
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