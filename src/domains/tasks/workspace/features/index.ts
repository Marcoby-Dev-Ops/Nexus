/**
 * Workspace Features Subdomain
 * Handles workspace-specific features and functionality
 */

// Features Components
export * from './components';

// Features Hooks
export * from './hooks';

// Features Services
export * from './services';

// Features Pages
export * from './pages';

// Features Types
export interface WorkspaceFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'productivity' | 'collaboration' | 'automation' | 'integration';
  priority: 'high' | 'medium' | 'low';
}

export interface FeatureConfig {
  autoEnable: boolean;
  userPreferences: boolean;
  analytics: boolean;
  notifications: boolean;
}

export interface FeatureUsage {
  featureId: string;
  usageCount: number;
  lastUsed: string;
  userSatisfaction: number;
} 