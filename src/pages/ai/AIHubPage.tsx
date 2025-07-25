import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs.tsx';
import { Brain, MessageSquare, Zap, TrendingUp, Users, Settings, Target, Activity, Sparkles, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getAllAgents, getAgentsByType, type Agent } from '@/services/ai/agentRegistry';
import { continuousImprovementService } from '@/services/ai/continuousImprovementService';
import { ProgressiveIntelligence } from '@/components/ai/ProgressiveIntelligence';
import { AIFeatureCard } from '@/components/ai/AIFeatureCard';
import { ModelPerformanceMonitor } from '@/components/ai/ModelPerformanceMonitor';
import { AdvancedAICapabilitiesDemo } from '@/components/ai/AdvancedAICapabilitiesDemo';

interface AIHubStats {
  totalAgents: number;
  activeConversations: number;
  averageResponseTime: number;
  userSatisfaction: number;
  costSavings: number;
  automationRate: number;
}

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'available' | 'demo' | 'development';
  usage: number;
  potential: number;
}

export default function AIHubPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<AIHubStats>({
    totalAgents: 0,
    activeConversations: 0,
    averageResponseTime: 0,
    userSatisfaction: 0,
    costSavings: 0,
    automationRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    loadAIHubData();
  }, []);

  const loadAIHubData = async () => {
    setLoading(true);
    try {
      // Load all agents
      const allAgents = getAllAgents();
      setAgents(allAgents);

      // Load performance metrics
      const dashboard = await continuousImprovementService.getImprovementDashboard('week');
      
      // Calculate stats
      const executiveAgents = getAgentsByType('executive');
      const departmentalAgents = getAgentsByType('departmental');
      const specialistAgents = getAgentsByType('specialist');

      setStats({
        totalAgents: allAgents.length,
        activeConversations: Math.floor(Math.random() * 50) + 10, // Mock data
        averageResponseTime: 2.3,
        userSatisfaction: 4.2,
        costSavings: 12500,
        automationRate: 68
      });
    } catch (error) {
      console.error('Error loading AI Hub data: ', error);
    } finally {
      setLoading(false);
    }
  };

  const aiFeatures: AIFeature[] = [
    {
      id: 'contextual-chat',
      title: 'Contextual Chat',
      description: 'AI that understands your business context and provides personalized responses',
      icon: MessageSquare,
      status: 'available',
      usage: 85,
      potential: 95
    },
    {
      id: 'workflow-automation',
      title: 'Workflow Automation',
      description: 'Automate repetitive tasks and optimize business processes',
      icon: Zap,
      status: 'available',
      usage: 62,
      potential: 88
    },
    {
      id: 'predictive-analytics',
      title: 'Predictive Analytics',
      description: 'Forecast trends and identify opportunities using AI',
      icon: TrendingUp,
      status: 'demo',
      usage: 45,
      potential: 92
    },
    {
      id: 'cross-departmental',
      title: 'Cross-Departmental Intelligence',
      description: 'Connect insights across all business departments',
      icon: Users,
      status: 'available',
      usage: 73,
      potential: 89
    },
    {
      id: 'continuous-improvement',
      title: 'Continuous Improvement',
      description: 'AI that learns and improves from every interaction',
      icon: Brain,
      status: 'available',
      usage: 78,
      potential: 94
    },
    {
      id: 'advanced-capabilities',
      title: 'Advanced Capabilities',
      description: 'Multi-modal AI with voice, image, and document processing',
      icon: Sparkles,
      status: 'development',
      usage: 32,
      potential: 96
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600';
      case 'demo': return 'text-blue-600';
      case 'development': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'demo': return <Clock className="w-4 h-4" />;
      case 'development': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            AI Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Your central command center for all AI capabilities and insights
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          AI Settings
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total AI Agents</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              Executive, Departmental & Specialist
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeConversations}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseTime}s</div>
            <p className="text-xs text-muted-foreground">
              -0.3s from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userSatisfaction}/5</div>
            <p className="text-xs text-muted-foreground">
              +0.2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.costSavings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.automationRate}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* AI Features Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">AI Capabilities</h2>
            <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-3 gap-4">
              {aiFeatures.map((feature) => (
                <AIFeatureCard
                  key={feature.id}
                  feature={feature}
                  onLearnMore={(feature) => // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Learn more: ', feature.id)}
                  onDemo={(feature) => // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Demo: ', feature.id)}
                />
              ))}
            </div>
          </div>

          {/* Progressive Intelligence */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Smart Insights</h2>
            <ProgressiveIntelligence
              pageId="ai-hub"
              position="inline"
              maxInsights={3}
              maxActions={2}
              compact={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">AI Agents</h2>
            <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <Card key={agent.id} className="cursor-pointer hover: shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <Badge variant="outline" className={getStatusColor('available')}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon('available')}
                          {agent.type}
                        </div>
                      </Badge>
                    </div>
                    <CardDescription>{agent.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {agent.specialties && agent.specialties.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Specialties: </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {agent.specialties.slice(0, 3).map((specialty, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                            {agent.specialties.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{agent.specialties.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-4"
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Start Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">AI Performance</h2>
            <ModelPerformanceMonitor />
          </div>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Advanced Capabilities</h2>
            <AdvancedAICapabilitiesDemo />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 