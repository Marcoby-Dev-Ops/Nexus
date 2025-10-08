/**
 * Environment Utilities
 * Industry-standard patterns for environment variable access
 */

// Type definitions for environment variables
export interface EnvironmentVars {
  // Database
  DATABASE_URL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  
  // PostgreSQL
  VITE_POSTGRES_URL: string;
  VITE_POSTGRES_HOST: string;
  VITE_POSTGRES_PORT: number;
  VITE_POSTGRES_DB: string;
  VITE_POSTGRES_USER: string;
  VITE_POSTGRES_PASSWORD: string;
  
  // AI/ML Services
  VITE_OPENROUTER_API_KEY: string;
  VITE_OPENAI_API_KEY: string;
  
  // Authentik OAuth
  VITE_AUTHENTIK_CLIENT_ID: string;
  VITE_AUTHENTIK_URL: string;
  
  // Development
  NODE_ENV: 'development' | 'production' | 'test';
  VITE_DEV: boolean;
}

/**
 * Universal environment variable accessor
 * Works in both frontend (Vite) and backend (Node.js) environments
 */
export function getEnvVar(name: string): string | undefined {
  // Frontend: Vite environment (import.meta.env)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Prefer compile-time Vite vars when present
    // import.meta.env may not contain runtime-injected values, so we fall back below
    const v = (import.meta.env as any)[name];
    // Treat empty string as not-set so callers relying on presence/absence
    // don't get fooled by empty values baked in at build/runtime.
    if (typeof v !== 'undefined' && v !== '') return v;
  }

  // Runtime injection for containers: window.__RUNTIME_ENV is generated at container
  // startup (env.js) and contains environment variables made available at runtime.
  try {
    if (typeof window !== 'undefined' && (window as any).__RUNTIME_ENV) {
      const runtime = (window as any).__RUNTIME_ENV as Record<string, string>;
      if (Object.prototype.hasOwnProperty.call(runtime, name)) {
        // Treat empty string as missing (undefined) so validation and fallbacks
        // work as expected when env.js includes keys with blank values.
        const rv = runtime[name];
        if (rv === '') return undefined;
        return rv;
      }
    }
  } catch {
    // ignore cross-origin or server-side issues
  }
  
  // Backend: Node.js environment (process.env)
  if (typeof process !== 'undefined' && process.env) {
    const pv = (process.env as any)[name];
    if (typeof pv !== 'undefined' && pv !== '') return pv;
    return undefined;
  }
  
  return undefined;
}

/**
 * Get environment variable with fallback
 */
export function getEnvVarWithFallback(name: string, fallback: string): string {
  return getEnvVar(name) || fallback;
}

/**
 * Get required environment variable (throws if missing)
 */
export function getRequiredEnvVar(name: string): string {
  const value = getEnvVar(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvVar('NODE_ENV') === 'development' || 
         getEnvVar('VITE_DEV') === 'true';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getEnvVar('NODE_ENV') === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getEnvVar('NODE_ENV') === 'test';
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(): EnvironmentVars {
  return {
    // Database
    DATABASE_URL: getEnvVarWithFallback('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5433/vector_db'),
    DB_HOST: getEnvVarWithFallback('DB_HOST', 'localhost'),
    DB_PORT: parseInt(getEnvVarWithFallback('DB_PORT', '5433')),
    DB_NAME: getEnvVarWithFallback('DB_NAME', 'vector_db'),
    DB_USER: getEnvVarWithFallback('DB_USER', 'postgres'),
    DB_PASSWORD: getEnvVarWithFallback('DB_PASSWORD', 'postgres'),
    
    // PostgreSQL (optional for local PostgreSQL)
    VITE_POSTGRES_URL: getEnvVarWithFallback('VITE_POSTGRES_URL', ''),
    VITE_POSTGRES_HOST: getEnvVarWithFallback('VITE_POSTGRES_HOST', 'localhost'),
    VITE_POSTGRES_PORT: parseInt(getEnvVarWithFallback('VITE_POSTGRES_PORT', '5433')),
    VITE_POSTGRES_DB: getEnvVarWithFallback('VITE_POSTGRES_DB', 'vector_db'),
    VITE_POSTGRES_USER: getEnvVarWithFallback('VITE_POSTGRES_USER', 'postgres'),
    VITE_POSTGRES_PASSWORD: getEnvVarWithFallback('VITE_POSTGRES_PASSWORD', 'postgres'),
    
    // AI/ML Services
    VITE_OPENROUTER_API_KEY: getEnvVarWithFallback('VITE_OPENROUTER_API_KEY', ''),
    VITE_OPENAI_API_KEY: getEnvVarWithFallback('VITE_OPENAI_API_KEY', ''),
    
    // Authentik OAuth
    VITE_AUTHENTIK_CLIENT_ID: getRequiredEnvVar('VITE_AUTHENTIK_CLIENT_ID'),
    VITE_AUTHENTIK_URL: getRequiredEnvVar('VITE_AUTHENTIK_URL'),
    
    // Development
    NODE_ENV: (getEnvVar('NODE_ENV') as EnvironmentVars['NODE_ENV']) || 'development',
    VITE_DEV: getEnvVar('VITE_DEV') === 'true',
  };
}

/**
 * Validate environment variables at startup
 */
export function validateEnvironment(): void {
  const required = [
    'VITE_AUTHENTIK_CLIENT_ID',
    'VITE_AUTHENTIK_URL',
  ];
  
  const missing = required.filter(key => !getEnvVar(key));
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Get environment info for debugging
 */
export function getEnvironmentInfo(): Record<string, any> {
  return {
    nodeEnv: getEnvVar('NODE_ENV'),
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    isTest: isTest(),
    hasDatabaseUrl: !!getEnvVar('DATABASE_URL'),
    hasApiUrl: !!getEnvVar('VITE_API_URL'),
    hasAuthentikConfig: !!getEnvVar('VITE_AUTHENTIK_CLIENT_ID'),
    environment: typeof import.meta !== 'undefined' ? 'vite' : 'nodejs',
  };
}

/**
 * Safe logging of environment info (no secrets)
 */
export function logEnvironmentInfo(): void {
  // Intentionally use debug logging via logger in production code; keep no-op here
}

// Export commonly used getters
export const env = {
  get: getEnvVar,
  getRequired: getRequiredEnvVar,
  getWithFallback: getEnvVarWithFallback,
  isDev: isDevelopment,
  isProd: isProduction,
  isTest: isTest,
  config: getEnvironmentConfig,
  validate: validateEnvironment,
  info: getEnvironmentInfo,
  logInfo: logEnvironmentInfo,
};
