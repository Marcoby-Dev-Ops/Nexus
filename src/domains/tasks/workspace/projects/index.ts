/**
 * Workspace Projects Subdomain
 * Handles project management and organization
 */

// Projects Components
export * from './components';

// Projects Hooks
export * from './hooks';

// Projects Services
export * from './services';

// Projects Pages
export * from './pages';

// Projects Types
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived' | 'on-hold';
  priority: 'high' | 'medium' | 'low';
  startDate: string;
  endDate?: string;
  owner: string;
  team: string[];
  tags: string[];
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignee: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ProjectConfig {
  enableTimeTracking: boolean;
  enableMilestones: boolean;
  enableCollaboration: boolean;
  enableReporting: boolean;
} 