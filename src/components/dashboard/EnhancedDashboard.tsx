import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Eye, 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  Users, 
  Target,
  Activity,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  Clock,
  CheckCircle2,
  Lightbulb,
  Database,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ContentCard } from '@/components/patterns/ContentCard';
import { SimpleBarChart } from './SimpleBarChart';
import OrganizationalHealthScore from './OrganizationalHealthScore';
import CrossDepartmentMatrix from './CrossDepartmentMatrix';
import TrinityInsightsEngine from './TrinityInsightsEngine';

/**
 * @name EnhancedDashboard
 * @description Modern Trinity-powered dashboard with contemporary design principles
 * @returns {JSX.Element} The rendered enhanced dashboard component.
 */

interface TrinityMetrics {
  think: {
    ideasCaptured: number;
    collaborationSessions: number;
    innovationScore: number;
    crossDeptConnections: number;
  };
  see: {
    dataSourcesConnected: number;
    realTimeInsights: number;
    predictiveAccuracy: number;
    alertsGenerated: number;
  };
  act: {
    automationsRunning: number;
    workflowsOptimized: number;
    timeSaved: number;
    processEfficiency: number;
  };
}

const EnhancedDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'think' | 'see' | 'act'>('think');
  const [trinityMetrics, setTrinityMetrics] = useState<TrinityMetrics>({
    think: {
      ideasCaptured: 347,
      collaborationSessions: 28,
      innovationScore: 94.2,
      crossDeptConnections: 15
    },
    see: {
      dataSourcesConnected: 12,
      realTimeInsights: 156,
      predictiveAccuracy: 87.3,
      alertsGenerated: 8
    },
    act: {
      automationsRunning: 24,
      workflowsOptimized: 18,
      timeSaved: 1247,
      processEfficiency: 91.8
    }
  });

  const trinityData = [
    { name: 'Ideas', value: trinityMetrics.think.ideasCaptured },
    { name: 'Insights', value: trinityMetrics.see.realTimeInsights },
    { name: 'Actions', value: trinityMetrics.act.automationsRunning }
  ];

  const recentActivities = [
    {
      type: 'think',
      title: 'New Innovation Session Started',
      department: 'Sales × Product',
      time: '2 minutes ago',
      status: 'active'
    },
    {
      type: 'see',
      title: 'Anomaly Detected in Revenue Pattern',
      department: 'Finance',
      time: '5 minutes ago',
      status: 'alert'
    },
    {
      type: 'act',
      title: 'Customer Onboarding Automated',
      department: 'Operations',
      time: '12 minutes ago',
      status: 'completed'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-primary/10 text-primary border-primary/20';
      case 'alert': return 'bg-warning/10 text-warning border-orange-500/20';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-gray-500/10 text-muted-foreground border-gray-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'think': return <Brain className="w-4 h-4" />;
      case 'see': return <Eye className="w-4 h-4" />;
      case 'act': return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
      {/* Modern Header with Trinity Navigation */}
      <div className="relative overflow-hidden bg-card/70 dark:bg-background/70 backdrop-blur-xl border-b border-border/50 dark:border-slate-700/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5" />
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                Nexus Organizational Command Center
              </h1>
              <p className="text-muted-foreground dark:text-muted-foreground mt-1">
                Single source of truth for organizational intelligence • Powered by Trinity
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-4 py-2 bg-success/5 text-success border-green-200">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                All Systems Active
              </Badge>
            </div>
          </div>

          {/* Trinity Navigation Pills */}
          <div className="flex space-x-2">
            {[
              { key: 'think', icon: Brain, label: 'THINK', color: 'blue' },
              { key: 'see', icon: Eye, label: 'SEE', color: 'purple' },
              { key: 'act', icon: Zap, label: 'ACT', color: 'indigo' }
            ].map(({ key, icon: Icon, label, color }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as any)}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeSection === key
                    ? `bg-${color}-500/10 text-${color}-700 dark:text-${color}-300 border-${color}-200 shadow-lg shadow-${color}-500/10`
                    : 'text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-background'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Trinity Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* THINK Metrics */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-4 rounded-xl bg-primary/10 text-primary">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">THINK Engine</CardTitle>
                    <CardDescription>Creative Intelligence</CardDescription>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary border-border">
                  {trinityMetrics.think.innovationScore}% Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-card/60 dark:bg-background/40">
                  <div className="text-2xl font-bold text-primary">{trinityMetrics.think.ideasCaptured}</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">Ideas Captured</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-card/60 dark:bg-background/40">
                  <div className="text-2xl font-bold text-primary">{trinityMetrics.think.collaborationSessions}</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">Active Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEE Metrics */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-4 rounded-xl bg-purple-500/10 text-secondary">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">SEE Analytics</CardTitle>
                    <CardDescription>Business Intelligence</CardDescription>
                  </div>
                </div>
                <Badge className="bg-secondary/10 text-purple-800 border-purple-200">
                  {trinityMetrics.see.predictiveAccuracy}% Accuracy
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-card/60 dark:bg-background/40">
                  <div className="text-2xl font-bold text-secondary">{trinityMetrics.see.dataSourcesConnected}</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">Data Sources</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-card/60 dark:bg-background/40">
                  <div className="text-2xl font-bold text-secondary">{trinityMetrics.see.realTimeInsights}</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">Live Insights</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ACT Metrics */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-indigo-50 to-blue-50/50 dark:from-indigo-950/20 dark:to-blue-950/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-4 rounded-xl bg-primary/10 text-primary">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">ACT Automation</CardTitle>
                    <CardDescription>Operational Intelligence</CardDescription>
                  </div>
                </div>
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  {trinityMetrics.act.processEfficiency}% Efficient
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-card/60 dark:bg-background/40">
                  <div className="text-2xl font-bold text-primary">{trinityMetrics.act.automationsRunning}</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">Active Automations</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-card/60 dark:bg-background/40">
                  <div className="text-2xl font-bold text-primary">{Math.floor(trinityMetrics.act.timeSaved / 60)}h</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">Time Saved</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizational Health Score - New Command Center View */}
        <OrganizationalHealthScore className="mb-8" />

        {/* Cross-Department Intelligence Grid */}
        <CrossDepartmentMatrix className="mb-8" />

        {/* Trinity Insights Engine */}
        <TrinityInsightsEngine className="mb-8" />

        {/* Trinity Flow Visualization and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trinity Flow Chart */}
          <Card className="border-0 bg-card/70 dark:bg-background/70 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                    Trinity Performance Flow
                  </CardTitle>
                  <CardDescription>Real-time intelligence cycle metrics</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  View Details <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={trinityData} />
            </CardContent>
          </Card>

          {/* Enhanced Activity Feed */}
          <Card className="border-0 bg-card/70 dark:bg-background/70 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-success" />
                    Trinity Activity Stream
                  </CardTitle>
                  <CardDescription>Live organizational intelligence flow</CardDescription>
                </div>
                <Badge variant="outline" className="animate-pulse">
                  <div className="w-2 h-2 bg-success rounded-full mr-2" />
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-slate-50/60 dark:bg-background/40 hover:bg-muted/60 dark:hover:bg-slate-700/40 transition-colors">
                  <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                    {getTypeIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{activity.title}</div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground">{activity.department}</div>
                  </div>
                  <div className="text-xs text-muted-foreground dark:text-muted-foreground">{activity.time}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Smart Insights Panel */}
        <Card className="border-0 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-indigo-50/50 dark:from-slate-900/50 dark:via-slate-800/30 dark:to-slate-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-xl">
                  <Sparkles className="w-6 h-6 mr-3 text-warning" />
                  AI-Powered Trinity Insights
                </CardTitle>
                <CardDescription>Intelligent recommendations from your organizational data</CardDescription>
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Lightbulb className="w-4 h-4 mr-2" />
                Generate New Insights
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-card/60 dark:bg-background/40 space-y-4">
                <div className="flex items-center text-primary">
                  <Brain className="w-5 h-5 mr-2" />
                  <span className="font-medium">Think Insight</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Cross-department collaboration has increased 34% this week. Consider expanding innovation sessions.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card/60 dark:bg-background/40 space-y-4">
                <div className="flex items-center text-secondary">
                  <Eye className="w-5 h-5 mr-2" />
                  <span className="font-medium">See Insight</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Revenue pattern shows 15% uptick correlation with new automation deployment.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card/60 dark:bg-background/40 space-y-4">
                <div className="flex items-center text-primary">
                  <Zap className="w-5 h-5 mr-2" />
                  <span className="font-medium">Act Insight</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Workflow optimization opportunity detected in customer onboarding process.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedDashboard;