import React, { useState } from 'react';
import { ApiDocIntegrationSetup } from '@/domains/integrations/components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  Zap, 
  Brain, 
  BookOpen, 
  Code, 
  Globe, 
  Sparkles,
  Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuickChatTrigger } from '@/domains/ai/chat';
// import { MVPScopeIndicator } from '@/shared/components/chat/MVPScopeIndicator';

/**
 * API Learning System Page
 * Pillar: 1,2 - AI-powered API learning and integration generation
 */
export default function ApiLearningPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: 'AI-Powered Analysis',
      description: 'Upload OpenAPI/Swagger docs and get instant pattern recognition and integration suggestions',
      status: 'ready'
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: 'Auto Code Generation',
      description: 'Generate TypeScript connectors, authentication flows, and data models automatically',
      status: 'ready'
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Universal API Support',
      description: 'Works with any REST API - CRM, payment, analytics, marketing automation, and more',
      status: 'ready'
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'Smart Optimization',
      description: 'Learns from usage patterns to suggest performance improvements and best practices',
      status: 'coming-soon'
    }
  ];

  const supportedApis = [
    { name: 'HubSpot CRM', logo: '🎯', category: 'CRM' },
    { name: 'Stripe Payments', logo: '💳', category: 'Payments' },
    { name: 'Slack Workspace', logo: '💬', category: 'Communication' },
    { name: 'Google Analytics', logo: '📊', category: 'Analytics' },
    { name: 'Mailchimp Marketing', logo: '📧', category: 'Marketing' },
    { name: 'Shopify E-commerce', logo: '🛒', category: 'E-commerce' },
    { name: 'Salesforce CRM', logo: '☁️', category: 'CRM' },
    { name: 'Zoom Meetings', logo: '📹', category: 'Communication' }
  ];

  const handleChatWithSpecialist = () => {
    // Navigate to chat with API Integration Specialist pre-selected
    navigate('/chat?agent=api-integration&context=api-learning');
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-4">
          <Zap className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">API Learning System</h1>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
            MVP Feature
          </Badge>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Connect any business tool to your Nexus workspace with AI-powered analysis, 
          pattern recognition, and automatic integration generation. Your data becomes part of your organizational intelligence.
        </p>
        
        {/* Quick Actions */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <Button onClick={handleChatWithSpecialist} className="flex items-center space-x-2">
            <Bot className="h-4 w-4" />
            <span>Chat with API Specialist</span>
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('builder')}>
            <Zap className="h-4 w-4 mr-2" />
            Start Building
          </Button>
        </div>
      </div>

      {/* MVP Scope Indicator - Commented out until component is available */}
      {/* <MVPScopeIndicator agentType="API Integration Specialist" /> */}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="supported">Supported APIs</TabsTrigger>
          <TabsTrigger value="builder">Integration Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>How It Works</span>
              </CardTitle>
              <CardDescription>
                Four simple steps to connect any business tool to your Nexus workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: 1, title: 'Upload API Docs', description: 'Upload your business tool\'s API documentation or provide URLs' },
                  { step: 2, title: 'AI Analysis', description: 'Our AI analyzes your tool\'s data structure and capabilities' },
                  { step: 3, title: 'Pattern Recognition', description: 'Identifies how to best integrate your tool with Nexus' },
                  { step: 4, title: 'Nexus Integration', description: 'Generates connectors that work seamlessly with your workspace' }
                ].map((item) => (
                  <div key={item.step} className="text-center space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-primary font-bold">{item.step}</span>
                    </div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⚡ Speed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Connect business tools to Nexus in minutes instead of days. Your data flows directly into your organizational intelligence.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🎯 Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generated integrations follow security best practices and work reliably with your Nexus AI agents and analytics.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔄 Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  System learns your business patterns to suggest workflow optimizations and enhance your organizational intelligence.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                    <Badge variant={feature.status === 'ready' ? 'default' : 'secondary'}>
                      {feature.status === 'ready' ? 'Ready' : 'Coming Soon'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="supported" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supported API Types</CardTitle>
              <CardDescription>
                Our AI learning system works with any REST API that provides OpenAPI/Swagger documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {supportedApis.map((api, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                    <span className="text-2xl">{api.logo}</span>
                    <div>
                      <p className="font-medium text-sm">{api.name}</p>
                      <p className="text-xs text-muted-foreground">{api.category}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Universal Support:</strong> Works with any API that provides OpenAPI 3.0, Swagger 2.0, 
                  or similar machine-readable documentation. Custom APIs and proprietary systems supported with manual documentation.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <ApiDocIntegrationSetup 
            onIntegrationCreated={(_integration: any) => {
              // console.log('Integration created:', integration);
              // Could navigate to integration management or show success
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Chat Integration */}
      <QuickChatTrigger />
    </div>
  );
} 