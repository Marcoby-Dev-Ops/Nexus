import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Brain, TrendingUp, Target } from 'lucide-react';

export interface AIInsightsWidgetProps {
  className?: string;
}

/**
 * AIInsightsWidget
 * Displays AI-powered business insights for the workspace dashboard.
 */
const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ className = '' }) => {
  // Mock AI insights data - in real implementation, this would come from AI services
  const insights = [
    {
      id: 1,
      type: 'productivity',
      title: 'Focus Time Optimization',
      description: 'Your peak productivity hours are 9-11 AM. Schedule important tasks during this window.',
      icon: Brain,
      priority: 'high'
    },
    {
      id: 2,
      type: 'trend',
      title: 'Task Completion Trend',
      description: 'You\'ve completed 23% more tasks this week compared to last week.',
      icon: TrendingUp,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'suggestion',
      title: 'Meeting Optimization',
      description: 'Consider consolidating your 3 short meetings into one focused session.',
      icon: Target,
      priority: 'low'
    }
  ];

  return (
    <Card className={`${className} bg-card/50 border-border/60`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Brain className="w-5 h-5 text-primary" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => {
          const IconComponent = insight.icon;
          return (
            <div
              key={insight.id}
              className={`p-3 rounded-lg border-l-4 shadow-sm ${
                insight.priority === 'high' 
                  ? 'border-l-primary bg-primary/25 text-primary-foreground' 
                  : insight.priority === 'medium'
                  ? 'border-l-secondary bg-secondary/25 text-secondary-foreground'
                  : 'border-l-muted bg-muted/20 text-foreground'
              }`}
            >
              <div className="flex items-start gap-3">
                <IconComponent className="w-4 h-4 mt-0.5 opacity-90" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-current mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-foreground">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="text-center pt-2">
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">
            View more insights
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export { AIInsightsWidget };
export default AIInsightsWidget; 