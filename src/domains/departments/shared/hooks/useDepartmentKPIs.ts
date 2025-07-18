import { useEffect, useState } from 'react';
import { supabase } from '../core/supabase';
import { format } from 'date-fns';
import type { DepartmentId } from '@/shared/constants/departments';

interface KpiSnapshot {
  value: {
    amount: number;
    currency: string;
    [key: string]: unknown;
  };
  captured_at: string;
}

type MonthlyRevenue = {
  name: string;
  value: number;
};

interface DepartmentKpiMetrics {
  totalRevenue: number;
  monthlyRevenue: MonthlyRevenue[];
}

interface DepartmentKpiState {
  loading: boolean;
  error?: string;
  metrics?: DepartmentKpiMetrics;
}

/**
 * useDepartmentKPIs
 * -----------------
 * Fetches KPI snapshot rows for a given department and aggregates them into
 * convenient metrics for the dashboard UI.
 * Currently supports the following metrics:
 *   • totalRevenue (sum of `paypal_revenue` KPI amounts)
 *   • monthlyRevenue (per-month sum for the last 12 months)
 *
 * NOTE: This hook expects the `ai_kpi_snapshots` table to contain rows with
 * `{ department_id, kpi_id, value: { amount }, captured_at }`.
 */
export function useDepartmentKPIs(departmentId: DepartmentId): DepartmentKpiState {
  const [state, setState] = useState<DepartmentKpiState>({ loading: true });

  useEffect(() => {
    let cancelled = false;

    async function fetchSnapshots() {
      try {
        // Pull the last 12 months of revenue KPI snapshots for the department.
        const since = new Date();
        since.setMonth(since.getMonth() - 12);

        const { data, error } = await (supabase as any)
          // `ai_kpi_snapshots` not yet in generated types – bypass types with `any` cast
          .from('ai_kpi_snapshots')
          .select('value, captured_at')
          .eq('department_id', departmentId)
          .eq('kpi_id', 'paypal_revenue')
          .gte('captured_at', since.toISOString())
          .order('captured_at', { ascending: true });

        if (error) throw error;

        const snapshots = (data ?? []) as KpiSnapshot[];

        // Aggregate total revenue
        const totalRevenue = snapshots.reduce((acc, row) => acc + (row.value?.amount ?? 0), 0);

        // Group by YYYY-MM for monthly revenue
        const monthMap = new Map<string, number>();
        snapshots.forEach((row) => {
          const monthKey = format(new Date(row.captured_at), 'MMM');
          const prev = monthMap.get(monthKey) ?? 0;
          monthMap.set(monthKey, prev + (row.value?.amount ?? 0));
        });

        const monthlyRevenue: MonthlyRevenue[] = Array.from(monthMap.entries()).map(([name, value]) => ({
          name,
          value: Math.round(value * 100) / 100,
        }));

        if (!cancelled) {
          setState({ loading: false, metrics: { totalRevenue, monthlyRevenue } });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setState({ loading: false, error: (err as { message?: string }).message ?? 'Unknown error' });
        }
      }
    }

    const interval = setInterval(fetchSnapshots, 600000); // 10 min
    fetchSnapshots();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [departmentId]);

  return state;
} 