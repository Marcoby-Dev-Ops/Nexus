import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Lightbulb } from 'lucide-react';

interface ActionableInsightsProps {
  hasCriticalAlerts: boolean;
  hasHighPriorityItems: boolean;
}

export function ActionableInsights({ hasCriticalAlerts, hasHighPriorityItems }: ActionableInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Actionable Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hasCriticalAlerts && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Critical alerts require attention
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Review and address urgent issues
                </p>
              </div>
            </div>
          )}
          
          {hasHighPriorityItems && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  High priority items available
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Focus on these items for maximum impact
                </p>
              </div>
            </div>
          )}
          
          {!hasCriticalAlerts && !hasHighPriorityItems && (
            <p className="text-sm text-muted-foreground text-center py-4">
              All systems running smoothly
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
