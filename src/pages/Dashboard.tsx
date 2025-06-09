import React, { Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, UserPlus, BarChart2, Zap, CalendarPlus, Bot, LogIn, Handshake, FileText, TrendingUp, ArrowUpRight, DollarSign, Banknote, Settings, Command, Sparkles, Star, Trophy, Target } from 'lucide-react';
import { motion } from 'framer-motion';

// UI Components
import { Spinner } from '@/components/ui/Spinner';
import Skeleton from '@/components/lib/Skeleton';
import { Card } from '@/components/ui/Card';

// Dashboard Components
import QuickLaunchTiles from '@/components/dashboard/QuickLaunchTiles';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import StatsCard from '@/components/dashboard/StatsCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import ModernKpiCard from '@/components/dashboard/ModernKpiCard';
import ModernChartCard from '@/components/dashboard/ModernChartCard';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import MultiAgentPanel from '@/components/dashboard/MultiAgentPanel';

// Patterns
import { ContentCard } from '@/components/patterns/ContentCard';

// Note: RevenueChart and PipelineChart components not found, using SimpleBarChart instead

/**
 * @name Dashboard
 * @description Main dashboard page for NEXUS.
 * @returns {JSX.Element} The rendered dashboard.
 */
const kpiData = [
  { title: 'Total Revenue', value: '$124,580', delta: '+12.5%', trend: 'up', icon: DollarSign, color: 'green' },
  { title: 'New Customers', value: 24, delta: '+8.3%', trend: 'up', icon: UserPlus, color: 'blue' },
  { title: 'Active Projects', value: 18, delta: '-2.1%', trend: 'down', icon: BarChart2, color: 'orange' },
  { title: 'Task Completion', value: '84%', delta: '+1.2%', trend: 'up', icon: TrendingUp, color: 'purple' },
  { title: 'Open Deals', value: 12, delta: '+15.7%', trend: 'up', icon: Handshake, color: 'indigo' },
  { title: 'Response Time', value: '2.4h', delta: '-18.2%', trend: 'up', icon: Zap, color: 'cyan' },
];

const revenueTrend = [
  { name: 'Jan', value: 65000 },
  { name: 'Feb', value: 59000 },
  { name: 'Mar', value: 80000 },
  { name: 'Apr', value: 81000 },
  { name: 'May', value: 56000 },
  { name: 'Jun', value: 85000 },
  { name: 'Jul', value: 124500 },
];

const pipelineFunnel = [
  { name: 'Prospect', value: 24 },
  { name: 'Qualified', value: 18 },
  { name: 'Proposal', value: 12 },
  { name: 'Negotiation', value: 8 },
  { name: 'Closed Won', value: 14 }
];

const activityFeed = [
  { user: 'John Smith', note: 'closed deal with Acme Corp for $15,000', date: '10 min ago', type: 'deal' },
  { user: 'Sarah Chen', note: 'generated invoice #1247 for TechStart Inc', date: '23 min ago', type: 'invoice' },
  { user: 'Mike Johnson', note: 'logged into the system', date: '1 hour ago', type: 'login' },
  { user: 'Emma Wilson', note: 'updated contact information for Global Solutions', date: '2 hours ago', type: 'contact' },
  { user: 'David Kim', note: 'scheduled demo for next Tuesday', date: '3 hours ago', type: 'meeting' },
];

const aiInsights = [
  'Revenue is 12% above target this month',
  'Top 3 deals are likely to close within 2 weeks',
  'Customer satisfaction score improved by 8%',
  'Inventory levels are optimal for current demand',
  'Marketing ROI increased 15% compared to last quarter',
];

// Generate sparkline data for each KPI
const kpiSparklines = [
  [45, 52, 48, 61, 58, 65, 62], // Revenue trend
  [12, 15, 18, 16, 20, 22, 24], // Customers trend
  [22, 20, 18, 19, 17, 18, 18], // Projects trend
  [78, 80, 82, 81, 83, 84, 84], // Completion trend
];

