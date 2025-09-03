import React from 'react';
import {
  Home,
  User,
  Settings
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
