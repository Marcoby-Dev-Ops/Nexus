/**
 * Knowledge Articles Subdomain
 * Handles article creation, management, and publishing
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  updatedAt: string;
  views: number;
  rating: number;
}

export interface ArticleCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  articleCount: number;
}

export interface ArticleSearch {
  query: string;
  filters: {
    category?: string;
    author?: string;
    tags?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
  results: KnowledgeArticle[];
  total: number;
} 