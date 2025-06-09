import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import SlackSetup from '@/components/integrations/SlackSetup';
import MicrosoftTeamsSetup from '@/components/integrations/MicrosoftTeamsSetup';
import { 
  Search, 
  Filter, 
  Plus, 
  Check, 
  Settings, 
  AlertCircle, 
  Zap,
  Database,
  BarChart3,
  MessageSquare,
  ShoppingCart,
  Users,
  DollarSign,
  Mail,
  Calendar,
  FileText,
  Cloud,
  Smartphone,
  Globe,
  Building2,
  TrendingUp,
  Plug,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  isPopular: boolean;
  difficulty: 'easy' | 'medium' | 'advanced';
  estimatedSetupTime: string;
  features: string[];
  status?: 'healthy' | 'warning' | 'error';
  lastSync?: string;
  dataFields?: number;
}

interface IntegrationsProps {
  className?: string;
}

/**
 * Integrations page for connecting business tools and services
 */
const Integrations: React.FC<IntegrationsProps> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupModal, setSetupModal] = useState<{ isOpen: boolean; integration: Integration | null }>({
    isOpen: false,
    integration: null
  });

  // Comprehensive business app library - mirrors top platforms like Zapier, AppSource
  const mockIntegrations: Integration[] = [
    // === CRM & SALES ===
    {
      id: '1',
      name: 'Salesforce',
      slug: 'salesforce',
      category: 'CRM & Sales',
      description: 'World\'s #1 CRM platform for sales, service, and marketing automation',
      icon: <Cloud className="w-6 h-6 text-blue-600" />,
      isConnected: true,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Contact sync', 'Deal tracking', 'Sales analytics', 'Pipeline data', 'Lead scoring'],
      status: 'healthy',
      lastSync: '2 minutes ago',
      dataFields: 1247
    },
    {
      id: '2',
      name: 'HubSpot',
      slug: 'hubspot',
      category: 'CRM & Sales',
      description: 'All-in-one CRM, marketing, sales, and service platform',
      icon: <Building2 className="w-6 h-6 text-orange-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'easy',
      estimatedSetupTime: '5-10 min',
      features: ['Marketing automation', 'Contact management', 'Sales tracking', 'Live chat', 'Email sequences']
    },
    {
      id: '3',
      name: 'Pipedrive',
      slug: 'pipedrive',
      category: 'CRM & Sales',
      description: 'Simple and effective sales CRM designed by salespeople',
      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'easy',
      estimatedSetupTime: '5-10 min',
      features: ['Pipeline management', 'Activity tracking', 'Deal forecasting', 'Email integration']
    },
    {
      id: '4',
      name: 'Zoho CRM',
      slug: 'zoho-crm',
      category: 'CRM & Sales',
      description: 'Complete CRM solution with AI-powered sales insights',
      icon: <BarChart3 className="w-6 h-6 text-red-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Lead management', 'Sales automation', 'Analytics', 'Mobile CRM']
    },
    {
      id: '5',
      name: 'Microsoft Dynamics 365',
      slug: 'dynamics-365',
      category: 'CRM & Sales',
      description: 'Enterprise CRM and ERP solution from Microsoft',
      icon: <Building2 className="w-6 h-6 text-blue-500" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'advanced',
      estimatedSetupTime: '20-30 min',
      features: ['Customer insights', 'Sales automation', 'Service management', 'Business intelligence']
    },

    // === ACCOUNTING & FINANCE ===
    {
      id: '6',
      name: 'QuickBooks Online',
      slug: 'quickbooks',
      category: 'Accounting & Finance',
      description: 'Leading small business accounting software',
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
      isConnected: true,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '15-20 min',
      features: ['Revenue tracking', 'Expense management', 'Invoice sync', 'Financial reports', 'Tax preparation'],
      status: 'warning',
      lastSync: '1 hour ago',
      dataFields: 892
    },
    {
      id: '7',
      name: 'Xero',
      slug: 'xero',
      category: 'Accounting & Finance',
      description: 'Beautiful accounting software for small businesses',
      icon: <BarChart3 className="w-6 h-6 text-blue-500" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Bank reconciliation', 'Invoice management', 'Expense tracking', 'Tax reporting', 'Multi-currency']
    },
    {
      id: '8',
      name: 'FreshBooks',
      slug: 'freshbooks',
      category: 'Accounting & Finance',
      description: 'Simple invoicing and accounting for service-based businesses',
      icon: <FileText className="w-6 h-6 text-green-500" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'easy',
      estimatedSetupTime: '5-10 min',
      features: ['Time tracking', 'Invoicing', 'Expense tracking', 'Project management']
    },
    {
      id: '9',
      name: 'Stripe',
      slug: 'stripe',
      category: 'Accounting & Finance',
      description: 'Online payment processing for internet businesses',
      icon: <DollarSign className="w-6 h-6 text-purple-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'easy',
      estimatedSetupTime: '5-10 min',
      features: ['Payment processing', 'Subscription billing', 'Revenue recognition', 'Fraud prevention']
    },
    {
      id: '10',
      name: 'PayPal',
      slug: 'paypal',
      category: 'Accounting & Finance',
      description: 'Global digital payments platform',
      icon: <DollarSign className="w-6 h-6 text-blue-700" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'easy',
      estimatedSetupTime: '3-5 min',
      features: ['Payment processing', 'Transaction data', 'Refund management', 'Buyer protection']
    },

    // === MARKETING & ADVERTISING ===
    {
      id: '11',
      name: 'Google Analytics',
      slug: 'google-analytics',
      category: 'Marketing & Advertising',
      description: 'Web analytics service that tracks and reports website traffic',
      icon: <TrendingUp className="w-6 h-6 text-red-600" />,
      isConnected: true,
      isPopular: true,
      difficulty: 'easy',
      estimatedSetupTime: '5 min',
      features: ['Traffic analytics', 'Conversion tracking', 'Audience insights', 'Goal monitoring', 'E-commerce tracking'],
      status: 'healthy',
      lastSync: '5 minutes ago',
      dataFields: 2341
    },
    {
      id: '12',
      name: 'Google Ads',
      slug: 'google-ads',
      category: 'Marketing & Advertising',
      description: 'Online advertising platform developed by Google',
      icon: <Smartphone className="w-6 h-6 text-blue-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Campaign performance', 'Keyword analytics', 'Ad spend tracking', 'Conversion data']
    },
    {
      id: '13',
      name: 'Facebook Ads',
      slug: 'facebook-ads',
      category: 'Marketing & Advertising',
      description: 'Advertising platform for Facebook and Instagram',
      icon: <Globe className="w-6 h-6 text-blue-800" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Ad performance', 'Audience insights', 'Conversion tracking', 'ROI analysis']
    },
    {
      id: '14',
      name: 'Mailchimp',
      slug: 'mailchimp',
      category: 'Marketing & Advertising',
      description: 'All-in-one marketing platform for small businesses',
      icon: <Mail className="w-6 h-6 text-yellow-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'easy',
      estimatedSetupTime: '5-10 min',
      features: ['Email campaigns', 'Subscriber management', 'A/B testing', 'Automation', 'Landing pages']
    },
    {
      id: '15',
      name: 'Constant Contact',
      slug: 'constant-contact',
      category: 'Marketing & Advertising',
      description: 'Email marketing and online survey tool',
      icon: <Mail className="w-6 h-6 text-blue-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'easy',
      estimatedSetupTime: '5-10 min',
      features: ['Email marketing', 'List management', 'Event marketing', 'Social media']
    },
    {
      id: '16',
      name: 'Marketo',
      slug: 'marketo',
      category: 'Marketing & Advertising',
      description: 'Marketing automation software by Adobe',
      icon: <Zap className="w-6 h-6 text-purple-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'advanced',
      estimatedSetupTime: '20-30 min',
      features: ['Lead nurturing', 'Email marketing', 'Account-based marketing', 'Analytics']
    },

    // === E-COMMERCE ===
    {
      id: '17',
      name: 'Shopify',
      slug: 'shopify',
      category: 'E-commerce',
      description: 'Complete commerce platform for online stores',
      icon: <ShoppingCart className="w-6 h-6 text-green-500" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Sales tracking', 'Inventory sync', 'Customer data', 'Order management', 'Product analytics']
    },
    {
      id: '18',
      name: 'WooCommerce',
      slug: 'woocommerce',
      category: 'E-commerce',
      description: 'WordPress e-commerce plugin for online stores',
      icon: <ShoppingCart className="w-6 h-6 text-purple-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Store analytics', 'Product management', 'Order tracking', 'Customer insights']
    },
    {
      id: '19',
      name: 'Magento',
      slug: 'magento',
      category: 'E-commerce',
      description: 'Enterprise e-commerce platform by Adobe',
      icon: <ShoppingCart className="w-6 h-6 text-orange-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'advanced',
      estimatedSetupTime: '20-30 min',
      features: ['Multi-store management', 'B2B functionality', 'Advanced analytics', 'Customization']
    },
    {
      id: '20',
      name: 'Amazon Seller Central',
      slug: 'amazon-seller',
      category: 'E-commerce',
      description: 'Amazon marketplace seller tools and analytics',
      icon: <ShoppingCart className="w-6 h-6 text-orange-500" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '15-20 min',
      features: ['Sales data', 'Inventory management', 'Advertising metrics', 'Customer feedback']
    },
    {
      id: '21',
      name: 'Etsy',
      slug: 'etsy',
      category: 'E-commerce',
      description: 'Marketplace for creative goods and vintage items',
      icon: <ShoppingCart className="w-6 h-6 text-orange-400" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'easy',
      estimatedSetupTime: '5-10 min',
      features: ['Shop analytics', 'Order management', 'Customer data', 'Listing performance']
    },

    // === PROJECT MANAGEMENT ===
    {
      id: '22',
      name: 'Asana',
      slug: 'asana',
      category: 'Project Management',
      description: 'Team collaboration and project management platform',
      icon: <FileText className="w-6 h-6 text-red-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Task tracking', 'Project timelines', 'Team productivity', 'Goal monitoring', 'Time tracking']
    },
    {
      id: '23',
      name: 'Trello',
      slug: 'trello',
      category: 'Project Management',
      description: 'Visual project management with boards and cards',
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'easy',
      estimatedSetupTime: '5-10 min',
      features: ['Board analytics', 'Card activity', 'Team productivity', 'Due date tracking']
    },
    {
      id: '24',
      name: 'Monday.com',
      slug: 'monday',
      category: 'Project Management',
      description: 'Work operating system for teams',
      icon: <Calendar className="w-6 h-6 text-purple-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Project tracking', 'Time management', 'Team collaboration', 'Custom workflows']
    },
    {
      id: '25',
      name: 'Jira',
      slug: 'jira',
      category: 'Project Management',
      description: 'Issue and project tracking for agile teams',
      icon: <Settings className="w-6 h-6 text-blue-700" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'advanced',
      estimatedSetupTime: '15-20 min',
      features: ['Issue tracking', 'Sprint planning', 'Team velocity', 'Bug reports', 'Release management']
    },
    {
      id: '26',
      name: 'Notion',
      slug: 'notion',
      category: 'Project Management',
      description: 'All-in-one workspace for notes, docs, and projects',
      icon: <FileText className="w-6 h-6 text-gray-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Database analytics', 'Page views', 'Team activity', 'Content tracking']
    },

    // === COMMUNICATION & COLLABORATION ===
    {
      id: '27',
      name: 'Slack',
      slug: 'slack',
      category: 'Communication',
      description: 'Business communication platform for teams',
      icon: <MessageSquare className="w-6 h-6 text-purple-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'easy',
      estimatedSetupTime: '3-5 min',
      features: ['Message analytics', 'Channel activity', 'User engagement', 'App usage', 'File sharing']
    },
    {
      id: '28',
      name: 'Microsoft Teams',
      slug: 'microsoft-teams',
      category: 'Communication',
      description: 'Chat, meetings, and collaboration in Microsoft 365',
      icon: <MessageSquare className="w-6 h-6 text-blue-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Meeting analytics', 'Chat data', 'File collaboration', 'Team activity']
    },
    {
      id: '29',
      name: 'Zoom',
      slug: 'zoom',
      category: 'Communication',
      description: 'Video conferencing and webinar platform',
      icon: <Calendar className="w-6 h-6 text-blue-500" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'easy',
      estimatedSetupTime: '5-10 min',
      features: ['Meeting metrics', 'Attendance tracking', 'Usage analytics', 'Recording data']
    },
    {
      id: '30',
      name: 'Discord',
      slug: 'discord',
      category: 'Communication',
      description: 'Voice, video, and text communication for communities',
      icon: <MessageSquare className="w-6 h-6 text-indigo-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'easy',
      estimatedSetupTime: '5-10 min',
      features: ['Server analytics', 'Member activity', 'Message data', 'Voice statistics']
    },

    // === HR & PEOPLE ===
    {
      id: '31',
      name: 'BambooHR',
      slug: 'bamboohr',
      category: 'HR & People',
      description: 'Human resources software for growing companies',
      icon: <Users className="w-6 h-6 text-green-700" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'advanced',
      estimatedSetupTime: '20-30 min',
      features: ['Employee data', 'Performance tracking', 'Time-off management', 'Onboarding', 'Payroll integration']
    },
    {
      id: '32',
      name: 'Workday',
      slug: 'workday',
      category: 'HR & People',
      description: 'Enterprise cloud applications for finance and HR',
      icon: <Users className="w-6 h-6 text-blue-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'advanced',
      estimatedSetupTime: '30-45 min',
      features: ['Workforce analytics', 'Talent management', 'Financial planning', 'Compliance tracking']
    },
    {
      id: '33',
      name: 'ADP',
      slug: 'adp',
      category: 'HR & People',
      description: 'Payroll, benefits, and HR management',
      icon: <DollarSign className="w-6 h-6 text-red-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'advanced',
      estimatedSetupTime: '25-35 min',
      features: ['Payroll data', 'Benefits administration', 'Tax compliance', 'Time tracking']
    },
    {
      id: '34',
      name: 'Greenhouse',
      slug: 'greenhouse',
      category: 'HR & People',
      description: 'Recruiting and hiring software',
      icon: <Users className="w-6 h-6 text-green-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'medium',
      estimatedSetupTime: '15-20 min',
      features: ['Hiring metrics', 'Candidate tracking', 'Interview analytics', 'Source effectiveness']
    },

    // === CUSTOMER SUPPORT ===
    {
      id: '35',
      name: 'Zendesk',
      slug: 'zendesk',
      category: 'Customer Support',
      description: 'Customer service and engagement platform',
      icon: <MessageSquare className="w-6 h-6 text-green-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Ticket analytics', 'Agent performance', 'Customer satisfaction', 'Response times']
    },
    {
      id: '36',
      name: 'Intercom',
      slug: 'intercom',
      category: 'Customer Support',
      description: 'Customer messaging and support platform',
      icon: <MessageSquare className="w-6 h-6 text-blue-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Conversation data', 'User engagement', 'Support metrics', 'Bot performance']
    },
    {
      id: '37',
      name: 'Freshdesk',
      slug: 'freshdesk',
      category: 'Customer Support',
      description: 'Cloud-based customer support software',
      icon: <MessageSquare className="w-6 h-6 text-red-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Ticket management', 'Agent analytics', 'Customer feedback', 'SLA tracking']
    },

    // === ANALYTICS & BUSINESS INTELLIGENCE ===
    {
      id: '38',
      name: 'Tableau',
      slug: 'tableau',
      category: 'Analytics & BI',
      description: 'Business intelligence and data visualization platform',
      icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'advanced',
      estimatedSetupTime: '20-30 min',
      features: ['Dashboard data', 'Usage analytics', 'Report metrics', 'User activity']
    },
    {
      id: '39',
      name: 'Power BI',
      slug: 'power-bi',
      category: 'Analytics & BI',
      description: 'Business analytics solution by Microsoft',
      icon: <BarChart3 className="w-6 h-6 text-yellow-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '15-20 min',
      features: ['Report analytics', 'Dataset usage', 'Dashboard metrics', 'User engagement']
    },
    {
      id: '40',
      name: 'Mixpanel',
      slug: 'mixpanel',
      category: 'Analytics & BI',
      description: 'Product analytics for mobile and web',
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Event tracking', 'User analytics', 'Retention data', 'Funnel analysis']
    },

    // === SOCIAL MEDIA ===
    {
      id: '41',
      name: 'Hootsuite',
      slug: 'hootsuite',
      category: 'Social Media',
      description: 'Social media management platform',
      icon: <Globe className="w-6 h-6 text-blue-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'easy',
      estimatedSetupTime: '5-10 min',
      features: ['Post analytics', 'Engagement metrics', 'Audience insights', 'Campaign performance']
    },
    {
      id: '42',
      name: 'Buffer',
      slug: 'buffer',
      category: 'Social Media',
      description: 'Social media scheduling and analytics tool',
      icon: <Globe className="w-6 h-6 text-blue-500" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'easy',
      estimatedSetupTime: '5-10 min',
      features: ['Publishing analytics', 'Engagement data', 'Audience growth', 'Content performance']
    },
    {
      id: '43',
      name: 'Sprout Social',
      slug: 'sprout-social',
      category: 'Social Media',
      description: 'Social media management and optimization platform',
      icon: <Globe className="w-6 h-6 text-green-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Social analytics', 'Team performance', 'Brand monitoring', 'Competitor analysis']
    },

    // === CLOUD STORAGE & PRODUCTIVITY ===
    {
      id: '44',
      name: 'Google Drive',
      slug: 'google-drive',
      category: 'Productivity',
      description: 'Cloud storage and file sharing service',
      icon: <Cloud className="w-6 h-6 text-blue-500" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'easy',
      estimatedSetupTime: '3-5 min',
      features: ['Storage analytics', 'File activity', 'Sharing metrics', 'Collaboration data']
    },
    {
      id: '45',
      name: 'Dropbox',
      slug: 'dropbox',
      category: 'Productivity',
      description: 'Cloud storage and file synchronization service',
      icon: <Cloud className="w-6 h-6 text-blue-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'easy',
      estimatedSetupTime: '3-5 min',
      features: ['File analytics', 'Team activity', 'Storage usage', 'Sharing statistics']
    },
    {
      id: '46',
      name: 'Microsoft 365',
      slug: 'microsoft-365',
      category: 'Productivity',
      description: 'Cloud-based productivity and collaboration suite',
      icon: <Building2 className="w-6 h-6 text-blue-600" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '15-20 min',
      features: ['Usage analytics', 'Collaboration metrics', 'Security insights', 'License utilization']
    },
    {
      id: '47',
      name: 'Airtable',
      slug: 'airtable',
      category: 'Productivity',
      description: 'Cloud collaboration service with spreadsheet-database hybrid',
      icon: <Database className="w-6 h-6 text-yellow-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Base analytics', 'Record activity', 'Collaboration metrics', 'Usage data']
    },

    // === DEVELOPMENT & IT ===
    {
      id: '48',
      name: 'GitHub',
      slug: 'github',
      category: 'Development',
      description: 'Version control and collaboration platform for developers',
      icon: <Settings className="w-6 h-6 text-gray-800" />,
      isConnected: false,
      isPopular: true,
      difficulty: 'medium',
      estimatedSetupTime: '10-15 min',
      features: ['Repository analytics', 'Commit activity', 'Pull request metrics', 'Issue tracking']
    },
    {
      id: '49',
      name: 'GitLab',
      slug: 'gitlab',
      category: 'Development',
      description: 'Complete DevOps platform with built-in CI/CD',
      icon: <Settings className="w-6 h-6 text-orange-600" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'medium',
      estimatedSetupTime: '15-20 min',
      features: ['Project analytics', 'Pipeline metrics', 'Code quality', 'Deployment frequency']
    },
    {
      id: '50',
      name: 'AWS',
      slug: 'aws',
      category: 'Development',
      description: 'Amazon Web Services cloud computing platform',
      icon: <Cloud className="w-6 h-6 text-orange-500" />,
      isConnected: false,
      isPopular: false,
      difficulty: 'advanced',
      estimatedSetupTime: '25-35 min',
      features: ['Cost analytics', 'Resource utilization', 'Performance metrics', 'Security insights']
    }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', count: mockIntegrations.length },
    { id: 'CRM & Sales', name: 'CRM & Sales', count: mockIntegrations.filter(i => i.category === 'CRM & Sales').length },
    { id: 'Accounting & Finance', name: 'Accounting & Finance', count: mockIntegrations.filter(i => i.category === 'Accounting & Finance').length },
    { id: 'Marketing & Advertising', name: 'Marketing & Advertising', count: mockIntegrations.filter(i => i.category === 'Marketing & Advertising').length },
    { id: 'E-commerce', name: 'E-commerce', count: mockIntegrations.filter(i => i.category === 'E-commerce').length },
    { id: 'Project Management', name: 'Project Management', count: mockIntegrations.filter(i => i.category === 'Project Management').length },
    { id: 'Communication', name: 'Communication', count: mockIntegrations.filter(i => i.category === 'Communication').length },
    { id: 'HR & People', name: 'HR & People', count: mockIntegrations.filter(i => i.category === 'HR & People').length },
    { id: 'Customer Support', name: 'Customer Support', count: mockIntegrations.filter(i => i.category === 'Customer Support').length },
    { id: 'Analytics & BI', name: 'Analytics & BI', count: mockIntegrations.filter(i => i.category === 'Analytics & BI').length },
    { id: 'Social Media', name: 'Social Media', count: mockIntegrations.filter(i => i.category === 'Social Media').length },
    { id: 'Productivity', name: 'Productivity', count: mockIntegrations.filter(i => i.category === 'Productivity').length },
    { id: 'Development', name: 'Development', count: mockIntegrations.filter(i => i.category === 'Development').length }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIntegrations(mockIntegrations);
      setLoading(false);
    }, 500);
  }, []);

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = integrations.filter(i => i.isConnected).length;
  const popularIntegrations = integrations.filter(i => i.isPopular && !i.isConnected).slice(0, 4);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy': return <Check className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const handleConnectClick = (integration: Integration) => {
    setSetupModal({ isOpen: true, integration });
  };

  const handleCloseModal = () => {
    setSetupModal({ isOpen: false, integration: null });
  };

  const handleIntegrationComplete = () => {
    // Refresh integrations or update state
    handleCloseModal();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Business App Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect all your business tools - 50+ integrations with the world's top platforms
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="px-4 py-2">
            <Database className="w-4 h-4 mr-2" />
            {connectedCount} Connected
          </Badge>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Globe className="w-4 h-4 mr-2" />
            Explore Marketplace
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Connections
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {connectedCount}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Plug className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Data Points Synced
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {integrations.filter(i => i.isConnected).reduce((sum, i) => sum + (i.dataFields || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Available Integrations
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {integrations.length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  System Health
                </p>
                <p className="text-2xl font-bold text-green-600">
                  98%
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Integrations */}
      {popularIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Popular Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularIntegrations.map((integration) => (
                <div
                  key={integration.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    {integration.icon}
                    <Badge className={getDifficultyColor(integration.difficulty)}>
                      {integration.difficulty}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {integration.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {integration.estimatedSetupTime}
                  </p>
                  <Button size="sm" className="w-full" onClick={() => handleConnectClick(integration)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredIntegrations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No integrations found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or category filter
            </p>
          </div>
        ) : (
          filteredIntegrations.map((integration) => (
            <Card
              key={integration.id}
              className={`relative transition-all hover:shadow-lg ${
                integration.isConnected 
                  ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' 
                  : 'hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {integration.icon}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {integration.name}
                      </h3>
                      <Badge variant="outline" className="mt-1">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                  {integration.isConnected && getStatusIcon(integration.status)}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {integration.description}
                </p>

                {/* Features */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Features
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {integration.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {integration.features.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{integration.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Status Info */}
                {integration.isConnected && (
                  <div className="mb-4 p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Last sync:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {integration.lastSync}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600 dark:text-gray-400">Data points:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {integration.dataFields?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Setup Info */}
                {!integration.isConnected && (
                  <div className="mb-4 flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Badge className={getDifficultyColor(integration.difficulty)}>
                        {integration.difficulty}
                      </Badge>
                      <span className="text-gray-600 dark:text-gray-400">
                        {integration.estimatedSetupTime}
                      </span>
                    </div>
                    {integration.isPopular && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300">
                        Popular
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  {integration.isConnected ? (
                    <>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleConnectClick(integration)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Connect {integration.name}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Setup Modals */}
      {setupModal.isOpen && setupModal.integration && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                Setup {setupModal.integration.name} Integration
              </h2>
              <Button variant="outline" size="sm" onClick={handleCloseModal}>
                ×
              </Button>
            </div>
            <div className="p-6">
              {setupModal.integration.slug === 'slack' && (
                <SlackSetup
                  onComplete={handleIntegrationComplete}
                  onCancel={handleCloseModal}
                />
              )}
              {setupModal.integration.slug === 'microsoft-teams' && (
                <MicrosoftTeamsSetup
                  onComplete={handleIntegrationComplete}
                  onCancel={handleCloseModal}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations; 