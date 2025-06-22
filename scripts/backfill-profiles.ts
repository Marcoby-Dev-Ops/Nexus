/**
 * backfill-profiles.ts
 *
 * One-time utility to sync existing auth.users into public.profiles using the
 * `sync_user_profile` Edge Function.
 *
 * Usage (with env):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node scripts/backfill-profiles.ts
 */

import { createClient } from '@supabase/supabase-js';

// ---- Config ---------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars are required');
  process.exit(1);
}

// Derive functions URL – replace `.supabase.co` with `.functions.supabase.co`
const FUNCTIONS_URL = SUPABASE_URL.replace('.supabase.co', '.functions.supabase.co');
const EDGE_ENDPOINT = `${FUNCTIONS_URL}/sync_user_profile`;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function backfill() {
  console.log('🔄  Fetching users…');
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error || !data) {
    console.error('Failed to list users:', error?.message);
    process.exit(1);
  }
  const { users } = data;
  console.log(`📋  ${users.length} users found. Starting sync…`);

  let successCount = 0;
  let errorCount = 0;

  // Sequential to avoid overwhelming the Edge Runtime; can be parallelised if needed.
  for (const user of users) {
    try {
      const res = await fetch(EDGE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!res.ok) throw new Error(await res.text());
      successCount += 1;
      console.log(`✅  Synced ${user.email}`);
    } catch (err) {
      errorCount += 1;
      console.error(`❌  ${user.email}:`, (err as Error).message);
    }
  }

  console.log(`— Done —  Success: ${successCount}, Failed: ${errorCount}`);
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
}); 