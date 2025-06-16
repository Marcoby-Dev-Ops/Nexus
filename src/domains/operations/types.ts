export interface KPI {
  id: string;
  label: string;
  value: number;        // 0-100 or domain-specific unit (percentage)
  delta?: number;       // percentage change vs previous period
  history?: number[];   // sparkline values (most recent last)
  target?: number;      // optional goal
  trend?: 'up' | 'down' | 'flat';
}

export interface DepartmentState {
  score: number;        // composite health 0-100
  kpis: KPI[];
  updatedAt: string;    // ISO8601 timestamp
} 