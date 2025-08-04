import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
import { corsHeadersWithOrigin as corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// Use same audit logging pattern as DealService
async function auditLog(action: string, userId: string, companyId: string, details: unknown) {
  await sb.from('audit_logs').insert({
    userid: userId,
    action,
    resourcetype: 'deal',
    details,
    severity: 'info',
    timestamp: new Date().toISOString(),
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
      // Create deal using DealService patterns
      const body = await req.json();
      
      // Use same validation as DealService
      if (!body.title || !body.value) {
        return new Response(JSON.stringify({ error: 'Deal title and value are required' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      if (body.value <= 0) {
        return new Response(JSON.stringify({ error: 'Deal value must be positive' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Verify contact exists if contact_id provided (same logic as DealService)
      if (body.contact_id) {
        const { data: contact } = await sb
          .from('contacts')
          .select('id')
          .eq('id', body.contact_id)
          .eq('user_id', user.id)
          .single();

        if (!contact) {
          return new Response(JSON.stringify({ error: 'Associated contact not found or access denied' }), {
            status: 400,
            headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
          });
        }
      }

      const insert = {
        ...body,
        user_id: user.id,
        company_id: companyId,
        stage: body.stage || 'prospect', // Default stage like DealService
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await sb.from('deals').insert(insert).select('*').single();
      if (error) throw error;
      
      // Use same audit logging pattern as DealService
      await auditLog('create', user.id, companyId, { 
        deal_title: body.title, 
        deal_value: body.value,
        deal_stage: body.stage || 'prospect',
        deal_id: data.id
      });
      await emitRealtimeEvent('created', 'deal', data.id, companyId, data);
      return new Response(JSON.stringify({ deal: data }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 201,
      });
    }
    if (req.method === 'PATCH') {
      // Update deal using DealService patterns
      const body = await req.json();
      if (!body.id) {
        return new Response(JSON.stringify({ error: 'Missing deal id' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Verify ownership (same logic as DealService)
      const { data: existingDeal } = await sb
        .from('deals')
        .select('id, user_id, title, value, stage')
        .eq('id', body.id)
        .eq('user_id', user.id)
        .single();

      if (!existingDeal) {
        return new Response(JSON.stringify({ error: 'Deal not found or access denied' }), {
          status: 404,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Validate value if being updated (same logic as DealService)
      if (body.value !== undefined && body.value <= 0) {
        return new Response(JSON.stringify({ error: 'Deal value must be positive' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Verify contact exists if contact_id being updated (same logic as DealService)
      if (body.contact_id) {
        const { data: contact } = await sb
          .from('contacts')
          .select('id')
          .eq('id', body.contact_id)
          .eq('user_id', user.id)
          .single();

        if (!contact) {
          return new Response(JSON.stringify({ error: 'Associated contact not found or access denied' }), {
            status: 400,
            headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
          });
        }
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
      
      // Use same audit logging pattern as DealService
      await auditLog('update', user.id, companyId, { 
        updates: body,
        previous_value: existingDeal.value,
        previous_stage: existingDeal.stage,
        deal_id: data.id
      });
      await emitRealtimeEvent('updated', 'deal', data.id, companyId, data);
      return new Response(JSON.stringify({ deal: data }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    if (req.method === 'DELETE') {
      // Delete deal using DealService patterns
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing deal id' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Verify ownership and get deal data for audit (same logic as DealService)
      const { data: existingDeal } = await sb
        .from('deals')
        .select('id, user_id, title, value')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!existingDeal) {
        return new Response(JSON.stringify({ error: 'Deal not found or access denied' }), {
          status: 404,
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
      
      // Use same audit logging pattern as DealService
      await auditLog('delete', user.id, companyId, { 
        deal_title: existingDeal.title,
        deal_value: existingDeal.value,
        deal_id: id
      });
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
