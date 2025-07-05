import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertCircle, CheckCircle, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { aiInsightsService } from '@/lib/services/aiInsightsService';
import type { AIInsight } from '@/lib/services/aiInsightsService';
import { Alert, AlertDescription } from '@/components/ui/Alert';

const iconMap: { [key: string]: React.ReactNode } = {
  suggestion: <Lightbulb className="h-5 w-5 text-yellow-500" />,
  alert: <AlertCircle className="h-5 w-5 text-red-500" />,
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
};

export const AIInsightsWidget: React.FC = () => {
  const { data: insights, isLoading, isError, error } = useQuery<AIInsight[], Error>({
    queryKey: ['aiInsights'],
    queryFn: () => aiInsightsService.getInsights(),
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
            Failed to load AI insights: {error.message}
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!insights || insights.length === 0) {
      return (
          <p className="text-sm text-muted-foreground text-center p-4">
            No insights at the moment. Check back soon!
          </p>
      );
    }

    return (
      <div className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
            <div className="mt-1">{iconMap[insight.type] || <Lightbulb className="h-5 w-5 text-gray-500" />}</div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">{insight.message}</p>
              {insight.action && (
                <Button size="sm" variant="secondary" className="mt-1">
                  {insight.action}
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
        <CardTitle>Next Best Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}; 