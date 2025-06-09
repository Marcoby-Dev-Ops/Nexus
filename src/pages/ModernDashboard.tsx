import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Eye, 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  Activity,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  Bot,
  Lightbulb,
  Database,
  Workflow,
  Building2,
  RefreshCw
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ModernKpiCard from '@/components/dashboard/ModernKpiCard';
import ModernChartCard from '@/components/dashboard/ModernChartCard';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import '@/styles/dashboard-animations.css';

/**
 * @name ModernDashboard
 * @description Modern dashboard with contemporary design principles and Trinity integration
 * @returns {JSX.Element} The rendered modern dashboard.
 */

const ModernDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'think' | 'see' | 'act'>('overview');

  // Comprehensive KPI Data with enhanced metrics
  const trinityKpis = [
    {
      title: 'Ideas Generated',
      value: '347',
      change: '+23%',
      trend: 'up' as const,
      icon: Brain,
      iconColor: 'text-blue-600',
      gradientFrom: 'from-blue-50',
      gradientTo: 'to-cyan-50/50',
      description: 'Creative thoughts captured'
    },
    {
      title: 'Live Insights',
      value: '156',
      change: '+34%',
      trend: 'up' as const,
      icon: Eye,
      iconColor: 'text-purple-600',
      gradientFrom: 'from-purple-50',
      gradientTo: 'to-pink-50/50',
      description: 'Real-time analytics'
    },
    {
      title: 'Automations',
      value: '24',
      change: '+18%',
      trend: 'up' as const,
      icon: Zap,
      iconColor: 'text-indigo-600',
      gradientFrom: 'from-indigo-50',
      gradientTo: 'to-blue-50/50',
      description: 'Active workflows'
    },
    {
      title: 'Revenue Impact',
      value: '$124K',
      change: '+45%',
      trend: 'up' as const,
      icon: DollarSign,
      iconColor: 'text-green-600',
      gradientFrom: 'from-green-50',
      gradientTo: 'to-emerald-50/50',
      description: 'Trinity ROI'
    },
    {
      title: 'Active Users',
      value: '89',
      change: '+12%',
      trend: 'up' as const,
      icon: Users,
      iconColor: 'text-orange-600',
      gradientFrom: 'from-orange-50',
      gradientTo: 'to-red-50/50',
      description: 'Platform adoption'
    },
    {
      title: 'Time Saved',
      value: '247h',
      change: '+56%',
      trend: 'up' as const,
      icon: Target,
      iconColor: 'text-emerald-600',
      gradientFrom: 'from-emerald-50',
      gradientTo: 'to-teal-50/50',
      description: 'Process efficiency'
    }
  ];

  // Chart data
  const trinityPerformanceData = [
    { name: 'Think', value: 347 },
    { name: 'See', value: 156 },
    { name: 'Act', value: 24 },
    { name: 'Impact', value: 124 }
  ];

  const weeklyTrendData = [
    { name: 'Mon', value: 65 },
    { name: 'Tue', value: 78 },
    { name: 'Wed', value: 85 },
    { name: 'Thu', value: 92 },
    { name: 'Fri', value: 98 },
    { name: 'Sat', value: 45 },
    { name: 'Sun', value: 38 }
  ];

  // Activity feed
  const recentActivities = [
    {
      type: 'think',
      title: 'Innovation Session Completed',
      description: 'Sales team generated 12 new customer acquisition ideas',
      time: '2 minutes ago',
      impact: 'high'
    },
    {
      type: 'see',
      title: 'Revenue Anomaly Detected',
      description: 'AI identified 15% uptick in enterprise segment',
      time: '8 minutes ago',
      impact: 'critical'
    },
    {
      type: 'act',
      title: 'Workflow Optimized',
      description: 'Customer onboarding process automated, saving 2.3 hours daily',
      time: '15 minutes ago',
      impact: 'medium'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'think': return <Brain className="w-4 h-4" />;
      case 'see': return <Eye className="w-4 h-4" />;
      case 'act': return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'think': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'see': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'act': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
      {/* Header */}
      <div className="flex-none">
        <Header toggleSidebar={function (): void {
                  throw new Error('Function not implemented.');
              } } />
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="flex-none">
          <Sidebar isOpen={false} toggleSidebar={function (): void {
                      throw new Error('Function not implemented.');
                  } } />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Compact Header with Trinity Navigation */}
            <div className="relative overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-xl p-4 shadow-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-6">
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                      Trinity Dashboard
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Organizational Operating System
                    </p>
                  </div>
                  
                  {/* Trinity Navigation - Compact */}
                  <div className="flex space-x-1">
                    {[
                      { key: 'overview', label: 'Overview', icon: BarChart3 },
                      { key: 'think', label: 'THINK', icon: Brain },
                      { key: 'see', label: 'SEE', icon: Eye },
                      { key: 'act', label: 'ACT', icon: Zap }
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key as any)}
                        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                          activeTab === key
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/50'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-1" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className="px-3 py-1 bg-green-50 text-green-700 border-green-200 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                    Active
                  </Badge>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <Bot className="w-4 h-4 mr-1" />
                    AI
                  </Button>
                </div>
              </div>
            </div>

            {/* Comprehensive Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {trinityKpis.map((kpi, index) => (
                <ModernKpiCard
                  key={index}
                  title={kpi.title}
                  value={kpi.value}
                  change={kpi.change}
                  trend={kpi.trend}
                  icon={kpi.icon}
                  iconColor={kpi.iconColor}
                  gradientFrom={kpi.gradientFrom}
                  gradientTo={kpi.gradientTo}
                  description={kpi.description}
                  actionLabel="View Details"
                  onAction={() => console.log(`View ${kpi.title} details`)}
                />
              ))}
            </div>

            {/* Comprehensive Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ModernChartCard
                title="Trinity Performance"
                description="Real-time intelligence metrics"
                icon={BarChart3}
                iconColor="text-blue-600"
                actionLabel="Analytics"
                trend={{ value: "+28%", direction: "up" }}
                onAction={() => console.log('View analytics')}
                className="h-80"
              >
                <SimpleBarChart data={trinityPerformanceData} />
              </ModernChartCard>

              <ModernChartCard
                title="Weekly Trends"
                description="System engagement patterns"
                icon={TrendingUp}
                iconColor="text-green-600"
                actionLabel="Optimize"
                trend={{ value: "+15%", direction: "up" }}
                onAction={() => console.log('Optimize workflows')}
                className="h-80"
              >
                <SimpleBarChart data={weeklyTrendData} />
              </ModernChartCard>

              {/* New: Department Performance Card */}
              <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg h-80">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                        Department Health
                      </CardTitle>
                      <CardDescription className="text-sm">Cross-functional performance</CardDescription>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { dept: 'Sales', score: 94, change: '+8%', color: 'bg-green-500' },
                    { dept: 'Finance', score: 87, change: '+3%', color: 'bg-blue-500' },
                    { dept: 'Operations', score: 91, change: '+12%', color: 'bg-purple-500' },
                    { dept: 'Marketing', score: 89, change: '+5%', color: 'bg-orange-500' }
                  ].map((dept) => (
                    <div key={dept.dept} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/60 dark:bg-slate-800/40">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${dept.color}`} />
                        <span className="font-medium text-sm">{dept.dept}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{dept.score}%</span>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">{dept.change}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Information-Dense Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Compact Activity Feed */}
              <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center text-lg">
                        <Activity className="w-4 h-4 mr-2 text-green-600" />
                        Live Activity
                      </CardTitle>
                      <CardDescription className="text-sm">Recent Trinity events</CardDescription>
                    </div>
                    <Badge variant="outline" className="animate-pulse bg-green-50 border-green-200 text-xs">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                      Live
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentActivities.slice(0, 6).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-700/40 transition-all duration-200">
                      <div className={`p-1.5 rounded-md ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                            {activity.title}
                          </p>
                          <Badge className={`text-xs border ml-2 ${getImpactBadge(activity.impact)}`}>
                            {activity.impact}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{activity.description}</p>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">{activity.time.split(' ')[0]}m</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Compact AI Insights */}
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center text-lg">
                        <Bot className="w-4 h-4 mr-2 text-blue-600" />
                        AI Insights
                      </CardTitle>
                      <CardDescription className="text-sm">Smart recommendations</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white/70 h-8 px-3">
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-600">
                    <div className="flex items-center text-blue-600 mb-1">
                      <Brain className="w-3 h-3 mr-1" />
                      <span className="font-medium text-xs">Innovation Boost</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      Collaboration up 34%. Expand innovation sessions.
                    </p>
                  </div>
                  
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-600">
                    <div className="flex items-center text-purple-600 mb-1">
                      <Eye className="w-3 h-3 mr-1" />
                      <span className="font-medium text-xs">Revenue Pattern</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      15% correlation with automation. Focus on Q2.
                    </p>
                  </div>
                  
                  <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-600">
                    <div className="flex items-center text-indigo-600 mb-1">
                      <Zap className="w-3 h-3 mr-1" />
                      <span className="font-medium text-xs">Process Boost</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      40% faster onboarding ready to implement.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Panel */}
              <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Zap className="w-4 h-4 mr-2 text-orange-600" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription className="text-sm">Shortcuts to key functions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: 'Create Thought', icon: Brain, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Run Analysis', icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Start Automation', icon: Workflow, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'View Reports', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'AI Assistant', icon: Bot, color: 'text-orange-600', bg: 'bg-orange-50' }
                  ].map((action, index) => (
                    <button
                      key={index}
                      className={`w-full flex items-center p-2 rounded-lg ${action.bg} hover:shadow-md transition-all duration-200 group`}
                    >
                      <action.icon className={`w-4 h-4 mr-2 ${action.color}`} />
                      <span className="font-medium text-sm text-slate-700 group-hover:text-slate-900">{action.label}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;