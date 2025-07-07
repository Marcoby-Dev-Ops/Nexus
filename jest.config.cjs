/** @type {import("jest").Config} **/
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs', '<rootDir>/__tests__/setup.ts'],
  testMatch: [
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/__tests__/**/*.test.{ts,tsx}',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|isows|uuid)/)',
  ],
  globals: {
    'import.meta': {
      env: {
        // Supabase Configuration
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        
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
        VITE_CHAT_V2: '1',
        
        // Vite Built-in Environment Variables
        DEV: true,
        PROD: false,
        SSR: false,
        MODE: 'test',
        BASE_URL: '/'
      }
    }
  },
  // Keep coverage settings as they are not causing issues
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  clearMocks: true,
  restoreMocks: true,
};