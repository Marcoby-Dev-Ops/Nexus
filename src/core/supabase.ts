import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/core/types/database.types';
import { env } from '@/core/environment';
import { logger } from '@/shared/utils/logger';

// Single, optimized Supabase client instance
// This is the ONLY client that should be used throughout the application
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

// Get or create the single Supabase client instance
const getSupabaseClient = () => {
  if (!supabaseInstance) {
    logger.info('Creating single Supabase client instance...');
    
    // Prevent multiple GoTrueClient instances warning
    if (import.meta.env.DEV) {
      logger.info('Ensuring single GoTrueClient instance to prevent auth conflicts...');
    }
    
    supabaseInstance = createClient<Database>(env.supabase.url, env.supabase.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'nexus-main-client',
        storage: {
          getItem: (key) => {
            try {
              return localStorage.getItem(key);
            } catch {
              return null;
            }
          },
          setItem: (key, value) => {
            try {
              localStorage.setItem(key, value);
            } catch {
              // Ignore storage errors
            }
          },
          removeItem: (key) => {
            try {
              localStorage.removeItem(key);
            } catch {
              // Ignore storage errors
            }
          },
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'X-Client-Info': 'nexus-frontend',
        },
      },
      db: {
        schema: 'public',
      },
    });
  }
  return supabaseInstance;
};

// Export the single client instance
export const supabase = getSupabaseClient();

// Clear any existing instances on module reload (for development)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Clear any existing instances to prevent multiple GoTrueClient warnings
  if (window.__SUPABASE_INSTANCES_CLEARED__) {
    supabaseInstance = null;
    serviceClientInstance = null;
  }
  window.__SUPABASE_INSTANCES_CLEARED__ = true;
}

// Service client for database operations only (no auth) - also singleton
let serviceClientInstance: ReturnType<typeof createClient<Database>> | null = null;

const getServiceClient = () => {
  if (!serviceClientInstance) {
    logger.info('Creating single service client instance...');
    
    // Create service client with minimal auth configuration to prevent GoTrueClient conflicts
    serviceClientInstance = createClient<Database>(
      env.supabase.url, 
      env.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          storageKey: 'nexus-service-client',
          flowType: 'implicit',
          detectSessionInUrl: false,
          storage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          },
        },
        global: {
          headers: {
            'X-Client-Info': 'nexus-service-client',
            'apikey': env.supabase.serviceRoleKey,
          },
        },
        db: {
          schema: 'public',
        },
      }
    );
    
    // Override the auth property to prevent any auth operations
    Object.defineProperty(serviceClientInstance, 'auth', {
      value: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: null } }),
        signOut: () => Promise.resolve({ error: null }),
        refreshSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      writable: false,
    });
  }
  return serviceClientInstance;
};

export const supabaseService = getServiceClient();

// Add request debugging in development
if (import.meta.env.DEV) {
  // Debug database requests
  const originalFrom = supabase.from;
  supabase.from = function(table) {
    const builder = originalFrom.call(this, table);
    
    // Add request debugging
    const originalSelect = builder.select;
    builder.select = function(...args) {
      logger.debug(`Database request: SELECT from ${table}`);
      return originalSelect.apply(this, args);
    };
    
    return builder;
  };
  
  // Debug client instances on page load
  setTimeout(() => {
    debugClientInstances();
  }, 1000);
}

