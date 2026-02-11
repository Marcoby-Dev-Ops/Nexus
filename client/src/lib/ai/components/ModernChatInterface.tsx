/**
 * Modern Chat Interface
 * 
 * A ChatGPT-inspired clean, minimalist chat interface
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/shared/components/ui/Avatar';
import { useToast } from '@/shared/ui/components/Toast';
import { Button } from '@/shared/components/ui/Button';
import { Bot, Brain, Database } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ChatMessage as ChatMessageType, FileAttachment } from '@/shared/types/chat';
import { logger } from '@/shared/utils/logger';
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
  agentId: _agentId = "executive-assistant",
  agentName = "Executive Assistant",
  ragEnabled = false,
  ragConfidence,
  knowledgeTypes,
  ragSources,
  ragRecommendations,
  businessContext,
  suggestions,
  streamStatus
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [streamingElapsedSeconds, setStreamingElapsedSeconds] = useState(0);
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
      return;
    }

    const startedAt = Date.now();
    setStreamingElapsedSeconds(0);

    const intervalId = window.setInterval(() => {
      setStreamingElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isStreaming]);

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
        className="relative flex-1 overflow-y-auto min-h-0 px-5 py-5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-gray-700"
      >
        <div className="max-w-4xl mx-auto space-y-5 min-h-full">
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
            <div className="space-y-6 pb-3">
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
                    <div className="space-y-2 overflow-hidden">
                      <div className="min-h-[20px] p-4 rounded-xl bg-card/90 border border-border/70 shadow-sm text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-500 dark:text-blue-300">
                          <Brain className="w-3 h-3" />
                          <span>{statusLabel}</span>
                          <span className="text-muted-foreground">({formatDuration(streamingElapsedSeconds)})</span>
                        </div>
                        {statusDetail && (
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Database className="w-3 h-3" />
                            <span>{statusDetail}</span>
                          </div>
                        )}
                        <div className="mt-2 h-1.5 w-56 max-w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div className="h-full w-1/3 rounded-full bg-primary animate-pulse" />
                        </div>
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
