/**
 * Help Center Domain - Main Index
 * Consolidates all help center functionality including documentation, support, and user guides
 */

// Help Center Subdomains
export * from './components';
export * from './hooks';
export * from './services';
export * from './pages';

// Help Center Types
export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  order: number;
  articleCount: number;
  createdAt: string;
} 