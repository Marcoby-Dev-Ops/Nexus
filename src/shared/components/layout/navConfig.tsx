import React from 'react';
import {
  Search,
  BarChart2,
  Brain,
  Settings,
  Target,
  Workflow,
  Home,
  Users,
  HelpCircle,
  Database
} from 'lucide-react';
import type { ReactNode } from 'react';

export interface NavItem {
  name: string;
  path: string;
  icon?: ReactNode;
  children?: { name: string; path: string; description?: string; badge?: string }[];
  description?: string;
  category?: 'core' | 'advanced' | 'expert';
  badge?: string;
}

export const navItems: NavItem[] = [
  // === CORE JOURNEY (Novice to Intermediate) ===
  {
    name: 'Home',
    path: '/dashboard/home',
    icon: <Home className="h-5 w-5" />,
    description: 'What\'s going on in my world?',
    category: 'core'
  },
  {
    name: 'Workspace',
    path: '/tasks/workspace',
    icon: <Search className="h-5 w-5" />,
    description: 'How do I want to address what\'s going on?',
    category: 'core',
    children: [
      {
        name: 'My Workspace',
        path: '/tasks/workspace',
        description: 'Your personalized productivity hub'
      },
      {
        name: 'Action Center',
        path: '/tasks/workspace/actions',
        description: 'Manage tasks and priorities'
      },
      {
        name: 'Unified Inbox',
        path: '/tasks/workspace/inbox',
        description: 'All communications in one place'
      },
      {
        name: 'Calendar',
        path: '/tasks/workspace/calendar',
        description: 'Schedule and time management'
      },
      {
        name: 'Today Dashboard',
        path: '/tasks/workspace/today',
        description: 'Focus on what matters today'
      }
    ]
  },
  {
    name: 'FIRE Cycle',
    path: '/business/fire-cycle',
    icon: <Target className="h-5 w-5" />,
    description: 'Thought/Idea/Initiative Management',
    category: 'core',
    children: [
      {
        name: 'FIRE Manager',
        path: '/business/fire-cycle',
        description: 'Complete FIRE cycle overview'
      },
      {
        name: 'Focus',
        path: '/business/fire-cycle/focus',
        description: 'What matters most right now?'
      },
      {
        name: 'Insight',
        path: '/business/fire-cycle/insight',
        description: 'What are you learning?'
      },
      {
        name: 'Roadmap',
        path: '/business/fire-cycle/roadmap',
        description: 'What\'s the plan?'
      },
      {
        name: 'Execute',
        path: '/business/fire-cycle/execute',
        description: 'Take action and track progress'
      }
    ]
  },
  {
    name: 'Knowledge',
    path: '/integrations/knowledge',
    icon: <Database className="h-5 w-5" />,
    description: 'Pull in data to enhance my knowledge',
    category: 'core',
    children: [
      {
        name: 'Knowledge Enhancer',
        path: '/integrations/knowledge',
        description: 'AI-powered knowledge management'
      },
      {
        name: 'Knowledge Center',
        path: '/help-center/knowledge/center',
        description: 'Review truths and insights we\'re uncovering'
      },
      {
        name: 'Thoughts & Ideas',
        path: '/help-center/knowledge/thoughts',
        description: 'Capture and organize your thoughts'
      },
      {
        name: 'Integration Hub',
        path: '/integrations',
        description: 'Connect your business tools'
      }
    ]
  },

  // === ADVANCED FEATURES (Intermediate to Advanced) ===
  {
    name: 'AI Hub',
    path: '/ai-hub',
    icon: <Brain className="h-5 w-5" />,
    description: 'AI-powered business intelligence',
    category: 'advanced',
    children: [
      {
        name: 'AI Hub',
        path: '/ai-hub',
        description: 'Central AI command center'
      },
      {
        name: 'AI Chat',
        path: '/chat',
        description: 'Conversational AI assistant'
      },
      {
        name: 'AI Performance',
        path: '/ai-performance',
        description: 'Monitor and optimize AI systems'
      },
      {
        name: 'Model Management',
        path: '/ai-performance/models',
        description: 'Manage AI models and configurations'
      },
      {
        name: 'Email Intelligence',
        path: '/email-intelligence',
        description: 'AI-powered email analysis and reply drafting'
      }
    ]
  },
  {
    name: 'Analytics',
    path: '/analytics',
    icon: <BarChart2 className="h-5 w-5" />,
    description: 'Business intelligence and insights',
    category: 'advanced',
    children: [
      {
        name: 'Analytics Overview',
        path: '/analytics',
        description: 'Comprehensive business analytics'
      },
      {
        name: 'Business Health',
        path: '/analytics/business-health',
        description: 'Monitor business performance'
      },
      {
        name: 'Cross-Platform Insights',
        path: '/analytics/cross-platform',
        description: 'Unified data insights'
      },
      {
        name: 'Digestible Metrics',
        path: '/analytics/digestible-metrics',
        description: 'Simplified business metrics'
      }
    ]
  },

  // === EXPERT FEATURES (Advanced to Expert) ===
  {
    name: 'Team & Operations',
    path: '/workspace/team',
    icon: <Users className="h-5 w-5" />,
    description: 'Team management and operations',
    category: 'expert',
    children: [
      {
        name: 'Team Management',
        path: '/workspace/team',
        description: 'Manage team performance and collaboration'
      },
      {
        name: 'Customer Insights',
        path: '/workspace/customer-insights',
        description: 'Analyze customer behavior and satisfaction'
      },
      {
        name: 'Process Automation',
        path: '/workspace/automation',
        description: 'Automate repetitive tasks and workflows',
        badge: 'Beta'
      }
    ]
  },
  {
    name: 'Business Departments',
    path: '/business',
    icon: <Workflow className="h-5 w-5" />,
    description: 'Department-specific tools and insights',
    category: 'expert',
    children: [
      {
        name: 'Sales',
        path: '/sales',
        description: 'Sales performance and pipeline management'
      },
      {
        name: 'Finance',
        path: '/finance',
        description: 'Financial operations and reporting'
      },
      {
        name: 'Operations',
        path: '/operations',
        description: 'Operational efficiency and processes'
      },
      {
        name: 'Marketing',
        path: '/marketing',
        description: 'Marketing analytics and campaigns'
      }
    ]
  },

  // === SUPPORT & SETTINGS ===
  {
    name: 'Help & Learning',
    path: '/help',
    icon: <HelpCircle className="h-5 w-5" />,
    description: 'Get help and learn more',
    category: 'core',
    children: [
      {
        name: 'User Guide',
        path: '/help/user-guide',
        description: 'Comprehensive user documentation'
      },
      {
        name: 'Features',
        path: '/features',
        description: 'Explore platform capabilities'
      },
      {
        name: 'Help Center',
        path: '/help',
        description: 'Support and troubleshooting'
      }
    ]
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings className="h-5 w-5" />,
    description: 'Account and system configuration',
    category: 'core',
    children: [
      {
        name: 'Account Settings',
        path: '/admin/account-settings',
        description: 'Update your profile and personal information'
      },
      {
        name: 'Preferences',
        path: '/settings/preferences',
        description: 'Customize your experience'
      },
      {
        name: 'Security',
        path: '/settings/security',
        description: 'Manage security settings and authentication'
      }
    ]
  }
];

// Helper function to get items by category
export const getNavItemsByCategory = (category: 'core' | 'advanced' | 'expert') => {
  return navItems.filter(item => item.category === category);
};

// Helper function to get all core items (for new users)
export const getCoreNavItems = () => {
  return navItems.filter(item => item.category === 'core');
};

// Helper function to get all items (for experienced users)
export const getAllNavItems = () => {
  return navItems;
}; 