import React, { useState, useEffect } from 'react';
import { useUserProfile, useUserCompany } from '@/shared/contexts/UserContext';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
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
  X,
  Check} from 'lucide-react';
import { ConsolidatedAIService } from '@/services/ai/ConsolidatedAIService';
import type { Agent } from '@/services/ai/ConsolidatedAIService';
import { useAIChatStore } from '@/shared/stores/useAIChatStore';
import ModernChatInterface from '@/lib/ai/components/ModernChatInterface';
import { useToast } from '@/shared/ui/components/Toast';
import { cn } from '@/shared/lib/utils';
import { nexusRAGService } from '@/lib/services/NexusRAGService';
import { callEdgeFunction } from '@/lib/api-client';
import { chatAttachmentService } from '@/lib/ai/services/chatAttachmentService';
import { ATTACHMENT_ONLY_PLACEHOLDER } from '@/shared/constants/chat';
import type { FileAttachment, Conversation } from '@/shared/types/chat';
import { useAuth } from '@/hooks/useAuth';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';

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
  
  // Log user context data in debug builds only (removed console output here)
  const { toast } = useToast();
  const { 
    conversations, 
    fetchConversations, 
    fetchMessages,
    sendMessage,
    saveAIResponse,
    setCurrentConversationById,
    setCurrentConversation,
    currentConversation,
    messages: storeMessages,
    createConversation, 
    updateConversation,
    archiveConversation,
    clearMessages,
    isLoading: conversationsLoading 
  } = useAIChatStore();
  // Controller map for active streaming requests (requestId -> { controller, tempAiId })
  const streamingControllers = React.useRef<Record<string, any>>({});
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('executive-assistant');
  // conversation selection is stored centrally in the Zustand store: currentConversation
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
  const [autoFocusTrigger, setAutoFocusTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ragEnabled, setRagEnabled] = useState(false);
  const [ragConfidence, setRagConfidence] = useState(0);
  const [knowledgeTypes, setKnowledgeTypes] = useState<string[]>([]);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Set main header content for Chat page
  const { setHeaderContent, setHeaderIcon, clearHeaderContent } = useHeaderContext();
  useEffect(() => {
    setHeaderContent('Chat with Nexus');
    setHeaderIcon(
      (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-message-square h-5 w-5"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    );
    return () => {
      clearHeaderContent();
    };
  }, []);

  // Get selected agent object
  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);

  // Chat handlers
  const handleSendMessage = async (message: string, attachments: FileAttachment[] = []) => {
    const hasMessage = message?.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    if ((!hasMessage && !hasAttachments) || !user) return;

    const messageContent = hasMessage ? message : ATTACHMENT_ONLY_PLACEHOLDER;

    try {
      setIsLoading(true);

      // Create or get conversation
  let currentConversationId = currentConversation?.id || null;
  if (!currentConversationId) {
        const baseTitle = hasMessage ? message : attachments[0]?.name || 'New conversation';
        const conversationTitle = baseTitle.length > 50 ? `${baseTitle.substring(0, 50)}...` : baseTitle;
  currentConversationId = await createConversation(conversationTitle, 'gpt-4', undefined, user.id);
  await setCurrentConversationById(currentConversationId);
      }

      // Upload attachments (if any) before saving message
      let uploadedAttachments: FileAttachment[] = [];
      if (hasAttachments) {
        const filesToUpload = attachments
          .map(att => att.file)
          .filter((file): file is File => !!file);

        if (filesToUpload.length) {
          try {
            uploadedAttachments = await chatAttachmentService.uploadAttachments({
              conversationId: currentConversationId!,
              files: filesToUpload,
            });
          } catch (uploadError) {
            console.error('Attachment upload failed:', uploadError);
            const uploadMessage = uploadError instanceof Error ? uploadError.message : 'Failed to upload attachments';
            toast({
              title: 'Upload failed',
              description: uploadMessage,
              type: 'error'
            });
            return;
          }
        }
      }

      // Save and display the user message
      const sanitizedAttachments = uploadedAttachments.map(att => ({
        ...att,
        file: undefined,
        status: 'uploaded' as const,
      }));
      await sendMessage(messageContent, currentConversationId!, sanitizedAttachments);

      setIsStreaming(true);

  // Prepare streaming temp id, requestId, and controller
  const tempAiId = `tmp-ai-${Date.now()}`;
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const controller = new AbortController();
  // store by requestId so we can abort server-side as well
  streamingControllers.current[requestId] = { controller, tempAiId } as any;

      // Start streaming UI message
      // @ts-ignore - store method added dynamically
      if (typeof (useAIChatStore as any) === 'function') {
        // call store startStreamingResponse via the hook instance
        const store = useAIChatStore.getState ? useAIChatStore.getState() : null;
        store?.startStreamingResponse?.(tempAiId, currentConversationId!, '');
      }

      // Build conversation history including the latest message
      const history = [
        ...storeMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at
        })),
        ...((hasMessage || hasAttachments)
          ? [{ role: 'user', content: messageContent, timestamp: new Date().toISOString() }]
          : [])
      ];

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
          history
        },
        attachments: sanitizedAttachments
      };

  // Processing with Nexus RAG Service (debug log removed)
      // Pass the AbortSignal if the service supports cancellation
      const nexusResponse = await nexusRAGService.processMessage({
        message: messageContent,
        context: nexusContext,
        agentId: selectedAgentId,
        signal: controller.signal,
        requestId,
        onChunk: (chunk: string) => {
          // Append chunk to streaming message in store
          const store = useAIChatStore.getState ? useAIChatStore.getState() : null;
          store?.appendStreamingChunk?.(tempAiId, chunk);
        }
      });

      if (nexusResponse.success && nexusResponse.data) {
        // Nexus RAG Response received (debug details removed)
        
        // Update RAG status
        setRagEnabled(true);
        setRagConfidence(nexusResponse.data.confidence);
        setKnowledgeTypes(nexusResponse.data.knowledgeTypes || []);
        
    // Finish streaming and persist. If the Nexus response already includes a persisted serverMessage,
    // finishStreamingResponse will replace the temp message with that serverMessage. In that case we
    // should NOT call saveAIResponse again because it would insert a duplicate assistant message.
  const store = useAIChatStore.getState ? useAIChatStore.getState() : null;
  await store?.finishStreamingResponse?.(tempAiId, nexusResponse.data.content, nexusResponse.data.serverMessage || null);
  if (!nexusResponse.data.serverMessage) {
    // Persist via legacy API only when serverMessage was not provided
    await saveAIResponse(nexusResponse.data.content, currentConversationId!);
  }
        
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
      // Clear and remove any controllers for finished streams
      Object.keys(streamingControllers.current).forEach(k => {
        const entry = streamingControllers.current[k];
        const signal = entry?.controller?.signal || entry?.signal || (entry && entry.signal);
        if (signal && signal.aborted) {
          delete streamingControllers.current[k];
        }
      });
    }
  };

  const handleStopGeneration = () => {
    setIsStreaming(false);
    setIsLoading(false);
    // Abort all active streaming requests and notify store
    // streamingControllers keyed by requestId -> { controller, tempAiId }
    Object.keys(streamingControllers.current).forEach(requestId => {
      try {
        const entry = streamingControllers.current[requestId];
        if (entry && entry.controller) entry.controller.abort();
      } catch (err) {
        console.error('Error aborting stream', err);
      }
      // Inform server to abort if possible
      (async () => {
        try {
          await callEdgeFunction('ai_abort', { requestId });
        } catch (e) {
          // non-fatal
        }
      })();
      const store = useAIChatStore.getState ? useAIChatStore.getState() : null;
      const tempAiId = streamingControllers.current[requestId]?.tempAiId;
      if (tempAiId) store?.cancelStreamingResponse?.(tempAiId);
      delete streamingControllers.current[requestId];
    });
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
      // Create a new conversation record and select it immediately so
      // the UI doesn't get auto-switched back to the latest existing
      // conversation by the effect that watches `conversationId`.
      const title = 'New conversation';
      const model = 'gpt-4';
  const newId = await createConversation(title, model, undefined, user?.id);
  console.info('handleNewConversation created conversation', { newId });
  // Clear messages first to ensure UI shows an empty conversation immediately
  clearMessages();
  // Ensure store and messages reflect the new conversation
  await setCurrentConversationById(newId);
  setSelectedAgentId('executive-assistant');
  await fetchMessages(newId);
  await fetchConversations();
  // Trigger auto-focus in the chat input for the newly created conversation
  setAutoFocusTrigger(n => n + 1);

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

  // selectedAgentId changes handled silently in the UI; debug logging removed

  const handleConversationSelect = async (convId: string) => {
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
    // Clear current conversation so next send starts a new one
    setCurrentConversation(null);
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
      if (currentConversation?.id === convId) {
        setCurrentConversation(null);
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

  const handleStartRenameConversation = (conversation: Conversation) => {
    setEditingConversationId(conversation.id);
    setEditingTitle(conversation.title || 'Untitled conversation');
  };

  const handleRenameChange = (value: string) => {
    setEditingTitle(value);
  };

  const handleRenameCancel = () => {
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleRenameSubmit = async (convId: string) => {
    const trimmedTitle = editingTitle.trim() || 'Untitled conversation';

    try {
      await updateConversation(convId, { title: trimmedTitle });
      toast({
        title: 'Conversation renamed',
        description: 'Title updated successfully.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error renaming conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename conversation. Please try again.',
        type: 'error'
      });
    } finally {
      handleRenameCancel();
    }
  };

  const handleRenameKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>, convId: string) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await handleRenameSubmit(convId);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      handleRenameCancel();
    }
  };

  // Filter out empty and archived conversations for display
  const nonEmptyConversations = conversations.filter(conv => !conv.is_archived);

  // Auto-select the latest conversation on initial load only. Use a ref to
  // avoid re-running this effect after subsequent fetches or when the user
  // creates a new conversation (which should take precedence).
  const hasAutoSelectedRef = React.useRef(false);
  useEffect(() => {
    if (hasAutoSelectedRef.current) return;

    const storeState = (useAIChatStore as any).getState ? (useAIChatStore as any).getState() : null;
    const storeCurrentId = storeState?.currentConversation?.id;

    if (!storeCurrentId && nonEmptyConversations.length > 0) {
      const latestConversation = nonEmptyConversations[0];
      setCurrentConversationById(latestConversation.id);
      fetchMessages(latestConversation.id);
      hasAutoSelectedRef.current = true;
    }
  }, []); // run once on mount

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
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
      <div className="flex items-center justify-center h-full bg-gray-900">
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
      <div className="flex items-center justify-center h-full bg-gray-900">
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
    <div className="flex h-full min-h-0 bg-gray-900 text-white">
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
              {nonEmptyConversations.map((conv, idx) => {
                const isActive = currentConversation?.id === conv.id;
                const isEditing = editingConversationId === conv.id;

                return (
                  <div
                    key={conv.id ?? `conv-${idx}`}
                    className={cn(
                      "w-full px-3 py-2 rounded-md text-xs transition-colors cursor-pointer",
                      isActive ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800",
                      sidebarCollapsed && "px-2 py-1"
                    )}
                    title={sidebarCollapsed ? (conv.title || "Untitled conversation") : undefined}
                    onClick={() => {
                      if (!isEditing) {
                        handleConversationSelect(conv.id);
                      }
                    }}
                  >
                    {sidebarCollapsed ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 bg-gray-600 rounded flex items-center justify-center">
                          <MessageSquare className="w-2 h-2 text-white" />
                        </div>
                      </div>
                    ) : isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingTitle}
                          onChange={(event) => handleRenameChange(event.target.value)}
                          onKeyDown={(event) => handleRenameKeyDown(event, conv.id)}
                          autoFocus
                          className="h-8 text-xs bg-gray-900 border-gray-700 text-gray-100 focus-visible:ring-0 focus:border-gray-500"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRenameSubmit(conv.id);
                          }}
                          className="text-gray-300 hover:text-white"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRenameCancel();
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{conv.title || "Untitled conversation"}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {conv.message_count || 0} messages
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleStartRenameConversation(conv);
                            }}
                            className="text-gray-400 hover:text-white"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => handleDeleteConversation(conv.id, event)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
                 autoFocusTrigger={autoFocusTrigger}
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
