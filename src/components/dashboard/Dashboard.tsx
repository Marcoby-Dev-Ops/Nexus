import React, { Suspense, useEffect, useState } from 'react';
import { KpiCard } from './KpiCard';
import { SimpleBarChart } from './SimpleBarChart';
import { FilePlus, UserPlus, BarChart2, Zap, CalendarPlus, Bot } from 'lucide-react';
import Spinner from '../Spinner';
import Skeleton from '../lib/Skeleton';
import QuickLaunchTiles from './QuickLaunchTiles';

/**
 * @name Dashboard
 * @description Main dashboard page for NEXUS.
 * @returns {JSX.Element} The rendered dashboard.
 */
const kpiData = [
  { title: 'Total Revenue', value: '$124,580', delta: '+12.5%' },
  { title: 'New Customers', value: 24, delta: '+8.3%' },
  { title: 'Active Projects', value: 18, delta: '-2.1%' },
  { title: 'Task Completion', value: '84%', delta: '+1.2%' },
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
  { type: 'login', user: 'Alice', note: 'Logged in', date: '2024-06-10' },
  { type: 'deal', user: 'Bob', note: 'Closed deal with Acme Corp', date: '2024-06-09' },
  { type: 'invoice', user: 'Carol', note: 'Sent invoice to Beta LLC', date: '2024-06-08' },
];

const aiInsights = [
  'Revenue is up 12% vs last month.',
  '3 deals are likely to close this week.',
  'No overdue invoices detected.',
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
    <div className="p-8 space-y-8">
      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.title} title={kpi.title} value={kpi.value} delta={kpi.delta} />
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Revenue Trend</h3>
          <SimpleBarChart data={revenueTrend} />
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Pipeline Funnel</h3>
          <SimpleBarChart data={pipelineFunnel} />
        </div>
      </div>
      {/* Activity Feed & AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Activity Feed</h3>
          <ul className="divide-y">
            {activityFeed.map((a, i) => (
              <li key={i} className="py-2">
                <span className="font-medium">{a.user}</span> - {a.note} <span className="text-xs text-muted-foreground">({a.date})</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">AI Insights</h3>
          <ul className="list-disc pl-5">
            {aiInsights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
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