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

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) throw new Error('Missing PayPal creds');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase env');

const PP_BASE = PAYPAL_ENV === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';

async function requestRefresh(refreshToken: string) {
  const res = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
  });
  if (!res.ok) throw new Error(`PayPal refresh error ${res.status}`);
  return await res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { orgId } = await req.json();
    if (!orgId) throw new Error('orgId required');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get existing integration row
    const { data: row, error: fetchErr } = await supabase
      .from('ai_integrations')
      .select('*')
      .eq('org_id', orgId)
      .eq('provider', 'paypal')
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!row) throw new Error('Integration not found');
    if (!row.refresh_token) throw new Error('No refresh token stored');

    const tokenResp: any = await requestRefresh(row.refresh_token);

    const expiresAt = new Date(Date.now() + tokenResp.expires_in * 1000).toISOString();

    const { error: upErr } = await supabase
      .from('ai_integrations')
      .update({
        access_token: tokenResp.access_token,
        refresh_token: tokenResp.refresh_token ?? row.refresh_token,
        expires_at: expiresAt,
        metadata: tokenResp,
      })
      .eq('org_id', orgId)
      .eq('provider', 'paypal');
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'unknown' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 