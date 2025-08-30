import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Target, Lightbulb, Map, Play, Plus, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { FireCycleBusinessGoalsService, type BusinessGoal, type BusinessGoalCategory, type FireCyclePhase, type FIREAnalysis } from '@/core/fire-cycle/fireCycleBusinessGoals';


const FIRE_PHASES: { id: FireCyclePhase; label: string; icon: React.ComponentType; color: string; description: string }[] = [
  {
    id: 'focus',
    label: 'Focus',
    icon: Target,
    color: 'text-primary',
    description: 'Clarify your business goal and define success metrics'
  },
  {
    id: 'insight',
    label: 'Insight',
    icon: Lightbulb,
    color: 'text-warning',
    description: 'Gain deeper understanding through research and analysis'
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    icon: Map,
    color: 'text-success',
    description: 'Create a detailed plan with milestones and timelines'
  },
  {
    id: 'execute',
    label: 'Execute',
    icon: Play,
    color: 'text-secondary',
    description: 'Take action and track progress toward your goal'
  }
];

const BUSINESS_CATEGORIES: { value: BusinessGoalCategory; label: string; description: string }[] = [
  { value: 'revenue-growth', label: 'Revenue Growth', description: 'Increase sales and revenue' },
  { value: 'cost-reduction', label: 'Cost Reduction', description: 'Reduce expenses and improve efficiency' },
  { value: 'market-expansion', label: 'Market Expansion', description: 'Enter new markets or segments' },
  { value: 'product-development', label: 'Product Development', description: 'Build new products or features' },
  { value: 'team-management', label: 'Team Management', description: 'Improve team performance and retention' },
  { value: 'customer-acquisition', label: 'Customer Acquisition', description: 'Attract and convert new customers' },
  { value: 'operational-efficiency', label: 'Operational Efficiency', description: 'Streamline processes and workflows' },
  { value: 'financial-management', label: 'Financial Management', description: 'Improve financial planning and control' },
  { value: 'risk-mitigation', label: 'Risk Mitigation', description: 'Identify and reduce business risks' },
  { value: 'compliance', label: 'Compliance', description: 'Ensure regulatory and legal compliance' },
  { value: 'technology-upgrade', label: 'Technology Upgrade', description: 'Modernize systems and infrastructure' },
  { value: 'process-improvement', label: 'Process Improvement', description: 'Optimize business processes' }
];

interface FireCycleBusinessGoalsDashboardProps {
  className?: string;
}

