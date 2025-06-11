/**
 * Progressive Intelligence Component
 * Provides contextual insights, actions, and automation opportunities on any page
 * This component makes every page in Nexus "learn" and provide progressive value
 */

import React, { useState } from 'react';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  X, 
  ChevronRight,
  Lightbulb,
  Target,
  Rocket,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
// import { useSecondBrain } from '@/lib/hooks/useSecondBrain';
import type { 
  BusinessInsight, 
  ProgressiveAction, 
  AutomationOpportunity 
} from '@/lib/types/learning-system';

interface ProgressiveIntelligenceProps {
  pageId: string;
  position?: 'sidebar' | 'header' | 'floating' | 'inline';
  maxInsights?: number;
  maxActions?: number;
  showAutomations?: boolean;
  compact?: boolean;
}

export function ProgressiveIntelligence({
  pageId,
  position = 'sidebar',
  maxInsights = 3,
  maxActions = 2,
  showAutomations = true,
  compact = false
}: ProgressiveIntelligenceProps) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  
  // Mock data for demonstration - replace with actual hook when ready
  const mockInsights: BusinessInsight[] = [
    {
      id: 'insight-1',
      type: 'opportunity',
      priority: 'high',
      category: 'Revenue Growth',
      title: 'Website conversion rate is 23% above industry average',
      description: 'Your current conversion rate of 4.2% shows strong potential for scaling marketing efforts.',
      dataSource: ['google-analytics', 'stripe'],
      metrics: {
        impact: 9,
        confidence: 0.95,
        timeToValue: 15,
        effort: 2
      },
      suggestedActions: [],
      automationPotential: null,
      context: {
        pageRelevance: [pageId],
        triggerConditions: {},
        historicalData: []
      },
      createdAt: new Date().toISOString(),
      status: 'active'
    },
    {
      id: 'insight-2',
      type: 'risk',
      priority: 'medium',
      category: 'Team Performance',
      title: 'Response time increasing in customer support',
      description: 'Average response time has increased by 34% over the last week.',
      dataSource: ['zendesk', 'slack'],
      metrics: {
        impact: 7,
        confidence: 0.87,
        timeToValue: 30,
        effort: 3
      },
      suggestedActions: [],
      automationPotential: null,
      context: {
        pageRelevance: [pageId],
        triggerConditions: {},
        historicalData: []
      },
      createdAt: new Date().toISOString(),
      status: 'active'
    }
  ];

  const mockActions: ProgressiveAction[] = [
    {
      id: 'action-1',
      pageId,
      position: 'contextual',
      trigger: { type: 'page_load', conditions: {} },
      action: {
        id: 'optimize-landing-page',
        type: 'guided_workflow',
        title: 'Optimize Your Top Landing Page',
        description: 'Improve the page that drives 67% of your conversions',
        estimatedTime: 25,
        difficulty: 'medium',
        prerequisites: ['Google Analytics access'],
        steps: [],
        expectedOutcome: 'Increase conversion rate by 15-20%',
        trackingMetrics: ['conversion_rate', 'bounce_rate']
      },
      displayConfig: {
        style: 'card',
        variant: 'primary',
        dismissible: true,
        persistent: false
      },
      analytics: {
        impressions: 0,
        clicks: 0,
        completions: 0,
        dismissals: 0,
        avgTimeToAction: 0
      }
    }
  ];

  const mockAutomations: AutomationOpportunity[] = [
    {
      id: 'auto-1',
      title: 'Automated Customer Onboarding Sequence',
      description: 'Set up personalized email sequences based on user signup behavior',
      type: 'n8n_workflow',
      complexity: 'moderate',
      estimatedSetupTime: 45,
      estimatedTimeSavings: 180,
      requiredIntegrations: ['mailchimp', 'stripe', 'slack'],
      workflow: {
        trigger: { type: 'webhook', config: {}, description: 'New customer signup' },
        actions: []
      },
      riskLevel: 'low',
      testingRequired: true
    }
  ];

  const getInsightIcon = (type: BusinessInsight['type']) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'achievement': return <CheckCircle className="h-4 w-4 text-primary" />;
      default: return <Lightbulb className="h-4 w-4 text-secondary" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success/10 text-success';
      case 'medium': return 'bg-warning/10 text-yellow-800';
      case 'hard': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-foreground';
    }
  };

  const handleExecuteAction = async (actionId: string) => {
    setExecutingAction(actionId);
    // Simulate action execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    setExecutingAction(null);
    // TODO: Implement actual action execution
  };

  if (compact) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-card rounded-full p-4 shadow-lg border cursor-pointer hover:shadow-xl transition-shadow">
          <Brain className="h-6 w-6 text-secondary" />
          <Badge className="absolute -top-2 -right-2 px-1 min-w-[20px] h-5 text-xs">
            {mockInsights.length}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${position === 'sidebar' ? 'w-80' : 'w-full'}`}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-2 bg-secondary/10 rounded-lg">
          <Brain className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Nexus Intelligence</h3>
          <p className="text-sm text-muted-foreground">Learning from your business patterns</p>
        </div>
      </div>

      {/* Insights Section */}
      {mockInsights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Business Insights
              <Badge variant="secondary" className="ml-auto">
                {mockInsights.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockInsights.slice(0, maxInsights).map((insight) => (
              <div
                key={insight.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start gap-4">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {insight.title}
                      </h4>
                      <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {insight.description}
                    </p>
                    
                    {/* Metrics */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Impact: {insight.metrics.impact}/10
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {insight.metrics.timeToValue}m
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedInsight(
                      expandedInsight === insight.id ? null : insight.id
                    )}
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${
                      expandedInsight === insight.id ? 'rotate-90' : ''
                    }`} />
                  </Button>
                </div>

                {/* Expanded Content */}
                {expandedInsight === insight.id && (
                  <div className="pt-2 border-t space-y-2">
                    <div className="text-xs text-muted-foreground">
                      <strong>Data Sources:</strong> {insight.dataSource.join(', ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <strong>Confidence:</strong> {(insight.metrics.confidence * 100).toFixed(0)}%
                    </div>
                    {insight.automationPotential && (
                      <div className="text-xs text-secondary">
                        <Zap className="h-3 w-3 inline mr-1" />
                        Automation opportunity available
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Progressive Actions */}
      {mockActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Suggested Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockActions.slice(0, maxActions).map((progressiveAction) => {
              const action = progressiveAction.action;
              return (
                <div key={action.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground mb-1">
                        {action.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {action.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs">
                        <span className={`px-2 py-1 rounded-full ${getDifficultyColor(action.difficulty)}`}>
                          {action.difficulty}
                        </span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {action.estimatedTime}m
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      <strong>Expected Outcome:</strong> {action.expectedOutcome}
                    </div>
                    
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={executingAction === action.id}
                      onClick={() => handleExecuteAction(action.id)}
                    >
                      {executingAction === action.id ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-4 w-4 mr-2" />
                          Take Action
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Automation Opportunities */}
      {showAutomations && mockAutomations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Automation Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockAutomations.map((automation) => (
              <div key={automation.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-foreground mb-1">
                      {automation.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {automation.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Setup Time:</span>
                    <div className="font-medium">{automation.estimatedSetupTime}m</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Weekly Savings:</span>
                    <div className="font-medium text-success">
                      {Math.floor(automation.estimatedTimeSavings / 60)}h {automation.estimatedTimeSavings % 60}m
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <strong>Required:</strong> {automation.requiredIntegrations.join(', ')}
                </div>

                <Button size="sm" variant="outline" className="w-full">
                  <Settings className="h-3 w-3 mr-2" />
                  Set Up Automation
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 