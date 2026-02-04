import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Copy, ThumbsUp, ThumbsDown, User, Bot } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/shared/types/chat';
import TransparencyDisplay from './TransparencyDisplay';

import { getGravatarUrl } from '@/shared/utils/gravatar';

interface ChatMessageProps {
  message: ChatMessageType;
  onCopy: (content: string) => void;
  userEmail?: string;
}

export default function ChatMessage({ message, onCopy, userEmail }: ChatMessageProps) {
  console.log('ChatMessage rendering:', {
    id: message.id,
    role: message.role,
    contentLength: message.content?.length || 0,
    content: message.content?.substring(0, 50) + '...'
  });


  // Helper: detect and render /media URLs as images or file links
  const renderContent = (content: string) => {
    // Regex for /media/filename.ext
    const mediaRegex = /(https?:\/\/[^\s]+\/media\/[^\s]+|\/media\/[^\s]+)/g;
    const parts = content.split(mediaRegex);
    return parts.map((part, idx) => {
      if (mediaRegex.test(part)) {
        const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(part);
        const isDoc = /\.(pdf|docx?|xlsx?|csv|pptx?|txt)$/i.test(part);
        const url = part.startsWith('http') ? part : `${window.location.origin}${part}`;
        if (isImage) {
          return (
            <div key={idx} className="my-2">
              <img src={url} alt="Generated" className="max-w-xs rounded shadow border border-gray-700" style={{maxHeight: 240}} />
              <div className="flex gap-2 mt-1">
                <Button size="xs" variant="ghost" onClick={() => navigator.clipboard.writeText(url)}>Copy Link</Button>
                <Button size="xs" variant="ghost" asChild><a href={url} download target="_blank" rel="noopener noreferrer">Download</a></Button>
              </div>
            </div>
          );
        } else if (isDoc) {
          return (
            <div key={idx} className="my-2">
              <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">{url.split('/').pop()}</a>
              <Button size="xs" variant="ghost" onClick={() => navigator.clipboard.writeText(url)} className="ml-2">Copy Link</Button>
              <Button size="xs" variant="ghost" asChild><a href={url} download>Download</a></Button>
            </div>
          );
        } else {
          // Unknown file type, just link
          return (
            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">{url}</a>
          );
        }
      }
      // Plain text, preserve line breaks
      return part.split('\n').map((line, i) => (
        <React.Fragment key={i}>{line}{i < part.split('\n').length - 1 && <br />}</React.Fragment>
      ));
    });
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
          {message.role === 'user' ? (
            <AvatarImage src={getGravatarUrl(userEmail)} />
          ) : (
            <AvatarImage src={undefined} />
          )}
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
            {message.role === 'assistant' ? renderContent(message.content) : formatMessage(message.content)}
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
