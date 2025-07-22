/**
 * Knowledge Search Subdomain
 * Handles search functionality and content discovery
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface SearchQuery {
  id: string;
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  total: number;
  executionTime: number;
  timestamp: string;
}

export interface SearchFilters {
  type?: 'article' | 'tutorial' | 'guide' | 'all';
  category?: string;
  author?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SearchResult {
  id: string;
  type: 'article' | 'tutorial' | 'guide';
  title: string;
  summary: string;
  url: string;
  relevance: number;
  lastUpdated: string;
} 