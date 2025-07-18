import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/core/types/database.types';
import { env } from '@/core/environment';

// Enhanced Supabase client configuration
export const supabase = createClient<Database>(env.supabase.url, env.supabase.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
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

// Development helpers
if (import.meta.env.DEV) {
  // Log Supabase events in development
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state changed:', event, session?.user?.email);
  });
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

// Database utilities
export const dbUtils = {
  // Safe insert with error handling
  safeInsert: async (table: string, data: any) => {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) {
      const handledError = handleSupabaseError(error, `insert_${table}`);
      throw new Error(handledError.error);
    }
    
    return result;
  },

  // Safe update with error handling
  safeUpdate: async (table: string, id: string, data: any) => {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      const handledError = handleSupabaseError(error, `update_${table}`);
      throw new Error(handledError.error);
    }
    
    return result;
  },

  // Safe delete with error handling
  safeDelete: async (table: string, id: string) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      const handledError = handleSupabaseError(error, `delete_${table}`);
      throw new Error(handledError.error);
    }
  },
};
