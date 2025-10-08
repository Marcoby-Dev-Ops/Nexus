import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
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
      const idValidation = this.validateIdParam(id, 'id');
      if (idValidation) {
        return this.createErrorResponse<OAuthToken>(idValidation);
      }

  const { data, error } = await selectOne('oauth_tokens', { id });

      if (error) {
        this.logger.error('Failed to get OAuth token:', error);
        return this.createErrorResponse<OAuthToken>('Failed to get OAuth token');
      }

      if (!data) {
        return this.createErrorResponse<OAuthToken>('OAuth token not found');
      }

      return this.createSuccessResponse(data as OAuthToken);
    }, 'get OAuth token');
  }

  /**
   * Create a new token (implements CrudServiceInterface)
   */
  async create(data: Partial<OAuthToken>): Promise<ServiceResponse<OAuthToken>> {
    return this.executeDbOperation(async () => {
      const reqValidation = this.validateRequiredParams(data as Record<string, any>, ['user_id', 'provider', 'access_token', 'token_type']);
      if (!reqValidation.isValid) {
        return this.createErrorResponse<OAuthToken>(reqValidation.error || 'Missing required fields');
      }
      
      const tokenData = {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: data.status || 'active'
      };

  const { data: result, error } = await insertOne('oauth_tokens', tokenData);
      
      if (error) {
        this.logger.error('Failed to create OAuth token:', error);
        return this.createErrorResponse<OAuthToken>('Failed to create OAuth token');
      }

      this.logger.info('OAuth token created successfully', { provider: data.provider });
      return this.createSuccessResponse(result as OAuthToken);
    }, 'create OAuth token');
  }

  /**
   * Update a token (implements CrudServiceInterface)
   */
  async update(id: string, data: Partial<OAuthToken>): Promise<ServiceResponse<OAuthToken>> {
    return this.executeDbOperation(async () => {
      const idValidation2 = this.validateIdParam(id, 'id');
      if (idValidation2) {
        return this.createErrorResponse<OAuthToken>(idValidation2);
      }

      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await updateOne('oauth_tokens', id, updateData);
      
      if (error) {
        this.logger.error('Failed to update OAuth token:', error);
        return this.createErrorResponse<OAuthToken>('Failed to update OAuth token');
      }

      if (!result) {
        return this.createErrorResponse<OAuthToken>('OAuth token not found');
      }

      this.logger.info('OAuth token updated successfully', { tokenId: id });
      return this.createSuccessResponse(result as OAuthToken);
    }, 'update OAuth token');
  }

  /**
   * Delete a token (implements CrudServiceInterface)
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        this.validateIdParam(id);
        
        const { error } = await deleteOne('oauth_tokens', { id });

        if (error) {
          const msg = typeof error === 'string' ? error : (error && (error as any).message) ? (error as any).message : String(error);
          this.logger.error('delete OAuth token failed', { error: msg });
          return this.createErrorResponse<boolean>(`delete OAuth token: ${msg}`);
        }

        this.logSuccess('deleteOAuthToken', 'OAuth token deleted successfully', { tokenId: id });
        return this.createSuccessResponse(true);
      } catch (error) {
        this.logger.error('Failed to delete OAuth token', error);
        return this.createErrorResponse<boolean>('Failed to delete OAuth token');
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
          const msg = typeof error === 'string' ? error : (error && (error as any).message) ? (error as any).message : String(error);
          this.logger.error('list OAuth tokens failed', { error: msg });
          return this.createErrorResponse<OAuthToken[]>(`list OAuth tokens: ${msg}`);
        }

        return this.createSuccessResponse((data as OAuthToken[]) || []);
      } catch (err) {
        this.logger.error('list OAuth tokens failed', err);
        return this.createErrorResponse<OAuthToken[]>('Failed to list OAuth tokens');
      }
    }, 'list OAuth tokens');
  }

  /**
   * Get token for a specific provider
   */
  async getTokenForProvider(provider: OAuthProvider): Promise<ServiceResponse<OAuthToken>> {
    try {
      // Get current user ID
      const authResult = await authentikAuthService.getSession();
      const user = authResult.data?.user;
      
      if (!user) {
        return this.createErrorResponse<OAuthToken>('User not authenticated');
      }

      // Get token from database
      const { data, error } = await select<OAuthToken>({
        table: 'oauth_tokens',
        filters: { user_id: user.id, provider, status: 'active' },
        limit: 1,
        orderBy: [{ column: 'created_at', ascending: false }]
      });

      if (error || !data || data.length === 0) {
        return this.createErrorResponse<OAuthToken>(`No active token found for ${provider}`);
      }

      // Check if token is expired
      const token = data[0];
      if (token.expires_at && new Date(token.expires_at * 1000) < new Date()) {
        // Token is expired, try to refresh it
        if (token.refresh_token) {
          const refreshResult = await this.refreshToken({
            provider,
            refresh_token: token.refresh_token
          });
          
          if (refreshResult.success) {
            return this.createSuccessResponse(refreshResult.data!);
          }
          
          // If refresh fails, return the expired token with a warning
          return this.createErrorResponse<OAuthToken>('Token expired and could not be refreshed');
        }
        
        return this.createErrorResponse<OAuthToken>('Token has expired');
      }

      return this.createSuccessResponse(token);
    } catch (err) {
      this.logger.error(`Error getting token for ${provider}:`, err);
      const msg = typeof err === 'string' ? err : (err && (err as any).message) ? (err as any).message : String(err);
      return this.createErrorResponse<OAuthToken>(`Failed to get token for ${provider}: ${msg}`);
    }
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
          const errMsg = 'No user found';
          this.logger.error('storeToken: no user found');
          return this.createErrorResponse<OAuthToken>(errMsg);
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
      } catch (err) {
        this.logger.error(`Failed to store token for ${provider}`, err);
        return this.createErrorResponse<OAuthToken>(`Failed to store token for ${provider}`);
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
          return this.createErrorResponse<OAuthToken>(`No token found for ${refreshData.provider}`);
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
        return this.createErrorResponse<OAuthToken>(`Token refresh not implemented for provider: ${refreshData.provider}`);
        }

        if (!refreshedTokenData) {
          return this.createErrorResponse<OAuthToken>('Failed to refresh token');
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
          return this.createErrorResponse<OAuthToken>('Failed to update refreshed token');
        }

        this.logSuccess('refreshToken', 'Token refreshed successfully', { provider: refreshData.provider });
        return this.createSuccessResponse(updateResult.data!);
      } catch (err) {
        this.logger.error(`Failed to refresh token for ${refreshData.provider}`, err);
        const msg = typeof err === 'string' ? err : (err && (err as any).message) ? (err as any).message : String(err);
        return this.createErrorResponse<OAuthToken>(`Failed to refresh token for ${refreshData.provider}: ${msg}`);
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
          return this.createErrorResponse<boolean>(`No token found for ${provider}`);
        }

        // Update token status to revoked
        const updateResult = await this.update(tokenResult.data.id, { 
          status: 'revoked',
          updated_at: new Date().toISOString()
        });

        if (!updateResult.success) {
          return this.createErrorResponse<boolean>('Failed to revoke token');
        }

  this.logSuccess('revokeToken', 'Token revoked successfully', { provider });
        return this.createSuccessResponse(true);
      } catch (err) {
        this.logger.error(`Failed to revoke token for ${provider}`, err);
        const msg = typeof err === 'string' ? err : (err && (err as any).message) ? (err as any).message : String(err);
        return this.createErrorResponse<boolean>(`Failed to revoke token for ${provider}: ${msg}`);
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
          const errMsg = 'No user found';
          this.logger.error('getActiveTokens: no user found');
          return this.createErrorResponse<OAuthToken[]>(errMsg);
        }

        const { data, error } = await select('oauth_tokens', '*', { 
          user_id: user.id, 
          status: 'active'
        });
        
        if (error) {
          const msg = typeof error === 'string' ? error : (error && (error as any).message) ? (error as any).message : String(error);
          this.logger.error('getActiveTokens failed', { error: msg });
          return this.createErrorResponse<OAuthToken[]>(`get active tokens: ${msg}`);
        }

        return this.createSuccessResponse((data as OAuthToken[]) || []);
      } catch (err) {
        this.logger.error('getActiveTokens failed', err);
        return this.createErrorResponse<OAuthToken[]>('Failed to get active tokens');
      }
    }, 'get active tokens');
  }

  /**
   * Cleanup expired tokens
   */
  async cleanupExpiredTokens(): Promise<ServiceResponse<number>> {
    return this.executeDbOperation(async () => {
      try {
        // const now used for potential logging or timestamp math
        
        // Get all expired tokens
        const { data: expiredTokens, error } = await select('oauth_tokens', '*', {
          status: 'expired'
        });
        
        if (error) {
          const msg = typeof error === 'string' ? error : (error && (error as any).message) ? (error as any).message : String(error);
          this.logger.error('cleanupExpiredTokens: select expired tokens failed', { error: msg });
          return this.createErrorResponse<number>(`get expired tokens: ${msg}`);
        }

        let cleanedCount = 0;
        
        // Delete expired tokens
        for (const token of expiredTokens || []) {
          const deleteResult = await this.delete((token as any).id);
          if (deleteResult.success) {
            cleanedCount++;
          }
        }

  this.logSuccess('cleanupExpiredTokens', 'Expired tokens cleaned up', { count: cleanedCount });
        return this.createSuccessResponse(cleanedCount);
      } catch (err) {
        this.logger.error('cleanupExpiredTokens failed', err);
        return this.createErrorResponse<number>('Failed to cleanup expired tokens');
      }
    }, 'cleanup expired tokens');
  }

  /**
   * Get access token for user and source
   */
  async getAccessToken(userId: string, source: string): Promise<ServiceResponse<string>> {
    return this.executeDbOperation(async () => {
      try {
  this.validateStringParams({ userId, source }, ['userId', 'source']);
        
        const { data, error } = await select('oauth_tokens', 'access_token', { 
          user_id: userId, 
          provider: source,
          status: 'active'
        });
        
        if (error) {
          const msg = typeof error === 'string' ? error : (error && (error as any).message) ? (error as any).message : String(error);
          this.logger.error('getAccessToken failed', { error: msg });
          return this.createErrorResponse<string>(`get access token for ${source}: ${msg}`);
        }

        if (!data || data.length === 0) {
          return this.createErrorResponse<string>(`No active token found for ${source}`);
        }

        return this.createSuccessResponse((data[0] as any).access_token);
      } catch (err) {
        this.logger.error(`Failed to get access token for ${source}`, err);
        return this.createErrorResponse<string>(`Failed to get access token for ${source}`);
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
      // Swallow errors but log for diagnostics using singleton
      oauthTokenService.logger.error('hasValidTokens check failed', error);
      return false;
    }
  }
}

// Export singleton instance
export const oauthTokenService = new OAuthTokenService(); 
