import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { AlertCircle, AlertTriangle, Info, ArrowRight, Loader2, Bell, Shield, TrendingDown, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { aiInsightsService } from '@/lib/services/aiInsightsService';
import type { AIInsight } from '@/lib/services/aiInsightsService';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { cn } from '@/lib/utils/utils';

// Enhanced mock alerts with business focus
const mockBusinessAlerts: AIInsight[] = [
  {
    id: 'alert-1',
    type: 'alert',
    message: 'Customer churn rate increased 15% this month',
    action: 'Review Retention',
    severity: 'critical',
    priority: 'high',
    category: 'customer',
    estimatedImpact: 'Revenue at risk: $25K'
  },
  {
    id: 'alert-2',
    type: 'alert',
    message: 'Server response time degraded by 200ms average',
    action: 'Check Performance',
    severity: 'warning',
    priority: 'medium',
    category: 'technical',
    estimatedImpact: 'User experience impact'
  },
  {
    id: 'alert-3',
    type: 'alert',
    message: '3 high-value deals haven\'t been contacted in 5+ days',
    action: 'Follow Up Now',
    severity: 'critical',
    priority: 'high',
    category: 'sales',
    estimatedImpact: 'Potential loss: $180K'
  }
];

const alertConfig = {
    critical: {
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        className: "bg-red-50 border-red-200 hover:bg-red-100",
        buttonVariant: "destructive" as const,
        badgeClass: "bg-red-100 text-red-800"
    },
    warning: {
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        className: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
        buttonVariant: "secondary" as const,
        badgeClass: "bg-yellow-100 text-yellow-800"
    },
    info: {
        icon: <Info className="h-5 w-5 text-blue-600" />,
        className: "bg-blue-50 border-blue-200 hover:bg-blue-100",
        buttonVariant: "default" as const,
        badgeClass: "bg-blue-100 text-blue-800"
    },
}

const categoryIcons = {
  customer: <Users className="h-4 w-4" />,
  technical: <Shield className="h-4 w-4" />,
  sales: <TrendingDown className="h-4 w-4" />,
  operations: <Clock className="h-4 w-4" />,
};

export const ProactiveAlertsWidget: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: insights, isLoading, isError, error } = useQuery<AIInsight[], Error>({
    queryKey: ['aiAlerts'],
    // We can enhance the service later to specifically query for alerts.
    // For now, we filter on the client-side.
    queryFn: () => aiInsightsService.getInsights(),
    select: (data) => data.filter((insight) => insight.type === 'alert'),
    // Use mock data as fallback
    placeholderData: mockBusinessAlerts,
    // Auto-refresh every 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });

  // Auto-refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ['aiAlerts'] });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryClient]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
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
            Failed to load alerts: {error?.message || 'Unknown error'}
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!insights || insights.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <Shield className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-green-700">All Clear!</h3>
          <p className="text-sm text-muted-foreground">
            No critical issues detected. Your business is running smoothly.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {insights.map((alert) => {
          const config = alertConfig[alert.severity || 'info'];
          const categoryIcon = categoryIcons[alert.category as keyof typeof categoryIcons];
          
          return (
            <div 
              key={alert.id} 
              className={cn("p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer", config.className)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {config.icon}
                  {categoryIcon && (
                    <div className="flex items-center gap-1">
                      {categoryIcon}
                      <span className="text-xs text-muted-foreground capitalize">{alert.category}</span>
                    </div>
                  )}
                </div>
                <Badge variant="outline" className={`text-xs ${config.badgeClass}`}>
                  {alert.severity}
                </Badge>
              </div>
              
              <p className="text-sm font-medium mb-2 text-foreground">{alert.message}</p>
              
              {alert.estimatedImpact && (
                <p className="text-xs text-muted-foreground mb-3 italic">
                  {alert.estimatedImpact}
                </p>
              )}
              
              {alert.action && (
                <Button size="sm" variant={config.buttonVariant} className="w-full">
                  {alert.action}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-600" />
          Business Alerts
        </CardTitle>
        <CardDescription>
          Real-time monitoring of critical business metrics and issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}; 