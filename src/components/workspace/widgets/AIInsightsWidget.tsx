import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { AlertCircle, CheckCircle, Lightbulb, ArrowRight, Loader2, Target, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { aiInsightsService } from '@/lib/services/aiInsightsService';
import type { AIInsight } from '@/lib/services/aiInsightsService';
import { Alert, AlertDescription } from '@/components/ui/Alert';

const iconMap: { [key: string]: React.ReactNode } = {
  suggestion: <Lightbulb className="h-5 w-5 text-primary" />,
  alert: <AlertCircle className="h-5 w-5 text-warning" />,
  success: <CheckCircle className="h-5 w-5 text-success" />,
  revenue: <DollarSign className="h-5 w-5 text-success" />,
  productivity: <Target className="h-5 w-5 text-primary" />,
  team: <Users className="h-5 w-5 text-secondary" />,
  growth: <TrendingUp className="h-5 w-5 text-warning" />,
};

// Enhanced mock insights with business focus
const mockBusinessInsights: AIInsight[] = [
  {
    id: '1',
    type: 'revenue',
    message: 'Follow up with 3 high-value prospects from last week\'s demos',
    action: 'Review Prospects',
    priority: 'high',
    category: 'sales',
    estimatedImpact: '$45K potential revenue'
  },
  {
    id: '2',
    type: 'productivity',
    message: 'You have 2 hours of unscheduled time this afternoon - perfect for deep work',
    action: 'Block Time',
    priority: 'medium',
    category: 'productivity',
    estimatedImpact: '50% more focus time'
  },
  {
    id: '3',
    type: 'team',
    message: 'Schedule 1:1s with team members who haven\'t had check-ins this month',
    action: 'Schedule Meetings',
    priority: 'medium',
    category: 'management',
    estimatedImpact: 'Better team alignment'
  },
  {
    id: '4',
    type: 'alert',
    message: 'Customer satisfaction score dropped 5% - review recent support tickets',
    action: 'Review Tickets',
    priority: 'high',
    category: 'customer',
    estimatedImpact: 'Prevent churn risk'
  }
];

export const AIInsightsWidget: React.FC = () => {
  const { data: insights, isLoading, isError, error } = useQuery<AIInsight[], Error>({
    queryKey: ['aiInsights'],
    queryFn: () => aiInsightsService.getInsights(),
    // Use mock data as fallback
    placeholderData: mockBusinessInsights,
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'revenue':
        return 'border-green-200 bg-success/5/50 hover:bg-success/10/50';
      case 'productivity':
        return 'border-border bg-primary/5/50 hover:bg-primary/10/50';
      case 'team':
        return 'border-purple-200 bg-secondary/5/50 hover:bg-secondary/10/50';
      case 'alert':
        return 'border-orange-200 bg-orange-50/50 hover:bg-orange-100/50';
      default:
        return 'border-border bg-background/50 hover:bg-muted/50';
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 border rounded-lg animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="h-5 w-5 bg-muted rounded"></div>
                <div className="h-6 w-20 bg-muted rounded"></div>
              </div>
              <div className="h-4 bg-muted rounded mb-2 w-3/4"></div>
              <div className="h-8 bg-muted rounded w-32"></div>
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load AI insights: {error?.message || 'Unknown error'}
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!insights || insights.length === 0) {
      return (
        <div className="text-center py-8">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            No insights at the moment. Check back soon!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {insights.map((insight) => (
          <div 
            key={insight.id} 
            className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${getActionColor(insight.type)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {iconMap[insight.type] || <Lightbulb className="h-5 w-5 text-muted-foreground" />}
                <span className="text-xs text-muted-foreground capitalize">{insight.category}</span>
              </div>
              {insight.priority && getPriorityBadge(insight.priority)}
            </div>
            
            <p className="text-sm font-medium mb-2 text-foreground">{insight.message}</p>
            
            {insight.estimatedImpact && (
              <p className="text-xs text-muted-foreground mb-3 italic">
                Impact: {insight.estimatedImpact}
              </p>
            )}
            
            {insight.action && (
              <Button size="sm" variant="outline" className="w-full">
                {insight.action}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Next Best Actions
        </CardTitle>
        <CardDescription>
          AI-powered recommendations to maximize your productivity and business impact
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}; 