import { supabase } from "@/core/supabase";

export async function listPayPalTxns({ orgId, limit = 50 }: { orgId: string; limit?: number }) {
  const { data, error } = await supabase.rpc('rpc_list_paypal_txns', {
    p_org: orgId,
    p_limit: limit,
  });
  if (error) throw error;
  return data;
} 