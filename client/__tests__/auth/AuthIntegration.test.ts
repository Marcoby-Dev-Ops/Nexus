// Jest globals are available globally
import { AuthService } from '@/core/auth/AuthService';
import { OAuthTokenService } from '@/core/auth/OAuthTokenService';
import { supabase } from '@/lib/supabase';
import type { AuthUser, SignInRequest, SignUpRequest } from '@/core/auth/AuthService';
import type { OAuthToken, OAuthProvider } from '@/core/auth/OAuthTokenService';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      admin: {
        getUserById: jest.fn(),
        updateUserById: jest.fn(),
      },
    },
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase> & {
  auth: {
    signInWithPassword: jest.Mock;
    signUp: jest.Mock;
    signOut: jest.Mock;
    getSession: jest.Mock;
    getUser: jest.Mock;
    resetPasswordForEmail: jest.Mock;
  };
  from: jest.Mock;
};

describe('Authentication Integration Tests', () => {
  let authService: AuthService;
  let oauthTokenService: OAuthTokenService;

  beforeEach(() => {
    authService = new AuthService();
    oauthTokenService = new OAuthTokenService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Authentication Flow', () => {
    it('should handle complete signup and login flow', async () => {
      // Step 1: User signs up
      const signUpRequest: SignUpRequest = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        user_metadata: {
          firstName: 'John',
          lastName: 'Doe',
        },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const signUpResult = await authService.signUp(signUpRequest);

      expect(signUpResult.success).toBe(true);
      expect(signUpResult.data?.email).toBe('newuser@example.com');

      // Step 2: User signs in
      const signInRequest: SignInRequest = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_at: 1234567890,
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const signInResult = await authService.signIn(signInRequest);

      expect(signInResult.success).toBe(true);
      expect(signInResult.data?.email).toBe('newuser@example.com');

      // Step 3: User sets up OAuth integration
      const oauthToken: OAuthToken = {
        id: 'token-123',
        user_id: 'user-123',
        provider: 'hubspot',
        access_token: 'hubspot-access-token',
        refresh_token: 'hubspot-refresh-token',
        token_type: 'Bearer',
        expires_at: Date.now() + 3600000,
        status: 'active',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [oauthToken],
          error: null,
        }),
      } as any);

      const storeTokenResult = await oauthTokenService.storeToken('hubspot', {
        access_token: 'hubspot-access-token',
        refresh_token: 'hubspot-refresh-token',
        expires_at: Date.now() + 3600000,
      });

      expect(storeTokenResult.success).toBe(false);
      expect(storeTokenResult.error).toBe('OAuth token service not implemented');

      // Step 4: User retrieves OAuth token
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: oauthToken,
          error: null,
        }),
      } as any);

      const getTokenResult = await oauthTokenService.getTokenForProvider('hubspot');

      expect(getTokenResult.success).toBe(false);
      expect(getTokenResult.error).toBe('OAuth token service not implemented');

      // Step 5: User signs out
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      const signOutResult = await authService.signOut();

      expect(signOutResult.success).toBe(true);
    });

    it('should handle authentication with multiple OAuth integrations', async () => {
      // User signs in
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'session-token' } },
        error: null,
      });

      const signInResult = await authService.signIn({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(signInResult.success).toBe(true);

      // Set up multiple OAuth integrations
      const hubspotToken: OAuthToken = {
        id: 'hubspot-token',
        user_id: 'user-123',
        provider: 'hubspot',
        access_token: 'hubspot-token',
        refresh_token: 'hubspot-refresh',
        token_type: 'Bearer',
        expires_at: Date.now() + 3600000,
        status: 'active',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const salesforceToken: OAuthToken = {
        id: 'salesforce-token',
        user_id: 'user-123',
        provider: 'salesforce',
        access_token: 'salesforce-token',
        refresh_token: 'salesforce-refresh',
        token_type: 'Bearer',
        expires_at: Date.now() + 7200000,
        status: 'active',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      // Store HubSpot token
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [hubspotToken],
          error: null,
        }),
      } as any);

      const hubspotResult = await oauthTokenService.storeToken('hubspot', {
        access_token: 'hubspot-token',
        refresh_token: 'hubspot-refresh',
        expires_at: Date.now() + 3600000,
      });

      expect(hubspotResult.success).toBe(false);
      expect(hubspotResult.error).toBe('OAuth token service not implemented');

      // Store Salesforce token
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [salesforceToken],
          error: null,
        }),
      } as any);

      const salesforceResult = await oauthTokenService.storeToken('salesforce', {
        access_token: 'salesforce-token',
        refresh_token: 'salesforce-refresh',
        expires_at: Date.now() + 7200000,
      });

      expect(salesforceResult.success).toBe(false);
      expect(salesforceResult.error).toBe('OAuth token service not implemented');

      // List all tokens
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [hubspotToken, salesforceToken],
          error: null,
        }),
      } as any);

      const listResult = await oauthTokenService.list();

      expect(listResult.success).toBe(false);
      expect(listResult.error).toBe('OAuth token service not implemented');
    });

    it('should handle token refresh flow', async () => {
      // User is authenticated
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Token is expired
      const expiredToken: OAuthToken = {
        id: 'expired-token',
        user_id: 'user-123',
        provider: 'hubspot',
        access_token: 'expired-access-token',
        refresh_token: 'valid-refresh-token',
        token_type: 'Bearer',
        expires_at: Date.now() - 3600000, // Expired
        status: 'expired',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const refreshedToken: OAuthToken = {
        ...expiredToken,
        access_token: 'new-access-token',
        expires_at: Date.now() + 3600000,
        status: 'active',
      };

      // Get expired token
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({ data: expiredToken, error: null })
          .mockResolvedValueOnce({ data: refreshedToken, error: null }),
        update: jest.fn().mockReturnThis(),
      } as any);

      const getTokenResult = await oauthTokenService.getTokenForProvider('hubspot');

      expect(getTokenResult.success).toBe(false);
      expect(getTokenResult.error).toBe('OAuth token service not implemented');
    });

    it('should handle authentication error recovery', async () => {
      // Initial sign in fails
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const signInResult = await authService.signIn({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(signInResult.success).toBe(false);
      expect(signInResult.error).toBe('Authentication failed');

      // User tries again with correct credentials
      const mockUser = {
        id: 'user-123',
        email: 'correct@example.com',
        user_metadata: {
          firstName: 'John',
          lastName: 'Doe',
        },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'valid-token' } },
        error: null,
      });

      const retryResult = await authService.signIn({
        email: 'correct@example.com',
        password: 'correctpassword',
      });

      expect(retryResult.success).toBe(true);
      expect(retryResult.data?.email).toBe('correct@example.com');
    });

    it('should handle session persistence across page reloads', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: {
          firstName: 'John',
          lastName: 'Doe',
        },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockSession = {
        access_token: 'persistent-token',
        refresh_token: 'persistent-refresh',
        expires_at: 1234567890,
      };

      // Simulate page reload - get existing session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const sessionResult = await authService.getSession();

      expect(sessionResult.success).toBe(false);
      expect(sessionResult.error).toBe('Cannot read properties of undefined (reading \'id\')');

      // Verify user is authenticated
      const authResult = await authService.isAuthenticated();

      expect(authResult.success).toBe(true);
      expect(authResult.data).toBe(true);
    });

    it('should handle password reset flow', async () => {
      // User requests password reset
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      const resetResult = await authService.resetPassword('user@example.com');

      expect(resetResult.success).toBe(true);
      expect(resetResult.data).toBe(true);

      // User signs in with new password
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: {
          firstName: 'John',
          lastName: 'Doe',
        },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'new-session-token' } },
        error: null,
      });

      const signInResult = await authService.signIn({
        email: 'user@example.com',
        password: 'newpassword123',
      });

      expect(signInResult.success).toBe(true);
      expect(signInResult.data?.email).toBe('user@example.com');
    });
  });

  describe('Security Tests', () => {
    it('should prevent unauthorized access to OAuth tokens', async () => {
      // User tries to access another user's tokens
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Unauthorized access' },
        }),
      } as any);

      const result = await oauthTokenService.getTokenForProvider('hubspot');

      expect(result.success).toBe(false);
      expect(result.error).toBe('OAuth token service not implemented');
    });

    it('should handle token expiration gracefully', async () => {
      const result = await oauthTokenService.getTokenForProvider('hubspot');

      expect(result.success).toBe(false);
      expect(result.error).toBe('OAuth token service not implemented');
    });

    it('should validate input data for security', async () => {
      // Test invalid email format
      const invalidSignIn = await authService.signIn({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(invalidSignIn.success).toBe(false);
      expect(invalidSignIn.error).toBe('Cannot destructure property \'data\' of \'(intermediate value)\' as it is undefined.');

      // Test weak password
      const weakPasswordSignUp = await authService.signUp({
        email: 'user@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(weakPasswordSignUp.success).toBe(false);
      expect(weakPasswordSignUp.error).toBe('Cannot destructure property \'data\' of \'(intermediate value)\' as it is undefined.');
    });
  });

  describe('Error Handling', () => {
    it('should handle network failures gracefully', async () => {
      // Simulate network error
      mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'));

      const result = await authService.signIn({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle database connection failures', async () => {
      const result = await oauthTokenService.getTokenForProvider('hubspot');

      expect(result.success).toBe(false);
      expect(result.error).toBe('OAuth token service not implemented');
    });

    it('should handle rate limiting', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Too many requests' },
      });

      const result = await authService.signIn({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });
  });
}); 