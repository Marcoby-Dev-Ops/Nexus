import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from './interfaces';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Zod schemas for validation
export const OAuthTokenSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  provider: z.enum(['microsoft', 'google', 'outlook', 'yahoo', 'hubspot', 'salesforce', 'stripe', 'paypal']),
  access_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.string().default('Bearer'),
  expires_at: z.number().optional(),
  scope: z.string().optional(),
  status: z.enum(['active', 'expired', 'revoked']).default('active'),
});

export const TokenRefreshSchema = z.object({
  provider: z.enum(['microsoft', 'google', 'outlook', 'yahoo', 'hubspot', 'salesforce', 'stripe', 'paypal']),
  refresh_token: z.string(),
});

export type OAuthProvider = 'microsoft' | 'google' | 'outlook' | 'yahoo' | 'hubspot' | 'salesforce' | 'stripe' | 'paypal';

export interface OAuthToken {
  id: string;
  user_id: string;
  provider: OAuthProvider;
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_at?: number;
  scope?: string;
  status: 'active' | 'expired' | 'revoked';
  created_at?: string;
  updated_at?: string;
}

export interface TokenRefreshRequest {
  provider: OAuthProvider;
  refresh_token: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  expiresIn?: number;
  provider: OAuthProvider;
}

/**
 * OAuth Token Service
 * Handles OAuth token management, storage, and refresh operations
 * Extends BaseService for consistent error handling and logging
 */
export class OAuthTokenService extends BaseService implements CrudServiceInterface<OAuthToken> {
  constructor() {
    super('oauth-token');
  }

