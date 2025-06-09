import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  Image, 
  FileText, 
  X,
  Plus,
  Smile
} from 'lucide-react';

/**
 * Enhanced chat input with modern features
 */
interface ChatInputProps {
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  enableVoiceInput?: boolean;
  enableFileUpload?: boolean;
  allowedFileTypes?: string[];
  maxFileSize?: number; // in MB
  className?: string;
}

/**
 * File preview component
 */
const FilePreview: React.FC<{
  file: File;
  onRemove: () => void;
}> = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <div className="relative inline-block bg-muted rounded-lg p-3 mr-2 mb-2">
      <div className="flex items-center gap-2">
        {isImage && preview ? (
          <img src={preview} alt={file.name} className="w-8 h-8 object-cover rounded" />
        ) : (
          <FileText className="w-6 h-6 text-muted-foreground" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
        <button
          onClick={onRemove}
          className="p-1 hover:bg-muted-foreground/20 rounded-full transition-colors"
          aria-label="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Voice recording component
 */
const VoiceRecorder: React.FC<{
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
}> = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    onCancel();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (!isRecording) {
    return (
      <button
        onClick={startRecording}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Start voice recording"
      >
        <Mic className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium">
          {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
        </span>
      </div>
      <button
        onClick={stopRecording}
        className="p-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
      <button
        onClick={cancelRecording}
        className="p-1 hover:bg-muted rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Main ChatInput component
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder = "Type your message...",
  disabled = false,
  maxLength = 4000,
  enableVoiceInput = true,
  enableFileUpload = true,
  allowedFileTypes = ['image/*', 'text/*', '.pdf', '.doc', '.docx'],
  maxFileSize = 10,
  className = '',
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Handle file selection
  const handleFileSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB.`);
        return false;
      }
      
      // Check file type
      const isValidType = allowedFileTypes.some(type => {
        if (type.includes('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.name.toLowerCase().endsWith(type.toLowerCase()) || file.type === type;
      });
      
      if (!isValidType) {
        alert(`File type ${file.type} is not allowed.`);
        return false;
      }
      
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Handle voice recording
  const handleVoiceRecordingComplete = (audioBlob: Blob) => {
    const audioFile = new File([audioBlob], 'voice_message.webm', {
      type: 'audio/webm',
    });
    setAttachments(prev => [...prev, audioFile]);
    setShowVoiceRecorder(false);
  };

  // Handle send message
  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || isSending || disabled) return;

    try {
      setIsSending(true);
      await onSendMessage(message.trim(), attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (message.trim() || attachments.length > 0) && !isSending && !disabled;

  return (
    <div className={`border-t border-border bg-background p-4 ${className}`}>
      {/* File attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap">
            {attachments.map((file, index) => (
              <FilePreview
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Voice recorder */}
      {showVoiceRecorder && (
        <div className="mb-3">
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecordingComplete}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}

      {/* Main input area */}
      <div 
        className={`flex items-end gap-2 bg-muted rounded-xl p-3 border-2 transition-colors ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-transparent focus-within:border-primary'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Attachment button */}
        {enableFileUpload && (
          <div className="relative">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-muted-foreground/10 transition-colors"
              aria-label="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={allowedFileTypes.join(',')}
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        )}

        {/* Text input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            maxLength={maxLength}
            className="w-full bg-transparent resize-none border-none outline-none text-foreground placeholder-muted-foreground text-sm leading-relaxed min-h-[24px] max-h-[120px]"
            rows={1}
          />
          
          {/* Character count */}
          {message.length > maxLength * 0.8 && (
            <div className="text-xs text-muted-foreground text-right mt-1">
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Voice input button */}
        {enableVoiceInput && !showVoiceRecorder && (
          <button
            onClick={() => setShowVoiceRecorder(true)}
            className="p-2 rounded-lg hover:bg-muted-foreground/10 transition-colors"
            aria-label="Voice input"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`p-2 rounded-lg transition-colors ${
            canSend
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Paperclip className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium text-primary">Drop files here to attach</p>
          </div>
        </div>
      )}
    </div>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  maxLength: PropTypes.number,
  enableVoiceInput: PropTypes.bool,
  enableFileUpload: PropTypes.bool,
  allowedFileTypes: PropTypes.arrayOf(PropTypes.string),
  maxFileSize: PropTypes.number,
  className: PropTypes.string,
};

export default ChatInput; 