// Legacy compatibility shim: export a `supabase` alias so components that still
// import a supabase-style client continue to work. This shim is backed by the
// app's `database` wrapper (which forwards calls to the server API) and is
// intentionally a small compatibility layer while the codebase migrates away
// from direct Supabase usage.
// Lightweight adapter to provide a supabase-like API backed by our `database` wrapper
import { database } from '@/lib/database';

// Export the new API client functions
export const supabase = database as any;

export default supabase;
