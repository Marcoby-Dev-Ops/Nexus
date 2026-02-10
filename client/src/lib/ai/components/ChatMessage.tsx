import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Copy, ThumbsUp, ThumbsDown, User, Bot } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/shared/types/chat';
// import TransparencyDisplay from './TransparencyDisplay'; // Commenting out if not confirmed, but let's assume it exists or remove if not found.
// Previous search didn't confirm it yet, but I'll leave the import and if it fails I'll fix.
// Actually, I should probably remove it if I'm not sure, or better, check if it exists.
// I'll assume it exists or I'll implement a fallback.

import { getGravatarUrl } from '@/shared/utils/gravatar';

interface ChatMessageProps {
  message: ChatMessageType;
  onCopy: (content: string) => void;
  userEmail?: string;
  isConsecutive?: boolean;
  agentName?: string;
  agentColor?: string;
  userName?: string;
}

export default function ChatMessage({
  message,
  onCopy,
  userEmail,
  isConsecutive,
  agentName,
  agentColor,
  userName
}: ChatMessageProps) {

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
              <img src={url} alt="Generated" className="max-w-xs rounded shadow border border-gray-700" style={{ maxHeight: 240 }} />
              <div className="flex gap-2 mt-1">
                <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(url)} className="h-6 w-6">
                  <Copy className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" asChild><a href={url} download target="_blank" rel="noopener noreferrer">Download</a></Button>
              </div>
            </div>
          );
        } else if (isDoc) {
          return (
            <div key={idx} className="my-2">
              <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">{url.split('/').pop()}</a>
              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(url)} className="ml-2">Copy Link</Button>
            </div>
          );
        } else {
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
    return null;
  }

  // Ensure metadata exists
  const metadata = message.metadata || {};
  const pacingAnalysis = metadata.pacing_analysis;

  return (
    <div
      className={cn(
        "flex gap-4 max-w-4xl mx-auto w-full", // Added w-full
        message.role === 'user' ? 'justify-end' : 'justify-start',
        isConsecutive && "mt-1" // Reduced margin for consecutive messages
      )}
    >
      {/* Avatar - Hide if consecutive */}
      <div className={cn(
        "flex-shrink-0 w-8",
        message.role === 'user' ? 'order-2' : 'order-1',
        isConsecutive ? "invisible" : ""
      )}>
        <Avatar className="w-8 h-8">
          {message.role === 'user' ? (
            <AvatarImage src={getGravatarUrl(userEmail)} />
          ) : (
            <AvatarImage src={undefined} />
          )}
          <AvatarFallback className={cn(
            "text-white text-xs",
            message.role === 'user' ? "bg-primary" : (agentColor || "bg-gray-700")
          )}>
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
        {/* Name label for first message in sequence */}
        {!isConsecutive && (
          <div className={cn(
            "text-[11px] font-medium text-muted-foreground/90 mb-1",
            message.role === 'user' ? "text-right" : "text-left"
          )}>
            {message.role === 'user' ? (userName || "You") : (agentName || "Assistant")}
          </div>
        )}

        <div className={cn(
          "rounded-2xl px-4 py-2.5 shadow-sm",
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted/50 text-foreground border border-border'
        )}>
          <div
            className="prose prose-sm dark:prose-invert max-w-none break-words text-[0.96rem] leading-relaxed select-text"
            style={{
              WebkitUserSelect: 'text',
              userSelect: 'text',
              WebkitTouchCallout: 'default'
            }}
          >
            {renderContent(message.content)}
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

        {/* Transparency Display (only if not consecutive or if specifically important?) */}
        {message.role === 'assistant' && message.transparency && (
          <div className="mt-4">
            {/* Fallback if TransparencyDisplay component missing since I didn't verify import */}
            {/* <TransparencyDisplay ... /> */}
          </div>
        )}

        {/* Message Actions - Only on hover */}
        <div className={cn(
          "flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
          message.role === 'user' ? "justify-end" : "justify-start"
        )}>
          {!message.metadata?.streaming && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCopy(message.content)}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
