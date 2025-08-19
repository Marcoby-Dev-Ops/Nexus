import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, TrendingUp, CheckCircle, AlertTriangle, Clock, Users, DollarSign, Building2, Activity, Brain, Zap, Package, Star, Rocket, Lightbulb, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { useQuantumStrengthenPlan } from '@/core/api/quantum.client';
import { QUANTUM_ICONS } from '@/shared/components/layout/QuantumLayout';
import type { QuantumBlockId } from '@/core/types/quantum';

const QuantumBlockStrengthenPage: React.FC = () => {
  const { blockId } = useParams<{ blockId: string }>();
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState<'overview' | 'actions' | 'timeline' | 'metrics'>('overview');
  const { data: strengthenPlan, loading, error } = useQuantumStrengthenPlan(blockId as QuantumBlockId);

  // Handle error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Strengthen Plan</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'An error occurred while loading the strengthen plan.'}
          </p>
          <Button onClick={() => navigate('/home')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getBlockIcon = (blockId: string) => {
    const Icon = QUANTUM_ICONS[blockId as QuantumBlockId];
    return Icon ? <Icon className="h-6 w-6" /> : <Package className="h-6 w-6" />;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'process': return <BarChart3 className="h-4 w-4" />;
      case 'people': return <Users className="h-4 w-4" />;
      case 'technology': return <Zap className="h-4 w-4" />;
      case 'strategy': return <Target className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'not-started': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading strengthen plan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!strengthenPlan) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Strengthen Plan Not Found</h2>
          <p className="text-muted-foreground mb-4">
            Could not load strengthen plan for block "{blockId}".
          </p>
          <Button onClick={() => navigate('/home')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/quantum/blocks/${blockId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Button>
                     <div className="flex items-center space-x-3">
             {getBlockIcon(blockId)}
             <div>
               <h1 className="text-2xl font-bold">Strengthen {blockId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h1>
               <p className="text-muted-foreground">Improvement plan and actionable steps</p>
             </div>
           </div>
        </div>
        <Button>
          <Rocket className="h-4 w-4 mr-2" />
          Start Implementation
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                 <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium">Current Health</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{strengthenPlan.current.health}%</div>
             <Progress value={strengthenPlan.current.health} className="mt-2" />
           </CardContent>
         </Card>
         
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium">Target Health</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{strengthenPlan.target.health}%</div>
             <Progress value={strengthenPlan.target.health} className="mt-2" />
           </CardContent>
         </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{strengthenPlan.metrics.overallImprovement}%</div>
            <div className="text-sm text-muted-foreground mt-2">
              Expected improvement
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Time to Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{strengthenPlan.metrics.timeToTarget}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {strengthenPlan.metrics.confidence}% confidence
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as any)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Improvement Strategy</span>
                </CardTitle>
                <CardDescription>
                  Comprehensive approach to strengthening your {strengthenPlan.block.name.toLowerCase()} block
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Current State</h4>
                  <p className="text-muted-foreground">
                    Your {strengthenPlan.block.name.toLowerCase()} block is currently at {strengthenPlan.currentHealth}% health, 
                    with opportunities for significant improvement across multiple dimensions.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Target State</h4>
                  <p className="text-muted-foreground">
                    Our goal is to reach {strengthenPlan.targetHealth}% health through strategic improvements 
                    in processes, people, technology, and strategy alignment.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Key Focus Areas</h4>
                  <div className="space-y-2">
                    {strengthenPlan.actions.slice(0, 3).map((action) => (
                      <div key={action.id} className="flex items-center space-x-2">
                        {getCategoryIcon(action.category)}
                        <span className="text-sm">{action.title}</span>
                        <Badge className={getPriorityColor(action.priority)}>
                          {action.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Expected Outcomes</span>
                </CardTitle>
                <CardDescription>
                  Measurable improvements and business impact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {strengthenPlan.actions.map((action) => (
                    <div key={action.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{action.title}</span>
                        <Badge className={getPriorityColor(action.priority)}>
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.expectedImpact}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Improvement Actions</CardTitle>
              <CardDescription>
                Detailed action plan with priorities, effort estimates, and dependencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {strengthenPlan.actions.map((action) => (
                  <div key={action.id} className="p-6 border rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(action.category)}
                        <div>
                          <h3 className="font-semibold text-lg">{action.title}</h3>
                          <p className="text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(action.priority)}>
                          {action.priority} priority
                        </Badge>
                        <Badge className={getStatusColor(action.status)}>
                          {action.status.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Effort</span>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{action.estimatedEffort} hours</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Current Score</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={action.currentScore} className="w-20" />
                          <span>{action.currentScore}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Target Score</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={action.targetScore} className="w-20" />
                          <span>{action.targetScore}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Expected Impact</span>
                        <p className="text-sm">{action.expectedImpact}</p>
                      </div>
                      
                      {action.dependencies.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Dependencies</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {action.dependencies.map((dep) => (
                              <Badge key={dep} variant="outline">Action {dep}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Resources Needed</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {action.resources.map((resource) => (
                            <Badge key={resource} variant="outline">{resource}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4 space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button size="sm">
                        Start Action
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Timeline</CardTitle>
              <CardDescription>
                Phased approach to implementing improvements over {strengthenPlan.metrics.timeToTarget}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {strengthenPlan.timeline.map((phase, index) => (
                  <div key={index} className="relative">
                    {index < strengthenPlan.timeline.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-12 bg-border"></div>
                    )}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{phase.phase}</h3>
                        <p className="text-muted-foreground mb-3">{phase.duration}</p>
                        <div className="space-y-2">
                          {phase.actions.map((actionId) => {
                            const action = strengthenPlan.actions.find(a => a.id === actionId);
                            return action ? (
                              <div key={actionId} className="flex items-center space-x-2 p-2 bg-muted rounded">
                                {getCategoryIcon(action.category)}
                                <span className="text-sm">{action.title}</span>
                                <Badge className={getPriorityColor(action.priority)}>
                                  {action.priority}
                                </Badge>
                              </div>
                            ) : (
                              <div key={actionId} className="text-sm text-muted-foreground p-2">
                                {actionId}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>
                  Monitor improvement progress and key metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">0%</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Health Score</span>
                    <span className="text-sm text-muted-foreground">{strengthenPlan.currentHealth}% → {strengthenPlan.targetHealth}%</span>
                  </div>
                  <Progress value={strengthenPlan.currentHealth} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Actions Completed</span>
                    <span className="text-sm text-muted-foreground">0 / {strengthenPlan.actions.length}</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators and success criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span className="text-sm font-medium">Confidence Level</span>
                    <span className="text-sm font-semibold">{strengthenPlan.metrics.confidence}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span className="text-sm font-medium">Expected Improvement</span>
                    <span className="text-sm font-semibold text-green-600">+{strengthenPlan.metrics.overallImprovement}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span className="text-sm font-medium">Time to Target</span>
                    <span className="text-sm font-semibold">{strengthenPlan.metrics.timeToTarget}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span className="text-sm font-medium">Total Effort</span>
                    <span className="text-sm font-semibold">
                      {strengthenPlan.actions.reduce((sum, action) => sum + action.estimatedEffort, 0)} hours
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuantumBlockStrengthenPage;
