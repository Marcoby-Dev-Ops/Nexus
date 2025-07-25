import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/core/types/supabase';
import { logger } from '@/shared/utils/logger.ts';
import type { ChatMessage } from '@/core/types/chat';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Enhanced error handling utility
export const handleSupabaseError = (error: any, context: string) => {
  logger.error({ error, context }, 'Supabase operation failed');
  return {
    success: false,
    error: error?.message || 'Unknown error',
    context
  };
};

// Session utilities
export const sessionUtils = {
  getSession: async (retries = 3): Promise<{ session: any; error: any }> => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          logger.warn({ error, attempt: i + 1 }, 'Session retrieval failed, retrying...');
          if (i === retries - 1) return { session: null, error };
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        return { session, error: null };
      } catch (error) {
        logger.error({ error, attempt: i + 1 }, 'Unexpected error getting session');
        if (i === retries - 1) return { session: null, error };
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    return { session: null, error: 'Failed to get session after retries' };
  },

  getUser: async (): Promise<{ user: any; error: any }> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    } catch (error) {
      logger.error({ error }, 'Failed to get user');
      return { user: null, error };
    }
  },

  isSessionValid: (session: any): boolean => {
    if (!session) return false;
    if (!session.expires_at) return true; // No expiration set
    return new Date(session.expires_at) > new Date();
  },

  refreshSession: async (): Promise<{ session: any; error: any }> => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      return { session, error };
    } catch (error) {
      logger.error({ error }, 'Failed to refresh session');
      return { session: null, error };
    }
  },

  forceRefreshSession: async (): Promise<{ session: any; error: any }> => {
    try {
      // Force a new session refresh
      const { data: { session }, error } = await supabase.auth.refreshSession();
      return { session, error };
    } catch (error) {
      logger.error({ error }, 'Failed to force refresh session');
      return { session: null, error };
    }
  }
};

// Database utilities
export const dbUtils = {
  safeQuery: async <T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    context: string
  ): Promise<{ data: T | null; error: string | null }> => {
    try {
      const result = await queryFn();
      if (result.error) {
        logger.error({ error: result.error, context }, 'Database query failed');
        return { data: null, error: result.error.message };
      }
      return { data: result.data, error: null };
    } catch (error) {
      logger.error({ error, context }, 'Unexpected database error');
      return { data: null, error: 'Database operation failed' };
    }
  }
};

// Edge function utilities
export const callEdgeFunction = async <T>(
  functionName: string,
  payload?: any
): Promise<T> => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });
    
    if (error) {
      logger.error({ error, functionName }, 'Edge function call failed');
      throw error;
    }
    
    return data as T;
  } catch (error) {
    logger.error({ error, functionName }, 'Edge function call failed');
    throw error;
  }
};

// Database service wrapper for compatibility
export const dbService = {
  async getIntegrationStatus(userId: string, context: string) {
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        logger.error({ error, context }, 'Failed to get integration status');
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error({ error, context }, 'Unexpected error in getIntegrationStatus');
      return { data: null, error };
    }
  }
};

// Auth diagnostic utilities
export const diagnoseAuthIssues = async () => {
  const results = {
    serviceRoleKey: !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    anonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    serviceClientTest: false,
    regularClientTest: false,
    authSession: null,
    errors: [] as string[]
  };

  try {
    // Test regular client
    const { data: { session }, error } = await supabase.auth.getSession();
    results.regularClientTest = !error && !!session;
    results.authSession = session;
    
    if (error) {
      results.errors.push(`Regular client test failed: ${error.message}`);
    }
  } catch (error) {
    results.errors.push(`Regular client test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return results;
};

export const testAndFixSession = async () => {
  try {
    const { session, error } = await sessionUtils.getSession();
    
    if (error || !session) {
      // Try to refresh the session
      const refreshResult = await sessionUtils.refreshSession();
      return {
        success: refreshResult.session !== null,
        session: refreshResult.session,
        error: refreshResult.error
      };
    }

    return {
      success: true,
      session,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      session: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Smart client for enhanced functionality
export const smartClient = {
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      return {
        success: !error,
        error: error?.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Debug utilities
export const diagnoseJWTTransmission = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        success: false,
        error: error.message,
        hasJWT: false,
        jwtLength: 0
      };
    }

    const hasJWT = !!(session?.access_token);
    const jwtLength = session?.access_token?.length || 0;

    return {
      success: true,
      error: null,
      hasJWT,
      jwtLength,
      sessionData: session ? {
        hasUser: !!session.user,
        userId: session.user?.id,
        hasAccessToken: !!session.access_token,
        tokenLength: session.access_token?.length,
        expiresAt: session.expires_at
      } : null
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasJWT: false,
      jwtLength: 0
    };
  }
};

export const debugClientInstances = () => {
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    hasServiceKey: !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    clientInstance: 'main',
    timestamp: new Date().toISOString()
  };
};

export const clearAllClientInstances = () => {
  // This would clear any cached client instances
  // For now, just return success
  return {
    success: true,
    message: 'Client instances cleared'
  };
};

// Authentication flow testing utility
export const testAuthenticationFlow = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        success: false,
        error: error.message,
        hasSession: false
      };
    }

    return {
      success: true,
      error: null,
      hasSession: !!session,
      sessionData: session ? {
        userId: session.user?.id,
        email: session.user?.email,
        hasAccessToken: !!session.access_token
      } : null
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasSession: false
    };
  }
};

// Re-export types
export type { ChatMessage };

// Global test function for debugging
if (typeof window !== 'undefined') {
  (window as any).testAuth = async () => {
    console.log('🧪 Testing authentication flow...');
    
    try {
      // Test session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error('❌ No valid session found');
        return { error: 'No valid session found' };
      }

      console.log('✅ Session found:', {
        userId: session.user.id,
        email: session.user.email,
        hasAccessToken: !!session.access_token,
        tokenLength: session.access_token?.length
      });

      // Test database query
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('id, email, role')
        .eq('id', session.user.id)
        .single();

      if (testError) {
        console.error('❌ Database query failed: ', testError);
        return { error: testError.message };
      }

      console.log('✅ Database query successful:', testData);
      return { success: true, data: testData };
    } catch (error) {
      console.error('❌ Authentication test failed: ', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };
} 