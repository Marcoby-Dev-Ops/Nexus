import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/supabase';

/**
 * useOpsScore
 * -----------
 * Fetches the Operations composite score for the provided organisation. The
 * Postgres function `calc_ops_score` returns a value between 0-1 which we cache
 * for five minutes. The hook is disabled until an `orgId` is available (after
 * auth resolution).
 */
export function useOpsScore(orgId?: string | null) {
  return useQuery<number>({
    queryKey: ['ops-score', orgId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('calc_ops_score', {
        porg: orgId,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!orgId,
    staleTime: 5 * 60_000, // 5 minutes
  });
} 