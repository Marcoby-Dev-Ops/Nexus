import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';

export function SeePage() {
  return (
    <div className="p-4 sm: p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">See: Business Health</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Analyze your key business metrics and gain insights into your company's performance.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder for metric cards */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Recurring Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">$12,345</p>
            <p className="text-sm text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">3.2%</p>
            <p className="text-sm text-muted-foreground">-0.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>New Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">42</p>
            <p className="text-sm text-muted-foreground">+10 from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Performance Chart</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Placeholder for a chart component */}
            <div className="h-64 w-full bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 