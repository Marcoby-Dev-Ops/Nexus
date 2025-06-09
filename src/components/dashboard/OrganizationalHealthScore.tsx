import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  const overallScore = 94;
  
  const healthMetrics: HealthMetric[] = [
    {
      label: 'Revenue Flow',
      value: '$2.4M/month',
      trend: 'up',
      trendValue: '+12%',
      status: 'excellent'
    },
    {
      label: 'Operations',
      value: '98% uptime',
      trend: 'up',
      trendValue: '2.1s response',
      status: 'excellent'
    },
    {
      label: 'People',
      value: '89% satisfaction',
      trend: 'stable',
      trendValue: '5% turnover',
      status: 'good'
    },
    {
      label: 'Strategic',
      value: '78% on track',
      trend: 'up',
      trendValue: 'Q2 targets',
      status: 'good'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    }
  };

  const getScoreColor = () => {
    if (overallScore >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (overallScore >= 75) return 'text-blue-600 dark:text-blue-400';
    if (overallScore >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
      
      <CardContent className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Organizational Health Score
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time business intelligence across all departments
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor()}`}>
              {overallScore}%
            </div>
            <Badge variant="outline" className="mt-1 bg-white/80 dark:bg-gray-800/80">
              Excellent Health
            </Badge>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthMetrics.map((metric, index) => (
            <div
              key={index}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.label}
                </span>
                {getTrendIcon(metric.trend)}
              </div>
              
              <div className="space-y-1">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
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

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
            🔵 THINK: Cross-pattern analysis active
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
            🟣 SEE: Real-time monitoring engaged
          </Badge>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
            🟠 ACT: 3 optimization opportunities detected
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationalHealthScore; 