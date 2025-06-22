/**
 * @file ThoughtDashboard.tsx
 * @description Main dashboard for Nexus Thought Management System
 * Based on Marcoby Nexus diagrams - displays ideas, tasks, reminders, and workflow
 */

import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { 
  Plus, 
  Search, 
  Brain, 
  Lightbulb, 
  BookOpen, 
  Clock, 
  Tag, 
  Zap, 
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  X
} from 'lucide-react';
import { thoughtsService } from '../../lib/services/thoughtsService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/security/logger';
import { 
  Thought, 
  ThoughtCategory, 
  ThoughtPriority,
  CreateThoughtRequest,
  UpdateThoughtRequest
} from '../../lib/types/thoughts';

export interface ThoughtDashboardHandle {
  refresh: () => void;
}

interface ThoughtDashboardProps {
  className?: string;
}

const CATEGORY_CONFIG = {
  idea: { icon: Lightbulb, label: 'Ideas', color: 'bg-warning/10 text-warning-foreground' },
  task: { icon: BookOpen, label: 'Tasks', color: 'bg-primary/10 text-primary' },
  reminder: { icon: Clock, label: 'Reminders', color: 'bg-accent/10 text-accent-foreground' },
  update: { icon: TrendingUp, label: 'Updates', color: 'bg-success/10 text-success' }
};

const STATUS_CONFIG = {
  future_goals: { label: 'Future Goals', color: 'bg-muted text-foreground' },
  concept: { label: 'Concept', color: 'bg-warning/10 text-warning-foreground' },
  in_progress: { label: 'In Progress', color: 'bg-primary/10 text-primary' },
  completed: { label: 'Completed', color: 'bg-success/10 text-success' },
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning' },
  reviewed: { label: 'Reviewed', color: 'bg-primary/10 text-primary' },
  implemented: { label: 'Implemented', color: 'bg-success/10 text-success-foreground' },
  not_started: { label: 'Not Started', color: 'bg-muted text-foreground' },
  upcoming: { label: 'Upcoming', color: 'bg-secondary/10 text-secondary' },
  due: { label: 'Due', color: 'bg-destructive/10 text-destructive' },
  overdue: { label: 'Overdue', color: 'bg-destructive/20 text-destructive' }
};

const WORKFLOW_STAGES = [
  { id: 'create_idea', label: 'Create Idea', icon: Plus },
  { id: 'update_idea', label: 'Update Idea', icon: TrendingUp },
  { id: 'implement_idea', label: 'Implement Idea', icon: BookOpen },
  { id: 'achievement', label: 'Achievement', icon: BookOpen }
];

