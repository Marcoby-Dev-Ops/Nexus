import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/core/types/supabase';

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