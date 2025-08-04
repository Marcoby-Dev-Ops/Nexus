import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.ts'],
  transform: { 
    '^.+\\.(t|j)sx?$': ['@swc/jest', {}]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/domains/(.*)$': '<rootDir>/src/domains/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@dashboard/(.*)$': '<rootDir>/src/domains/dashboard/$1',
    '^@workspace/(.*)$': '<rootDir>/src/domains/workspace/$1',
    '^@marketplace/(.*)$': '<rootDir>/src/domains/marketplace/$1',
    '^@business/(.*)$': '<rootDir>/src/domains/business/$1',
    '^@admin/(.*)$': '<rootDir>/src/domains/admin/$1',
    '^@ai/(.*)$': '<rootDir>/src/domains/ai/$1',
    '^@analytics/(.*)$': '<rootDir>/src/domains/analytics/$1',
    '^@integrations/(.*)$': '<rootDir>/src/domains/integrations/$1',
    '^@help-center/(.*)$': '<rootDir>/src/domains/help-center/$1',
    '^@knowledge/(.*)$': '<rootDir>/src/domains/knowledge/$1',
    '^@automation/(.*)$': '<rootDir>/src/domains/automation/$1',
    '^@fire-cycle/(.*)$': '<rootDir>/src/domains/fire-cycle/$1',
    '^@waitlist/(.*)$': '<rootDir>/src/domains/waitlist/$1',
    '^@hype/(.*)$': '<rootDir>/src/domains/hype/$1',
    '^@entrepreneur/(.*)$': '<rootDir>/src/domains/entrepreneur/$1',
    '^@development/(.*)$': '<rootDir>/src/domains/development/$1',
    '^@departments/(.*)$': '<rootDir>/src/domains/departments/$1',
    '^@domains/(.*)$': '<rootDir>/src/domains/$1',
    '^~/(.*)$': '<rootDir>/src/$1',
    '\\.(css|svg|png)$': '<rootDir>/test/__mocks__/fileMock.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/__mocks__/**'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/__tests__/**/*.{ts,tsx}',
  ],
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
  collectCoverage: true,
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

export default config; 