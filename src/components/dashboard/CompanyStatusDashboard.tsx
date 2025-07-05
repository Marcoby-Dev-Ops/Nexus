import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  DollarSign,
  Users,
  Activity,
  Heart,
  Lightbulb,
  Settings,
  Target,
  Zap
} from 'lucide-react';
import { companyStatusService, type CompanyStatusOverview, type DimensionStatus } from '@/lib/services/companyStatusService';
import { logger } from '@/lib/security/logger';

interface CompanyStatusDashboardProps {
  className?: string;
}

export const CompanyStatusDashboard: React.FC<CompanyStatusDashboardProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<CompanyStatusOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const statusData = await companyStatusService.getCompanyStatusOverview();
      setStatus(statusData);
      setError(null);
      logger.info({ overallScore: statusData.overallHealth.score }, 'Company status loaded');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load company status';
      setError(errorMessage);
      logger.error({ err }, 'Failed to load company status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getTrendIcon = (trend: string, size = 'h-4 w-4') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className={`${size} text-emerald-500`} />;
      case 'declining':
        return <TrendingDown className={`${size} text-destructive`} />;
      default:
        return <Minus className={`${size} text-amber-500`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-emerald-500 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      case 'good':
        return 'text-blue-500 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'warning':
        return 'text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'text-destructive bg-destructive/10 border-destructive/20 dark:bg-destructive/20 dark:text-red-300 dark:border-red-800';
    }
  };

  const getDimensionIcon = (dimension: string) => {
    const iconMap = {
      financial: <DollarSign className="h-5 w-5" />,
      operational: <Settings className="h-5 w-5" />,
      innovation: <Lightbulb className="h-5 w-5" />,
      customer: <Heart className="h-5 w-5" />,
      team: <Users className="h-5 w-5" />
    };
    return iconMap[dimension as keyof typeof iconMap] || <Activity className="h-5 w-5" />;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Error Loading Company Status
          </CardTitle>
          <CardDescription>
            We couldn't load your company status overview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button onClick={fetchStatus} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Health Header */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground dark:text-primary-foreground">
                Company Status Overview
              </h1>
              <p className="text-muted-foreground dark:text-muted-foreground mt-1">
                Real-time business intelligence across all dimensions
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={fetchStatus} 
                variant="outline" 
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="text-right">
                <div className={`text-5xl font-bold ${status.overallHealth.score >= 85 ? 'text-emerald-500' : status.overallHealth.score >= 70 ? 'text-blue-500' : status.overallHealth.score >= 50 ? 'text-amber-500' : 'text-destructive'}`}>
                  {status.overallHealth.score}%
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getStatusColor(status.overallHealth.status)}>
                    {status.overallHealth.status.charAt(0).toUpperCase() + status.overallHealth.status.slice(1)}
                  </Badge>
                  {getTrendIcon(status.overallHealth.trend)}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(status.keyMetrics).map(([key, metric]) => (
              <div key={key} className="bg-card/80 dark:bg-background/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground capitalize">
                    {key}
                  </span>
                  {getTrendIcon(metric.trend > 0 ? 'improving' : metric.trend < 0 ? 'declining' : 'stable', 'h-3 w-3')}
                </div>
                <div className="text-lg font-bold text-foreground">
                  {key === 'revenue' ? `$${metric.value.toLocaleString()}` : 
                   key === 'uptime' || key === 'satisfaction' ? `${metric.value}${key === 'uptime' ? '%' : '/10'}` :
                   metric.value.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}% this {metric.period}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dimensional Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(status.dimensions).map(([dimension, data]) => (
          <DimensionCard 
            key={dimension} 
            dimension={dimension} 
            data={data} 
            icon={getDimensionIcon(dimension)}
          />
        ))}
      </div>

      {/* Alerts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
            </CardTitle>
            <CardDescription>
              Issues requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status.alerts.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                No active alerts - all systems healthy
              </div>
            ) : (
              <div className="space-y-3">
                {status.alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-muted-foreground">{alert.description}</div>
                      {alert.actionRequired && (
                        <Badge variant="destructive" className="mt-1">
                          Action Required
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Opportunities and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status.insights.length === 0 ? (
              <div className="text-muted-foreground">
                No insights available at the moment
              </div>
            ) : (
              <div className="space-y-3">
                {status.insights.map((insight) => (
                  <div key={insight.id} className="p-3 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{insight.title}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant={insight.impact === 'high' ? 'default' : insight.impact === 'medium' ? 'secondary' : 'outline'}>
                          {insight.impact} impact
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {insight.confidence}% confidence
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{insight.description}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(status.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

// Dimension Card Component
interface DimensionCardProps {
  dimension: string;
  data: DimensionStatus;
  icon: React.ReactNode;
}

const DimensionCard: React.FC<DimensionCardProps> = ({ dimension, data, icon }) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-destructive';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="capitalize">{dimension}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getScoreColor(data.score)}`}>
              {data.score}%
            </span>
            {getTrendIcon(data.trend)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Key Indicators */}
          <div>
            <h4 className="text-sm font-medium mb-2">Key Indicators</h4>
            <div className="space-y-1">
              {data.keyIndicators.map((indicator, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  • {indicator}
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          {data.actionItems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Recommended Actions</h4>
              <div className="space-y-1">
                {data.actionItems.slice(0, 2).map((action, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    • {action}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 