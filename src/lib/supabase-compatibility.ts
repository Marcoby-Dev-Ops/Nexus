/**
 * Supabase Compatibility Layer
 * 
 * This file provides backward compatibility for existing code that imports
 * from the old supabase.ts file. It re-exports the new SupabaseService methods
 * to maintain the same API while encouraging migration to the service pattern.
 * 
 * @deprecated Use SupabaseService directly for new code
 */

// Lazy load the service to avoid circular dependencies
let supabaseService: any = null;

const getSupabaseService = async () => {
  if (!supabaseService) {
    // Dynamic import to avoid circular dependency
    const { SupabaseService } = await import('@/core/services/SupabaseService');
    supabaseService = SupabaseService.getInstance();
  }
  return supabaseService;
};

// Session utilities (deprecated - use supabaseService.sessionUtils)
export const sessionUtils = {
  lastRefreshTime: 0,
  getSession: async (retries = 3) => {
    const service = await getSupabaseService();
    return service.sessionUtils.getSession(retries);
  },
  getUser: async () => {
    const service = await getSupabaseService();
    return service.sessionUtils.getUser();
  },
  isSessionValid: async (session: any) => {
    const service = await getSupabaseService();
    return service.sessionUtils.isSessionValid(session);
  },
  refreshSession: async () => {
    const service = await getSupabaseService();
    return service.sessionUtils.refreshSession();
  },
  forceRefreshSession: async () => {
    const service = await getSupabaseService();
    return service.sessionUtils.forceRefreshSession();
  },
  ensureSession: async () => {
    const service = await getSupabaseService();
    return service.sessionUtils.ensureSession();
  }
};

// Database utilities (deprecated - use supabaseService.dbUtils)
export const dbUtils = {
  safeQuery: async <T>(
    queryFn: () => Promise<{ data: T | null; error: unknown }>,
    context: string
  ) => {
    const service = await getSupabaseService();
    return service.dbUtils.safeQuery(queryFn, context);
  }
};

// Edge function utilities (deprecated - use supabaseService.callEdgeFunction)
export const callEdgeFunction = async <T>(
  functionName: string,
  payload?: Record<string, unknown>
): Promise<T> => {
  const service = await getSupabaseService();
  return service.callEdgeFunction(functionName, payload);
};

// Database helper functions (deprecated - use supabaseService methods directly)
export const select = async <T>(
  table: string,
  columns?: string,
  filter?: Record<string, string | number | boolean>
) => {
  const service = await getSupabaseService();
  return service.select(table, columns, filter);
};

export const selectOne = async <T>(
  table: string,
  id: string,
  idColumn: string = 'id'
) => {
  const service = await getSupabaseService();
  return service.selectOne(table, id, idColumn);
};

export const selectWithOptions = async <T>(
  table: string,
  options: {
    filter?: Record<string, string | number | boolean>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    columns?: string;
  }
) => {
  const service = await getSupabaseService();
  return service.selectWithOptions(table, options);
};

export const insertOne = async <T>(
  table: string,
  data: any
) => {
  const service = await getSupabaseService();
  return service.insertOne(table, data);
};

export const upsertOne = async <T>(
  table: string,
  data: any,
  onConflict?: string
) => {
  const service = await getSupabaseService();
  return service.upsertOne(table, data, onConflict);
};

export const updateOne = async <T>(
  table: string,
  id: string,
  data: Record<string, unknown>,
  idColumn: string = 'id'
) => {
  const service = await getSupabaseService();
  return service.updateOne(table, id, data, idColumn);
};

export const deleteOne = async (
  table: string,
  id: string,
  idColumn: string = 'id'
) => {
  const service = await getSupabaseService();
  return service.deleteOne(table, id, idColumn);
};

export const callRPC = async <T>(
  functionName: string,
  params: Record<string, unknown> = {}
) => {
  const service = await getSupabaseService();
  return service.callRPC(functionName, params);
};

// Database service wrapper (deprecated - use supabaseService.getIntegrationStatus)
export const dbService = {
  getIntegrationStatus: async (userId: string, context: string) => {
    const service = await getSupabaseService();
    return service.getIntegrationStatus(userId, context);
  }
};

// Auth diagnostic utilities (deprecated - use supabaseService methods directly)
export const diagnoseAuthIssues = async () => {
  const service = await getSupabaseService();
  return service.diagnoseAuthIssues();
};

export const testAndFixSession = async () => {
  const service = await getSupabaseService();
  return service.testAndFixSession();
};

export const testAuthenticationFlow = async () => {
  const service = await getSupabaseService();
  return service.testAuthenticationFlow();
};

// Smart client (deprecated - use supabaseService.testConnection)
export const smartClient = {
  testConnection: async () => {
    const service = await getSupabaseService();
    return service.testConnection();
  }
};

// Debug utilities (deprecated - use supabaseService methods directly)
export const diagnoseJWTTransmission = async () => {
  const service = await getSupabaseService();
  return service.diagnoseJWTTransmission();
};

export const debugClientInstances = async () => {
  const service = await getSupabaseService();
  return service.debugClientInstances();
};

export const clearAllClientInstances = async () => {
  const service = await getSupabaseService();
  return service.clearAllClientInstances();
};

// Error handling utility (deprecated - use BaseService.handleError)
export const handleSupabaseError = async (error: unknown, context: string) => {
  const service = await getSupabaseService();
  return service.handleError(error, context);
};

// Global test function for debugging (deprecated)
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testAuth = async () => {
    console.log('🧪 Testing authentication flow...');
    
    try {
      const service = await getSupabaseService();
      
      // Test session
      const { data: { session }, error } = await service.supabase.auth.getSession();
      
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
      const { data: testData, error: testError } = await service.supabase
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

// Re-export types
export type { ChatMessage } from '@/core/types/chat';
