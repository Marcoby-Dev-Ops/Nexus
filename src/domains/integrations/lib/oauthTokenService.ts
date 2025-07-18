import { supabase } from '../core/supabase';

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
   * Store OAuth tokens securely in Supabase
   */
  static async storeTokens(
    integrationSlug: string,
    tokenResponse: TokenResponse
  ): Promise<OAuthToken | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate expiration time
      const expiresAt = tokenResponse.expires_in 
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('oauth_tokens')
        .upsert({
          user_id: user.id,
          integration_slug: integrationSlug,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: expiresAt,
          scope: tokenResponse.scope,
          token_type: tokenResponse.token_type || 'Bearer',
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing OAuth tokens:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in storeTokens:', error);
      return null;
    }
  }

  /**
   * Get stored tokens for an integration
   * Checks multiple tables for backward compatibility
   */
  static async getTokens(integrationSlug: string): Promise<OAuthToken | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      // First, try the new oauth_tokens table
      const { data, error } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_slug', integrationSlug)
        .single();

      if (!error && data) {
        return data;
      }

      // If not found, check the existing ai_integrations_oauth table
      if (integrationSlug === 'microsoft') {
        const { data: existingData, error: existingError } = await supabase
          .from('ai_integrations_oauth')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'microsoft_graph')
          .single();

        if (!existingError && existingData) {
          // Convert to OAuthToken format
          return {
            id: existingData.id,
            user_id: existingData.user_id || user.id,
            integration_slug: 'microsoft',
            access_token: existingData.access_token || '',
            refresh_token: existingData.refresh_token,
            expires_at: existingData.expires_at,
            scope: existingData.scopes?.join(' ') || '',
            token_type: 'Bearer',
            created_at: existingData.created_at,
            updated_at: existingData.updated_at,
          };
        }
      }

      // If not found, check ai_email_accounts for email-specific tokens
      if (integrationSlug === 'microsoft') {
        const { data: emailData, error: emailError } = await supabase
          .from('ai_email_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'outlook')
          .single();

        if (!emailError && emailData && emailData.access_token) {
          // Convert to OAuthToken format
          return {
            id: emailData.id,
            user_id: emailData.user_id,
            integration_slug: 'microsoft',
            access_token: emailData.access_token,
            refresh_token: emailData.refresh_token,
            expires_at: emailData.token_expires_at,
            scope: 'User.Read Mail.Read offline_access',
            token_type: 'Bearer',
            created_at: emailData.created_at,
            updated_at: emailData.updated_at,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error in getTokens:', error);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { error } = await supabase
        .from('oauth_tokens')
        .delete()
        .eq('user_id', user.id)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('oauth_tokens')
        .select('integration_slug')
        .eq('user_id', user.id);

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
} 