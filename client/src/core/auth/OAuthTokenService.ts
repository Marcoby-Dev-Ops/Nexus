import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface OAuthToken {
  id: string;
  user_id: string;
  provider: OAuthProvider;
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_at?: number;
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
  updated_at: string;
}

export type OAuthProvider = 
  | 'microsoft'
  | 'google'
  | 'slack'
  | 'hubspot'
  | 'salesforce'
  | 'paypal'
  | 'stripe'
  | 'ninjarmm';

export interface TokenValidationResult {
  isValid: boolean;
  expiresIn?: number;
  isExpired: boolean;
}

/**
 * OAuth Token Service
 * Handles OAuth token storage, retrieval, and management
 * Extends BaseService for consistent error handling and logging
 * Updated to use helper functions from src/lib/supabase.ts
 */
export class OAuthTokenService extends BaseService implements CrudServiceInterface<OAuthToken> {
  // Using direct API calls instead of UnifiedDatabaseService

  constructor() {
    super();
  }

  /**
   * Get a token by ID (implements CrudServiceInterface)
   */
  async get(id: string): Promise<ServiceResponse<OAuthToken>> {
    return this.executeDbOperation(async () => {
      this.validateIdParam(id);
      
      const { data, error } = await this.databaseService.selectOne('oauth_tokens', id);
      
      if (error) {
        this.logger.error('Failed to get OAuth token:', error);
        return { data: null, error: 'Failed to get OAuth token' };
      }

      if (!data) {
        return { data: null, error: 'OAuth token not found' };
      }

      return { data: data as OAuthToken, error: null };
    }, 'get OAuth token');
  }

  /**
   * Create a new token (implements CrudServiceInterface)
   */
  async create(data: Partial<OAuthToken>): Promise<ServiceResponse<OAuthToken>> {
    return this.executeDbOperation(async () => {
      this.validateParams(data, ['user_id', 'provider', 'access_token', 'token_type']);
      
      const tokenData = {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: data.status || 'active'
      };

      const { data: result, error } = await this.databaseService.insertOne('oauth_tokens', tokenData);
      
      if (error) {
        this.logger.error('Failed to create OAuth token:', error);
        return { data: null, error: 'Failed to create OAuth token' };
      }

      this.logger.info('OAuth token created successfully', { provider: data.provider });
      return { data: result as OAuthToken, error: null };
    }, 'create OAuth token');
  }

  /**
   * Update a token (implements CrudServiceInterface)
   */
  async update(id: string, data: Partial<OAuthToken>): Promise<ServiceResponse<OAuthToken>> {
    return this.executeDbOperation(async () => {
      this.validateIdParam(id);
      
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await this.databaseService.updateOne('oauth_tokens', id, updateData);
      
      if (error) {
        this.logger.error('Failed to update OAuth token:', error);
        return { data: null, error: 'Failed to update OAuth token' };
      }

      if (!result) {
        return { data: null, error: 'OAuth token not found' };
      }

      this.logger.info('OAuth token updated successfully', { tokenId: id });
      return { data: result as OAuthToken, error: null };
    }, 'update OAuth token');
  }

  /**
   * Delete a token (implements CrudServiceInterface)
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        this.validateIdParam(id);
        
        const { data, error } = await deleteOne('oauth_tokens', id);
        
        if (error) {
          const errorResult = handleSupabaseError(error, 'delete OAuth token');
          return { data: null, error: errorResult.error };
        }

        this.logSuccess('OAuth token deleted successfully', { tokenId: id });
        return { data: true, error: null };
      } catch (error) {
        return { data: null, error: 'Failed to delete OAuth token' };
      }
    }, 'delete OAuth token');
  }

  /**
   * List tokens (implements CrudServiceInterface)
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<OAuthToken[]>> {
    return this.executeDbOperation(async () => {
      try {
        const { data, error } = await select('oauth_tokens', '*', filters);
        
        if (error) {
          const errorResult = handleSupabaseError(error, 'list OAuth tokens');
          return { data: null, error: errorResult.error };
        }

        return { data: data as OAuthToken[] || [], error: null };
      } catch (error) {
        return { data: null, error: 'Failed to list OAuth tokens' };
      }
    }, 'list OAuth tokens');
  }

  /**
   * Get token for a specific provider
   */
  async getTokenForProvider(provider: OAuthProvider): Promise<ServiceResponse<OAuthToken>> {
    return this.executeDbOperation(async () => {
      try {
        // Get current user ID
        const userResult = await authentikAuthService.getSession();
        const user = userResult.data?.user;
        
        if (!user) {
          const errorResult = handleSupabaseError(new Error('No user found'), 'get user for token');
          return { data: null, error: errorResult.error };
        }

        const { data, error } = await select('oauth_tokens', '*', { 
          user_id: user.id, 
          provider: provider,
          status: 'active'
        });
        
        if (error) {
          const errorResult = handleSupabaseError(error, `get token for ${provider}`);
          return { data: null, error: errorResult.error };
        }

        if (!data || data.length === 0) {
          return { data: null, error: `No active token found for ${provider}` };
        }

        return { data: data[0] as OAuthToken, error: null };
      } catch (error) {
        return { data: null, error: `Failed to get token for ${provider}` };
      }
    }, `get token for ${provider}`);
  }