// Enhanced session management utilities
export const sessionUtils = {
  // Get current session with retry
  getSession: async (retries = 3): Promise<{ session: any; error: any }> => {
    // Try to use cached session getter first
    try {
      const { getSessionWithCache } = await import('@/shared/stores/authStore');
      const session = await getSessionWithCache();
      
      if (session) {
        // Check if session is expired
        let expiresAt: number;
        if (session.expires_at) {
          if (typeof session.expires_at === 'number') {
            // Supabase returns expires_at in seconds, convert to milliseconds
            expiresAt = session.expires_at * 1000;
          } else {
            expiresAt = new Date(session.expires_at).getTime();
          }
        } else {
          expiresAt = 0;
        }
        
        const now = Date.now();
        
        if (expiresAt > now + 60000) { // 60 second buffer
          console.log('✅ Valid session found (cached):', session.user.email);
          return { session, error: null };
        } else {
          console.log('⚠️ Session expired, attempting refresh...');
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshData.session && !refreshError) {
            console.log('✅ Session refreshed successfully');
            return { session: refreshData.session, error: null };
          } else {
            console.warn('❌ Session refresh failed:', refreshError);
            return { session: null, error: refreshError || new Error('Session expired and refresh failed') };
          }
        }
      }
    } catch {
      // Cached session getter not available, falling back to direct call
    }
    
    // Fallback to direct call with retries
    for (let i = 0; i < retries; i++) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
          // Check if session is expired
          let expiresAt: number;
          if (session.expires_at) {
            if (typeof session.expires_at === 'number') {
              // Supabase returns expires_at in seconds, convert to milliseconds
              expiresAt = session.expires_at * 1000;
            } else {
              expiresAt = new Date(session.expires_at).getTime();
            }
          } else {
            expiresAt = 0;
          }
          
          const now = Date.now();
          
          if (expiresAt > now + 60000) { // 60 second buffer
            console.log('✅ Valid session found:', session.user.email);
            return { session, error: null };
          } else {
            console.log('⚠️ Session expired, attempting refresh...');
            // Try to refresh the session
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshData.session && !refreshError) {
              console.log('✅ Session refreshed successfully');
              return { session: refreshData.session, error: null };
            } else {
              console.warn('❌ Session refresh failed:', refreshError);
              return { session: null, error: refreshError || new Error('Session expired and refresh failed') };
            }
          }
        }
        if (error) {
          console.warn(`Session fetch attempt ${i + 1} failed:`, error);
        }
        // Wait before retry
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.warn(`Session fetch attempt ${i + 1} threw error:`, err);
      }
    }
    return { session: null, error: new Error('Failed to get valid session after retries') };
  },

  // Ensure session is available before making requests
  ensureSession: async () => {
    const { session, error } = await sessionUtils.getSession();
    if (error || !session) {
      console.warn('No valid session available');
      return false;
    }
    return true;
  },

  // Get authenticated client with explicit JWT token
  getAuthenticatedClient: async () => {
    const { session, error } = await sessionUtils.getSession();
    if (error || !session) {
      throw new Error('No valid session available');
    }

    // Ensure the main supabase client has the current session
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession || currentSession.access_token !== session.access_token) {
      // Set the session manually if it's different
      await supabase.auth.setSession(session);
    }

    return supabase;
  },

  // Force refresh session
  refreshSession: async () => {
    try {
      console.log('🔄 Forcing session refresh...');
      const { data, error } = await supabase.auth.refreshSession();
      if (data.session && !error) {
        console.log('✅ Session refresh successful');
        return { success: true, session: data.session };
      } else {
        console.error('❌ Session refresh failed:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('❌ Session refresh error:', error);
      return { success: false, error };
    }
  },

  // Force refresh session and clear cache
  forceRefreshSession: async () => {
    try {
      console.log('🔄 Force refreshing session and clearing cache...');
      await supabase.auth.setSession({ access_token: '', refresh_token: '' }); // Clear cached session
      const { data } = await supabase.auth.refreshSession();
      if (data.session) {
        await supabase.auth.setSession(data.session); // Set new session
        return { success: true, session: data.session };
      } else {
        return { success: false, error: new Error('No session returned from force refresh') };
      }
    } catch (err) {
      console.error('❌ Force refresh session error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  // Handle expired session with comprehensive flow
  handleExpiredSession: async () => {
    try {
      console.log('🔄 Handling expired session...');
      const refreshResult = await sessionUtils.refreshSession();
      if (refreshResult.success) return refreshResult;
      
      const forceRefreshResult = await sessionUtils.forceRefreshSession();
      if (forceRefreshResult.success) return forceRefreshResult;
      
      // If all fails, sign out and redirect
      console.log('❌ Session completely expired, redirecting to login...');
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return { success: false, error: new Error('Session expired, please log in again') };
    } catch (error) {
      console.error('❌ Handle expired session error:', error);
      return { success: false, error };
    }
  },

  // Check if session is valid with buffer
  isSessionValid: (session: any) => {
    if (!session) return false;
    
    console.log('🔍 Session validation check:', {
      hasSession: !!session,
      hasExpiresAt: !!session.expires_at,
      expiresAt: session.expires_at,
      expiresAtType: typeof session.expires_at,
      now: Date.now(),
    });
    
    let expiresAt: number;
    if (session.expires_at) {
      if (typeof session.expires_at === 'number') {
        expiresAt = session.expires_at * 1000; // Convert seconds to milliseconds
      } else if (typeof session.expires_at === 'string') {
        expiresAt = new Date(session.expires_at).getTime();
      } else {
        expiresAt = 0;
      }
    } else {
      expiresAt = 0;
    }
    
    const now = Date.now();
    const isValid = expiresAt > now + 60000; // 60 second buffer
    
    console.log('🔍 Session validation result:', {
      expiresAt,
      now,
      isValid,
      timeRemaining: expiresAt - now,
      expiresAtDate: new Date(expiresAt).toLocaleString(),
    });
    
    return isValid;
  },

  // Test and fix JWT token transmission
  testAndFixJWTTransmission: async () => {
    try {
      console.log('🧪 Testing JWT token transmission...');
      
      // Get current session
      const { session, error } = await sessionUtils.getSession();
      if (error || !session) {
        console.error('❌ No valid session available');
        return { success: false, error: 'No valid session' };
      }

      console.log('✅ Session found:', {
        userId: session.user.id,
        email: session.user.email,
        hasAccessToken: !!session.access_token,
        tokenLength: session.access_token?.length,
      });

      // Test if the session is properly set in the client
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession || currentSession.access_token !== session.access_token) {
        console.log('⚠️ Session mismatch, setting session...');
        await supabase.auth.setSession(session);
      }

      // Test a simple query to see if JWT is being sent
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', session.user.id)
        .limit(1);

      if (testError) {
        console.error('❌ JWT transmission test failed:', testError);
        return { success: false, error: testError };
      }

      console.log('✅ JWT transmission test successful:', testData);
      return { success: true, data: testData };
          } catch (err) {
        console.error('❌ JWT transmission test error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
  },
};

// Enhanced database utilities with session validation
export const dbUtils = {
  // Debug session state
  debugSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('🔍 Session debug:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      hasAccessToken: !!session?.access_token,
      tokenLength: session?.access_token?.length,
      expiresAt: session?.expires_at,
      error: error?.message
    });
    return { session, error };
  },

  // Ensure session is valid before database operations
  ensureValidSession: async () => {
    const { session, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Session error:', error);
      throw new Error('Session error: ' + error.message);
    }
    
    if (!session) {
      console.warn('⚠️ No session available, but continuing...');
      return null;
    }
    
    console.log('✅ Session validated:', {
      userId: session.user.id,
      hasToken: !!session.access_token,
      expiresAt: session.expires_at
    });
    
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.warn('⚠️ Session expired, attempting refresh');
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !newSession) {
        console.error('❌ Session refresh failed:', refreshError);
        throw new Error('Session expired and refresh failed');
      }
      console.log('✅ Session refreshed successfully');
      return newSession;
    }
    
    return session;
  },

  // Safe database operations with session validation
  safeQuery: async <T>(queryFn: () => Promise<{ data: T | null; error: any }>) => {
    await dbUtils.ensureValidSession();
    return queryFn();
  },

  // Enhanced fetchData function with better error handling
  fetchData: async <T>(
    table: string,
    query: string,
    options: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: string;
      limit?: number;
    } = {}
  ): Promise<{ data: T[] | null; error: any }> => {
    try {
      // Validate session first
      const session = await dbUtils.ensureValidSession();
      if (!session) {
        console.warn('⚠️ [AuthContext.fetchData] No session available, but continuing with query...');
        // Return empty data instead of making the query without session
        return { data: [], error: null };
      }

      console.log(`🔍 [AuthContext.fetchData] Fetching ${query} for user: ${session?.user?.id}`);

      let queryBuilder = supabase.from(table).select(options.select || '*');

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        queryBuilder = queryBuilder.order(options.orderBy);
      }

      // Apply limit
      if (options.limit) {
        queryBuilder = queryBuilder.limit(options.limit);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error(`❌ [AuthContext.fetchData] Error fetching ${query}:`, error);
        return { data: null, error };
      }

      console.log(`✅ [AuthContext.fetchData] Successfully fetched ${data?.length || 0} ${query}`);
      return { data, error: null };

    } catch (error) {
      console.error(`❌ [AuthContext.fetchData] Exception in ${query}:`, error);
      return { data: null, error };
    }
  }
};

