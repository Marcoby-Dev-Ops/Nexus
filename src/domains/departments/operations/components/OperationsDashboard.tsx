import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useOperationsMetrics } from './useOperationsMetrics';
import { useOperationsSuggestions } from './useOperationsSuggestions';
import { KpiCard } from './KpiCard';
import type { KPI } from './types';
import ActionList from './ActionList';
import { useAuth } from '@/core/auth/AuthProvider';

export default function OperationsDashboard() {
  const { data, isLoading } = useOperationsMetrics();
  const prompt = 'How to improve operations?';

  // Fetch the latest Operations composite score via RPC
  const { user } = useAuth();
  const orgId = user?.company_id;

  // Ensure we only call the suggestions query once metrics and orgId are ready
  

  if (isLoading || !data) return <Skeleton className="h-96" />;

  // Identify worst KPI by negative delta
  const worst = [...data.kpis].sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))[0]?.id;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md: grid-cols-3">
        {data.kpis.map((k: KPI) => (
          <KpiCard key={k.id} kpi={k} isFocus={k.id === worst} advice={k.id === worst ? advice: undefined} />
        ))}
      </div>

      {/* Global actions list */}
      <Card>
        <CardContent>
          <ActionList />
        </CardContent>
      </Card>
    </div>
  );
} 