/**
 * Help Center FAQ Subdomain
 * Handles frequently asked questions
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  status: 'active' | 'inactive';
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  description: string;
  order: number;
  faqCount: number;
}

export interface FAQSearch {
  query: string;
  results: FAQ[];
  total: number;
} 