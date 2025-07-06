import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';
import { encrypt, decrypt } from './crypto.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Supabase client, configured to use the service_role key for admin access.
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const integrationName = url.pathname.split('/').pop();
    const { user } = await supabaseAdmin.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!integrationName) {
      return new Response(JSON.stringify({ error: 'Integration name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (req.method) {
      case 'POST':
        return handlePost(req, user, integrationName);
      case 'GET':
        return handleGet(req, user, integrationName);
      case 'DELETE':
        return handleDelete(req, user, integrationName);
      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handlePost(req: Request, user, integrationName: string) {
  const { token, organization_id } = await req.json();
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { ciphertext, iv, authTag } = await encrypt(JSON.stringify(token));

  const { error } = await supabaseAdmin.from('encrypted_credentials').upsert({
    user_id: user.id,
    organization_id,
    integration_name: integrationName,
    encrypted_token: ciphertext,
    iv,
    auth_tag: authTag,
  }, { onConflict: organization_id ? 'organization_id,integration_name' : 'user_id,integration_name' });

  if (error) throw error;

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleGet(req: Request, user, integrationName: string) {
  const { data, error } = await supabaseAdmin
    .from('encrypted_credentials')
    .select('encrypted_token, iv, auth_tag')
    .eq('user_id', user.id)
    .eq('integration_name', integrationName)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Credential not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const decryptedToken = await decrypt(data.encrypted_token, data.iv, data.auth_tag);

  return new Response(decryptedToken, {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleDelete(req: Request, user, integrationName: string) {
    const { error } = await supabaseAdmin
      .from('encrypted_credentials')
      .delete()
      .eq('user_id', user.id)
      .eq('integration_name', integrationName);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
} 