import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

const {
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_ENV = 'sandbox',
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = Deno.env.toObject();

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  throw new Error('Missing PayPal credentials');
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase admin env vars');
}

const PP_BASE = PAYPAL_ENV === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';

async function exchangeCodeForTokens(code: string) {
  const res = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=authorization_code&code=${encodeURIComponent(code)}`,
  });
  if (!res.ok) throw new Error(`PayPal token error ${res.status}`);
  return await res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      throw new Error('Missing code or state');
    }

    // Parse state to get user ID and timestamp
    const [userId, timestamp] = state.split('-');
    
    if (!userId) {
      throw new Error('Invalid state parameter');
    }

    const tokenResp: any = await exchangeCodeForTokens(code);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const expiresAt = new Date(Date.now() + tokenResp.expires_in * 1000).toISOString();

    // Get PayPal integration ID
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id')
      .eq('slug', 'paypal')
      .single();

    if (integrationError || !integration) {
      throw new Error('PayPal integration not found in database');
    }

    // Store integration in user_integrations table
    const { error } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: userId,
        integration_id: integration.id,
        config: {
          access_token: tokenResp.access_token,
          refresh_token: tokenResp.refresh_token,
          expires_at: expiresAt,
          token_type: tokenResp.token_type || 'Bearer',
          scope: tokenResp.scope,
        },
        status: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,integration_id'
      });
    if (error) throw error;

    const html = `<html><body><script>window.close();</script>Integration connected. You may close this window.</body></html>`;
    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      status: 200,
    });
  } catch (err: any) {
    console.error('[paypal_oauth_callback] error', err);
    return new Response(JSON.stringify({ error: err.message ?? 'unknown' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 