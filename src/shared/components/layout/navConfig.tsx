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
  Database,
  Building2,
  UserCheck,
  DollarSign,
  CreditCard,
  Truck,
  BookOpen,
  Cpu,
  User,
  Mail,
  Calendar,
  Flame,
  PieChart
} from 'lucide-react';
import type { ReactNode } from 'react';

export interface NavItem {
  name: string;
  path: string;
  icon?: ReactNode;
  children?: { name: string; path: string; description?: string; badge?: string }[];
  description?: string;
  category?: 'quantum' | 'facilitators' | 'advanced' | 'expert';
  badge?: string;
}

export const navItems: NavItem[] = [
  // === QUANTUM BUSINESS ECOSYSTEM ===
  {
    name: 'Home',
    path: '/home',
    icon: <PieChart className="h-5 w-5" />,
    description: 'Your success is inevitable with the 7 building blocks',
    category: 'quantum',
    badge: 'Core'
  },
  {
    name: 'Business Ecosystem',
    path: '/dashboard/home',
    icon: <PieChart className="h-5 w-5" />,
    description: 'Your complete business through 7 fundamental building blocks',
    category: 'quantum'
  },
  {
    name: 'Identity',
    path: '/quantum/identity',
    icon: <User className="h-5 w-5" />,
    description: 'Who you are, mission, vision, values, and the people who make it happen',
    category: 'quantum',
    children: [
      {
        name: 'Company Profile',
        path: '/quantum/identity/profile',
        description: 'Core business identity and positioning'
      },
      {
        name: 'Team & Culture',
        path: '/quantum/identity/team',
        description: 'People, roles, and organizational culture'
      },
      {
        name: 'Brand & Values',
        path: '/quantum/identity/brand',
        description: 'Brand positioning and core values'
      }
    ]
  },
  {
    name: 'Revenue',
    path: '/quantum/revenue',
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Customers, deals, sales pipeline, and revenue generation',
    category: 'quantum',
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
    category: 'quantum',
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
    category: 'quantum',
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
    category: 'quantum',
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
    category: 'quantum',
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
    category: 'quantum',
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

  // === FACILITATOR TOOLS ===
  {
    name: 'Facilitator Tools',
    path: '/facilitators',
    icon: <Workflow className="h-5 w-5" />,
    description: 'Tools that help identify, measure, and manage your business ecosystem',
    category: 'facilitators',
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
        name: 'FIRE Cycle',
        path: '/business/fire-cycle',
        description: 'Thought/Idea/Initiative Management'
      },
      {
        name: 'Action Center',
        path: '/tasks/workspace/actions',
        description: 'Task and priority management'
      },
      {
        name: 'Client Intelligence',
        path: '/tasks/workspace/clients',
        description: 'Unified client profiles and insights'
      },
      {
        name: 'Knowledge Base',
        path: '/ckb',
        description: 'Search and analyze your company documents'
      },
      {
        name: 'Mobile App',
        path: '/mobile',
        description: 'Business gaming experience on mobile',
        badge: 'New'
      }
    ]
  },

  // === ADVANCED FEATURES ===
  {
    name: 'AI Assistant',
    path: '/ai/assistant',
    icon: <Brain className="h-5 w-5" />,
    description: 'AI-powered business intelligence and decision support',
    category: 'advanced',
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
    name: 'Analytics',
    path: '/analytics',
    icon: <BarChart2 className="h-5 w-5" />,
    description: 'Advanced analytics and business intelligence',
    category: 'advanced',
    children: [
      {
        name: 'Business Health',
        path: '/analytics/health',
        description: 'Comprehensive business health scoring'
      },
      {
        name: 'Performance Metrics',
        path: '/analytics/performance',
        description: 'Key performance indicators and metrics'
      },
      {
        name: 'Trend Analysis',
        path: '/analytics/trends',
        description: 'Trend analysis and forecasting'
      }
    ]
  },

  // === EXPERT FEATURES ===
  {
    name: 'Integrations',
    path: '/integrations',
    icon: <Database className="h-5 w-5" />,
    description: 'Connect and sync with external business tools',
    category: 'expert',
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
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings className="h-5 w-5" />,
    description: 'System configuration and preferences',
    category: 'expert',
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
    name: 'Help & Learning',
    path: '/help',
    icon: <HelpCircle className="h-5 w-5" />,
    description: 'Help resources and learning materials',
    category: 'expert',
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

export function getCoreNavItems(): NavItem[] {
  return navItems.filter(item => item.category === 'quantum');
}

export function getFacilitatorItems(): NavItem[] {
  return navItems.filter(item => item.category === 'facilitators');
}

export function getAdvancedItems(): NavItem[] {
  return navItems.filter(item => item.category === 'advanced');
}

export function getExpertItems(): NavItem[] {
  return navItems.filter(item => item.category === 'expert');
}

export function getNavItemsByCategory(category: 'quantum' | 'facilitators' | 'advanced' | 'expert'): NavItem[] {
  return navItems.filter(item => item.category === category);
}

export function getAllNavItems(): NavItem[] {
  return navItems;
} 