import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  DollarSign, 
  Settings, 
  TrendingUp, 
  Megaphone, 
  Users, 
  Monitor, 
  Scale, 
  Target,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface DepartmentMetric {
  icon: React.ReactNode;
  department: string;
  primaryMetric: string;
  primaryValue: string;
  secondaryMetric: string;
  secondaryValue: string;
  tertiaryMetric: string;
  tertiaryValue: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface CrossDepartmentMatrixProps {
  className?: string;
}

/**
 * CrossDepartmentMatrix displays metrics from all business departments
 * in a unified grid view for organizational intelligence
 */
const CrossDepartmentMatrix: React.FC<CrossDepartmentMatrixProps> = ({ 
  className = '' 
}) => {
  const departmentMetrics: DepartmentMetric[] = [
    {
      icon: <DollarSign className="h-5 w-5" />,
      department: 'FINANCE',
      primaryMetric: 'Cash Flow',
      primaryValue: '+$1.2M',
      secondaryMetric: 'Burn Rate',
      secondaryValue: '8%',
      tertiaryMetric: 'Runway',
      tertiaryValue: '18mo',
      status: 'excellent',
      trend: 'up'
    },
    {
      icon: <Settings className="h-5 w-5" />,
      department: 'OPERATIONS',
      primaryMetric: 'Efficiency',
      primaryValue: '94%',
      secondaryMetric: 'Quality',
      secondaryValue: '99.1%',
      tertiaryMetric: 'Capacity',
      tertiaryValue: '78%',
      status: 'excellent',
      trend: 'up'
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      department: 'SALES',
      primaryMetric: 'Pipeline',
      primaryValue: '$1.2M',
      secondaryMetric: 'Close Rate',
      secondaryValue: '23%',
      tertiaryMetric: 'Velocity',
      tertiaryValue: '14d',
      status: 'good',
      trend: 'up'
    },
    {
      icon: <Megaphone className="h-5 w-5" />,
      department: 'MARKETING',
      primaryMetric: 'CAC',
      primaryValue: '$127',
      secondaryMetric: 'LTV',
      secondaryValue: '$2,840',
      tertiaryMetric: 'ROAS',
      tertiaryValue: '4.2x',
      status: 'excellent',
      trend: 'up'
    },
    {
      icon: <Users className="h-5 w-5" />,
      department: 'PEOPLE',
      primaryMetric: 'Engagement',
      primaryValue: '87%',
      secondaryMetric: 'Productivity',
      secondaryValue: '↑12%',
      tertiaryMetric: 'Skills Gap',
      tertiaryValue: '12%',
      status: 'good',
      trend: 'stable'
    },
    {
      icon: <Monitor className="h-5 w-5" />,
      department: 'TECHNOLOGY',
      primaryMetric: 'System Health',
      primaryValue: '98.2%',
      secondaryMetric: 'Security Score',
      secondaryValue: 'A+',
      tertiaryMetric: 'Data Quality',
      tertiaryValue: '96%',
      status: 'excellent',
      trend: 'up'
    },
    {
      icon: <Scale className="h-5 w-5" />,
      department: 'LEGAL',
      primaryMetric: 'Compliance',
      primaryValue: '98%',
      secondaryMetric: 'Risk Level',
      secondaryValue: 'Low',
      tertiaryMetric: 'Contracts Due',
      tertiaryValue: '3',
      status: 'excellent',
      trend: 'stable'
    },
    {
      icon: <Target className="h-5 w-5" />,
      department: 'STRATEGY',
      primaryMetric: 'OKRs',
      primaryValue: '67%',
      secondaryMetric: 'Innovation Idx',
      secondaryValue: '8.4',
      tertiaryMetric: 'Market Share',
      tertiaryValue: '12%',
      status: 'warning',
      trend: 'up'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800';
      case 'good':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800';
      default:
        return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300';
      default:
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-3 w-3 text-emerald-500" />;
      case 'down':
        return <ArrowDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-amber-500" />;
    }
  };

  return (
    <div className={className}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Cross-Functional Intelligence Grid
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Real-time performance metrics across all business departments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {departmentMetrics.map((dept, index) => (
          <Card 
            key={index} 
            className={`relative overflow-hidden transition-all hover:shadow-md ${getStatusColor(dept.status)}`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <div className="text-gray-600 dark:text-gray-400">
                    {dept.icon}
                  </div>
                  <span className="text-gray-900 dark:text-white">
                    {dept.department}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(dept.trend)}
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1.5 py-0.5 ${getStatusBadgeColor(dept.status)}`}
                  >
                    {dept.status}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-3">
              {/* Primary Metric */}
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {dept.primaryMetric}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {dept.primaryValue}
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {dept.secondaryMetric}
                  </div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {dept.secondaryValue}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {dept.tertiaryMetric}
                  </div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {dept.tertiaryValue}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CrossDepartmentMatrix; 