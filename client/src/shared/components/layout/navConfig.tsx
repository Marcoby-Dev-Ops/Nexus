import React from 'react';
import {
  Home,
  User,
  Settings,
  Building2,
  DollarSign,
  Wallet,
  Package,
  Users,
  FileText,
  Bell,
  Map,
  Plug
} from 'lucide-react';
import type { ReactNode } from 'react';

export interface NavItem {
  name: string;
  path: string;
  icon?: ReactNode;
  children?: { name: string; path: string; description?: string; badge?: string }[];
  description?: string;
  category?: 'overview' | 'building-blocks' | 'tools' | 'settings';
  badge?: string;
}

export const navItems: NavItem[] = [
  // === FOUNDATION NAVIGATION ===
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: <Home className="h-5 w-5" />,
    description: 'Your main business dashboard and overview',
    category: 'overview'
  },
  
  // === BUILDING BLOCKS ===
  {
    name: 'Identity',
    path: '/identity',
    icon: <Building2 className="h-5 w-5" />,
    description: 'Business identity, mission, vision, and values',
    category: 'building-blocks'
  },
  {
    name: 'Revenue',
    path: '/revenue',
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Sales, pricing, and revenue management',
    category: 'building-blocks'
  },
  {
    name: 'Cash',
    path: '/cash',
    icon: <Wallet className="h-5 w-5" />,
    description: 'Cash flow, billing, and financial management',
    category: 'building-blocks'
  },
  {
    name: 'Delivery',
    path: '/delivery',
    icon: <Package className="h-5 w-5" />,
    description: 'Project delivery and service management',
    category: 'building-blocks'
  },
  {
    name: 'People',
    path: '/people',
    icon: <Users className="h-5 w-5" />,
    description: 'HR, team management, and performance',
    category: 'building-blocks'
  },
  {
    name: 'Knowledge',
    path: '/knowledge',
    icon: <FileText className="h-5 w-5" />,
    description: 'Knowledge vault and document management',
    category: 'building-blocks'
  },
  {
    name: 'Systems',
    path: '/systems',
    icon: <Settings className="h-5 w-5" />,
    description: 'Infrastructure, workflows, and automation',
    category: 'building-blocks'
  },

  // === TOOLS & JOURNEYS ===
  {
    name: 'Journeys',
    path: '/journey-management',
    icon: <Map className="h-5 w-5" />,
    description: 'Manage business journeys and guided playbooks',
    category: 'tools'
  },
  {
    name: 'Integrations',
    path: '/integrations',
    icon: <Plug className="h-5 w-5" />,
    description: 'Connect and manage platform integrations',
    category: 'tools'
  },

  // Admin quick links
  {
    name: 'Admin',
    path: '/admin',
    icon: <User className="h-5 w-5" />,
    description: 'Administrative console and user management',
    category: 'tools',
    // Mark as adminOnly so the Sidebar can hide this group for normal users
    children: [
      { name: 'Admin Console', path: '/admin', description: 'System administration and tools' },
      { name: 'User Management', path: '/admin/users', description: 'Search and manage application users' }
    ],
    // custom flag consumed by Sidebar rendering
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    adminOnly: true
  },

  // === SETTINGS & ACCOUNT ===
  {
    name: 'Profile',
    path: '/profile',
    icon: <User className="h-5 w-5" />,
    description: 'Update your personal information and preferences',
    category: 'settings'
  },
  {
    name: 'Notifications',
    path: '/notifications',
    icon: <Bell className="h-5 w-5" />,
    description: 'Control email, push, and in-app alerts',
    category: 'settings'
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings className="h-5 w-5" />,
    description: 'Configure workspace policies and advanced options',
    category: 'settings'
  }
];

// Helper functions for the sidebar
export function getOverviewItems(): NavItem[] {
  return navItems.filter(item => item.category === 'overview');
}

export function getBuildingBlocksItems(): NavItem[] {
  return navItems.filter(item => item.category === 'building-blocks');
}

export function getToolsItems(): NavItem[] {
  return navItems.filter(item => item.category === 'tools');
}

export function getSettingsItems(): NavItem[] {
  return navItems.filter(item => item.category === 'settings');
} 
