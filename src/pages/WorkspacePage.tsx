import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Brain, CheckCircle, Clock, Target, TrendingUp, Users, Calendar, FileText, Zap, Focus, BookOpen, Coffee } from 'lucide-react';
import { AIInsightsWidget } from '@/components/workspace/widgets/AIInsightsWidget';
import { CalendarWidget } from '@/components/workspace/widgets/CalendarWidget';
import { TasksWidget } from '@/components/workspace/widgets/TasksWidget';
import { IdeasWidget } from '@/components/workspace/widgets/IdeasWidget';
import { RecentsWidget } from '@/components/workspace/widgets/RecentsWidget';
import { QuickActionsWidget } from '@/components/workspace/widgets/QuickActionsWidget';
import { EmailWidget } from '@/components/workspace/widgets/EmailWidget';
import { ProactiveAlertsWidget } from '@/components/workspace/widgets/ProactiveAlertsWidget';
import { NotificationsWidget } from '@/components/workspace/widgets/NotificationsWidget';
import { LearningFeedWidget } from '@/components/workspace/widgets/LearningFeedWidget';
import { CelebrationWidget } from '@/components/workspace/widgets/CelebrationWidget';
import { NextBestActionWidget } from '@/components/workspace/widgets/NextBestActionWidget';
import { WorkspaceQuickActions } from '@/components/workspace/WorkspaceQuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Outlet, useMatch } from 'react-router-dom';

/**
 * WorkspacePage -> Personal Productivity Hub
 * 
 * This page serves as your personal command center for productivity,
 * task management, and individual workflow optimization.
 */
const WorkspacePage: React.FC = () => {
  const { user } = useAuth();
  const [isCelebrating, setIsCelebrating] = useState(false);

  const handleCelebrationComplete = () => {
    setIsCelebrating(false);
  };

  const triggerCelebration = () => {
    setIsCelebrating(true);
  };

  // Personal productivity stats
  const productivityStats = {
    tasksCompleted: 12,
    ideasCaptured: 8,
    focusTime: 4.5, // hours
    learningStreak: 7 // days
  };

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const isIndex = useMatch('/workspace');
  return (
    <PageLayout>
      {isIndex && (
        <div className="space-y-8">
          <CelebrationWidget isCelebrating={isCelebrating} onComplete={handleCelebrationComplete} />
          {/* Welcome Message - Leading */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.profile?.first_name || user?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-lg text-muted-foreground">
              {currentDate} • {currentTime} • Ready to make today productive?
            </p>
          </div>
          {/* Personal Header */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  Your Personal Productivity Command Center
                </h2>
              </div>
            </div>
            {/* Personal Productivity Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <Card className="border-l-4 border-l-success bg-success/5 hover:bg-success/10 transition-colors">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-success" />
                  <div className="text-2xl font-bold text-foreground">{productivityStats.tasksCompleted}</div>
                  <div className="text-xs text-muted-foreground">Tasks Done Today</div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-primary bg-primary/5 hover:bg-primary/10 transition-colors">
                <CardContent className="p-4 text-center">
                  <Brain className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold text-foreground">{productivityStats.ideasCaptured}</div>
                  <div className="text-xs text-muted-foreground">Ideas Captured</div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-secondary bg-secondary/5 hover:bg-secondary/10 transition-colors">
                <CardContent className="p-4 text-center">
                  <Focus className="w-6 h-6 mx-auto mb-2 text-secondary" />
                  <div className="text-2xl font-bold text-foreground">{productivityStats.focusTime}h</div>
                  <div className="text-xs text-muted-foreground">Focus Time</div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-warning bg-warning/5 hover:bg-warning/10 transition-colors">
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-6 h-6 mx-auto mb-2 text-warning" />
                  <div className="text-2xl font-bold text-foreground">{productivityStats.learningStreak}</div>
                  <div className="text-xs text-muted-foreground">Learning Streak</div>
                </CardContent>
              </Card>
            </div>
            {/* Daily Focus */}
            <Card className="max-w-2xl mx-auto border-l-4 border-l-primary bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Target className="w-5 h-5" />
                  Today's Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium text-foreground mb-2">
                  Complete the quarterly review presentation
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Est. 3 hours</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Due: Tomorrow</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Enhanced Grid Layout for Personal Productivity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Productivity Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task Management */}
              <TasksWidget onTaskComplete={triggerCelebration} />
              
              {/* Ideas & Notes */}
              <IdeasWidget />
              
              {/* Calendar & Schedule */}
              <CalendarWidget />
              
              {/* Email & Communication */}
              <EmailWidget />
              
              {/* Learning & Development */}
              <LearningFeedWidget />
            </div>
            {/* Personal Assistant Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <WorkspaceQuickActions />
              
              {/* AI Personal Assistant */}
              <AIInsightsWidget />
              
              {/* Smart Notifications */}
              <NotificationsWidget />
              
              {/* Personal Alerts */}
              <ProactiveAlertsWidget />
              
              {/* Next Best Actions */}
              <NextBestActionWidget />
              
              {/* Recent Items */}
              <RecentsWidget />
            </div>
          </div>
          {/* Productivity Tips */}
          <Card className="max-w-4xl mx-auto border-l-4 border-l-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <Coffee className="w-5 h-5" />
                Productivity Tip of the Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">
                <strong>Time Blocking:</strong> Schedule specific time slots for different types of work. 
                This helps maintain focus and prevents task-switching fatigue. Try blocking 2-hour chunks 
                for deep work and 30-minute slots for quick tasks.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      <Outlet />
    </PageLayout>
  );
};

export default WorkspacePage; 