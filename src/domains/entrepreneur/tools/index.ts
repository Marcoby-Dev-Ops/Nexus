/**
 * Entrepreneur Tools Subdomain
 * Handles business tools and utilities
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface EntrepreneurTool {
  id: string;
  name: string;
  description: string;
  category: 'planning' | 'finance' | 'marketing' | 'operations' | 'analytics';
  status: 'active' | 'beta' | 'deprecated';
  config: Record<string, any>;
  usage: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface ToolUsage {
  id: string;
  toolId: string;
  userId: string;
  usageCount: number;
  lastUsed: string;
  preferences: Record<string, any>;
} 