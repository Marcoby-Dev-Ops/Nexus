import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Zap, Users, Trophy } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useDataConnectivityHealth } from '@/hooks/dashboard/useDataConnectivityHealth';
import { useQuickBusinessHealth } from '@/hooks/dashboard/useLivingBusinessAssessment';
import LivingBusinessAssessment from './LivingBusinessAssessment';

interface HealthMetric {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface OrganizationalHealthScoreProps {
  className?: string;
}

/**
 * OrganizationalHealthScore displays the top-level organizational health metrics
 * providing executives with a quick overview of business performance across all departments
 */
const OrganizationalHealthScore: React.FC<OrganizationalHealthScoreProps> = ({ 
  className = '' 
}) => {
  const [viewMode, setViewMode] = useState<'simple' | 'comprehensive'>('simple');
  
  const { healthData, loading, error, refresh, isLiveDataActive, connectedCount, totalCount } = useDataConnectivityHealth();
  const quickHealth = useQuickBusinessHealth();
  
  const overallScore = healthData?.overallScore || 0;
  
  // Create health metrics from data connectivity health data
  const healthMetrics: HealthMetric[] = [
    {
      label: 'Sales',
      value: `${healthData?.connectedSources.filter(s => s.type === 'crm').length > 0 ? 75 : 45}% score`,
      trend: 'up',
      trendValue: `${healthData?.connectedSources.filter(s => s.type === 'crm').length > 0 ? 75 : 45}pts`,
      status: getScoreStatus(healthData?.connectedSources.filter(s => s.type === 'crm').length > 0 ? 75 : 45)
    },
    {
      label: 'Finance',
      value: `${healthData?.connectedSources.filter(s => s.type === 'finance').length > 0 ? 80 : 40}% score`,
      trend: 'up',
      trendValue: `${healthData?.connectedSources.filter(s => s.type === 'finance').length > 0 ? 80 : 40}pts`,
      status: getScoreStatus(healthData?.connectedSources.filter(s => s.type === 'finance').length > 0 ? 80 : 40)
    },
    {
      label: 'Operations',
      value: `${healthData?.connectedSources.filter(s => s.type === 'productivity').length > 0 ? 70 : 50}% score`,
      trend: 'stable',
      trendValue: `${healthData?.connectedSources.filter(s => s.type === 'productivity').length > 0 ? 70 : 50}pts`,
      status: getScoreStatus(healthData?.connectedSources.filter(s => s.type === 'productivity').length > 0 ? 70 : 50)
    },
    {
      label: 'Marketing',
      value: `${healthData?.connectedSources.filter(s => s.type === 'analytics').length > 0 ? 85 : 35}% score`,
      trend: 'up',
      trendValue: `${healthData?.connectedSources.filter(s => s.type === 'analytics').length > 0 ? 85 : 35}pts`,
      status: getScoreStatus(healthData?.connectedSources.filter(s => s.type === 'analytics').length > 0 ? 85 : 35)
    }
  ];

  function getScoreStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good'; 
    if (score >= 50) return 'warning';
    return 'critical';
  }

  function getHealthStatus(score: number): string {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Warning';
    return 'Critical';
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-destructive" />;
      default: return <Minus className="h-3 w-3 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark: bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      case 'good':
        return 'bg-primary/10 text-primary border-border dark:bg-primary/20/20 dark:text-primary dark:border-primary/80';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-red-300 dark:border-red-800';
    }
  };

  const getScoreColor = () => {
    if (overallScore >= 90) return 'text-success dark: text-emerald-400';
    if (overallScore >= 75) return 'text-primary dark: text-primary';
    if (overallScore >= 60) return 'text-warning dark: text-amber-400';
    return 'text-destructive dark:text-destructive';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading your business health assessment...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-destructive">Failed to load business health data</div>
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground dark: text-primary-foreground">
              Business Health
            </h2>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
              Business health based on connected and verified data sources
              {((healthData as any)?.connectedSources?.length ?? (healthData as any)?.connected_sources ?? 0) > 0 && (
                <span className="ml-2 text-success">
                  • {((healthData as any)?.connectedSources?.length ?? (healthData as any)?.connected_sources) || 0} sources connected
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'simple' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('simple')}
                  className="text-xs"
                >
                  Quick View
                </Button>
                <Button
                  variant={viewMode === 'comprehensive' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('comprehensive')}
                  className="text-xs flex items-center gap-1"
                >
                  <Users className="w-3 h-3" />
                  Benchmarks
                </Button>
              </div>
              <Button onClick={refresh} variant="ghost" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
              {isLiveDataActive && (
                <div className="flex items-center gap-1 text-xs text-success">
                  <Zap className="w-3 h-3" />
                  Live
                </div>
              )}
            </div>
            <div className={`text-4xl font-bold ${getScoreColor()}`}>
              {overallScore}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${getStatusColor(getHealthStatus(overallScore))}`}>
                {getHealthStatus(overallScore)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {(healthData?.completionPercentage ?? (healthData as any)?.completion_percentage) || 0}% data
              </span>
              {quickHealth.rank > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Trophy className="w-3 h-3 mr-1" />
                  #{quickHealth.rank}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Conditional Content */}
        {viewMode === 'simple' ? (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-4">
              {healthMetrics.map((metric, index) => (
                <div
                  key={index}
                  data-testid={`metric-${metric.label}`}
                  className="rounded-lg p-4 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground dark: text-muted-foreground">
                      {metric.label}
                    </span>
                    {getTrendIcon(metric.trend)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-foreground dark: text-primary-foreground">
                      {metric.value}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                        {metric.trendValue}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(metric.status)}`}
                      >
                        {metric.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Data Connectivity Status */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Connected Sources</span>
                <span className="text-foreground">{connectedCount} of {totalCount}</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {((healthData as any)?.connectedSources || []).map((source: any, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <div className="w-2 h-2 bg-success rounded-full mr-1" />
                    {source.name}
                    {source.isVerified && <span className="ml-1 text-success">✓</span>}
                  </Badge>
                )) || (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    No data sources connected
                  </Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                Data Quality Score: {(healthData?.dataQualityScore ?? (healthData as any)?.data_quality_score) || 0}%
              </div>
            </div>
          </>
        ) : (
          /* Comprehensive Living Assessment - Remove header and make it embedded */
          <div className="mt-4 -mx-6 -mb-6">
            <LivingBusinessAssessment className="border-0 shadow-none" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationalHealthScore; 
