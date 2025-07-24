/**
 * Workspace Domain - Main Index
 * Consolidates all workspace functionality including project management, collaboration, and productivity tools
 */

// Workspace Subdomains
export * from './components';
export * from './hooks';
export * from './services';
export * from './pages';

// Workspace Types
export interface WorkspaceConfig {
  id: string;
  name: string;
  description: string;
  type: 'personal' | 'team' | 'organization';
  members: string[];
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceProject {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  progress: number;
  dueDate?: string;
  createdAt: string;
} 