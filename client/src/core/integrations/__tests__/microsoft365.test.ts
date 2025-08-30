/**
 * Microsoft 365 Connector Tests
 * 
 * Tests for the Microsoft 365 connector implementation
 */

import { Microsoft365Connector } from '../connectors/microsoft365';
import { ConnectorFactory } from '../connector-base';
import { integrationService } from '../index';

describe('Microsoft 365 Connector', () => {
  let connector: Microsoft365Connector;

  beforeEach(() => {
    connector = new Microsoft365Connector();
  });

  describe('Initialization', () => {
    it('should create connector with correct properties', () => {
      expect(connector.id).toBe('microsoft365');
      expect(connector.name).toBe('Microsoft 365');
      expect(connector.version).toBe('1.0.0');
    });

    it('should have valid configuration schema', () => {
      const schema = connector.getConfigSchema();
      expect(schema).toBeDefined();
      
      // Test default configuration
      const defaultConfig = schema.parse({});
      expect(defaultConfig.syncUsers).toBe(true);
      expect(defaultConfig.syncTeams).toBe(true);
      expect(defaultConfig.syncEmails).toBe(true);
      expect(defaultConfig.syncCalendar).toBe(true);
      expect(defaultConfig.syncFiles).toBe(true);
      expect(defaultConfig.batchSize).toBe(50);
    });
  });

  describe('Registration', () => {
    it('should be registered in the factory', () => {
      const registeredConnector = ConnectorFactory.get('microsoft365');
      expect(registeredConnector).toBeDefined();
      expect(registeredConnector?.id).toBe('microsoft365');
    });

    it('should be available in integration service', () => {
      expect(integrationService.hasConnector('microsoft365')).toBe(true);
      
      const connector = integrationService.getConnector('microsoft365');
      expect(connector).toBeDefined();
      expect(connector?.id).toBe('microsoft365');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const validConfig = {
        syncUsers: true,
        syncTeams: false,
        syncEmails: true,
        syncCalendar: true,
        syncFiles: false,
        emailLimit: 50,
        batchSize: 25,
      };

      const schema = connector.getConfigSchema();
      const result = schema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        batchSize: 150, // Exceeds max of 100
        emailLimit: -1, // Negative value
      };

      const schema = connector.getConfigSchema();
      const result = schema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should detect token expired errors', () => {
      const error401 = { response: { status: 401 } };
      const errorAccessDenied = { message: 'access_denied' };
      const errorInvalidToken = { message: 'invalid_token' };

      expect(connector['isTokenExpiredError'](error401)).toBe(true);
      expect(connector['isTokenExpiredError'](errorAccessDenied)).toBe(true);
      expect(connector['isTokenExpiredError'](errorInvalidToken)).toBe(true);
    });

    it('should detect rate limit errors', () => {
      const error429 = { response: { status: 429 } };
      const errorRateLimit = { message: 'rate_limit' };
      const errorTooManyRequests = { message: 'too_many_requests' };

      expect(connector['isRateLimitError'](error429)).toBe(true);
      expect(connector['isRateLimitError'](errorRateLimit)).toBe(true);
      expect(connector['isRateLimitError'](errorTooManyRequests)).toBe(true);
    });

    it('should extract retry after delay', () => {
      const errorWithRetryAfter = {
        response: {
          headers: {
            'retry-after': '30'
          }
        }
      };

      const delay = connector['extractRetryAfter'](errorWithRetryAfter);
      expect(delay).toBe(30000); // 30 seconds in milliseconds
    });
  });

  describe('Health Check', () => {
    it('should return healthy status for valid context', async () => {
      const mockContext = {
        tenantId: 'test-tenant',
        installId: 'test-install',
        auth: {
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
        config: {
          syncUsers: true,
          syncTeams: true,
          syncEmails: true,
          syncCalendar: true,
          syncFiles: true,
        },
        metadata: {
          provider: 'microsoft365',
          version: '1.0.0',
        },
      };

      // Mock the HTTP client to return successful response
      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          displayName: 'Test User',
          mail: 'test@example.com',
        }),
      };

      connector['httpClient'] = mockHttpClient as any;

      const health = await connector.healthCheck(mockContext);
      
      expect(health.healthy).toBe(true);
      expect(health.details).toBeDefined();
      expect(health.details?.user).toBe('Test User');
      expect(health.details?.email).toBe('test@example.com');
    });

    it('should return unhealthy status for invalid context', async () => {
      const mockContext = {
        tenantId: 'test-tenant',
        installId: 'test-install',
        auth: {
          accessToken: 'invalid-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
        config: {},
        metadata: {
          provider: 'microsoft365',
          version: '1.0.0',
        },
      };

      // Mock the HTTP client to throw an error
      const mockHttpClient = {
        get: jest.fn().mockRejectedValue(new Error('Invalid token')),
      };

      connector['httpClient'] = mockHttpClient as any;

      const health = await connector.healthCheck(mockContext);
      
      expect(health.healthy).toBe(false);
      expect(health.details?.error).toBe('Invalid token');
    });
  });
});