// Development helpers
if (import.meta.env.DEV) {
  // Debug database requests only - auth state is handled by authStore
  const originalFrom = supabase.from;
  supabase.from = function(table: string) {
    const builder = originalFrom.call(this, table);
    
    // Add request debugging
    const originalSelect = builder.select;
    builder.select = function(...args: any[]) {
      console.log(`🔍 Database request: SELECT from ${table}`);
      return originalSelect.apply(this, args);
    };
    
    return builder;
  };
}

// Error handling utility
export const handleSupabaseError = (error: any, context: string) => {
  console.error(`❌ Supabase error in ${context}:`, error);
  
  if (error?.code === 'PGRST116') {
    return { error: 'Database connection failed. Please try again.' };
  }
  
  if (error?.code === '42501') {
    return { error: 'Access denied. Please check your permissions.' };
  }
  
  if (error?.code === '23505') {
    return { error: 'This record already exists.' };
  }
  
  return { error: error?.message || 'An unexpected error occurred.' };
};

// Authentication utilities
export const authUtils = {
  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },
};

// Chat history service
export const chatHistory = {
  // Create a new conversation
  createConversation: async (title: string, agentId: string, metadata: Record<string, any> = {}) => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        title,
        agent_id: agentId,
        metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Add a message to a conversation
  addMessage: async (conversationId: string, message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, any>;
  }) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get conversation by ID
  getConversation: async (conversationId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's conversations
  getUserConversations: async (userId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

// Centralized database service with tracing
export class DatabaseService {
  private static instance: DatabaseService;
  
  private constructor() {}
  
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Centralized user integrations queries
  async getUserIntegrations(userId: string, caller: string) {
    console.log(`🔍 [${caller}] Fetching user integrations for user: ${userId}`);
    
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error(`❌ [${caller}] Database query failed:`, error);
        throw error;
      }

      console.log(`✅ [${caller}] Successfully fetched ${data?.length || 0} integrations`);
      return { data, error: null };
    } catch (err) {
      console.error(`❌ [${caller}] getUserIntegrations failed:`, err);
      return { data: null, error: err };
    }
  }

  // Centralized user profile queries
  async getUserProfile(userId: string, caller: string) {
    console.log(`🔍 [${caller}] Fetching user profile for user: ${userId}`);
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error(`❌ [${caller}] Database query failed:`, error);
        throw error;
      }

      console.log(`✅ [${caller}] Successfully fetched user profile`);
      return { data, error: null };
    } catch (err) {
      console.error(`❌ [${caller}] getUserProfile failed:`, err);
      return { data: null, error: err };
    }
  }

  // Centralized company status queries
  async getCompanyStatus(companyId: string, caller: string) {
    console.log(`🔍 [${caller}] Fetching company status for company: ${companyId}`);
    
    try {
      const { data, error } = await supabase
        .from('company_status')
        .select('*')
        .eq('company_id', companyId)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error(`❌ [${caller}] Database query failed:`, error);
        throw error;
      }

      console.log(`✅ [${caller}] Successfully fetched company status`);
      return { data, error: null };
    } catch (err) {
      console.error(`❌ [${caller}] getCompanyStatus failed:`, err);
      return { data: null, error: err };
    }
  }

  // Centralized integration status queries
  async getIntegrationStatus(userId: string, caller: string) {
    console.log(`🔍 [${caller}] Fetching integration status for user: ${userId}`);
    
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select(`
          id,
          status,
          updated_at,
          settings,
          integration_type,
          integration_name
        `)
        .eq('user_id', userId);

      if (error) {
        console.error(`❌ [${caller}] Database query failed:`, error);
        throw error;
      }

      console.log(`✅ [${caller}] Successfully fetched integration status`);
      return { data, error: null };
    } catch (err) {
      console.error(`❌ [${caller}] getIntegrationStatus failed:`, err);
      return { data: null, error: err };
    }
  }
}

