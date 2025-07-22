/**
 * Marketplace Templates Subdomain
 * Handles template creation, sharing, and management
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  category: 'workflow' | 'dashboard' | 'report' | 'automation';
  author: string;
  version: string;
  downloads: number;
  rating: number;
  tags: string[];
  preview: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateInstallation {
  id: string;
  templateId: string;
  userId: string;
  status: 'installing' | 'active' | 'error';
  customizations: Record<string, any>;
  installedAt: string;
} 