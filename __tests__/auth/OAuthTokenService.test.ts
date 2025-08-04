import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { OAuthTokenService } from '@/core/auth/OAuthTokenService';
import { supabase } from '@/lib/supabase';
import type { OAuthToken, OAuthProvider } from '@/core/auth/OAuthTokenService';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('OAuthTokenService', () => {
  let oauthTokenService: OAuthTokenService;

  beforeEach(() => {
    oauthTokenService = new OAuthTokenService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTokenForProvider', () => {
    it('should retrieve token for user and provider', async () => {
      const mockUser = { id: 'user-123' };
      const mockToken: OAuthToken = {
        id: 'token-123',
        user_id: 'user-123',
        provider: 'hubspot',
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        token_type: 'Bearer',
        expires_at: Date.now() + 3600000,
        scope: 'read',
        status: 'active',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockToken,
          error: null,
        }),
      } as any);

      const result = await oauthTokenService.getTokenForProvider('hubspot');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockToken);
    });

    it('should handle token not found', async () => {
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Token not found' },
        }),
      } as any);

      const result = await oauthTokenService.getTokenForProvider('hubspot');

      expect(result.success).toBe(false);
      expect(result.error).toContain('OAuth token not found');
    });
  });

  describe('storeToken', () => {
    it('should store new OAuth token', async () => {
      const mockUser = { id: 'user-123' };
      const tokenData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Date.now() + 3600000,
        scope: 'read write',
      };

      const storedToken: OAuthToken = {
        id: 'token-456',
        user_id: 'user-123',
        provider: 'hubspot',
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_at: Date.now() + 3600000,
        scope: 'read write',
        status: 'active',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [storedToken],
          error: null,
        }),
      } as any);

      const result = await oauthTokenService.storeToken('hubspot', tokenData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(storedToken);
    });

    it('should handle storage failure', async () => {
      const mockUser = { id: 'user-123' };
      const tokenData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Date.now() + 3600000,
        scope: 'read write',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage failed' },
        }),
      } as any);

      const result = await oauthTokenService.storeToken('hubspot', tokenData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to store OAuth token');
    });
  });

  describe('update', () => {
    it('should update existing OAuth token', async () => {
      const tokenId = 'token-123';
      const updateData = {
        access_token: 'updated-access-token',
        refresh_token: 'updated-refresh-token',
        expires_at: Date.now() + 7200000,
      };

      const updatedToken: OAuthToken = {
        id: tokenId,
        user_id: 'user-123',
        provider: 'hubspot',
        access_token: 'updated-access-token',
        refresh_token: 'updated-refresh-token',
        token_type: 'Bearer',
        expires_at: Date.now() + 7200000,
        scope: 'read',
        status: 'active',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [updatedToken],
          error: null,
        }),
      } as any);

      const result = await oauthTokenService.update(tokenId, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedToken);
    });

    it('should handle update failure', async () => {
      const tokenId = 'token-123';
      const updateData = {
        access_token: 'updated-access-token',
      };

      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      } as any);

      const result = await oauthTokenService.update(tokenId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update OAuth token');
    });
  });

  describe('delete', () => {
    it('should delete OAuth token', async () => {
      const tokenId = 'token-123';
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      const result = await oauthTokenService.delete(tokenId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should handle deletion failure', async () => {
      const tokenId = 'token-123';
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Deletion failed' },
        }),
      } as any);

      const result = await oauthTokenService.delete(tokenId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to delete OAuth token');
    });
  });

  describe('list', () => {
    it('should list all tokens for a user', async () => {
      const userId = 'user-123';
      const mockTokens: OAuthToken[] = [
        {
          id: 'token-1',
          user_id: userId,
          provider: 'hubspot',
          access_token: 'token-1-access',
          refresh_token: 'token-1-refresh',
          token_type: 'Bearer',
          expires_at: Date.now() + 3600000,
          scope: 'read',
          status: 'active',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'token-2',
          user_id: userId,
          provider: 'salesforce',
          access_token: 'token-2-access',
          refresh_token: 'token-2-refresh',
          token_type: 'Bearer',
          expires_at: Date.now() + 7200000,
          scope: 'read write',
          status: 'active',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      const mockUser = { id: userId };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockTokens,
          error: null,
        }),
      } as any);

      const result = await oauthTokenService.list();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTokens);
    });

    it('should handle list failure', async () => {
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'List failed' },
        }),
      } as any);

      const result = await oauthTokenService.list();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to list OAuth tokens');
    });
  });

  describe('get', () => {
    it('should get token by ID', async () => {
      const tokenId = 'token-123';
      const mockToken: OAuthToken = {
        id: tokenId,
        user_id: 'user-123',
        provider: 'hubspot',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_at: Date.now() + 3600000,
        scope: 'read',
        status: 'active',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockToken,
          error: null,
        }),
      } as any);

      const result = await oauthTokenService.get(tokenId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockToken);
    });

    it('should handle token not found', async () => {
      const tokenId = 'nonexistent-token';
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Token not found' },
        }),
      } as any);

      const result = await oauthTokenService.get(tokenId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('OAuth token not found');
    });
  });

  describe('create', () => {
    it('should create new token', async () => {
      const tokenData: Omit<OAuthToken, 'id' | 'created_at' | 'updated_at'> = {
        user_id: 'user-123',
        provider: 'hubspot',
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_at: Date.now() + 3600000,
        scope: 'read write',
        status: 'active',
      };

      const createdToken: OAuthToken = {
        id: 'token-456',
        ...tokenData,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [createdToken],
          error: null,
        }),
      } as any);

      const result = await oauthTokenService.create(tokenData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdToken);
    });
  });

  describe('refreshToken', () => {
    it('should refresh OAuth token', async () => {
      const tokenId = 'token-123';
      const refreshData = {
        provider: 'hubspot' as OAuthProvider,
        refresh_token: 'valid-refresh-token',
      };

      const refreshedToken: OAuthToken = {
        id: tokenId,
        user_id: 'user-123',
        provider: 'hubspot',
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_at: Date.now() + 3600000,
        scope: 'read write',
        status: 'active',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: refreshedToken,
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
      } as any);

      const result = await oauthTokenService.refreshToken(refreshData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(refreshedToken);
    });

    it('should handle refresh failure', async () => {
      const refreshData = {
        provider: 'hubspot' as OAuthProvider,
        refresh_token: 'invalid-refresh-token',
      };

      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Token not found' },
        }),
      } as any);

      const result = await oauthTokenService.refreshToken(refreshData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to refresh OAuth token');
    });
  });

  describe('validateToken', () => {
    it('should validate active token', async () => {
      const provider: OAuthProvider = 'hubspot';
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'token-123',
            user_id: 'user-123',
            provider: 'hubspot',
            access_token: 'valid-token',
            token_type: 'Bearer',
            expires_at: Date.now() + 3600000,
            status: 'active',
          },
          error: null,
        }),
      } as any);

      const result = await oauthTokenService.validateToken(provider);

      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(true);
      expect(result.data?.isExpired).toBe(false);
    });

    it('should detect expired token', async () => {
      const provider: OAuthProvider = 'hubspot';
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'token-123',
            user_id: 'user-123',
            provider: 'hubspot',
            access_token: 'expired-token',
            token_type: 'Bearer',
            expires_at: Date.now() - 3600000, // Expired
            status: 'expired',
          },
          error: null,
        }),
      } as any);

      const result = await oauthTokenService.validateToken(provider);

      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(false);
      expect(result.data?.isExpired).toBe(true);
    });
  });

  describe('revokeToken', () => {
    it('should revoke OAuth token', async () => {
      const provider: OAuthProvider = 'hubspot';
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      const result = await oauthTokenService.revokeToken(provider);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });

  describe('getActiveTokens', () => {
    it('should get all active tokens', async () => {
      const mockUser = { id: 'user-123' };
      const activeTokens: OAuthToken[] = [
        {
          id: 'token-1',
          user_id: 'user-123',
          provider: 'hubspot',
          access_token: 'token-1-access',
          token_type: 'Bearer',
          status: 'active',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'token-2',
          user_id: 'user-123',
          provider: 'salesforce',
          access_token: 'token-2-access',
          token_type: 'Bearer',
          status: 'active',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: activeTokens,
          error: null,
        }),
      } as any);

      const result = await oauthTokenService.getActiveTokens();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(activeTokens);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired tokens', async () => {
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      const result = await oauthTokenService.cleanupExpiredTokens();

      expect(result.success).toBe(true);
      expect(result.data).toBe(0); // Number of tokens cleaned up
    });
  });
}); 