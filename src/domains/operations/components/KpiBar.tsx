import type { KPI } from '../types';

export const KpiBar = ({ kpi }: { kpi: KPI }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span>{kpi.label}</span>
      <span>{kpi.value}%</span>
    </div>
    <progress
      className="w-full h-2 rounded-full [&::-webkit-progress-value]:bg-cyan-600"
      value={kpi.value}
      max={100}
    />
  </div>
); 