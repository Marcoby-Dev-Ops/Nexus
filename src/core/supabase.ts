import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/core/types/supabase';
import { env } from '@/core/environment';
import { logger } from '@/shared/utils/logger';

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

// Development-only: Create a mock session for development
// if (import.meta.env.DEV) {
//   // Mock session for development
//   const mockSession = {
//     access_token: 'dev-mock-token',
//     refresh_token: 'dev-mock-refresh-token',
//     expires_in: 3600,
//     expires_at: Math.floor(Date.now() / 1000) + 3600,
//     token_type: 'bearer',
//     user: {
//       id: '5745f213-bac2-4bc4-b35a-15bd7fbdb27f',
//       email: 'vonj@marcoby.com',
//       created_at: '2025-07-19T21:57:12.672576Z',
//       updated_at: '2025-07-19T21:57:12.672576Z',
//       aud: 'authenticated',
//       role: 'authenticated',
//       email_confirmed_at: '2025-07-19T21:57:12.672576Z',
//       phone_confirmed_at: null,
//       last_sign_in_at: '2025-07-19T21:57:12.672576Z',
//       app_metadata: {},
//       user_metadata: {},
//       identities: [],
//       factors: []
//     }
//   };

//   // Override the auth methods for development
//   supabase.auth.getSession = async () => {
//     console.log('🔧 DEV: Using mock session');
//     return { data: { session: mockSession as any }, error: null };
//   };

//   supabase.auth.getUser = async () => {
//     console.log('🔧 DEV: Using mock user');
//     return { data: { user: mockSession.user as any }, error: null };
//   };

//   // Mock auth state change listener
//   supabase.auth.onAuthStateChange = (callback) => {
//     console.log('🔧 DEV: Mock auth state change listener set up');
//     // Trigger the callback with the mock session
//     setTimeout(() => {
//       callback('INITIAL_SESSION', mockSession as any);
//     }, 100);
//     return { data: { subscription: { unsubscribe: () => {} } } };
//   };

//   console.log('🔧 DEV: Authentication bypass enabled for development');
// }



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
            // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Valid session found: ', session.user.email);
            return { session, error: null };
          } else {
            // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('⚠️ Session expired, attempting refresh...');
            // Try to refresh the session
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshData.session && !refreshError) {
              // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Session refreshed successfully');
              return { session: refreshData.session, error: null };
            } else {
              // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn('❌ Session refresh failed:', refreshError);
              return { session: null, error: refreshError || new Error('Session expired and refresh failed') };
            }
          }
        }
        if (error) {
          // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn(`Session fetch attempt ${i + 1} failed: `, error);
        }
        // Wait before retry
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn(`Session fetch attempt ${i + 1} threw error: `, err);
      }
    }
    return { session: null, error: new Error('Failed to get valid session after retries') };
  },

  // Ensure session is available before making requests
  ensureSession: async () => {
    const { session, error } = await sessionUtils.getSession();
    if (error || !session) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔄 Forcing session refresh...');
      const { data, error } = await supabase.auth.refreshSession();
      if (data.session && !error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Session refresh successful');
        return { success: true, session: data.session };
      } else {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Session refresh failed:', error);
        return { success: false, error };
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Session refresh error: ', error);
      return { success: false, error };
    }
  },

  // Force refresh session and clear cache
  forceRefreshSession: async () => {
    try {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Force refresh session error: ', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  // Handle expired session with comprehensive flow
  handleExpiredSession: async () => {
    try {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔄 Handling expired session...');
      const refreshResult = await sessionUtils.refreshSession();
      if (refreshResult.success) return refreshResult;
      
      const forceRefreshResult = await sessionUtils.forceRefreshSession();
      if (forceRefreshResult.success) return forceRefreshResult;
      
      // If all fails, sign out and redirect
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('❌ Session completely expired, redirecting to login...');
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return { success: false, error: new Error('Session expired, please log in again') };
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Handle expired session error: ', error);
      return { success: false, error };
    }
  },

  // Check if session is valid with buffer
  isSessionValid: (session: any) => {
    if (!session) return false;
    
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔍 Session validation check: ', {
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
    
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔍 Session validation result: ', {
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
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🧪 Testing JWT token transmission...');
      
      // Get current session
      const { session, error } = await sessionUtils.getSession();
      if (error || !session) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ No valid session available');
        return { success: false, error: 'No valid session' };
      }

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Session found:', {
        userId: session.user.id,
        email: session.user.email,
        hasAccessToken: !!session.access_token,
        tokenLength: session.access_token?.length,
      });

      // Test if the session is properly set in the client
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession || currentSession.access_token !== session.access_token) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ JWT transmission test failed: ', testError);
        return { success: false, error: testError };
      }

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ JWT transmission test successful:', testData);
      return { success: true, data: testData };
          } catch (err) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ JWT transmission test error: ', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
  },
};

