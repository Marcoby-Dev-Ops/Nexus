import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Trash2,
  Plus as PlusIcon,
  Search,
  FileText,
  Sparkles,
  Pencil,
  X
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useAuth } from '@/hooks/index';
import { useAIChatStore } from '@/shared/stores/useAIChatStore';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Connect to AIChatStore
  const {
    conversations,
    conversationsLoading,
    currentConversation,
    fetchConversations,
    deleteConversation,
    setCurrentConversationById,
    cleanupEmptyConversations,
    setConversationId
  } = useAIChatStore();

  useEffect(() => {
    if (user && conversations.length === 0) {
      fetchConversations();
    }
  }, [user, fetchConversations, conversations.length]);

  const handleConversationSelect = async (convId: string) => {
    await setCurrentConversationById(convId);
    setConversationId(convId); // Ensure ID is set in store for ChatPage to pick up
    if (location.pathname !== '/chat') {
      navigate('/chat');
    }
    // On mobile, we might want to close the sidebar? 
    // But this component is the "Utility Panel", controlled by UnifiedLayout.
    // If we want to auto-close on mobile, we'd need to know if we are on mobile.
    // The parent controls visibility via `isOpen`, but passed `onClose`.
    // Let's call onClose if window width is small (handled by parent logic usually, but we can hint it).
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleNewConversation = () => {
    // Clear current conversation in store
    useAIChatStore.getState().setConversationId(null);
    useAIChatStore.getState().setCurrentConversation(null);
    useAIChatStore.getState().clearMessages();

    if (location.pathname !== '/chat') {
      navigate('/chat');
    } else {
      // If already on chat page, just ensuring state is clear is enough
      // The ChatPage should react to null conversationId by showing empty state
    }

    if (window.innerWidth < 768) {
      onClose();
    }

    toast({
      title: "New conversation",
      description: "Ready to start a new conversation!",
      type: "success"
    });
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation(convId);
        toast({
          title: "Conversation deleted",
          description: "The conversation has been removed.",
          type: "success"
        });
      } catch (error) {
        console.error('Failed to delete conversation', error);
        toast({
          title: "Error",
          description: "Failed to delete conversation",
          type: "error"
        });
      }
    }
  };

  const handleCleanupEmptyConversations = async () => {
    try {
      await cleanupEmptyConversations();
      toast({
        title: "Cleanup complete",
        description: "Empty conversations removed.",
        type: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cleanup conversations",
        type: "error"
      });
    }
  };

  // Only render content if open (though parent manages width/visibility, rendering null here saves performance)
  // But parent uses CSS transition, so we should keep content rendered but maybe hidden?
  // Parent uses `w-0` and `overflow-hidden`, so content is hidden.
  // We'll render full content.

  const nonEmptyConversations = conversations.filter(c => c.message_count > 0);
  const emptyConversationsCount = conversations.length - nonEmptyConversations.length;

  return (
    <div className="flex flex-col h-full bg-muted/10 border-r border-border/40">
      {/* Utility Header */}
      <div className="p-4 border-b border-border/40">
        <h2 className="text-sm font-semibold text-foreground/70 tracking-wider uppercase mb-3">
          Exploration
        </h2>
        <div className="space-y-1">
          <Button
            variant="secondary"
            className="w-full justify-start gap-2 h-9 font-normal bg-background/50 hover:bg-background border-border/50 shadow-sm"
            onClick={handleNewConversation}
          >
            <PlusIcon className="w-4 h-4 text-primary" />
            <span>New Chat</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-9 font-normal text-muted-foreground"
            onClick={() => { navigate('/search'); if (window.innerWidth < 768) onClose(); }}
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-9 font-normal text-muted-foreground"
            onClick={() => { navigate('/documents'); if (window.innerWidth < 768) onClose(); }}
          >
            <FileText className="w-4 h-4" />
            <span>Documents</span>
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-2">
          <h3 className="px-2 text-xs font-medium text-muted-foreground/60 mt-4 mb-2">
            Recent Conversations
          </h3>

          {conversationsLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Sparkles className="w-4 h-4 animate-spin mb-2" />
              <span className="text-xs">Loading...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-muted-foreground text-xs">
              No recent conversations. Start exploring!
            </div>
          ) : (
            <div className="space-y-0.5">
              {emptyConversationsCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCleanupEmptyConversations}
                  className="w-full text-xs text-muted-foreground hover:text-foreground h-7 justify-start px-2 mb-2"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Cleanup {emptyConversationsCount} empty chats
                </Button>
              )}

              {nonEmptyConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/50 cursor-pointer",
                    currentConversation?.id === conv.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground"
                  )}
                  onClick={() => handleConversationSelect(conv.id)}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                  <div className="flex-1 truncate">
                    {conv.title || "Untitled Conversation"}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