  /**
   * Store a new OAuth token
   */
  async storeToken(provider: OAuthProvider, tokenData: Partial<OAuthToken>): Promise<ServiceResponse<OAuthToken>> {
    return this.executeDbOperation(async () => {
      try {
        // Get current user ID
        const authResult = await authentikAuthService.getSession();
        const user = authResult.data?.user;
        
        if (!user) {
          const errorResult = handleSupabaseError(new Error('No user found'), 'get user for token storage');
          return { data: null, error: errorResult.error };
        }

        // Check if token already exists for this provider
        const existingToken = await this.getTokenForProvider(provider);
        
        if (existingToken.success && existingToken.data) {
          // Update existing token
          return await this.update(existingToken.data.id, {
            ...tokenData,
            user_id: user.id,
            provider,
            updated_at: new Date().toISOString()
          });
        } else {
          // Create new token
          return await this.create({
            ...tokenData,
            user_id: user.id,
            provider
          });
        }
      } catch (error) {
        return { data: null, error: `Failed to store token for ${provider}` };
      }
    }, `store token for ${provider}`);
  }

  /**
   * Refresh an OAuth token
   */
  async refreshToken(refreshData: { provider: OAuthProvider; refresh_token: string }): Promise<ServiceResponse<OAuthToken>> {
    return this.executeDbOperation(async () => {
      try {
        // Get current token for provider
        const tokenResult = await this.getTokenForProvider(refreshData.provider);
        
        if (!tokenResult.success || !tokenResult.data) {
          return { data: null, error: `No token found for ${refreshData.provider}` };
        }

        let refreshedTokenData: any = null;

        // Implement provider-specific token refresh
        switch (refreshData.provider) {
          case 'microsoft':
            refreshedTokenData = await this.refreshMicrosoftToken(refreshData.refresh_token);
            break;
          case 'google':
            refreshedTokenData = await this.refreshGoogleToken(refreshData.refresh_token);
            break;
          case 'hubspot':
            refreshedTokenData = await this.refreshHubSpotToken(refreshData.refresh_token);
            break;
          default:
            return { data: null, error: `Token refresh not implemented for provider: ${refreshData.provider}` };
        }

        if (!refreshedTokenData) {
          return { data: null, error: 'Failed to refresh token' };
        }

        // Update the token in database
        const updateData = {
          access_token: refreshedTokenData.access_token,
          refresh_token: refreshedTokenData.refresh_token || refreshData.refresh_token,
          expires_at: refreshedTokenData.expires_at ? new Date(refreshedTokenData.expires_at).getTime() : undefined,
          updated_at: new Date().toISOString(),
          status: 'active' as const
        };

        const updateResult = await this.update(tokenResult.data.id, updateData);
        
        if (!updateResult.success) {
          return { data: null, error: 'Failed to update refreshed token' };
        }

        this.logSuccess('Token refreshed successfully', { provider: refreshData.provider });
        return { data: updateResult.data, error: null };
      } catch (error) {
        return { data: null, error: `Failed to refresh token for ${refreshData.provider}` };
      }
    }, `refresh token for ${refreshData.provider}`);
  }

  /**
   * Refresh Microsoft Graph token
   */
  private async refreshMicrosoftToken(refreshToken: string): Promise<any> {
    const response = await fetch('/api/oauth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'microsoft',
        refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to refresh Microsoft token: ${errorData.details || errorData.error}`);
    }

    return response.json();
  }

  /**
   * Refresh Google token
   */
  private async refreshGoogleToken(refreshToken: string): Promise<any> {
    const response = await fetch('/api/oauth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to refresh Google token: ${errorData.details || errorData.error}`);
    }

