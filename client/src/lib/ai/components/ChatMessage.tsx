import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Copy, ThumbsUp, ThumbsDown, User, Bot, Paperclip, Download } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ChatMessage as ChatMessageType, FileAttachment } from '@/shared/types/chat';
import { ATTACHMENT_ONLY_PLACEHOLDER } from '@/shared/constants/chat';
import TransparencyDisplay from './TransparencyDisplay';

interface ChatMessageProps {
  message: ChatMessageType;
  onCopy: (content: string) => void;
}

export default function ChatMessage({ message, onCopy }: ChatMessageProps) {
  // Defensive checks before accessing properties
  const hasMessage = !!message;
  const hasContent = !!message?.content;
  const hasRole = !!message?.role;

  // Log minimal safe info for debugging
  if (hasMessage) {
    try {
      const safeId = (message as any).id || 'no-id';
      const safeRole = (message as any).role || 'no-role';
      const safeContentPreview = hasContent ? `${String(message!.content).substring(0, 50)}...` : 'no-content';
      console.log('ChatMessage rendering:', { id: safeId, role: safeRole, content: safeContentPreview });
    } catch (e) {
      // swallow logging errors
    }
  }

  const formatMessage = (content: string) => {
    const contentLines = content.split('\n');
    return contentLines.map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < contentLines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Conservative phone regex: requires at least 7 digits (allowing spaces, dashes, parentheses, plus)
  const PHONE_REGEX = /\+?[0-9](?:[0-9()\-\.\s]{5,})[0-9]/g;

  function maskPhone(phone: string) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 4) return '••••';
    const keep = 4;
    const masked = digits.slice(0, -keep).replace(/./g, '•') + digits.slice(-keep);
    // Preserve original formatting minimally by showing masked + last 4
    return masked;
  }

  function PhoneReveal({ phone }: { phone: string }) {
    const [revealed, setRevealed] = useState(false);

    return (
      <span className="inline-flex items-center gap-2">
        <span className="font-mono text-sm text-gray-200">{revealed ? phone : maskPhone(phone)}</span>
        {!revealed ? (
          <Button size="sm" variant="ghost" onClick={() => setRevealed(true)} className="text-xs text-blue-400">Reveal</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(phone); }} className="text-xs text-gray-300">Copy</Button>
        )}
      </span>
    );
  }

  const renderWithPhoneReveal = (content: string) => {
    // Find phone-like substrings and render interactive reveals
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const matches = [...content.matchAll(PHONE_REGEX)];
    if (matches.length === 0) return formatMessage(content);

    matches.forEach((m, i) => {
      const match = m[0];
      const idx = m.index || 0;
      if (idx > lastIndex) {
        const pre = content.slice(lastIndex, idx);
        parts.push(...formatMessage(pre));
      }
      parts.push(<PhoneReveal key={`phone-${i}-${idx}`} phone={match} />);
      lastIndex = idx + match.length;
    });

    if (lastIndex < content.length) {
      parts.push(...formatMessage(content.slice(lastIndex)));
    }

    return parts;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Ensure message has required properties
  if (!hasMessage || !hasContent || !hasRole) {
    console.log('ChatMessage returning null due to missing properties:', { hasMessage, hasContent, hasRole });
    return null;
  }

  // Ensure metadata exists and has the required structure
  const metadata = message.metadata || {};
  const pacingAnalysis = metadata.pacing_analysis;
  const attachments: FileAttachment[] = Array.isArray(metadata.attachments) ? metadata.attachments : [];
  const hidePlaceholderContent = attachments.length > 0 && message.content === ATTACHMENT_ONLY_PLACEHOLDER;

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
          {!hidePlaceholderContent && (
            <div className="prose prose-invert max-w-none">
              {renderWithPhoneReveal(String(message.content))}
            </div>
          )}

          {attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {attachments.map((attachment) => {
                const downloadLink = attachment.downloadUrl || attachment.url;
                const linkProps = downloadLink
                  ? { href: downloadLink, download: attachment.name }
                  : {
                      href: '#',
                      onClick: (event: React.MouseEvent) => event.preventDefault(),
                      'aria-disabled': true,
                    };
                return (
                  <a
                    key={attachment.id}
                    {...linkProps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900/80 px-3 py-2 text-sm text-gray-200 hover:border-gray-500 hover:bg-gray-800"
                  >
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span className="truncate max-w-[160px]" title={attachment.name}>{attachment.name}</span>
                    {attachment.size ? (
                      <span className="text-xs text-gray-500">{formatFileSize(attachment.size)}</span>
                    ) : null}
                    <Download className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
                  </a>
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
            onClick={() => message.content && onCopy(message.content)}
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
