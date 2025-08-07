import { BaseService } from '@/core/services/BaseService';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/core/types/supabase';

export interface SessionUtils {
  lastRefreshTime: number;
  getSession: (retries?: number) => Promise<{ session: Session | null; error: unknown }>;
  getUser: () => Promise<{ user: User | null; error: unknown }>;
  isSessionValid: (session: Session | null) => boolean;
  refreshSession: () => Promise<{ session: Session | null; error: unknown }>;
  forceRefreshSession: () => Promise<{ session: Session | null; error: unknown }>;
  ensureSession: () => Promise<boolean>;
}

export interface DatabaseUtils {
  safeQuery: <T>(
    queryFn: () => Promise<{ data: T | null; error: unknown }>,
    context: string
  ) => Promise<{ data: T | null; error: string | null }>;
}

export interface AuthDiagnostics {
  serviceRoleKey: boolean;
  anonKey: boolean;
  supabaseUrl: boolean;
  serviceClientTest: boolean;
  regularClientTest: boolean;
  authSession: Session | null;
  errors: string[];
}

export interface JWTDiagnostics {
  success: boolean;
  error: string | null;
  hasJWT: boolean;
  jwtLength: number;
  sessionData?: {
    hasUser: boolean;
    userId?: string;
    hasAccessToken: boolean;
    tokenLength?: number;
    expiresAt?: number;
  } | null;
}

export interface AuthenticationFlowTest {
  success: boolean;
  error: string | null;
  hasSession: boolean;
  sessionData?: {
    userId?: string;
    email?: string;
    hasAccessToken: boolean;
  } | null;
}

export interface ConnectionTest {
  success: boolean;
  error?: string;
}

export class SupabaseService extends BaseService {
  private static instance: SupabaseService;

  private constructor() {
    super('SupabaseService');
  }

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // Session utilities
  get sessionUtils(): SessionUtils {
    return {
      lastRefreshTime: 0,

      getSession: async (retries = 3): Promise<{ session: Session | null; error: unknown }> => {
        const result = await this.executeDbOperationWithRetry(
          async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            return { data: session, error };
          },
          'Get Session',
          { maxAttempts: retries }
        );
        
        return { session: result.data, error: result.error };
      },

      getUser: async (): Promise<{ user: User | null; error: unknown }> => {
        const result = await this.executeDbOperation(
          async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            return { data: user, error };
          },
          'Get User'
        );
        
        return { user: result.data, error: result.error };
      },

      isSessionValid: (session: Session | null): boolean => {
        if (!session) return false;
        if (!session.expires_at) return true; // No expiration set
        
        // Handle UNIX timestamp (seconds)
        return session.expires_at * 1000 > Date.now();
      },

      refreshSession: async (): Promise<{ session: Session | null; error: unknown }> => {
        // Add rate limiting to prevent 429 errors
        const lastRefresh = this.sessionUtils.lastRefreshTime;
        const now = Date.now();
        if (lastRefresh && now - lastRefresh < 5000) { // 5 second cooldown
          this.logger.warn('Session refresh rate limited, skipping');
          return { session: null, error: 'Rate limited' };
        }
        
        const result = await this.executeDbOperation(
          async () => {
            const { data: { session }, error } = await supabase.auth.refreshSession();
            this.sessionUtils.lastRefreshTime = now;
            return { data: session, error };
          },
          'Refresh Session'
        );
        
        return { session: result.data, error: result.error };
      },

      forceRefreshSession: async (): Promise<{ session: Session | null; error: unknown }> => {
        const result = await this.executeDbOperation(
          async () => {
            const { data: { session }, error } = await supabase.auth.refreshSession();
            return { data: session, error };
          },
          'Force Refresh Session'
        );
        
        return { session: result.data, error: result.error };
      },

