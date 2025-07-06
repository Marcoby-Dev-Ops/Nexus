import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { env } from './environment';

export const supabase = createClient<Database>(env.supabase.url, env.supabase.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
