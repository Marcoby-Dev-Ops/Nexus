import React from 'react';
import { LayoutDashboard, Search, BarChart2, Brain, Settings, Info, Network, Target, Workflow } from 'lucide-react';
import type { ReactNode } from 'react';

export interface NavItem {
  name: string;
  path: string;
  icon?: ReactNode;
  children?: { name: string; path: string }[];
}

export const navItems: NavItem[] = [
  // { name: 'Command Center', path: '/nexus', icon: <Brain className="h-5 w-5" /> }, // Hidden until ready
  { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  {
    name: 'Data & Analytics',
    path: '/analytics',
    icon: <BarChart2 className="h-5 w-5" />,
    children: [
      { name: 'Analytics Overview', path: '/analytics' },
      { name: 'Data Warehouse', path: '/data-warehouse' },
      { name: 'Digestible Metrics', path: '/analytics/digestible-metrics' },
      { name: 'Cross-Platform Insights', path: '/analytics/cross-platform' },
    ],
  },
  {
    name: 'Workspace',
    path: '/workspace',
    icon: <Search className="h-5 w-5" />,
    children: [
      { name: 'My Workspace', path: '/workspace' },
      { name: 'Today Dashboard', path: '/workspace/today' },
      { name: 'Unified Inbox', path: '/workspace/inbox' },
      { name: 'Calendar', path: '/workspace/calendar' },
      { name: 'Team Management', path: '/workspace/team' },
      { name: 'Customer Insights', path: '/workspace/customer-insights' },
      { name: 'Process Automation', path: '/workspace/automation' },
    ],
  },
  {
    name: 'Integrations',
    path: '/integrations',
    icon: <Network className="h-5 w-5" />,
    children: [
      { name: 'Integration Hub', path: '/integrations' },
      { name: 'Integration Data', path: '/integrations/data' },
      { name: 'HubSpot CRM', path: '/integrations/hubspot' },
      { name: 'Microsoft 365', path: '/integrations/microsoft' },
    ],
  },
  {
    name: 'FIRE Cycle',
    path: '/fire-cycle',
    icon: <Target className="h-5 w-5" />,
    children: [
      { name: 'Focus', path: '/fire-cycle/focus' },
      { name: 'Insight', path: '/fire-cycle/insight' },
      { name: 'Roadmap', path: '/fire-cycle/roadmap' },
      { name: 'Execute', path: '/fire-cycle/execute' },
    ],
  },
  {
    name: 'AI Tools',
    path: '/ai-hub',
    icon: <Brain className="h-5 w-5" />,
    children: [
      { name: 'AI Hub', path: '/ai-hub' },
      { name: 'AI Chat', path: '/chat' },
      { name: 'AI Performance', path: '/ai-performance' },
      { name: 'Model Management', path: '/ai-performance/models' },
    ],
  },
  {
    name: 'Business',
    path: '/business',
    icon: <Workflow className="h-5 w-5" />,
    children: [
      { name: 'Sales', path: '/sales' },
      { name: 'Finance', path: '/finance' },
      { name: 'Operations', path: '/operations' },
      { name: 'Marketing', path: '/marketing' },
    ],
  },
  { name: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" /> },
  { name: 'Help', path: '/help', icon: <Info className="h-5 w-5" /> },
]; 