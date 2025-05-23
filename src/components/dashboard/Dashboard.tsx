import React, { Suspense, useEffect, useState } from 'react';
import StatsCard from './StatsCard';
import QuickLaunchTiles from './QuickLaunchTiles';
import { FilePlus, UserPlus, BarChart2, Zap, CalendarPlus, Bot } from 'lucide-react';
import Spinner from '../Spinner';
import Skeleton from '../lib/Skeleton';

/**
 * @name Dashboard
 * @description Main dashboard page for NEXUS.
 * @returns {JSX.Element} The rendered dashboard.
 */
const kpiData = [
  {
    title: 'Total Revenue',
    value: '$124,580',
    delta: 12.5,
    deltaLabel: 'vs last month',
    icon: (
      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v7m0 0h4m-4 0H8" /></svg>
    ),
  },
  {
    title: 'New Customers',
    value: 24,
    delta: 8.3,
    deltaLabel: 'vs last month',
    icon: (
      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    ),
  },
  {
    title: 'Active Projects',
    value: 18,
    delta: -2.1,
    deltaLabel: 'vs last month',
    icon: (
      <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" /><circle cx="9" cy="7" r="4" /></svg>
    ),
  },
  {
    title: 'Task Completion',
    value: '84%',
    progress: 84,
    delta: 1.2,
    deltaLabel: 'vs last month',
    icon: (
      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
    ),
  },
];

const revenueData = [
  { date: 'Jan', revenue: 65000 },
  { date: 'Feb', revenue: 59000 },
  { date: 'Mar', revenue: 80000 },
  { date: 'Apr', revenue: 81000 },
  { date: 'May', revenue: 56000 },
  { date: 'Jun', revenue: 85000 },
  { date: 'Jul', revenue: 124500 },
];

const pipelineData = [
  { stage: 'Prospect', deals: 24 },
  { stage: 'Qualified', deals: 18 },
  { stage: 'Proposal', deals: 12 },
  { stage: 'Negotiation', deals: 8 },
  { stage: 'Closed Won', deals: 14 },
  { stage: 'Closed Lost', deals: 5 },
];

const quickLaunchActions = [
  { label: 'New Invoice', icon: <FilePlus className="w-5 h-5" />, onClick: () => alert('New Invoice') },
  { label: 'Add Client', icon: <UserPlus className="w-5 h-5" />, onClick: () => alert('Add Client') },
  { label: 'Sales Report', icon: <BarChart2 className="w-5 h-5" />, onClick: () => alert('Sales Report') },
  { label: 'Run Automation', icon: <Zap className="w-5 h-5" />, onClick: () => alert('Run Automation') },
  { label: 'Schedule Task', icon: <CalendarPlus className="w-5 h-5" />, onClick: () => alert('Schedule Task') },
  { label: 'Ask AI', icon: <Bot className="w-5 h-5" />, onClick: () => alert('Ask AI') },
];

const RevenueChart = React.lazy(() => import('./RevenueChart'));
const PipelineChart = React.lazy(() => import('./PipelineChart'));

// Helper to generate a simple SVG sparkline from an array of numbers
const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data
    .map((d, i) => `${(i / (data.length - 1)) * 60},${16 - ((d - min) / (max - min || 1)) * 12}`)
    .join(' ');
  return (
    <svg width="64" height="18" viewBox="0 0 64 18" fill="none" className="text-primary/70">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
};

// Example 7-day data for each KPI (replace with real data as needed)
const kpiSparklines = [
  [120, 122, 121, 124, 123, 125, 124],
  [20, 22, 21, 23, 24, 23, 24],
  [15, 16, 17, 18, 17, 18, 18],
  [80, 82, 83, 84, 83, 84, 84],
];

const Dashboard: React.FC = () => {
  const [showCharts, setShowCharts] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => setShowCharts(true));
    } else {
      setTimeout(() => setShowCharts(true), 1);
    }
    // Simulate loading for 1.5s
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pt-4 pb-4 sm:pt-6 sm:pb-6 bg-card/80 rounded-xl shadow-lg w-full max-w-7xl mx-auto min-w-0">
      {/* KPIs and Charts unified grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
        {/* KPI Cards */}
        <div className="flex flex-col gap-4 min-w-0">
          {kpiData.map((item, idx) => (
            <StatsCard key={item.title} {...item} sparkline={<Sparkline data={kpiSparklines[idx]} />} loading={loading} />
          ))}
        </div>
        {/* Charts */}
        <div className="flex flex-col gap-4 min-w-0 sm:col-span-1 lg:col-span-2 w-full">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <Skeleton className="h-64 w-full min-w-0" />
              <Skeleton className="h-64 w-full min-w-0" />
            </div>
          ) : showCharts ? (
            <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0"><Skeleton className="h-64 w-full min-w-0" /><Skeleton className="h-64 w-full min-w-0" /></div>}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                <RevenueChart data={revenueData} />
                <PipelineChart data={pipelineData} />
              </div>
            </Suspense>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0"><Skeleton className="h-64 w-full min-w-0" /><Skeleton className="h-64 w-full min-w-0" /></div>
          )}
        </div>
      </div>
      {/* Quick Launch and Modules unified grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
        {/* Quick Launch Tiles: always full width */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 min-w-0">
          <QuickLaunchTiles actions={quickLaunchActions} />
        </div>
        {/* Module Cards */}
        <div className="bg-card rounded-xl p-6 border border-border module-card transition-all duration-300 min-w-0">
          <h3 className="font-semibold text-lg mb-2">Sales Dashboard</h3>
          <p className="text-muted-foreground text-sm mb-4">Track deals, manage pipelines, and analyze sales performance with AI-powered insights.</p>
          <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">Open</button>
        </div>
        <div className="bg-card rounded-xl p-6 border border-border module-card transition-all duration-300 min-w-0">
          <h3 className="font-semibold text-lg mb-2">Finance Hub</h3>
          <p className="text-muted-foreground text-sm mb-4">Manage invoices, expenses, and financial reports with automated reconciliation.</p>
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">Open</button>
        </div>
        <div className="bg-card rounded-xl p-6 border border-border module-card transition-all duration-300 min-w-0">
          <h3 className="font-semibold text-lg mb-2">Operations Center</h3>
          <p className="text-muted-foreground text-sm mb-4">Streamline workflows, manage inventory, and optimize business processes.</p>
          <button className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">Open</button>
        </div>
      </div>
      {/* Assistant Panel (optional, can be triggered elsewhere) */}
      {/* <AssistantPanel open={false} onClose={() => {}} /> */}
    </div>
  );
};

Dashboard.propTypes = {};

export default Dashboard; 