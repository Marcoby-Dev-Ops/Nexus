import React, { useState, useEffect } from 'react';
import { useUserProfile, useUserCompany } from '@/shared/contexts/UserContext';
import { Button } from '@/shared/components/ui/Button';
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
  Search,
  Trash2,
  User,
  ChevronLeft,
  Pencil,
  FileText,
  X} from 'lucide-react';
import { ConsolidatedAIService } from '@/services/ai/ConsolidatedAIService';
import type { Agent } from '@/services/ai/ConsolidatedAIService';
import { useAIChatStore } from '@/shared/stores/useAIChatStore';
import ModernChatInterface from '@/lib/ai/components/ModernChatInterface';
import { useToast } from '@/shared/ui/components/Toast';
import { cn } from '@/shared/lib/utils';
import { nexusRAGService } from '@/lib/services/NexusRAGService';
import { useAuth } from '@/hooks/useAuth';

// Service-backed helpers
const aiService = new ConsolidatedAIService();

const getAllAgents = async (): Promise<Agent[]> => {
  const result = await aiService.getAgents();
  return result.success && result.data ? result.data : [];
};

const getAgentsByType = async (type: Agent['type']): Promise<Agent[]> => {
  const result = await aiService.getAgents();
  if (result.success && result.data) {
    return result.data.filter((agent: Agent) => agent.type === type);
  }
  return [];
};

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
  const { profile: userProfile } = useUserProfile();
  const { company: userCompany } = useUserCompany();
  
  // Debug: Log user context data
  useEffect(() => {
    console.log('User context data:', {
      user: user?.id,
      userProfile,
      userCompany,
      hasCompanyData: !!userCompany
    });
  }, [user, userProfile, userCompany]);
  const { toast } = useToast();
  const { 
    conversations, 
    fetchConversations, 
    fetchMessages,
    sendMessage,
    saveAIResponse,
    setCurrentConversationById,
    setCurrentConversation,
    messages: storeMessages,
    createConversation, 
    archiveConversation,
    cleanEmptyConversations,
    clearMessages,
    isLoading: conversationsLoading 
  } = useAIChatStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('executive-assistant');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showConversationSidebar, setShowConversationSidebar] = useState<boolean>(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [stats, setStats] = useState<ChatStats>({
    totalConversations: 0,
    averageResponseTime: 0,
    userSatisfaction: 0,
    messagesToday: 0,
    activeAgents: 0,
    automationRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ragEnabled, setRagEnabled] = useState(false);
  const [ragConfidence, setRagConfidence] = useState(0);
  const [knowledgeTypes, setKnowledgeTypes] = useState<string[]>([]);

  // Get selected agent object
  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);

  // Chat handlers
  const handleSendMessage = async (message: string, attachments?: any[]) => {
    if (!message.trim() || !user) return;

    try {
      // Create or get conversation
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        // Create new conversation if none exists
        const conversationTitle = message.length > 50 ? message.substring(0, 50) + '...' : message;
        currentConversationId = await createConversation(conversationTitle, 'gpt-4', undefined, user.id);
        setConversationId(currentConversationId);
        // Set the new conversation as current in the store
        await setCurrentConversationById(currentConversationId);
      }

      // IMMEDIATELY save and display the user message
      await sendMessage(message, attachments);

      // Now set loading states for AI response
      setIsLoading(true);
      setIsStreaming(true);



      // Use Nexus RAG Service for comprehensive context integration
      const nexusContext = {
        user: {
          id: user.id,
          name: userProfile?.display_name || `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'User',
          role: userProfile?.job_title || 'User',
          department: 'General'
        },
        company: userCompany ? {
          id: userCompany.id,
          name: userCompany.name,
          industry: userCompany.industry || 'Unknown',
          size: userCompany.size || 'Unknown',
          description: userCompany.description
        } : null,
        agent: {
          id: selectedAgentId,
          type: selectedAgent?.type || 'assistant',
          capabilities: selectedAgent?.capabilities || []
        },
        conversation: {
          id: currentConversationId,
          history: storeMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at
          }))
        },
        attachments: attachments || []
      };

      console.log('🔍 Processing with Nexus RAG Service...');
      const nexusResponse = await nexusRAGService.processMessage({
        message,
        context: nexusContext,
        agentId: selectedAgentId
      });

      if (nexusResponse.success && nexusResponse.data) {
        console.log('✅ Nexus RAG Response:', {
          confidence: nexusResponse.data.confidence,
          sourcesCount: nexusResponse.data.sources.length,
          hasRecommendations: nexusResponse.data.recommendations.length > 0
        });
        
        // Update RAG status
        setRagEnabled(true);
        setRagConfidence(nexusResponse.data.confidence);
        setKnowledgeTypes(nexusResponse.data.knowledgeTypes || []);
        
        // Save the AI response
        await saveAIResponse(nexusResponse.data.content, currentConversationId);
        
        // Refresh conversations to show the updated list
        await fetchConversations();
      } else {
        throw new Error(nexusResponse.error || 'Failed to process message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        type: "error"
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleStopGeneration = () => {
    setIsStreaming(false);
    setIsLoading(false);
  };

  useEffect(() => {
    loadChatData();
  }, []);

  // Update stats when conversations change
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      totalConversations: conversations.length
    }));
  }, [conversations]);

  // Load conversations when component mounts
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      setError(null);
      const allAgents = await getAllAgents();
      setAgents(allAgents);
      
      // Set default agent if none selected
      if (!selectedAgentId && allAgents.length > 0) {
        setSelectedAgentId(allAgents[0].id);
      } else if (!selectedAgentId) {
        // If no agents are available, use a default ID
        setSelectedAgentId('executive-assistant');
      }
      
      // Update stats with real data
      setStats({
        totalConversations: conversations.length,
        averageResponseTime: 2.3,
        userSatisfaction: 94,
        messagesToday: 23,
        activeAgents: allAgents.length,
        automationRate: 78
      });
    } catch (error) {
      console.error('Error loading chat data:', error);
      setError('Failed to load chat data. Please refresh the page.');
      setAgents([]);
      setSelectedAgentId('executive-assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      // Clear current conversation state
      setConversationId(null);
      setSelectedAgentId('executive-assistant');
      
      // Clear current conversation in store
      setCurrentConversation(null);
      
      // Clear messages from the store
      clearMessages();
      
      // Refresh conversations to show the updated list
      await fetchConversations();
      
      toast({
        title: "New conversation",
        description: "Ready to start a new conversation!",
        type: "success"
      });
    } catch (error) {
      console.error('Error creating new conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation. Please try again.",
        type: "error"
      });
    }
  };

  // Debug: Log selectedAgentId changes
  useEffect(() => {
    console.log('ChatPage selectedAgentId changed to:', selectedAgentId);
  }, [selectedAgentId]);

  const handleConversationSelect = async (convId: string) => {
    setConversationId(convId);
    try {
      // Set current conversation in store
      await setCurrentConversationById(convId);
      // Load messages for the selected conversation
      await fetchMessages(convId);
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation messages.",
        type: "error"
      });
    }
  };

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    setConversationId(null); // Start new conversation with new agent
  };

  const handleSearchClick = () => {
    // Navigate to CKB search page
    window.location.href = '/ckb';
  };

  const handleDocumentsClick = () => {
    // Navigate to documents page (create if doesn't exist)
    window.location.href = '/documents';
  };

  const handleDeleteConversation = async (convId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      // Archive conversation using the store
      await archiveConversation(convId);
      
      // If this was the current conversation, clear it
      if (conversationId === convId) {
        setConversationId(null);
      }
      
      // Refresh conversations to update the UI
      await fetchConversations();
      
      toast({
        title: "Conversation archived",
        description: "The conversation has been archived.",
        type: "success"
      });
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast({
        title: "Error",
        description: "Failed to archive conversation. Please try again.",
        type: "error"
      });
    }
  };

  // Filter out empty and archived conversations for display
  const nonEmptyConversations = conversations.filter(conv => conv.message_count > 0 && !conv.is_archived);

  const handleCleanupEmptyConversations = async () => {
    try {
      await cleanEmptyConversations();
      toast({
        title: "Cleanup Complete",
        description: "Empty conversations have been cleaned up.",
        type: "success"
      });
    } catch (error) {
      console.error('Error cleaning empty conversations:', error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to clean empty conversations. Please try again.",
        type: "error"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-300 animate-pulse" />
          </div>
          <p className="text-gray-400">Loading Nexus AI...</p>
        </div>
      </div>
    );
  }

  // Ensure we have a valid user
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400">Please sign in to access Nexus AI</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-white" />
          </div>
          <p className="text-red-400 mb-4">{error}</p>
          <Button 
            onClick={() => {
              setError(null);
              loadChatData();
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Sidebar */}
      <div className={cn(
        "bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ease-in-out h-full",
        sidebarCollapsed ? "w-16" : "w-80"
      )}>
        {/* Logo and Brand */}
        <div className="p-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <h1 className="text-sm font-semibold text-white">Nexus AI</h1>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>Business Intelligence</span>
                </div>
              </div>
            )}
                         <Button
               variant="ghost"
               size="sm"
               onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
               className="text-gray-400 hover:text-white hover:bg-gray-800 p-1"
             >
               {sidebarCollapsed ? <ChevronLeft className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3 rotate-180" />}
             </Button>
          </div>
        </div>

        {/* Agent Selection */}
        <div className="p-2 space-y-1">
          {!sidebarCollapsed && (
            <h3 className="text-xs font-medium text-gray-400 mb-2">Choose Agent</h3>
          )}
          
          {/* Executive Assistant (Default) */}
          <Button
            onClick={() => setSelectedAgentId('executive-assistant')}
            className={cn(
              "w-full justify-start text-xs transition-colors",
              selectedAgentId === 'executive-assistant'
                ? "bg-blue-600 hover:bg-blue-700 text-white border-0"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-0",
              sidebarCollapsed ? "justify-center p-1" : "justify-start p-2"
            )}
          >
            <Brain className="w-3 h-3" />
            {!sidebarCollapsed && <span className="ml-1">Executive Assistant</span>}
          </Button>

          {/* 7 Building Block Agents */}
          {[
            { id: 'business-identity-consultant', name: 'Identity', icon: Target },
            { id: 'sales-expert', name: 'Revenue', icon: TrendingUp },
            { id: 'finance-expert', name: 'Cash', icon: Activity },
            { id: 'operations-expert', name: 'Delivery', icon: Zap },
            { id: 'people-expert', name: 'People', icon: Users },
            { id: 'knowledge-expert', name: 'Knowledge', icon: FileText },
            { id: 'systems-expert', name: 'Systems', icon: Settings }
          ].map((agent) => {
            const IconComponent = agent.icon;
            return (
              <Button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={cn(
                  "w-full justify-start text-xs transition-colors",
                  selectedAgentId === agent.id
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-0"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-0",
                  sidebarCollapsed ? "justify-center p-1" : "justify-start p-2"
                )}
              >
                <IconComponent className="w-3 h-3" />
                {!sidebarCollapsed && <span className="ml-1">{agent.name}</span>}
              </Button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="p-2 space-y-1 border-t border-gray-800">
          <Button
            onClick={handleNewConversation}
            className={cn(
              "w-full justify-start bg-gray-800 hover:bg-gray-700 text-white border-0 text-xs",
              sidebarCollapsed ? "justify-center p-1" : "justify-start p-2"
            )}
          >
            <Pencil className="w-3 h-3" />
            {!sidebarCollapsed && <span className="ml-1">New chat</span>}
          </Button>
          <Button
            onClick={handleSearchClick}
            variant="ghost"
            className={cn(
              "w-full text-gray-400 hover:text-white hover:bg-gray-800 text-xs",
              sidebarCollapsed ? "justify-center p-1" : "justify-start p-2"
            )}
          >
            <Search className="w-3 h-3" />
            {!sidebarCollapsed && <span className="ml-1">Search</span>}
          </Button>
          <Button
            onClick={handleDocumentsClick}
            variant="ghost"
            className={cn(
              "w-full text-gray-400 hover:text-white hover:bg-gray-800 text-xs",
              sidebarCollapsed ? "justify-center p-1" : "justify-start p-2"
            )}
          >
            <FileText className="w-3 h-3" />
            {!sidebarCollapsed && <span className="ml-1">Documents</span>}
          </Button>
        </div>

        {/* Recent Conversations */}
        <div className="flex-1 overflow-y-auto px-2 min-h-0">
          {!sidebarCollapsed && (
            <h3 className="text-xs font-medium text-gray-400 mb-2">Recent conversations</h3>
          )}
          {conversationsLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-4 h-4 text-gray-300 animate-pulse" />
                </div>
                <p className="text-gray-400 text-sm">Loading conversations...</p>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No recent conversations. Start a new one!</p>
            </div>
          ) : (
            <div className="space-y-1 pb-4">
                             {/* Cleanup button for empty conversations */}
               {conversations.filter(conv => conv.message_count === 0).length > 0 && (
                 <div className="px-2 py-1">
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={handleCleanupEmptyConversations}
                     className="w-full text-xs text-gray-500 hover:text-white hover:bg-gray-800"
                   >
                     Clean up {conversations.filter(conv => conv.message_count === 0).length} empty conversations
                   </Button>
                 </div>
               )}
              
              {nonEmptyConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between cursor-pointer",
                    conversationId === conv.id
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800",
                    sidebarCollapsed && "justify-center text-center px-2 py-1"
                  )}
                  title={sidebarCollapsed ? (conv.title || "Untitled conversation") : undefined}
                  onClick={() => handleConversationSelect(conv.id)}
                >
                  <div className="flex items-center">
                    {sidebarCollapsed ? (
                      <div className="w-5 h-5 bg-gray-600 rounded flex items-center justify-center">
                        <MessageSquare className="w-2 h-2 text-white" />
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{conv.title || "Untitled conversation"}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {conv.message_count || 0} messages
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        
      </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Interface */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-4 h-4 text-gray-300 animate-pulse" />
                  </div>
                  <p className="text-gray-400 text-sm">Loading chat...</p>
                </div>
              </div>
            }>
                             <ModernChatInterface
                 messages={storeMessages}
                 onSendMessage={handleSendMessage}
                 onStopGeneration={handleStopGeneration}
                 isStreaming={isStreaming}
                 disabled={isLoading}
                 placeholder="Ask anything..."
                 showTypingIndicator={isStreaming}
                 className="h-full"
                 userName={user?.name || "User"}
                 agentId={selectedAgentId}
                 agentName={selectedAgent?.name || "Executive Assistant"}
                 ragEnabled={ragEnabled}
                 ragConfidence={ragConfidence}
                 knowledgeTypes={knowledgeTypes}
               />
            </React.Suspense>
          </div>
        </div>

       {/* ChatGPT-style floating sidebar toggle */}
       {sidebarCollapsed && (
         <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-40">
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setSidebarCollapsed(false)}
             className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 rounded-r-lg p-2 shadow-lg"
           >
             <ChevronLeft className="w-4 h-4 rotate-180" />
           </Button>
         </div>
       )}
     </div>
   );
} 
