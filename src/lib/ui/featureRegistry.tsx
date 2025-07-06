import React from 'react';
import type { ReactNode } from 'react';
import {
  // Core icons
  LayoutGrid,
  BarChart2,
  Users,
  FileText,
  Settings,
  Briefcase,
  CreditCard,
  Building2,
  Zap,
  MessageSquare,
  Sparkles,
  Wrench,
  Database,
  Bot,
  UserCheck,
} from 'lucide-react';

/**
 * Feature Category
 */
export type FeatureCategory = 
  | 'core'
  | 'department' 
  | 'productivity' 
  | 'analytics' 
  | 'ai' 
  | 'administration';

/**
 * Feature Access Level
 */
export type FeatureAccessLevel = 
  | 'free'         // Available in free plan
  | 'pro'          // Requires Pro plan
  | 'enterprise'   // Requires Enterprise plan
  | 'beta'         // Available to beta testers only
  | 'admin'        // Requires admin privileges
  | 'owner';       // Requires owner privileges

/**
 * Feature Definition
 */
export interface FeatureDefinition {
  /** Unique feature identifier */
  id: string;
  /** Display name */
  name: string;
  /** Brief description */
  description: string;
  /** Feature icon */
  icon: ReactNode;
  /** URL path */
  path: string;
  /** Feature category */
  category: FeatureCategory;
  /** Required access level */
  accessLevel: FeatureAccessLevel;
  /** Whether feature is new */
  isNew?: boolean;
  /** Whether feature is highlighted */
  isHighlighted?: boolean;
  /** Keywords for search */
  keywords?: string[];
  /** Related features (by ID) */
  relatedFeatures?: string[];
  /** Documentation URL */
  documentationUrl?: string;
}

/**
 * Central Feature Registry
 * 
 * Provides a structured way to register and discover platform features.
 * Used for:
 * - Building navigation
 * - Feature discovery
 * - Access control
 * - Documentation linking
 * - Search functionality
 */
const featuresList: FeatureDefinition[] = [
  // Core Features
  {
    id: 'command-center',
    name: 'Command Center',
    description: 'Central hub for all Nexus functionality',
    icon: <LayoutGrid />,
    path: '/nexus',
    category: 'core',
    accessLevel: 'free',
    isHighlighted: true,
    keywords: ['dashboard', 'home', 'central', 'hub', 'nexus'],
  },
  {
    id: 'my-workspace',
    name: 'My Workspace',
    description: 'Your personalized workspace with frequently used tools',
    icon: <LayoutGrid />,
    path: '/workspace',
    category: 'core',
    accessLevel: 'free',
    isNew: true,
    keywords: ['personal', 'dashboard', 'workspace', 'home'],
  },
  
  // Department Features
  {
    id: 'sales',
    name: 'Sales',
    description: 'CRM, deals, and sales operations',
    icon: <Briefcase />,
    path: '/sales',
    category: 'department',
    accessLevel: 'free',
    keywords: ['crm', 'deals', 'customers', 'pipeline', 'leads'],
    relatedFeatures: ['sales-forecasting', 'customer-management'],
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Accounting, invoices, and financial operations',
    icon: <CreditCard />,
    path: '/finance',
    category: 'department',
    accessLevel: 'free',
    keywords: ['accounting', 'invoices', 'payments', 'expenses'],
    relatedFeatures: ['financial-reporting', 'invoice-management'],
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Business operations and process management',
    icon: <Building2 />,
    path: '/operations',
    category: 'department',
    accessLevel: 'free',
    keywords: ['operations', 'processes', 'workflow', 'management'],
    relatedFeatures: ['process-automation', 'inventory-management'],
  },
  
  // Analytics Features
  {
    id: 'dashboards',
    name: 'Dashboards',
    description: 'Interactive data visualizations and KPIs',
    icon: <BarChart2 />,
    path: '/dashboards',
    category: 'analytics',
    accessLevel: 'free',
    keywords: ['analytics', 'reports', 'charts', 'kpis', 'metrics'],
    relatedFeatures: ['custom-reports', 'data-exports'],
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'Custom reports and scheduled exports',
    icon: <FileText />,
    path: '/reports',
    category: 'analytics',
    accessLevel: 'pro',
    keywords: ['reports', 'exports', 'analysis', 'metrics'],
    relatedFeatures: ['dashboards', 'data-exports'],
  },
  {
    id: 'data-warehouse',
    name: 'Data Warehouse',
    description: 'Central repository for all business data',
    icon: <Database />,
    path: '/data-warehouse',
    category: 'analytics',
    accessLevel: 'enterprise',
    keywords: ['data', 'warehouse', 'storage', 'analysis'],
    relatedFeatures: ['reports', 'dashboards'],
  },
  
  // AI Features
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Intelligent assistant for daily tasks',
    icon: <Bot />,
    path: '/chat',
    category: 'ai',
    accessLevel: 'free',
    isHighlighted: true,
    keywords: ['ai', 'assistant', 'chatbot', 'help', 'chat'],
    relatedFeatures: ['ai-insights', 'ai-automation'],
  },
  {
    id: 'ai-insights',
    name: 'AI Insights',
    description: 'AI-generated insights from your business data',
    icon: <Sparkles />,
    path: '/ai-insights',
    category: 'ai',
    accessLevel: 'pro',
    isNew: true,
    keywords: ['ai', 'insights', 'intelligence', 'analysis'],
    relatedFeatures: ['ai-assistant', 'dashboards'],
  },
  {
    id: 'ai-automation',
    name: 'AI Automation',
    description: 'Automate workflows with AI',
    icon: <Zap />,
    path: '/ai-automation',
    category: 'ai',
    accessLevel: 'enterprise',
    isNew: true,
    keywords: ['ai', 'automation', 'workflow', 'processes'],
    relatedFeatures: ['ai-assistant', 'workflow-builder'],
  },
  
  // Productivity Features
  {
    id: 'messages',
    name: 'Messages',
    description: 'Internal team communication',
    icon: <MessageSquare />,
    path: '/messages',
    category: 'productivity',
    accessLevel: 'free',
    keywords: ['messages', 'chat', 'communication', 'team'],
    relatedFeatures: ['team-management', 'notifications'],
  },
  {
    id: 'tasks',
    name: 'Tasks',
    description: 'Task management and tracking',
    icon: <UserCheck />,
    path: '/tasks',
    category: 'productivity',
    accessLevel: 'free',
    keywords: ['tasks', 'todos', 'projects', 'management'],
    relatedFeatures: ['team-management'],
  },
  
  // Administration Features
  {
    id: 'team-management',
    name: 'Team Management',
    description: 'Manage users and teams',
    icon: <Users />,
    path: '/team',
    category: 'administration',
    accessLevel: 'admin',
    keywords: ['team', 'users', 'permissions', 'roles'],
    relatedFeatures: ['settings', 'notifications'],
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'System and user settings',
    icon: <Settings />,
    path: '/settings',
    category: 'administration',
    accessLevel: 'free',
    keywords: ['settings', 'configuration', 'preferences'],
    relatedFeatures: ['team-management', 'notifications'],
  },
  {
    id: 'integrations',
    name: 'Integrations',
    description: 'Connect with external services and tools',
    icon: <Wrench />,
    path: '/integrations',
    category: 'administration',
    accessLevel: 'pro',
    keywords: ['integrations', 'connections', 'api', 'services'],
    relatedFeatures: ['settings', 'workflow-builder'],
  }
];

