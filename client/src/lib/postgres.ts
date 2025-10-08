import { getEnvVarWithFallback } from '@/lib/env-utils';

// PostgreSQL configuration
const postgresUrl = getEnvVarWithFallback('VITE_POSTGRES_URL', '');
const postgresHost = getEnvVarWithFallback('VITE_POSTGRES_HOST', 'localhost');
const postgresPort = getEnvVarWithFallback('VITE_POSTGRES_PORT', '5433');
const postgresDb = getEnvVarWithFallback('VITE_POSTGRES_DB', 'vector_db');
const postgresUser = getEnvVarWithFallback('VITE_POSTGRES_USER', 'postgres');
const postgresPassword = getEnvVarWithFallback('VITE_POSTGRES_PASSWORD', 'postgres');

// PostgreSQL client configuration
export const postgresConfig = {
  url: postgresUrl,
  host: postgresHost,
  port: Number(postgresPort),
  database: postgresDb,
  user: postgresUser,
  password: postgresPassword,
};

// Helper function to check if PostgreSQL is configured
export const isPostgresConfigured = (): boolean => {
  return !!(postgresUrl || (postgresHost && postgresDb));
};

// Helper function to get database connection string
export const getPostgresConnectionString = (): string => {
  if (postgresUrl) {
    return postgresUrl;
  }
  return `postgresql://${postgresUser}:${postgresPassword}@${postgresHost}:${postgresPort}/${postgresDb}`;
};

// Mock query function for browser environment
export const query = async <T = any>(sql: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> => {
  // In browser environment, this should not be called directly
  // Database operations should go through API endpoints
  console.warn('PostgreSQL query called in browser environment - this should go through API endpoints');
  return { rows: [], rowCount: 0 };
};

// Mock transaction function for browser environment
export const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
  // In browser environment, this should not be called directly
  console.warn('PostgreSQL transaction called in browser environment - this should go through API endpoints');
  throw new Error('PostgreSQL transactions are not available in browser environment');
};

// Mock test connection function for browser environment
export const testConnection = async (): Promise<{ success: boolean; error?: string }> => {
  // In browser environment, this should not be called directly
  console.warn('PostgreSQL connection test called in browser environment');
  return { success: false, error: 'PostgreSQL not available in browser environment' };
};

// Mock test vector extension function for browser environment
export const testVectorExtension = async (): Promise<{ success: boolean; error?: string }> => {
  // In browser environment, this should not be called directly
  console.warn('PostgreSQL vector extension test called in browser environment');
  return { success: false, error: 'PostgreSQL not available in browser environment' };
};

// Mock client for browser environment (actual connections go through API)
export const postgres = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: [], error: null }),
      neq: (column: string, value: any) => Promise.resolve({ data: [], error: null }),
      gt: (column: string, value: any) => Promise.resolve({ data: [], error: null }),
      lt: (column: string, value: any) => Promise.resolve({ data: [], error: null }),
      gte: (column: string, value: any) => Promise.resolve({ data: [], error: null }),
      lte: (column: string, value: any) => Promise.resolve({ data: [], error: null }),
      like: (column: string, value: string) => Promise.resolve({ data: [], error: null }),
      ilike: (column: string, value: string) => Promise.resolve({ data: [], error: null }),
      in: (column: string, values: any[]) => Promise.resolve({ data: [], error: null }),
      order: (column: string, options?: { ascending?: boolean }) => Promise.resolve({ data: [], error: null }),
      limit: (count: number) => Promise.resolve({ data: [], error: null }),
      range: (from: number, to: number) => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (callback: (result: any) => void) => Promise.resolve({ data: [], error: null }),
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
      neq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
      then: (callback: (result: any) => void) => Promise.resolve({ data: null, error: null }),
    }),
    upsert: (data: any) => Promise.resolve({ data: null, error: null }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
      neq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
      then: (callback: (result: any) => void) => Promise.resolve({ data: null, error: null }),
    }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback: (event: string, session: any) => void) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
  rpc: (functionName: string, params?: any) => Promise.resolve({ data: null, error: null }),
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: File) => Promise.resolve({ data: null, error: null }),
      download: (path: string) => Promise.resolve({ data: null, error: null }),
      remove: (paths: string[]) => Promise.resolve({ data: null, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: '' } }),
    }),
  },
};

// Re-export types for compatibility
export type { ChatMessage } from '@/core/types/chat';
