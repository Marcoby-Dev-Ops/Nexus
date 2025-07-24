import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  Layout, 
  Eye, 
  ArrowRight, 
  Download, 
  Star, 
  CheckCircle, 
  Lightbulb, 
  Grid, 
  MessageSquare, 
  PieChart, 
  Shield, 
  Zap, 
  Plus, 
  Sparkles, 
  Target, 
  Users 
} from 'lucide-react';

const WorkspaceBuilderPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Drag & Drop Interface',
      description: 'Intuitive drag-and-drop interface for building workspaces without coding.',
      icon: <Layout className="w-6 h-6 text-primary" />
    },
    {
      title: 'Component Library',
      description: 'Rich library of pre-built components for common business needs.',
      icon: <Grid className="w-6 h-6 text-primary" />
    },
    {
      title: 'Real-time Collaboration',
      description: 'Share and collaborate on workspace layouts with your team.',
      icon: <Users className="w-6 h-6 text-primary" />
    },
    {
      title: 'Custom Components',
      description: 'Create and share custom components for your specific workflows.',
      icon: <Plus className="w-6 h-6 text-primary" />
    },
    {
      title: 'Analytics Integration',
      description: 'Built-in analytics to track workspace usage and effectiveness.',
      icon: <PieChart className="w-6 h-6 text-primary" />
    },
    {
      title: 'Template Marketplace',
      description: 'Browse and install workspace templates from the community.',
      icon: <Eye className="w-6 h-6 text-primary" />
    }
  ];

  const templates = [
    {
      name: 'Executive Dashboard',
      description: 'Complete executive overview with KPIs and strategic insights',
      category: 'Leadership',
      rating: 4.8,
      reviews: 127,
      downloads: 2340,
      components: 12,
      icon: <Target className="w-5 h-5 text-primary" />
    },
    {
      name: 'Sales Operations',
      description: 'Comprehensive sales pipeline and performance tracking',
      category: 'Sales',
      rating: 4.6,
      reviews: 89,
      downloads: 1567,
      components: 8,
      icon: <MessageSquare className="w-5 h-5 text-primary" />
    },
    {
      name: 'Product Development',
      description: 'Product roadmap, feature tracking, and development metrics',
      category: 'Product',
      rating: 4.7,
      reviews: 203,
      downloads: 3120,
      components: 15,
      icon: <Lightbulb className="w-5 h-5 text-primary" />
    },
    {
      name: 'Marketing Hub',
      description: 'Campaign management, analytics, and content planning',
      category: 'Marketing',
      rating: 4.5,
      reviews: 156,
      downloads: 1890,
      components: 10,
      icon: <Zap className="w-5 h-5 text-primary" />
    }
  ];

  const availableComponents = [
    { name: 'Analytics Widget', category: 'Analytics', icon: <PieChart className="w-4 h-4" /> },
    { name: 'Tasks Widget', category: 'Productivity', icon: <CheckCircle className="w-4 h-4" /> },
    { name: 'Ideas & Innovation', category: 'Productivity', icon: <Lightbulb className="w-4 h-4" /> },
    { name: 'Calendar', category: 'Productivity', icon: <Grid className="w-4 h-4" /> },
    { name: 'Email', category: 'Communication', icon: <MessageSquare className="w-4 h-4" /> },
    { name: 'Business Metrics', category: 'Analytics', icon: <PieChart className="w-4 h-4" /> },
    { name: 'Security Monitor', category: 'Analytics', icon: <Shield className="w-4 h-4" /> },
    { name: 'AI Performance', category: 'AI', icon: <Zap className="w-4 h-4" /> },
    { name: 'Quick Actions', category: 'Productivity', icon: <Plus className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Layout className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Workspace Builder</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Create personalized workspaces by combining powerful components. 
          Build exactly what you need for maximum productivity and insight.
        </p>
        <div className="flex items-center justify-center space-x-4 pt-4">
          <Button size="lg" onClick={() => navigate('/workspace-builder')}>
            <Layout className="w-5 h-5 mr-2" />
            Start Building
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/workspace-marketplace')}>
            <Eye className="w-5 h-5 mr-2" />
            Browse Templates
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover: shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-4">
                {feature.icon}
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Popular Templates */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Popular Templates</h2>
            <p className="text-muted-foreground">Get started quickly with pre-built workspaces</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/workspace-marketplace')}>
            View All Templates
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template, index) => (
            <Card key={index} className="hover: shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {template.icon}
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-warning fill-yellow-500" />
                    <span className="text-xs font-medium">{template.rating}</span>
                  </div>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span>{template.components} components</span>
                  <div className="flex items-center space-x-1">
                    <Download className="w-3 h-3" />
                    <span>{template.downloads.toLocaleString()}</span>
                  </div>
                </div>
                <Button size="sm" className="w-full" onClick={() => navigate('/workspace-marketplace')}>
                  <Download className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Components */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Available Components</h2>
          <p className="text-muted-foreground">Mix and match these components to build your perfect workspace</p>
        </div>

        <div className="grid grid-cols-2 md: grid-cols-4 lg:grid-cols-8 gap-4">
          {availableComponents.map((component, index) => (
            <Card key={index} className="p-4 text-center hover: shadow-md transition-shadow">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-muted rounded-lg">
                  {component.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{component.name}</p>
                  <p className="text-xs text-muted-foreground">{component.category}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Ready to Get Started?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Building your first workspace takes just a few minutes. Choose from our templates or start from scratch.
          </p>
          <div className="flex flex-col sm: flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <Button onClick={() => navigate('/workspace-builder')}>
              <Layout className="w-4 h-4 mr-2" />
              Create Custom Workspace
            </Button>
            <Button variant="outline" onClick={() => navigate('/workspace-marketplace')}>
              <Download className="w-4 h-4 mr-2" />
              Browse Marketplace
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="bg-muted/30 rounded-lg p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Why Use Workspace Builder?</h2>
          <div className="grid grid-cols-1 md: grid-cols-3 gap-6 mt-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Boost Productivity</h3>
              <p className="text-sm text-muted-foreground">
                Access all your important information and tools in one personalized view
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold">Stay Focused</h3>
              <p className="text-sm text-muted-foreground">
                Eliminate distractions by showing only what matters for your role
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold">Team Collaboration</h3>
              <p className="text-sm text-muted-foreground">
                Share workspace layouts and best practices across your organization
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceBuilderPage; 