/**
 * Modern Chat Interface
 * 
 * A ChatGPT-inspired clean, minimalist chat interface
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/shared/components/ui/Avatar';
import { useToast } from '@/shared/ui/components/Toast';
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
  businessContext
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [streamingElapsedSeconds, setStreamingElapsedSeconds] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
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
    const colors = ['bg-blue-600', 'bg-purple-600', 'bg-indigo-600', 'bg-teal-600', 'bg-emerald-600'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const agentColor = getAgentColor(agentName);
  const normalizedAgentName = agentName?.trim() || '';
  const isCustomAgentName = normalizedAgentName.length > 0
    && !['assistant', 'executive assistant', 'executive-assistant'].includes(normalizedAgentName.toLowerCase());
  const thinkingLabel = `${isCustomAgentName ? normalizedAgentName : 'Agent'} is thinking`;
  const isLongRunning = streamingElapsedSeconds >= 12;

  const formatDuration = (totalSeconds: number) => {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-gray-950", className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0 pl-4 pr-2 py-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-gray-700">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <ChatWelcome
              userName={userName}
              agentName={agentName}
              onSuggestionClick={(suggestion) => handleSendMessage(suggestion)}
            />
          ) : (
            <div className="space-y-6 pb-4">
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
                <div className="flex w-full mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start gap-3 max-w-3xl w-full">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm",
                      agentColor
                    )}>
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="space-y-2 overflow-hidden">
                      <div className="min-h-[20px] p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-500 dark:text-blue-300">
                          <Brain className="w-3 h-3" />
                          <span>{thinkingLabel}</span>
                          <span className="text-muted-foreground">({formatDuration(streamingElapsedSeconds)})</span>
                        </div>
                        {ragEnabled && (
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Database className="w-3 h-3" />
                            <span>Reviewing memory and business context</span>
                          </div>
                        )}
                        <div className="mt-2 h-1.5 w-56 max-w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div className="h-full w-1/3 rounded-full bg-primary animate-pulse" />
                        </div>
                        {isLongRunning && (
                          <div className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                            Still working on a longer request...
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
      </div>

      {/* Input Area - Fixed at bottom */}
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
        busyElapsedSeconds={streamingElapsedSeconds}
      />
    </div>
  );
};

export default ModernChatInterface;
