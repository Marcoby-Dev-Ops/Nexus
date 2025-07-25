import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Target, Lightbulb, Map, Play, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { ScrollArea } from '@/shared/components/ui/ScrollArea';
import { useFireCycleChatIntegration } from '@/hooks/useFireCycleChatIntegration';
import { FireCycleInsights } from './FireCycleInsights';
import type { FireCycleChatResponse } from '@/core/fire-cycle/fireCycleChatIntegration';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  fireCycleResponse?: FireCycleChatResponse;
}

interface FireCycleChatInterfaceProps {
  onThoughtCreated?: (thought: any) => void;
  className?: string;
}

export function FireCycleChatInterface({ onThoughtCreated, className }: FireCycleChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFireCycleInsights, setShowFireCycleInsights] = useState(false);
  const [currentFireCycleResponse, setCurrentFireCycleResponse] = useState<FireCycleChatResponse | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isReady,
    isAnalyzing,
    analyzeMessage,
    createThoughtFromMessage,
    error
  } = useFireCycleChatIntegration({
    autoTrigger: true,
    confidenceThreshold: 0.6,
    enableNotifications: true
  });

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Analyze the message for FIRE cycle triggers
      const fireCycleResponse = await analyzeMessage(inputValue);
      
      if (fireCycleResponse) {
        // Show FIRE cycle insights
        setCurrentFireCycleResponse(fireCycleResponse);
        setShowFireCycleInsights(true);
        
        // Add a system message about the FIRE cycle detection
        const systemMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `I detected this might be related to ${fireCycleResponse.firePhase} phase of the FIRE cycle. Let me help you develop this idea.`,
          isUser: false,
          timestamp: new Date(),
          fireCycleResponse
        };
        
        setMessages(prev => [...prev, systemMessage]);
      } else {
        // Regular AI response (you can integrate with your existing AI service here)
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `I understand you said: "${inputValue}". How can I help you with this?`,
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCreateThought = async (thoughtData: any) => {
    try {
      const thought = await createThoughtFromMessage(thoughtData.content);
      
      if (thought) {
        // Add a success message
        const successMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Great! I've created a thought for "${thoughtData.content}". You can now track and develop this idea further.`,
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, successMessage]);
        
        // Notify parent component
        onThoughtCreated?.(thought);
        
        // Hide the insights
        setShowFireCycleInsights(false);
        setCurrentFireCycleResponse(null);
      }
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Failed to create thought. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDismissInsights = () => {
    setShowFireCycleInsights(false);
    setCurrentFireCycleResponse(null);
  };

  const getFirePhaseIcon = (phase: string) => {
    switch (phase) {
      case 'focus': return <Target className="w-4 h-4" />;
      case 'insight': return <Lightbulb className="w-4 h-4" />;
      case 'roadmap': return <Map className="w-4 h-4" />;
      case 'execute': return <Play className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">FIRE Cycle Chat</CardTitle>
          </div>
          {isReady && (
            <Badge variant="outline" className="text-xs">
              Ready
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Share your ideas and I'll help you develop them through the FIRE cycle
        </p>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-4 py-2">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.isUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.fireCycleResponse && (
                      <div className="flex-shrink-0">
                        {getFirePhaseIcon(message.fireCycleResponse.firePhase)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* FIRE Cycle Insights */}
      {showFireCycleInsights && currentFireCycleResponse && (
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">FIRE Cycle Insights</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissInsights}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <FireCycleInsights
            response={currentFireCycleResponse}
            onCreateThought={handleCreateThought}
            onDismiss={handleDismissInsights}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="mx-4 mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your ideas, goals, or plans..."
            disabled={isTyping || !isReady}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping || !isReady}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {!isReady && (
          <p className="text-xs text-muted-foreground mt-2">
            Initializing FIRE cycle system...
          </p>
        )}
      </div>
    </div>
  );
} 