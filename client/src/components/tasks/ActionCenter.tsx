import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Target, Zap, Play, CheckCircle, Brain, Users, Calendar, BarChart3, RefreshCw, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';

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
      console.error('Error fetching actions: ', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskActions = async (): Promise<ActionItem[]> => {
    const actions: ActionItem[] = [];

    try {
      // Get tasks from thoughts system using API client
      const { data: tasks, error } = await select('thoughts', {
        filters: {
          user_id: user?.id,
          category: 'task',
          status: ['pending', 'in_progress', 'due']
        },
        orderBy: { created_at: 'desc' }
      });

      if (error) {
        console.error('Error fetching tasks:', error);
        return actions;
      }

      if (tasks && Array.isArray(tasks)) {
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
      console.error('Error fetching task actions: ', error);
    }

    return actions;
  };

  const fetchAutomationActions = async (): Promise<ActionItem[]> => {
    const actions: ActionItem[] = [];

    try {
      // Get automation opportunities from integrations
      const { data: integrations, error } = await select('user_integrations', {
        filters: {
          user_id: user?.id,
          status: 'connected'
        }
      });

      if (error) {
        console.error('Error fetching integrations:', error);
        return actions;
      }

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
    } catch (error) {
      console.error('Error fetching automation actions: ', error);
    }

    return actions;
  };

  const fetchDecisionActions = async (): Promise<ActionItem[]> => {
    const actions: ActionItem[] = [];

    try {
      // Get pending decisions from thoughts system
      const { data: decisions, error } = await select('thoughts', {
        filters: {
          user_id: user?.id,
          category: 'decision',
          status: 'pending'
        },
        orderBy: { created_at: 'desc' }
      });

      if (error) {
        console.error('Error fetching decisions:', error);
        return actions;
      }

      if (decisions && Array.isArray(decisions)) {
        decisions.forEach(decision => {
          actions.push({
            id: decision.id,
            title: decision.content,
            description: `Decision needed: ${decision.context || 'business decision'}`,
            type: 'decision',
            priority: decision.priority || 'medium',
            effort: 'quick',
            impact: 'high',
            status: decision.status as any,
            estimatedTime: 30,
            source: 'Decision Management',
            context: decision.department,
            aiAssisted: true
          });
        });
      }
    } catch (error) {
      console.error('Error fetching decision actions: ', error);
    }

    return actions;
  };

  const fetchMeetingActions = async (): Promise<ActionItem[]> => {
    const actions: ActionItem[] = [];

    try {
      // Get scheduled meetings and follow-ups
      const { data: meetings, error } = await select('thoughts', {
        filters: {
          user_id: user?.id,
          category: 'meeting',
          status: ['pending', 'scheduled']
        },
        orderBy: { created_at: 'desc' }
      });

      if (error) {
        console.error('Error fetching meetings:', error);
        return actions;
      }

      if (meetings && Array.isArray(meetings)) {
        meetings.forEach(meeting => {
          actions.push({
            id: meeting.id,
            title: meeting.content,
            description: `Meeting: ${meeting.context || 'team meeting'}`,
            type: 'meeting',
            priority: meeting.priority || 'medium',
            effort: 'moderate',
            impact: 'medium',
            status: meeting.status as any,
            dueDate: meeting.due_date ? new Date(meeting.due_date) : undefined,
            estimatedTime: 60,
            source: 'Calendar',
            context: meeting.department,
            aiAssisted: true
          });
        });
      }
    } catch (error) {
      console.error('Error fetching meeting actions: ', error);
    }

    return actions;
  };

  const handleStartAction = async (action: ActionItem) => {
    try {
      // Update action status to in_progress
      if (action.id.startsWith('email-followup-automation') || action.id.startsWith('data-sync-automation')) {
        // Handle automation actions
        console.log('Starting automation:', action.title);
        // You can add automation logic here
      } else {
        // Update task/decision/meeting status
        const { error } = await updateOne('thoughts', action.id, {
          status: 'in_progress',
          updated_at: new Date().toISOString()
        });

        if (error) {
          console.error('Error updating action status:', error);
        } else {
          // Refresh actions
          fetchActions();
        }
      }
    } catch (error) {
      console.error('Error starting action:', error);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'task': return <Target className="w-4 h-4" />;
      case 'automation': return <Zap className="w-4 h-4" />;
      case 'decision': return <Brain className="w-4 h-4" />;
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'analysis': return <BarChart3 className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'quick': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'intensive': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredActions = actions.filter(action => {
    const matchesTab = selectedTab === 'all' || action.type === selectedTab;
    const matchesPriority = filterPriority === 'all' || action.priority === filterPriority;
    return matchesTab && matchesPriority;
  });

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
                  <div key={action.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
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
