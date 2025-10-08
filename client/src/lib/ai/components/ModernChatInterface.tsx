/**
 * Modern Chat Interface
 * 
 * A ChatGPT-inspired clean, minimalist chat interface
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { useToast } from '@/shared/ui/components/Toast';
import { Bot, Brain, Database } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ChatMessage as ChatMessageType, FileAttachment } from '@/shared/types/chat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatWelcome from './ChatWelcome';
import SuggestionCard from './SuggestionCard';
import SuggestionPreviewModal from './SuggestionPreviewModal';

interface ModernChatInterfaceProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string, attachments?: FileAttachment[]) => Promise<void> | void;
  onStopGeneration?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  showTypingIndicator?: boolean;
  className?: string;
  userName?: string;
  agentId?: string;
  agentName?: string;
  ragEnabled?: boolean;
  ragConfidence?: number;
  knowledgeTypes?: string[];
  autoFocusTrigger?: number;
}

export default function ModernChatInterface({
  messages,
  onSendMessage,
  onStopGeneration,
  isStreaming = false,
  disabled = false,
  placeholder = "Ask anything...",
  showTypingIndicator = false,
  className,
  userName = "User",
  agentId = "executive-assistant",
  agentName = "Executive Assistant",
  ragEnabled = false,
  ragConfidence = 0,
  knowledgeTypes = []
  , autoFocusTrigger
}: ModernChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<{ focus: () => void }>(null);
  const { toast } = useToast();
  const [previewSuggestion, setPreviewSuggestion] = useState<any | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Refocus input when streaming stops
  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [isStreaming, messages.length]);

  // Initial focus when component mounts
  useEffect(() => {
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  }, []);

  // Focus input when autoFocusTrigger increments
  useEffect(() => {
    if (typeof autoFocusTrigger === 'number') {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [autoFocusTrigger]);

  // Debug: Monitor messages prop
  useEffect(() => {
    try {
      const ids = messages.map(m => ({ id: (m as any).id || null, role: (m as any).role || null }));
      console.log('ModernChatInterface received messages:', { count: messages.length, ids });
    } catch (e) {
      console.log('ModernChatInterface received messages (failed to map ids)', { count: messages.length });
    }
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() && attachments.length === 0) return;
    
    await Promise.resolve(onSendMessage(input.trim(), attachments));
    setInput('');
    // Clear attachments and revoke object URLs
    attachments.forEach(attachment => {
      if (attachment.url) {
        URL.revokeObjectURL(attachment.url);
      }
    });
    setAttachments([]);
    
    // Refocus the input after sending message
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  }, [input, attachments, onSendMessage]);

  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Message content has been copied to your clipboard",
      type: "success"
    });
  }, [toast]);

  return (
    <div className={cn(
      "flex flex-col h-full bg-gray-900 text-white rounded-lg border border-gray-700 overflow-hidden",
      className
    )}>
      {/* Agent Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-200">{agentName}</span>
            </div>
            <div className="text-xs text-gray-400">
              Connected and ready to help
            </div>
          </div>
          
          {/* RAG Status Indicator */}
          {ragEnabled && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-xs">
                <Database className="w-3 h-3 text-blue-400" />
                <span className="text-gray-300">Knowledge Base</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-400">{Math.round(ragConfidence * 100)}%</span>
                </div>
                {knowledgeTypes.length > 0 && (
                  <div className="flex items-center space-x-1 ml-2">
                    <span className="text-gray-400">•</span>
                    <span className="text-green-400 text-xs">
                      {knowledgeTypes.slice(0, 2).join(', ')}
                      {knowledgeTypes.length > 2 && ` +${knowledgeTypes.length - 2}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Container - Fixed height with proper scrolling */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 [scrollbar-gutter:stable]">
        <div className="px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <ChatWelcome userName={userName} />
          ) : (
            <div className="space-y-6">
              {messages.map((message, idx) => {
                // Use a stable, unique key where possible. Prefer message.id,
                // fall back to a combination of role+timestamp+index to avoid
                // duplicated or missing key warnings from React.
                const msgAny = message as any;
                const ts = msgAny.created_at || msgAny.updated_at || msgAny.timestamp || msgAny.time;
                const tsVal = ts ? (typeof ts === 'string' ? new Date(ts).getTime() : (ts instanceof Date ? ts.getTime() : String(ts))) : 'no-ts';
                const key = message.id || `${message.role}-${tsVal}-${idx}`;
                return (
                  <div key={key} className="space-y-2">
                    <ChatMessage 
                      message={message} 
                      onCopy={copyMessage}
                    />

                    {/* Render suggestion card when present in message metadata */}
                    {(message as any)?.metadata?.suggestion && (
                      <div className="mt-2">
                        <SuggestionCard
                          suggestion={(message as any).metadata.suggestion}
                          onPreview={(s: any) => setPreviewSuggestion(s)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Typing / Streaming Indicator - more visible when assistant is generating */}
              {(showTypingIndicator || isStreaming) && (
                <div className="flex gap-4 max-w-4xl mx-auto justify-start items-start">
                  <div className="flex-shrink-0">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gray-700 text-gray-300">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 max-w-3xl">
                    <div className="bg-gray-800 rounded-2xl px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.08s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.16s' }}></div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-200 font-medium">{agentName}</span>
                          <span className="text-xs text-gray-400">{isStreaming ? 'Assistant is thinking...' : 'Assistant is typing...'}</span>
                        </div>
                      </div>
                      {ragEnabled && (
                        <div className="flex items-center space-x-1 text-xs text-blue-400">
                          <Brain className="w-3 h-3" />
                          <span>Querying knowledge base...</span>
                        </div>
                      )}
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
        onSendMessage={handleSendMessage}
        onStopGeneration={onStopGeneration}
        isStreaming={isStreaming}
        disabled={disabled}
        placeholder={placeholder}
        isRecording={isRecording}
        setIsRecording={setIsRecording}
      />

      {/* Suggestion preview modal */}
      <SuggestionPreviewModal
        suggestion={previewSuggestion}
        onClose={() => setPreviewSuggestion(null)}
        onApply={async (s: any) => {
          try {
            // Simple POST to server route. Assumes session cookie auth is already present.
            const resp = await fetch('/api/apply-suggestion', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(s),
            });
            if (!resp.ok) {
              const text = await resp.text();
              toast({ title: 'Failed to apply suggestion', description: text || resp.statusText, type: 'error' });
              return;
            }
            const data = await resp.json();
            toast({ title: 'Suggestion applied', description: 'Changes were saved and audited', type: 'success' });

            // Optionally, append a system message to the chat to reflect the change
            if (typeof (window as any).__NEXUS_APPEND_SYSTEM_MESSAGE === 'function') {
              (window as any).__NEXUS_APPEND_SYSTEM_MESSAGE(`Applied suggestion to ${s.targetType} ${s.targetId}`);
            }
          } catch (err: any) {
            toast({ title: 'Error', description: String(err?.message || err), type: 'error' });
          }
        }}
      />
    </div>
  );
}
