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
  // Frontend runtime: check window.__APP_CONFIG__ injected at runtime by the container
  if (typeof window !== 'undefined') {
    const runtime = (window as any).__APP_CONFIG__ || {};
    if (runtime && runtime[name] !== undefined && runtime[name] !== '') {
      // allow values injected as quoted strings
      let v = String(runtime[name]);
      if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
        v = v.slice(1, -1);
      }
      return v;
    }
  }

  // Frontend: Vite environment (import.meta.env)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name];
  }
  
  // Backend: Node.js environment (process.env)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
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
export function logEnvironmentInfo(): Record<string, any> {
  const info = getEnvironmentInfo();
  // Return environment info for callers to log or inspect. Avoid direct console usage to satisfy lint rules.
  return info;
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
