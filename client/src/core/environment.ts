/**
 * Production Environment Configuration
 * Validates and provides type-safe access to environment variables
 */

interface EnvironmentConfig {
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  postgres: {
    url: string;
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  api: {
    url: string;
    baseUrl: string;
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
        clientSecret: string;
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
    // Feature flags can be added here as needed
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
 * Follows industry standards for environment variable access
 */
function getEnvVar(
  names: string[],
  fallback: string = ''
): string {
  // Try import.meta.env (Vite/frontend) - standard for React apps
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    for (const name of names) {
      if (import.meta.env[name]) {
        return import.meta.env[name];
      }
    }
  }
  
  // Try process.env (Node.js/backend) - standard for Node.js
  if (typeof process !== 'undefined' && process.env) {
    for (const name of names) {
      if (process.env[name]) {
        return process.env[name];
      }
    }
  }
  
  return fallback;
}

/**
 * Universal environment variable accessor
 * Works in both frontend and backend environments
 */
export function getUniversalEnvVar(name: string): string | undefined {
  return getEnvVar([name]);
}

/**
 * Get environment variable with fallback
 */
export function getEnvVarWithFallback(name: string, fallback: string): string {
  return getEnvVar([name], fallback);
}

/**
 * Validates and returns the environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  try {
    const config: EnvironmentConfig = {
      database: {
        url: getEnvVar(['DATABASE_URL']) || 'postgresql://postgres:postgres@localhost:5433/vector_db',
        host: getEnvVar(['DB_HOST']) || 'localhost',
        port: Number(getEnvVar(['DB_PORT'])) || 5433,
        name: getEnvVar(['DB_NAME']) || 'vector_db',
        user: getEnvVar(['DB_USER']) || 'postgres',
        password: getEnvVar(['DB_PASSWORD']) || 'postgres',
      },
      postgres: {
        url: getEnvVar(['VITE_POSTGRES_URL', 'POSTGRES_URL']) || 'postgresql://postgres:postgres@localhost:5433/vector_db',
        host: getEnvVar(['VITE_POSTGRES_HOST', 'POSTGRES_HOST']) || 'localhost',
        port: Number(getEnvVar(['VITE_POSTGRES_PORT', 'POSTGRES_PORT'])) || 5433,
        database: getEnvVar(['VITE_POSTGRES_DB', 'POSTGRES_DB']) || 'vector_db',
        user: getEnvVar(['VITE_POSTGRES_USER', 'POSTGRES_USER']) || 'postgres',
        password: getEnvVar(['VITE_POSTGRES_PASSWORD', 'POSTGRES_PASSWORD']) || 'postgres',
      },
      api: {
        // Prefer same-origin proxying in production (frontend -> /api -> nginx -> backend) to avoid CORS.
        // Set VITE_API_URL if you intentionally want cross-origin API calls.
        url: getEnvVar(['VITE_API_URL', 'API_URL']) || '',
        baseUrl: getEnvVar(['VITE_API_URL', 'API_URL']) || '',
      },
      google: {
        mapsApiKey:
          getEnvVar(['VITE_GOOGLE_MAPS_API_KEY', 'GOOGLE_MAPS_API_KEY']) || '',
        placesApiKey: getEnvVar([
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
          clientSecret: getEnvVar(['VITE_HUBSPOT_CLIENT_SECRET', 'HUBSPOT_CLIENT_SECRET']) || '',
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
      
      },
      app: {
        version: getEnvVar(['VITE_APP_VERSION', 'APP_VERSION']) || '1.0.0',
        buildTime: getEnvVar(['VITE_BUILD_TIME', 'BUILD_TIME']) || '',
        baseUrl: getEnvVar(['VITE_BASE_URL', 'BASE_URL']) || '',
      },
    };

    // Remove Supabase environment validation
    // if (config.supabase.url && config.supabase.url.trim() !== '') {
    //   try {
    //     new URL(config.supabase.url);
    //   } catch {
    //     throw new EnvironmentError(
    //       'SUPABASE_URL must be a valid URL (e.g., https://your-project.supabase.co)'
    //     );
    //   }

    //   // Validate Supabase anon key format (basic check) - only if URL is provided
    //   if (config.supabase.anonKey && config.supabase.anonKey.length < 100) {
    //     throw new EnvironmentError(
    //       'SUPABASE_ANON_KEY appears to be invalid. Please check your Supabase project settings.'
    //     );
    //   }
    // }

    return config;
  } catch (error) {
    if (error instanceof EnvironmentError) {
      throw error;
    }
    throw new EnvironmentError(`Failed to load environment configuration: ${error}`);
  }
}

// Lazy initialization to avoid build-time issues
let _env: EnvironmentConfig | null = null;

/**
 * Environment configuration singleton - lazy loaded
 */
export function getEnv(): EnvironmentConfig {
  if (!_env) {
    _env = getEnvironmentConfig();
  }
  return _env;
}

/**
 * Type-safe environment checks
 */
export function getIsDevelopment(): boolean {
  return getEnv().development.isDevelopment;
}

export function getIsProduction(): boolean {
  return getEnv().development.isProduction;
}

export function getIsTest(): boolean {
  return getEnv().development.isTest;
}

/**
 * Production logging utility that only logs in development
 */
export const devLog = {
  info: (message: string, data?: any) => {
    if (getIsDevelopment() && data) {
      // eslint-disable-next-line no-console
      console.log(`[DEV] ${message}`, data);
    } else if (getIsDevelopment()) {
      // eslint-disable-next-line no-console
      console.log(`[DEV] ${message}`);
    }
  },
  warn: (message: string, data?: any) => {
    if (getIsDevelopment() && data) {
      // eslint-disable-next-line no-console
      console.warn(`[DEV] ${message}`, data);
    } else if (getIsDevelopment()) {
      // eslint-disable-next-line no-console
      console.warn(`[DEV] ${message}`);
    }
  },
  error: (message: string, error?: any) => {
    if (getIsDevelopment() && error) {
      // eslint-disable-next-line no-console
      console.error(`[DEV] ${message}`, error);
    } else if (getIsDevelopment()) {
      // eslint-disable-next-line no-console
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
  // Database
  get DATABASE_URL() { return getEnv().database.url; },
  get DB_HOST() { return getEnv().database.host; },
  get DB_PORT() { return getEnv().database.port; },
  get DB_NAME() { return getEnv().database.name; },
  get DB_USER() { return getEnv().database.user; },
  get DB_PASSWORD() { return getEnv().database.password; },
  
  // Google
  get GOOGLEMAPS_API_KEY() { return getEnv().google.mapsApiKey; },
  get GOOGLEPLACES_API_KEY() { return getEnv().google.placesApiKey; },
  get GOOGLECLIENT_ID() { return getEnv().google.clientId; },
  get GOOGLECLIENT_SECRET() { return getEnv().google.clientSecret; },
  
  // OpenAI
  get OPENAIAPI_KEY() { return getEnv().openai.apiKey; },
  get MONTHLYAI_BUDGET() { return getEnv().openai.monthlyBudget; },
  
  // Stripe
  get STRIPEPUBLISHABLE_KEY() { return getEnv().stripe.publishableKey; },
  get STRIPEWEBHOOK_SECRET() { return getEnv().stripe.webhookSecret; },
  
  // Integrations
  get HUBSPOTCLIENT_ID() { return getEnv().integrations.hubspot.clientId; },
  get SLACKCLIENT_ID() { return getEnv().integrations.slack.clientId; },
  get PAYPALCLIENT_ID() { return getEnv().integrations.paypal.clientId; },
  get PAYPALENV() { return getEnv().integrations.paypal.environment; },
  
  // Features
  // Feature getters can be added here as needed
  
  // App
  get APPVERSION() { return getEnv().app.version; },
  get BUILDTIME() { return getEnv().app.buildTime; },
  get BASEURL() { return getEnv().app.baseUrl; },
  
  // Development
  get DEV() { return getIsDevelopment(); },
  get PROD() { return getIsProduction(); },
  get TEST() { return getIsTest(); },
};

// Backward compatibility - export env as a function that returns the environment
export const env = (): EnvironmentConfig => ({
  // Database
  database: {
    url: getEnv().database.url || '',
    host: getEnv().database.host || '',
    port: getEnv().database.port || 5432,
    name: getEnv().database.name || '',
    user: getEnv().database.user || '',
    password: getEnv().database.password || '',
  },
  postgres: {
    url: getEnv().postgres.url || '',
    host: getEnv().postgres.host || '',
    port: getEnv().postgres.port || 5432,
    database: getEnv().postgres.database || '',
    user: getEnv().postgres.user || '',
    password: getEnv().postgres.password || '',
  },
  api: {
    url: getEnv().api.url || '',
    baseUrl: getEnv().api.baseUrl || '',
  },
  // Supabase configuration removed - using PostgreSQL directly
  google: {
    mapsApiKey: getEnv().google.mapsApiKey || '',
    placesApiKey: getEnv().google.placesApiKey || '',
    clientId: getEnv().google.clientId || '',
    clientSecret: getEnv().google.clientSecret || '',
  },
  openai: {
    apiKey: getEnv().openai.apiKey || '',
    monthlyBudget: getEnv().openai.monthlyBudget || 0,
  },
  stripe: {
    publishableKey: getEnv().stripe.publishableKey || '',
    webhookSecret: getEnv().stripe.webhookSecret || '',
  },
  integrations: {
    hubspot: {
      clientId: getEnv().integrations.hubspot.clientId || '',
      clientSecret: getEnv().integrations.hubspot.clientSecret || '',
    },
    slack: {
      clientId: getEnv().integrations.slack.clientId || '',
    },
    paypal: {
      clientId: getEnv().integrations.paypal.clientId || '',
      environment: getEnv().integrations.paypal.environment || 'sandbox',
    },
  },
  development: {
    isDevelopment: getEnv().development.isDevelopment || false,
    isProduction: getEnv().development.isProduction || false,
    isTest: getEnv().development.isTest || false,
  },
  features: {
    // Feature flags can be added here as needed
  },
  app: {
    version: getEnv().app.version || '1.0.0',
    buildTime: getEnv().app.buildTime || '',
    baseUrl: getEnv().app.baseUrl || '',
  },
}); 
