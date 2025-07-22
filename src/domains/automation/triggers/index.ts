/**
 * Automation Triggers Subdomain
 * Handles trigger creation, management, and execution
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface AutomationTrigger {
  id: string;
  name: string;
  type: 'webhook' | 'schedule' | 'event' | 'manual' | 'api';
  config: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  workflowIds: string[];
  lastExecuted?: string;
  nextExecution?: string;
}

export interface TriggerEvent {
  id: string;
  triggerId: string;
  timestamp: string;
  data: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: Record<string, any>;
} 