import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { DEPARTMENTS } from '@/constants/departments';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertTriangle } from 'lucide-react';
import { useDepartmentKPIs } from '@/lib/hooks/useDepartmentKPIs';

/**
 * DepartmentHomePage
 * ------------------
 * Generic department overview page. Acts as the landing "dashboard" for any
 * department. Pulls metadata from `DEPARTMENTS` and high-level KPI metrics via
 * `useDepartmentKPIs`.
 */
const DepartmentHomePage: React.FC = () => {
  const { departmentId: paramId } = useParams<{ departmentId?: string }>();
  const location = useLocation();

  // Derive department id: param (if present) else first path segment
  const departmentId = paramId ?? location.pathname.split('/')[1] ?? '';

  // Validate department id
  const meta = DEPARTMENTS.find((d) => d.id === departmentId);

  // Fetch KPI metrics (currently only finance/Sales support revenue but returns empty for others)
  const { loading, error, metrics } = useDepartmentKPIs((departmentId || 'sales') as any);

  if (!meta) {
    return (
      <div className="p-8 text-center text-destructive flex flex-col items-center gap-2">
        <AlertTriangle className="w-8 h-8" />
        <p>Unknown department: {departmentId}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {meta.icon}
        <h1 className="text-2xl font-bold">{meta.label} Overview</h1>
      </div>
      <p className="text-muted-foreground max-w-2xl">{meta.description}</p>

      {/* KPI Cards */}
      {loading && <Skeleton className="h-40 w-full" />}

      {error && (
        <div className="text-destructive">Failed to load metrics: {error}</div>
      )}

      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Last 12 months (PayPal)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">$
              {metrics?.totalRevenue?.toLocaleString() ?? '0.00'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TODO: Suggestions & ActionList – placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>AI Suggestions</CardTitle>
          <CardDescription>
            Automated insights and next-best actions will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentHomePage; 