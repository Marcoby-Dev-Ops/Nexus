import { supabase } from '@/lib/core/supabase';

export async function listPayPalTxns({ orgId, limit = 50 }: { orgId: string; limit?: number }) {
  const { data, error } = await (supabase as any).rpc('rpc_list_paypal_txns', {
    p_org: orgId,
    p_limit: limit,
  });
  if (error) throw error;
  return data;
} 