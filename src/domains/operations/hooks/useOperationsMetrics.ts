import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
      // TODO: Replace `department_metrics_view` with the actual view name once in DB.
      const { data, error } = await (supabase as any)
        .from('department_metrics_view')
        .select('*')
        .eq('department', departmentId)
        .maybeSingle();

      // If the view doesn't exist yet or returns no rows, gracefully fall back
      if (error) {
        console.warn('[useOperationsMetrics] Falling back to default state:', error.message);
      }

      if (!data || error) {
        const { defaultState } = await import('../config');
        return defaultState;
      }

      return data as DepartmentState;
    },
    staleTime: 60_000, // 1 minute
  });
} 