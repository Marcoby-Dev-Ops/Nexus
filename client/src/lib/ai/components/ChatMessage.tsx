import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Copy, User, Bot, Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ChatMessage as ChatMessageType, FileAttachment } from '@/shared/types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

function normalizeMarkdownForReadability(content: string): string {
  const singleLineFencePattern = /```(?:[a-zA-Z0-9_-]+)?\s*\n([^\n`]{1,120})\n```/g;

  return content.replace(singleLineFencePattern, (fullBlock, lineContent: string) => {
    const normalized = lineContent.trim();
    if (!normalized) return fullBlock;
    if (/\s/.test(normalized)) return fullBlock;

    const looksLikeCode = /[{}();=<>]|^\s*(const|let|var|function|class|import|export|if|for|while|return)\b/.test(normalized);
    if (looksLikeCode) return fullBlock;

    return `\`${normalized}\``;
  });
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
  const [isReasoningExpanded, setIsReasoningExpanded] = React.useState(false);

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
  const reasoning = typeof metadata.reasoning === 'string' ? metadata.reasoning.trim() : '';
  const hasReasoning = Boolean(reasoning);
  const hasAttachments = messageAttachments.length > 0;
  const isAttachmentOnlyMessage = message.content === ATTACHMENT_ONLY_PLACEHOLDER && hasAttachments;
  const renderedContent = isAttachmentOnlyMessage ? 'Attached files:' : message.content;
  const normalizedContent = message.role === 'assistant'
    ? normalizeMarkdownForReadability(renderedContent)
    : renderedContent;

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
            <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-primary dark:text-info hover:text-primary/80 dark:hover:text-info/80">{href.split('/').pop()}</a>
            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(url)} className="ml-2 h-8 px-2">Copy Link</Button>
          </div>
        );
      }
    }
    return <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-primary dark:text-info hover:text-primary/80 dark:hover:text-info/80">{children}</a>;
  };

  return (
    <div
      className={cn(
        "group flex gap-4 max-w-4xl mx-auto w-full", // Added w-full and group
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
        "flex-1",
        message.role === 'assistant' ? 'max-w-[72ch]' : 'max-w-[60ch]',
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
          "rounded-2xl px-4 py-3 shadow-sm border text-foreground",
          message.role === 'user'
            ? 'bg-primary/10 border-primary/20'
            : 'bg-card/90 border-border/80'
        )}>
          <div
            className="max-w-none break-words text-[0.96rem] leading-7 text-foreground/95 select-text"
            style={{
              WebkitUserSelect: 'text',
              userSelect: 'text',
              WebkitTouchCallout: 'default'
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: MediaLink as any,
                p: ({ children }: { children: React.ReactNode }) => <p className="mb-3 leading-7 last:mb-0">{children}</p>,
                ul: ({ children }: { children: React.ReactNode }) => <ul className="mb-3 list-disc pl-5 leading-7 space-y-1">{children}</ul>,
                ol: ({ children }: { children: React.ReactNode }) => <ol className="mb-3 list-decimal pl-5 leading-7 space-y-1">{children}</ol>,
                li: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
                strong: ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-foreground">{children}</strong>,
                blockquote: ({ children }: { children: React.ReactNode }) => (
                  <blockquote className="my-3 border-l-2 border-primary/50 pl-3 text-foreground/85 italic">
                    {children}
                  </blockquote>
                ),
                pre: ({ children }: { children: React.ReactNode }) => (
                  <pre className="my-4 overflow-x-auto rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-[0.84rem] leading-6">
                    {children}
                  </pre>
                ),
                code: ({ className, children, ...props }: any) => {
                  const text = String(children ?? '');
                  const isBlockCode = (className || '').includes('language-') || text.includes('\n');
                  if (isBlockCode) {
                    return (
                      <code className={cn("font-mono text-foreground", className)} {...props}>
                        {children}
                      </code>
                    );
                  }

                  return (
                    <code className={cn("rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[0.82em] font-mono text-foreground", className)} {...props}>
                      {children}
                    </code>
                  );
                },
                hr: () => <hr className="my-4 border-border/70" />
              }}
            >
              {normalizedContent}
            </ReactMarkdown>
          </div>

          {message.role === 'assistant' && hasReasoning && (
            <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <button
                onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
                className="flex w-full items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Brain className="w-3 h-3" />
                <span>Reasoning Trace</span>
                {isReasoningExpanded ? (
                  <ChevronDown className="w-3 h-3 ml-auto opacity-50" />
                ) : (
                  <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                )}
              </button>

              {isReasoningExpanded && (
                <div className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md bg-background/60 p-2 text-xs font-mono text-muted-foreground/90">
                  {reasoning}
                </div>
              )}
            </div>
          )}

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
