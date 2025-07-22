/**
 * Production Environment Configuration
 * Validates and provides type-safe access to environment variables
 */

interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  google: {
    mapsApiKey: string;
    placesApiKey: string;
    clientId: string;
    clientSecret: string;
  };
  openai: {
    apiKey: string;
    monthlyBudget: number;
  };
  stripe: {
    publishableKey: string;
    webhookSecret: string;
  };
  integrations: {
    hubspot: {
      clientId: string;
    };
    slack: {
      clientId: string;
    };
    paypal: {
      clientId: string;
      environment: string;
    };
  };
  development: {
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
  };
  features: {
    chatV2: boolean;
  };
  app: {
    version: string;
    buildTime: string;
    baseUrl: string;
  };
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(`Environment Configuration Error: ${message}`);
    this.name = 'EnvironmentError';
  }
}

/**
 * Validates that a required environment variable is present and non-empty
 */
function requireEnvVar(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new EnvironmentError(
      `Missing required environment variable: ${name}. Please check your environment configuration.`
    );
  }
  return value.trim();
}

/**
 * Helper to get environment variables from either import.meta.env (frontend) or process.env (backend)
 */
function getEnvVar(
  names: string[],
  fallback: string = ''
): string | undefined {
  // Try import.meta.env (Vite/frontend)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    for (const name of names) {
      if (import.meta.env[name]) return import.meta.env[name];
    }
  }
  // Try process.env (Node.js/backend)
  if (typeof process !== 'undefined' && process.env) {
    for (const name of names) {
      if (process.env[name]) return process.env[name];
    }
  }
  return fallback;
}

/**
 * Validates and returns the environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  try {
    const config: EnvironmentConfig = {
      supabase: {
        url: requireEnvVar(
          'SUPABASE_URL',
          getEnvVar(['VITE_SUPABASE_URL', 'SUPABASE_URL'])
        ),
        anonKey: requireEnvVar(
          'SUPABASE_ANON_KEY',
          getEnvVar(['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'])
        ),
        serviceRoleKey: requireEnvVar(
          'SUPABASE_SERVICE_ROLE_KEY',
          getEnvVar(['VITE_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'])
        ),
      },
      google: {
        mapsApiKey:
          getEnvVar(['VITE_GOOGLE_MAPS_API_KEY', 'GOOGLE_MAPS_API_KEY']) || '',
        placesApiKey:
          getEnvVar([
            'VITE_GOOGLE_PLACES_API_KEY',
            'GOOGLE_PLACES_API_KEY',
            'VITE_GOOGLE_MAPS_API_KEY',
            'GOOGLE_MAPS_API_KEY',
          ]) || '',
        clientId: getEnvVar(['VITE_GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_ID']) || '',
        clientSecret: getEnvVar(['VITE_GOOGLE_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET']) || '',
      },
      openai: {
        apiKey: getEnvVar(['VITE_OPENAI_API_KEY', 'OPENAI_API_KEY']) || '',
        monthlyBudget: Number(getEnvVar(['VITE_MONTHLY_AI_BUDGET', 'MONTHLY_AI_BUDGET'])) || 100,
      },
      stripe: {
        publishableKey: getEnvVar(['VITE_STRIPE_PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY']) || '',
        webhookSecret: getEnvVar(['VITE_STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET']) || '',
      },
      integrations: {
        hubspot: {
          clientId: getEnvVar(['VITE_HUBSPOT_CLIENT_ID', 'HUBSPOT_CLIENT_ID']) || '',
        },
        slack: {
          clientId: getEnvVar(['VITE_SLACK_CLIENT_ID', 'SLACK_CLIENT_ID']) || '',
        },
        paypal: {
          clientId: getEnvVar(['VITE_PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_ID']) || '',
          environment: getEnvVar(['VITE_PAYPAL_ENV', 'PAYPAL_ENV']) || 'sandbox',
        },
      },
      development: {
        isDevelopment: getEnvVar(['DEV', 'VITE_DEV', 'NODE_ENV']) === 'true' || 
                      getEnvVar(['NODE_ENV']) === 'development',
        isProduction: getEnvVar(['PROD', 'VITE_PROD', 'NODE_ENV']) === 'true' || 
                     getEnvVar(['NODE_ENV']) === 'production',
        isTest: getEnvVar(['NODE_ENV']) === 'test',
      },
      features: {
        chatV2: getEnvVar(['VITE_CHAT_V2']) === '1',
      },
      app: {
        version: getEnvVar(['VITE_APP_VERSION', 'APP_VERSION']) || '1.0.0',
        buildTime: getEnvVar(['VITE_BUILD_TIME', 'BUILD_TIME']) || '',
        baseUrl: getEnvVar(['VITE_BASE_URL', 'BASE_URL']) || '',
      },
    };

    // Validate Supabase URL format
    try {
      new URL(config.supabase.url);
    } catch {
      throw new EnvironmentError(
        'SUPABASE_URL must be a valid URL (e.g., https://your-project.supabase.co)'
      );
    }

    // Validate Supabase anon key format (basic check)
    if (config.supabase.anonKey.length < 100) {
      throw new EnvironmentError(
        'SUPABASE_ANON_KEY appears to be invalid. Please check your Supabase project settings.'
      );
    }

    return config;
  } catch (error) {
    if (error instanceof EnvironmentError) {
      throw error;
    }
    throw new EnvironmentError(`Failed to load environment configuration: ${error}`);
  }
}

/**
 * Environment configuration singleton
 */
