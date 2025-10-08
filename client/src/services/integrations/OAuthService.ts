/**
 * PostgreSQL-Native OAuth Service
 * 
 * Replaces Supabase edge function dependencies with direct OAuth processing
 * using PostgreSQL for token storage and management
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { z } from 'zod';
import { 
  selectData, 
  selectOne, 
  insertOne, 
  updateOne, 
  upsertOne, 
  deleteOne 
} from '@/lib/database';

// ============================================================================
// SCHEMAS
// ============================================================================

export const OAuthStateSchema = z.object({
  state: z.string(),
  codeVerifier: z.string().optional(),
  userId: z.string(),
  integrationSlug: z.string(),
  timestamp: z.number(),
  redirectUri: z.string().optional(),
});

export const OAuthTokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.string().default('Bearer'),
  expires_in: z.number().optional(),
  scope: z.string().optional(),
  id_token: z.string().optional(),
});

export const OAuthCallbackRequestSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export const ConnectionResultSchema = z.object({
  success: z.boolean(),
  integrationSlug: z.string(),
  userId: z.string(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
  scope: z.string().optional(),
  error: z.string().optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type OAuthState = z.infer<typeof OAuthStateSchema>;
export type OAuthTokens = z.infer<typeof OAuthTokensSchema>;
export type OAuthCallbackRequest = z.infer<typeof OAuthCallbackRequestSchema>;
export type ConnectionResult = z.infer<typeof ConnectionResultSchema>;

export interface OAuthProvider {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scope: string;
  redirectUri: string;
}

// ============================================================================
// OAUTH PROVIDER CONFIGURATIONS (Client-side only - public info)
// ============================================================================

// Get OAuth configuration from server (public info only)
async function getOAuthConfig(provider: string): Promise<OAuthProvider> {
  const response = await fetch(`/api/oauth/config/${provider}`);
  if (!response.ok) {
    throw new Error(`Failed to get OAuth config for ${provider}`);
  }
  return response.json();
}

// ============================================================================
// OAUTH SERVICE
// ============================================================================

export class OAuthService extends BaseService {
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /**
   * Generate and store OAuth state for CSRF protection
   */
  async generateOAuthState(
    userId: string, 
    integrationSlug: string, 
    redirectUri?: string
  ): Promise<ServiceResponse<OAuthState>> {
    return this.executeDbOperation(async () => {
      try {
        // Generate state and code verifier
        const state = this.generateRandomString(32);
        const codeVerifier = this.generateRandomString(128);
        
        const oauthState: OAuthState = {
          state,
          codeVerifier,
          userId,
          integrationSlug,
          timestamp: Date.now(),
          redirectUri,
        };

        // Store state in database (temporary table for OAuth states)
        await this.storeOAuthState(oauthState);

        this.logger.info('OAuth state generated', { 
          userId, 
          integrationSlug, 
          stateLength: state.length 
        });

        return { data: oauthState, error: null };
      } catch (error) {
        return this.handleError(error, 'generate OAuth state');
      }
    });
  }

  /**
   * Validate and retrieve OAuth state
   */
  async validateOAuthState(state: string): Promise<ServiceResponse<OAuthState>> {
    return this.executeDbOperation(async () => {
      try {
        // Retrieve state from database
        const storedState = await this.getOAuthState(state);
        
        if (!storedState) {
          return this.createErrorResponse('Invalid OAuth state');
        }

        // Check if state is expired (5 minutes)
        const stateExpiry = 5 * 60 * 1000; // 5 minutes
        if (Date.now() - storedState.timestamp > stateExpiry) {
          await this.clearOAuthState(state);
          return this.createErrorResponse('OAuth state expired');
        }

        return { data: storedState, error: null };
      } catch (error) {
        return this.handleError(error, 'validate OAuth state');
      }
    });
  }

  /**
   * Clear OAuth state after use
   */
  async clearOAuthState(state: string): Promise<ServiceResponse<void>> {
    return this.executeDbOperation(async () => {
      try {
        await deleteOne('oauth_states', { state });
        return { data: undefined, error: null };
      } catch (error) {
        return this.handleError(error, 'clear OAuth state');
      }
    });
  }

  // ============================================================================
  // OAUTH FLOW MANAGEMENT
  // ============================================================================

  /**
   * Generate OAuth authorization URL
   */
  async generateAuthorizationUrl(
    integrationSlug: string,
    userId: string,
    redirectUri?: string
  ): Promise<ServiceResponse<string>> {
    return this.executeDbOperation(async () => {
      try {
        // Get OAuth configuration from server
        const provider = await getOAuthConfig(integrationSlug);
        if (!provider) {
          return this.createErrorResponse(`Unsupported integration: ${integrationSlug}`);
        }

        // Generate OAuth state via server API
        const stateResponse = await fetch('/api/oauth/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, integrationSlug, redirectUri }),
        });

        if (!stateResponse.ok) {
          return this.createErrorResponse('Failed to generate OAuth state');
        }

        const { data: oauthState } = await stateResponse.json();
        const { state, codeVerifier } = oauthState;

        // Build authorization URL
        const params = new URLSearchParams({
          client_id: provider.clientId,
          redirect_uri: redirectUri || provider.redirectUri,
          response_type: 'code',
          scope: provider.scope,
          state: state,
          access_type: 'offline',
          prompt: 'consent',
        });

        // Add PKCE challenge if code verifier is available
        if (codeVerifier) {
          const codeChallenge = await this.generateCodeChallenge(codeVerifier);
          params.append('code_challenge', codeChallenge);
          params.append('code_challenge_method', 'S256');
        }

        const authorizationUrl = `${provider.authorizationUrl}?${params.toString()}`;

        this.logger.info('Authorization URL generated', { 
          integrationSlug, 
          userId,
          hasCodeChallenge: !!codeVerifier 
        });

        return { data: authorizationUrl, error: null };
      } catch (error) {
        return this.handleError(error, 'generate authorization URL');
      }
    });
  }

  /**
   * Process OAuth callback and exchange code for tokens
   */
  async processOAuthCallback(
    integrationSlug: string,
    callbackRequest: OAuthCallbackRequest
  ): Promise<ServiceResponse<ConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        const { code, state, error, error_description } = callbackRequest;

        // Check for OAuth errors
        if (error) {
          this.logger.error('OAuth error received', { error, error_description });
          return this.createErrorResponse(`OAuth error: ${error_description || error}`);
        }

        // Validate state
        const stateResult = await this.validateOAuthState(state);
        if (stateResult.error) {
          return this.createErrorResponse(stateResult.error);
        }

        const { userId, codeVerifier } = stateResult.data;

        // Exchange code for tokens via server API
        const tokenResponse = await fetch('/api/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: integrationSlug,
            code,
            redirectUri: stateResult.data.redirectUri,
            codeVerifier,
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          return this.createErrorResponse(`Token exchange failed: ${errorData.details || errorData.error}`);
        }

        const tokens = await tokenResponse.json();

        // Store tokens in database
        await this.storeOAuthTokens(userId, integrationSlug, tokens);

        // Update user integration status
        await this.updateUserIntegrationStatus(userId, integrationSlug, 'active');

        // Clear OAuth state
        await this.clearOAuthState(state);

        const connectionResult: ConnectionResult = {
          success: true,
          integrationSlug,
          userId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expires_at,
          scope: tokens.scope,
        };

        this.logger.info('OAuth callback processed successfully', { 
          integrationSlug, 
          userId 
        });

        return { data: connectionResult, error: null };
      } catch (error) {
        return this.handleError(error, 'process OAuth callback');
      }
    });
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(
    provider: OAuthProvider,
    code: string,
    codeVerifier?: string,
    redirectUri?: string
  ): Promise<OAuthTokens> {
    const tokenRequestBody: Record<string, string> = {
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri || provider.redirectUri,
    };

    // Add PKCE verifier if available
    if (codeVerifier) {
      tokenRequestBody.code_verifier = codeVerifier;
    }

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenRequestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      this.logger.error('Token exchange failed', { 
        status: response.status, 
        error: errorData 
      });
      throw new Error(`Token exchange failed: ${response.status} - ${errorData}`);
    }

    const tokenData = await response.json();
    
    // Validate token response
    const tokens = OAuthTokensSchema.parse(tokenData);
    
    this.logger.info('Tokens exchanged successfully', { 
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in 
    });

    return tokens;
  }

  /**
   * Store OAuth tokens in database
   */
  private async storeOAuthTokens(
    userId: string,
    integrationSlug: string,
    tokens: OAuthTokens
  ): Promise<void> {
    const expiresAt = tokens.expires_in 
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    await upsertOne('oauth_tokens', {
      user_id: userId,
      integration_slug: integrationSlug,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expires_at: expiresAt,
      scope: tokens.scope,
      updated_at: new Date().toISOString(),
    }, {
      user_id: userId,
      integration_slug: integrationSlug,
    });
  }

  /**
   * Get valid OAuth tokens for a user and integration
   */
  async getValidTokens(
    userId: string,
    integrationSlug: string
  ): Promise<ServiceResponse<OAuthTokens>> {
    return this.executeDbOperation(async () => {
      try {
        const tokens = await selectOne('oauth_tokens', {
          user_id: userId,
          integration_slug: integrationSlug,
        });

        if (!tokens) {
          return this.createErrorResponse('No tokens found');
        }

        // Check if tokens are expired
        if (tokens.expires_at && new Date(tokens.expires_at) <= new Date()) {
          // Try to refresh tokens
          const refreshResult = await this.refreshTokens(userId, integrationSlug);
          if (refreshResult.error) {
            return this.createErrorResponse('Tokens expired and refresh failed');
          }
          return refreshResult;
        }

        const oauthTokens: OAuthTokens = {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_type: tokens.token_type,
          scope: tokens.scope,
        };

        return { data: oauthTokens, error: null };
      } catch (error) {
        return this.handleError(error, 'get valid tokens');
      }
    });
  }

  /**
   * Refresh OAuth tokens
   */
  async refreshTokens(
    userId: string,
    integrationSlug: string
  ): Promise<ServiceResponse<OAuthTokens>> {
    return this.executeDbOperation(async () => {
      try {
        const currentTokens = await selectOne('oauth_tokens', {
          user_id: userId,
          integration_slug: integrationSlug,
        });

        if (!currentTokens?.refresh_token) {
          return this.createErrorResponse('No refresh token available');
        }

        const provider = OAUTH_PROVIDERS[integrationSlug];
        if (!provider) {
          return this.createErrorResponse(`Unsupported integration: ${integrationSlug}`);
        }

        const response = await fetch(provider.tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: provider.clientId,
            client_secret: provider.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: currentTokens.refresh_token,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          this.logger.error('Token refresh failed', { 
            status: response.status, 
            error: errorData 
          });
          return this.createErrorResponse(`Token refresh failed: ${response.status}`);
        }

        const tokenData = await response.json();
        const tokens = OAuthTokensSchema.parse(tokenData);

        // Store updated tokens
        await this.storeOAuthTokens(userId, integrationSlug, tokens);

        this.logger.info('Tokens refreshed successfully', { 
          integrationSlug, 
          userId 
        });

        return { data: tokens, error: null };
      } catch (error) {
        return this.handleError(error, 'refresh tokens');
      }
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate random string for state and code verifier
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Store OAuth state in database
   */
  private async storeOAuthState(state: OAuthState): Promise<void> {
    await insertOne('oauth_states', {
      state: state.state,
      code_verifier: state.codeVerifier,
      user_id: state.userId,
      integration_slug: state.integrationSlug,
      timestamp: new Date(state.timestamp).toISOString(),
      redirect_uri: state.redirectUri,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Get OAuth state from database
   */
  private async getOAuthState(state: string): Promise<OAuthState | null> {
    const result = await selectOne('oauth_states', { state });
    if (!result) return null;

    return {
      state: result.state,
      codeVerifier: result.code_verifier,
      userId: result.user_id,
      integrationSlug: result.integration_slug,
      timestamp: new Date(result.timestamp).getTime(),
      redirectUri: result.redirect_uri,
    };
  }

  /**
   * Update user integration status
   */
  private async updateUserIntegrationStatus(
    userId: string,
    integrationSlug: string,
    status: string
  ): Promise<void> {
    await upsertOne('user_integrations', {
      user_id: userId,
      integration_slug: integrationSlug,
      status: status,
      updated_at: new Date().toISOString(),
    }, {
      user_id: userId,
      integration_slug: integrationSlug,
    });
  }
}

// ============================================================================
// SERVICE INSTANCE
// ============================================================================

export const oauthService = new OAuthService();
