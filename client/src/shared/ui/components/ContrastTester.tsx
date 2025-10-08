import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Eye, EyeOff, CheckCircle, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';

interface ContrastDemoProps {
  bgColor: string;
  textColor: string;
  label: string;
  className?: string;
}

const ContrastDemo: React.FC<ContrastDemoProps> = ({ bgColor, textColor, label, className = '' }) => (
  <div className={`p-3 rounded border ${bgColor} ${textColor} ${className}`}>
    <div className="text-sm font-medium">{label}</div>
    <div className="text-xs opacity-80">Sample text for readability testing</div>
  </div>
);

export const ContrastTester: React.FC = () => {
  const [showContrast, setShowContrast] = useState(false);

  const testCards = [
    {
      type: 'achievement',
      title: 'Revenue Growth Achieved',
      description: 'Monthly revenue increased by 23.5% compared to last month',
      impact: 'high',
      metric: '$45,230',
      change: '+23.5%'
    },
    {
      type: 'opportunity',
      title: 'Marketing Optimization',
      description: 'Potential to increase conversion rate by 15% with A/B testing',
      impact: 'medium',
      metric: '15%',
      change: 'potential'
    },
    {
      type: 'alert',
      title: 'Server Load Warning',
      description: 'High server utilization detected during peak hours',
      impact: 'high',
      metric: '87%',
      change: 'utilization'
    },
    {
      type: 'trend',
      title: 'Customer Satisfaction',
      description: 'Positive trend in customer feedback scores',
      impact: 'low',
      metric: '4.8/5',
      change: '+0.2'
    }
  ];

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'border-success/40 bg-success/20 hover:bg-success/25 text-success-foreground shadow-sm';
      case 'opportunity':
        return 'border-primary/40 bg-primary/20 hover:bg-primary/25 text-primary-foreground shadow-sm';
      case 'alert':
        return 'border-warning/40 bg-warning/20 hover:bg-warning/25 text-warning-foreground shadow-sm';
      case 'trend':
        return 'border-secondary/40 bg-secondary/20 hover:bg-secondary/25 text-secondary-foreground shadow-sm';
      default:
        return 'border-border/60 bg-muted/30 hover:bg-muted/40 text-foreground shadow-sm';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive" className="bg-destructive/15 text-destructive border-destructive/20">High Impact</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-warning/15 text-warning border-warning/20">Medium Impact</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-muted/30">Low Impact</Badge>;
      default:
        return null;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <CheckCircle className="w-5 h-5" />;
      case 'opportunity':
        return <Lightbulb className="w-5 h-5" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Card Contrast Testing</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContrast(!showContrast)}
            >
              {showContrast ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showContrast ? 'Hide' : 'Show'} Contrast Analysis
            </Button>
          </CardTitle>
        </CardHeader>
        {showContrast && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Light Mode Contrast</h4>
                <div className="space-y-2">
                  <ContrastDemo
                    bgColor="bg-background"
                    textColor="text-foreground"
                    label="Primary Text"
                  />
                  <ContrastDemo
                    bgColor="bg-muted"
                    textColor="text-muted-foreground"
                    label="Secondary Text"
                  />
                  <ContrastDemo
                    bgColor="bg-primary"
                    textColor="text-primary-foreground"
                    label="Primary Button"
                  />
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Dark Mode Contrast</h4>
                <div className="space-y-2 dark">
                  <ContrastDemo
                    bgColor="bg-background"
                    textColor="text-foreground"
                    label="Primary Text"
                  />
                  <ContrastDemo
                    bgColor="bg-muted"
                    textColor="text-muted-foreground"
                    label="Secondary Text"
                  />
                  <ContrastDemo
                    bgColor="bg-primary"
                    textColor="text-primary-foreground"
                    label="Primary Button"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enhanced Business Insights Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testCards.map((card, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${getInsightColor(card.type)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(card.type)}
                                    <div className="flex items-center gap-1 text-xs opacity-90">
                  <span className="capitalize">{card.type}</span>
                </div>
                  </div>
                  {getImpactBadge(card.impact)}
                </div>

                <h4 className="font-semibold mb-2 text-current">{card.title}</h4>
                <p className="text-sm opacity-95 mb-3">{card.description}</p>

                {card.metric && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-current">{card.metric}</span>
                    <span className="text-xs opacity-85">{card.change}</span>
                  </div>
                )}

                <Button size="sm" variant="outline" className="w-full border-current/30 hover:bg-current/10">
                  Take Action
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
