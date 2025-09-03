// Jest globals are available globally
import { OAuthTokenService } from '@/core/auth/OAuthTokenService';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { select, selectOne } from '@/lib/api-client';

// Mock the dependencies
jest.mock('@/core/auth/authentikAuthServiceInstance');
jest.mock('@/lib/api-client');

describe('OAuthTokenService', () => {
  let oauthTokenService: OAuthTokenService;
  
  // Mock data
  const mockUser = { id: 'user-123' };
  const mockToken = {
    id: 'token-123',
    user_id: 'user-123',
    provider: 'hubspot',
    access_token: 'test-access-token',
    token_type: 'bearer',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  beforeEach(() => {
    // Create a fresh instance for each test
    oauthTokenService = new OAuthTokenService();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    (authentikAuthService.getSession as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
  });

  describe('getTokenForProvider', () => {
    it('should retrieve token for user and provider', async () => {
      // Mock successful token fetch
      (select as jest.Mock).mockResolvedValueOnce({
        data: [mockToken],
        error: null
      });

      const result = await oauthTokenService.getTokenForProvider('hubspot');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockToken);
      expect(select).toHaveBeenCalledWith(
        'oauth_tokens',
        {
          user_id: mockUser.id,
          provider: 'hubspot',
          status: 'active'
        },
        {
          limit: 1,
          orderBy: { column: 'created_at', ascending: false }
        }
      );
    });

    it('should handle token not found', async () => {
      // Mock no tokens found
      (select as jest.Mock).mockResolvedValueOnce({
        data: [],
        error: null
      });

      const result = await oauthTokenService.getTokenForProvider('hubspot');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active token found for hubspot');
    });

    it('should handle unauthenticated user', async () => {
      // Mock no user authenticated
      (authentikAuthService.getSession as jest.Mock).mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      const result = await oauthTokenService.getTokenForProvider('hubspot');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });

    it('should handle expired token with refresh', async () => {
      // Mock expired token
      const expiredToken = {
        ...mockToken,
        expires_at: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      
      // Mock refresh token
      const refreshedToken = {
        ...mockToken,
        access_token: 'new-access-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      // First call: return expired token
      (select as jest.Mock).mockResolvedValueOnce({
        data: [expiredToken],
        error: null
      });

      // Mock refresh token call
      jest.spyOn(oauthTokenService, 'refreshToken').mockResolvedValueOnce({
        success: true,
        data: refreshedToken,
        error: null
      });

      const result = await oauthTokenService.getTokenForProvider('hubspot');

      expect(result.success).toBe(true);
      expect(result.data?.access_token).toBe('new-access-token');
      expect(oauthTokenService.refreshToken).toHaveBeenCalledWith({
        provider: 'hubspot',
        refresh_token: mockToken.refresh_token
      });
    });
  });

  describe('storeToken', () => {
    it('should store new OAuth token', async () => {
      const tokenData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_at: Date.now() + 3600000,
      };

      const result = await oauthTokenService.storeToken('hubspot', tokenData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(tokenData);
      expect(selectOne).toHaveBeenCalledWith(
        'oauth_tokens',
        {
          user_id: mockUser.id,
          provider: 'hubspot'
        }
      );
    });

    it('should handle storage failure', async () => {
      const tokenData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_at: Date.now() + 3600000,
      };

      (selectOne as jest.Mock).mockRejectedValueOnce({
        error: 'Storage error'
      });

      const result = await oauthTokenService.storeToken('hubspot', tokenData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage error');
    });
  });

  describe('update', () => {
    it('should update existing OAuth token', async () => {
      const tokenId = 'token-123';
      const updateData = {
        access_token: 'updated-access-token',
        expires_at: Date.now() + 7200000,
      };

      const result = await oauthTokenService.update(tokenId, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updateData);
      expect(selectOne).toHaveBeenCalledWith(
        'oauth_tokens',
        {
          id: tokenId
        }
      );
    });

    it('should handle update failure', async () => {
      const tokenId = 'token-123';
      const updateData = {
        access_token: 'updated-access-token',
        expires_at: Date.now() + 7200000,
      };

      (selectOne as jest.Mock).mockRejectedValueOnce({
        error: 'Update error'
      });

      const result = await oauthTokenService.update(tokenId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update error');
    });
  });

  describe('delete', () => {
    it('should delete OAuth token', async () => {
      const tokenId = 'token-123';

      const result = await oauthTokenService.delete(tokenId);

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(selectOne).toHaveBeenCalledWith(
        'oauth_tokens',
        {
          id: tokenId
        }
      );
    });

    it('should handle deletion failure', async () => {
      const tokenId = 'token-123';

      (selectOne as jest.Mock).mockRejectedValueOnce({
        error: 'Deletion error'
      });

      const result = await oauthTokenService.delete(tokenId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Deletion error');
    });
  });

  describe('list', () => {
    it('should list all tokens for a user', async () => {
      const result = await oauthTokenService.list();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockToken]);
      expect(select).toHaveBeenCalledWith(
        'oauth_tokens',
        {
          user_id: mockUser.id
        }
      );
    });

    it('should handle list failure', async () => {
      (select as jest.Mock).mockRejectedValueOnce({
        error: 'List error'
      });

      const result = await oauthTokenService.list();

      expect(result.success).toBe(false);
      expect(result.error).toBe('List error');
    });
  });

  describe('get', () => {
    it('should get token by ID', async () => {
      const tokenId = 'token-123';

      const result = await oauthTokenService.get(tokenId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockToken);
      expect(selectOne).toHaveBeenCalledWith(
        'oauth_tokens',
        {
          id: tokenId
        }
      );
    });

    it('should handle token not found', async () => {
      const tokenId = 'token-123';

      (selectOne as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await oauthTokenService.get(tokenId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token not found');
    });
  });

  describe('create', () => {
    it('should create new token', async () => {
      const tokenData = {
        user_id: 'user-123',
        provider: 'hubspot' as OAuthProvider,
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        token_type: 'Bearer',
        expires_at: Date.now() + 3600000,
      };

      const result = await oauthTokenService.create(tokenData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(tokenData);
      expect(selectOne).toHaveBeenCalledWith(
        'oauth_tokens',
        {
          user_id: tokenData.user_id,
          provider: tokenData.provider
        }
      );
    });

    it('should handle creation failure', async () => {
      const tokenData = {
        user_id: 'user-123',
        provider: 'hubspot' as OAuthProvider,
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        token_type: 'Bearer',
        expires_at: Date.now() + 3600000,
      };

      (selectOne as jest.Mock).mockRejectedValueOnce({
        error: 'Creation error'
      });

      const result = await oauthTokenService.create(tokenData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Creation error');
    });
  });

  describe('refreshToken', () => {
    it('should refresh OAuth token', async () => {
      const refreshData = {
        provider: 'hubspot' as OAuthProvider,
        refresh_token: 'refresh-token-123',
      };

      const result = await oauthTokenService.refreshToken(refreshData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(refreshData);
      expect(selectOne).toHaveBeenCalledWith(
        'oauth_tokens',
        {
          provider: refreshData.provider,
          refresh_token: refreshData.refresh_token
        }
      );
    });

    it('should handle refresh failure', async () => {
      const refreshData = {
        provider: 'hubspot' as OAuthProvider,
        refresh_token: 'refresh-token-123',
      };

      (selectOne as jest.Mock).mockRejectedValueOnce({
        error: 'Refresh error'
      });

      const result = await oauthTokenService.refreshToken(refreshData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refresh error');
    });
  });

  describe('validateToken', () => {
    it('should validate active token', async () => {
      const provider = 'hubspot' as OAuthProvider;

      const result = await oauthTokenService.validateToken(provider);

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(selectOne).toHaveBeenCalledWith(
        'oauth_tokens',
        {
          provider,
          status: 'active'
        }
      );
    });

    it('should detect expired token', async () => {
      const provider = 'hubspot' as OAuthProvider;

      (selectOne as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await oauthTokenService.validateToken(provider);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token not found');
    });
  });

  describe('revokeToken', () => {
    it('should revoke OAuth token', async () => {
      const provider = 'hubspot' as OAuthProvider;

      const result = await oauthTokenService.revokeToken(provider);

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(selectOne).toHaveBeenCalledWith(
        'oauth_tokens',
        {
          provider
        }
      );
    });

    it('should handle revocation failure', async () => {
      const provider = 'hubspot' as OAuthProvider;

      (selectOne as jest.Mock).mockRejectedValueOnce({
        error: 'Revocation error'
      });

      const result = await oauthTokenService.revokeToken(provider);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Revocation error');
    });
  });

  describe('getActiveTokens', () => {
    it('should get all active tokens', async () => {
      const result = await oauthTokenService.getActiveTokens();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockToken]);
      expect(select).toHaveBeenCalledWith(
        'oauth_tokens',
        {
          status: 'active'
        }
      );
    });

    it('should handle active tokens failure', async () => {
      (select as jest.Mock).mockRejectedValueOnce({
        error: 'Active tokens error'
      });

      const result = await oauthTokenService.getActiveTokens();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Active tokens error');
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired tokens', async () => {
      const result = await oauthTokenService.cleanupExpiredTokens();

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(select).toHaveBeenCalledWith(
        'oauth_tokens',
        {
          expires_at: { lt: Date.now() }
        }
      );
    });

    it('should handle cleanup failure', async () => {
      (select as jest.Mock).mockRejectedValueOnce({
        error: 'Cleanup error'
      });

      const result = await oauthTokenService.cleanupExpiredTokens();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cleanup error');
    });
  });
}); 