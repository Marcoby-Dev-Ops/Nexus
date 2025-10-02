// Legacy compatibility shim: export a `supabase` alias so components that still
// import a supabase-style client continue to work. This shim is backed by the
// app's `database` wrapper (which forwards calls to the server API) and is
// intentionally a small compatibility layer while the codebase migrates away
// from direct Supabase usage.
import { database } from '@/lib/database';

// Export a `supabase` alias that mirrors the minimal API used by legacy components.
export const supabase = database;

export default supabase;
