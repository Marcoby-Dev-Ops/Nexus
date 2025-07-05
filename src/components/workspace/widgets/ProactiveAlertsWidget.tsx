import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertCircle, ArrowRight, Loader2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { aiInsightsService } from '@/lib/services/aiInsightsService';
import type { AIInsight } from '@/lib/services/aiInsightsService';
import { Alert, AlertDescription } from '@/components/ui/Alert';

export const ProactiveAlertsWidget: React.FC = () => {
  const { data: insights, isLoading, isError, error } = useQuery<AIInsight[], Error>({
    queryKey: ['aiAlerts'],
    // We can enhance the service later to specifically query for alerts.
    // For now, we filter on the client-side.
    queryFn: () => aiInsightsService.getInsights(),
    select: (data) => data.filter((insight) => insight.type === 'alert'),
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (isError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load alerts: {error.message}
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!insights || insights.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Bell className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Alerts</h3>
            <p className="text-sm text-muted-foreground">
              Everything looks clear for now.
            </p>
          </div>
      );
    }

    return (
      <div className="space-y-4">
        {insights.map((alert) => (
          <div key={alert.id} className="flex items-start gap-3 p-3 rounded-md bg-destructive/10">
            <div className="mt-1"><AlertCircle className="h-5 w-5 text-red-500" /></div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1 text-destructive">{alert.message}</p>
              {alert.action && (
                <Button size="sm" variant="destructive" className="mt-1">
                  {alert.action}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proactive Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}; 