// Enhanced database utilities with session validation
export const dbUtils = {
  // Debug session state
  debugSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔍 Session debug: ', {
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
    try {
      const { session, error } = await supabase.auth.getSession();
      if (error) {
        logger.warn('Session error:', error.message);
        return false;
      }
      
      if (!session) {
        logger.warn('No session available');
        return false;
      }
      
      logger.info('Session validated:', {
        userId: session.user.id,
        hasToken: !!session.access_token,
        expiresAt: session.expires_at
      });
      
      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        logger.warn('Session expired, attempting refresh');
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !newSession) {
          logger.warn('Session refresh failed:', refreshError);
          return false;
        }
        logger.info('Session refreshed successfully');
        return true;
      }
      
      return true;
    } catch (error) {
      logger.warn('Session validation error:', error);
      return false;
    }
  },

  // Ensure session is properly set in the client before database operations
  ensureSessionSet: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        logger.warn('Failed to get session:', error.message);
        return false;
      }
      
      if (!session) {
        logger.warn('No session available');
        return false;
      }
      
      // Ensure the session is properly set in the client
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession || currentSession.access_token !== session.access_token) {
        logger.info('Setting session in client...');
        const { error: setError } = await supabase.auth.setSession(session);
        if (setError) {
          logger.warn('Failed to set session:', setError.message);
          return false;
        }
        logger.info('Session set successfully');
      }
      
      return true;
    } catch (error) {
      logger.warn('Session setup error:', error);
      return false;
    }
  },

  // Safe database operations with session validation
  safeQuery: async <T>(queryFn: () => Promise<{ data: T | null; error: any }>) => {
    try {
      const sessionValid = await dbUtils.ensureValidSession();
      if (!sessionValid) {
        return { data: null, error: { message: 'Session validation failed' } };
      }
      
      const sessionSet = await dbUtils.ensureSessionSet();
      if (!sessionSet) {
        return { data: null, error: { message: 'Session setup failed' } };
      }
      
      return queryFn();
    } catch (error) {
      logger.warn('Safe query error:', error);
      return { data: null, error: { message: 'Database operation failed' } };
    }
  },

  // Secure user-specific queries with validation
  userQuery: async <T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    userId: string,
    context: string = 'unknown'
  ): Promise<{ data: T | null; error: any }> => {
    try {
      // Verify user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        logger.warn(`Authentication error in ${context}:`, userError.message);
        return { data: null, error: { message: 'Authentication required' } };
      }
      
      if (!user || user.id !== userId) {
        logger.warn(`Unauthorized access attempt in ${context} for user ${userId}`);
        return { data: null, error: { message: 'Unauthorized access' } };
      }
      
      // Only try to ensure session if user is authenticated
      try {
        await dbUtils.ensureSessionSet();
      } catch (sessionError) {
        logger.warn(`Session error in ${context}:`, sessionError);
        return { data: null, error: { message: 'Session validation failed' } };
      }
      
      return dbUtils.safeQuery(queryFn);
    } catch (error) {
      logger.warn(`Database query error in ${context}:`, error);
      return { data: null, error: { message: 'Database operation failed' } };
    }
  },

  // Secure company-specific queries with validation
  companyQuery: async <T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    companyId: string,
    context: string = 'unknown'
  ): Promise<{ data: T | null; error: any }> => {
    // Verify user belongs to company
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.warn(`Unauthenticated access attempt in ${context}`);
      return { data: null, error: { message: 'Authentication required' } };
    }
    
    // Check if user belongs to company
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();
    
    if (!profile || profile.company_id !== companyId) {
      logger.warn(`Unauthorized company access attempt in ${context} for user ${user.id}`);
      return { data: null, error: { message: 'Unauthorized company access' } };
    }
    
    return dbUtils.safeQuery(queryFn);
  },

  // Secure insert with validation
  secureInsert: async <T>(
    table: string,
    data: any,
    userId: string,
    context: string = 'unknown'
  ): Promise<{ data: T | null; error: any }> => {
    // Ensure user_id is set for user-specific tables
    const userSpecificTables = [
      'tasks', 'ai_inbox_items', 'ai_insights', 'thoughts', 
      'action_cards', 'user_integrations', 'chat_conversations',
      'ai_conversations', 'n8n_configurations', 'user_activity', 'recent'
    ];
    
    if (userSpecificTables.includes(table)) {
      data.user_id = userId;
    }
    
    return dbUtils.userQuery(
      () => supabase.from(table).insert(data).select().single(),
      userId,
      context
    );
  },

  // Secure update with validation
  secureUpdate: async <T>(
    table: string,
    data: any,
    recordId: string,
    userId: string,
    context: string = 'unknown'
  ): Promise<{ data: T | null; error: any }> => {
    return dbUtils.userQuery(
      () => supabase.from(table).update(data).eq('id', recordId).select().single(),
      userId,
      context
    );
  },

  // Secure delete with validation
  secureDelete: async (
    table: string,
    recordId: string,
    userId: string,
    context: string = 'unknown'
  ): Promise<{ error: any }> => {
    const result = await dbUtils.userQuery(
      () => supabase.from(table).delete().eq('id', recordId),
      userId,
      context
    );
    
    return { error: result.error };
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
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn('⚠️ [AuthContext.fetchData] No session available, but continuing with query...');
        // Return empty data instead of making the query without session
        return { data: [], error: null };
      }

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`❌ [AuthContext.fetchData] Error fetching ${query}:`, error);
        return { data: null, error };
      }

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`✅ [AuthContext.fetchData] Successfully fetched ${data?.length || 0} ${query}`);
      return { data, error: null };

    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`🔍 Database request: SELECT from ${table}`);
      return originalSelect.apply(this, args);
    };
    
    return builder;
  };
}

