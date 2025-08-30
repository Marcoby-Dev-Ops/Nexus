/**
 * Secrets utility for tests
 * In production, this would integrate with Supabase secrets API
 */

export interface TestSecrets {
  VITE_POSTGRES_URL: string;
  VITE_POSTGRES_HOST: string;
  VITE_POSTGRES_PORT: number;
  VITE_POSTGRES_DB: string;
  VITE_POSTGRES_USER: string;
  VITE_POSTGRES_PASSWORD: string;
  VITE_OPENROUTER_API_KEY: string;
  VITE_GOOGLE_CLIENT_ID: string;
  VITE_GOOGLE_CLIENT_SECRET: string;
  VITE_GOOGLE_API_KEY: string;
  VITE_MICROSOFT_CLIENT_ID: string;
  VITE_MICROSOFT_CLIENT_SECRET: string;
  VITE_MICROSOFT_REDIRECT_URI: string;
  VITE_MS_TEAMS_TENANT_ID: string;
  VITE_SLACK_CLIENT_ID: string;
  VITE_HUBSPOT_CLIENT_ID: string;
  VITE_PAYPAL_CLIENT_ID: string;
  VITE_PAYPAL_CLIENT_SECRET: string;
  VITE_PAYPAL_ENV: string;
  VITE_STRIPE_PUBLISHABLE_KEY: string;
  VITE_NINJARMM_CLIENT_ID: string;
  VITE_N8N_URL: string;
  VITE_N8N_API_KEY: string;

  VITE_AI_CHAT_URL: string;
  VITE_NEXT_PUBLIC_APP_URL: string;
  VITE_DEV_APP_URL: string;
}

/**
 * Get secrets for testing
 * In production, this would call Supabase secrets API
 */
export const getTestSecrets = async (): Promise<TestSecrets> => {
  // For tests, return mock secrets
  // In production, this would be:
  // const { data: secrets } = await supabase.from('secrets').select('*').single();
  
  return {
      VITE_POSTGRES_URL: 'postgresql://postgres:postgres@localhost:5433/vector_db',
  VITE_POSTGRES_HOST: 'localhost',
  VITE_POSTGRES_PORT: 5433,
  VITE_POSTGRES_DB: 'vector_db',
  VITE_POSTGRES_USER: 'postgres',
  VITE_POSTGRES_PASSWORD: 'postgres',
    VITE_OPENROUTER_API_KEY: 'test-openrouter-key',
    VITE_GOOGLE_CLIENT_ID: 'test-google-client-id',
    VITE_GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    VITE_GOOGLE_API_KEY: 'test-google-api-key',
    VITE_MICROSOFT_CLIENT_ID: 'test-microsoft-client-id',
    VITE_MICROSOFT_CLIENT_SECRET: 'test-microsoft-client-secret',
    VITE_MICROSOFT_REDIRECT_URI: 'http://localhost:5173/integrations/microsoft365/callback',
    VITE_MS_TEAMS_TENANT_ID: 'test-teams-tenant-id',
    VITE_SLACK_CLIENT_ID: 'test-slack-client-id',
    VITE_HUBSPOT_CLIENT_ID: 'test-hubspot-client-id',
    VITE_PAYPAL_CLIENT_ID: 'test-paypal-client-id',
    VITE_PAYPAL_CLIENT_SECRET: 'test-paypal-client-secret',
    VITE_PAYPAL_ENV: 'sandbox',
    VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_stripe_key',
    VITE_NINJARMM_CLIENT_ID: 'test-ninjarmm-client-id',
    VITE_N8N_URL: 'https://test.n8n.io',
    VITE_N8N_API_KEY: 'test-n8n-api-key',

    VITE_AI_CHAT_URL: 'https://localhost:5173/functions/v1/ai_chat',
    VITE_NEXT_PUBLIC_APP_URL: 'https://nexux.marcoby.com',
    VITE_DEV_APP_URL: 'http://localhost:5173',
  };
};

/**
 * Set environment variables from secrets
 * Useful for integration tests that need real environment variables
 */
export const setEnvFromSecrets = async (): Promise<void> => {
  const secrets = await getTestSecrets();
  
  // Set environment variables for the test
  Object.entries(secrets).forEach(([key, value]) => {
    process.env[key] = value;
  });
};

/**
 * Mock secrets for unit tests
 */
export const mockSecrets: TestSecrets = {
  VITE_POSTGRES_URL: 'postgresql://postgres:postgres@localhost:5433/vector_db',
  VITE_POSTGRES_HOST: 'localhost',
  VITE_POSTGRES_PORT: 5433,
  VITE_POSTGRES_DB: 'vector_db',
  VITE_POSTGRES_USER: 'postgres',
  VITE_POSTGRES_PASSWORD: 'postgres',
  VITE_OPENROUTER_API_KEY: 'test-openrouter-key',
  VITE_GOOGLE_CLIENT_ID: 'test-google-client-id',
  VITE_GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  VITE_GOOGLE_API_KEY: 'test-google-api-key',
  VITE_MICROSOFT_CLIENT_ID: 'test-microsoft-client-id',
  VITE_MICROSOFT_CLIENT_SECRET: 'test-microsoft-client-secret',
  VITE_MICROSOFT_REDIRECT_URI: 'http://localhost:5173/integrations/microsoft365/callback',
  VITE_MS_TEAMS_TENANT_ID: 'test-teams-tenant-id',
  VITE_SLACK_CLIENT_ID: 'test-slack-client-id',
  VITE_HUBSPOT_CLIENT_ID: 'test-hubspot-client-id',
  VITE_PAYPAL_CLIENT_ID: 'test-paypal-client-id',
  VITE_PAYPAL_CLIENT_SECRET: 'test-paypal-client-secret',
  VITE_PAYPAL_ENV: 'sandbox',
  VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_stripe_key',
  VITE_NINJARMM_CLIENT_ID: 'test-ninjarmm-client-id',
  VITE_N8N_URL: 'https://test.n8n.io',
  VITE_N8N_API_KEY: 'test-n8n-api-key',
  
  VITE_AI_CHAT_URL: 'https://localhost:5173/functions/v1/ai_chat',
  VITE_NEXT_PUBLIC_APP_URL: 'https://nexux.marcoby.com',
  VITE_DEV_APP_URL: 'http://localhost:5173',
}; 