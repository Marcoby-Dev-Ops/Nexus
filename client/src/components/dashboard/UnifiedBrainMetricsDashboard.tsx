import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Users, Target, Zap, CheckCircle, BarChart3, LineChart, Activity, Clock, Award, Lightbulb, DollarSign, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

interface TransformationMetric {
  userId: string;
  userName: string;
  beforeScore: number;
  afterScore: number;
  improvement: number;
  timeframe: string;
  domain: string;
}

interface BrainPerformanceMetric {
  metric: string;
  current: number;
  target: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export const UnifiedBrainMetricsDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userTransformationMetrics, setUserTransformationMetrics] = useState<TransformationMetric[]>([]);
  const [businessImpactMetrics, setBusinessImpactMetrics] = useState<MetricCard[]>([]);
  const [brainIntelligenceMetrics, setBrainIntelligenceMetrics] = useState<BrainPerformanceMetric[]>([]);

  // Color mapping for dynamic Tailwind classes
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
      red: { bg: 'bg-red-100', text: 'text-red-600' },
    };
    return colorMap[color] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  const loadUserTransformationMetrics = async () => {
    try {
      // Simulated data - replace with actual API call
      const mockData: TransformationMetric[] = [
        {
          userId: '1',
          userName: 'Sarah Johnson',
          beforeScore: 45,
          afterScore: 78,
          improvement: 73,
          timeframe: '3 months',
          domain: 'Sales Strategy'
        },
        {
          userId: '2',
          userName: 'Mike Chen',
          beforeScore: 32,
          afterScore: 85,
          improvement: 166,
          timeframe: '6 months',
          domain: 'Financial Planning'
        },
        {
          userId: '3',
          userName: 'Emily Rodriguez',
          beforeScore: 28,
          afterScore: 72,
          improvement: 157,
          timeframe: '4 months',
          domain: 'Marketing'
        }
      ];
      setUserTransformationMetrics(mockData);
    } catch (error) {
      console.error('Error loading user transformation metrics:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const loadBusinessImpactMetrics = async () => {
    try {
      // Simulated data - replace with actual API call
      const mockData: MetricCard[] = [
        {
          title: 'Revenue Growth',
          value: '$2.4M',
          change: 23.5,
          changeType: 'increase',
          icon: DollarSign,
          color: 'green',
          description: 'Year-over-year revenue increase'
        },
        {
          title: 'Customer Satisfaction',
          value: '94%',
          change: 8.2,
          changeType: 'increase',
          icon: CheckCircle,
          color: 'emerald',
          description: 'Net Promoter Score improvement'
        },
        {
          title: 'Operational Efficiency',
          value: '87%',
          change: 15.3,
          changeType: 'increase',
          icon: Zap,
          color: 'blue',
          description: 'Process optimization metrics'
        },
        {
          title: 'Market Share',
          value: '12.4%',
          change: 2.1,
          changeType: 'increase',
          icon: Target,
          color: 'purple',
          description: 'Industry market position'
        }
      ];
      setBusinessImpactMetrics(mockData);
    } catch (error) {
      console.error('Error loading business impact metrics:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const loadBrainIntelligenceMetrics = async () => {
    try {
      // Simulated data - replace with actual API call
      const mockData: BrainPerformanceMetric[] = [
        {
          metric: 'Decision Accuracy',
          current: 94.2,
          target: 95.0,
          status: 'excellent',
          trend: 'up'
        },
        {
          metric: 'Response Time',
          current: 1.8,
          target: 2.0,
          status: 'excellent',
          trend: 'up'
        },
        {
          metric: 'Learning Rate',
          current: 87.5,
          target: 90.0,
          status: 'good',
          trend: 'up'
        },
        {
          metric: 'Confidence Score',
          current: 91.3,
          target: 92.0,
          status: 'excellent',
          trend: 'stable'
        }
      ];
      setBrainIntelligenceMetrics(mockData);
    } catch (error) {
      console.error('Error loading brain intelligence metrics:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  useEffect(() => {
    const loadAllMetrics = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          loadUserTransformationMetrics(),
          loadBusinessImpactMetrics(),
          loadBrainIntelligenceMetrics()
        ]);
      } catch (error) {
        console.error('Error loading metrics:', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            📊 Unified Business Brain - Metrics Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
            Track brain performance and user transformation metrics to measure the democratization of business expertise.
          </p>
        </div>
        <div className="bg-card rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-lg text-muted-foreground">Loading Unified Brain Metrics...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          📊 Unified Business Brain - Metrics Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
          Track brain performance and user transformation metrics to measure the democratization of business expertise.
        </p>
      </div>

      {/* User Transformation Metrics */}
      {userTransformationMetrics.length > 0 && (
        <div className="bg-card rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            User Transformation Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTransformationMetrics.map((metric, index) => (
              <div key={index} className="bg-background rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-foreground">{metric.userName}</h3>
                  <span className="text-sm text-muted-foreground">{metric.timeframe}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Before:</span>
                    <span className="font-medium">{metric.beforeScore}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">After:</span>
                    <span className="font-medium text-green-600">{metric.afterScore}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Improvement:</span>
                    <span className="font-medium text-green-600">+{metric.improvement}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{metric.domain}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Impact Metrics */}
      {businessImpactMetrics.length > 0 && (
        <div className="bg-card rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Business Impact Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {businessImpactMetrics.map((metric, index) => {
              const IconComponent = metric.icon;
              const colorClasses = getColorClasses(metric.color);
              return (
                <div key={index} className="bg-background rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
                      <IconComponent className={`h-5 w-5 ${colorClasses.text}`} />
                    </div>
                    <div className="flex items-center text-sm">
                      {metric.changeType === 'increase' ? (
                        <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                      ) : metric.changeType === 'decrease' ? (
                        <ArrowDown className="w-4 h-4 text-red-600 mr-1" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-600 mr-1" />
                      )}
                      <span className={metric.changeType === 'increase' ? 'text-green-600' : metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'}>
                        {metric.change}%
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{metric.title}</h3>
                  <p className="text-2xl font-bold text-foreground mb-1">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Brain Intelligence Metrics */}
      {brainIntelligenceMetrics.length > 0 && (
        <div className="bg-card rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Brain Intelligence Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {brainIntelligenceMetrics.map((metric, index) => {
              const IconComponent = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? ArrowDown : Minus;
              const statusColor = metric.status === 'excellent' ? 'text-green-600' : 
                                metric.status === 'good' ? 'text-blue-600' : 
                                metric.status === 'needs_improvement' ? 'text-yellow-600' : 'text-red-600';
              return (
                <div key={index} className="bg-background rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${statusColor.replace('text-', 'bg-').replace('-600', '-100')}`}>
                      <IconComponent className={`h-5 w-5 ${statusColor}`} />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor.replace('text-', 'bg-').replace('-600', '-100')} ${statusColor}`}>
                      {metric.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{metric.metric}</h3>
                  <p className="text-2xl font-bold text-foreground mb-1">{metric.current}%</p>
                  <p className="text-sm text-muted-foreground">Target: {metric.target}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="bg-card rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2" />
          Key Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-foreground mb-2">User Transformation</h3>
            <p className="text-sm text-muted-foreground">
              Users are showing significant improvement across all business domains, with an average transformation rate of 132% over 4.3 months.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-2">Business Impact</h3>
            <p className="text-sm text-muted-foreground">
              The unified brain is driving measurable business outcomes, with revenue growth of 23.5% and customer satisfaction improvements of 8.2%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 
