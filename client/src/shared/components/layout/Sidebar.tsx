import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Trash2,
  Plus as PlusIcon,
  Search,
  FileText,
  Sparkles,
  Pencil,
  Check
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useAuth } from '@/hooks/index';
import { useAIChatStore } from '@/shared/stores/useAIChatStore';
import { cn } from '@/lib/utils';
import { useToast } from '@/shared/components/ui/use-toast';
import type { Conversation } from '@/shared/types/chat';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TimeGroup {
  label: string;
  conversations: Conversation[];
}

function groupConversationsByTime(convs: Conversation[]): TimeGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: TimeGroup[] = [
    { label: 'Today', conversations: [] },
    { label: 'Yesterday', conversations: [] },
    { label: 'Previous 7 Days', conversations: [] },
    { label: 'Older', conversations: [] }
  ];

  convs.forEach(conv => {
    const date = new Date(conv.updated_at || conv.created_at);
    if (date >= today) {
      groups[0].conversations.push(conv);
    } else if (date >= yesterday) {
      groups[1].conversations.push(conv);
    } else if (date >= sevenDaysAgo) {
      groups[2].conversations.push(conv);
    } else {
      groups[3].conversations.push(conv);
    }
  });

  return groups.filter(g => g.conversations.length > 0);
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Connect to AIChatStore
  const {
    conversations,
    isLoading,
    currentConversation,
    fetchConversations,
    deleteConversation,
    setCurrentConversationById,
    cleanEmptyConversations,
    clearMessages,
    setCurrentConversation,
    renameConversation
  } = useAIChatStore();

  useEffect(() => {
    if (user && conversations.length === 0) {
      fetchConversations();
    }
  }, [user, fetchConversations, conversations.length]);

  // Focus rename input when editing starts
  useEffect(() => {
    if (editingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingId]);

  const handleConversationSelect = async (convId: string) => {
    if (editingId) return; // Don't navigate while renaming
    await setCurrentConversationById(convId);
    if (location.pathname !== '/chat') {
      navigate('/chat');
    }
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleNewConversation = () => {
    setCurrentConversation(null);
    clearMessages();

    if (location.pathname !== '/chat') {
      navigate('/chat');
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

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title || '');
  };

  const handleFinishRename = async (convId: string) => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conversations.find(c => c.id === convId)?.title) {
      await renameConversation(convId, trimmed);
      toast({
        title: "Renamed",
        description: "Conversation renamed.",
        type: "success"
      });
    }
    setEditingId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, convId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFinishRename(convId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const handleCleanupEmptyConversations = async () => {
    try {
      await cleanEmptyConversations();
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

  const nonEmptyConversations = conversations.filter(c => c.message_count > 0);
  const emptyConversationsCount = conversations.length - nonEmptyConversations.length;
  const timeGroups = groupConversationsByTime(nonEmptyConversations);

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
          {isLoading && conversations.length === 0 ? (
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

              {timeGroups.map(group => (
                <div key={group.label}>
                  <h4 className="px-2 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mt-4 mb-1.5">
                    {group.label}
                  </h4>
                  {group.conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors cursor-pointer",
                        editingId === conv.id
                          ? "bg-muted text-foreground"
                          : currentConversation?.id === conv.id
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted/50"
                      )}
                      onClick={() => handleConversationSelect(conv.id)}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />

                      {editingId === conv.id ? (
                        <input
                          ref={renameInputRef}
                          className="flex-1 bg-transparent border-b border-primary text-sm text-foreground outline-none px-0 py-0 min-w-0"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => handleRenameKeyDown(e, conv.id)}
                          onBlur={() => handleFinishRename(conv.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex-1 truncate">
                          {conv.title || "Untitled Conversation"}
                        </div>
                      )}

                      {editingId === conv.id ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => { e.stopPropagation(); handleFinishRename(conv.id); }}
                        >
                          <Check className="w-3 h-3 text-primary" />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => handleStartRename(conv, e)}
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
