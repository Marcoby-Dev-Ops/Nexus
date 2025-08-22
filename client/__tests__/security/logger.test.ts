import { logger } from '../../src/lib/security/logger';

// Mock console methods
const originalConsole = global.console;
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

describe('Security Logger - Production Readiness', () => {
  beforeAll(() => {
    // Replace console methods globally
    global.console = mockConsole as any;
  });

  afterAll(() => {
    // Restore original console
    global.console = originalConsole;
  });

  beforeEach(() => {
    // Clear all mocks before each test
    Object.values(mockConsole).forEach(mock => mock.mockClear());
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  describe('Core Logging Functions', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(mockConsole.info).toHaveBeenCalledWith('ℹ️ INFO:', 'Test info message');
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error(error, 'Test error message');
      expect(mockConsole.error).toHaveBeenCalledWith(error, 'Test error message');
    });

    it('should log warning messages', () => {
      logger.warn('Test warning');
      expect(mockConsole.warn).toHaveBeenCalledWith('Test warning');
    });
  });

  describe('Security Features', () => {
    it('should filter sensitive data from logs', () => {
      const sensitiveData = 'My email is user@example.com and token is sk_live_1234567890abcdef';
      logger.info(sensitiveData);
      
      // Check that the call was made with filtered data
      expect(mockConsole.info).toHaveBeenCalled();
      const calledWith = mockConsole.info.mock.calls[0][1];
      expect(calledWith).toContain('[REDACTED]');
      expect(calledWith).not.toContain('user@example.com');
      expect(calledWith).not.toContain('sk_live_');
    });

    it('should always log security events', () => {
      logger.security('Security event test', { userId: 'test-123' });
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '🔒 SECURITY:',
        expect.objectContaining({
          type: 'SECURITY',
          message: 'Security event test'
        })
      );
    });
  });

  describe('Production Behavior', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should still log errors in production', () => {
      logger.error('Production error test');
      expect(mockConsole.error).toHaveBeenCalledWith('Production error test');
    });

    it('should still log security events in production', () => {
      logger.security('Production security event');
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '🔒 SECURITY:',
        expect.objectContaining({
          message: 'Production security event'
        })
      );
    });
  });
}); 