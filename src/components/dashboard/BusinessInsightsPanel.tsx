import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { TrendingUp, AlertTriangle, CheckCircle2, Lightbulb, ArrowRight, DollarSign, Users, Target, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'alert' | 'achievement' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  metric?: string;
  change?: string;
  actionable?: boolean;
  category: 'revenue' | 'operations' | 'team' | 'customer' | 'efficiency';
}

interface BusinessInsightsPanelProps {
  className?: string;
}

const mockInsights: BusinessInsight[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'Close 3 High-Value Deals This Week',
    description: 'You have 3 deals worth $180K in negotiation stage. Focus on closing these before month-end.',
    impact: 'high',
    metric: '$180K',
    change: 'potential revenue',
    actionable: true,
    category: 'revenue'
  },
  {
    id: '2',
    type: 'alert',
    title: 'Review 5 Support Tickets',
    description: 'Customer response time increased 15%. Review these escalated tickets to prevent churn.',
    impact: 'high',
    metric: '5 tickets',
    change: 'need attention',
    actionable: true,
    category: 'customer'
  },
  {
    id: '3',
    type: 'opportunity',
    title: 'Automate Invoice Processing',
    description: 'Set up automated invoice processing to save 8 hours/week and reduce errors by 90%.',
    impact: 'medium',
    metric: '8 hrs/week',
    change: 'time savings',
    actionable: true,
    category: 'efficiency'
  },
  {
    id: '4',
    type: 'achievement',
    title: 'Celebrate Team Success',
    description: 'Your team exceeded monthly targets by 12%. Consider team recognition or bonus.',
    impact: 'medium',
    metric: '+12%',
    change: 'above target',
    actionable: true,
    category: 'team'
  },
  {
    id: '5',
    type: 'alert',
    title: 'Schedule Q4 Planning Session',
    description: 'Q4 planning is due. Schedule sessions with department heads to set goals and budgets.',
    impact: 'high',
    metric: '4 sessions',
    change: 'overdue',
    actionable: true,
    category: 'operations'
  },
  {
    id: '6',
    type: 'opportunity',
    title: 'Upsell to 8 Existing Customers',
    description: 'Analysis shows 8 customers are ready for premium features. Reach out this week.',
    impact: 'medium',
    metric: '8 customers',
    change: 'ready to upgrade',
    actionable: true,
    category: 'revenue'
  }
];

export const BusinessInsightsPanel: React.FC<BusinessInsightsPanelProps> = ({ className = '' }) => {
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate loading real data
  useEffect(() => {
    const loadInsights = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real app, this would be an API call
        setInsights(mockInsights);
      } catch (err) {
        setError('Failed to load business insights. Please try again.');
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error loading insights: ', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInsights();
  }, []);

  const getInsightIcon = (type: BusinessInsight['type']) => {
    switch (type) {
      case 'achievement':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'opportunity':
        return <Lightbulb className="w-5 h-5 text-primary" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-secondary" />;
      default: return <CheckCircle2 className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getInsightColor = (type: BusinessInsight['type']) => {
    switch (type) {
      case 'achievement':
        return 'border-success/80 bg-success/40 hover:bg-success/50 text-success-foreground shadow-sm';
      case 'opportunity':
        return 'border-primary/80 bg-primary/40 hover:bg-primary/50 text-primary-foreground shadow-sm';
      case 'alert':
        return 'border-warning/80 bg-warning/40 hover:bg-warning/50 text-warning-foreground shadow-sm';
      case 'trend':
        return 'border-secondary/80 bg-secondary/40 hover:bg-secondary/50 text-secondary-foreground shadow-sm';
      default:
        return 'border-border/80 bg-muted/40 hover:bg-muted/50 text-foreground shadow-sm';
    }
  };

  const getImpactBadge = (impact: BusinessInsight['impact']) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive" className="bg-destructive/40 text-destructive border-destructive/70 font-semibold">High Impact</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-warning/40 text-warning border-warning/70 font-semibold">Medium Impact</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-muted/35 text-muted-foreground border-muted/60 font-medium">Low Impact</Badge>;
    }
  };

  const getCategoryIcon = (category: BusinessInsight['category']) => {
    switch (category) {
      case 'revenue':
        return <DollarSign className="w-4 h-4" />;
      case 'team':
        return <Users className="w-4 h-4" />;
      case 'customer':
        return <Target className="w-4 h-4" />;
      case 'operations':
        return <Clock className="w-4 h-4" />;
      case 'efficiency':
        return <Zap className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  const categories = ['all', 'revenue', 'team', 'customer', 'operations', 'efficiency'];

  const handleRetry = () => {
    setInsights([]);
    setError(null);
    setIsLoading(true);
    
    // Retry loading
    setTimeout(() => {
      setInsights(mockInsights);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-primary" />
            Business Insights
          </CardTitle>
          <CardDescription>
            AI-powered insights about your business performance and opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRetry} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <div className="space-y-4">
              <div className="flex space-x-2 mb-6">
                {categories.map((category) => (
                  <div key={category} className="h-8 bg-muted animate-pulse rounded w-20"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-5 w-5 bg-muted animate-pulse rounded"></div>
                      <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="h-5 bg-muted animate-pulse rounded mb-2"></div>
                    <div className="h-4 bg-muted animate-pulse rounded mb-3 w-3/4"></div>
                    <div className="h-8 bg-muted animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && (
            <>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category === 'all' ? 'All' : category}
                  </Button>
                ))}
              </div>

              {/* Insights Grid */}
              <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                {filteredInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${getInsightColor(insight.type)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <div className="flex items-center gap-1 text-xs text-foreground">
                          {getCategoryIcon(insight.category)}
                          <span className="capitalize">{insight.category}</span>
                        </div>
                      </div>
                      {getImpactBadge(insight.impact)}
                    </div>

                    <h4 className="font-semibold mb-2 text-current">{insight.title}</h4>
                    <p className="text-sm mb-3 text-foreground">{insight.description}</p>

                    {insight.metric && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-current">{insight.metric}</span>
                        <span className="text-xs text-foreground">{insight.change}</span>
                      </div>
                    )}

                    {insight.actionable && (
                      <Button size="sm" variant="outline" className="w-full border-current/30 hover:bg-current/10">
                        Take Action
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>

              {filteredInsights.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No insights available for this category</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 