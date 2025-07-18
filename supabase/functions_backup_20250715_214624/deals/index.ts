import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
import { corsHeadersWithOrigin as corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function auditLog(action: string, userId: string, companyId: string, details: unknown) {
  await sb.from('security_audit_log').insert({
    action,
    user_id: userId,
    company_id: companyId,
    details,
    created_at: new Date().toISOString(),
  });
}

async function emitRealtimeEvent(eventType: string, entity: string, entityId: string, companyId: string, payload: unknown) {
  await sb.from('realtime_events').insert({
    event_type: eventType,
    entity,
    entity_id: entityId,
    company_id: companyId,
    payload,
    created_at: new Date().toISOString(),
  });
}

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin), status: 200 });
  }

  try {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
    const { user, error: authErr } = await sb.auth.getUser(jwt);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
    // Get company id
    const { data: profile } = await sb
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();
    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: 'No company' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }
    const companyId = profile.company_id;
    // Route by method
    if (req.method === 'GET') {
      // List deals for company
      const { data, error } = await sb
        .from('deals')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ deals: data }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    if (req.method === 'POST') {
      // Create deal
      const body = await req.json();
      const insert = {
        ...body,
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await sb.from('deals').insert(insert).select('*').single();
      if (error) throw error;
      await auditLog('deal_create', user.id, companyId, { deal: data });
      await emitRealtimeEvent('created', 'deal', data.id, companyId, data);
      return new Response(JSON.stringify({ deal: data }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 201,
      });
    }
    if (req.method === 'PATCH') {
      // Update deal
      const body = await req.json();
      if (!body.id) {
        return new Response(JSON.stringify({ error: 'Missing deal id' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }
      const update = {
        ...body,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await sb
        .from('deals')
        .update(update)
        .eq('id', body.id)
        .eq('company_id', companyId)
        .select('*')
        .single();
      if (error) throw error;
      await auditLog('deal_update', user.id, companyId, { deal: data });
      await emitRealtimeEvent('updated', 'deal', data.id, companyId, data);
      return new Response(JSON.stringify({ deal: data }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    if (req.method === 'DELETE') {
      // Delete deal
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing deal id' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }
      const { data, error } = await sb
        .from('deals')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId)
        .select('*')
        .single();
      if (error) throw error;
      await auditLog('deal_delete', user.id, companyId, { deal: data });
      await emitRealtimeEvent('deleted', 'deal', data.id, companyId, data);
      return new Response(JSON.stringify({ deal: data }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errMsg }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
