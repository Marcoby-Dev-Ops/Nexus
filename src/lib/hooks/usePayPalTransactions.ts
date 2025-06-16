import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export interface PayPalTransaction {
  txn_id: string;
  amount: number;
  currency: string;
  captured_at: string;
}

interface UsePayPalTransactionsState {
  loading: boolean;
  error?: string;
  transactions: PayPalTransaction[];
}

/**
 * usePayPalTransactions
 * ---------------------
 * Fetches the latest successful PayPal transactions from the `ai_kpi_snapshots` table.
 * Assumes rows were inserted by the `paypal_sync` Edge Function with the following shape:
 *   { department_id: 'finance', kpi_id: 'paypal_revenue', value: { amount, currency, txn_id }, captured_at }
 *
 * @param limit Number of transactions to fetch (default 10)
 */
export function usePayPalTransactions(limit = 10): UsePayPalTransactionsState {
  const [state, setState] = useState<UsePayPalTransactionsState>({ loading: true, transactions: [] });

  useEffect(() => {
    let cancelled = false;

    async function fetchTransactions() {
      try {
        const { data, error } = await (supabase as any)
          .from('ai_kpi_snapshots')
          .select('value, captured_at')
          .eq('department_id', 'finance')
          .eq('kpi_id', 'paypal_revenue')
          .order('captured_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        const transactions: PayPalTransaction[] = (data ?? []).map((row: any) => ({
          txn_id: row.value?.txn_id,
          amount: row.value?.amount,
          currency: row.value?.currency,
          captured_at: row.captured_at,
        }));

        if (!cancelled) setState({ loading: false, transactions });
      } catch (err: unknown) {
        if (!cancelled) setState({ loading: false, transactions: [], error: (err as { message?: string }).message ?? 'Unknown error' });
      }
    }

    fetchTransactions();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return state;
} 