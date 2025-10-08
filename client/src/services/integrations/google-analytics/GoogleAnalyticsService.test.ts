/**
 * Google Analytics Service Tests
 */

import { GoogleAnalyticsService } from './GoogleAnalyticsService';

describe('GoogleAnalyticsService', () => {
  let service: GoogleAnalyticsService;

  beforeEach(() => {
    service = new GoogleAnalyticsService();
  });

  describe('Service Initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeInstanceOf(GoogleAnalyticsService);
    });

    it('should extend BaseService', () => {
      expect(service).toHaveProperty('logger');
      expect(service).toHaveProperty('supabase');
    });
  });

  describe('OAuth URL Creation', () => {
    it('should create valid OAuth URL', () => {
      const userId = 'test-user-id';
      const authUrl = service.createAuthUrl(userId);
      
      expect(authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('redirect_uri=');
      expect(authUrl).toContain('scope=');
      expect(authUrl).toContain('state=');
    });

    it('should include required scopes', () => {
      const userId = 'test-user-id';
      const authUrl = service.createAuthUrl(userId);
      
      expect(authUrl).toContain('analytics.readonly');
      expect(authUrl).toContain('userinfo.email');
    });
  });

  describe('Connection Status', () => {
    it('should return connection status for user', async () => {
      const userId = 'test-user-id';
      const result = await service.getConnectionStatus(userId);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      
      if (result.success && result.data) {
        expect(result.data).toHaveProperty('connected');
        expect(result.data).toHaveProperty('status');
      }
    });
  });

  describe('Token Management', () => {
    it('should handle token validation', async () => {
      const userId = 'test-user-id';
      const result = await service.getValidTokens(userId);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });

    it('should handle token refresh', async () => {
      const userId = 'test-user-id';
      const refreshToken = 'test-refresh-token';
      const result = await service.refreshTokens(userId, refreshToken);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });
  });

  describe('Data Operations', () => {
    it('should handle data syncing', async () => {
      const userId = 'test-user-id';
      const result = await service.syncGoogleAnalyticsDataWithIntelligence(userId);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });

    it('should handle data retrieval', async () => {
      const userId = 'test-user-id';
      const result = await service.getGoogleAnalyticsData(userId);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });
  });

  describe('OAuth Callback Handling', () => {
    it('should handle OAuth callback', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('code', 'test-auth-code');
      searchParams.set('state', 'test-state');
      
      const userId = 'test-user-id';
      const result = await service.handleOAuthCallback(searchParams, userId);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });

    it('should handle OAuth errors', async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('error', 'access_denied');
      searchParams.set('error_description', 'User denied access');
      
      const userId = 'test-user-id';
      const result = await service.handleOAuthCallback(searchParams, userId);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('OAuth error');
    });
  });
});