// Error handling utility
export const handleSupabaseError = (error: any, context: string) => {
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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
        agentid: agentId,
        metadata,
        createdat: new Date().toISOString()
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
        conversationid: conversationId,
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        createdat: new Date().toISOString()
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
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`🔍 [${caller}] Fetching user integrations for user: ${userId}`);
    
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`❌ [${caller}] Database query failed: `, error);
        throw error;
      }

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`✅ [${caller}] Successfully fetched ${data?.length || 0} integrations`);
      return { data, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`❌ [${caller}] getUserIntegrations failed: `, err);
      return { data: null, error: err };
    }
  }

  // Centralized user profile queries
  async getUserProfile(userId: string, caller: string) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`🔍 [${caller}] Fetching user profile for user: ${userId}`);
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`❌ [${caller}] Database query failed: `, error);
        throw error;
      }

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`✅ [${caller}] Successfully fetched user profile`);
      return { data, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`❌ [${caller}] getUserProfile failed: `, err);
      return { data: null, error: err };
    }
  }

  // Centralized company status queries
  async getCompanyStatus(companyId: string, caller: string) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`❌ [${caller}] Database query failed: `, error);
        throw error;
      }

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`✅ [${caller}] Successfully fetched company status`);
      return { data, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`❌ [${caller}] getCompanyStatus failed: `, err);
      return { data: null, error: err };
    }
  }

  // Centralized integration status queries
  async getIntegrationStatus(userId: string, caller: string) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`❌ [${caller}] Database query failed: `, error);
        throw error;
      }

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`✅ [${caller}] Successfully fetched integration status`);
      return { data, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`❌ [${caller}] getIntegrationStatus failed: `, err);
      return { data: null, error: err };
    }
  }
}

// Export singleton instance
export const dbService = DatabaseService.getInstance();

// Export supabaseService alias for backward compatibility
export const supabaseService = supabase;

// Export smartClient alias for backward compatibility
export const smartClient = supabase;



