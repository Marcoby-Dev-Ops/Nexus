import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Input } from '@/shared/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  Settings, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Search,
  Filter,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { operationsService, type Workflow, type EfficiencyMetric, type Automation, type Performance } from '@/services/departments';

// Using types from the service instead of local interfaces
interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedTo: string;
  estimatedHours: number;
  actualHours?: number;
  dependencies: string[];
}

const OperationsPage: React.FC = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [metrics, setMetrics] = useState<EfficiencyMetric>({
    total_workflows: 0,
    active_workflows: 0,
    completed_today: 0,
    avg_completion_time: 0,
    efficiency_score: 0,
    bottlenecks_count: 0,
    team_utilization: 0,
    quality_score: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    loadOperationsData();
  }, []);

  const loadOperationsData = async () => {
    setLoading(true);
    try {
      // Load data from the operations service
      const [workflowsResult, metricsResult, automationResult, performanceResult] = await Promise.all([
        operationsService.list(),
        operationsService.getEfficiencyMetrics(),
        operationsService.getAutomationData(),
        operationsService.getPerformanceData()
      ]);

      if (workflowsResult.success && workflowsResult.data) {
        setWorkflows(workflowsResult.data);
      }

      if (metricsResult.success && metricsResult.data) {
        setMetrics(metricsResult.data);
      }

      // Store additional data for future use
      if (automationResult.success && automationResult.data) {
        // TODO: Use automation data for automation dashboard
      }

      if (performanceResult.success && performanceResult.data) {
        // TODO: Use performance data for team performance tracking
      }

    } catch (error) {
      console.error('Error loading operations data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || workflow.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'blocked': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor workflows, processes, and operational efficiency</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Workflow
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_workflows}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_workflows} total workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completed_today}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.avg_completion_time} days avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.efficiency_score}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.team_utilization}% team utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.quality_score}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.bottlenecks_count} bottlenecks detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Management */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Management</CardTitle>
          <CardDescription>Monitor and manage operational workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6">
            {filteredWorkflows.map((workflow) => (
              <div key={workflow.id} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{workflow.name}</h3>
                      <Badge className={getStatusColor(workflow.status)}>
                        {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                      </Badge>
                      <Badge className={getPriorityColor(workflow.priority)}>
                        {workflow.priority.charAt(0).toUpperCase() + workflow.priority.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{workflow.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Assigned: {workflow.assignedTo}</span>
                      <span>Started: {workflow.startDate}</span>
                      <span>Est. Completion: {workflow.estimatedCompletion}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{workflow.progress}%</div>
                    <div className="text-sm text-gray-500">Complete</div>
                  </div>
                </div>

                <div className="mb-4">
                  <Progress value={workflow.progress} className="h-2" />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Workflow Steps</h4>
                  {workflow.steps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStepStatusIcon(step.status)}
                        <div>
                          <div className="font-medium">{step.name}</div>
                          <div className="text-sm text-gray-500">Assigned: {step.assignedTo}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {step.actualHours ? `${step.actualHours}h` : `${step.estimatedHours}h`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {step.actualHours ? 'Actual' : 'Estimated'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationsPage;
