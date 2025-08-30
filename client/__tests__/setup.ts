import '@testing-library/jest-dom';


// Mock fetch globally
global.fetch = jest.fn();

// Mock import.meta.env for Jest compatibility
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        // PostgreSQL Configuration
        VITE_POSTGRES_URL: 'postgresql://postgres:postgres@localhost:5433/vector_db',
        VITE_POSTGRES_HOST: 'localhost',
        VITE_POSTGRES_PORT: '5433',
        VITE_POSTGRES_DB: 'vector_db',
        VITE_POSTGRES_USER: 'postgres',
        VITE_POSTGRES_PASSWORD: 'postgres',
        
        // OpenAI Configuration
        VITE_OPENAI_API_KEY: 'test-openai-key',
        VITE_OPENAI_KEY: 'test-openai-key',
        VITE_OPENROUTER_API_KEY: 'test-openrouter-key',
        
        // Google Services
        VITE_GOOGLE_CLIENT_ID: 'test-google-client-id',
        VITE_GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
        
        // Microsoft Services
        VITE_MICROSOFT_CLIENT_ID: 'test-microsoft-client-id',
        VITE_MS_TEAMS_CLIENT_ID: 'test-teams-client-id',
        VITE_MS_TEAMS_CLIENT_SECRET: 'test-teams-client-secret',
        VITE_MS_TEAMS_TENANT_ID: 'test-teams-tenant-id',
        VITE_MS_TEAMS_REDIRECT_URI: 'http://localhost:3000/integrations/teams/callback',
        
        // Social Media Integrations
        VITE_LINKEDIN_CLIENT_ID: 'test-linkedin-client-id',
        VITE_LINKEDIN_CLIENT_SECRET: 'test-linkedin-client-secret',
        VITE_LINKEDIN_REDIRECT_URI: 'http://localhost:3000/integrations/linkedin/callback',
        VITE_SLACK_CLIENT_ID: 'test-slack-client-id',
        VITE_HUBSPOT_CLIENT_ID: 'test-hubspot-client-id',
        
        // Payment Services
        VITE_PAYPAL_CLIENT_ID: 'test-paypal-client-id',
        VITE_PAYPAL_ENV: 'sandbox',
        VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_stripe_key',
        VITE_STRIPE_WEBHOOK_SECRET: 'whsec_test_webhook_secret',
        
        // Other Services
        VITE_NINJARMM_CLIENT_ID: 'test-ninjarmm-client-id',
        VITE_N8N_URL: 'https://test.n8n.io',
        
        // Application Features
    
        
        // Vite Built-in Environment Variables
        DEV: true,
        PROD: false,
        SSR: false,
        MODE: 'test',
        BASE_URL: '/'
      }
    }
  }
});



// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock AI response' } }]
        })
      }
    }
  }))
}));

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Reset console
  Object.assign(console, originalConsole);
});

// Mock environment variables for Node.js compatibility
process.env.NODE_ENV = 'test';
process.env.POSTGRES_URL = 'postgresql://postgres:postgres@localhost:5433/vector_db';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5433';
process.env.POSTGRES_DB = 'vector_db';
process.env.POSTGRES_USER = 'postgres';
process.env.POSTGRES_PASSWORD = 'postgres';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock performance.now for consistent testing
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now())
};

// Mock UUID generation for consistent testing
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234')
})); 