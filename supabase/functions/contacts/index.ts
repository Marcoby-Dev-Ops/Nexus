import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
import { corsHeadersWithOrigin as corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// Use same audit logging pattern as ContactService
async function auditLog(action: string, userId: string, companyId: string, details: unknown) {
  await sb.from('audit_logs').insert({
    userid: userId,
    action,
    resourcetype: 'contact',
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
      // List contacts for company
      const { data, error } = await sb
        .from('contacts')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ contacts: data }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    if (req.method === 'POST') {
      // Create contact using ContactService patterns
      const body = await req.json();
      
      // Use same validation as ContactService
      if (!body.name || !body.email) {
        return new Response(JSON.stringify({ error: 'Contact name and email are required' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Check for duplicate email (same logic as ContactService)
      const { data: existingContact } = await sb
        .from('contacts')
        .select('id, email')
        .eq('email', body.email)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingContact) {
        return new Response(JSON.stringify({ error: `Contact with email ${body.email} already exists` }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      const insert = {
        ...body,
        user_id: user.id,
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await sb.from('contacts').insert(insert).select('*').single();
      if (error) throw error;
      
      // Use same audit logging pattern as ContactService
      await auditLog('create', user.id, companyId, { 
        contact_email: body.email, 
        contact_name: body.name,
        contact_id: data.id 
      });
      await emitRealtimeEvent('created', 'contact', data.id, companyId, data);
      return new Response(JSON.stringify({ contact: data }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 201,
      });
    }
    if (req.method === 'PATCH') {
      // Update contact using ContactService patterns
      const body = await req.json();
      if (!body.id) {
        return new Response(JSON.stringify({ error: 'Missing contact id' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Verify ownership (same logic as ContactService)
      const { data: existingContact } = await sb
        .from('contacts')
        .select('id, user_id, name, email')
        .eq('id', body.id)
        .eq('user_id', user.id)
        .single();

      if (!existingContact) {
        return new Response(JSON.stringify({ error: 'Contact not found or access denied' }), {
          status: 404,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      const update = {
        ...body,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await sb
        .from('contacts')
        .update(update)
        .eq('id', body.id)
        .eq('company_id', companyId)
        .select('*')
        .single();
      if (error) throw error;
      
      // Use same audit logging pattern as ContactService
      await auditLog('update', user.id, companyId, { 
        updates: body,
        previous_name: existingContact.name,
        previous_email: existingContact.email,
        contact_id: data.id
      });
      await emitRealtimeEvent('updated', 'contact', data.id, companyId, data);
      return new Response(JSON.stringify({ contact: data }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    if (req.method === 'DELETE') {
      // Delete contact using ContactService patterns
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing contact id' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Verify ownership and get contact data for audit (same logic as ContactService)
      const { data: existingContact } = await sb
        .from('contacts')
        .select('id, user_id, name, email')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!existingContact) {
        return new Response(JSON.stringify({ error: 'Contact not found or access denied' }), {
          status: 404,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await sb
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId)
        .select('*')
        .single();
      if (error) throw error;
      
      // Use same audit logging pattern as ContactService
      await auditLog('delete', user.id, companyId, { 
        contact_name: existingContact.name,
        contact_email: existingContact.email,
        contact_id: id
      });
      await emitRealtimeEvent('deleted', 'contact', data.id, companyId, data);
      return new Response(JSON.stringify({ contact: data }), {
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
