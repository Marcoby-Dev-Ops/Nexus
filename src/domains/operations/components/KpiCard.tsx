import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/Card';
import type { KPI } from '../types';
import { useRunPlaybook } from '../hooks/useRunPlaybook';
import { Button } from '@/components/ui/Button';

interface Props {
  kpi: KPI;
  isFocus?: boolean; // if this KPI is the worst contributor
  advice?: string | string[];
}

function formatDelta(delta?: number) {
  if (delta === undefined) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

export const KpiCard: React.FC<Props> = ({ kpi, isFocus, advice }) => {
  const deltaColor = kpi.delta && kpi.delta >= 0 ? 'text-green-600' : 'text-destructive';

  const { mutate: runPlaybook, isPending } = useRunPlaybook();

  return (
    <Card className={isFocus ? 'border-2 border-destructive' : ''}>
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-sm">{kpi.label}</h4>
          <span className={`text-xs ${deltaColor}`}>{formatDelta(kpi.delta)}</span>
        </div>
        <div className="text-2xl font-semibold">{kpi.value}</div>
        {kpi.history && (
          <div className="h-10 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kpi.history.map((v, i) => ({ idx: i, v }))} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                <Line type="monotone" dataKey="v" stroke="#0891b2" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {isFocus && advice && (
          <div className="pt-2 text-sm border-t border-border space-y-2">
            <p className="font-medium">AI Recommendation</p>
            <p>{advice}</p>
            <Button
              isLoading={isPending}
              disabled={isPending}
              onClick={() => runPlaybook(kpi.id)}
              variant="outline"
              size="sm"
            >
              {isPending ? 'Queuing…' : 'Run Playbook'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default KpiCard; 