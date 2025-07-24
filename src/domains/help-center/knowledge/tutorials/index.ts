/**
 * Knowledge Tutorials Subdomain
 * Handles tutorial creation and step-by-step guides
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface KnowledgeTutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  steps: TutorialStep[];
  prerequisites: string[];
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  order: number;
  estimatedTime: number;
  completed: boolean;
  resources?: TutorialResource[];
}

export interface TutorialResource {
  id: string;
  type: 'video' | 'document' | 'link' | 'file';
  title: string;
  url: string;
  description?: string;
} 