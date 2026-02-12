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

function toTimestamp(value?: string) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatConversationMeta(conversation: Conversation) {
  const lastUpdated = toTimestamp(conversation.updated_at || conversation.created_at);
  const now = Date.now();
  const diffMs = Math.max(0, now - lastUpdated);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let relative = 'just now';
  if (diffMinutes >= 1 && diffMinutes < 60) {
    relative = `${diffMinutes}m ago`;
  } else if (diffHours >= 1 && diffHours < 24) {
    relative = `${diffHours}h ago`;
  } else if (diffDays >= 1 && diffDays < 7) {
    relative = `${diffDays}d ago`;
  } else if (lastUpdated > 0) {
    relative = new Date(lastUpdated).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  const count = Math.max(0, conversation.message_count || 0);
  const countLabel = `${count} ${count === 1 ? 'msg' : 'msgs'}`;
  return `${relative} • ${countLabel}`;
}

function formatTagLabel(value: string | undefined) {
  if (!value) return '';
  return value.replace(/_/g, ' ');
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
  const [historySearch, setHistorySearch] = useState('');
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
      variant: "success"
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
          variant: "success"
        });
      } catch (error) {
        console.error('Failed to delete conversation', error);
        toast({
          title: "Error",
          description: "Failed to delete conversation",
          variant: "destructive"
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
        variant: "success"
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
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cleanup conversations",
        variant: "destructive"
      });
    }
  };

  const sortedConversations = [...conversations].sort((a, b) => {
    const aTs = toTimestamp(a.updated_at || a.created_at);
    const bTs = toTimestamp(b.updated_at || b.created_at);
    return bTs - aTs;
  });

  const nonEmptyConversations = sortedConversations.filter(c => c.message_count > 0);
  const emptyConversationsCount = sortedConversations.length - nonEmptyConversations.length;
  const normalizedSearch = historySearch.trim().toLowerCase();
  const filteredConversations = nonEmptyConversations.filter((conversation) => {
    if (!normalizedSearch) return true;
    const title = (conversation.title || '').toLowerCase();
    const lastTopic = String(conversation.context?.modelWay?.last_topic || '').toLowerCase();
    return title.includes(normalizedSearch) || lastTopic.includes(normalizedSearch);
  });
  const timeGroups = groupConversationsByTime(filteredConversations);

  return (
    <div className="flex h-full flex-col border-r border-border/60 bg-background">
      {/* Workspace Header */}
      <div className="border-b border-border/60 px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[0.76rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Workspace
          </h2>
          <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {nonEmptyConversations.length}
          </span>
        </div>
        <div className="space-y-2">
          <Button
            variant="secondary"
            className="h-10 w-full justify-start gap-2 border border-border/60 bg-background text-[0.93rem] font-medium shadow-sm hover:bg-muted/30"
            onClick={handleNewConversation}
          >
            <PlusIcon className="w-4 h-4 text-primary" />
            <span>New Chat</span>
          </Button>
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-2 text-[0.9rem] text-muted-foreground"
            onClick={() => { navigate('/documents'); if (window.innerWidth < 768) onClose(); }}
          >
            <FileText className="w-4 h-4" />
            <span>Documents</span>
          </Button>
        </div>
      </div>

      <div className="border-b border-border/60 px-3 py-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/80" />
          <input
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search conversations"
            className="h-9 w-full rounded-md border border-border/70 bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60"
          />
        </label>
        {emptyConversationsCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCleanupEmptyConversations}
            className="mt-2 h-7 w-full justify-start bg-muted/40 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="mr-2 h-3 w-3" />
            Clear {emptyConversationsCount} empty threads
          </Button>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-2 py-2">
          {isLoading && conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Sparkles className="w-4 h-4 animate-spin mb-2" />
              <span className="text-sm">Loading history...</span>
            </div>
          ) : nonEmptyConversations.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No recent conversations. Start exploring!
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No conversations match "{historySearch.trim()}".
            </div>
          ) : (
            <div className="space-y-1.5">
              {timeGroups.map(group => (
                <div key={group.label} className="pt-2">
                  <h4 className="px-2 pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground/75">
                    {group.label}
                  </h4>
                  {group.conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2.5 transition-colors",
                        editingId === conv.id
                          ? "border-primary/35 bg-muted/80 text-foreground"
                          : currentConversation?.id === conv.id
                            ? "border-primary/35 bg-primary/10 text-foreground"
                            : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-muted/35"
                      )}
                      onClick={() => handleConversationSelect(conv.id)}
                    >
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />

                      {editingId === conv.id ? (
                        <div className="flex-1 min-w-0">
                          <input
                            ref={renameInputRef}
                            className="w-full bg-transparent border-b border-primary text-sm text-foreground outline-none px-0 py-0"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => handleRenameKeyDown(e, conv.id)}
                            onBlur={() => handleFinishRename(conv.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="truncate text-[0.9rem] font-medium text-foreground/95">
                            {conv.title || "Untitled Conversation"}
                          </div>
                          <div className="mt-0.5 truncate text-[0.72rem] text-muted-foreground">
                            {formatConversationMeta(conv)}
                          </div>
                          {conv.context?.modelWay?.last_topic && (
                            <div className="mt-0.5 truncate text-[0.74rem] text-muted-foreground/80">
                              {conv.context.modelWay.last_topic}
                            </div>
                          )}
                          {/* Continuity Tags */}
                          {conv.context?.modelWay && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {conv.context.modelWay.intent && (
                                <span className={cn(
                                  "rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                                  conv.context.modelWay.intent === 'brainstorm' ? "border-fuchsia-200/60 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300" :
                                    conv.context.modelWay.intent === 'solve' ? "border-rose-200/60 bg-rose-500/10 text-rose-700 dark:text-rose-300" :
                                      conv.context.modelWay.intent === 'write' ? "border-sky-200/60 bg-sky-500/10 text-sky-700 dark:text-sky-300" :
                                        conv.context.modelWay.intent === 'decide' ? "border-amber-200/60 bg-amber-500/10 text-amber-700 dark:text-amber-300" :
                                          conv.context.modelWay.intent === 'learn' ? "border-emerald-200/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" :
                                            "border-border/70 bg-muted/50 text-muted-foreground"
                                )}>
                                  {formatTagLabel(conv.context.modelWay.intent)}
                                </span>
                              )}
                              {conv.context.modelWay.phase && (
                                <span className={cn(
                                  "rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                                  conv.context.modelWay.phase === 'discovery' ? "border-indigo-200/60 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" :
                                    conv.context.modelWay.phase === 'synthesis' ? "border-cyan-200/60 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" :
                                      conv.context.modelWay.phase === 'decision' ? "border-orange-200/60 bg-orange-500/10 text-orange-700 dark:text-orange-300" :
                                        conv.context.modelWay.phase === 'execution' ? "border-emerald-200/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" :
                                          "border-border/70 bg-muted/50 text-muted-foreground"
                                )}>
                                  {formatTagLabel(conv.context.modelWay.phase)}
                                </span>
                              )}
                            </div>
                          )}
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
                        <div className="ml-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
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
