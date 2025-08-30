import React from 'react';
import {
  Home,
  BarChart2,
  Brain,
  Settings,
  Users,
  HelpCircle,
  Database,
  DollarSign,
  CreditCard,
  Truck,
  BookOpen,
  Cpu,
  User,
  Workflow,
  Activity,
  Grid3X3
} from 'lucide-react';
import type { ReactNode } from 'react';

export interface NavItem {
  name: string;
  path: string;
  icon?: ReactNode;
  children?: { name: string; path: string; description?: string; badge?: string }[];
  description?: string;
  category?: 'overview' | 'building-blocks' | 'tools' | 'settings';
  badge?: string;
}

export const navItems: NavItem[] = [
  // === OVERVIEW ===
  {
    name: 'Home',
    path: '/home',
    icon: <Home className="h-5 w-5" />,
    description: 'Overview of all 7 building blocks and your business health',
    category: 'overview'
  },
  {
    name: 'Business Body',
    path: '/business-body',
    icon: <Activity className="h-5 w-5" />,
    description: 'Your business as a living organism - 8 autonomous systems working with 7 building blocks',
    category: 'overview'
  },
  {
    name: '7 Building Blocks',
    path: '/building-blocks',
    icon: <Grid3X3 className="h-5 w-5" />,
    description: 'Overview and management of all 7 core building blocks',
    category: 'overview'
  },

  // === BUILDING BLOCKS DETAILED PAGES ===
  {
    name: 'Identity',
    path: '/identity',
    icon: <User className="h-5 w-5" />,
    description: 'Who you are, mission, vision, values, and the people who make it happen',
    category: 'building-blocks',
    children: [
      {
        name: 'Company Profile',
        path: '/identity/profile',
        description: 'Core business identity and positioning'
      },
      {
        name: 'Team & Culture',
        path: '/identity/team',
        description: 'People, roles, and organizational culture'
      },
      {
        name: 'Brand & Values',
        path: '/identity/brand',
        description: 'Brand positioning and core values'
      }
    ]
  },
  {
    name: 'Revenue',
    path: '/quantum/revenue',
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Customers, deals, sales pipeline, and revenue generation',
    category: 'building-blocks',
    children: [
      {
        name: 'Sales Pipeline',
        path: '/quantum/revenue/pipeline',
        description: 'Deal tracking and conversion optimization'
      },
      {
        name: 'Customer Intelligence',
        path: '/quantum/revenue/customers',
        description: 'Customer segmentation and behavior analysis'
      },
      {
        name: 'Revenue Analytics',
        path: '/quantum/revenue/analytics',
        description: 'Revenue metrics and growth analysis'
      }
    ]
  },
  {
    name: 'Cash',
    path: '/quantum/cash',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'Financial management, cash flow, and financial health',
    category: 'building-blocks',
    children: [
      {
        name: 'Cash Flow',
        path: '/quantum/cash/flow',
        description: 'Cash flow tracking and forecasting'
      },
      {
        name: 'Financial Health',
        path: '/quantum/cash/health',
        description: 'Financial metrics and runway analysis'
      },
      {
        name: 'Expense Management',
        path: '/quantum/cash/expenses',
        description: 'Expense tracking and budget management'
      }
    ]
  },
  {
    name: 'Delivery',
    path: '/quantum/delivery',
    icon: <Truck className="h-5 w-5" />,
    description: 'Products/services, operations, and value delivery',
    category: 'building-blocks',
    children: [
      {
        name: 'Operations',
        path: '/quantum/delivery/operations',
        description: 'Operational processes and efficiency'
      },
      {
        name: 'Quality & Performance',
        path: '/quantum/delivery/quality',
        description: 'Quality metrics and performance tracking'
      },
      {
        name: 'Customer Satisfaction',
        path: '/quantum/delivery/satisfaction',
        description: 'Customer feedback and satisfaction metrics'
      }
    ]
  },
  {
    name: 'People',
    path: '/quantum/people',
    icon: <Users className="h-5 w-5" />,
    description: 'Employees, teams, culture, and performance',
    category: 'building-blocks',
    children: [
      {
        name: 'Team Management',
        path: '/quantum/people/teams',
        description: 'Team structure and performance management'
      },
      {
        name: 'Culture & Engagement',
        path: '/quantum/people/culture',
        description: 'Organizational culture and employee engagement'
      },
      {
        name: 'Performance Analytics',
        path: '/quantum/people/performance',
        description: 'Individual and team performance metrics'
      }
    ]
  },
  {
    name: 'Knowledge',
    path: '/quantum/knowledge',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'Documents, data, lessons learned, and organizational memory',
    category: 'building-blocks',
    children: [
      {
        name: 'Document Management',
        path: '/quantum/knowledge/documents',
        description: 'Centralized document and knowledge base'
      },
      {
        name: 'Lessons Learned',
        path: '/quantum/knowledge/lessons',
        description: 'Capturing and sharing organizational knowledge'
      },
      {
        name: 'Data Intelligence',
        path: '/quantum/knowledge/intelligence',
        description: 'Data analysis and business intelligence'
      }
    ]
  },
  {
    name: 'Systems',
    path: '/quantum/systems',
    icon: <Cpu className="h-5 w-5" />,
    description: 'Tools, workflows, automations, and system connections',
    category: 'building-blocks',
    children: [
      {
        name: 'Tool Integration',
        path: '/quantum/systems/integrations',
        description: 'Connected business tools and platforms'
      },
      {
        name: 'Workflow Automation',
        path: '/quantum/systems/automation',
        description: 'Automated workflows and processes'
      },
      {
        name: 'System Health',
        path: '/quantum/systems/health',
        description: 'System performance and optimization'
      }
    ]
  },

  // === TOOLS & WORKFLOW (Actionable Capabilities) ===
  {
    name: 'Business Health',
    path: '/analytics/health',
    icon: <BarChart2 className="h-5 w-5" />,
    description: 'Comprehensive business health scoring and insights',
    category: 'tools'
  },
  {
    name: 'AI Assistant',
    path: '/ai/assistant',
    icon: <Brain className="h-5 w-5" />,
    description: 'AI-powered business intelligence and decision support',
    category: 'tools',
    children: [
      {
        name: 'Chat Interface',
        path: '/ai/assistant/chat',
        description: 'Natural language business intelligence'
      },
      {
        name: 'Predictive Analytics',
        path: '/ai/assistant/predictions',
        description: 'AI-powered forecasting and insights'
      },
      {
        name: 'Automated Insights',
        path: '/ai/assistant/insights',
        description: 'Automated business insights and recommendations'
      }
    ]
  },
  {
    name: 'Workflow Tools',
    path: '/tasks/workspace',
    icon: <Workflow className="h-5 w-5" />,
    description: 'Task management and workflow automation',
    category: 'tools',
    children: [
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
        name: 'Action Center',
        path: '/tasks/workspace/actions',
        description: 'Task and priority management'
      },
      {
        name: 'FIRE Cycle',
        path: '/business/fire-cycle',
        description: 'Thought/Idea/Initiative Management'
      }
    ]
  },
  {
    name: 'Integrations',
    path: '/integrations',
    icon: <Database className="h-5 w-5" />,
    description: 'Connect and sync with external business tools',
    category: 'tools',
    children: [
      {
        name: 'Integration Marketplace',
        path: '/integrations/marketplace',
        description: 'Browse and connect business tools'
      },
      {
        name: 'Data Sync',
        path: '/integrations/sync',
        description: 'Manage data synchronization'
      },
      {
        name: 'API Management',
        path: '/integrations/api',
        description: 'Custom API integrations'
      }
    ]
  },

  // === SETTINGS ===
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings className="h-5 w-5" />,
    description: 'System configuration and preferences',
    category: 'settings',
    children: [
      {
        name: 'Account Settings',
        path: '/settings/account',
        description: 'User account and profile settings'
      },
      {
        name: 'Company Settings',
        path: '/settings/company',
        description: 'Company configuration and preferences'
      },
      {
        name: 'System Preferences',
        path: '/settings/system',
        description: 'System-wide settings and configuration'
      }
    ]
  },
  {
    name: 'Help & Support',
    path: '/help',
    icon: <HelpCircle className="h-5 w-5" />,
    description: 'Help resources and learning materials',
    category: 'settings',
    children: [
      {
        name: 'Documentation',
        path: '/help/docs',
        description: 'Complete system documentation'
      },
      {
        name: 'Tutorials',
        path: '/help/tutorials',
        description: 'Step-by-step tutorials and guides'
      },
      {
        name: 'Support',
        path: '/help/support',
        description: 'Get help and support'
      }
    ]
  }
];

export function getOverviewItems(): NavItem[] {
  return navItems.filter(item => item.category === 'overview');
}

export function getBuildingBlocksItems(): NavItem[] {
  return navItems.filter(item => item.category === 'building-blocks');
}

export function getToolsItems(): NavItem[] {
  return navItems.filter(item => item.category === 'tools');
}

export function getSettingsItems(): NavItem[] {
  return navItems.filter(item => item.category === 'settings');
}

export function getNavItemsByCategory(category: 'overview' | 'building-blocks' | 'tools' | 'settings'): NavItem[] {
  return navItems.filter(item => item.category === category);
}

export function getAllNavItems(): NavItem[] {
  return navItems;
} 
