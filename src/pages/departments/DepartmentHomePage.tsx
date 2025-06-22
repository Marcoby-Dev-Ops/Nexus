import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { DEPARTMENTS } from '@/constants/departments';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertTriangle } from 'lucide-react';
import { useDepartmentKPIs } from '@/lib/hooks/useDepartmentKPIs';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { AISuggestionCard } from '@/components/ai/AISuggestionCard';
import { PageHeader } from '@/components/layout/PageHeader';

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
      <PageHeader
        title={`${meta.label} Overview`}
        description={meta.description}
        icon={React.cloneElement(meta.icon, { className: 'w-6 h-6 text-primary' })}
      />

      {/* KPI Cards */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {error && (
        <div className="text-destructive">Failed to load metrics: {error}</div>
      )}

      {!loading && !error && metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Last 12 months (PayPal)</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={metrics.monthlyRevenue}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
              <CardDescription>Last 12 months (PayPal)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                ${metrics?.totalRevenue?.toLocaleString() ?? '0.00'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Suggestions */}
      <AISuggestionCard departmentId={departmentId as any} />
    </div>
  );
};

export default DepartmentHomePage; 