    return response.json();
  }

  /**
   * Refresh HubSpot token
   */
  private async refreshHubSpotToken(refreshToken: string): Promise<any> {
    const response = await fetch('/api/oauth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'hubspot',
        refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to refresh HubSpot token: ${errorData.details || errorData.error}`);
    }

    return response.json();
  }

  /**
   * Validate a token
   */
  async validateToken(provider: OAuthProvider): Promise<ServiceResponse<TokenValidationResult>> {
    try {
      const tokenResult = await this.getTokenForProvider(provider);
      
      if (!tokenResult.success || !tokenResult.data) {
        return this.createSuccessResponse({ 
          isValid: false, 
          isExpired: true 
        });
      }

      const token = tokenResult.data;
      const now = Date.now();
      const isExpired = token.expires_at ? now > token.expires_at : false;
      const expiresIn = token.expires_at ? token.expires_at - now : undefined;

      // If token is expired, try to refresh it
      if (isExpired && token.status !== 'expired' && token.refresh_token) {
        this.logger.info('Token expired, attempting refresh', { provider });
        
        try {
          const refreshResult = await this.refreshToken({
            provider,
            refresh_token: token.refresh_token
          });
          
          if (refreshResult.success && refreshResult.data) {
            this.logger.info('Token refreshed successfully', { provider });
            return this.createSuccessResponse({ 
              isValid: true, 
              isExpired: false,
              expiresIn: refreshResult.data.expires_at ? refreshResult.data.expires_at - now : undefined
            });
          } else {
            this.logger.warn('Token refresh failed', { provider, error: refreshResult.error });
            // Update token status to expired
            await this.update(token.id, { status: 'expired' });
          }
        } catch (refreshError) {
          this.logger.error('Token refresh error', { provider, error: refreshError });
          // Update token status to expired
          await this.update(token.id, { status: 'expired' });
        }
      }

      // Update token status if expired
      if (isExpired && token.status !== 'expired') {
        await this.update(token.id, { status: 'expired' });
      }

      return this.createSuccessResponse({ 
        isValid: !isExpired && token.status === 'active',
        expiresIn,
        isExpired
      });
    } catch (error) {
      return this.handleError(error, `validate token for ${provider}`);
    }
  }

  /**
   * Revoke a token
   */
  async revokeToken(provider: OAuthProvider): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        const tokenResult = await this.getTokenForProvider(provider);
        
        if (!tokenResult.success || !tokenResult.data) {
          return { data: null, error: `No token found for ${provider}` };
        }

        // Update token status to revoked
        const updateResult = await this.update(tokenResult.data.id, { 
          status: 'revoked',
          updated_at: new Date().toISOString()
        });

        if (!updateResult.success) {
          return { data: null, error: 'Failed to revoke token' };
        }

        this.logSuccess('Token revoked successfully', { provider });
        return { data: true, error: null };
      } catch (error) {
        return { data: null, error: `Failed to revoke token for ${provider}` };
      }
    }, `revoke token for ${provider}`);
  }

  /**
   * Get active tokens
   */
  async getActiveTokens(): Promise<ServiceResponse<OAuthToken[]>> {
    return this.executeDbOperation(async () => {
      try {
        // Get current user ID
        const authResult = await authentikAuthService.getSession();
        const user = authResult.data?.user;
        
        if (!user) {
          const errorResult = handleSupabaseError(new Error('No user found'), 'get user for active tokens');
          return { data: null, error: errorResult.error };
        }

        const { data, error } = await select('oauth_tokens', '*', { 
          user_id: user.id, 
          status: 'active'
        });
        
        if (error) {
          const errorResult = handleSupabaseError(error, 'get active tokens');
          return { data: null, error: errorResult.error };
        }

        return { data: data as OAuthToken[] || [], error: null };
      } catch (error) {
        return { data: null, error: 'Failed to get active tokens' };
      }
    }, 'get active tokens');
  }

  /**
   * Cleanup expired tokens
   */
  async cleanupExpiredTokens(): Promise<ServiceResponse<number>> {
    return this.executeDbOperation(async () => {
      try {
        const now = Date.now();
        
        // Get all expired tokens
        const { data: expiredTokens, error } = await select('oauth_tokens', '*', {
          status: 'expired'
        });
        
        if (error) {
          const errorResult = handleSupabaseError(error, 'get expired tokens');
          return { data: null, error: errorResult.error };
        }

        let cleanedCount = 0;
        
        // Delete expired tokens
        for (const token of expiredTokens || []) {
          const deleteResult = await this.delete((token as any).id);
          if (deleteResult.success) {
            cleanedCount++;
          }
        }

        this.logSuccess('Expired tokens cleaned up', { count: cleanedCount });
        return { data: cleanedCount, error: null };
      } catch (error) {
        return { data: null, error: 'Failed to cleanup expired tokens' };
      }
    }, 'cleanup expired tokens');
  }

  /**
   * Get access token for user and source
   */
  async getAccessToken(userId: string, source: string): Promise<ServiceResponse<string>> {
    return this.executeDbOperation(async () => {
      try {
        this.validateStringParam(userId, 'userId');
        this.validateStringParam(source, 'source');
        
        const { data, error } = await select('oauth_tokens', 'access_token', { 
          user_id: userId, 
          provider: source,
          status: 'active'
        });
        
        if (error) {
          const errorResult = handleSupabaseError(error, `get access token for ${source}`);
          return { data: null, error: errorResult.error };
        }

        if (!data || data.length === 0) {
          return { data: null, error: `No active token found for ${source}` };
        }

        return { data: (data[0] as any).access_token, error: null };
      } catch (error) {
        return { data: null, error: `Failed to get access token for ${source}` };
      }
    }, `get access token for ${source}`);
  }

  /**
   * Check if user has valid tokens for provider
   */
  static async hasValidTokens(provider: OAuthProvider): Promise<boolean> {
    try {
      const service = new OAuthTokenService();
      const validationResult = await service.validateToken(provider);
      
      return validationResult.success && validationResult.data?.isValid === true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const oauthTokenService = new OAuthTokenService(); 
