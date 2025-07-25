import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Progress } from '@/shared/components/ui/Progress.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs.tsx';
import { Target, Zap, Play, CheckCircle, Brain, Users, Calendar, BarChart3, RefreshCw, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { supabase } from '@/lib/supabase';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'task' | 'automation' | 'decision' | 'meeting' | 'analysis' | 'optimization';
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'quick' | 'moderate' | 'intensive';
  impact: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
  dueDate?: Date;
  estimatedTime?: number; // in minutes
  source: string;
  context?: string;
  automationPossible?: boolean;
  aiAssisted?: boolean;
}

interface ActionCenterProps {
  className?: string;
}

export const ActionCenter: React.FC<ActionCenterProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      setLoading(true);
      
      // Fetch actions from multiple sources
      const [
        taskActions,
        automationActions,
        decisionActions,
        meetingActions
      ] = await Promise.all([
        fetchTaskActions(),
        fetchAutomationActions(),
        fetchDecisionActions(),
        fetchMeetingActions()
      ]);

      const allActions = [
        ...taskActions,
        ...automationActions,
        ...decisionActions,
        ...meetingActions
      ].sort((a, b) => {
        // Sort by priority and effort
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const effortOrder = { quick: 0, moderate: 1, intensive: 2 };
        
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return effortOrder[a.effort] - effortOrder[b.effort];
      });

      setActions(allActions);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching actions: ', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskActions = async (): Promise<ActionItem[]> => {
    const actions: ActionItem[] = [];

    try {
      // Get tasks from thoughts system
      const { data: tasks } = await supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('category', 'task')
        .in('status', ['pending', 'in_progress', 'due'])
        .order('created_at', { ascending: false });

      if (tasks) {
        tasks.forEach(task => {
          actions.push({
            id: task.id,
            title: task.content,
            description: `Task from ${task.source || 'personal thoughts'}`,
            type: 'task',
            priority: task.priority || 'medium',
            effort: task.estimated_effort ? 
              (task.estimated_effort.includes('h') ? 'moderate' : 'quick') : 'moderate',
            impact: 'medium',
            status: task.status as any,
            dueDate: task.due_date ? new Date(task.due_date) : undefined,
            estimatedTime: task.estimated_effort ? 
              parseInt(task.estimated_effort.replace(/\D/g, '')) * 60: 30,
            source: 'Personal Tasks',
            context: task.department,
            aiAssisted: true
          });
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching task actions: ', error);
    }

    return actions;
  };

  const fetchAutomationActions = async (): Promise<ActionItem[]> => {
    const actions: ActionItem[] = [];

    try {
      // Get automation opportunities
      const { data: integrations } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (integrations) {
        // Check for manual processes that could be automated
        const manualProcesses = [
          {
            id: 'email-followup-automation',
            title: 'Automate Email Follow-ups',
            description: 'Set up automated follow-up sequences for leads and customers',
            type: 'automation' as const,
            priority: 'high' as const,
            effort: 'moderate' as const,
            impact: 'high' as const,
            status: 'pending' as const,
            estimatedTime: 120,
            source: 'Email Integration',
            automationPossible: true,
            aiAssisted: true
          },
          {
            id: 'data-sync-automation',
            title: 'Automate Data Synchronization',
            description: 'Set up automatic data sync between your connected platforms',
            type: 'automation' as const,
            priority: 'medium' as const,
            effort: 'moderate' as const,
            impact: 'medium' as const,
            status: 'pending' as const,
            estimatedTime: 90,
            source: 'Integration Management',
            automationPossible: true,
            aiAssisted: true
          }
        ];

        actions.push(...manualProcesses);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching automation actions: ', error);
    }

    return actions;
  };

  const fetchDecisionActions = async (): Promise<ActionItem[]> => {
    const actions: ActionItem[] = [];

    try {
      // Get pending decisions from business insights
      const { data: businessData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (businessData) {
        // Generate decision actions based on business context
        if (businessData.revenue_trend === 'declining') {
          actions.push({
            id: 'revenue-strategy-decision',
            title: 'Decide on Revenue Strategy',
            description: 'Choose between pricing optimization, new markets, or product expansion',
            type: 'decision',
            priority: 'critical',
            effort: 'intensive',
            impact: 'high',
            status: 'pending',
            estimatedTime: 180,
            source: 'Business Analytics',
            aiAssisted: true
          });
        }

        if (businessData.customer_satisfaction_score && businessData.customer_satisfaction_score < 7) {
          actions.push({
            id: 'customer-experience-decision',
            title: 'Improve Customer Experience',
            description: 'Decide on customer service improvements or product enhancements',
            type: 'decision',
            priority: 'high',
            effort: 'moderate',
            impact: 'high',
            status: 'pending',
            estimatedTime: 120,
            source: 'Customer Analytics',
            aiAssisted: true
          });
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching decision actions: ', error);
    }

    return actions;
  };

  const fetchMeetingActions = async (): Promise<ActionItem[]> => {
    const actions: ActionItem[] = [];

    try {
      // Get upcoming meetings and required preparations
      const { data: meetings } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user?.id)
        .gte('start_time', new Date().toISOString())
        .lte('start_time', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('start_time', { ascending: true });

      if (meetings) {
        meetings.forEach(meeting => {
          actions.push({
            id: `meeting-prep-${meeting.id}`,
            title: `Prepare for: ${meeting.title}`,
            description: `Meeting scheduled for ${new Date(meeting.start_time).toLocaleDateString()}`,
            type: 'meeting',
            priority: meeting.priority || 'medium',
            effort: 'quick',
            impact: 'medium',
            status: 'pending',
            dueDate: new Date(meeting.start_time),
            estimatedTime: 30,
            source: 'Calendar',
            aiAssisted: true
          });
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching meeting actions: ', error);
    }

    return actions;
  };

  const getActionIcon = (type: ActionItem['type']) => {
    switch (type) {
      case 'task': return <CheckCircle className="w-4 h-4" />;
      case 'automation': return <Zap className="w-4 h-4" />;
      case 'decision': return <Brain className="w-4 h-4" />;
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'analysis': return <BarChart3 className="w-4 h-4" />;
      case 'optimization': return <TrendingUp className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: ActionItem['effort']) => {
    switch (effort) {
      case 'quick': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'intensive': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleStartAction = async (action: ActionItem) => {
    try {
      // Update action status to in_progress
      if (action.type === 'task') {
        await supabase
          .from('thoughts')
          .update({ status: 'in_progress' })
          .eq('id', action.id);
      }

      // Navigate to appropriate workspace
      switch (action.type) {
        case 'task':
          window.location.href = '/knowledge/thoughts';
          break;
        case 'automation':
          window.location.href = '/workspace/automation';
          break;
        case 'decision':
          window.location.href = '/workspace/decision-support';
          break;
        case 'meeting':
          window.location.href = '/workspace/calendar';
          break;
        default: window.location.href = '/workspace';
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error starting action: ', error);
    }
  };

  const filteredActions = actions.filter(action => {
    if (selectedTab !== 'all' && action.type !== selectedTab) return false;
    if (filterPriority !== 'all' && action.priority !== filterPriority) return false;
    return true;
  });

  const getTabLabel = (type: string) => {
    switch (type) {
      case 'all': return 'All Actions';
      case 'task': return 'Tasks';
      case 'automation': return 'Automation';
      case 'decision': return 'Decisions';
      case 'meeting': return 'Meetings';
      case 'analysis': return 'Analysis';
      case 'optimization': return 'Optimization';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Action Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Action Center
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How do you want to address what's going on in your world?
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="task">Tasks</TabsTrigger>
            <TabsTrigger value="automation">Auto</TabsTrigger>
            <TabsTrigger value="decision">Decide</TabsTrigger>
            <TabsTrigger value="meeting">Meet</TabsTrigger>
            <TabsTrigger value="analysis">Analyze</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium">Filter by Priority: </span>
              <select 
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">No Actions Required</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                filteredActions.map((action) => (
                  <div key={action.id} className="border rounded-lg p-4 hover: bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          {getActionIcon(action.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{action.title}</h3>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getPriorityColor(action.priority)}>
                          {action.priority}
                        </Badge>
                        <Badge variant="outline" className={getEffortColor(action.effort)}>
                          {action.effort}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Impact: {action.impact}</span>
                        <span>Time: {action.estimatedTime}min</span>
                        <span>Source: {action.source}</span>
                        {action.aiAssisted && (
                          <span className="flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            AI Assisted
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {action.automationPossible && (
                          <Badge variant="outline" className="text-blue-600">
                            <Zap className="w-3 h-3 mr-1" />
                            Auto
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          onClick={() => handleStartAction(action)}
                          className="flex items-center gap-1"
                          aria-label={`Start action: ${action.title}`}
                        >
                          <Play className="w-3 h-3" />
                          Start
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Tabs>

        <div className="mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchActions}
            className="w-full"
            aria-label="Refresh action center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Actions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 