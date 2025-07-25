import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DepartmentId, DepartmentMetrics } from '../types';

/**
 * useDepartmentMetrics
 * -------------------
 * Fetches the aggregated metrics for any department from Supabase.
 * Provides a unified interface for accessing department-specific data.
 */
export function useDepartmentMetrics(departmentId: DepartmentId) {
  return useQuery<DepartmentMetrics>({
    queryKey: ['dept-metrics', departmentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('department_metrics_view')
        .select('*')
        .eq('department', departmentId)
        .maybeSingle();

      if (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn(`[useDepartmentMetrics] error fetching ${departmentId}`, error.message);
      }

      if (data && data.metrics) {
        return data.metrics as DepartmentMetrics;
      }

      // Return empty metrics as fallback
      return {};
    },
    staleTime: 60_000, // 1 minute
  });
} 