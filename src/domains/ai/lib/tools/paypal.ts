import { supabase } from "@/core/supabase";

export async function listPayPalTxns({ orgId, limit = 50 }: { orgId: string; limit?: number }) {
  const { data, error } = await supabase.rpc('rpc_list_paypal_txns', {
    porg: orgId,
    plimit: limit,
  });
  if (error) throw error;
  return data;
} 