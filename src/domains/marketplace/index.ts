/**
 * Marketplace Domain - Main Index
 * Consolidates all marketplace functionality including products, services, and transactions
 */

// Marketplace Subdomains
export * from './components';
export * from './hooks';
export * from './services';
export * from './pages';

// Marketplace Types
export interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  status: 'active' | 'inactive' | 'sold';
  sellerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceTransaction {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
} 