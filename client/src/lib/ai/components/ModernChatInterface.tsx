/**
 * Modern Chat Interface
 * 
 * A ChatGPT-inspired clean, minimalist chat interface
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { useToast } from '@/shared/ui/components/Toast';
import { Bot, Brain, Database } from 'lucide-react';
import { cn } from '@/shared/utils/styles';
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
  agentId?: string;
  agentName?: string;
  ragEnabled?: boolean;
  ragConfidence?: number;
  knowledgeTypes?: string[];
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
}: ModernChatInterfaceProps) {
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
    console.log('ModernChatInterface received messages:', messages);
    console.log('Messages count in interface:', messages.length);
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
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  onCopy={copyMessage}
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
