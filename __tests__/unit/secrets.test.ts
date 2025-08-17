const { getTestSecrets, setEnvFromSecrets, mockSecrets } = require('../../test/setupTests');

describe('Secrets Utility', () => {
  describe('getTestSecrets', () => {
    it('should return mock secrets for testing', async () => {
      const secrets = await getTestSecrets();
      
      expect(secrets.VITE_POSTGRES_URL).toBe('postgresql://postgres:postgres@localhost:5433/vector_db');
      expect(secrets.VITE_POSTGRES_HOST).toBe('localhost');
      expect(secrets.VITE_OPENROUTER_API_KEY).toBe('test-openrouter-key');
      expect(secrets.VITE_GOOGLE_CLIENT_ID).toBe('test-google-client-id');
      expect(secrets.VITE_MICROSOFT_CLIENT_ID).toBe('test-microsoft-client-id');
      expect(secrets.VITE_PAYPAL_CLIENT_ID).toBe('test-paypal-client-id');
      expect(secrets.VITE_STRIPE_PUBLISHABLE_KEY).toBe('pk_test_stripe_key');
      expect(secrets.VITE_N8N_URL).toBe('https://test.n8n.io');
    });
  });

  describe('setEnvFromSecrets', () => {
    it('should set environment variables from secrets', async () => {
      await setEnvFromSecrets();
      
      expect(process.env.VITE_POSTGRES_URL).toBe('postgresql://postgres:postgres@localhost:5433/vector_db');
      expect(process.env.VITE_POSTGRES_HOST).toBe('localhost');
      expect(process.env.VITE_OPENROUTER_API_KEY).toBe('test-openrouter-key');
    });
  });

  describe('mockSecrets', () => {
    it('should return mock secrets object', () => {
      const secrets = mockSecrets();
      
      expect(secrets.VITE_POSTGRES_URL).toBe('postgresql://postgres:postgres@localhost:5433/vector_db');
      expect(secrets.VITE_POSTGRES_HOST).toBe('localhost');
      expect(secrets.VITE_OPENROUTER_API_KEY).toBe('test-openrouter-key');
      expect(secrets.VITE_GOOGLE_CLIENT_ID).toBe('test-google-client-id');
      expect(secrets.VITE_MICROSOFT_CLIENT_ID).toBe('test-microsoft-client-id');
      expect(secrets.VITE_PAYPAL_CLIENT_ID).toBe('test-paypal-client-id');
      expect(secrets.VITE_STRIPE_PUBLISHABLE_KEY).toBe('pk_test_stripe_key');
      expect(secrets.VITE_N8N_URL).toBe('https://test.n8n.io');
    });
  });
});

// Example of how to use secrets in integration tests:
/*
describe('API Integration with Secrets', () => {
  beforeEach(async () => {
    // Set up environment variables from secrets
    await setEnvFromSecrets();
  });

  it('should connect to PostgreSQL with real secrets', async () => {
    const secrets = await getTestSecrets();
    
    // Your integration test here
    expect(secrets.VITE_POSTGRES_URL).toBeDefined();
    expect(process.env.VITE_POSTGRES_URL).toBe(secrets.VITE_POSTGRES_URL);
  });
});
*/ 