      ensureSession: async (): Promise<boolean> => {
        try {
          const { session, error } = await this.sessionUtils.getSession();
          if (error || !session) {
            this.logger.warn('No valid session found, attempting refresh');
            const refreshResult = await this.sessionUtils.refreshSession();
            if (refreshResult.error || !refreshResult.session) {
              this.logger.error('Session refresh failed');
              return false;
            }
            return this.sessionUtils.isSessionValid(refreshResult.session);
          }
          
          // Check if session is valid
          const isValid = this.sessionUtils.isSessionValid(session);
          if (!isValid) {
            this.logger.warn('Session is expired, attempting refresh');
            const refreshResult = await this.sessionUtils.refreshSession();
            if (refreshResult.error || !refreshResult.session) {
              this.logger.error('Session refresh failed');
              return false;
            }
            return this.sessionUtils.isSessionValid(refreshResult.session);
          }
          
          return true;
        } catch (error) {
          this.logger.error('Session validation failed');
          return false;
        }
      }
    };
  }

  // Database utilities
  get dbUtils(): DatabaseUtils {
    return {
      safeQuery: async <T>(
        queryFn: () => Promise<{ data: T | null; error: unknown }>,
        context: string
      ): Promise<{ data: T | null; error: string | null }> => {
        const result = await this.executeDbOperation(
          async () => {
            return await queryFn();
          },
          context
        );
        
        return { 
          data: result.data as T | null, 
          error: result.error 
        };
      }
    };
  }

  // Edge function utilities
  async callEdgeFunction<T>(
    functionName: string,
    payload?: Record<string, unknown>
  ): Promise<T> {
    const result = await this.executeDbOperation(
      async () => {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload
        });
        
        if (error) {
          throw error;
        }
        
        return { data, error: null };
      },
      `Edge Function: ${functionName}`
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Edge function call failed');
    }
    
    return result.data as T;
  }

  // Database helper functions
  async select<T>(
    table: keyof Database['public']['Tables'],
    columns?: string,
    filter?: Record<string, string | number | boolean>
  ): Promise<{ data: T[] | null; error: unknown }> {
    const result = await this.executeDbOperation(
      async () => {
        let query = supabase.from(table).select(columns || '*');
        
        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        const { data, error } = await query;
        return { data, error };
      },
      `Select from ${table}`
    );
    
    return { data: result.data as T[] | null, error: result.error };
  }

  async selectOne<T>(
    table: keyof Database['public']['Tables'],
    id: string,
    idColumn: string = 'id'
  ): Promise<{ data: T | null; error: unknown }> {
    const result = await this.executeDbOperation(
      async () => {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq(idColumn, id)
          .single();
        
        return { data, error };
      },
      `SelectOne from ${table}`
    );
    
    return { data: result.data as T | null, error: result.error };
  }

  async selectWithOptions<T>(
    table: keyof Database['public']['Tables'],
    options: {
      filter?: Record<string, string | number | boolean>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      columns?: string;
    }
  ): Promise<{ data: T[] | null; error: unknown }> {
    const result = await this.executeDbOperation(
      async () => {
        let query = supabase.from(table).select(options.columns || '*');
        
        if (options.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        if (options.orderBy) {
          query = query.order(options.orderBy.column, { 
            ascending: options.orderBy.ascending ?? false 
          });
        }
        
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        const { data, error } = await query;
        return { data, error };
      },
      `SelectWithOptions from ${table}`
    );
    
    return { data: result.data as T[] | null, error: result.error };
  }

  async insertOne<T>(
    table: keyof Database['public']['Tables'],
    data: any
  ): Promise<{ data: T | null; error: unknown }> {
    const result = await this.executeDbOperation(
      async () => {
        const { data: result, error } = await supabase
          .from(table)
          .insert(data)
          .select()
          .single();
        
        return { data: result, error };
      },
      `InsertOne into ${table}`
    );
    
    return { data: result.data as T | null, error: result.error };
  }

  async upsertOne<T>(
    table: keyof Database['public']['Tables'],
    data: any,
    onConflict?: string
  ): Promise<{ data: T | null; error: unknown }> {
    const result = await this.executeDbOperation(
      async () => {
        const query = supabase
          .from(table)
          .upsert(data, { onConflict })
          .select()
          .single();
        
        const { data: result, error } = await query;
        return { data: result, error };
      },
      `UpsertOne into ${table}`
    );
    
    return { data: result.data as T | null, error: result.error };
  }

  async updateOne<T>(
    table: keyof Database['public']['Tables'],
    id: string,
    data: Record<string, unknown>,
    idColumn: string = 'id'
  ): Promise<{ data: T | null; error: unknown }> {
    const result = await this.executeDbOperation(
      async () => {
        const { data: result, error } = await supabase
          .from(table)
          .update(data)
          .eq(idColumn, id)
          .select()
          .single();
        
        return { data: result, error };
      },
      `UpdateOne in ${table}`
    );
    
    return { data: result.data as T | null, error: result.error };
  }

  async deleteOne(
    table: keyof Database['public']['Tables'],
    id: string,
    idColumn: string = 'id'
  ): Promise<{ data: unknown; error: unknown }> {
    const result = await this.executeDbOperation(
      async () => {
        const { data, error } = await supabase
          .from(table)
          .delete()
          .eq(idColumn, id)
          .select()
          .single();

        return { data, error };
      },
      `DeleteOne from ${table}`
    );
    
    return { data: result.data, error: result.error };
  }

  async callRPC<T>(
    functionName: string,
    params: Record<string, unknown> = {}
  ): Promise<{ data: T | null; error: unknown }> {
    const result = await this.executeDbOperation(
      async () => {
        const { data, error } = await supabase.rpc(functionName as any, params);
        return { data, error };
      },
      `RPC: ${functionName}`
    );
    
    return { data: result.data as T | null, error: result.error };
  }

  // Auth diagnostic utilities
  async diagnoseAuthIssues(): Promise<AuthDiagnostics> {
    const results: AuthDiagnostics = {
      serviceRoleKey: !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      anonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      serviceClientTest: false,
      regularClientTest: false,
      authSession: null,
      errors: []
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
  }

  async testAndFixSession(): Promise<{ success: boolean; session: Session | null; error: unknown }> {
    const result = await this.executeDbOperation(
      async () => {
        const { session, error } = await this.sessionUtils.getSession();
        
        if (error || !session) {
          // Try to refresh the session
          const refreshResult = await this.sessionUtils.refreshSession();
          return { 
            data: {
              success: refreshResult.session !== null,
              session: refreshResult.session,
              error: refreshResult.error
            }, 
            error: null 
          };
        }

        return { 
          data: {
            success: true,
            session,
            error: null
          }, 
          error: null 
        };
      },
      'Test and Fix Session'
    );
    
    return result.data || { success: false, session: null, error: 'Unknown error' };
  }

  async testConnection(): Promise<ConnectionTest> {
    const result = await this.executeDbOperation(
      async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1);
        
        return { 
          data: {
            success: !error,
            error: error?.message
          }, 
          error: null 
        };
      },
      'Test Connection'
    );
    
    return result.data || { success: false, error: 'Unknown error' };
  }

  async diagnoseJWTTransmission(): Promise<JWTDiagnostics> {
    const result = await this.executeDbOperation(
      async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          return { 
            data: {
              success: false,
              error: error.message,
              hasJWT: false,
              jwtLength: 0
            }, 
            error: null 
          };
        }

        const hasJWT = !!(session?.access_token);
        const jwtLength = session?.access_token?.length || 0;

        return { 
          data: {
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
          }, 
          error: null 
        };
      },
      'Diagnose JWT Transmission'
    );
    
    return result.data || { success: false, error: 'Unknown error', hasJWT: false, jwtLength: 0 };
  }

  async testAuthenticationFlow(): Promise<AuthenticationFlowTest> {
    const result = await this.executeDbOperation(
      async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          return { 
            data: {
              success: false,
              error: error.message,
              hasSession: false
            }, 
            error: null 
          };
        }

        return { 
          data: {
            success: true,
            error: null,
            hasSession: !!session,
            sessionData: session ? {
              userId: session.user?.id,
              email: session.user?.email,
              hasAccessToken: !!session.access_token
            } : null
          }, 
          error: null 
        };
      },
      'Test Authentication Flow'
    );
    
    return result.data || { success: false, error: 'Unknown error', hasSession: false };
  }

  // Database service wrapper
  async getIntegrationStatus(userId: string, context: string) {
    const result = await this.executeDbOperation(
      async () => {
        const { data, error } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', userId);

        return { data, error };
      },
      context
    );
    
    return { 
      data: result.data, 
      error: result.error 
    };
  }

  // Debug utilities
  debugClientInstances() {
    return {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      hasServiceKey: !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      clientInstance: 'main',
      timestamp: new Date().toISOString()
    };
  }

  clearAllClientInstances() {
    // This would clear any cached client instances
    // For now, just return success
    return {
      success: true,
      message: 'Client instances cleared'
    };
  }
}

// Export singleton instance
export const supabaseService = SupabaseService.getInstance();