/**
 * Gets all registered features
 */
export const getAllFeatures = (): FeatureDefinition[] => {
  return featuresList;
};

/**
 * Gets features by category
 */
export const getFeaturesByCategory = (category: FeatureCategory): FeatureDefinition[] => {
  return featuresList.filter(feature => feature.category === category);
};

/**
 * Gets features by access level
 */
export const getFeaturesByAccessLevel = (level: FeatureAccessLevel): FeatureDefinition[] => {
  return featuresList.filter(feature => feature.accessLevel === level);
};

/**
 * Gets a feature by ID
 */
export const getFeatureById = (id: string): FeatureDefinition | undefined => {
  return featuresList.find(feature => feature.id === id);
};

/**
 * Gets related features for a given feature
 */
export const getRelatedFeatures = (featureId: string): FeatureDefinition[] => {
  const feature = getFeatureById(featureId);
  const related = Array.isArray(feature?.relatedFeatures) ? feature.relatedFeatures : [];
  if (!feature || related.length === 0) {
    return [];
  }
  return featuresList.filter(f => related.includes(f.id));
};

/**
 * Searches features by query
 */
export const searchFeatures = (query: string): FeatureDefinition[] => {
  const normalizedQuery = query.toLowerCase().trim();
  
  return featuresList.filter(feature => 
    feature.name.toLowerCase().includes(normalizedQuery) ||
    feature.description.toLowerCase().includes(normalizedQuery) ||
    feature.keywords?.some(keyword => keyword.toLowerCase().includes(normalizedQuery))
  );
};

/**
 * Checks if a user has access to a feature
 */
export const hasFeatureAccess = (
  featureId: string, 
  userPlan: 'free' | 'pro' | 'enterprise',
  isAdmin: boolean,
  isOwner: boolean
): boolean => {
  const feature = getFeatureById(featureId);
  if (!feature) return false;
  
  switch (feature.accessLevel) {
    case 'free':
      return true;
    case 'pro':
      return userPlan === 'pro' || userPlan === 'enterprise';
    case 'enterprise':
      return userPlan === 'enterprise';
    case 'admin':
      return isAdmin || isOwner;
    case 'owner':
      return isOwner;
    case 'beta':
      // Beta access would typically be managed by a separate system
      return false;
    default:
      return false;
  }
};

/**
 * All registered features in the platform.
 * @type {FeatureDefinition[]}
 */
export const features = featuresList; 