/**
 * Automation Workflows Subdomain
 * Handles workflow creation, execution, and management
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTrigger {
  id: string;
  type: 'webhook' | 'schedule' | 'event' | 'manual';
  config: Record<string, any>;
  enabled: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'integration';
  config: Record<string, any>;
  nextStepId?: string;
  errorStepId?: string;
} 