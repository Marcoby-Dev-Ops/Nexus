/**
 * Scheduled Edge Function – PayPal Finance Sync
 * Runs via Supabase cron (e.g. every 30 min) to ingest successful PayPal transactions
 * and store them as KPI snapshots in `ai_kpi_snapshots`.
 *
 * Required environment variables (set in Supabase dashboard):
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET
 *   PAYPAL_ENV            → "live" | "sandbox" (default sandbox)
 *   ORG_ID                → UUID of the Nexus organisation
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

const {
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_ENV = 'sandbox',
  ORG_ID,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = Deno.env.toObject();

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  throw new Error('PayPal credentials missing in environment');
}
if (!ORG_ID) {
  throw new Error('ORG_ID env var required for KPI snapshots');
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase admin env vars missing');
}

const PP_BASE = PAYPAL_ENV === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal token error ${res.status}`);
  const json = await res.json() as { access_token: string };
  return json.access_token;
}

async function fetchTransactions(token: string, start: string, end: string) {
  const url = `${PP_BASE}/v1/reporting/transactions?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}&transaction_status=S&page_size=100`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`PayPal transaction error ${res.status}`);
  const json: any = await res.json();
  return json.transaction_details ?? [];
}

serve(async (req) => {
  // Support OPTIONS probe (cron trigger sends POST by default but handle CORS anyway)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Pull last 60 min of transactions (simple strategy; duplicates ignored by DISTINCT in MV)
    const endIso = new Date().toISOString();
    const startIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const ppToken = await getAccessToken();
    const txns = await fetchTransactions(ppToken, startIso, endIso);

    if (!txns.length) {
      return new Response(JSON.stringify({ inserted: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const rows = txns.map((t: any) => ({
      org_id: ORG_ID,
      department_id: 'finance',
      kpi_id: 'paypal_revenue',
      value: {
        amount: parseFloat(t.transaction_info.transaction_amount.value),
        currency: t.transaction_info.transaction_amount.currency_code,
        txn_id: t.transaction_info.transaction_id,
      },
      source: 'paypal',
      captured_at: t.transaction_info.transaction_initiation_date,
    }));

    const { error } = await supabase.from('ai_kpi_snapshots').insert(rows);
    if (error) throw error;

    // Refresh MV
    await supabase.rpc('refresh_mv_paypal_txns');

    return new Response(JSON.stringify({ inserted: rows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error('[paypal_sync] error', err);
    return new Response(JSON.stringify({ error: err.message ?? 'unknown' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 