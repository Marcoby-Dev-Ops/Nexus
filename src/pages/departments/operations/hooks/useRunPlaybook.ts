import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../../../lib/core/supabase';
import { logger } from '@/lib/security/logger';

interface InsertPayload {
  org_id: string;
  kpi_key: string;
  action_slug: string;
  requested_by: string;
}

// Mapping of KPI keys to n8n action workflow slugs
const KPI_ACTION_MAP: Record<string, string> = {
  deploy_frequency: 'deploy_frequency_audit',
  change_failure: 'change_failure_review',
  mttr: 'mttr_reduction_workflow',
};

/**
 * useRunPlaybook
 * Queues an operations playbook against the `ops_action_queue` table.
 * Applies an optimistic KPI bump (caller-defined via react-query) and shows toast feedback.
 */
export function useRunPlaybook() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousScore?: number }>({
    mutationFn: async (kpiKey: string): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const actionSlug = KPI_ACTION_MAP[kpiKey] ?? 'generic_ops_playbook';

      const payload: InsertPayload = {
        org_id: user.user_metadata?.org_id as string,
        kpi_key: kpiKey,
        action_slug: actionSlug,
        requested_by: user.id,
      };

      const { error } = await (supabase as any)
        .from('ops_action_queue')
        .insert(payload);

      if (error) throw error;
    },
    onMutate: async (kpiKey: string) => {
      await queryClient.cancelQueries({ queryKey: ['ops-score'] });
      const previousScore = queryClient.getQueryData<number>(['ops-score']);
      if (typeof previousScore === 'number') {
        queryClient.setQueryData(['ops-score'], previousScore + 0.02);
      }
      return { previousScore };
    },
    onError: (error: Error, _kpiKey: string, context?: { previousScore?: number }) => {
      logger.error({ err: error }, 'Failed to queue Ops playbook');
      toast.error(error instanceof Error ? error.message : 'Failed to queue playbook');
      if (context?.previousScore !== undefined) {
        queryClient.setQueryData(['ops-score'], context.previousScore);
      }
    },
    onSuccess: () => {
      toast.success('Playbook queued');
      queryClient.invalidateQueries({ queryKey: ['ops-suggest'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-score'] });
    },
  });
} 