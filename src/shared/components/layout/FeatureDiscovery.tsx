import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Zap, 
  BarChart2, 
  Brain, 
  Target,
  Database,
  Users,
  Settings,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  MessageSquare,
  CreditCard
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Input } from '@/shared/components/ui/Input.tsx';

interface Feature {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  category: 'core' | 'ai' | 'business' | 'integrations' | 'analytics';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isNew?: boolean;
  isHighlighted?: boolean;
}

export const FeatureDiscovery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const features: Feature[] = [
    // Core Features
    {
      id: 'home',
      name: 'Home Dashboard',
      description: 'What\'s going on in my world? Real-time insights and alerts',
      path: '/dashboard/home',
      icon: <Target className="h-5 w-5" />,
      category: 'core',
      difficulty: 'beginner',
      isHighlighted: true
    },
    {
      id: 'workspace',
      name: 'Action Center',
      description: 'How do I want to address what\'s going on? Task and automation management',
      path: '/tasks/workspace/actions',
      icon: <Search className="h-5 w-5" />,
      category: 'core',
      difficulty: 'beginner',
      isHighlighted: true
    },
    {
      id: 'fire-cycle',
      name: 'FIRE Cycle Manager',
      description: 'Thought/Idea/Initiative Management system',
      path: '/business/fire-cycle',
      icon: <Brain className="h-5 w-5" />,
      category: 'core',
      difficulty: 'intermediate',
      isHighlighted: true
    },
    {
      id: 'knowledge',
      name: 'Knowledge Enhancer',
      description: 'Pull in data to enhance my knowledge with AI insights',
      path: '/integrations/knowledge',
      icon: <Database className="h-5 w-5" />,
      category: 'integrations',
      difficulty: 'intermediate',
      isHighlighted: true
    },

    // AI Features
    {
      id: 'ai-chat',
      name: 'AI Chat',
      description: 'Intelligent business assistant for decision making',
      path: '/chat',
      icon: <MessageSquare className="h-5 w-5" />,
      category: 'ai',
      difficulty: 'beginner',
      isNew: true
    },
    {
      id: 'ai-performance',
      name: 'AI Performance',
      description: 'Monitor and optimize AI model performance',
      path: '/ai-performance',
      icon: <TrendingUp className="h-5 w-5" />,
      category: 'ai',
      difficulty: 'advanced'
    },

    // Business Features
    {
      id: 'sales',
      name: 'Sales Management',
      description: 'Complete sales pipeline and CRM functionality',
      path: '/sales',
      icon: <TrendingUp className="h-5 w-5" />,
      category: 'business',
      difficulty: 'intermediate'
    },
    {
      id: 'finance',
      name: 'Financial Management',
      description: 'Budget tracking, invoicing, and financial analytics',
      path: '/finance',
      icon: <CreditCard className="h-5 w-5" />,
      category: 'business',
      difficulty: 'intermediate'
    },
    {
      id: 'operations',
      name: 'Operations',
      description: 'Workflow management and operational efficiency',
      path: '/operations',
      icon: <Settings className="h-5 w-5" />,
      category: 'business',
      difficulty: 'intermediate'
    },

    // Analytics Features
    {
      id: 'analytics',
      name: 'Business Analytics',
      description: 'Comprehensive business intelligence and reporting',
      path: '/analytics',
      icon: <BarChart2 className="h-5 w-5" />,
      category: 'analytics',
      difficulty: 'intermediate'
    },
    {
      id: 'data-warehouse',
      name: 'Data Warehouse',
      description: 'Advanced data analysis and custom reporting',
      path: '/data-warehouse',
      icon: <Database className="h-5 w-5" />,
      category: 'analytics',
      difficulty: 'advanced'
    },

    // Integration Features
    {
      id: 'integrations',
      name: 'Integration Hub',
      description: 'Connect and manage all your business tools',
      path: '/integrations',
      icon: <Zap className="h-5 w-5" />,
      category: 'integrations',
      difficulty: 'beginner'
    },
    {
      id: 'team',
      name: 'Team Management',
      description: 'Manage users, roles, and permissions',
              path: '/tasks/workspace/team',
      icon: <Users className="h-5 w-5" />,
      category: 'business',
      difficulty: 'intermediate'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Features', icon: <Lightbulb className="h-4 w-4" /> },
    { id: 'core', name: 'Core Systems', icon: <Target className="h-4 w-4" /> },
    { id: 'ai', name: 'AI Tools', icon: <Brain className="h-4 w-4" /> },
    { id: 'business', name: 'Business', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'analytics', name: 'Analytics', icon: <BarChart2 className="h-4 w-4" /> },
    { id: 'integrations', name: 'Integrations', icon: <Zap className="h-4 w-4" /> }
  ];

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Discover Nexus Capabilities</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore the full range of Nexus features designed to help you start, standardize, operate, and grow your business.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm: flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              {category.icon}
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Featured Systems */}
      {selectedCategory === 'all' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Core Systems</h2>
          <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-4">
            {features.filter(f => f.isHighlighted).map((feature) => (
              <Card key={feature.id} className="hover: shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {feature.icon}
                    </div>
                    {feature.isNew && (
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{feature.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4">{feature.description}</CardDescription>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={getDifficultyColor(feature.difficulty)}>
                      {feature.difficulty}
                    </Badge>
                    <Link to={feature.path}>
                      <Button size="sm" variant="ghost">
                        Explore <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Features */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {selectedCategory === 'all' ? 'All Features' : categories.find(c => c.id === selectedCategory)?.name}
        </h2>
        <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeatures.map((feature) => (
            <Card key={feature.id} className="hover: shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-muted rounded-lg">
                    {feature.icon}
                  </div>
                  {feature.isNew && (
                    <Badge variant="secondary" className="text-xs">New</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{feature.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-4">{feature.description}</CardDescription>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={getDifficultyColor(feature.difficulty)}>
                    {feature.difficulty}
                  </Badge>
                  <Link to={feature.path}>
                    <Button size="sm" variant="ghost">
                      Explore <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {filteredFeatures.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No features found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}; 