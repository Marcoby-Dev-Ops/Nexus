import { LayoutDashboard, Search, Users, Banknote, Truck, BarChart2, Brain, Bot, Store, Plug, Settings } from 'lucide-react';
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
  { name: 'Workspace', path: '/workspace', icon: <Search className="h-5 w-5" /> },
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
  { name: 'AI Hub', path: '/ai-hub', icon: <Brain className="h-5 w-5" /> },
  { name: 'AI Chat', path: '/chat', icon: <Bot className="h-5 w-5" /> },
  { name: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" /> },
]; 