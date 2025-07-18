export interface Feature {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'department' | 'productivity' | 'analytics' | 'ai' | 'administration';
  accessLevel: 'free' | 'pro' | 'enterprise' | 'admin';
  path: string;
  icon?: string;
  keywords?: string[];
  isHighlighted?: boolean;
  isNew?: boolean;
  relatedFeatures?: string[];
}

export const features: Feature[] = [
  // Core Features
  {
    id: 'command-center',
    name: 'Command Center',
    description: 'Central hub for all your workspace activities and quick access to tools',
    category: 'core',
    accessLevel: 'free',
    path: '/command-center',
    icon: 'Command',
    keywords: ['dashboard', 'hub', 'central', 'overview'],
    isHighlighted: true
  },
  {
    id: 'my-workspace',
    name: 'My Workspace',
    description: 'Personal workspace with your projects, tasks, and resources',
    category: 'core',
    accessLevel: 'free',
    path: '/workspace',
    icon: 'Briefcase',
    keywords: ['personal', 'projects', 'tasks', 'workspace']
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Intelligent AI-powered assistant for productivity and decision making',
    category: 'ai',
    accessLevel: 'pro',
    path: '/ai-assistant',
    icon: 'Bot',
    keywords: ['ai', 'assistant', 'chat', 'intelligence'],
    isHighlighted: true,
    isNew: true
  },

  // Department Features
  {
    id: 'sales',
    name: 'Sales',
    description: 'Complete sales management with CRM, pipeline tracking, and analytics',
    category: 'department',
    accessLevel: 'pro',
    path: '/sales',
    icon: 'TrendingUp',
    keywords: ['crm', 'pipeline', 'leads', 'deals', 'revenue'],
    relatedFeatures: ['analytics', 'reports']
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Financial management, accounting, and budget tracking tools',
    category: 'department',
    accessLevel: 'pro',
    path: '/finance',
    icon: 'DollarSign',
    keywords: ['accounting', 'budget', 'expenses', 'revenue', 'financial'],
    relatedFeatures: ['analytics', 'reports']
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Operational tools for process management and team coordination',
    category: 'department',
    accessLevel: 'enterprise',
    path: '/operations',
    icon: 'Settings',
    keywords: ['process', 'workflow', 'automation', 'team', 'coordination']
  },

  // Productivity Features
  {
    id: 'task-management',
    name: 'Task Management',
    description: 'Organize and track tasks with advanced project management features',
    category: 'productivity',
    accessLevel: 'free',
    path: '/tasks',
    icon: 'CheckSquare',
    keywords: ['tasks', 'projects', 'todo', 'management', 'organization']
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Integrated calendar with scheduling and meeting management',
    category: 'productivity',
    accessLevel: 'free',
    path: '/calendar',
    icon: 'Calendar',
    keywords: ['schedule', 'meetings', 'events', 'appointments']
  },

  // Analytics Features
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Comprehensive analytics and reporting dashboard',
    category: 'analytics',
    accessLevel: 'pro',
    path: '/analytics',
    icon: 'BarChart3',
    keywords: ['reports', 'metrics', 'data', 'insights', 'dashboard'],
    relatedFeatures: ['reports']
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'Generate and customize detailed reports across all departments',
    category: 'analytics',
    accessLevel: 'pro',
    path: '/reports',
    icon: 'FileText',
    keywords: ['reports', 'export', 'data', 'insights']
  },

  // Administration Features
  {
    id: 'user-management',
    name: 'User Management',
    description: 'Manage users, roles, and permissions across the platform',
    category: 'administration',
    accessLevel: 'admin',
    path: '/admin/users',
    icon: 'Users',
    keywords: ['users', 'roles', 'permissions', 'admin', 'management']
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Platform configuration and system settings',
    category: 'administration',
    accessLevel: 'free',
    path: '/settings',
    icon: 'Settings',
    keywords: ['configuration', 'preferences', 'system', 'setup']
  }
];

// Helper Functions
export const getAllFeatures = (): Feature[] => {
  return features;
};

export const getFeaturesByCategory = (category: Feature['category']): Feature[] => {
  return features.filter(feature => feature.category === category);
};

export const searchFeatures = (query: string): Feature[] => {
  if (!query.trim()) return [];
  
  const searchTerm = query.toLowerCase();
  return features.filter(feature => 
    feature.name.toLowerCase().includes(searchTerm) ||
    feature.description.toLowerCase().includes(searchTerm) ||
    feature.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm)) ||
    feature.id.toLowerCase().includes(searchTerm)
  );
};

export const getFeatureById = (id: string): Feature | undefined => {
  return features.find(feature => feature.id === id);
};

export const getFeaturesByAccessLevel = (accessLevel: Feature['accessLevel']): Feature[] => {
  return features.filter(feature => feature.accessLevel === accessLevel);
};

export const getHighlightedFeatures = (): Feature[] => {
  return features.filter(feature => feature.isHighlighted);
};

export const getNewFeatures = (): Feature[] => {
  return features.filter(feature => feature.isNew);
}; 