export const env = getEnvironmentConfig();

/**
 * Type-safe environment checks
 */
export const isDevelopment = env.development.isDevelopment;
export const isProduction = env.development.isProduction;
export const isTest = env.development.isTest;

/**
 * Production logging utility that only logs in development
 */
export const devLog = {
  info: (message: string, data?: any) => {
    if (isDevelopment && data) {
      console.log(`[DEV] ${message}`, data);
    } else if (isDevelopment) {
      console.log(`[DEV] ${message}`);
    }
  },
  warn: (message: string, data?: any) => {
    if (isDevelopment && data) {
      console.warn(`[DEV] ${message}`, data);
    } else if (isDevelopment) {
      console.warn(`[DEV] ${message}`);
    }
  },
  error: (message: string, error?: any) => {
    if (isDevelopment && error) {
      console.error(`[DEV] ${message}`, error);
    } else if (isDevelopment) {
      console.error(`[DEV] ${message}`);
    }
  },
};

/**
 * Validates environment on application startup
 */
export function validateEnvironment(): void {
  try {
    getEnvironmentConfig();
    devLog.info('Environment configuration validated successfully');
  } catch (error) {
    if (error instanceof EnvironmentError) {
      throw error;
    }
    throw new EnvironmentError(`Environment validation failed: ${error}`);
  }
}

/**
 * Export commonly used environment variables for direct access
 * This provides a centralized way to access environment variables
 */
export const environment = {
  // Supabase
  SUPABASE_URL: env.supabase.url,
  SUPABASE_ANON_KEY: env.supabase.anonKey,
  SUPABASE_SERVICE_ROLE_KEY: env.supabase.serviceRoleKey,
  
  // Google
  GOOGLE_MAPS_API_KEY: env.google.mapsApiKey,
  GOOGLE_PLACES_API_KEY: env.google.placesApiKey,
  GOOGLE_CLIENT_ID: env.google.clientId,
  GOOGLE_CLIENT_SECRET: env.google.clientSecret,
  
  // OpenAI
  OPENAI_API_KEY: env.openai.apiKey,
  MONTHLY_AI_BUDGET: env.openai.monthlyBudget,
  
  // Stripe
  STRIPE_PUBLISHABLE_KEY: env.stripe.publishableKey,
  STRIPE_WEBHOOK_SECRET: env.stripe.webhookSecret,
  
  // Integrations
  HUBSPOT_CLIENT_ID: env.integrations.hubspot.clientId,
  SLACK_CLIENT_ID: env.integrations.slack.clientId,
  PAYPAL_CLIENT_ID: env.integrations.paypal.clientId,
  PAYPAL_ENV: env.integrations.paypal.environment,
  
  // Features
  CHAT_V2: env.features.chatV2,
  
  // App
  APP_VERSION: env.app.version,
  BUILD_TIME: env.app.buildTime,
  BASE_URL: env.app.baseUrl,
  
  // Development
  DEV: isDevelopment,
  PROD: isProduction,
  TEST: isTest,
}; 