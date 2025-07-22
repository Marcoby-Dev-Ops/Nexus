/**
 * Marketplace Apps Subdomain
 * Handles app listings, management, and distribution
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface MarketplaceApp {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  price: number;
  currency: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
  developer: string;
  rating: number;
  reviewCount: number;
  downloads: number;
  lastUpdated: string;
}

export interface AppInstallation {
  id: string;
  appId: string;
  userId: string;
  status: 'installing' | 'active' | 'error' | 'uninstalled';
  config: Record<string, any>;
  installedAt: string;
  lastUsed?: string;
} 