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
  setIsRecording
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="border-t border-gray-800 bg-gray-900 p-4 flex-shrink-0">
      <div className="max-w-4xl mx-auto">
        {/* Attachments Display */}
        {attachments.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 text-sm border border-gray-700"
                >
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="truncate max-w-[200px] text-gray-200">{attachment.name}</span>
                  <span className="text-gray-500 text-xs">
                    ({(attachment.size / 1024).toFixed(1)} KB)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
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
          <div className="relative bg-gray-800 rounded-2xl border border-gray-700 focus-within:border-gray-600 transition-colors">
            {/* Attachment Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
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
              placeholder={isStreaming ? 'Assistant is thinking...' : placeholder}
              disabled={disabled || isStreaming}
              className={cn(
                "min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent text-gray-100 placeholder-gray-400",
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
                  "text-gray-400 hover:text-gray-300",
                  isRecording && "text-red-400"
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
                  "rounded-full w-8 h-8 p-0",
                  isStreaming 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-blue-600 hover:bg-blue-700"
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

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 text-center mt-2">
            Nexus AI can make mistakes. Check important information.
          </p>
        </div>
      </div>
    </div>
  );
});

export default ChatInput;
