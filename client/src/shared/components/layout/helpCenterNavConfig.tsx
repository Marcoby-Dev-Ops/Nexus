import React from 'react';
import {
  HelpCircle,
  Users,
  MessageSquare,
  Zap,
  Brain,
  BarChart2,
  Target,
  Database,
  Shield,
  GraduationCap,
  PlayCircle
} from 'lucide-react';
import type { ReactNode } from 'react';

export interface HelpCenterNavItem {
  name: string;
  path: string;
  icon?: ReactNode;
  children?: { name: string; path: string; description?: string; badge?: string }[];
  description?: string;
  category?: 'getting-started' | 'features' | 'integrations' | 'troubleshooting' | 'advanced' | 'legal';
  badge?: string;
}

export const helpCenterNavItems: HelpCenterNavItem[] = [
  // === GETTING STARTED ===
  {
    name: 'Getting Started',
    path: '/help/getting-started',
    icon: <PlayCircle className="h-5 w-5" />,
    description: 'Your first steps with Nexus',
    category: 'getting-started',
    children: [
      {
        name: 'Quick Start Guide',
        path: '/help/getting-started/quick-start',
        description: 'Get up and running in 10 minutes'
      },
      {
        name: 'Account Setup',
        path: '/help/getting-started/account-setup',
        description: 'Configure your account and preferences'
      },
      {
        name: 'First Dashboard',
        path: '/help/getting-started/first-dashboard',
        description: 'Understanding your home dashboard'
      },
      {
        name: 'Onboarding Checklist',
        path: '/help/getting-started/onboarding-checklist',
        description: 'Complete setup checklist'
      }
    ]
  },
  {
    name: 'Core Features',
    path: '/help/core-features',
    icon: <Target className="h-5 w-5" />,
    description: 'Essential Nexus features',
    category: 'getting-started',
    children: [
      {
        name: 'Workspace Overview',
        path: '/help/core-features/workspace',
        description: 'Understanding your workspace'
      },
      {
        name: 'FIRE Cycle',
        path: '/help/core-features/fire-cycle',
        description: 'Focus, Insight, Roadmap, Execute methodology'
      },
      {
        name: 'Knowledge Management',
        path: '/help/core-features/knowledge',
        description: 'Organizing thoughts and insights'
      },
      {
        name: 'Client Intelligence',
        path: '/help/core-features/client-intelligence',
        description: 'Managing unified client profiles'
      }
    ]
  },

  // === FEATURE GUIDES ===
  {
    name: 'AI & Automation',
    path: '/help/ai-automation',
    icon: <Brain className="h-5 w-5" />,
    description: 'AI features and automation tools',
    category: 'features',
    children: [
      {
        name: 'AI Hub Guide',
        path: '/help/ai-automation/ai-hub',
        description: 'Using the AI command center'
      },
      {
        name: 'AI Chat',
        path: '/help/ai-automation/ai-chat',
        description: 'Conversational AI assistant'
      },
      {
        name: 'Email Intelligence',
        path: '/help/ai-automation/email-intelligence',
        description: 'AI-powered email analysis'
      },
      {
        name: 'Automation Recipes',
        path: '/help/ai-automation/automation-recipes',
        description: 'Pre-built automation workflows'
      },
      {
        name: 'n8n Integration',
        path: '/help/ai-automation/n8n-integration',
        description: 'Setting up n8n workflows'
      }
    ]
  },
  {
    name: 'Analytics & Insights',
    path: '/help/analytics',
    icon: <BarChart2 className="h-5 w-5" />,
    description: 'Business intelligence and reporting',
    category: 'features',
    children: [
      {
        name: 'Analytics Dashboard',
        path: '/help/analytics/dashboard',
        description: 'Understanding your analytics'
      },
      {
        name: 'Business Health',
        path: '/help/analytics/business-health',
        description: 'Monitoring business performance'
      },
      {
        name: 'Cross-Platform Insights',
        path: '/help/analytics/cross-platform',
        description: 'Unified data insights'
      },
      {
        name: 'Custom Reports',
        path: '/help/analytics/custom-reports',
        description: 'Creating custom analytics'
      }
    ]
  },
  {
    name: 'Team & Operations',
    path: '/help/team-operations',
    icon: <Users className="h-5 w-5" />,
    description: 'Team management and collaboration',
    category: 'features',
    children: [
      {
        name: 'Team Management',
        path: '/help/team-operations/team-management',
        description: 'Managing team members and roles'
      },
      {
        name: 'Department Tools',
        path: '/help/team-operations/departments',
        description: 'Sales, Finance, Operations, Marketing'
      },
      {
        name: 'Collaboration',
        path: '/help/team-operations/collaboration',
        description: 'Working together in Nexus'
      },
      {
        name: 'Permissions',
        path: '/help/team-operations/permissions',
        description: 'Managing access and permissions'
      }
    ]
  },

  // === INTEGRATIONS ===
  {
    name: 'Integrations',
    path: '/help/integrations',
    icon: <Database className="h-5 w-5" />,
    description: 'Connecting your business tools',
    category: 'integrations',
    children: [
      {
        name: 'Integration Hub',
        path: '/help/integrations/hub',
        description: 'Overview of available integrations'
      },
      {
        name: 'HubSpot CRM',
        path: '/help/integrations/hubspot',
        description: 'Setting up HubSpot integration'
      },
      {
        name: 'Google Workspace',
        path: '/help/integrations/google-workspace',
        description: 'Connecting Google services'
      },
      {
        name: 'Microsoft 365',
        path: '/help/integrations/microsoft-365',
        description: 'Setting up Microsoft integration'
      },
      {
        name: 'API Learning',
        path: '/help/integrations/api-learning',
        description: 'Custom API integrations'
      }
    ]
  },

  // === TROUBLESHOOTING ===
  {
    name: 'Troubleshooting',
    path: '/help/troubleshooting',
    icon: <HelpCircle className="h-5 w-5" />,
    description: 'Common issues and solutions',
    category: 'troubleshooting',
    children: [
      {
        name: 'Common Issues',
        path: '/help/troubleshooting/common-issues',
        description: 'Frequently asked questions'
      },
      {
        name: 'Performance',
        path: '/help/troubleshooting/performance',
        description: 'Optimizing Nexus performance'
      },
      {
        name: 'Data Sync',
        path: '/help/troubleshooting/data-sync',
        description: 'Integration sync issues'
      },
      {
        name: 'Error Messages',
        path: '/help/troubleshooting/error-messages',
        description: 'Understanding error codes'
      }
    ]
  },
  {
    name: 'Contact Support',
    path: '/help/support',
    icon: <MessageSquare className="h-5 w-5" />,
    description: 'Get help from our team',
    category: 'troubleshooting',
    children: [
      {
        name: 'Submit Ticket',
        path: '/help/support/submit-ticket',
        description: 'Create a support ticket'
      },
      {
        name: 'Live Chat',
        path: '/help/support/live-chat',
        description: 'Chat with support team'
      },
      {
        name: 'Phone Support',
        path: '/help/support/phone',
        description: 'Call us for immediate help'
      },
      {
        name: 'Community Forum',
        path: '/help/support/community',
        description: 'Connect with other users'
      }
    ]
  },

  // === ADVANCED ===
  {
    name: 'Advanced Features',
    path: '/help/advanced',
    icon: <Zap className="h-5 w-5" />,
    description: 'Power user features and tips',
    category: 'advanced',
    children: [
      {
        name: 'Custom Workflows',
        path: '/help/advanced/custom-workflows',
        description: 'Building advanced automations'
      },
      {
        name: 'API Development',
        path: '/help/advanced/api-development',
        description: 'Using Nexus APIs'
      },
      {
        name: 'Data Export',
        path: '/help/advanced/data-export',
        description: 'Exporting your data'
      },
      {
        name: 'Security Best Practices',
        path: '/help/advanced/security',
        description: 'Securing your Nexus account'
      }
    ]
  },
  {
    name: 'Training & Certification',
    path: '/help/training',
    icon: <GraduationCap className="h-5 w-5" />,
    description: 'Become a Nexus expert',
    category: 'advanced',
    children: [
      {
        name: 'Video Tutorials',
        path: '/help/training/video-tutorials',
        description: 'Step-by-step video guides'
      },
      {
        name: 'Webinars',
        path: '/help/training/webinars',
        description: 'Live training sessions'
      },
      {
        name: 'Certification Program',
        path: '/help/training/certification',
        description: 'Get certified as a Nexus expert'
      },
      {
        name: 'Best Practices',
        path: '/help/training/best-practices',
        description: 'Proven strategies for success'
      }
    ]
  },

  // === LEGAL & PRIVACY ===
  {
    name: 'Legal & Privacy',
    path: '/help/legal',
    icon: <Shield className="h-5 w-5" />,
    description: 'Legal information and privacy',
    category: 'legal',
    children: [
      {
        name: 'Privacy Policy',
        path: '/help/legal/privacy-policy',
        description: 'How we protect your data'
      },
      {
        name: 'Terms of Service',
        path: '/help/legal/terms-of-service',
        description: 'Our service agreement'
      },
      {
        name: 'Data Processing',
        path: '/help/legal/data-processing',
        description: 'How we process your data'
      },
      {
        name: 'GDPR Compliance',
        path: '/help/legal/gdpr',
        description: 'European data protection'
      }
    ]
  }
];

// Helper function to get items by category
export const getHelpItemsByCategory = (category: 'getting-started' | 'features' | 'integrations' | 'troubleshooting' | 'advanced' | 'legal') => {
  return helpCenterNavItems.filter(item => item.category === category);
};

// Helper function to get all help items
export const getAllHelpItems = () => {
  return helpCenterNavItems;
};
