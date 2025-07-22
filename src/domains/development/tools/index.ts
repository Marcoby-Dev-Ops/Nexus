/**
 * Development Tools Subdomain
 * Handles development tools and utilities
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface DevelopmentTool {
  id: string;
  name: string;
  description: string;
  category: 'debugging' | 'testing' | 'profiling' | 'analysis' | 'utilities';
  status: 'active' | 'inactive' | 'beta';
  config: Record<string, any>;
  version: string;
  lastUsed?: string;
}

export interface ToolExecution {
  id: string;
  toolId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  result?: Record<string, any>;
  error?: string;
} 