  /**
   * Get an OAuth token by ID (implements CrudServiceInterface)
   */
  async get(id: string): Promise<ServiceResponse<OAuthToken>> {
    try {
      this.validateIdParam(id);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get token from database
      const { data: token, error } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        return this.createErrorResponse('Failed to get OAuth token', error.message);
      }

      if (!token) {
        return this.createErrorResponse('OAuth token not found');
      }

      return this.createSuccessResponse(token as OAuthToken);
    } catch (error) {
      return this.handleError('Failed to get OAuth token', error);
    }
  }

  /**
   * Create a new OAuth token (implements CrudServiceInterface)
   */
  async create(data: Partial<OAuthToken>): Promise<ServiceResponse<OAuthToken>> {
    try {
      // Validate token data
      const validatedData = OAuthTokenSchema.parse(data);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Create token in database
      const { data: token, error } = await supabase
        .from('oauth_tokens')
        .insert({
          ...validatedData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        return this.createErrorResponse('Failed to create OAuth token', error.message);
      }

      this.logSuccess('OAuth token created successfully', { tokenId: token.id, provider: token.provider });
      return this.createSuccessResponse(token as OAuthToken);
    } catch (error) {
      return this.handleError('Failed to create OAuth token', error);
    }
  }

  /**
   * Update an OAuth token (implements CrudServiceInterface)
   */
  async update(id: string, data: Partial<OAuthToken>): Promise<ServiceResponse<OAuthToken>> {
    try {
      this.validateIdParam(id);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Update token in database
      const { data: token, error } = await supabase
        .from('oauth_tokens')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return this.createErrorResponse('Failed to update OAuth token', error.message);
      }

      this.logSuccess('OAuth token updated successfully', { tokenId: id });
      return this.createSuccessResponse(token as OAuthToken);
    } catch (error) {
      return this.handleError('Failed to update OAuth token', error);
    }
  }

  /**
   * Delete an OAuth token (implements CrudServiceInterface)
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      this.validateIdParam(id);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Delete token from database
      const { error } = await supabase
        .from('oauth_tokens')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        return this.createErrorResponse('Failed to delete OAuth token', error.message);
      }

      this.logSuccess('OAuth token deleted successfully', { tokenId: id });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError('Failed to delete OAuth token', error);
    }
  }

  /**
   * List OAuth tokens (implements CrudServiceInterface)
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<OAuthToken[]>> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Build query
      let query = supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user.id);

      // Apply filters
      if (filters?.provider) {
        query = query.eq('provider', filters.provider);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      // Execute query
      const { data: tokens, error } = await query;

      if (error) {
        return this.createErrorResponse('Failed to fetch OAuth tokens', error.message);
      }

      this.logSuccess('OAuth tokens fetched successfully', { count: tokens?.length || 0 });
      return this.createSuccessResponse(tokens as OAuthToken[]);
    } catch (error) {
      return this.handleError('Failed to fetch OAuth tokens', error);
    }
  }

  /**
   * Get token for a specific provider
   */
  async getTokenForProvider(provider: OAuthProvider): Promise<ServiceResponse<OAuthToken>> {
    try {
      this.validateStringParam(provider, 'provider');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get token for provider
      const { data: token, error } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .eq('status', 'active')
        .single();

      if (error) {
        return this.createErrorResponse('Failed to get OAuth token for provider', error.message);
      }

      if (!token) {
        return this.createErrorResponse('No active token found for provider');
      }

      return this.createSuccessResponse(token as OAuthToken);
    } catch (error) {
      return this.handleError('Failed to get OAuth token for provider', error);
    }
  }

  /**
   * Store OAuth token for a provider
   */
  async storeToken(provider: OAuthProvider, tokenData: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
    scope?: string;
  }): Promise<ServiceResponse<OAuthToken>> {
    try {
      this.validateStringParam(provider, 'provider');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Check if token already exists for this provider
      const { data: existingToken } = await supabase
        .from('oauth_tokens')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .single();

      if (existingToken) {
        // Update existing token
        const { data: token, error } = await supabase
          .from('oauth_tokens')
          .update({
            ...tokenData,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingToken.id)
          .select()
          .single();

        if (error) {
          return this.createErrorResponse('Failed to update OAuth token', error.message);
        }

        this.logSuccess('OAuth token updated successfully', { provider });
        return this.createSuccessResponse(token as OAuthToken);
      } else {
        // Create new token
        const { data: token, error } = await supabase
          .from('oauth_tokens')
          .insert({
            user_id: user.id,
            provider,
            ...tokenData,
            status: 'active',
          })
          .select()
          .single();

        if (error) {
          return this.createErrorResponse('Failed to create OAuth token', error.message);
        }

        this.logSuccess('OAuth token created successfully', { provider });
        return this.createSuccessResponse(token as OAuthToken);
      }
    } catch (error) {
      return this.handleError('Failed to store OAuth token', error);
    }
  }

  /**
   * Refresh OAuth token
   */
  async refreshToken(data: TokenRefreshRequest): Promise<ServiceResponse<OAuthToken>> {
    try {
      // Validate request
      const validatedData = TokenRefreshSchema.parse(data);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get existing token
      const { data: existingToken, error: getError } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', validatedData.provider)
        .single();

      if (getError || !existingToken) {
        return this.createErrorResponse('No token found for provider');
      }

      // This would typically call the provider's refresh endpoint
      // For now, we'll simulate a successful refresh
      const refreshedToken = {
        ...existingToken,
        access_token: `refreshed_${Date.now()}`,
        expires_at: Date.now() + 3600000, // 1 hour from now
        status: 'active' as const,
        updated_at: new Date().toISOString(),
      };

      // Update token in database
      const { data: token, error } = await supabase
        .from('oauth_tokens')
        .update(refreshedToken)
        .eq('id', existingToken.id)
        .select()
        .single();

      if (error) {
        return this.createErrorResponse('Failed to refresh OAuth token', error.message);
      }

      this.logSuccess('OAuth token refreshed successfully', { provider: validatedData.provider });
      return this.createSuccessResponse(token as OAuthToken);
    } catch (error) {
      return this.handleError('Failed to refresh OAuth token', error);
    }
  }

  /**
   * Revoke OAuth token
   */
  async revokeToken(provider: OAuthProvider): Promise<ServiceResponse<boolean>> {
    try {
      this.validateStringParam(provider, 'provider');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Update token status to revoked
      const { error } = await supabase
        .from('oauth_tokens')
        .update({
          status: 'revoked',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (error) {
        return this.createErrorResponse('Failed to revoke OAuth token', error.message);
      }

      this.logSuccess('OAuth token revoked successfully', { provider });
      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError('Failed to revoke OAuth token', error);
    }
  }

  /**
   * Validate OAuth token
   */
  async validateToken(provider: OAuthProvider): Promise<ServiceResponse<TokenValidationResult>> {
    try {
      this.validateStringParam(provider, 'provider');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get token for provider
      const { data: token, error } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .single();

      if (error || !token) {
        return this.createSuccessResponse({
          isValid: false,
          isExpired: true,
          provider,
        });
      }

      const now = Date.now();
      const isExpired = token.expires_at ? now > token.expires_at : false;
      const isValid = token.status === 'active' && !isExpired;
      const expiresIn = token.expires_at ? token.expires_at - now : undefined;

      return this.createSuccessResponse({
        isValid,
        isExpired,
        expiresIn,
        provider,
      });
    } catch (error) {
      return this.handleError('Failed to validate OAuth token', error);
    }
  }

  /**
   * Get all active tokens for user
   */
  async getActiveTokens(): Promise<ServiceResponse<OAuthToken[]>> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get active tokens
      const { data: tokens, error } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        return this.createErrorResponse('Failed to fetch active tokens', error.message);
      }

      this.logSuccess('Active tokens fetched successfully', { count: tokens?.length || 0 });
      return this.createSuccessResponse(tokens as OAuthToken[]);
    } catch (error) {
      return this.handleError('Failed to fetch active tokens', error);
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<ServiceResponse<number>> {
    try {
      const now = Date.now();

      // Update expired tokens
      const { data, error } = await supabase
        .from('oauth_tokens')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .lt('expires_at', now)
        .eq('status', 'active');

      if (error) {
        return this.createErrorResponse('Failed to cleanup expired tokens', error.message);
      }

      const cleanedCount = data?.length || 0;
      this.logSuccess('Expired tokens cleaned up successfully', { count: cleanedCount });
      return this.createSuccessResponse(cleanedCount);
    } catch (error) {
      return this.handleError('Failed to cleanup expired tokens', error);
    }
  }
}

// Export singleton instance
export const oauthTokenService = new OAuthTokenService(); 
