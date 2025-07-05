import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeadersWithOrigin as corsHeaders } from '../_shared/cors.ts';

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
  console.log('[upsert_kpis] Request received:', { method: req.method, origin });
  
  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    console.log('[upsert_kpis] Handling CORS preflight');
    return new Response('ok', { 
      headers: corsHeaders(origin),
      status: 200 
    });
  }

  try {
    const authHeader = req.headers.get('authorization');
    console.log('[upsert_kpis] Auth header present:', !!authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[upsert_kpis] Missing or invalid Bearer token');
      return new Response(JSON.stringify({ error: 'Missing Bearer token' }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    let orgId: string | undefined;
    let userId: string | undefined;

    try {
      const claims = JSON.parse(atob(jwt.split('.')[1]));
      orgId = claims.org_id as string | undefined;
      userId = claims.sub as string | undefined;
      console.log('[upsert_kpis] JWT claims:', { orgId: !!orgId, userId: !!userId });
    } catch (jwtError) {
      console.error('[upsert_kpis] JWT parsing error:', jwtError);
      return new Response(JSON.stringify({ error: 'Invalid JWT token' }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // If no org_id in JWT, try to get company_id from user profile
    if (!orgId && userId) {
      console.log('[upsert_kpis] No org_id in JWT, fetching from user profile');
      const supabase = getSupabaseAdmin();
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', userId)
        .single();
      
      if (profile?.company_id) {
        orgId = profile.company_id;
        console.log('[upsert_kpis] Found company_id from profile:', !!orgId);
      } else {
        console.log('[upsert_kpis] No company_id found in profile:', profileError);
      }
    }

    if (!orgId) {
      console.log('[upsert_kpis] No org_id available');
      return new Response(JSON.stringify({ error: 'org_id claim missing and no company_id found' }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { snapshots } = (await req.json()) as RequestBody;
    console.log('[upsert_kpis] Snapshots received:', snapshots?.length || 0);
    
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

    console.log('[upsert_kpis] Inserting rows:', rows.length);
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('ai_kpi_snapshots').insert(rows);
    if (error) {
      console.error('[upsert_kpis] Database insert error:', error);
      throw error;
    }

    console.log('[upsert_kpis] Success, inserted:', rows.length);
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