export const ThoughtDashboard = forwardRef<ThoughtDashboardHandle, ThoughtDashboardProps>(
({ className = '' }, ref) => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [metrics, setMetrics] = useState<ThoughtMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<ThoughtCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showPrompts, setShowPrompts] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ====== Data Loading ======
  
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [thoughtsResponse, metricsData] = await Promise.all([
        thoughtsService.getThoughts({}, 100),
        thoughtsService.getMetrics()
      ]);
      
      setThoughts(thoughtsResponse.thoughts);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({ refresh: loadDashboardData }), []);

  const handleThoughtCreated = () => {
    loadDashboardData();
    setShowPrompts(false);
    setAlert({ type: 'success', message: 'Thought created successfully!' });
    setTimeout(() => setAlert(null), 3000);
  };

  // ====== Filtering ======
  
  const filteredThoughts = thoughts.filter(thought => 
    activeTab === 'all' || thought.category === activeTab
  );

  const thoughtsByCategory = thoughts.reduce((acc, thought) => {
    if (!acc[thought.category]) acc[thought.category] = [];
    acc[thought.category].push(thought);
    return acc;
  }, {} as Record<ThoughtCategory, Thought[]>);

  // ====== Workflow Visualization ======
  
  const renderWorkflowProgress = (thought: Thought) => {
    const currentStageIndex = WORKFLOW_STAGES.findIndex(
      stage => stage.id === thought.workflow_stage
    );
    const progress = currentStageIndex >= 0 ? ((currentStageIndex + 1) / WORKFLOW_STAGES.length) * 100 : 25;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Workflow Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {WORKFLOW_STAGES.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            
            return (
              <div
                key={stage.id}
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                  isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{stage.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ====== Thought Lifecycle Visualization ======
  
  const renderThoughtLifecycle = () => {
    if (!metrics) return null;
    
    const totalThoughts = metrics.total_thoughts;
    const categories = Object.entries(metrics.thoughts_by_category);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Thought Lifecycle
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ideas spawn tasks and reminders, all connected in your thought network
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ideas Circle */}
            <div className="text-center">
              <div className="relative mx-auto w-24 h-24 bg-warning/10 rounded-full flex items-center justify-center mb-4">
                <Lightbulb className="h-8 w-8 text-warning" />
                <div className="absolute -top-2 -right-2 bg-warning text-primary-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {metrics.thoughts_by_category.idea || 0}
                </div>
              </div>
              <p className="font-medium">Ideas</p>
              <p className="text-xs text-muted-foreground">Goals or initiatives</p>
            </div>

            {/* Tasks Circle */}
            <div className="text-center">
              <div className="relative mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {metrics.thoughts_by_category.task || 0}
                </div>
              </div>
              <p className="font-medium">Tasks</p>
              <p className="text-xs text-muted-foreground">Actions to complete ideas</p>
            </div>

            {/* Reminders Circle */}
            <div className="text-center">
              <div className="relative mx-auto w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-accent" />
                <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {metrics.thoughts_by_category.reminder || 0}
                </div>
              </div>
              <p className="font-medium">Reminders</p>
              <p className="text-xs text-muted-foreground">Notifications to complete tasks</p>
            </div>
          </div>
          
          {/* Connection Arrows */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Ideas spawn tasks</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tasks generate reminders</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ====== Thought Cards ======
  
  const renderThoughtCard = (thought: Thought) => {
    const categoryConfig = CATEGORY_CONFIG[thought.category];
    const statusConfig = STATUS_CONFIG[thought.status];
    const Icon = categoryConfig.icon;
    
    return (
      <Card key={thought.id} className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <Badge variant="secondary" className={categoryConfig.color}>
                {categoryConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
              <Avatar className="w-6 h-6 text-xs">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          <p className="text-sm mb-3 line-clamp-3">{thought.content}</p>
          
          {thought.category === 'idea' && thought.workflow_stage && (
            <div className="mb-3">
              {renderWorkflowProgress(thought)}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{new Date(thought.created_at).toLocaleDateString()}</span>
            {thought.interaction_method && (
              <Badge variant="outline" className="text-xs">
                {thought.interaction_method.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ====== Metrics Cards ======
  
  const renderMetricsOverview = () => {
    if (!metrics) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
            <Brain className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total Thoughts</p>
            <p className="text-2xl font-bold">{metrics.total_thoughts}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <p className="text-2xl font-bold">{Math.round(metrics.completion_rate)}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
            <Lightbulb className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Active Ideas</p>
            <p className="text-2xl font-bold">{metrics.active_ideas}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-6">
            <Target className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Productivity Score</p>
            <p className="text-2xl font-bold">{metrics.productivity_score}</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ====== Main Render ======
  
  if (isLoading) {
    // Render skeleton placeholders that mimic the dashboard layout so the user
    // perceives faster loading and avoids layout shift.
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>

        {/* Metrics overview skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24 w-full" />
          ))}
        </div>

        {/* Thought cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nexus Thoughts</h1>
          <p className="text-muted-foreground">
            Your AI-powered idea management system
          </p>
        </div>
        <Button onClick={() => setShowPrompts(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Thought
        </Button>
      </div>

      {/* Alert Feedback */}
      {alert && (
        <Alert 
          variant={alert.type} 
          className="mb-6"
          action={
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setAlert(null)}
            >
              ×
            </Button>
          }
        >
          {alert.message}
        </Alert>
      )}

      {/* Interactive Prompts */}
      {showPrompts && (
        <InteractivePrompts
          onThoughtCreated={handleThoughtCreated}
          className="mb-6"
        />
      )}

      {/* Metrics Overview */}
      {renderMetricsOverview()}

      {/* Thought Lifecycle Visualization */}
      {renderThoughtLifecycle()}

      {/* Thoughts Display */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="idea">Ideas</TabsTrigger>
          <TabsTrigger value="task">Tasks</TabsTrigger>
          <TabsTrigger value="reminder">Reminders</TabsTrigger>
          <TabsTrigger value="update">Updates</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {filteredThoughts.length === 0 ? (
            <Card>
              <CardContent className="text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No thoughts yet</p>
                <p className="text-muted-foreground mb-4">
                  Start capturing your ideas, tasks, and reminders
                </p>
                <Button onClick={() => setShowPrompts(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Thought
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${
                filteredThoughts.length === 1 ? 'justify-items-center' : ''
              }`}
            >
              {filteredThoughts.map(renderThoughtCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
});

ThoughtDashboard.displayName = 'ThoughtDashboard'; 