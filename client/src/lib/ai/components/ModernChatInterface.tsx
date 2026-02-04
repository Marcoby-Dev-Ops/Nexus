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
  userEmail,
  agentId: _agentId = "executive-assistant",
  agentName = "Executive Assistant",
  ragEnabled = false,
  ragConfidence = 0,
  knowledgeTypes = [],
  ragSources = [],
  ragRecommendations = [],
  businessContext = null
}: ModernChatInterfaceProps) {
  // show preferred tone if provided
  const toneLabel = (businessContext && (businessContext.user as any)?.preferredTone) || 'friendly';
  const [contextOpen, setContextOpen] = useState(false);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<{ focus: () => void }>(null);
  const { toast } = useToast();

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

  // Debug: Monitor messages prop
  useEffect(() => {
    logger.debug('ModernChatInterface received messages', { count: messages.length });
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (!input.trim() && attachments.length === 0) return;
    
    onSendMessage(input.trim(), attachments);
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
              Connected · Tone: <span className="text-gray-200">{toneLabel}</span>
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
                {/* Toggle business context panel */}
                <button
                  onClick={() => setContextOpen(!contextOpen)}
                  className="ml-3 text-xs text-gray-300 hover:text-white bg-gray-800 px-2 py-1 rounded"
                >
                  {contextOpen ? 'Hide context' : 'Show context'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Business Context Panel */}
      {ragEnabled && contextOpen && (
        <div className="bg-gray-850 border-b border-gray-700 px-4 py-3 text-sm text-gray-200">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-300">Business context</div>
              <div className="text-xs text-gray-400">{ragSources.length} sources • {knowledgeTypes.length} types</div>
            </div>

            {/* Top recommendations */}
            {ragRecommendations && ragRecommendations.length > 0 && (
              <div>
                <div className="text-xs text-gray-300 mb-1">Top recommendations</div>
                <ul className="list-disc ml-4 text-gray-200">
                  {ragRecommendations.slice(0, 3).map((rec, i) => (
                    <li key={i} className="text-xs">{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top sources preview */}
            {ragSources && ragSources.length > 0 && (
              <div>
                <div className="text-xs text-gray-300 mb-1">Sources</div>
                <div className="grid grid-cols-1 gap-2">
                  {ragSources.slice(0, 3).map((s, idx) => (
                    <div key={idx} className="text-xs text-gray-200 bg-gray-800 rounded px-3 py-2 border border-gray-700">
                      <div className="truncate">{(s?.content || s?.title || s?.name || '').toString().slice(0, 240)}</div>
                      {s?.source && <div className="text-xxs text-gray-400 mt-1">{s.source}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Small business context summary (if any) */}
            {businessContext && Object.keys(businessContext).length > 0 && (
              <div className="text-xs text-gray-300">
                <div className="mb-1">Context snapshot</div>
                <pre className="text-[11px] text-gray-200 bg-gray-800 p-2 rounded max-h-40 overflow-auto">{JSON.stringify(businessContext, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Container - Fixed height with proper scrolling */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 [scrollbar-gutter:stable]">
        <div className="px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <ChatWelcome userName={userName} />
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  onCopy={copyMessage}
                  userEmail={userEmail}
                />
              ))}
              
              {/* Typing Indicator */}
              {showTypingIndicator && (
                <div className="flex gap-4 max-w-4xl mx-auto justify-start">
                  <div className="flex-shrink-0">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gray-700 text-gray-300">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 max-w-3xl">
                    <div className="bg-gray-800 rounded-2xl px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
    </div>
  );
}
