import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Brain, 
  Eye, 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  DollarSign,
  ArrowRight,
  Lightbulb,
  Target,
  ChevronRight
} from 'lucide-react';

interface TrinityInsight {
  type: 'think' | 'see' | 'act';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  urgency: 'urgent' | 'normal' | 'low';
  departments: string[];
  recommendation?: string;
  estimatedValue?: string;
}

interface TrinityInsightsEngineProps {
  className?: string;
}

/**
 * TrinityInsightsEngine displays AI-powered insights using the THINK/SEE/ACT framework
 * for organizational intelligence and decision support
 */
const TrinityInsightsEngine: React.FC<TrinityInsightsEngineProps> = ({ 
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState<'think' | 'see' | 'act'>('think');

  const insights: TrinityInsight[] = [
    {
      type: 'think',
      title: 'Cross-departmental Pattern Analysis',
      description: 'Marketing spend increase correlating with sales velocity decrease suggests misaligned campaign targeting affecting lead quality.',
      impact: 'high',
      urgency: 'urgent',
      departments: ['Marketing', 'Sales', 'Finance'],
      recommendation: 'Realign marketing campaigns with high-converting customer profiles',
      estimatedValue: '+$340K ARR'
    },
    {
      type: 'think',
      title: 'Resource Optimization Opportunity',
      description: 'Operations capacity at 78% while customer satisfaction declining suggests bottleneck in service delivery processes.',
      impact: 'medium',
      urgency: 'normal',
      departments: ['Operations', 'Customer Success'],
      recommendation: 'Implement automated escalation workflows',
      estimatedValue: '+15% CSAT'
    },
    {
      type: 'see',
      title: 'Real-time Performance Anomaly',
      description: 'System response time increased 23% in last 4 hours. Potential infrastructure strain detected.',
      impact: 'medium',
      urgency: 'urgent',
      departments: ['Technology', 'Operations'],
      recommendation: 'Scale infrastructure resources immediately',
      estimatedValue: 'Prevent downtime'
    },
    {
      type: 'see',
      title: 'Revenue Flow Disruption Risk',
      description: 'Three major contracts (totaling $280K) approaching renewal with below-average engagement scores.',
      impact: 'high',
      urgency: 'urgent',
      departments: ['Sales', 'Customer Success'],
      recommendation: 'Immediate customer health intervention required',
      estimatedValue: 'Protect $280K ARR'
    },
    {
      type: 'act',
      title: 'Automated Workflow Optimization',
      description: 'Customer onboarding time can be reduced by 40% through process automation and resource reallocation.',
      impact: 'high',
      urgency: 'normal',
      departments: ['Operations', 'Technology'],
      recommendation: 'Deploy automated onboarding sequences',
      estimatedValue: '+28% NPS'
    },
    {
      type: 'act',
      title: 'Strategic Resource Reallocation',
      description: 'Moving 2 engineers from feature development to infrastructure can reduce customer churn by 15%.',
      impact: 'medium',
      urgency: 'normal',
      departments: ['Technology', 'People', 'Strategy'],
      recommendation: 'Implement immediate team restructuring',
      estimatedValue: '+$180K ARR'
    }
  ];

  const getTabConfig = (type: 'think' | 'see' | 'act') => {
    switch (type) {
      case 'think':
        return {
          icon: <Brain className="h-4 w-4" />,
          label: 'THINK',
          color: 'blue',
          description: 'Cross-pattern analysis'
        };
      case 'see':
        return {
          icon: <Eye className="h-4 w-4" />,
          label: 'SEE', 
          color: 'purple',
          description: 'Real-time monitoring'
        };
      case 'act':
        return {
          icon: <Zap className="h-4 w-4" />,
          label: 'ACT',
          color: 'orange',
          description: 'Automated optimization'
        };
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-red-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300';
      default:
        return 'bg-success/10 text-success border-success/20 dark:bg-success/20 dark:text-success';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'normal':
        return <Target className="h-4 w-4 text-amber-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-success" />;
    }
  };

  const filteredInsights = insights.filter(insight => insight.type === activeTab);

  return (
    <div className={className}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground dark:text-primary-foreground mb-2">
          Trinity Intelligence Engine
        </h3>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          AI-powered insights for organizational optimization and decision support
        </p>
      </div>

      {/* Trinity Tabs */}
      <div className="flex gap-2 mb-6">
        {(['think', 'see', 'act'] as const).map((type) => {
          const config = getTabConfig(type);
          const isActive = activeTab === type;
          
          return (
            <Button
              key={type}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(type)}
              className={`flex items-center gap-2 ${
                isActive 
                  ? `bg-${config.color}-600 hover:bg-${config.color}-700 text-primary-foreground` 
                  : `hover:bg-${config.color}-50 dark:hover:bg-${config.color}-950/20`
              }`}
            >
              {config.icon}
              <span className="font-semibold">🔵 {config.label}</span>
              <span className="text-xs opacity-75">{config.description}</span>
            </Button>
          );
        })}
      </div>

      {/* Insights Grid */}
      <div className="grid gap-4">
        {filteredInsights.map((insight, index) => (
          <Card key={index} className="relative overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getUrgencyIcon(insight.urgency)}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground dark:text-primary-foreground mb-1">
                      {insight.title}
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={getImpactColor(insight.impact)}>
                        {insight.impact} impact
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {insight.urgency}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-muted-foreground dark:text-muted-foreground mb-4">
                {insight.description}
              </p>

              {/* Departments Affected */}
              <div className="mb-4">
                <div className="text-xs font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                  Departments Affected:
                </div>
                <div className="flex flex-wrap gap-1">
                  {insight.departments.map((dept, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {dept}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              {insight.recommendation && (
                <div className="bg-background dark:bg-background/50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-primary dark:text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-foreground dark:text-primary-foreground mb-1">
                        Recommended Action:
                      </div>
                      <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                        {insight.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Estimated Value */}
              {insight.estimatedValue && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                    Estimated Value:
                  </span>
                  <Badge className="bg-success/10 text-success border-success/20 dark:bg-success/20 dark:text-success">
                    {insight.estimatedValue}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary dark:text-primary">
              {insights.filter(i => i.type === 'think').length}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">
              Pattern Insights
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary dark:text-secondary">
              {insights.filter(i => i.type === 'see').length}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">
              Live Alerts
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-warning dark:text-warning">
              {insights.filter(i => i.type === 'act').length}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">
              Auto Actions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrinityInsightsEngine; 