// Export singleton instance
export const dbService = DatabaseService.getInstance();

// Test function to verify service client authentication
export const testServiceClientAuth = async () => {
  console.log('🧪 Testing service client authentication...');
  
  try {
    // Verify JWT token format and claims first
    console.log('🔍 Verifying JWT token format...');
    const serviceRoleKey = env.supabase.serviceRoleKey;
    
          try {
        const parts = serviceRoleKey.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('✅ JWT token format is valid');
          console.log('🔍 JWT claims:', {
            iss: payload.iss,
            sub: payload.sub,
            role: payload.role,
            exp: payload.exp,
            iat: payload.iat,
            aud: payload.aud,
          });
          
          // Check if token is expired
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            console.error('❌ JWT token is expired');
            return false;
          }
          
          // Check if role is service_role
          if (payload.role !== 'service_role') {
            console.error('❌ JWT token does not have service_role');
            return false;
          }
          
          // Check if this is a Supabase service role key
          if (payload.iss && payload.iss.includes('supabase.co')) {
            console.log('✅ This appears to be a valid Supabase service role key');
          } else {
            console.warn('⚠️ JWT issuer does not match Supabase pattern');
          }
          
          // Check if this is the correct type of service role key
          if (payload.role === 'service_role') {
            console.log('✅ Service role key has correct role claim');
          } else {
            console.error('❌ Service role key has incorrect role:', payload.role);
            return false;
          }
          
          console.log('✅ JWT token claims are valid');
        } else {
          console.error('❌ JWT token format is invalid');
          return false;
        }
      } catch (error) {
        console.error('❌ Could not decode JWT token:', error);
        return false;
      }
    
    // Test with service role key
    const serviceClient = createServiceClient();
    
    console.log('🔧 Service client created, testing authentication...');
    console.log('🔧 Service role key length:', serviceRoleKey.length);
    console.log('🔧 Service role key starts with:', serviceRoleKey.substring(0, 20) + '...');
    console.log('🔧 Service role key ends with:', '...' + serviceRoleKey.substring(-20));

    // Test with a simple query first
    console.log('🧪 Testing simple query...');
    const { data: simpleData, error: simpleError } = await serviceClient
      .from('ai_inbox_items')
      .select('id')
      .limit(1);
    
    if (simpleError) {
      console.error('❌ Simple query failed:', simpleError);
      console.error('❌ Error details:', {
        message: simpleError.message,
        details: simpleError.details,
        hint: simpleError.hint,
        code: simpleError.code
      });
      
      // Try to test the service role key directly
      console.log('🧪 Testing service role key directly...');
      const testClient = createClient<Database>(
        env.supabase.url,
        env.supabase.serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            storageKey: 'test-service-client',
            storage: {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
          },
          global: {
            headers: {
              'apikey': env.supabase.serviceRoleKey,
              'Content-Type': 'application/json',
            },
          },
        }
      );
      
      // Test with a simple query first
      const { data: testData, error: testError } = await testClient
        .from('ai_inbox_items')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Direct service client test failed:', testError);
        console.error('❌ Error details:', {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        });
        
        // Try a different approach - test with just the service role key
        console.log('🧪 Testing with minimal configuration...');
        const minimalClient = createClient<Database>(
          env.supabase.url,
          env.supabase.serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
              storageKey: 'minimal-service-client',
              storage: {
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {},
              },
            },
          }
        );
        
        const { data: minimalData, error: minimalError } = await minimalClient
          .from('ai_inbox_items')
          .select('id')
          .limit(1);
        
        if (minimalError) {
          console.error('❌ Minimal client test failed:', minimalError);
          return false;
        } else {
          console.log('✅ Minimal client test successful:', minimalData);
        }
        
        return false;
      } else {
        console.log('✅ Direct service client test successful:', testData);
      }
      
      return false;
    }
    
    console.log('✅ Simple query successful:', simpleData);
    
    // Test access to oauth_tokens
    console.log('🧪 Testing oauth_tokens access...');
    const { data: oauthData, error: oauthError } = await serviceClient
      .from('oauth_tokens')
      .select('count')
      .limit(1);
    
    if (oauthError) {
      console.error('❌ Service client oauth_tokens access failed:', oauthError);
      return false;
    }
    
    console.log('✅ Service client oauth_tokens access successful:', oauthData);
    
    // Test access to ai_inbox_items
    console.log('🧪 Testing ai_inbox_items access...');
    const { data: inboxData, error: inboxError } = await serviceClient
      .from('ai_inbox_items')
      .select('count')
      .limit(1);
    
    if (inboxError) {
      console.error('❌ Service client ai_inbox_items access failed:', inboxError);
      return false;
    }
    
    console.log('✅ Service client ai_inbox_items access successful:', inboxData);
    return true;
    
  } catch (error) {
    console.error('❌ Service client test error:', error);
    return false;
  }
};

