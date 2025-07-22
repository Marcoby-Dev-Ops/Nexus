import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/supabase';
import type { DepartmentState } from '../types';
import { departmentId } from '../config';

/**
 * useOperationsMetrics
 * --------------------
 * Fetches the aggregated KPI snapshot view from Supabase for the Operations
 * department. Falls back to `defaultState` on failure so the dashboard renders
 * predictable UI.
 */
export function useOperationsMetrics() {
  return useQuery<DepartmentState>({
    queryKey: ['dept-metrics', departmentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('department_metrics_view')
        .select('*')
        .eq('department', departmentId)
        .maybeSingle();

      if (error) {
        console.warn('[useOperationsMetrics] error fetching view', error.message);
      }

      if (data && data.state) {
        return data.state as DepartmentState;
      }

      // fallback to default
      const { defaultState } = await import('../config');
      return defaultState;
    },
    staleTime: 60_000, // 1 minute
  });
} 