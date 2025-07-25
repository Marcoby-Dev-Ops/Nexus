import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Separator } from '@/shared/components/ui/Separator';
import { 
  BookOpen, 
  ArrowRight, 
  Brain, 
  Zap, 
  BarChart3, 
  Settings, 
  Users, 
  Shield,
  PlayCircle,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserGuidePage: React.FC = () => {
  const navigate = useNavigate();

  const quickStartGuides = [
    {
      title: 'Getting Started',
      description: 'Complete your profile and connect your first business tool',
      icon: <PlayCircle className="h-5 w-5" />,
      estimatedTime: '15 min',
      route: '/workspace',
      steps: ['Set up profile', 'Connect integration', 'Explore dashboard']
    },
    {
      title: 'AI Assistant',
      description: 'Learn how to chat with Nexus AI for business insights',
      icon: <Brain className="h-5 w-5" />,
      estimatedTime: '10 min',
      route: '/chat',
      steps: ['Start conversation', 'Ask business questions', 'Use slash commands']
    },
    {
      title: 'Business Intelligence',
      description: 'Understand your business health score and analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      estimatedTime: '20 min',
      route: '/analytics',
      steps: ['View health score', 'Explore metrics', 'Set up custom KPIs']
    },
    {
      title: 'Integrations',
      description: 'Connect Microsoft 365, PayPal, and other business tools',
      icon: <Zap className="h-5 w-5" />,
      estimatedTime: '15 min',
      route: '/integrations',
      steps: ['Browse integrations', 'Connect accounts', 'Configure settings']
    }
  ];

  const featuresOverview = [
    {
      category: 'Core Features',
      items: [
        { name: 'AI Assistant', description: 'Chat with intelligent business AI', route: '/chat' },
        { name: 'Business Analytics', description: 'Comprehensive business intelligence', route: '/analytics' },
        { name: 'Workspace', description: 'Personalized productivity dashboard', route: '/workspace' },
        { name: 'Department Modules', description: 'Specialized tools for each department', route: '/sales' }
      ]
    },
    {
      category: 'Integrations',
      items: [
        { name: 'Microsoft 365', description: 'Email, calendar, and document intelligence', route: '/integrations' },
        { name: 'PayPal', description: 'Financial data and transaction insights', route: '/integrations' },
        { name: 'API Learning', description: 'Custom integration development', route: '/integrations/api-learning' },
        { name: 'Storage Connectors', description: 'Microsoft 365 (OneDrive/SharePoint), Google Drive, Dropbox', route: '/integrations' }
      ]
    },
    {
      category: 'Advanced',
      items: [
        { name: 'Automation Recipes', description: 'Pre-built workflow automation', route: '/automation-recipes' },
        { name: 'Data Warehouse', description: 'Advanced business intelligence', route: '/data-warehouse' },
        { name: 'Custom KPIs', description: 'Track metrics specific to your business', route: '/analytics' },
        { name: 'Team Management', description: 'Manage users and permissions', route: '/settings' }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Nexus User Guide</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Your comprehensive guide to mastering Nexus - the AI-first business operating system that democratizes business expertise.
        </p>
        <div className="flex justify-center gap-4">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Brain className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
          <Badge variant="secondary" className="bg-success/10 text-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete OS
          </Badge>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Users className="h-3 w-3 mr-1" />
            Team Ready
          </Badge>
        </div>
      </div>

      {/* Quick Start Guides */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Start Guides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickStartGuides.map((guide, index) => (
            <Card key={index} className="hover: shadow-md transition-shadow cursor-pointer" onClick={() => navigate(guide.route)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {guide.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                      <CardDescription className="text-sm">{guide.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {guide.estimatedTime}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {guide.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      {step}
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-3 w-full justify-between">
                  Start Guide
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Features Overview */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Features Overview</h2>
        <div className="space-y-6">
          {featuresOverview.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{category.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                  {category.items.map((item, itemIndex) => (
                    <div 
                      key={itemIndex}
                      className="flex items-center justify-between p-4 rounded-lg border hover: bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(item.route)}
                    >
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Additional Resources */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Additional Resources</h2>
        <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/help/privacy-policy')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Privacy & Security</h3>
              </div>
              <p className="text-sm text-muted-foreground">Learn how we protect your data and ensure compliance</p>
            </CardContent>
          </Card>
          
          <Card className="hover: shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/help/about')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-medium">About Nexus</h3>
              </div>
              <p className="text-sm text-muted-foreground">Discover our mission to democratize business expertise</p>
            </CardContent>
          </Card>
          
          <Card className="hover: shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/settings')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-2">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Settings</h3>
              </div>
              <p className="text-sm text-muted-foreground">Customize your Nexus experience and preferences</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 