export const FireCycleBusinessGoalsDashboard: React.FC<FireCycleBusinessGoalsDashboardProps> = ({ className }) => {
  const [goals, setGoals] = useState<BusinessGoal[]>([]);
  const [_selectedGoal, setSelectedGoal] = useState<BusinessGoal | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<FIREAnalysis | null>(null);

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'revenue-growth' as BusinessGoalCategory,
    priority: 'medium' as const,
    targetDate: ''
  });

  const service = new FireCycleBusinessGoalsService();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockGoals: BusinessGoal[] = [
        {
          id: '1',
          title: 'Increase Monthly Recurring Revenue by 25%',
          description: 'Focus on upselling existing customers and improving retention',
          category: 'revenue-growth',
          priority: 'high',
          firePhase: 'focus',
          status: 'active',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          tasks: [
            {
              id: '1',
              title: 'Define MRR metrics and targets',
              description: 'Establish clear KPIs for monthly recurring revenue',
              status: 'completed',
              priority: 'high',
              estimatedHours: 2,
              completedAt: new Date('2024-01-16')
            },
            {
              id: '2',
              title: 'Analyze current customer segments',
              description: 'Identify high-value customers for upselling opportunities',
              status: 'in-progress',
              priority: 'high',
              estimatedHours: 4
            }
          ]
        },
        {
          id: '2',
          title: 'Reduce Customer Acquisition Cost by 30%',
          description: 'Optimize marketing channels and improve conversion rates',
          category: 'cost-reduction',
          priority: 'critical',
          firePhase: 'insight',
          status: 'active',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-18'),
          tasks: [
            {
              id: '3',
              title: 'Audit current marketing spend',
              description: 'Review all marketing channels and their performance',
              status: 'completed',
              priority: 'high',
              estimatedHours: 3,
              completedAt: new Date('2024-01-12')
            },
            {
              id: '4',
              title: 'Research new marketing channels',
              description: 'Identify cost-effective alternatives to current channels',
              status: 'todo',
              priority: 'medium',
              estimatedHours: 6
            }
          ]
        }
      ];
      setGoals(mockGoals);
    } catch (_error) {
      // TODO: Add proper error handling
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return;

    setLoading(true);
    try {
      const result = await service.createBusinessGoal({
        ...newGoal,
        targetDate: newGoal.targetDate ? new Date(newGoal.targetDate) : undefined
      });

      if (result.success && result.data) {
        setGoals(prev => [...prev, result.data]);
        setIsCreateDialogOpen(false);
        setNewGoal({
          title: '',
          description: '',
          category: 'revenue-growth',
          priority: 'medium',
          targetDate: ''
        });
      }
    } catch (_error) {
      // TODO: Add proper error handling
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeGoal = async (goal: BusinessGoal) => {
    setSelectedGoal(goal);
    setLoading(true);
    try {
      const result = await service.analyzeBusinessGoal(goal);
      if (result.success && result.data) {
        setAnalysis(result.data);
        setIsAnalysisDialogOpen(true);
      }
    } catch (_error) {
      // TODO: Add proper error handling
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancePhase = async (goalId: string, targetPhase: FireCyclePhase) => {
    setLoading(true);
    try {
      const result = await service.advanceGoalPhase(goalId, targetPhase);
      if (result.success && result.data) {
        setGoals(prev => prev.map(goal => 
          goal.id === goalId ? result.data : goal
        ));
      }
    } catch (_error) {
      // TODO: Add proper error handling
    } finally {
      setLoading(false);
    }
  };

  const getPhaseIcon = (phase: FireCyclePhase) => {
    const phaseData = FIRE_PHASES.find(p => p.id === phase);
    return phaseData ? React.createElement(phaseData.icon, { className: `h-4 w-4 ${phaseData.color}` }) : null;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryLabel = (category: BusinessGoalCategory) => {
    return BUSINESS_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const calculateProgress = (goal: BusinessGoal) => {
    const tasks = goal.tasks || [];
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return (completed / tasks.length) * 100;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FIRE Cycle Business Goals</h1>
          <p className="text-muted-foreground">
            Transform your business ideas into actionable plans using the FIRE framework
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Goal
        </Button>
      </div>

      {/* FIRE Phase Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {FIRE_PHASES.map((phase) => {
          const phaseGoals = goals.filter(g => g.firePhase === phase.id);
          const completedGoals = phaseGoals.filter(g => g.status === 'completed').length;
          
          return (
            <Card key={phase.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {React.createElement(phase.icon, { className: `h-5 w-5 ${phase.color}` })}
                  <CardTitle className="text-lg">{phase.label}</CardTitle>
                </div>
                <CardDescription>{phase.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Goals</span>
                    <span className="font-medium">{phaseGoals.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Completed</span>
                    <span className="font-medium text-green-600">{completedGoals}</span>
                  </div>
                  {phaseGoals.length > 0 && (
                    <Progress value={(completedGoals / phaseGoals.length) * 100} className="h-2" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Business Goals</CardTitle>
          <CardDescription>
            Track your goals through the FIRE phases and see your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No business goals yet</p>
              <p className="text-sm">Create your first goal to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{goal.title}</h3>
                        <Badge className={getPriorityColor(goal.priority)}>
                          {goal.priority}
                        </Badge>
                        <Badge variant="outline">
                          {getCategoryLabel(goal.category)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          {getPhaseIcon(goal.firePhase)}
                          <span className="capitalize">{goal.firePhase}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{goal.tasks?.filter(t => t.status === 'completed').length || 0} completed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>{goal.tasks?.length || 0} total tasks</span>
                        </div>
                      </div>
                      
                      {goal.tasks && goal.tasks.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{Math.round(calculateProgress(goal))}%</span>
                          </div>
                          <Progress value={calculateProgress(goal)} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAnalyzeGoal(goal)}
                      >
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Analyze
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentIndex = FIRE_PHASES.findIndex(p => p.id === goal.firePhase);
                          const nextPhase = FIRE_PHASES[(currentIndex + 1) % FIRE_PHASES.length];
                          handleAdvancePhase(goal.id, nextPhase.id);
                        }}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Advance
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Goal Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Business Goal</DialogTitle>
            <DialogDescription>
              Define a new business goal and let the FIRE Cycle guide you through planning and execution.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Increase revenue by 25%"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your goal and why it's important..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={newGoal.category} onValueChange={(value: BusinessGoalCategory) => setNewGoal(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div>
                        <div className="font-medium">{category.label}</div>
                        <div className="text-sm text-muted-foreground">{category.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={newGoal.priority} onValueChange={(value: string) => setNewGoal(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' | 'critical' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="targetDate">Target Date (Optional)</Label>
              <Input
                id="targetDate"
                type="date"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGoal} disabled={!newGoal.title.trim() || loading}>
              {loading ? 'Creating...' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analysis Dialog */}
      <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>FIRE Cycle Analysis</DialogTitle>
            <DialogDescription>
              AI-powered analysis of your business goal with recommendations and next steps.
            </DialogDescription>
          </DialogHeader>
          
          {analysis && (
            <div className="space-y-6">
              {/* Current Phase */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getPhaseIcon(analysis.currentPhase)}
                    Current Phase: {analysis.currentPhase.charAt(0).toUpperCase() + analysis.currentPhase.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Phase Progress</span>
                      <span>{Math.round(analysis.phaseProgress)}%</span>
                    </div>
                    <Progress value={analysis.phaseProgress} className="h-2" />
                    <div className="flex items-center justify-between">
                      <span>Confidence</span>
                      <span>{Math.round(analysis.confidence * 100)}%</span>
                    </div>
                    <Progress value={analysis.confidence * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Next Actions */}
              {analysis.nextActions && analysis.nextActions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Next Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.nextActions.map((action, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{action.title}</h4>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{action.priority}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {action.estimatedHours}h estimated
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Insights */}
              {analysis.insights && analysis.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Insights & Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.insights.map((insight, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium">{insight.title}</h4>
                            <p className="text-sm text-muted-foreground">{insight.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{insight.impact} impact</Badge>
                              <span className="text-sm text-muted-foreground">
                                {Math.round(insight.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Estimated Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.estimatedTimeline}</div>
                    <div className="text-sm text-muted-foreground">days to completion</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnalysisDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
