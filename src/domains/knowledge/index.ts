/**
 * Knowledge Domain - Main Index
 * Consolidates all knowledge management functionality including articles, insights, and learning resources
 */

// Knowledge Subdomains
export * from './components';
export * from './hooks';
export * from './services';
export * from './pages';

// Knowledge Types
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeInsight {
  id: string;
  title: string;
  description: string;
  category: 'trend' | 'opportunity' | 'risk' | 'action';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  createdAt: string;
} 