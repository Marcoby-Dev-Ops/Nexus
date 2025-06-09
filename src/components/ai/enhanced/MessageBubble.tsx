import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Copy, 
  Edit, 
  Trash2, 
  RefreshCw, 
  ThumbsUp, 
  ThumbsDown, 
  MoreHorizontal,
  Check,
  CheckCheck,
  AlertCircle,
  Clock
} from 'lucide-react';
import type { ChatMessage } from '@/lib/types/chat';

/**
 * Modern message bubble with enhanced features
 */
interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onCopy?: (content: string) => void;
}

/**
 * Status indicator component
 */
const MessageStatus: React.FC<{ status: ChatMessage['status'] }> = ({ status }) => {
  const statusConfig = {
    sending: { icon: Clock, className: 'text-muted-foreground animate-pulse', label: 'Sending' },
    sent: { icon: Check, className: 'text-muted-foreground', label: 'Sent' },
    delivered: { icon: CheckCheck, className: 'text-primary', label: 'Delivered' },
    error: { icon: AlertCircle, className: 'text-destructive', label: 'Failed' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1 text-xs">
      <Icon className={`w-3 h-3 ${config.className}`} />
      <span className={config.className}>{config.label}</span>
    </div>
  );
};

/**
 * Typing animation component
 */
const TypingAnimation: React.FC = () => (
  <div className="flex items-center gap-1 p-3">
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
    <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
  </div>
);

/**
 * Streaming text component with typewriter effect
 */
const StreamingText: React.FC<{ content: string; isComplete: boolean }> = ({ 
  content, 
  isComplete 
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    if (isComplete) {
      setDisplayedContent(content);
      return;
    }

    const timer = setInterval(() => {
      if (indexRef.current < content.length) {
        setDisplayedContent(content.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(timer);
      }
    }, 20); // Adjust speed as needed

    return () => clearInterval(timer);
  }, [content, isComplete]);

  return (
    <div className="relative">
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {displayedContent}
        {!isComplete && (
          <span className="animate-pulse text-primary">|</span>
        )}
      </p>
    </div>
  );
};

/**
 * Message actions dropdown
 */
const MessageActions: React.FC<{
  message: ChatMessage;
  isCurrentUser: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onCopy?: (content: string) => void;
}> = ({ message, isCurrentUser, onEdit, onDelete, onRetry, onCopy }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowActions(!showActions)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-muted transition-all"
        aria-label="Message actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      
      {showActions && (
        <div className="absolute top-8 right-0 bg-popover border border-border rounded-md shadow-lg z-10 min-w-[120px]">
          <button
            onClick={() => {
              onCopy?.(message.content);
              setShowActions(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted"
          >
            <Copy className="w-3 h-3" />
            Copy
          </button>
          
          {isCurrentUser && onEdit && (
            <button
              onClick={() => {
                const newContent = prompt('Edit message:', message.content);
                if (newContent && newContent !== message.content) {
                  onEdit(message.id, newContent);
                }
                setShowActions(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted"
            >
              <Edit className="w-3 h-3" />
              Edit
            </button>
          )}
          
          {message.status === 'error' && onRetry && (
            <button
              onClick={() => {
                onRetry(message.id);
                setShowActions(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-primary"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
          
          {isCurrentUser && onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Delete this message?')) {
                  onDelete(message.id);
                }
                setShowActions(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-destructive"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Message reactions component
 */
const MessageReactions: React.FC<{
  reactions?: { emoji: string; count: number; users: string[] }[];
  onReact?: (emoji: string) => void;
}> = ({ reactions, onReact }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex gap-1 mt-2">
      {reactions.map((reaction: { emoji: string; count: number; users: string[] }) => (
        <button
          key={reaction.emoji}
          onClick={() => onReact?.(reaction.emoji)}
          className="flex items-center gap-1 px-2 py-1 bg-muted hover:bg-muted/80 rounded-full text-xs transition-colors"
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
      
      <button
        onClick={() => {
          const emoji = prompt('Add reaction (emoji):');
          if (emoji) onReact?.(emoji);
        }}
        className="flex items-center px-2 py-1 border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 rounded-full text-xs transition-colors"
      >
        +
      </button>
    </div>
  );
};

/**
 * Main MessageBubble component
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  showAvatar = true,
  showTimestamp = true,
  onEdit,
  onDelete,
  onRetry,
  onReact,
  onCopy,
}) => {
  const isError = message.status === 'error';
  const isThinking = message.type === 'thinking';
  
  return (
    <div className={`flex items-start gap-3 group ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {showAvatar && (
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
          isCurrentUser 
            ? 'bg-primary' 
            : 'bg-gradient-to-br from-primary to-secondary'
        }`}>
          {isCurrentUser ? (
            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )}
        </div>
      )}

      {/* Message content */}
      <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block relative ${
          isCurrentUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-foreground'
        } rounded-2xl px-4 py-3 break-words ${
          isError ? 'border border-destructive' : ''
        }`}>
          
          {/* Thinking animation */}
          {isThinking ? (
            <TypingAnimation />
          ) : message.type === 'streaming' ? (
            <StreamingText 
              content={message.content} 
              isComplete={message.metadata?.isComplete || false} 
            />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}

          {/* Message actions */}
          <MessageActions
            message={message}
            isCurrentUser={isCurrentUser}
            onEdit={onEdit}
            onDelete={onDelete}
            onRetry={onRetry}
            onCopy={onCopy}
          />
        </div>

        {/* Message metadata */}
        <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
          isCurrentUser ? 'justify-end' : 'justify-start'
        }`}>
          {showTimestamp && (
            <time dateTime={message.timestamp.toISOString()}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </time>
          )}
          
          {isCurrentUser && (
            <MessageStatus status={message.status} />
          )}
        </div>

        {/* Reactions */}
        <MessageReactions 
          reactions={message.metadata?.reactions} 
          onReact={(emoji) => onReact?.(message.id, emoji)}
        />
      </div>
    </div>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.object.isRequired,
  isCurrentUser: PropTypes.bool.isRequired,
  showAvatar: PropTypes.bool,
  showTimestamp: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onRetry: PropTypes.func,
  onReact: PropTypes.func,
  onCopy: PropTypes.func,
};

export default MessageBubble; 