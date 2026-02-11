import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Copy, ThumbsUp, ThumbsDown, User, Bot } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ChatMessage as ChatMessageType, FileAttachment } from '@/shared/types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // Or any other style

import { getGravatarUrl } from '@/shared/utils/gravatar';
import { ATTACHMENT_ONLY_PLACEHOLDER } from '@/shared/constants/chat';

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

  // Ensure message has required properties
  if (!message || !message.content || !message.role) {
    return null;
  }

  // Ensure metadata exists
  const metadata = message.metadata || {};
  const pacingAnalysis = metadata.pacing_analysis;
  const messageAttachments = Array.isArray(metadata.attachments)
    ? (metadata.attachments as FileAttachment[])
    : [];
  const hasAttachments = messageAttachments.length > 0;
  const isAttachmentOnlyMessage = message.content === ATTACHMENT_ONLY_PLACEHOLDER && hasAttachments;
  const renderedContent = isAttachmentOnlyMessage ? 'Attached files:' : message.content;

  // Custom component to handle media URLs within markdown
  const MediaLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const mediaRegex = /(\/media\/[^\s]+|https?:\/\/[^\s]+\/media\/[^\s]+)/;
    if (mediaRegex.test(href)) {
      const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(href);
      const isDoc = /\.(pdf|docx?|xlsx?|csv|pptx?|txt)$/i.test(href);
      const url = href.startsWith('http') ? href : `${window.location.origin}${href}`;

      if (isImage) {
        return (
          <div className="my-2 not-prose">
            <img src={url} alt="Generated" className="max-w-xs rounded shadow border border-border" style={{ maxHeight: 240 }} />
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
          <div className="my-2 not-prose flex items-center">
            <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80">{href.split('/').pop()}</a>
            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(url)} className="ml-2 h-8 px-2">Copy Link</Button>
          </div>
        );
      }
    }
    return <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80">{children}</a>;
  };

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
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                a: MediaLink as any,
                // Ensure list items and other block elements look good
                p: ({ children }: { children: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }: { children: React.ReactNode }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                ol: ({ children }: { children: React.ReactNode }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                li: ({ children }: { children: React.ReactNode }) => <li className="mb-1">{children}</li>,
                code: ({ node, inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <div className="relative group/code my-2">
                      <pre className={cn("rounded-md p-3 overflow-x-auto bg-black/30 border border-border/50", className)}>
                        <code {...props}>{children}</code>
                      </pre>
                    </div>
                  ) : (
                    <code className={cn("bg-muted px-1.5 py-0.5 rounded text-xs font-mono", className)} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {renderedContent}
            </ReactMarkdown>
          </div>

          {hasAttachments && (
            <div className="mt-3 flex flex-col gap-2">
              {messageAttachments.map((attachment) => {
                const link = attachment.downloadUrl || attachment.url;
                return (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-background/60 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {link ? (
                      <Button size="sm" variant="outline" asChild>
                        <a href={link} target="_blank" rel="noopener noreferrer">Open</a>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No link</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

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
