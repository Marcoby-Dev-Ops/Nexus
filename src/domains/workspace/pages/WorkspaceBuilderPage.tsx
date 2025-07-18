import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  Layout, 
  Palette, 
  Zap, 
  Users, 
  Sparkles, 
  ArrowRight, 
  CheckCircle,
  Star,
  Download,
  Share,
  Grid,
  Plus,
  Eye,
  Settings,
  Target,
  Lightbulb,
  Briefcase,
  Code,
  PieChart,
  MessageSquare,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

const WorkspaceBuilderPage: React.FC = () => {
  const features = [
    {
      icon: <Layout className="w-6 h-6 text-primary" />,
      title: 'Drag & Drop Builder',
      description: 'Intuitive interface to arrange components exactly how you want them'
    },
    {
      icon: <Palette className="w-6 h-6 text-secondary" />,
      title: 'Rich Component Library',
      description: '15+ pre-built components for productivity, analytics, and business intelligence'
    },
    {
      icon: <Users className="w-6 h-6 text-success" />,
      title: 'Role-Based Templates',
      description: 'Pre-designed workspaces for executives, sales, marketing, developers, and more'
    },
    {
      icon: <Share className="w-6 h-6 text-orange-500" />,
      title: 'Share & Import',
      description: 'Share your custom workspaces with team members or import from the marketplace'
    },
    {
      icon: <Zap className="w-6 h-6 text-warning" />,
      title: 'Real-time Updates',
      description: 'All components update in real-time with live data from your business systems'
    },
    {
      icon: <Settings className="w-6 h-6 text-muted-foreground" />,
      title: 'Full Customization',
      description: 'Configure each component with custom settings, filters, and display options'
    }
  ];

  const templates = [
    {
      name: 'Executive Dashboard',
      description: 'High-level business metrics and strategic insights',
      category: 'Business',
      icon: <Briefcase className="w-5 h-5" />,
      components: 7,
      downloads: 1247,
      rating: 4.8
    },
    {
      name: 'Sales Workspace',
      description: 'CRM integration, pipeline management, and sales performance',
      category: 'Sales',
      icon: <Target className="w-5 h-5" />,
      components: 7,
      downloads: 892,
      rating: 4.6
    },
    {
      name: 'Marketing Hub',
      description: 'Campaign management, analytics, and content creation',
      category: 'Marketing',
      icon: <Sparkles className="w-5 h-5" />,
      components: 6,
      downloads: 634,
      rating: 4.7
    },
    {
      name: 'Developer Console',
      description: 'Development tools, system monitoring, and technical metrics',
      category: 'Development',
      icon: <Code className="w-5 h-5" />,
      components: 6,
      downloads: 445,
      rating: 4.9
    }
  ];

  const availableComponents = [
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
          <Button asChild size="lg">
            <Link to="/workspace-builder">
              <Layout className="w-5 h-5 mr-2" />
              Start Building
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/workspace-marketplace">
              <Eye className="w-5 h-5 mr-2" />
              Browse Templates
            </Link>
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
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
          <Button variant="outline" asChild>
            <Link to="/workspace-marketplace">
              View All Templates
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
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
                <Button size="sm" className="w-full" asChild>
                  <Link to="/workspace-marketplace">
                    <Download className="w-4 h-4 mr-2" />
                    Use Template
                  </Link>
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

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {availableComponents.map((component, index) => (
            <Card key={index} className="p-4 text-center hover:shadow-md transition-shadow">
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
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <Button asChild>
              <Link to="/workspace-builder">
                <Layout className="w-4 h-4 mr-2" />
                Create Custom Workspace
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/workspace-marketplace">
                <Download className="w-4 h-4 mr-2" />
                Browse Marketplace
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="bg-muted/30 rounded-lg p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Why Use Workspace Builder?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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