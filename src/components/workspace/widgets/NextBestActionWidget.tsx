import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Loader2, Lightbulb, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { aiInsightsService } from '@/lib/services/aiInsightsService';
import type { AIInsight } from '@/lib/services/aiInsightsService';
import { Alert, AlertDescription } from '@/components/ui/Alert';

export const NextBestActionWidget: React.FC = () => {
  const { data: actions, isLoading, isError, error } = useQuery<AIInsight[], Error>({
    queryKey: ['nextBestActions'],
    queryFn: () => aiInsightsService.getInsights('next-best-action'),
    select: (data) => data.filter((insight) => insight.type === 'suggestion'),
  });

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center p-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (isError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load suggestions: {error.message}</AlertDescription>
        </Alert>
      );
    }

    if (!actions || actions.length === 0) {
      return (
        <div className="text-center p-4 text-muted-foreground">
          <Lightbulb className="w-10 h-10 mx-auto mb-2" />
          <p className="text-sm font-semibold">No suggestions right now</p>
          <p className="text-xs">We'll let you know when we have recommendations.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {actions.map((action) => (
          <div key={action.id} className="flex items-center gap-4 p-4 rounded-md border bg-card hover:bg-muted/50">
            <div className="flex-1">
              <p className="text-sm font-medium">{action.message}</p>
            </div>
            <Button size="sm" variant="outline">
              {action.action || 'View'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Next Best Actions</CardTitle>
        <CardDescription>AI-powered suggestions to improve your workflow.</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}; 