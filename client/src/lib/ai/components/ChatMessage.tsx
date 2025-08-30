import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Copy, ThumbsUp, ThumbsDown, User, Bot } from 'lucide-react';
import { cn } from '@/shared/utils/styles';
import type { ChatMessage as ChatMessageType } from '@/shared/types/chat';
import TransparencyDisplay from './TransparencyDisplay';

interface ChatMessageProps {
  message: ChatMessageType;
  onCopy: (content: string) => void;
}

export default function ChatMessage({ message, onCopy }: ChatMessageProps) {
  console.log('ChatMessage rendering:', {
    id: message.id,
    role: message.role,
    contentLength: message.content?.length || 0,
    content: message.content?.substring(0, 50) + '...'
  });

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Ensure message has required properties
  if (!message || !message.content || !message.role) {
    console.log('ChatMessage returning null due to missing properties:', {
      hasMessage: !!message,
      hasContent: !!message?.content,
      hasRole: !!message?.role
    });
    return null;
  }

  // Ensure metadata exists and has the required structure
  const metadata = message.metadata || {};
  const pacingAnalysis = metadata.pacing_analysis;

  return (
    <div
      className={cn(
        "flex gap-4 max-w-4xl mx-auto",
        message.role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0",
        message.role === 'user' ? 'order-2' : 'order-1'
      )}>
        <Avatar className="w-8 h-8">
          <AvatarImage 
            src={message.role === 'user' ? undefined : undefined} 
          />
          <AvatarFallback className="bg-gray-700 text-gray-300">
            {message.role === 'user' ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-3xl",
        message.role === 'user' ? 'order-1' : 'order-2'
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-3",
          message.role === 'user' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-800 text-gray-100'
        )}>
          <div className="prose prose-invert max-w-none">
            {formatMessage(message.content)}
          </div>
          
          {/* Pacing Analysis Badge */}
          {pacingAnalysis && pacingAnalysis.follows_pacing_rules !== undefined && (
            <div className="mt-2">
              <Badge 
                variant={pacingAnalysis.follows_pacing_rules ? "default" : "secondary"}
                className="text-xs"
              >
                {pacingAnalysis.follows_pacing_rules ? "Good pacing" : "Pacing adjusted"}
              </Badge>
            </div>
          )}
        </div>

        {/* Transparency Display for AI responses */}
        {message.role === 'assistant' && message.transparency && (
          <div className="mt-4">
            <TransparencyDisplay 
              transparency={message.transparency}
              className="bg-gray-900 border-gray-700"
            />
          </div>
        )}

        {/* Message Actions */}
        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(message.content)}
            className="text-gray-400 hover:text-gray-300"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-300"
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-300"
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
