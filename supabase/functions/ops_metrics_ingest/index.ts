import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Local copy so we avoid cross-directory import issues during bundling
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Datapoint {
  kpi_key: string;
  value: unknown;
  recorded_at?: string | null;
  source?: string | null;
}

interface RequestBody {
  datapoints: Datapoint[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase env vars');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------
serve(async (req) => {
  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ---------------------------------------------------------------------
    // Auth – JWT must include `org_id` claim so we can multi-tenant safely
    // ---------------------------------------------------------------------
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing Bearer token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 },
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const [, payloadB64] = jwt.split('.');
    const claims = JSON.parse(atob(payloadB64));
    const orgId = claims.org_id as string | undefined;

    if (!orgId) {
      return new Response(
        JSON.stringify({ error: 'org_id claim missing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      );
    }

    // ---------------------------------------------------------------------
    // Parse body
    // ---------------------------------------------------------------------
    const { datapoints } = (await req.json()) as RequestBody;

    if (!Array.isArray(datapoints) || datapoints.length === 0) {
      return new Response(
        JSON.stringify({ error: 'datapoints array required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      );
    }

    // ---------------------------------------------------------------------
    // Transform → insert
    // ---------------------------------------------------------------------
    const rows = datapoints.map((d) => ({
      org_id: orgId,
      department_id: 'operations',
      kpi_key: d.kpi_key,
      kpi_id: null,
      value: d.value,
      source: d.source ?? 'ops_metrics_ingest',
      captured_at: d.recorded_at ?? null,
    }));

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('ai_kpi_snapshots').insert(rows);
    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, inserted: rows.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (err: unknown) {
    console.error('[ops_metrics_ingest] error', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
}); 