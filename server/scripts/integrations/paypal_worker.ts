/*
 * PayPal Finance Sync Worker
 * -----------------------------------------
 * 1. Auths with PayPal via client credentials to get an access token.
 * 2. Fetches all successful transactions since last sync (persisted in a simple `lastSync` file or env var).
 * 3. Transforms transactions into KPI snapshot rows.
 * 4. Calls the `upsert_kpis` Edge Function to persist them.
 *
 * ENV required:
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET
 *   PAYPAL_ENV            =>  "live" | "sandbox" (default sandbox)
 *   SUPABASE_URL
 *   SUPABASE_EDGE_JWT     =>  Service role JWT with { org_id } claim
 */
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

interface PayPalAccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface PayPalTransaction {
  transaction_info: {
    transaction_id: string;
    transaction_initiation_date: string;
    transaction_amount: { currency_code: string; value: string };
    transaction_status: string;
  };
}

const {
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_ENV = 'sandbox',
  SUPABASE_URL,
  SUPABASE_EDGE_JWT,
} = process.env;

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) throw new Error('Missing PayPal credentials');
if (!SUPABASE_URL || !SUPABASE_EDGE_JWT) throw new Error('Missing Supabase env vars');

const PP_BASE = PAYPAL_ENV === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${PP_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal token error ${res.status}`);
  const json = (await res.json()) as PayPalAccessTokenResponse;
  return json.access_token;
}

async function fetchTransactions(token: string, start: string, end: string): Promise<PayPalTransaction[]> {
  const url = `${PP_BASE}/v1/reporting/transactions?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}&transaction_status=S&page_size=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`PayPal transactions error ${res.status}`);
  const json: any = await res.json();
  return json.transaction_details as PayPalTransaction[];
}

async function getLastSync(): Promise<string> {
  const file = path.resolve('.cache/paypal_last_sync');
  try {
    const str = await fs.readFile(file, 'utf-8');
    return str.trim();
  } catch {
    // default 30 days ago
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
}

async function setLastSync(iso: string) {
  const file = path.resolve('.cache/paypal_last_sync');
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, iso, 'utf-8');
}

async function upsertKpis(rows: any[]) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/upsert_kpis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_EDGE_JWT}`,
    },
    body: JSON.stringify({ snapshots: rows }),
  });
  if (!res.ok) throw new Error(`upsert_kpis failed ${res.status}`);
  console.log('Inserted', rows.length, 'PayPal KPI snapshots');
}

(async () => {
  const lastSync = await getLastSync();
  const startIso = lastSync;
  const endIso = new Date().toISOString();

  const ppToken = await getAccessToken();
  const txns = await fetchTransactions(ppToken, startIso, endIso);

  const snapshots = txns.map((t) => ({
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

  if (snapshots.length) {
    await upsertKpis(snapshots);
  }

  await setLastSync(endIso);
})(); 