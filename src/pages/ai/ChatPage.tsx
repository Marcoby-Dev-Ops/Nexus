import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
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
  Activity,
  Plus,
  Upload,
  Mic,
  Search,
  MoreVertical,
  Trash2,
  Edit3,
  Copy,
  Download
} from 'lucide-react';
import { aiService } from '@/services/ai/AIService';
import type { Agent } from '@/services/ai/AIService';
import { postgres } from "@/lib/postgres";

// Service-backed helpers
const getAllAgents = async (): Promise<Agent[]> => {
  return await aiService.getAllAgents();
};

const getAgentsByType = async (type: Agent['type']): Promise<Agent[]> => {
  const agent = await aiService.getAgentByType(type);
  return agent ? [agent] : [];
};

import { StreamingComposer } from '@/components/ai/StreamingComposer';
import { AgentPicker } from '@/components/ai/agents';
import { DomainAgentIndicator } from '@/components/ai/agents';
import { ContextChips } from '@/components/ai/chat';
import { QuickChatTrigger } from '@/components/ai/chat';
import { AIOnboardingTrigger } from '@/components/ai/AIOnboardingTrigger';
import { LoadingStates } from '@/shared/components/patterns/LoadingStates';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { useToast } from '@/shared/ui/components/Toast';

interface ChatStats {
  totalConversations: number;
  averageResponseTime: number;
  userSatisfaction: number;
  messagesToday: number;
  activeAgents: number;
  automationRate: number;
}

interface ConversationRow { 
  id: string; 
  title: string | null; 
  updatedat: string;
  agent_id?: string;
  message_count?: number;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showConversationSidebar, setShowConversationSidebar] = useState<boolean>(true);
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

  // Load conversations when component mounts
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data, error } = await (postgres as any)
        .rpc('conversations_with_messages', { limitparam: 50 });
      if (!error && data) {
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadChatData = async () => {
    setLoading(true);
    try {
      // Load all agents - make this async since getAllAgents returns a Promise
      const allAgents = await getAllAgents();
      setAgents(allAgents);

      // Set default agent (Executive Assistant) - make this async too
      const executiveAgents = await getAgentsByType('executive');
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
      console.error('Error loading chat data: ', error);
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
    // Refresh conversations list
    loadConversations();
  };

  const handleNewChat = () => {
    setConversationId(null);
  };

  const handleConversationSelect = (conversationId: string) => {
    setConversationId(conversationId);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      // Delete conversation from database
      const { error } = await (postgres as any)
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);
      
      if (!error) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (conversationId === conversationId) {
          setConversationId(null);
        }
        toast({
          title: "Conversation deleted",
          description: "The conversation has been permanently deleted.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSelectedAgent = (): Agent | null => {
    return agents.find(agent => agent.id === selectedAgentId) || null;
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingStates.Skeleton />
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-96 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Conversation Sidebar */}
      {showConversationSidebar && (
        <aside className="hidden lg:flex lg:flex-col w-80 border-r border-border overflow-y-auto">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Conversations</h2>
              <Button size="sm" onClick={handleNewChat} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative px-4 py-3 hover:bg-accent/40 cursor-pointer ${
                    conversationId === conversation.id ? 'bg-accent/60' : ''
                  }`}
                  onClick={() => handleConversationSelect(conversation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conversation.title || 'Untitled Conversation'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.updatedat).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conversation.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </nav>
        </aside>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConversationSidebar(!showConversationSidebar)}
                className="lg:hidden"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  AI Chat
                </h1>
                <p className="text-sm text-muted-foreground">
                  {getSelectedAgent()?.name || 'Select an Agent'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AIOnboardingTrigger 
                featureId="chat-assistant"
                variant="button"
                onStart={(moduleId) => {
                  console.log('Started chat assistant module:', moduleId);
                }}
                onComplete={(moduleId) => {
                  console.log('Completed chat assistant module:', moduleId);
                }}
              />
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <QuickChatTrigger />
            </div>
          </div>
        </div>

        {/* Stats Overview - Collapsible */}
        <div className="border-b border-border p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalConversations}</div>
              <div className="text-xs text-muted-foreground">Conversations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.averageResponseTime}s</div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.userSatisfaction}/5</div>
              <div className="text-xs text-muted-foreground">Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.messagesToday}</div>
              <div className="text-xs text-muted-foreground">Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.activeAgents}</div>
              <div className="text-xs text-muted-foreground">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.automationRate}%</div>
              <div className="text-xs text-muted-foreground">Automation</div>
            </div>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 flex overflow-hidden">
          {/* Agent Selection Sidebar */}
          <div className="w-64 border-r border-border p-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Agents
                </h3>
                <AgentPicker
                  value={selectedAgentId}
                  onChange={handleAgentChange}
                  className="w-full"
                />
              </div>
              
              {getSelectedAgent() && (
                <div className="space-y-4">
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
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-hidden">
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
          </div>
        </div>

        {/* Context Information */}
        {selectedAgentId && (
          <div className="border-t border-border p-4">
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
          </div>
        )}
      </main>
    </div>
  );
} 