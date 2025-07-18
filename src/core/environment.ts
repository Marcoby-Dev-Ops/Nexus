/**
 * Production Environment Configuration
 * Validates and provides type-safe access to environment variables
 */

interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  google: {
    mapsApiKey: string;
    placesApiKey: string;
  };
  development: {
    isDevelopment: boolean;
    isProduction: boolean;
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
      },
      development: {
        isDevelopment:
          getEnvVar(['DEV', 'VITE_DEV']) === 'true' || false,
        isProduction:
          getEnvVar(['PROD', 'VITE_PROD']) === 'true' || false,
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