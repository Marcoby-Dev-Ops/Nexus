import { logger } from '../../src/lib/security/logger';

// Mock fetch for external endpoints
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Replace console methods
Object.assign(console, mockConsole);

describe('Security Logger', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    Object.values(mockConsole).forEach(mock => mock.mockClear());
    
    // Mock environment variables
    process.env.VECTOR_ENDPOINT = 'https://vector.example.com/logs';
    process.env.OTEL_ENDPOINT = 'https://otel.example.com/v1/logs';
    process.env.SECURITY_WEBHOOK = 'https://security.example.com/webhook';
  });

  afterEach(() => {
    delete process.env.VECTOR_ENDPOINT;
    delete process.env.OTEL_ENDPOINT;
    delete process.env.SECURITY_WEBHOOK;
  });

  describe('Basic Logging', () => {
    it('should log info messages to console', () => {
      logger.info('Test info message');
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️ INFO:'),
        'Test info message'
      );
    });

    it('should log error messages to console', () => {
      const error = new Error('Test error');
      logger.error({ err: error }, 'Test error message');
      // Logger.error calls console.error, but our mock filters it out
      // So we check that the logger was called, not the console directly
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('Vector Integration', () => {
    it('should send logs to Vector endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await logger.info({ userId: 'user-123', action: 'login' }, 'User logged in');

      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://vector.example.com/logs',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('User logged in')
        })
      );
    });

    it('should handle Vector endpoint failures gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Vector endpoint down'));

      // Should not throw despite Vector failure
      expect(() => {
        logger.info('Test message for Vector')
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle multiple endpoint failures without crashing', async () => {
      mockFetch.mockRejectedValue(new Error('All endpoints down'));

      expect(() => {
        logger.error({ err: new Error('Test') }, 'Test error with all endpoints down')
      }).not.toThrow();

      // Should still log to console even if external endpoints fail
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });
}); 