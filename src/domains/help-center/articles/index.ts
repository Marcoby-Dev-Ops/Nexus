/**
 * Help Center Articles Subdomain
 * Handles help articles and documentation
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  author: string;
  publishedAt?: string;
  updatedAt: string;
  views: number;
  helpful: number;
  notHelpful: number;
}

export interface ArticleCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  articleCount: number;
  order: number;
} 