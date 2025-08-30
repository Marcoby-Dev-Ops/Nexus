import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Brain, 
  ArrowRight,
  Zap,
  Target,
  Clock
} from 'lucide-react';
import { analyticsService } from '@/services/core/AnalyticsService';
import { businessHealthService } from '@/core/services/BusinessHealthService';
import { useAuth } from '@/hooks/index';
import { logger } from '@/shared/utils/logger';

export interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'achievement' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: number;
  confidence: number;
  timeToValue: number;
  effort: number;
  dataSource: string[];
  suggestedActions: string[];
  automationPotential: string | null;
  createdAt: string;
  status: 'active' | 'resolved' | 'dismissed';
}

interface BusinessInsightsPanelProps {
  maxInsights?: number;
  showAutomations?: boolean;
  compact?: boolean;
}

export function BusinessInsightsPanel({ 
  maxInsights = 5, 
  showAutomations = true, 
  compact = false 
}: BusinessInsightsPanelProps) {
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadInsights = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Load insights from analytics service
        const insightsResult = await analyticsService.getInsights({ user_id: user.id });
        if (insightsResult.success && insightsResult.data) {
          const realInsights: BusinessInsight[] = insightsResult.data.map((insight: any, index: number) => ({
            id: insight.id || `insight-${index}`,
            type: insight.insight_type || 'recommendation',
            priority: insight.priority || 'medium',
            category: insight.category || 'Business Intelligence',
            title: insight.title || `AI Insight ${index + 1}`,
            description: insight.description || insight.insight_data?.description || 'AI-generated business insight',
            impact: insight.impact || 5,
            confidence: insight.confidence_score || 0.8,
            timeToValue: insight.time_to_value || 30,
            effort: insight.effort || 3,
            dataSource: insight.data_source || ['analytics'],
            suggestedActions: insight.suggested_actions || [],
            automationPotential: insight.automation_potential || null,
            createdAt: insight.created_at || new Date().toISOString(),
            status: 'active'
          }));
          setInsights(realInsights);
        }

        // If no insights from analytics, generate some based on business health
        if (!insightsResult.success || !insightsResult.data || insightsResult.data.length === 0) {
          const healthResult = await businessHealthService.readLatest();
          if (healthResult.success && healthResult.data) {
            const healthData = healthResult.data;
            const generatedInsights: BusinessInsight[] = [];

            if (healthData.overall_score < 70) {
              generatedInsights.push({
                id: 'health-improvement',
                type: 'recommendation',
                priority: 'high',
                category: 'Business Health',
                title: 'Improve Business Health Score',
                description: `Your business health score is ${healthData.overall_score}%. Focus on areas with lower scores to improve overall performance.`,
                impact: 8,
                confidence: 0.9,
                timeToValue: 60,
                effort: 4,
                dataSource: ['business-health'],
                suggestedActions: ['Review business metrics', 'Complete missing data', 'Connect more integrations'],
                automationPotential: 'Automated health monitoring',
                createdAt: new Date().toISOString(),
                status: 'active'
              });
            }

            if (healthData.completion_percentage < 80) {
              generatedInsights.push({
                id: 'profile-completion',
                type: 'opportunity',
                priority: 'medium',
                category: 'Profile Completion',
                title: 'Complete Your Business Profile',
                description: `Your profile is ${healthData.completion_percentage}% complete. Complete it for better insights and recommendations.`,
                impact: 6,
                confidence: 0.95,
                timeToValue: 15,
                effort: 2,
                dataSource: ['profile'],
                suggestedActions: ['Fill missing business information', 'Add company details', 'Connect business tools'],
                automationPotential: null,
                createdAt: new Date().toISOString(),
                status: 'active'
              });
            }

            setInsights(generatedInsights);
          }
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load business insights';
        setError(errorMessage);
        logger.error('Error loading business insights', { error: err, userId: user.id });
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [user?.id]);

  const getInsightIcon = (type: BusinessInsight['type']) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'achievement': return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'recommendation': return <Brain className="h-4 w-4 text-accent" />;
      default: return <Brain className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'low': return 'bg-primary/20 text-primary border-primary/30';
      default: return 'bg-muted/30 text-muted-foreground border-border';
    }
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 8) return 'text-success';
    if (impact >= 6) return 'text-warning';
    return 'text-destructive';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Unable to load insights</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-sm">
            <Brain className="w-4 h-4 mr-2" />
            Business Insights
            <Badge variant="outline" className="ml-auto text-xs">
              {insights.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.slice(0, maxInsights).map((insight) => (
            <div key={insight.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
              {getInsightIcon(insight.type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{insight.title}</p>
                <p className="text-xs text-muted-foreground truncate">{insight.description}</p>
              </div>
              <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                {insight.priority}
              </Badge>
            </div>
          ))}
          {insights.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <Brain className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No insights available</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          Business Insights
          <Badge variant="outline" className="ml-auto">
            {insights.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.slice(0, maxInsights).map((insight) => (
          <div key={insight.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getInsightIcon(insight.type)}
                <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                  {insight.priority}
                </Badge>
                <span className="text-xs text-muted-foreground">{insight.category}</span>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${getImpactColor(insight.impact)}`}>
                  Impact: {insight.impact}/10
                </div>
                <div className="text-xs text-muted-foreground">
                  Confidence: {(insight.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{insight.timeToValue}m</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>Effort: {insight.effort}/5</span>
                </div>
              </div>
              
              {insight.automationPotential && (
                <div className="flex items-center space-x-1 text-primary">
                  <Zap className="w-3 h-3" />
                  <span>Automation available</span>
                </div>
              )}
            </div>
            
            {insight.suggestedActions.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium mb-2">Suggested Actions:</p>
                <div className="space-y-1">
                  {insight.suggestedActions.map((action, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                Data sources: {insight.dataSource.join(', ')}
              </div>
              <Button size="sm" variant="outline">
                Take Action
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        ))}
        
        {insights.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium mb-2">No insights available</p>
            <p className="text-xs">Complete your business profile and connect data sources for personalized insights</p>
            <Button size="sm" className="mt-4">
              Complete Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
