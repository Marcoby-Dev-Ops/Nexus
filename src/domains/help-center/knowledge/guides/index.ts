/**
 * Knowledge Guides Subdomain
 * Handles comprehensive guides and documentation
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface KnowledgeGuide {
  id: string;
  title: string;
  description: string;
  type: 'getting-started' | 'how-to' | 'reference' | 'troubleshooting';
  sections: GuideSection[];
  author: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface GuideSection {
  id: string;
  title: string;
  content: string;
  order: number;
  subsections?: GuideSubsection[];
}

export interface GuideSubsection {
  id: string;
  title: string;
  content: string;
  order: number;
} 