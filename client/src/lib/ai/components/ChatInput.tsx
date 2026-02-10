import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Button } from '@/shared/components/ui/Button';
import { Paperclip, Mic, MicOff, Send, StopCircle, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { FileAttachment } from '@/shared/types/chat';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  attachments: FileAttachment[];
  setAttachments: (attachments: FileAttachment[]) => void;
  onSendMessage: () => void;
  onStopGeneration?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  thinkingLabel?: string;
  busyElapsedSeconds?: number;
}

interface ChatInputRef {
  focus: () => void;
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({
  input,
  setInput,
  attachments,
  setAttachments,
  onSendMessage,
  onStopGeneration,
  isStreaming = false,
  disabled = false,
  placeholder = "Ask anything...",
  isRecording,
  setIsRecording,
  thinkingLabel = "Agent is thinking",
  busyElapsedSeconds = 0
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formatDuration = (totalSeconds: number) => {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Expose focus method to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    }
  }));

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.csv';
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        const newAttachments = files.map(file => ({
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          file,
          status: 'pending' as const,
        }));
        setAttachments([...attachments, ...newAttachments]);
      }
    };
    input.click();
  };

  const removeAttachment = (attachmentId: string) => {
    const attachment = attachments.find(a => a.id === attachmentId);
    if (attachment?.url) {
      URL.revokeObjectURL(attachment.url);
    }
    setAttachments(attachments.filter(a => a.id !== attachmentId));
  };

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 flex-shrink-0">
      <div className="max-w-4xl mx-auto">
        {/* Attachments Display */}
        {attachments.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm border border-border"
                >
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate max-w-[200px] text-foreground">{attachment.name}</span>
                  <span className="text-muted-foreground text-xs">
                    ({(attachment.size / 1024).toFixed(1)} KB)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          {/* Input Container */}
          <div className="relative bg-muted/30 focus-within:bg-muted/50 rounded-2xl border border-input focus-within:border-ring transition-colors">
            {/* Attachment Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={disabled}
              onClick={handleFileUpload}
            >
              <Plus className="w-4 h-4" />
            </Button>

            {/* Text Input */}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isStreaming ? `${thinkingLabel}...` : placeholder}
              disabled={disabled || isStreaming}
              className={cn(
                "min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground",
                "pl-12 pr-20 py-3 focus:ring-0 focus:outline-none",
                "text-base leading-relaxed"
              )}
              rows={1}
            />

            {/* Action Buttons */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* Voice Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRecording(!isRecording)}
                disabled={disabled || isStreaming}
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  isRecording && "text-destructive"
                )}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>

              {/* Send/Stop Button */}
              <Button
                size="sm"
                onClick={isStreaming ? onStopGeneration : onSendMessage}
                disabled={disabled || (!isStreaming && !input.trim() && attachments.length === 0)}
                className={cn(
                  "rounded-full w-8 h-8 p-0 transition-colors",
                  isStreaming
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {isStreaming ? (
                  <StopCircle className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {isStreaming && (
            <div className="mt-2 flex items-center justify-between rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>{thinkingLabel}...</span>
              </div>
              <span className="font-medium text-foreground">{formatDuration(busyElapsedSeconds)}</span>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center mt-2">
            Nexus AI can make mistakes. Check important information.
          </p>
        </div>
      </div>
    </div>
  );
});

export default ChatInput;
