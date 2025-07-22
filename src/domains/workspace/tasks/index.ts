/**
 * Workspace Tasks Subdomain
 * Handles task management and personal productivity
 */

// Tasks Components
export * from './components';

// Tasks Hooks
export * from './hooks';

// Tasks Services
export * from './services';

// Tasks Pages
export * from './pages';

// Tasks Types
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'archived';
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  dueDate?: string;
  tags: string[];
  projectId?: string;
  timeEstimate?: number;
  timeSpent?: number;
}

export interface TaskList {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  color: string;
  isDefault: boolean;
}

export interface TaskConfig {
  enableTimeTracking: boolean;
  enableSubtasks: boolean;
  enableRecurring: boolean;
  enableReminders: boolean;
} 