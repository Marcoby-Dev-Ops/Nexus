import React from 'react';
import { LayoutDashboard, Search, Users, Banknote, Truck, BarChart2, Brain, Bot, Store, Plug, Settings, Info, TrendingUp, DollarSign, Activity, Layout, Palette, Network } from 'lucide-react';
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
    name: 'Workspace',
    path: '/workspace',
    icon: <Search className="h-5 w-5" />,
    children: [
      { name: 'My Workspace', path: '/workspace' },
      { name: 'Builder', path: '/workspace/builder' },
      { name: 'Marketplace', path: '/workspace/marketplace' },
    ],
  },
  {
    name: 'Sales',
    path: '/sales',
    icon: <Users className="h-5 w-5" />,
    children: [
      { name: 'Overview', path: '/sales' },
      { name: 'Performance', path: '/sales/performance' },
    ],
  },
  {
    name: 'Finance',
    path: '/finance',
    icon: <Banknote className="h-5 w-5" />,
    children: [
      { name: 'Overview', path: '/finance' },
      { name: 'Operations', path: '/finance/operations' },
    ],
  },
  {
    name: 'Operations',
    path: '/operations',
    icon: <Truck className="h-5 w-5" />,
    children: [
      { name: 'Overview', path: '/operations' },
      { name: 'Analytics', path: '/operations/analytics' },
    ],
  },
  { name: 'Analytics', path: '/analytics', icon: <BarChart2 className="h-5 w-5" /> },
  {
    name: 'AI Performance',
    path: '/ai-performance',
    icon: <TrendingUp className="h-5 w-5" />,
    children: [
      { name: 'Overview', path: '/ai-performance' },
      { name: 'Model Analytics', path: '/ai-performance/models' },
      { name: 'Usage & Billing', path: '/ai-performance/billing' },
      { name: 'Improvements', path: '/ai-performance/improvements' },
    ],
  },
  { name: 'AI Hub', path: '/ai-hub', icon: <Brain className="h-5 w-5" /> },
  { name: 'AI Chat', path: '/chat', icon: <Bot className="h-5 w-5" /> },
  { name: 'Integrations', path: '/integrations', icon: <Network className="h-5 w-5" /> },
  { name: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" /> },
  { name: 'Help', path: '/help', icon: <Info className="h-5 w-s" /> },
]; 