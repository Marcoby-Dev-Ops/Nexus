/**
 * Hype Content Subdomain
 * Handles content creation and management
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface HypeContent {
  id: string;
  title: string;
  description: string;
  type: 'post' | 'video' | 'image' | 'story' | 'article';
  platform: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  content: string;
  media?: ContentMedia[];
  scheduledAt?: string;
  publishedAt?: string;
  performance: ContentPerformance;
}

export interface ContentMedia {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  alt?: string;
  size: number;
}

export interface ContentPerformance {
  reach: number;
  engagement: number;
  shares: number;
  comments: number;
  clicks: number;
} 