// AI Success Banner Component - Shows immediate wins
const AISuccessBanner: React.FC = () => {
  const [currentWin, setCurrentWin] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const successMoments = [
    {
      icon: "🎯",
      title: "AI Detected Opportunity",
      message: "3 high-value leads identified in your pipeline",
      action: "Estimated $45,000 in potential revenue",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: "⚡",
      title: "Automation Success",
      message: "Workflow processed 12 tasks automatically",
      action: "Saved 4.5 hours of manual work today",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: "🚀",
      title: "Performance Boost",
      message: "Team productivity increased 23% this week",
      action: "AI recommendations implemented",
      color: "from-purple-500 to-pink-600"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWin((prev) => (prev + 1) % successMoments.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className={`p-4 rounded-xl bg-gradient-to-r ${successMoments[currentWin].color} text-white shadow-lg relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl">{successMoments[currentWin].icon}</div>
            <div>
              <div className="font-bold text-lg">{successMoments[currentWin].title}</div>
              <div className="text-white/90">{successMoments[currentWin].message}</div>
              <div className="text-xs text-white/80 mt-1">{successMoments[currentWin].action}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-6 h-6" />
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// AI Insight Carousel Component - Shows rotating insights
const AIInsightCarousel: React.FC<{ insights: string[] }> = ({ insights }) => {
  const [currentInsight, setCurrentInsight] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % insights.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [insights]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700/50"
    >
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-indigo-800 dark:text-indigo-200">AI Insight</span>
        </div>
        <motion.div
          key={currentInsight}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1"
        >
          <span className="text-indigo-700 dark:text-indigo-300">
            {insights[currentInsight]}
          </span>
        </motion.div>
        <div className="flex space-x-1">
          {insights.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentInsight
                  ? 'bg-indigo-600 dark:bg-indigo-400'
                  : 'bg-indigo-300 dark:bg-indigo-600'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const quickLaunchActions = [
    { label: 'New Deal', icon: <Handshake className="w-5 h-5" />, onClick: () => console.log('New Deal') },
    { label: 'Add Contact', icon: <UserPlus className="w-5 h-5" />, onClick: () => console.log('Add Contact') },
    { label: 'Create Invoice', icon: <FilePlus className="w-5 h-5" />, onClick: () => console.log('Create Invoice') },
    { label: 'Schedule Meeting', icon: <CalendarPlus className="w-5 h-5" />, onClick: () => console.log('Schedule Meeting') },
    { label: 'Run Report', icon: <BarChart2 className="w-5 h-5" />, onClick: () => console.log('Run Report') },
    { label: 'AI Assistant', icon: <Bot className="w-5 h-5" />, onClick: () => setIsAssistantOpen(true) },
  ];

  return (
    <div className="space-y-6">
        {/* Optimized Header */}
        <div className="flex items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-primary-foreground flex items-center">
              Good morning! 👋
              <span className="ml-3 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20">
                Business Overview
              </span>
            </h1>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • Real-time insights
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/nexus')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
            >
              <Command className="w-4 h-4 mr-2 inline" />
              Command Center
            </button>
          </div>
        </div>

        {/* MAGIC MOMENT BANNER - Shows immediate AI-generated wins */}
        <AISuccessBanner />

        {/* AI INSIGHT CAROUSEL - Rotating real-time insights */}
        <AIInsightCarousel insights={aiInsights} />

        {/* Optimized KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpiData.map((kpi, i) => (
            <ContentCard key={kpi.title} variant="elevated" className="group hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg bg-${kpi.color}-100 dark:bg-${kpi.color}-900/20`}>
                  <kpi.icon className={`w-5 h-5 text-${kpi.color}-600 dark:text-${kpi.color}-400`} />
                </div>
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                  kpi.trend === 'up' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {kpi.delta}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground mb-1">
                  {kpi.title}
                </p>
                <p className="text-xl font-bold text-foreground dark:text-primary-foreground">
                  {kpi.value}
                </p>
              </div>
            </ContentCard>
          ))}
        </div>

        {/* Compact Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ContentCard variant="elevated" className="hover:shadow-lg transition-all duration-200 h-80" 
            action={
              <button className="px-3 py-1 bg-primary/5 text-primary hover:bg-primary/10 rounded-md text-xs font-medium">
                Details
              </button>
            }>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-foreground dark:text-primary-foreground mb-1">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">Monthly performance</p>
            </div>
            <SimpleBarChart data={revenueTrend} />
          </ContentCard>
          
          <ContentCard variant="elevated" className="hover:shadow-lg transition-all duration-200 h-80"
            action={
              <button className="px-3 py-1 bg-primary/5 text-primary hover:bg-primary/10 rounded-md text-xs font-medium">
                Details
              </button>
            }>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-foreground dark:text-primary-foreground mb-1">Pipeline Funnel</h3>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">Sales progress</p>
            </div>
            <SimpleBarChart data={pipelineFunnel} />
          </ContentCard>

          {/* Performance Metrics Card */}
          <ContentCard variant="elevated" className="hover:shadow-lg transition-all duration-200 h-80 overflow-hidden">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-foreground dark:text-primary-foreground mb-1">Performance</h3>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">Key indicators</p>
            </div>
            <div className="space-y-1.5 h-56 overflow-y-auto">
              {/* Conversion Rate */}
              <div className="flex items-center justify-between p-1.5 rounded-md bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">Conversion Rate</p>
                    <p className="text-sm font-bold text-foreground">4.2%</p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
                  +0.8%
                </span>
              </div>

              {/* Avg Deal Size */}
              <div className="flex items-center justify-between p-1.5 rounded-md bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">Avg Deal Size</p>
                    <p className="text-sm font-bold text-foreground">$5.2K</p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex-shrink-0">
                  +12%
                </span>
              </div>

              {/* Sales Velocity */}
              <div className="flex items-center justify-between p-1.5 rounded-md bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">Sales Velocity</p>
                    <p className="text-sm font-bold text-foreground">18 days</p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
                  -3 days
                </span>
              </div>

              {/* Win Rate */}
              <div className="flex items-center justify-between p-1.5 rounded-md bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">Win Rate</p>
                    <p className="text-sm font-bold text-foreground">68%</p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 flex-shrink-0">
                  +5%
                </span>
              </div>

              {/* Customer LTV */}
              <div className="flex items-center justify-between p-1.5 rounded-md bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">Customer LTV</p>
                    <p className="text-sm font-bold text-foreground">$24K</p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 flex-shrink-0">
                  +18%
                </span>
              </div>
            </div>
          </ContentCard>
        </div>

        {/* Information-Dense Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Compact Activity Feed */}
          <ContentCard 
            title="Recent Activity" 
            variant="elevated"
            className="lg:col-span-2"
            action={
              <button className="px-3 py-1 bg-primary/5 text-primary hover:bg-primary/10 rounded-md text-xs font-medium">
                View All
              </button>
            }>
            <div className="space-y-2">
              {activityFeed.slice(0, 6).map((activity, i) => {
                let Icon = LogIn;
                let iconColor = 'text-muted-foreground';
                if (activity.type === 'deal') { Icon = Handshake; iconColor = 'text-green-600'; }
                else if (activity.type === 'invoice') { Icon = FileText; iconColor = 'text-blue-600'; }
                
                return (
                  <div key={i} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                    <div className={`p-2 rounded-md bg-muted ${iconColor}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        <span className="font-medium">{activity.user}</span> {activity.note}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ContentCard>

          {/* Compact AI Insights */}
          <ContentCard variant="elevated" className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 rounded-lg bg-background/20">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold">AI Insights</h3>
            </div>
            <div className="space-y-2">
              {aiInsights.slice(0, 4).map((insight, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-background/60 mt-2 flex-shrink-0"></div>
                  <p className="text-xs text-primary-foreground/90 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full bg-background/20 hover:bg-background/30 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200">
              More Insights
            </button>
          </ContentCard>

          {/* Quick Actions */}
          <ContentCard variant="elevated" title="Quick Actions" className="h-fit">
            <div className="space-y-2">
              {quickLaunchActions.slice(0, 5).map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  className="w-full flex items-center p-2 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-200 group"
                >
                  <div className="p-2 rounded-md bg-primary/10 text-primary mr-3">
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </ContentCard>
        </div>

        {/* Compact Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Trinity Dashboard Feature Card */}
          <div 
            className="group cursor-pointer h-full"
            onClick={() => navigate('/modern-dashboard')}
          >
            <ContentCard 
              variant="elevated"
              className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 h-full flex flex-col bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20"
            >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                NEW
              </div>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Trinity Dashboard</h3>
            <p className="text-muted-foreground text-xs mb-3 leading-relaxed flex-grow">
              THINK + SEE + ACT system with glass-morphism design and AI insights.
            </p>
            <div className="text-purple-600 text-xs font-medium group-hover:text-purple-500 transition-colors duration-300 mt-auto">
              Explore Trinity →
            </div>
            </ContentCard>
          </div>
          {[
            { path: '/sales', icon: DollarSign, title: 'Sales Dashboard', desc: 'Track deals & pipelines', color: 'green' },
            { path: '/finance', icon: Banknote, title: 'Finance Hub', desc: 'Invoices & reports', color: 'blue' },
            { path: '/operations', icon: Settings, title: 'Operations', desc: 'Workflows & inventory', color: 'orange' }
          ].map((module, i) => (
            <div 
              key={i}
              className="group cursor-pointer h-full"
              onClick={() => navigate(module.path)}
            >
              <ContentCard 
                variant="elevated"
                className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 h-full flex flex-col"
              >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg bg-${module.color}-100 dark:bg-${module.color}-900/20 shadow-md`}>
                  <module.icon className={`w-5 h-5 text-${module.color}-600 dark:text-${module.color}-400`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{module.title}</h3>
              <p className="text-muted-foreground text-xs mb-3 leading-relaxed flex-grow">
                {module.desc}
              </p>
              <div className="text-primary text-xs font-medium group-hover:text-primary/80 transition-colors duration-200 mt-auto">
                Open →
              </div>
              </ContentCard>
            </div>
          ))}
        </div>

        <MultiAgentPanel open={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </div>
  );
};

export default Dashboard; 