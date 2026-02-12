/**
 * Modern Chat Interface
 * 
 * A ChatGPT-inspired clean, minimalist chat interface
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/shared/ui/components/Toast';
import { Button } from '@/shared/components/ui/Button';
import { Bot, Brain, Database, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ChatMessage as ChatMessageType, FileAttachment } from '@/shared/types/chat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatWelcome from './ChatWelcome';

interface ModernChatInterfaceProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string, attachments?: FileAttachment[]) => void;
  onStopGeneration?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  showTypingIndicator?: boolean;
  className?: string;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  agentId?: string;
  agentName?: string;
  ragEnabled?: boolean;
  ragConfidence?: number;
  knowledgeTypes?: string[];
  ragSources?: any[];
  ragRecommendations?: string[];
  businessContext?: Record<string, any> | null;
  suggestions?: string[];
  streamStatus?: {
    stage: string;
    label: string;
    detail?: string | null;
    timestamp?: string;
  } | null;
  thinkingContent?: string;
}

const ModernChatInterface: React.FC<ModernChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onStopGeneration,
  isStreaming = false,
  disabled = false,
  placeholder = "Ask anything...",
  showTypingIndicator = false,
  className,
  userName = "User",
  userEmail,
  userAvatarUrl,
  agentId: _agentId = "executive-assistant",
  agentName = "Executive Assistant",
  ragEnabled = false,
  ragConfidence,
  knowledgeTypes,
  ragSources,
  ragRecommendations,
  businessContext,
  suggestions,
  streamStatus,
  thinkingContent
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [streamingElapsedSeconds, setStreamingElapsedSeconds] = useState(0);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [isActivityExpanded, setIsActivityExpanded] = useState(true);
  const [statusEvents, setStatusEvents] = useState<Array<{
    stage: string;
    label: string;
    detail?: string | null;
    timestamp: string;
  }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  /* const { addToast } = useToast(); */
  // useToast from shared/ui/components/Toast returns { showToast, toast }
  // ModernChatInterface was using addToast. 
  // We need to check imports. 
  // ModernChatInterface imports `useToast` from `@/shared/ui/components/Toast`.
  // That file exports `useToast` which returns `ToastContextType`.
  // `ToastContextType` has `showToast` and `toast`. 
  // So `addToast` is wrong.
  const { showToast } = useToast();

  // Generate a consistent agent color based on name
  const getAgentColor = (name: string) => {
    // Use the app's primary color for brand consistency
    return 'bg-primary';
  };

  const agentColor = getAgentColor(agentName);
  const normalizedAgentName = agentName?.trim() || '';
  const isCustomAgentName = normalizedAgentName.length > 0
    && !['assistant', 'executive assistant', 'executive-assistant'].includes(normalizedAgentName.toLowerCase());
  const thinkingLabel = `${isCustomAgentName ? normalizedAgentName : 'Agent'} is thinking`;
  const statusActor = isCustomAgentName ? normalizedAgentName : 'Agent';
  const statusLabel = streamStatus?.label
    ? streamStatus.label.replace(/^Agent is\s+/i, `${statusActor} is `)
    : thinkingLabel;
  const statusDetail = streamStatus?.detail || (ragEnabled ? 'Business context is attached from backend memory.' : null);
  const timelineEvents = statusEvents.length ? [...statusEvents].reverse() : [];
  const currentStatusEvent = streamStatus
    ? {
        stage: streamStatus.stage || 'processing',
        label: streamStatus.label || 'Agent is working',
        detail: streamStatus.detail || null
      }
    : null;
  const timelineDisplayEvents = timelineEvents.filter((event, index) => {
    if (!currentStatusEvent || index !== 0) return true;
    return !(
      event.stage === currentStatusEvent.stage
      && event.label === currentStatusEvent.label
      && (event.detail || '') === (currentStatusEvent.detail || '')
    );
  });
  const shouldShowActivityTimeline = timelineDisplayEvents.length > 0;
  const stageProgressMap: Record<string, number> = {
    accepted: 8,
    context_loading: 20,
    context_ready: 34,
    openclaw_request: 48,
    openclaw_connected: 62,
    thinking: 72,
    responding: 84,
    processing: 88,
    completed: 100
  };
  const baseProgress = stageProgressMap[streamStatus?.stage || 'thinking'] || 35;
  const animatedProgress = isStreaming
    ? Math.min(96, baseProgress + Math.min(8, streamingElapsedSeconds % 9))
    : baseProgress;
  const formatDuration = (totalSeconds: number) => {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAtBottom]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;

    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom && isStreaming);
  }, [isStreaming]);

  // Handle scroll button click
  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAtBottom(true);
    setShowScrollButton(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isStreaming) {
      setStreamingElapsedSeconds(0);
      setStatusEvents([]);
      return;
    }

    const startedAt = Date.now();
    setStreamingElapsedSeconds(0);
    setStatusEvents([]);

    const intervalId = window.setInterval(() => {
      setStreamingElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming || !streamStatus) return;
    setStatusEvents((previous) => {
      const normalized = {
        stage: streamStatus.stage || 'processing',
        label: streamStatus.label || 'Agent is working',
        detail: streamStatus.detail || null,
        timestamp: streamStatus.timestamp || new Date().toISOString()
      };
      const last = previous[previous.length - 1];
      if (
        last
        && last.stage === normalized.stage
        && last.label === normalized.label
        && (last.detail || '') === (normalized.detail || '')
      ) {
        return previous;
      }
      return [...previous, normalized].slice(-8);
    });
  }, [isStreaming, streamStatus]);

  useEffect(() => {
    if (!isStreaming || !isAtBottom) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isStreaming, isAtBottom, thinkingContent, streamStatus]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast({
      title: "Copied",
      description: "Message copied to clipboard",
      type: "info"
    });
  };

  const handleSendMessage = async (text: string, fileAttachments: FileAttachment[] = []) => {
    if ((!text.trim() && fileAttachments.length === 0) || disabled) return;

    // Clear input immediately
    setInput('');
    setAttachments([]);

    // Send message
    onSendMessage(text, fileAttachments);

    // Focus input after sending
    // setTimeout(() => chatInputRef.current?.focus(), 100);
  };

  const handleInputSubmit = () => {
    handleSendMessage(input, attachments);
  };
  const isEmptyState = messages.length === 0;

  return (
    <div className={cn("relative flex flex-col h-full bg-background", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(var(--primary),0.12),transparent_46%)] dark:bg-[radial-gradient(ellipse_at_top,hsla(var(--primary),0.18),transparent_52%)]" />
      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto min-h-0 px-3 py-4 sm:px-5 sm:py-5 lg:px-8 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-gray-700"
      >
        <div className="mx-auto min-h-full max-w-5xl space-y-4">
          {isEmptyState ? (
            <div className="mx-auto flex min-h-full w-full items-center justify-center py-4">
              <div className="w-full max-w-3xl">
                <ChatWelcome
                  userName={userName}
                  agentName={agentName}
                  onSuggestionClick={(suggestion) => handleSendMessage(suggestion)}
                  suggestions={suggestions}
                />
                <div className="mt-5 w-full">
                  <ChatInput
                    ref={chatInputRef}
                    input={input}
                    setInput={setInput}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    onSendMessage={handleInputSubmit}
                    onStopGeneration={onStopGeneration}
                    isStreaming={isStreaming}
                    disabled={disabled}
                    placeholder={placeholder}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    thinkingLabel={thinkingLabel}
                    inline
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 pb-4">
              {messages.map((message, index) => {
                // Check if this is a consecutive message from the same role
                const isConsecutive = index > 0 && messages[index - 1].role === message.role;

                return (
                  <ChatMessage
                    key={message.id || index}
                    message={message}
                    isConsecutive={isConsecutive}
                    agentName={agentName}
                    agentColor={agentColor}
                    userName={userName}
                    userEmail={userEmail}
                    userAvatarUrl={userAvatarUrl}
                    onCopy={handleCopy}
                  />
                );
              })}

              {/* Streaming Indicator / Thinking State */}
              {isStreaming && (
                <div className="flex w-full mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start gap-3 max-w-3xl w-full">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm",
                      agentColor
                    )}>
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="space-y-2 overflow-hidden w-full max-w-2xl">
                      <div className="min-h-[20px] p-4 rounded-xl bg-card/95 border border-border/70 shadow-sm text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-foreground/90">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            Live Run
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">
                            {formatDuration(streamingElapsedSeconds)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-blue-500 dark:text-blue-300 leading-relaxed">
                          <Brain className="w-3 h-3" />
                          <span>{statusLabel}</span>
                        </div>
                        {statusDetail && (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground leading-relaxed">
                            <Database className="w-3 h-3" />
                            <span>{statusDetail}</span>
                          </div>
                        )}

                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${animatedProgress}%` }}
                          />
                        </div>

                        {shouldShowActivityTimeline && (
                          <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                            <button
                              onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                              className="flex w-full items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <span>Activity Timeline</span>
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                                {timelineDisplayEvents.length}
                              </span>
                              {isActivityExpanded ? (
                                <ChevronDown className="w-3 h-3 ml-auto opacity-50" />
                              ) : (
                                <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                              )}
                            </button>
                            {isActivityExpanded && (
                              <div className="mt-2 space-y-1.5">
                                {timelineDisplayEvents.map((event, idx) => (
                                  <div
                                    key={`${event.timestamp}-${event.stage}-${idx}`}
                                    className="rounded-md border border-border/50 bg-background/60 px-2 py-1.5 text-xs"
                                  >
                                    <div className="flex items-center justify-between gap-2 text-foreground/90">
                                      <span className="truncate">{event.label}</span>
                                      <span className="shrink-0 text-[10px] text-muted-foreground uppercase">
                                        {event.stage.replace(/_/g, ' ')}
                                      </span>
                                    </div>
                                    {event.detail && (
                                      <div className="mt-0.5 line-clamp-2 text-muted-foreground">{event.detail}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {thinkingContent && (
                          <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                            <button
                              onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                            >
                              <Brain className="w-3 h-3" />
                              <span>Reasoning Stream</span>
                              {isThinkingExpanded ? (
                                <ChevronDown className="w-3 h-3 ml-auto opacity-50" />
                              ) : (
                                <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                              )}
                            </button>

                            {isThinkingExpanded && (
                              <div className="mt-2 max-h-56 overflow-y-auto text-xs text-muted-foreground/85 font-mono bg-background/60 p-2 rounded-md whitespace-pre-wrap animate-in fade-in slide-in-from-top-1">
                                {thinkingContent}
                                <span className="inline-block w-1.5 h-3 ml-1 bg-primary/50 animate-pulse align-middle" />
                              </div>
                            )}
                          </div>
                        )}

                        {!thinkingContent && (
                          <div className="mt-3 space-y-2">
                            <div className="h-2 rounded bg-muted/70 animate-pulse w-11/12" />
                            <div className="h-2 rounded bg-muted/60 animate-pulse w-9/12" />
                            <div className="h-2 rounded bg-muted/50 animate-pulse w-7/12" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll Button */}
        {showScrollButton && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleScrollToBottom}
              className="rounded-full shadow-lg border border-border bg-background/80 backdrop-blur-sm gap-2 px-4"
            >
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              New messages below
            </Button>
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      {!isEmptyState && (
        <ChatInput
          ref={chatInputRef}
          input={input}
          setInput={setInput}
          attachments={attachments}
          setAttachments={setAttachments}
          onSendMessage={handleInputSubmit}
          onStopGeneration={onStopGeneration}
          isStreaming={isStreaming}
          disabled={disabled}
          placeholder={placeholder}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          thinkingLabel={thinkingLabel}
        />
      )}
    </div>
  );
};

export default ModernChatInterface;
