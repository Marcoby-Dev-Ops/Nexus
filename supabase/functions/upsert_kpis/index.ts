import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

type IncomingRow = {
  department_id: string;
  kpi_id?: string | null;
  value: unknown;
  source?: string | null;
  captured_at?: string | null; // ISO string so the worker can backfill
};

interface RequestBody {
  snapshots: IncomingRow[];
}

function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase env vars');
  return createClient(supabaseUrl, supabaseServiceKey);
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Bearer token' }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const jwt = authHeader.replace('Bearer ', '');
    const claims = JSON.parse(atob(jwt.split('.')[1]));
    const orgId = claims.org_id as string | undefined;
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'org_id claim missing' }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { snapshots } = (await req.json()) as RequestBody;
    if (!Array.isArray(snapshots) || snapshots.length === 0) {
      return new Response(JSON.stringify({ error: 'snapshots array required' }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Prepare rows with org_id
    const rows = snapshots.map((s) => ({
      org_id: orgId,
      department_id: s.department_id,
      kpi_id: s.kpi_id ?? null,
      value: s.value,
      source: s.source ?? null,
      captured_at: s.captured_at ?? null,
    }));

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('ai_kpi_snapshots').insert(rows);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, inserted: rows.length }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('[upsert_kpis] error', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Unknown error' }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 