import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Brain, Target, Lightbulb, Map, Play, TrendingUp, ArrowRight, RefreshCw, Activity, Eye } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthProvider';
import { supabase } from '@/core/supabase';

interface FireCycleItem {
  id: string;
  phase: 'focus' | 'insight' | 'roadmap' | 'execute';
  title: string;
  description: string;
  type: 'thought' | 'idea' | 'initiative' | 'goal' | 'learning' | 'action';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'paused' | 'archived';
  progress: number;
  impact: 'high' | 'medium' | 'low';
  effort: 'quick' | 'moderate' | 'intensive';
  dueDate?: Date;
  createdDate: Date;
  updatedDate: Date;
  tags: string[];
  aiInsights?: string[];
  nextSteps?: string[];
  relatedItems?: string[];
  businessContext?: string;
  personalContext?: string;
}

interface FireCycleManagerProps {
  className?: string;
}

export const FireCycleManager: React.FC<FireCycleManagerProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<FireCycleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState<'all' | 'focus' | 'insight' | 'roadmap' | 'execute'>('all');
  const [activeItem, setActiveItem] = useState<FireCycleItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchFireCycleItems();
  }, []);

  const fetchFireCycleItems = async () => {
    try {
      setLoading(true);
      
      // Fetch items from multiple sources
      const [
        thoughts,
        ideas,
        initiatives,
        goals,
        learnings,
        actions
      ] = await Promise.all([
        fetchThoughts(),
        fetchIdeas(),
        fetchInitiatives(),
        fetchGoals(),
        fetchLearnings(),
        fetchActions()
      ]);

      const allItems = [
        ...thoughts,
        ...ideas,
        ...initiatives,
        ...goals,
        ...learnings,
        ...actions
      ].sort((a, b) => {
        // Sort by phase order, then priority, then date
        const phaseOrder = { focus: 0, insight: 1, roadmap: 2, execute: 3 };
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        
        if (phaseOrder[a.phase] !== phaseOrder[b.phase]) {
          return phaseOrder[a.phase] - phaseOrder[b.phase];
        }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime();
      });

      setItems(allItems);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching FIRE cycle items: ', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchThoughts = async (): Promise<FireCycleItem[]> => {
    const items: FireCycleItem[] = [];

    try {
      const { data: thoughts } = await supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', user?.id)
        .in('category', ['idea', 'task'])
        .order('created_at', { ascending: false });

      if (thoughts) {
        thoughts.forEach(thought => {
          // Determine phase based on thought content and status
          let phase: FireCycleItem['phase'] = 'focus';
          if (thought.status === 'completed') phase = 'execute';
          else if (thought.workflow_stage === 'implement_idea') phase = 'execute';
          else if (thought.workflow_stage === 'update_idea') phase = 'roadmap';
          else if (thought.ai_insights && Object.keys(thought.ai_insights).length > 0) phase = 'insight';

          items.push({
            id: thought.id,
            phase,
            title: thought.content.substring(0, 50) + (thought.content.length > 50 ? '...' : ''),
            description: thought.content,
            type: 'thought',
            priority: thought.priority || 'medium',
            status: thought.status === 'completed' ? 'completed' : 'active',
            progress: thought.status === 'completed' ? 100 : 
                     thought.status === 'in_progress' ? 50 : 0,
            impact: 'medium',
            effort: thought.estimated_effort ? 
              (thought.estimated_effort.includes('h') ? 'moderate' : 'quick') : 'moderate',
            createdDate: new Date(thought.created_at),
            updatedDate: new Date(thought.updated_at),
            tags: thought.main_sub_categories || [],
            aiInsights: thought.ai_insights ? Object.values(thought.ai_insights) : [],
            businessContext: thought.department,
            personalContext: thought.personal_or_professional
          });
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching thoughts: ', error);
    }

    return items;
  };

  const fetchIdeas = async (): Promise<FireCycleItem[]> => {
    const items: FireCycleItem[] = [];

    try {
      // Get ideas from thoughts system
      const { data: ideas } = await supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('category', 'idea')
        .eq('initiative', true)
        .order('created_at', { ascending: false });

      if (ideas) {
        ideas.forEach(idea => {
          items.push({
            id: idea.id,
            phase: 'insight', // Ideas typically start in insight phase
            title: idea.content.substring(0, 50) + (idea.content.length > 50 ? '...' : ''),
            description: idea.content,
            type: 'idea',
            priority: idea.priority || 'medium',
            status: idea.status === 'completed' ? 'completed' : 'active',
            progress: idea.status === 'completed' ? 100 : 
                     idea.status === 'in_progress' ? 50 : 0,
            impact: idea.impact ? 'high' : 'medium',
            effort: 'intensive',
            createdDate: new Date(idea.created_at),
            updatedDate: new Date(idea.updated_at),
            tags: idea.main_sub_categories || [],
            aiInsights: idea.ai_insights ? Object.values(idea.ai_insights) : [],
            businessContext: idea.department,
            personalContext: idea.personal_or_professional
          });
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching ideas: ', error);
    }

    return items;
  };

  const fetchInitiatives = async (): Promise<FireCycleItem[]> => {
    const items: FireCycleItem[] = [];

    try {
      // Get initiatives from business context
      const { data: businessData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('org_id', user?.profile?.company_id || user?.id)
        .single();

      if (businessData) {
        // Generate initiatives based on business context
        if (businessData.revenue_trend === 'declining') {
          items.push({
            id: 'revenue-growth-initiative',
            phase: 'roadmap',
            title: 'Revenue Growth Initiative',
            description: 'Develop and implement strategies to reverse revenue decline',
            type: 'initiative',
            priority: 'critical',
            status: 'active',
            progress: 25,
            impact: 'high',
            effort: 'intensive',
            createdDate: new Date(),
            updatedDate: new Date(),
            tags: ['revenue', 'growth', 'strategy'],
            nextSteps: [
              'Analyze current pricing strategy',
              'Identify new market opportunities',
              'Develop customer retention plan'
            ],
            businessContext: 'Sales & Revenue'
          });
        }

        if (businessData.customer_satisfaction_score && businessData.customer_satisfaction_score < 7) {
          items.push({
            id: 'customer-experience-initiative',
            phase: 'execute',
            title: 'Customer Experience Initiative',
            description: 'Improve customer satisfaction and loyalty',
            type: 'initiative',
            priority: 'high',
            status: 'active',
            progress: 60,
            impact: 'high',
            effort: 'moderate',
            createdDate: new Date(),
            updatedDate: new Date(),
            tags: ['customer', 'experience', 'satisfaction'],
            nextSteps: [
              'Implement customer feedback system',
              'Train support team',
              'Optimize customer journey'
            ],
            businessContext: 'Customer Success'
          });
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching initiatives: ', error);
    }

    return items;
  };

  const fetchGoals = async (): Promise<FireCycleItem[]> => {
    const items: FireCycleItem[] = [];

    try {
      // Get goals from thoughts system
      const { data: goals } = await supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'future_goals')
        .order('created_at', { ascending: false });

      if (goals) {
        goals.forEach(goal => {
          items.push({
            id: goal.id,
            phase: 'focus', // Goals typically start in focus phase
            title: goal.content.substring(0, 50) + (goal.content.length > 50 ? '...' : ''),
            description: goal.content,
            type: 'goal',
            priority: goal.priority || 'high',
            status: 'active',
            progress: 0, // Future goals haven't started yet
            impact: 'high',
            effort: 'intensive',
            createdDate: new Date(goal.created_at),
            updatedDate: new Date(goal.updated_at),
            tags: goal.main_sub_categories || [],
            aiInsights: goal.ai_insights ? Object.values(goal.ai_insights) : [],
            businessContext: goal.department,
            personalContext: goal.personal_or_professional
          });
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching goals: ', error);
    }

    return items;
  };

  const fetchLearnings = async (): Promise<FireCycleItem[]> => {
    const items: FireCycleItem[] = [];

    try {
      // Get learnings from thoughts system
      const { data: learnings } = await supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('category', 'update')
        .order('created_at', { ascending: false });

      if (learnings) {
        learnings.forEach(learning => {
          items.push({
            id: learning.id,
            phase: 'insight', // Learnings are insights
            title: learning.content.substring(0, 50) + (learning.content.length > 50 ? '...' : ''),
            description: learning.content,
            type: 'learning',
            priority: 'medium',
            status: 'completed', // Learnings are typically completed insights
            progress: 100,
            impact: 'medium',
            effort: 'quick',
            createdDate: new Date(learning.created_at),
            updatedDate: new Date(learning.updated_at),
            tags: learning.main_sub_categories || [],
            aiInsights: learning.ai_insights ? Object.values(learning.ai_insights) : [],
            businessContext: learning.department,
            personalContext: learning.personal_or_professional
          });
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching learnings: ', error);
    }

    return items;
  };

  const fetchActions = async (): Promise<FireCycleItem[]> => {
    const items: FireCycleItem[] = [];

    try {
      // Get actions from thoughts system
      const { data: actions } = await supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('category', 'task')
        .in('status', ['in_progress', 'pending', 'due'])
        .order('created_at', { ascending: false });

      if (actions) {
        actions.forEach(action => {
          items.push({
            id: action.id,
            phase: 'execute', // Actions are in execute phase
            title: action.content.substring(0, 50) + (action.content.length > 50 ? '...' : ''),
            description: action.content,
            type: 'action',
            priority: action.priority || 'medium',
            status: action.status === 'completed' ? 'completed' : 'active',
            progress: action.status === 'completed' ? 100 : 
                     action.status === 'in_progress' ? 50 : 0,
            impact: 'medium',
            effort: action.estimated_effort ? 
              (action.estimated_effort.includes('h') ? 'moderate' : 'quick') : 'moderate',
            createdDate: new Date(action.created_at),
            updatedDate: new Date(action.updated_at),
            tags: action.main_sub_categories || [],
            aiInsights: action.ai_insights ? Object.values(action.ai_insights) : [],
            businessContext: action.department,
            personalContext: action.personal_or_professional
          });
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching actions: ', error);
    }

    return items;
  };

  const getPhaseIcon = (phase: FireCycleItem['phase']) => {
    switch (phase) {
      case 'focus': return <Target className="w-4 h-4" />;
      case 'insight': return <Lightbulb className="w-4 h-4" />;
      case 'roadmap': return <Map className="w-4 h-4" />;
      case 'execute': return <Play className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getPhaseColor = (phase: FireCycleItem['phase']) => {
    switch (phase) {
      case 'focus': return 'bg-blue-100 text-blue-800';
      case 'insight': return 'bg-yellow-100 text-yellow-800';
      case 'roadmap': return 'bg-purple-100 text-purple-800';
      case 'execute': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: FireCycleItem['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: FireCycleItem['type']) => {
    switch (type) {
      case 'thought': return <Brain className="w-4 h-4" />;
      case 'idea': return <Lightbulb className="w-4 h-4" />;
      case 'initiative': return <TrendingUp className="w-4 h-4" />;
      case 'goal': return <Target className="w-4 h-4" />;
      case 'learning': return <Eye className="w-4 h-4" />;
      case 'action': return <Play className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const handleItemClick = (item: FireCycleItem) => {
    setActiveItem(item);
  };

  const handlePhaseChange = async (itemId: string, newPhase: FireCycleItem['phase']) => {
    try {
      // Update the item's phase
      await supabase
        .from('thoughts')
        .update({ 
          workflowstage: newPhase === 'focus' ? 'create_idea' :
                        newPhase === 'insight' ? 'update_idea' :
                        newPhase === 'roadmap' ? 'implement_idea' : 'achievement'
        })
        .eq('id', itemId);

      // Refresh items
      await fetchFireCycleItems();
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error updating item phase: ', error);
    }
  };

  const filteredItems = items.filter(item => 
    selectedPhase === 'all' || item.phase === selectedPhase
  );

  const phaseStats = {
    focus: items.filter(i => i.phase === 'focus').length,
    insight: items.filter(i => i.phase === 'insight').length,
    roadmap: items.filter(i => i.phase === 'roadmap').length,
    execute: items.filter(i => i.phase === 'execute').length
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            FIRE Cycle Manager
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
          <Brain className="w-5 h-5" />
          FIRE Cycle Manager
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your thoughts, ideas, and initiatives through the FIRE cycle
        </p>
      </CardHeader>
      <CardContent>
        {/* Phase Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(phaseStats).map(([phase, count]) => (
            <div key={phase} className="text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getPhaseColor(phase as any)}`}>
                {getPhaseIcon(phase as any)}
                {phase.charAt(0).toUpperCase() + phase.slice(1)}
              </div>
              <div className="text-2xl font-bold mt-1">{count}</div>
            </div>
          ))}
        </div>

        <Tabs value={selectedPhase} onValueChange={setSelectedPhase}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="focus">Focus</TabsTrigger>
            <TabsTrigger value="insight">Insight</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="execute">Execute</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No Items in This Phase</p>
                <p className="text-sm">Add new thoughts or move items to this phase</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="border rounded-lg p-4 hover: bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getPhaseColor(item.phase)}>
                        {getPhaseIcon(item.phase)}
                        {item.phase}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Impact: {item.impact}</span>
                      <span>Effort: {item.effort}</span>
                      {item.businessContext && (
                        <span>Business: {item.businessContext}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.aiInsights && item.aiInsights.length > 0 && (
                        <Badge variant="outline" className="text-blue-600">
                          <Brain className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle item action
                        }}
                        aria-label={`View details for ${item.title}`}
                      >
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Tabs>

        <div className="mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchFireCycleItems}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh FIRE Cycle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 