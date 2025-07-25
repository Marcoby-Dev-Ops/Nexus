import { supabase } from '@/lib/supabase';

export interface TokenInfo {
  id: string;
  name: string;
  type: 'api' | 'oauth' | 'integration';
  status: 'active' | 'expired' | 'revoked' | 'pending';
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  scopes?: string[];
  metadata?: Record<string, any>;
}

interface TokenManagerResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class TokenManager {
  async getTokens(userId: string): Promise<TokenManagerResponse<TokenInfo[]>> {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch tokens',
      };
    }
  }

  async createToken(userId: string, tokenData: {
    name: string;
    type: 'api' | 'oauth' | 'integration';
    scopes?: string[];
    metadata?: Record<string, any>;
  }): Promise<TokenManagerResponse<TokenInfo>> {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .insert({
          user_id: userId,
          name: tokenData.name,
          type: tokenData.type,
          status: 'active',
          scopes: tokenData.scopes || [],
          metadata: tokenData.metadata || {},
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create token',
      };
    }
  }

  async revokeToken(tokenId: string): Promise<TokenManagerResponse<void>> {
    try {
      const { error } = await supabase
        .from('user_tokens')
        .update({
          status: 'revoked',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tokenId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to revoke token',
      };
    }
  }

  async refreshToken(tokenId: string): Promise<TokenManagerResponse<TokenInfo>> {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tokenId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to refresh token',
      };
    }
  }

  async validateToken(tokenId: string): Promise<TokenManagerResponse<{
    isValid: boolean;
    status: string;
    expiresAt?: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('status, expires_at')
        .eq('id', tokenId)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const isValid = data.status === 'active' && 
        (!data.expires_at || new Date(data.expires_at) > new Date());

      return {
        success: true,
        data: {
          isValid,
          status: data.status,
          expiresAt: data.expires_at,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to validate token',
      };
    }
  }

  async updateTokenMetadata(tokenId: string, metadata: Record<string, any>): Promise<TokenManagerResponse<TokenInfo>> {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .update({
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tokenId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update token metadata',
      };
    }
  }

  async getTokenUsage(tokenId: string): Promise<TokenManagerResponse<{
    totalRequests: number;
    lastUsed: string;
    usageByDate: Record<string, number>;
  }>> {
    try {
      // TODO: Implement actual usage tracking
      // For now, return mock data
      const mockUsage = {
        totalRequests: Math.floor(Math.random() * 1000),
        lastUsed: new Date().toISOString(),
        usageByDate: {
          [new Date().toISOString().split('T')[0]]: Math.floor(Math.random() * 100),
        },
      };

      return {
        success: true,
        data: mockUsage,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get token usage',
      };
    }
  }
}

export const tokenManager = new TokenManager(); 