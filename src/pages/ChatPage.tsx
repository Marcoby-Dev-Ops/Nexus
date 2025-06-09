import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Menu, 
  Search, 
  MessageSquare, 
  Trash2, 
  Edit, 
  Share,
  Download,
  Settings,
  Sparkles,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/lib/useOnboarding';
import { ModernExecutiveAssistant } from '@/components/ai/enhanced/ModernExecutiveAssistant';
import { OnboardingChat } from '@/components/onboarding/OnboardingChat'

/**
 * Full-featured Chat Page (ChatGPT/Claude style)
 */
interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

/**
 * Conversation Sidebar Component
 */
const ConversationSidebar: React.FC<{
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isCollapsed,
  onToggleCollapse
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const startEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-muted/30 border-r border-border flex flex-col items-center py-4 gap-2">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="Expand sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={onNewConversation}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="New conversation"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        {/* Recent conversations indicators */}
        {conversations.slice(0, 5).map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              conv.id === activeConversationId
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
            title={conv.title}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-80 bg-muted/30 border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Conversations</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewConversation}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Collapse sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'Start a new conversation'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                  conversation.id === activeConversationId
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingId === conversation.id ? (
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRename(conversation.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(conversation.id);
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditTitle('');
                          }
                        }}
                        className="w-full bg-background border border-border rounded px-2 py-1 text-sm"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h3 className="font-medium text-sm text-foreground truncate mb-1">
                        {conversation.title}
                      </h3>
                    )}
                    
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {conversation.lastMessage}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{conversation.timestamp.toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{conversation.messageCount} messages</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(conversation);
                        }}
                        className="p-1 rounded hover:bg-muted transition-colors"
                        title="Rename"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this conversation?')) {
                            onDeleteConversation(conversation.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main Chat Page Component
 */
export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { needsOnboarding, isLoading: onboardingLoading } = useOnboarding();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load conversations from database
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      try {
        const { chatHistory } = await import('@/lib/supabase');
        const recentConversations = await chatHistory.getRecentConversations(50);
        
        if (recentConversations) {
          const formattedConversations: Conversation[] = recentConversations.map(conv => ({
            id: conv.id,
            title: conv.title || 'Untitled Conversation',
            lastMessage: 'Click to view messages...',
            timestamp: new Date(conv.updated_at || conv.created_at || new Date()),
            messageCount: 0 // You could add a count query here if needed
          }));
          
          setConversations(formattedConversations);
          
          // Set first conversation as active if none selected
          if (!activeConversationId && formattedConversations.length > 0) {
            setActiveConversationId(formattedConversations[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    loadConversations();
  }, [user, activeConversationId]);

  // Import context from quick chat if available
  useEffect(() => {
    const state = location.state as any;
    if (state?.quickChatHistory && state.quickChatHistory.length > 0) {
      // Create new conversation from quick chat
      const newConv: Conversation = {
        id: `quick-${Date.now()}`,
        title: state.quickChatHistory[0].content.slice(0, 50) + '...',
        lastMessage: state.quickChatHistory[state.quickChatHistory.length - 1].content,
        timestamp: new Date(),
        messageCount: state.quickChatHistory.length
      };
      
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      
      // Clear location state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const handleNewConversation = async () => {
    if (!user) return;
    
    try {
      const { chatHistory } = await import('@/lib/supabase');
      const { executiveAgent } = await import('@/lib/agentRegistry');
      
      const conversation = await chatHistory.createConversation(
        'New Conversation',
        executiveAgent.id,
        { user_id: user.id }
      );
      
      const newConv: Conversation = {
        id: conversation.id,
        title: conversation.title,
        lastMessage: '',
        timestamp: new Date(conversation.created_at || new Date()),
        messageCount: 0
      };
      
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      // You'll need to implement a delete function in your chatHistory service
      // For now, just remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter(conv => conv.id !== id);
        setActiveConversationId(remaining[0]?.id || null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const { chatHistory } = await import('@/lib/supabase');
      await chatHistory.updateConversationTitle(id, newTitle);
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === id ? { ...conv, title: newTitle } : conv
        )
      );
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  // If user needs onboarding, show conversational onboarding in chat interface
  if (onboardingLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Nexus...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="h-screen bg-background flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-foreground text-sm sm:text-base truncate">Welcome to Nexus AI</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Let's get you set up with your AI-powered business assistant
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              <span className="hidden sm:inline">Setup in </span>progress...
            </div>
          </div>
        </div>

        {/* Onboarding Chat - Full Width */}
        <div className="flex-1 min-h-0">
          <OnboardingChat />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToDashboard}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-semibold text-foreground">Nexus AI Chat</h1>
              <p className="text-xs text-muted-foreground">
                {conversations.find(c => c.id === activeConversationId)?.title || 'Select a conversation'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Export conversation"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Share conversation"
            >
              <Share className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          {activeConversationId ? (
            <ModernExecutiveAssistant 
              sessionId={activeConversationId}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Welcome back to Nexus AI</h2>
                <p className="text-muted-foreground mb-6">
                  Select a conversation or start a new one to begin chatting
                </p>
                <button
                  onClick={handleNewConversation}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 