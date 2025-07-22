/**
 * Entrepreneur Resources Subdomain
 * Handles educational resources and materials
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface EntrepreneurResource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'template' | 'tool' | 'course';
  category: string;
  tags: string[];
  url: string;
  author: string;
  rating: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceCategory {
  id: string;
  name: string;
  description: string;
  resourceCount: number;
  order: number;
} 