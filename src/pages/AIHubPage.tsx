import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Sparkles, 
  Bot, 
  BrainCircuit, 
  LineChart, 
  Workflow, 
  Search, 
  MessageSquare, 
  FileText, 
  ArrowRight, 
  BarChart2,
  Cpu,
  Brain,
  Lightbulb
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Progress } from '../components/ui/Progress';
import { Separator } from '../components/ui/Separator';
import { Avatar } from '../components/ui/Avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';

/**
 * AIHubPage - Central hub for AI functionality
 * 
 * Features:
 * - Access to AI assistants
 * - AI-powered insights
 * - Document analysis
 * - Automation tools
 * - Data visualization
 */
const AIHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('overview');
  
  // Mock AI usage data
  const aiUsage = {
    chat: { used: 250, total: 500, percentage: 50 },
    analysis: { used: 8, total: 20, percentage: 40 },
    generation: { used: 15, total: 30, percentage: 50 },
  };
  
  // Mock recent AI interactions
  const recentInteractions = [
    { 
      type: 'chat', 
      title: 'Sales forecast discussion', 
      preview: 'How will Q3 projections be affected by the new product launch?',
      time: '10 minutes ago',
      path: '/chat/123'
    },
    { 
      type: 'analysis', 
      title: 'Financial report analysis', 
      preview: 'Analysis of Q2 financial performance by department',
      time: '2 hours ago',
      path: '/ai-insights/finance/q2'
    },
    { 
      type: 'generation', 
      title: 'Email campaign', 
      preview: 'Generated email templates for new product announcement',
      time: '1 day ago',
      path: '/ai-automation/emails/456'
    },
  ];
  
  // Mock insights data
  const aiInsights = [
    {
      title: 'Sales Opportunity',
      description: 'Based on current patterns, 3 of your leads are showing high purchase intent',
      category: 'sales',
      confidence: 85
    },
    {
      title: 'Process Bottleneck',
      description: 'Your fulfillment process has a bottleneck in the packaging step causing 12% of delays',
      category: 'operations',
      confidence: 92
    },
    {
      title: 'Cash Flow Alert',
      description: 'Cash flow projection shows potential shortfall in 45 days based on current trends',
      category: 'finance',
      confidence: 78
    },
  ];

  // AI Assistant Types
  const aiAssistants = [
    { 
      id: 'sales-assistant', 
      name: 'Sales AI', 
      description: 'Generate leads, draft proposals, and analyze sales data', 
      icon: <Bot className="h-5 w-5" />,
      status: 'available',
      color: 'bg-success'
    },
    { 
      id: 'operations-assistant', 
      name: 'Operations AI', 
      description: 'Optimize workflows, predict bottlenecks, and suggest improvements', 
      icon: <Cpu className="h-5 w-5" />,
      status: 'available',
      color: 'bg-primary'
    },
    { 
      id: 'finance-assistant', 
      name: 'Finance AI', 
      description: 'Forecast financials, identify cost-saving opportunities, and analyze trends', 
      icon: <Brain className="h-5 w-5" />,
      status: 'beta',
      color: 'bg-secondary'
    },
    { 
      id: 'analytics-assistant', 
      name: 'Analytics AI', 
      description: 'Gain insights from your data with automated analysis and visualizations', 
      icon: <BarChart2 className="h-5 w-5" />,
      status: 'coming-soon',
      color: 'bg-amber-500'
    },
  ];

  // AI Capabilities
  const aiCapabilities = [
    {
      id: 'natural-language',
      name: 'Natural Language Processing',
      description: 'Understand and respond to your business queries in plain English',
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      id: 'predictive-analytics',
      name: 'Predictive Analytics',
      description: 'Forecast trends and predict outcomes based on your historical data',
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      id: 'automation',
      name: 'Smart Automation',
      description: 'Automate repetitive tasks and complex workflows with AI guidance',
      icon: <Zap className="h-5 w-5" />,
    },
    {
      id: 'insights',
      name: 'Intelligent Insights',
      description: 'Discover hidden patterns and actionable insights in your business data',
      icon: <Lightbulb className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* AI Hub Header */}
      <div className="bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 p-6 rounded-xl border border-brand-primary/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center">
              <Zap className="h-6 w-6 mr-2 text-brand-primary" />
              AI Hub
            </h1>
            <p className="text-muted-foreground">
              Your central dashboard for AI-powered features and insights
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button onClick={() => navigate('/chat')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat with AI
            </Button>
          </div>
        </div>
        
        {/* AI Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {Object.entries(aiUsage).map(([key, usage]) => (
            <Card key={key} className="bg-background/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium capitalize">{key} Credits</p>
                  <Badge variant="outline">{usage.used}/{usage.total}</Badge>
                </div>
                <Progress value={usage.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {usage.total - usage.used} credits remaining this month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Tools Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AI Tools</CardTitle>
            <CardDescription>Powerful AI capabilities to boost your productivity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'AI Assistant',
                  description: 'Chat with your AI assistant for instant help and information',
                  icon: <Bot className="h-5 w-5" />,
                  path: '/chat',
                  primary: true
                },
                {
                  title: 'Business Insights',
                  description: 'Get AI-generated insights from your business data',
                  icon: <Sparkles className="h-5 w-5" />,
                  path: '/ai-insights',
                  new: true
                },
                {
                  title: 'Document Analysis',
                  description: 'Extract information and insights from documents',
                  icon: <FileText className="h-5 w-5" />,
                  path: '/ai-document-analysis'
                },
                {
                  title: 'Process Automation',
                  description: 'Create AI-powered workflows and automations',
                  icon: <Workflow className="h-5 w-5" />,
                  path: '/ai-automation',
                  new: true
                },
                {
                  title: 'Data Visualization',
                  description: 'Generate visualizations and reports from your data',
                  icon: <BarChart2 className="h-5 w-5" />,
                  path: '/ai-visualization'
                },
                {
                  title: 'Smart Search',
                  description: 'Semantic search across all your content',
                  icon: <Search className="h-5 w-5" />,
                  path: '/ai-search'
                },
              ].map((tool, i) => (
                <Card 
                  key={i} 
                  className={`overflow-hidden ${tool.primary ? 'border-brand-primary/50' : ''}`}
                >
                  {tool.new && (
                    <div className="h-1 bg-brand-primary"></div>
                  )}
                  <CardContent className="p-4 flex items-start space-x-4">
                    <div className={`h-10 w-10 rounded-full ${
                      tool.primary 
                        ? 'bg-brand-primary text-white' 
                        : 'bg-brand-primary/10 text-brand-primary'
                    } flex items-center justify-center`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{tool.title}</h3>
                        {tool.new && (
                          <Badge className="bg-brand-primary">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto mt-2" 
                        onClick={() => navigate(tool.path)}
                      >
                        Open <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Recent AI Interactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent AI Interactions</CardTitle>
            <CardDescription>Your latest AI activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInteractions.map((interaction, i) => (
                <div 
                  key={i}
                  className="p-3 hover:bg-muted rounded-md cursor-pointer transition-colors"
                  onClick={() => navigate(interaction.path)}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="outline">
                      {interaction.type === 'chat' ? (
                        <MessageSquare className="h-3 w-3 mr-1" />
                      ) : interaction.type === 'analysis' ? (
                        <BrainCircuit className="h-3 w-3 mr-1" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      {interaction.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{interaction.time}</span>
                  </div>
                  <p className="font-medium">{interaction.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{interaction.preview}</p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t border-border p-4 flex justify-center">
            <Button variant="outline" onClick={() => navigate('/ai-history')}>
              View All History
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-brand-primary" />
            AI-Generated Insights
          </CardTitle>
          <CardDescription>Personalized insights based on your business data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
            </TabsList>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiInsights.map((insight, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className={`h-1 ${
                    insight.category === 'sales' ? 'bg-primary' :
                    insight.category === 'finance' ? 'bg-success' :
                    'bg-amber-500'
                  }`}></div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="capitalize">
                        {insight.category}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={insight.confidence > 80 ? 'border-green-500 text-success' : 'border-amber-500 text-amber-500'}
                      >
                        {insight.confidence}% confidence
                      </Badge>
                    </div>
                    <h3 className="font-medium mb-1">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    
                    <div className="flex justify-between items-center mt-4">
                      <Button variant="link" className="p-0 h-auto">
                        Details <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                      <Button variant="outline" size="sm">
                        Take Action
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t border-border p-4 flex justify-center">
          <Button onClick={() => navigate('/ai-insights')}>
            View All Insights
          </Button>
        </CardFooter>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto space-x-2 border-b border-border pb-4">
        {['overview', 'assistants', 'capabilities', 'settings'].map((section) => (
          <Button
            key={section}
            variant={activeSection === section ? 'default' : 'outline'}
            onClick={() => setActiveSection(section)}
            className="capitalize"
          >
            {section}
          </Button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-primary" />
                Welcome to Nexus AI Hub
              </CardTitle>
              <CardDescription>
                Your central dashboard for all AI-powered features and tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Nexus AI Hub integrates artificial intelligence across your business operations,
                helping you make smarter decisions, automate routine tasks, and unlock insights from your data.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="border border-border rounded-md p-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Bot className="h-4 w-4 mr-2" />
                    AI Assistants
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Task-specific AI assistants designed for different departments and workflows
                  </p>
                </div>
                <div className="border border-border rounded-md p-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Cpu className="h-4 w-4 mr-2" />
                    AI Capabilities
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Core AI features that power all aspects of the Nexus platform
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-4">
              <Button onClick={() => setActiveSection('assistants')}>
                Explore AI Assistants
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">4</p>
                  <p className="text-sm text-muted-foreground">AI Assistants</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">12</p>
                  <p className="text-sm text-muted-foreground">AI Features</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">87%</p>
                  <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">3.2k</p>
                  <p className="text-sm text-muted-foreground">AI Interactions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* AI Assistants Section */}
      {activeSection === 'assistants' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">AI Assistants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiAssistants.map((assistant) => (
              <Card key={assistant.id} className="overflow-hidden">
                <div className={`h-1 ${assistant.color}`}></div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg">
                      <div className={`p-2 rounded-md ${assistant.color} bg-opacity-10 mr-3`}>
                        {assistant.icon}
                      </div>
                      {assistant.name}
                    </CardTitle>
                    {assistant.status === 'beta' ? (
                      <Badge className="bg-secondary">Beta</Badge>
                    ) : assistant.status === 'coming-soon' ? (
                      <Badge variant="outline">Coming Soon</Badge>
                    ) : (
                      <Badge className="bg-success">Available</Badge>
                    )}
                  </div>
                  <CardDescription>{assistant.description}</CardDescription>
                </CardHeader>
                <CardFooter className="border-t border-border pt-4">
                  <Button 
                    variant={assistant.status === 'coming-soon' ? 'outline' : 'default'}
                    disabled={assistant.status === 'coming-soon'}
                  >
                    {assistant.status === 'coming-soon' ? 'Notify Me' : 'Open Assistant'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Capabilities Section */}
      {activeSection === 'capabilities' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">AI Capabilities</h2>
          <p className="text-muted-foreground">
            Core AI technologies that power the Nexus platform
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiCapabilities.map((capability) => (
              <Card key={capability.id}>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <div className="p-2 rounded-md bg-primary/10 mr-3 text-primary">
                      {capability.icon}
                    </div>
                    {capability.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {capability.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">AI Settings</h2>
          <Card>
            <CardHeader>
              <CardTitle>AI Usage Preferences</CardTitle>
              <CardDescription>Customize how AI integrates with your workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">AI Suggestions</h3>
                    <p className="text-sm text-muted-foreground">
                      Allow AI to proactively suggest insights and actions
                    </p>
                  </div>
                  <Button variant="outline">Enabled</Button>
                </div>
                <Separator />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Data Usage</h3>
                    <p className="text-sm text-muted-foreground">
                      Allow your data to be used for AI model improvements
                    </p>
                  </div>
                  <Button variant="outline">Disabled</Button>
                </div>
                <Separator />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">AI Model</h3>
                    <p className="text-sm text-muted-foreground">
                      Select which AI model to use for processing
                    </p>
                  </div>
                  <Button variant="outline">Standard</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AIHubPage; 