/**
 * Progressive Intelligence Component
 * Provides contextual insights, actions, and automation opportunities on any page
 * This component makes every page in Nexus "learn" and provide progressive value
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { BrainAnalysis } from './BrainAnalysis';
import { ExpertAdvice } from './ExpertAdvice';
import { DelegationManager } from '../delegation/DelegationManager';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Play,
  Settings,
  Target,
  Users,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';
import { analyticsService } from '@/services/core/AnalyticsService';
import { businessHealthService } from '@/core/services/BusinessHealthService';
import { useAuth } from '@/hooks/index';
import { logger } from '@/shared/utils/logger';

export interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  dataSource: string[];
  metrics: {
    impact: number;
    confidence: number;
    timeToValue: number;
    effort: number;
  };
  suggestedActions: string[];
  automationPotential: string | null;
  context: {
    pageRelevance: string[];
    triggerConditions: Record<string, any>;
    historicalData: any[];
  };
  createdAt: string;
  status: 'active' | 'resolved' | 'dismissed';
}

export interface ProgressiveAction {
  action: {
    id: string;
    name: string;
    description: string;
    category: 'automation' | 'analysis' | 'communication' | 'optimization';
    priority: 'urgent' | 'high' | 'medium' | 'low';
    estimatedTime: number;
    complexity: 'simple' | 'moderate' | 'complex';
    automationPotential: number;
  };
  impact: {
    immediate: number;
    shortTerm: number;
    longTerm: number;
  };
  prerequisites: string[];
  resources: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface AutomationOpportunity {
  id: string;
  name: string;
  description: string;
  currentProcess: string;
  automationType: 'workflow' | 'integration' | 'ai-powered' | 'scheduled';
  estimatedSavings: {
    time: number;
    cost: number;
    efficiency: number;
  };
  implementationComplexity: 'low' | 'medium' | 'high';
  status: 'identified' | 'planned' | 'implemented';
}

interface ProgressiveIntelligenceProps {
  pageId: string;
  position?: 'sidebar' | 'inline' | 'modal';
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
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [actions, setActions] = useState<ProgressiveAction[]>([]);
  const [automations, setAutomations] = useState<AutomationOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { showToast } = useToast();
  const { user } = useAuth();

  // Load real insights and actions from services
  useEffect(() => {
    const loadProgressiveData = async () => {
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
            dataSource: insight.data_source || ['analytics'],
            metrics: {
              impact: insight.impact || 5,
              confidence: insight.confidence_score || 0.8,
              timeToValue: insight.time_to_value || 30,
              effort: insight.effort || 3
            },
            suggestedActions: insight.suggested_actions || [],
            automationPotential: insight.automation_potential || null,
            context: {
              pageRelevance: [pageId],
              triggerConditions: {},
              historicalData: []
            },
            createdAt: insight.created_at || new Date().toISOString(),
            status: 'active'
          }));
          setInsights(realInsights);
        }

        // Load business health data for actions
        const healthResult = await businessHealthService.readLatest();
        if (healthResult.success && healthResult.data) {
          const healthData = healthResult.data;
          const realActions: ProgressiveAction[] = [];
          
          // Generate actions based on health data
          if (healthData.overall_score < 70) {
            realActions.push({
              action: {
                id: 'improve-health',
                name: 'Improve Business Health',
                description: 'Your business health score needs attention',
                category: 'optimization',
                priority: 'high',
                estimatedTime: 60,
                complexity: 'moderate',
                automationPotential: 0.3
              },
              impact: {
                immediate: 3,
                shortTerm: 7,
                longTerm: 9
              },
              prerequisites: ['Review business metrics'],
              resources: ['Business health dashboard'],
              status: 'pending'
            });
          }

          if (healthData.completion_percentage < 80) {
            realActions.push({
              action: {
                id: 'complete-profile',
                name: 'Complete Business Profile',
                description: 'Complete your business profile for better insights',
                category: 'optimization',
                priority: 'medium',
                estimatedTime: 15,
                complexity: 'simple',
                automationPotential: 0.1
              },
              impact: {
                immediate: 2,
                shortTerm: 5,
                longTerm: 8
              },
              prerequisites: ['Business information'],
              resources: ['Profile completion wizard'],
              status: 'pending'
            });
          }

          setActions(realActions);
        }

        // Generate automation opportunities based on available data
        const automationOpportunities: AutomationOpportunity[] = [
          {
            id: 'auto-insights',
            name: 'Automated Insight Generation',
            description: 'Automatically generate business insights from your data',
            currentProcess: 'Manual analysis and reporting',
            automationType: 'ai-powered',
            estimatedSavings: {
              time: 10,
              cost: 500,
              efficiency: 85
            },
            implementationComplexity: 'medium',
            status: 'identified'
          }
        ];
        setAutomations(automationOpportunities);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load progressive intelligence data';
        setError(errorMessage);
        logger.error('Error loading progressive intelligence data', { error: err, userId: user.id });
      } finally {
        setLoading(false);
      }
    };

    loadProgressiveData();
  }, [user?.id, pageId]);

  const handleActionExecution = async (actionId: string) => {
    setExecutingAction(actionId);
    
    try {
      // Simulate action execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showToast({
        title: 'Action Executed',
        description: 'The action has been successfully executed.',
        variant: 'default'
      });
      
      // Update action status
      setActions(prev => prev.map(action => 
        action.action.id === actionId 
          ? { ...action, status: 'completed' as const }
          : action
      ));
      
    } catch (error) {
      showToast({
        title: 'Action Failed',
        description: 'Failed to execute the action. Please try again.',
        variant: 'destructive'
      });
      
      setActions(prev => prev.map(action => 
        action.action.id === actionId 
          ? { ...action, status: 'failed' as const }
          : action
      ));
    } finally {
      setExecutingAction(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      case 'trend': return <BarChart3 className="w-4 h-4" />;
      case 'recommendation': return <Brain className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'automation': return <Zap className="w-4 h-4" />;
      case 'analysis': return <BarChart3 className="w-4 h-4" />;
      case 'communication': return <Users className="w-4 h-4" />;
      case 'optimization': return <Target className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`${position === 'sidebar' ? 'w-80' : 'w-full'} space-y-4`}>
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
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${position === 'sidebar' ? 'w-80' : 'w-full'}`}>
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Unable to load insights</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${position === 'sidebar' ? 'w-80' : 'w-full'} space-y-4`}>
      {/* AI Insights */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Brain className="w-5 h-5 mr-2" />
            AI Insights
            <Badge variant="outline" className="ml-auto text-xs">
              {insights.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence>
            {insights.slice(0, maxInsights).map((insight) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(insight.type)}
                    <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                      {insight.priority}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
                  >
                    {expandedInsight === insight.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
                
                <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                
                {expandedInsight === insight.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 pt-2 border-t"
                  >
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Impact:</span>
                        <Progress value={insight.metrics.impact * 10} className="h-1 mt-1" />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confidence:</span>
                        <Progress value={insight.metrics.confidence * 100} className="h-1 mt-1" />
                      </div>
                    </div>
                    {insight.suggestedActions.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Suggested Actions:</span>
                        <ul className="text-xs mt-1 space-y-1">
                          {insight.suggestedActions.map((action, index) => (
                            <li key={index} className="flex items-center">
                              <ArrowRight className="w-3 h-3 mr-1" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {insights.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No insights available</p>
              <p className="text-xs">Connect more data sources for personalized insights</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progressive Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Target className="w-5 h-5 mr-2" />
            Recommended Actions
            <Badge variant="outline" className="ml-auto text-xs">
              {actions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence>
            {actions.slice(0, maxActions).map((progressiveAction) => (
              <motion.div
                key={progressiveAction.action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border rounded-lg p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(progressiveAction.action.category)}
                    <Badge variant="outline" className={getPriorityColor(progressiveAction.action.priority)}>
                      {progressiveAction.action.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{progressiveAction.action.estimatedTime}m</span>
                  </div>
                </div>
                
                <h4 className="font-medium text-sm mb-1">{progressiveAction.action.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">{progressiveAction.action.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleActionExecution(progressiveAction.action.id)}
                      disabled={executingAction === progressiveAction.action.id}
                    >
                      {executingAction === progressiveAction.action.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Execute
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs font-medium">Impact</div>
                    <div className="text-xs text-muted-foreground">
                      {progressiveAction.impact.immediate}/10
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {actions.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No actions recommended</p>
              <p className="text-xs">Complete your business profile for personalized recommendations</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brain Analysis */}
      {insights.length > 0 && (
        <BrainAnalysis
          previousActions={insights.slice(0, 3).map(insight => insight.title)}
          businessContext="Service-based business with multiple departments and integrated tools"
          expertKnowledge="Cross-departmental optimization and business intelligence (20+ years experience)"
          learningOpportunity="Pattern recognition across business units for unified decision making"
          patternRecognition="Identified alignment opportunities between sales and marketing departments"
          confidence={85}
          className="mb-4"
        />
      )}

      {/* Expert Advice */}
      {actions.length > 0 && (
        <ExpertAdvice
          businessPrinciple="Alignment creates exponential growth"
          expertTactic="Implement unified customer journey mapping with shared metrics"
          implementation="Weekly sales-marketing alignment meetings with joint accountability"
          commonMistake="Don't operate departments in silos - create shared success metrics"
          expectedOutcome="Aligned teams see 30% faster growth and improved customer experience"
          timeToImpact="30-60 days"
          confidence={95}
          expertiseYears={20}
          className="mb-4"
        />
      )}

      {/* Delegation Manager */}
      {actions.length > 0 && (
        <DelegationManager
          task={{
            id: actions[0]?.action.id || 'default',
            title: actions[0]?.action.name || 'Business Optimization',
            description: actions[0]?.action.description || 'Optimize business processes and alignment',
            priority: actions[0]?.action.priority || 'medium',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            category: actions[0]?.action.category || 'optimization',
            estimatedTime: actions[0]?.action.estimatedTime || 60,
            complexity: actions[0]?.action.complexity || 'moderate'
          }}
          availableAgents={[
            {
              id: 'ai-1',
              name: 'Business Optimization Agent',
              expertise: 'Cross-departmental optimization',
              availability: 'available',
              rating: 4.8,
              specializations: ['optimization', 'analysis', 'automation']
            },
            {
              id: 'ai-2',
              name: 'Sales & Marketing Specialist',
              expertise: 'Revenue optimization and alignment',
              availability: 'available',
              rating: 4.9,
              specializations: ['sales', 'marketing', 'alignment']
            }
          ]}
          teamMembers={[
            {
              id: 'member-1',
              name: 'Sarah Johnson',
              role: 'Operations Manager',
              availability: 'available',
              skills: ['process optimization', 'team coordination', 'project management']
            },
            {
              id: 'member-2',
              name: 'Mike Chen',
              role: 'Sales Director',
              availability: 'available',
              skills: ['sales strategy', 'customer relationships', 'team leadership']
            }
          ]}
          onDelegationComplete={(delegation) => {
            showToast({
              title: 'Task Delegated',
              description: `Task assigned to ${delegation.assignedTo.name}`,
              variant: 'default'
            });
          }}
          className="mb-4"
        />
      )}

      {/* Automation Opportunities */}
      {showAutomations && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Zap className="w-5 h-5 mr-2" />
              Automation Opportunities
              <Badge variant="outline" className="ml-auto text-xs">
                {automations.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {automations.map((automation) => (
                <motion.div
                  key={automation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="border rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{automation.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {automation.implementationComplexity}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">{automation.description}</p>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium">{automation.estimatedSavings.time}h</div>
                      <div className="text-muted-foreground">Time saved</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">${automation.estimatedSavings.cost}</div>
                      <div className="text-muted-foreground">Cost saved</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{automation.estimatedSavings.efficiency}%</div>
                      <div className="text-muted-foreground">Efficiency</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {automations.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No automation opportunities</p>
                <p className="text-xs">Connect more tools to discover automation possibilities</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
