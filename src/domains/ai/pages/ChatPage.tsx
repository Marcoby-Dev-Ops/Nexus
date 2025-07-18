import React, { useState, useEffect } from 'react';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  MessageSquare, 
  Brain, 
  Users, 
  Settings, 
  Sparkles,
  Zap,
  TrendingUp,
  Target,
  Activity
} from 'lucide-react';
import { getAllAgents, getAgentsByType, type Agent } from '@/domains/ai/lib/agentRegistry';
import { StreamingComposer } from '@/domains/ai/components/StreamingComposer';
import AgentPicker from '@/domains/ai/components/AgentPicker';
import { DomainAgentIndicator } from '@/domains/ai/components/DomainAgentIndicator';
import { ContextChips } from '@/domains/ai/features/components/ContextChips';
import { QuickChatTrigger } from '@/domains/ai/features/components/QuickChatTrigger';

interface ChatStats {
  totalConversations: number;
  averageResponseTime: number;
  userSatisfaction: number;
  messagesToday: number;
  activeAgents: number;
  automationRate: number;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [stats, setStats] = useState<ChatStats>({
    totalConversations: 0,
    averageResponseTime: 0,
    userSatisfaction: 0,
    messagesToday: 0,
    activeAgents: 0,
    automationRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChatData();
  }, []);

  const loadChatData = async () => {
    setLoading(true);
    try {
      // Load all agents
      const allAgents = getAllAgents();
      setAgents(allAgents);

      // Set default agent (Executive Assistant)
      const executiveAgents = getAgentsByType('executive');
      if (executiveAgents.length > 0) {
        setSelectedAgentId(executiveAgents[0].id);
      }

      // Mock stats
      setStats({
        totalConversations: 156,
        averageResponseTime: 2.1,
        userSatisfaction: 4.3,
        messagesToday: 23,
        activeAgents: 8,
        automationRate: 72
      });
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    // Reset conversation when changing agents
    setConversationId(null);
  };

  const handleConversationIdChange = (id: string) => {
    setConversationId(id);
  };

  const getSelectedAgent = (): Agent | null => {
    return agents.find(agent => agent.id === selectedAgentId) || null;
  };



  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
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
            <MessageSquare className="w-8 h-8 text-primary" />
            AI Chat
          </h1>
          <p className="text-muted-foreground mt-2">
            Intelligent conversations with your business AI assistants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <QuickChatTrigger />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last week
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
              -0.2s from last week
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
              +0.1 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messagesToday}</div>
            <p className="text-xs text-muted-foreground">
              +3 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
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
              +3% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agent Selection Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Agents
              </CardTitle>
              <CardDescription>
                Choose your AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AgentPicker
                value={selectedAgentId}
                onChange={handleAgentChange}
                className="w-full"
              />
              
              {getSelectedAgent() && (
                <div className="space-y-3">
                  <DomainAgentIndicator
                    agentId={selectedAgentId}
                    showDetails={true}
                  />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Ask for insights
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Analyze data
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Zap className="w-4 h-4 mr-2" />
                        Automate task
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {getSelectedAgent()?.name || 'Select an Agent'}
                  </CardTitle>
                  <CardDescription>
                    {getSelectedAgent()?.description || 'Choose an AI agent to start chatting'}
                  </CardDescription>
                </div>
                {conversationId && (
                  <Badge variant="outline">
                    Conversation #{conversationId.slice(-8)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="h-full">
              {selectedAgentId ? (
                <div className="h-full">
                  <StreamingComposer
                    conversationId={conversationId}
                    onConversationId={handleConversationIdChange}
                    agentId={selectedAgentId}
                    context={{
                      userId: user?.id || '',
                      userRole: user?.role || '',
                      department: user?.department || '',
                      companyId: user?.company_id || ''
                    }}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Brain className="w-16 h-16 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">Select an AI Agent</h3>
                      <p className="text-muted-foreground">
                        Choose an AI assistant from the sidebar to start your conversation
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Context Information */}
      {selectedAgentId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Context & Insights
            </CardTitle>
            <CardDescription>
              AI-powered context and business insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContextChips
              sources={[
                {
                  id: 'user-profile',
                  type: 'user_profile',
                  title: 'User Profile',
                  description: 'Your role, preferences, and activity patterns',
                  confidence: 0.95,
                  metadata: {
                    lastUpdated: new Date().toISOString(),
                    source: 'profile_system'
                  }
                },
                {
                  id: 'business-context',
                  type: 'business_data',
                  title: 'Business Context',
                  description: 'Company data, department metrics, and current priorities',
                  confidence: 0.88,
                  metadata: {
                    lastUpdated: new Date().toISOString(),
                    source: 'business_intelligence'
                  }
                },
                {
                  id: 'conversation-history',
                  type: 'conversation_history',
                  title: 'Conversation History',
                  description: 'Previous interactions and learned preferences',
                  confidence: 0.92,
                  metadata: {
                    lastUpdated: new Date().toISOString(),
                    source: 'chat_system'
                  }
                }
              ]}
              compact={true}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
} 