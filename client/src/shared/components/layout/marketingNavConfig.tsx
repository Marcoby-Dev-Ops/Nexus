import React from 'react';
import {
  Target,
  BookOpen,
  Info,
  Star,
  Users,
  TrendingUp,
  Shield,
  Lightbulb
} from 'lucide-react';
import type { ReactNode } from 'react';

export interface MarketingNavItem {
  name: string;
  path: string;
  icon?: ReactNode;
  children?: { name: string; path: string; description?: string; badge?: string }[];
  description?: string;
  category?: 'features' | 'about' | 'resources' | 'support';
  badge?: string;
}

export const marketingNavItems: MarketingNavItem[] = [
  // === FEATURES & CAPABILITIES ===
  {
    name: 'Platform Features',
    path: '/features',
    icon: <Star className="h-5 w-5" />,
    description: 'Explore what Nexus can do for your business',
    category: 'features',
    children: [
      {
        name: 'AI Capabilities',
        path: '/ai-capabilities',
        description: 'Advanced AI features and capabilities'
      },
      // Purposeful experience entries removed
      {
        name: 'Business Intelligence',
        path: '/analytics/showcase',
        description: 'Cross-platform business insights'
      }
    ]
  },
  {
    name: 'Use Cases',
    path: '/use-cases',
    icon: <Target className="h-5 w-5" />,
    description: 'See how businesses use Nexus',
    category: 'features',
    children: [
      {
        name: 'Small Business',
        path: '/use-cases/small-business',
        description: 'Perfect for growing businesses'
      },
      {
        name: 'Enterprise',
        path: '/use-cases/enterprise',
        description: 'Scalable for large organizations'
      },
      {
        name: 'Startups',
        path: '/use-cases/startups',
        description: 'Built for rapid growth'
      },
      {
        name: 'Consultants',
        path: '/use-cases/consultants',
        description: 'Client management and insights'
      }
    ]
  },

  // === ABOUT & COMPANY ===
  {
    name: 'About Nexus',
    path: '/about',
    icon: <Info className="h-5 w-5" />,
    description: 'Learn about our mission and team',
    category: 'about',
    children: [
      {
        name: 'Our Mission',
        path: '/about/mission',
        description: 'Why we built Nexus'
      },
      {
        name: 'The Team',
        path: '/about/team',
        description: 'Meet the people behind Nexus'
      },
      {
        name: 'Our Story',
        path: '/about/story',
        description: 'How Nexus came to be'
      },
      {
        name: 'Careers',
        path: '/about/careers',
        description: 'Join our team'
      }
    ]
  },
  {
    name: 'Success Stories',
    path: '/success-stories',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'Real results from real businesses',
    category: 'about',
    children: [
      {
        name: 'Case Studies',
        path: '/success-stories/case-studies',
        description: 'Detailed business transformations'
      },
      {
        name: 'Testimonials',
        path: '/success-stories/testimonials',
        description: 'What our customers say'
      },
      {
        name: 'ROI Calculator',
        path: '/success-stories/roi-calculator',
        description: 'Calculate your potential savings'
      }
    ]
  },

  // === RESOURCES & LEARNING ===
  {
    name: 'Resources',
    path: '/resources',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'Educational content and guides',
    category: 'resources',
    children: [
      {
        name: 'Blog',
        path: '/blog',
        description: 'Latest insights and updates'
      },
      {
        name: 'Webinars',
        path: '/resources/webinars',
        description: 'Live and recorded sessions'
      },
      {
        name: 'Templates',
        path: '/resources/templates',
        description: 'Ready-to-use business templates'
      },
      {
        name: 'API Documentation',
        path: '/docs/api',
        description: 'Technical integration guides'
      }
    ]
  },
  {
    name: 'Learning Center',
    path: '/learning',
    icon: <Lightbulb className="h-5 w-5" />,
    description: 'Master your business with Nexus',
    category: 'resources',
    children: [
      {
        name: 'Getting Started',
        path: '/learning/getting-started',
        description: 'Your first 30 days with Nexus'
      },
      {
        name: 'Best Practices',
        path: '/learning/best-practices',
        description: 'Proven strategies for success'
      },
      {
        name: 'Video Tutorials',
        path: '/learning/tutorials',
        description: 'Step-by-step video guides'
      },
      {
        name: 'Certification',
        path: '/learning/certification',
        description: 'Become a Nexus expert'
      }
    ]
  },

  // === SUPPORT & LEGAL ===
  {
    name: 'Support',
    path: '/support',
    icon: <Users className="h-5 w-5" />,
    description: 'Get help when you need it',
    category: 'support',
    children: [
      {
        name: 'Help Center',
        path: '/help',
        description: 'Searchable knowledge base'
      },
      {
        name: 'Contact Support',
        path: '/support/contact',
        description: 'Get in touch with our team'
      },
      {
        name: 'Community',
        path: '/support/community',
        description: 'Connect with other users'
      },
      {
        name: 'Status Page',
        path: '/support/status',
        description: 'System status and updates'
      }
    ]
  },
  {
    name: 'Legal & Privacy',
    path: '/legal',
    icon: <Shield className="h-5 w-5" />,
    description: 'Important legal information',
    category: 'support',
    children: [
      {
        name: 'Privacy Policy',
        path: '/legal/privacy',
        description: 'How we protect your data'
      },
      {
        name: 'Terms of Service',
        path: '/legal/terms',
        description: 'Our service agreement'
      },
      {
        name: 'Cookie Policy',
        path: '/legal/cookies',
        description: 'How we use cookies'
      },
      {
        name: 'Security',
        path: '/legal/security',
        description: 'Our security practices'
      }
    ]
  }
];

// Helper function to get items by category
export const getMarketingItemsByCategory = (category: 'features' | 'about' | 'resources' | 'support') => {
  return marketingNavItems.filter(item => item.category === category);
};

// Helper function to get all marketing items
export const getAllMarketingItems = () => {
  return marketingNavItems;
};