// Comprehensive diagnostic function
export const diagnoseAuthIssues = async () => {
  console.log('🔍 Starting comprehensive authentication diagnosis...');
  
  const results = {
    serviceRoleKey: !!env.supabase.serviceRoleKey,
    anonKey: !!env.supabase.anonKey,
    supabaseUrl: !!env.supabase.url,
    serviceClientTest: false,
    regularClientTest: false,
    authSession: null,
    errors: [] as string[]
  };

  try {
    // Test service role key format
    console.log('🧪 Testing service role key format...');
    const serviceRoleKey = env.supabase.serviceRoleKey;
    if (serviceRoleKey && serviceRoleKey.startsWith('eyJ') && serviceRoleKey.includes('.')) {
      console.log('✅ Service role key format looks valid (JWT format)');
      
      // Try to decode the JWT to see what's in it
      try {
        const parts = serviceRoleKey.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('🔍 JWT payload:', {
            iss: payload.iss,
            sub: payload.sub,
            role: payload.role,
            exp: payload.exp,
            iat: payload.iat,
          });
        }
      } catch (error) {
        console.log('❌ Could not decode JWT payload:', error);
      }
    } else {
      console.log('❌ Service role key format looks invalid');
      results.errors.push('Service role key format is invalid');
    }
    
    // Test service client
    console.log('🧪 Testing service client...');
    results.serviceClientTest = await testServiceClientAuth();
    
    // Test regular client session
    console.log('🧪 Testing regular client session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    results.authSession = session;
    
    if (sessionError) {
      results.errors.push(`Session error: ${sessionError.message}`);
    }
    
    if (session) {
      console.log('✅ Regular client has session:', session.user.email);
      results.regularClientTest = true;
    } else {
      console.log('❌ Regular client has no session');
      results.errors.push('No active session found');
    }
    
    // Test direct database access
    console.log('🧪 Testing direct database access...');
    const { data: directTest, error: directError } = await supabase
      .from('ai_inbox_items')
      .select('count')
      .limit(1);
    
    if (directError) {
      results.errors.push(`Direct access error: ${directError.message}`);
      console.log('❌ Direct database access failed:', directError);
    } else {
      console.log('✅ Direct database access successful:', directTest);
    }
    
  } catch (error) {
    results.errors.push(`Diagnosis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('❌ Diagnosis failed:', error);
  }
  
  console.log('📊 Diagnosis Results:', results);
  return results;
};

// Create a robust service client with proper authentication
export const createServiceClient = () => {
  const serviceRoleKey = env.supabase.serviceRoleKey;
  
  console.log('🔧 Creating service client with key length:', serviceRoleKey.length);
  console.log('🔧 Service role key starts with:', serviceRoleKey.substring(0, 20) + '...');
  
  // Create a service client that properly handles JWT authentication
  // Following Supabase documentation on service role keys
  const client = createClient<Database>(
    env.supabase.url, 
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: 'create-service-client',
        storage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
      },
      global: {
        headers: {
          'X-Client-Info': 'nexus-service-client',
          'Content-Type': 'application/json',
          // Service role key should be passed as apikey header
          'apikey': serviceRoleKey,
        },
      },
    }
  );

  // The key difference: Supabase client automatically handles the JWT
  // when you pass the service role key as the second parameter
  console.log('🔧 Service client created with service role key');
  
  // Add request debugging for service client
  if (import.meta.env.DEV) {
    const originalFrom = client.from;
    client.from = function(table) {
      const builder = originalFrom.call(this, table);
      
      const originalSelect = builder.select;
      builder.select = function(...args) {
        console.log(`🔧 Service client request: SELECT from ${table}`);
        console.log(`🔧 Service client using service role key: ${serviceRoleKey.substring(0, 20)}...`);
        return originalSelect.apply(this, args);
      };
      
      return builder;
    };
  }

  return client;
};



// Function to clear all client instances (for testing)
export const clearAllClientInstances = () => {
  logger.info('Clearing all Supabase client instances...');
  supabaseInstance = null;
  serviceClientInstance = null;
  logger.success('All client instances cleared');
};

// Function to debug client instances
export const debugClientInstances = () => {
  logger.debug('Supabase Client Instances Debug:');
  logger.debug('- Main client instance:', !!supabaseInstance);
  logger.debug('- Service client instance:', !!serviceClientInstance);
  logger.debug('- Total instances:', [supabaseInstance, serviceClientInstance].filter(Boolean).length);
  
  // Check for potential GoTrueClient conflicts
  const totalInstances = [supabaseInstance, serviceClientInstance].filter(Boolean).length;
  if (totalInstances > 2) {
    logger.warning('Multiple GoTrueClient instances detected! This may cause auth conflicts.');
    logger.warning('Ensure you\'re using the singleton pattern for all Supabase clients.');
  } else {
    logger.success('Client instances look good - no conflicts detected');
  }
};



// Test and fix current session state
export const testAndFixSession = async () => {
  console.log('🧪 Testing and fixing session state...');
  
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error);
      return { success: false, error };
    }
    
    if (!session) {
      console.log('❌ No session found');
      return { success: false, error: new Error('No session found') };
    }
    
    console.log('📊 Current session info:');
    console.log('- User:', session.user.email);
    console.log('- Expires at:', session.expires_at);
    console.log('- Current time:', Date.now());
    console.log('- Session valid:', sessionUtils.isSessionValid(session));
    
    // Check if session is expired
    if (!sessionUtils.isSessionValid(session)) {
      console.log('⚠️ Session is expired, attempting refresh...');
      const refreshResult = await sessionUtils.forceRefreshSession();
      return refreshResult;
    }
    
    console.log('✅ Session is valid');
    return { success: true, session };
    
  } catch (error) {
    console.error('❌ Session test failed:', error);
    return { success: false, error };
  }
};

// Simple JWT transmission test
export const diagnoseJWTTransmission = async () => {
  console.log('🔍 Testing JWT token transmission...');
  
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { error: 'No valid session found' };
    }

    // Test a simple query
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    return {
      session: {
        hasSession: !!session,
        userId: session.user.id,
        email: session.user.email
      },
      query: {
        success: !error,
        error: error?.message
      }
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test authentication flow and JWT token transmission
export const testAuthenticationFlow = async () => {
  console.log('🔍 Testing authentication flow...');
  
  try {
    // 1. Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ No valid session found');
      return { error: 'No valid session found' };
    }

    console.log('✅ Session found:', {
      userId: session.user.id,
      email: session.user.email,
      hasAccessToken: !!session.access_token,
      tokenLength: session.access_token?.length
    });

    // 2. Test direct query with user context
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('id', session.user.id)
      .single();

    console.log('📊 User profile query result:', {
      success: !userError,
      data: userData,
      error: userError?.message
    });

    // 3. Test ai_inbox_items query
    const { data: inboxData, error: inboxError } = await supabase
      .from('ai_inbox_items')
      .select('id, subject, sender_email')
      .limit(5);

    console.log('📊 Inbox items query result:', {
      success: !inboxError,
      dataCount: inboxData?.length || 0,
      error: inboxError?.message
    });

    // 4. Test oauth_tokens query
    const { data: oauthData, error: oauthError } = await supabase
      .from('oauth_tokens')
      .select('integration_slug, expires_at')
      .eq('user_id', session.user.id);

    console.log('📊 OAuth tokens query result:', {
      success: !oauthError,
      dataCount: oauthData?.length || 0,
      error: oauthError?.message
    });

    return {
      session: {
        userId: session.user.id,
        email: session.user.email
      },
      queries: {
        userProfile: { success: !userError, error: userError?.message },
        inboxItems: { success: !inboxError, error: inboxError?.message },
        oauthTokens: { success: !oauthError, error: oauthError?.message }
      }
    };

  } catch (error) {
    console.error('❌ Authentication flow test failed:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};



// Simple authentication helper
export const ensureAuthenticated = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('No valid session available');
  }
  return session;
};