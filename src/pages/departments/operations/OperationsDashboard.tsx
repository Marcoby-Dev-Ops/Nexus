import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useOperationsMetrics } from './hooks/useOperationsMetrics';
import { useOperationsSuggestions } from './hooks/useOperationsSuggestions';
import { KpiCard } from './KpiCard';
import type { KPI } from './types';
import ActionList from './ActionList';
import { useAuth } from '@/contexts/AuthContext';
import { useOpsScore } from './hooks/useOpsScore';
import InsightHeader from '@/components/ui/InsightHeader';

export default function OperationsDashboard() {
  const { data, isLoading } = useOperationsMetrics();
  const prompt = 'How to improve operations?';

  // Fetch the latest Operations composite score via RPC
  const { user } = useAuth();
  const orgId = user?.company_id;
  const { data: score, isLoading: loadingScore } = useOpsScore(orgId);

  // Ensure we only call the suggestions query once metrics and orgId are ready
  const { data: advice } = useOperationsSuggestions(
    prompt,
    data as any, // will not execute until enabled
    orgId,
  );

  if (isLoading || !data) return <Skeleton className="h-96" />;

  // Identify worst KPI by negative delta
  const worst = [...data.kpis].sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))[0]?.id;

  return (
    <div className="space-y-6">
      <InsightHeader
        title="Operations Health"
        scorePct={(score ?? 0) * 100}
        headline={computeHeadline(data.kpis)}
        updatedAt={data.updatedAt}
      />

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {data.kpis.map((k: KPI) => (
          <KpiCard key={k.id} kpi={k} isFocus={k.id === worst} advice={k.id === worst ? advice : undefined} />
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

function computeHeadline(kpis: KPI[]): string {
  if (!kpis.length) return '';
  // Pick top 2 absolute delta movers
  const movers = [...kpis]
    .filter((k) => typeof k.delta === 'number')
    .sort((a, b) => Math.abs((b.delta ?? 0)) - Math.abs((a.delta ?? 0)))
    .slice(0, 2);
  return movers
    .map((k) => `${k.label} ${k.delta! > 0 ? 'improved' : 'declined'} ${Math.abs(k.delta!).toFixed(0)}%`)
    .join(', ');
} 