/**
 * Marketplace Reviews Subdomain
 * Handles reviews, ratings, and feedback
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface MarketplaceReview {
  id: string;
  itemId: string;
  itemType: 'app' | 'integration' | 'template';
  userId: string;
  rating: number;
  title: string;
  content: string;
  helpful: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  authorId: string;
  content: string;
  createdAt: string;
} 