import React from 'react';
import { MessageSquare, User, Settings, Building2, Plug } from 'lucide-react';
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
  // === PRIMARY ===
  {
    name: 'Chat',
    path: '/chat',
    icon: <MessageSquare className="h-5 w-5" />,
    description: 'Nexus AI Chat',
    category: 'overview'
  },
  {
    name: 'Knowledge',
    path: '/knowledge',
    icon: <Building2 className="h-5 w-5" />,
    description: 'Business Identity & Knowledge',
    category: 'overview'
  },
  {
    name: 'Integrations',
    path: '/integrations',
    icon: <Plug className="h-5 w-5" />,
    description: 'Connect and manage external services',
    category: 'overview'
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: <User className="h-5 w-5" />,
    description: 'Your user profile',
    category: 'settings'
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings className="h-5 w-5" />,
    description: 'System settings',
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
