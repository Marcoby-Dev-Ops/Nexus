/**
 * Production Environment Configuration
 * Validates and provides type-safe access to environment variables
 */

interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
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
 * Validates and returns the environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  try {
    const config: EnvironmentConfig = {
      supabase: {
        url: requireEnvVar('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
        anonKey: requireEnvVar('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
      },
      development: {
        isDevelopment: import.meta.env.DEV || false,
        isProduction: import.meta.env.PROD || false,
      },
    };

    // Validate Supabase URL format
    try {
      new URL(config.supabase.url);
    } catch {
      throw new EnvironmentError(
        'VITE_SUPABASE_URL must be a valid URL (e.g., https://your-project.supabase.co)'
      );
    }

    // Validate Supabase anon key format (basic check)
    if (config.supabase.anonKey.length < 100) {
      throw new EnvironmentError(
        'VITE_SUPABASE_ANON_KEY appears to be invalid. Please check your Supabase project settings.'
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