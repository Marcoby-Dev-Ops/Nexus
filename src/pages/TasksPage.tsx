import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { ThoughtDashboard, type ThoughtDashboardHandle } from '@/components/thoughts/ThoughtDashboard';
import { thoughtsService } from '@/lib/services/thoughtsService';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  Filter,
  ArrowRight
} from 'lucide-react';
import type { Thought, ThoughtMetrics } from '@/lib/types/thoughts';

/**
 * TasksPage - Dedicated task management interface
 * Provides a focused view of task-type thoughts with productivity insights
 * Pillar: 1,2 - Customer Success Automation + Business Workflow Intelligence
 */
const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const thoughtDashboardRef = useRef<ThoughtDashboardHandle>(null);
  const [tasks, setTasks] = useState<Thought[]>([]);
  const [metrics, setMetrics] = useState<ThoughtMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    loadTaskData();
  }, []);

  const loadTaskData = async () => {
    setIsLoading(true);
    try {
      // Fetch only task-type thoughts
      const tasksResponse = await thoughtsService.getThoughts({ category: ['task'] }, 100);
      const metricsData = await thoughtsService.getMetrics();
      
      setTasks(tasksResponse.thoughts);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading task data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskStats = () => {
    if (!metrics) return { total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0 };
    
    const totalTasks = metrics.thoughts_by_category.task || 0;
    const completedTasks = metrics.thoughts_by_status.completed || 0;
    const pendingTasks = metrics.thoughts_by_status.pending || 0;
    const inProgressTasks = metrics.thoughts_by_status.in_progress || 0;
    const overdueTasks = metrics.overdue_items || 0;
    
    return {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      inProgress: inProgressTasks,
      overdue: overdueTasks
    };
  };

  const getCompletionRate = () => {
    const stats = getTaskStats();
    if (stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  };

  const getProductivityInsight = () => {
    const stats = getTaskStats();
    const completionRate = getCompletionRate();
    
    if (completionRate >= 80) {
      return {
        type: 'success',
        message: 'Excellent task completion rate! You\'re highly productive.',
        icon: <CheckCircle2 className="h-4 w-4" />
      };
    } else if (completionRate >= 60) {
      return {
        type: 'warning',
        message: 'Good progress! Consider breaking down large tasks.',
        icon: <TrendingUp className="h-4 w-4" />
      };
    } else {
      return {
        type: 'error',
        message: 'Focus needed. Try prioritizing your most important tasks.',
        icon: <AlertCircle className="h-4 w-4" />
      };
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const stats = getTaskStats();
  const insight = getProductivityInsight();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">
            Organize, prioritize, and track your tasks to boost productivity
          </p>
        </div>
        <Button onClick={() => thoughtDashboardRef.current?.refresh()}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
            <BookOpen className="h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground">Total Tasks</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
            <TrendingUp className="h-8 w-8 text-warning" />
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold">{stats.inProgress}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold">{stats.overdue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Insight */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Productivity Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                insight.type === 'success' ? 'bg-success/10 text-success' :
                insight.type === 'warning' ? 'bg-warning/10 text-warning' :
                'bg-destructive/10 text-destructive'
              }`}>
                {insight.icon}
              </div>
              <div>
                <p className="font-medium">{insight.message}</p>
                <p className="text-sm text-muted-foreground">
                  Completion Rate: {getCompletionRate()}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{getCompletionRate()}%</p>
              <Progress value={getCompletionRate()} className="w-20 mt-1" />
            </div>
          </div>
          
          {stats.overdue > 0 && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                {stats.overdue} task{stats.overdue > 1 ? 's' : ''} overdue - Review and prioritize
              </span>
              <ArrowRight className="h-4 w-4 text-destructive ml-auto" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All Tasks', count: stats.total },
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'in_progress', label: 'In Progress', count: stats.inProgress },
              { key: 'completed', label: 'Completed', count: stats.completed }
            ].map(({ key, label, count }) => (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(key as any)}
                className="flex items-center gap-2"
              >
                {label}
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Your Tasks
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your tasks using the comprehensive thought management system
          </p>
        </CardHeader>
        <CardContent>
          <div className="task-dashboard-container">
            <ThoughtDashboard 
              ref={thoughtDashboardRef}
              className="border-0 shadow-none p-0"
            />
          </div>
        </CardContent>
      </Card>
      

    </div>
  );
};

export default TasksPage; 