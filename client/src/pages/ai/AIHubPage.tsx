import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Brain, MessageSquare, Zap, TrendingUp, Users, Settings, Target, Activity, Sparkles, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AIService } from '@/services/ai';
import type { Agent } from '@/services/ai';
import { logger } from '@/shared/utils/logger';

// Real service calls
const getAllAgents = async (): Promise<Agent[]> => {
  try {
    const aiService = new AIService();
    const result = await aiService.getAllAgents();
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (error) {
    logger.error('Error fetching all agents', { error });
    return [];
  }
};

const getAgentsByType = async (type: string): Promise<Agent[]> => {
  try {
    const aiService = new AIService();
    const result = await aiService.getAgentsByType(type);
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (error) {
    logger.error('Error fetching agents by type', { error, type });
    return [];
  }
};

interface AIHubStats {
  totalAgents: number;
  activeAgents: number;
  totalConversations: number;
  averageResponseTime: number;
  successRate: number;
  totalTokensUsed: number;
}

export default function AIHubPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AIHubStats>({
    totalAgents: 0,
    activeAgents: 0,
    totalConversations: 0,
    averageResponseTime: 0,
    successRate: 0,
    totalTokensUsed: 0
  });

  useEffect(() => {
    const loadAIData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Load all agents
        const allAgents = await getAllAgents();
        setAgents(allAgents);

        // Calculate stats from agents
        const activeAgents = allAgents.filter(agent => agent.status === 'active');
        setStats({
          totalAgents: allAgents.length,
          activeAgents: activeAgents.length,
          totalConversations: allAgents.reduce((sum, agent) => sum + (agent.conversationCount || 0), 0),
          averageResponseTime: allAgents.length > 0 ? 
            allAgents.reduce((sum, agent) => sum + (agent.averageResponseTime || 0), 0) / allAgents.length : 0,
          successRate: allAgents.length > 0 ? 
            allAgents.reduce((sum, agent) => sum + (agent.successRate || 0), 0) / allAgents.length : 0,
          totalTokensUsed: allAgents.reduce((sum, agent) => sum + (agent.tokensUsed || 0), 0)
        });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load AI data';
        setError(errorMessage);
        logger.error('Error loading AI hub data', { error: err, userId: user.id });
      } finally {
        setLoading(false);
      }
    };

    loadAIData();
  }, [user?.id]);

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'assistant': return <Brain className="w-5 h-5" />;
      case 'chat': return <MessageSquare className="w-5 h-5" />;
      case 'automation': return <Zap className="w-5 h-5" />;
      case 'analytics': return <TrendingUp className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Error Loading AI Hub</h3>
              <p className="text-muted-foreground">{error}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Hub</h1>
          <p className="text-muted-foreground">Manage your AI agents and monitor performance</p>
        </div>
        <Button>
          <Sparkles className="w-4 h-4 mr-2" />
          Create New Agent
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAgents} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              Total interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.successRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average across agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTokensUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agents Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Agents ({agents.length})</TabsTrigger>
          <TabsTrigger value="assistant">Assistants</TabsTrigger>
          <TabsTrigger value="chat">Chat Agents</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getAgentTypeIcon(agent.type)}
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Conversations:</span>
                      <div className="font-medium">{agent.conversationCount || 0}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success Rate:</span>
                      <div className="font-medium">{((agent.successRate || 0) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{(agent.averageResponseTime || 0).toFixed(1)}s avg</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {['assistant', 'chat', 'automation', 'analytics'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents
                .filter(agent => agent.type === type)
                .map((agent) => (
                  <Card key={agent.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getAgentTypeIcon(agent.type)}
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                        </div>
                        <Badge variant="outline" className={getStatusColor(agent.status)}>
                          {agent.status}
                        </Badge>
                      </div>
                      <CardDescription>{agent.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Conversations:</span>
                          <div className="font-medium">{agent.conversationCount || 0}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success Rate:</span>
                          <div className="font-medium">{((agent.successRate || 0) * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{(agent.averageResponseTime || 0).toFixed(1)}s avg</span>
                        </div>
                        <Button size="sm" variant="outline">
                          Configure
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {agents.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No AI Agents Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first AI agent to get started with intelligent automation
              </p>
              <Button>
                <Sparkles className="w-4 h-4 mr-2" />
                Create Your First Agent
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