// Comprehensive diagnostic function
export const diagnoseAuthIssues = async () => {
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔍 Starting comprehensive authentication diagnosis...');
  
  const results = {
    serviceRoleKey: !!env.supabase.serviceRoleKey,
    anonKey: !!env.supabase.anonKey,
    supabaseUrl: !!env.supabase.url,
    regularClientTest: false,
    authSession: null,
    errors: [] as string[]
  };

  try {
    // Test service role key format
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🧪 Testing service role key format...');
    const serviceRoleKey = env.supabase.serviceRoleKey;
    if (serviceRoleKey && serviceRoleKey.startsWith('eyJ') && serviceRoleKey.includes('.')) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Service role key format looks valid (JWT format)');
      
      // Try to decode the JWT to see what's in it
      try {
        const parts = serviceRoleKey.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔍 JWT payload: ', {
            iss: payload.iss,
            sub: payload.sub,
            role: payload.role,
            exp: payload.exp,
            iat: payload.iat,
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('❌ Could not decode JWT payload: ', error);
      }
    } else {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('❌ Service role key format looks invalid');
      results.errors.push('Service role key format is invalid');
    }
    

    
    // Test regular client session
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🧪 Testing regular client session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    results.authSession = session;
    
    if (sessionError) {
      results.errors.push(`Session error: ${sessionError.message}`);
    }
    
    if (session) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Regular client has session: ', session.user.email);
      results.regularClientTest = true;
    } else {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('❌ Regular client has no session');
      results.errors.push('No active session found');
    }
    
    // Test direct database access
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🧪 Testing direct database access...');
    const { data: directTest, error: directError } = await supabase
      .from('ai_inbox_items')
      .select('count')
      .limit(1);
    
    if (directError) {
      results.errors.push(`Direct access error: ${directError.message}`);
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('❌ Direct database access failed: ', directError);
    } else {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Direct database access successful: ', directTest);
    }
    
  } catch (error) {
    results.errors.push(`Diagnosis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Diagnosis failed: ', error);
  }
  
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('📊 Diagnosis Results: ', results);
  return results;
};





// Function to clear all client instances (for testing)
export const clearAllClientInstances = () => {
  logger.info('Clearing all Supabase client instances...');
  supabaseInstance = null;
  logger.success('All client instances cleared');
};

// Function to debug client instances
export const debugClientInstances = () => {
  logger.debug('Supabase Client Instances Debug: ');
  logger.debug('- Main client instance: ', !!supabase);
  logger.debug('- Total instances: ', [supabase].filter(Boolean).length);
  
  // Check for potential GoTrueClient conflicts
  const totalInstances = [supabase].filter(Boolean).length;
  if (totalInstances > 1) {
    logger.warning('Multiple GoTrueClient instances detected! This may cause auth conflicts.');
    logger.warning('Ensure you\'re using the singleton pattern for all Supabase clients.');
  } else {
    logger.success('Client instances look good - no conflicts detected');
  }
};



// Test and fix current session state
export const testAndFixSession = async () => {
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🧪 Testing and fixing session state...');
  
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Error getting session: ', error);
      return { success: false, error };
    }
    
    if (!session) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('❌ No session found');
      return { success: false, error: new Error('No session found') };
    }
    
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('📊 Current session info: ');
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('- User: ', session.user.email);
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('- Expires at: ', session.expires_at);
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('- Current time: ', Date.now());
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('- Session valid: ', sessionUtils.isSessionValid(session));
    
    // Check if session is expired
    if (!sessionUtils.isSessionValid(session)) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('⚠️ Session is expired, attempting refresh...');
      const refreshResult = await sessionUtils.forceRefreshSession();
      return refreshResult;
    }
    
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Session is valid');
    return { success: true, session };
    
  } catch (error) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Session test failed: ', error);
    return { success: false, error };
  }
};

// Simple JWT transmission test
export const diagnoseJWTTransmission = async () => {
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔍 Testing authentication flow...');
  
  try {
    // 1. Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ No valid session found');
      return { error: 'No valid session found' };
    }

    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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

    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('📊 User profile query result: ', {
      success: !userError,
      data: userData,
      error: userError?.message
    });

    // 3. Test data_point_definitions query
    const { data: dataPointData, error: dataPointError } = await supabase
      .from('data_point_definitions')
      .select('id, data_point_name')
      .limit(5);

    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('📊 Data point definitions query result: ', {
      success: !dataPointError,
      dataCount: dataPointData?.length || 0,
      error: dataPointError?.message
    });

    return {
      success: true,
      session: {
        userId: session.user.id,
        email: session.user.email,
        hasAccessToken: !!session.access_token
      },
      userProfile: userData,
      dataPoints: dataPointData
    };

  } catch (error) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Authentication test failed: ', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test authentication context in database
export const testDatabaseAuth = async () => {
  console.log('🧪 Testing database authentication context...');
  
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.error('❌ No valid session found');
      return { success: false, error: 'No valid session found' };
    }

    console.log('✅ Session found:', {
      userId: session.user.id,
      email: session.user.email,
      hasAccessToken: !!session.access_token,
      tokenLength: session.access_token?.length
    });

    // Test a simple query to see if JWT is being sent
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('id', session.user.id)
      .single();

    if (testError) {
      console.error('❌ JWT transmission test failed: ', testError);
      return { success: false, error: testError.message };
    }

    console.log('✅ JWT transmission test successful:', testData);
    return { success: true, data: testData };
  } catch (error) {
    console.error('❌ Database auth test failed: ', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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

// Simple authentication test for browser console
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
        .select('id, email')
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