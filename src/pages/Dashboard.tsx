import React, { Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, UserPlus, BarChart2, Zap, CalendarPlus, Bot, LogIn, Handshake, FileText, TrendingUp, ArrowUpRight, DollarSign, Banknote, Settings } from 'lucide-react';

// UI Components
import { Spinner } from '@/components/ui/Spinner';
import Skeleton from '@/components/lib/Skeleton';
import { Card } from '@/components/ui/Card';

// Dashboard Components
import QuickLaunchTiles from '@/components/dashboard/QuickLaunchTiles';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import StatsCard from '@/components/dashboard/StatsCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
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
  { title: 'Total Revenue', value: '$124,580', delta: '+12.5%', trend: 'up' },
  { title: 'New Customers', value: 24, delta: '+8.3%', trend: 'up' },
  { title: 'Active Projects', value: 18, delta: '-2.1%', trend: 'down' },
  { title: 'Task Completion', value: '84%', delta: '+1.2%', trend: 'up' },
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
  { name: 'Closed Won', value: 14 },
  { name: 'Closed Lost', value: 5 },
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
    <div className="space-y-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground dark:text-primary-foreground mb-2">
                Good morning! 👋
              </h1>
              <p className="text-lg text-muted-foreground dark:text-muted-foreground">
                Here's what's happening with your business today
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Today's Date</p>
                <p className="font-semibold text-foreground dark:text-primary-foreground">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced KPI Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, i) => (
            <ContentCard key={kpi.title} variant="elevated" className="group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="w-6 h-6 text-primary-foreground" />
                  ) : (
                    <BarChart2 className="w-6 h-6 text-primary-foreground" />
                  )}
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-4.5 py-4 rounded-full text-xs font-medium ${
                    kpi.trend === 'up' 
                      ? 'bg-success/10 text-success dark:bg-success/20 dark:text-success' 
                      : 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive'
                  }`}>
                    {kpi.delta}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">
                  {kpi.title}
                </p>
                <p className="text-2xl font-bold text-foreground dark:text-primary-foreground">
                  {kpi.value}
                </p>
              </div>
            </ContentCard>
          ))}
        </div>

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ContentCard variant="elevated" className="hover:shadow-xl transition-all duration-300" 
            action={
              <button className="flex items-center space-x-2 px-4 py-4 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 font-medium border border-border">
                <span className="text-sm">View Details</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            }>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground dark:text-primary-foreground mb-2">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">Monthly performance overview</p>
            </div>
            <SimpleBarChart data={revenueTrend} />
          </ContentCard>
          
          <ContentCard variant="elevated" className="hover:shadow-xl transition-all duration-300"
            action={
              <button className="flex items-center space-x-2 px-4 py-4 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 font-medium border border-border">
                <span className="text-sm">View Details</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            }>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground dark:text-primary-foreground mb-2">Pipeline Funnel</h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">Sales pipeline progress</p>
            </div>
            <SimpleBarChart data={pipelineFunnel} />
          </ContentCard>
        </div>

        {/* Enhanced Activity Feed & AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ContentCard 
            title="Recent Activity" 
            variant="elevated"
            action={
              <button className="px-4 py-4 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 text-sm font-medium border border-border">
                View All
              </button>
            }>
            <div className="space-y-4">
              {activityFeed.slice(0, 5).map((activity, i) => {
                let Icon = LogIn;
                let iconColor = 'text-muted-foreground';
                if (activity.type === 'deal') { Icon = Handshake; iconColor = 'text-success'; }
                else if (activity.type === 'invoice') { Icon = FileText; iconColor = 'text-primary'; }
                
                return (
                  <div key={i} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-muted/50 transition-colors duration-200">
                    <div className={`p-4 rounded-lg bg-muted ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground dark:text-primary-foreground">
                        <span className="font-medium">{activity.user}</span> {activity.note}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">{activity.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ContentCard>

          <ContentCard variant="elevated" className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 rounded-lg bg-background/20">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">AI Insights</h3>
              </div>
            </div>
            <div className="space-y-4">
              {aiInsights.slice(0, 4).map((insight, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="w-2 h-2 rounded-full bg-background/60 mt-2 flex-shrink-0"></div>
                  <p className="text-primary-foreground/90">{insight}</p>
                </div>
              ))}
            </div>
            <button className="mt-6 w-full bg-background/20 hover:bg-background/30 backdrop-blur-sm rounded-xl px-4 py-4 text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2">
              <span>Get More Insights</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </ContentCard>
        </div>

        {/* Enhanced Quick Launch */}
        <ContentCard variant="elevated" title="Quick Actions">
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-6">Get things done faster with these shortcuts</p>
          <QuickLaunchTiles actions={quickLaunchActions} />
        </ContentCard>

        {/* Enhanced Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            className="group cursor-pointer h-full"
            onClick={() => navigate('/sales')}
          >
            <ContentCard 
              variant="elevated"
              className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full flex flex-col"
            >
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <DollarSign className="w-6 h-6 text-primary-foreground" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Sales Dashboard</h3>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed flex-grow">
              Track deals, manage pipelines, and analyze sales performance with AI-powered insights.
            </p>
            <div className="text-primary text-sm font-medium group-hover:text-primary/80 transition-colors duration-300 mt-auto">
              Open Dashboard →
            </div>
            </ContentCard>
          </div>

          <div 
            className="group cursor-pointer h-full"
            onClick={() => navigate('/finance')}
          >
            <ContentCard 
              variant="elevated"
              className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Banknote className="w-6 h-6 text-primary-foreground" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Finance Hub</h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed flex-grow">
                Manage invoices, expenses, and financial reports with automated reconciliation.
              </p>
              <div className="text-primary text-sm font-medium group-hover:text-primary/80 transition-colors duration-300 mt-auto">
                Open Hub →
              </div>
            </ContentCard>
          </div>

          <div 
            className="group cursor-pointer h-full"
            onClick={() => navigate('/operations')}
          >
            <ContentCard 
              variant="elevated"
              className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Settings className="w-6 h-6 text-primary-foreground" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Operations Center</h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed flex-grow">
                Streamline workflows, manage inventory, and optimize business processes.
              </p>
              <div className="text-primary text-sm font-medium group-hover:text-primary/80 transition-colors duration-300 mt-auto">
                Open Center →
              </div>
            </ContentCard>
          </div>
        </div>

        <MultiAgentPanel open={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </div>
  );
};

export default Dashboard; 