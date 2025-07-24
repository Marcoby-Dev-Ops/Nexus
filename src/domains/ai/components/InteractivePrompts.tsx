/**
 * @file InteractivePrompts.tsx
 * @description Interactive prompts component for Nexus Idea Management
 * Based on Marcoby Nexus: Interactive prompts diagram
 * Handles Text, Speech, Copy/Paste, Upload interactions
 */

import React, { useState, useRef, useCallback } from 'react';
import { Mic, Upload, MessageCircle, Copy, Send, FileText, Image } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Alert } from '@/shared/components/ui/Alert';
import { thoughtsService } from '@/domains/help-center/knowledge/features/lib/services/thoughtsService';
import type { InteractionMethod, ThoughtCategory } from '@/domains/help-center/knowledge/features/lib/types/thoughts';
import { useAuth } from '@/core/auth/AuthProvider';

interface InteractivePromptsProps {
  onThoughtCreated?: (thoughtId: string) => void;
  className?: string;
}

interface InputState {
  content: string;
  method: InteractionMethod;
  isProcessing: boolean;
  file?: File;
}

const INTERACTION_METHODS = [
  {
    id: 'text' as InteractionMethod,
    icon: MessageCircle,
    label: 'Text Input',
    description: 'Type your thoughts directly',
    placeholder: 'Share your idea, task, or reminder...'
  },
  {
    id: 'speech' as InteractionMethod,
    icon: Mic,
    label: 'Voice Input',
    description: 'Speak your thoughts aloud',
    placeholder: 'Click to start recording...'
  },
  {
    id: 'copy_paste' as InteractionMethod,
    icon: Copy,
    label: 'Copy & Paste',
    description: 'Paste content from clipboard',
    placeholder: 'Paste your content here...'
  },
  {
    id: 'upload' as InteractionMethod,
    icon: Upload,
    label: 'File Upload',
    description: 'Upload documents or media',
    placeholder: 'Upload files to extract ideas...'
  }
];

export const InteractivePrompts: React.FC<InteractivePromptsProps> = ({
  onThoughtCreated,
  className = ''
}) => {
  const [activeMethod, setActiveMethod] = useState<InteractionMethod>('text');
  const [inputState, setInputState] = useState<InputState>({
    content: '',
    method: 'text',
    isProcessing: false
  });
  const [isRecording, setIsRecording] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { user } = useAuth();

  // ====== Voice Recording ======
  
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error starting recording: ', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const processVoiceInput = async (audioBlob: Blob) => {
    setInputState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Mock voice-to-text processing (replace with real Speech-to-Text API)
      const mockTranscription = "This is a transcribed voice input about implementing a new feature";
      
      setInputState(prev => ({
        ...prev,
        content: mockTranscription,
        method: 'speech',
        isProcessing: false
      }));
      
      // Auto-suggest categories based on voice content
      await generateSuggestions(mockTranscription);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error processing voice input: ', error);
      setInputState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // ====== File Upload ======
  
  const handleFileUpload = useCallback(async (file: File) => {
    setInputState(prev => ({ ...prev, isProcessing: true, file }));
    
    try {
      let extractedContent = '';
      
      if (file.type.startsWith('text/')) {
        extractedContent = await file.text();
      } else if (file.type.startsWith('image/')) {
        // Mock OCR processing (replace with real OCR API)
        extractedContent = `Image uploaded: ${file.name}. Contains text about business processes and workflows.`;
      } else if (file.type.includes('pdf')) {
        // Mock PDF text extraction (replace with real PDF parser)
        extractedContent = `PDF document: ${file.name}. Contains strategic planning information and project details.`;
      } else {
        extractedContent = `File uploaded: ${file.name}. Ready for processing.`;
      }
      
      setInputState(prev => ({
        ...prev,
        content: extractedContent,
        method: 'upload',
        isProcessing: false
      }));
      
      await generateSuggestions(extractedContent);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error processing file: ', error);
      setInputState(prev => ({ ...prev, isProcessing: false }));
    }
  }, []);

  // ====== Content Processing ======
  
  const generateSuggestions = async (content: string) => {
    // Mock AI-powered suggestions (replace with real AI API)
    const mockSuggestions = [
      'Break this into actionable tasks',
      'Set a timeline for implementation',
      'Identify key stakeholders',
      'Create milestone checkpoints'
    ];
    setSuggestions(mockSuggestions);
  };

  const handlePasteContent = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setInputState(prev => ({
        ...prev,
        content: clipboardText,
        method: 'copy_paste'
      }));
      await generateSuggestions(clipboardText);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error reading clipboard: ', error);
    }
  }, []);

  // ====== Thought Creation ======
  
  const submitThought = async () => {
    if (!inputState.content.trim()) return;
    
    setInputState(prev => ({ ...prev, isProcessing: true }));
    setError(null);
    
    try {
      // Get company_id from user profile
      

      const thought = await thoughtsService.createThought({
        content: inputState.content,
        interactionmethod: inputState.method,
        status: 'not_started',
        companyid: userProfile?.company_id || undefined,
        category: 'idea'
      });
      
      // Reset form
      setInputState({
        content: '',
        method: activeMethod,
        isProcessing: false
      });
      setSuggestions([]);
      
      onThoughtCreated?.(thought.id);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error creating thought: ', error);
      setError('Failed to create thought. Please try again.');
      setInputState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // ====== Render ======
  
  const renderMethodButtons = () => (
    <div className="grid grid-cols-2 lg: grid-cols-4 gap-4 mb-6">
      {INTERACTION_METHODS.map((method) => {
        const Icon = method.icon;
        const isActive = activeMethod === method.id;
        
        return (
          <Button
            key={method.id}
            variant={isActive ? "default" : "outline"}
            className={`h-auto p-4 flex flex-col gap-2 transition-all ${
              isActive ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => {
              setActiveMethod(method.id);
              setInputState(prev => ({ ...prev, method: method.id }));
              
              // Special handling for different methods
              if (method.id === 'copy_paste') {
                handlePasteContent();
              } else if (method.id === 'upload') {
                fileInputRef.current?.click();
              }
            }}
          >
            <Icon className="h-5 w-5" />
            <div className="text-center">
              <div className="font-medium text-sm">{method.label}</div>
              <div className="text-xs text-muted-foreground">{method.description}</div>
            </div>
          </Button>
        );
      })}
    </div>
  );

  const renderActiveInput = () => {
    const activeMethodConfig = INTERACTION_METHODS.find(m => m.id === activeMethod);
    
    if (activeMethod === 'speech') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg">
            {isRecording ? (
              <div className="text-center">
                <div className="h-16 w-16 bg-destructive rounded-full flex items-center justify-center animate-pulse mx-auto mb-4">
                  <Mic className="h-8 w-8 text-primary-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">Recording in progress...</p>
                <Button onClick={stopRecording} variant="outline">
                  Stop Recording
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Mic className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                <p className="text-sm text-muted-foreground mb-4">Click to start voice recording</p>
                <Button onClick={startRecording}>
                  Start Recording
                </Button>
              </div>
            )}
          </div>
          
          {inputState.content && (
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm font-medium mb-2">Transcribed: </p>
              <p className="text-sm">{inputState.content}</p>
            </div>
          )}
        </div>
      );
    }

    if (activeMethod === 'upload') {
      return (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="*/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          
          <div className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg">
            <div className="text-center">
              <Upload className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload documents, images, or any files
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Choose File
              </Button>
            </div>
          </div>
          
          {inputState.file && (
            <div className="p-4 bg-background rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{inputState.file.name}</span>
              </div>
              {inputState.content && (
                <p className="text-sm">{inputState.content}</p>
              )}
            </div>
          )}
        </div>
      );
    }

    // Text and Copy/Paste input
    return (
      <Textarea
        value={inputState.content}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputState(prev => ({ ...prev, content: e.target.value }))}
        placeholder={activeMethodConfig?.placeholder}
        className="min-h-[120px] resize-none"
        disabled={inputState.isProcessing}
      />
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Interactive Prompts
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Capture your thoughts through text, speech, copy/paste, or file upload
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {renderMethodButtons()}
        
        <div className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}
          
          {renderActiveInput()}
          
          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">AI Suggestions: </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover: bg-primary/10"
                    onClick={() => {
                      setInputState(prev => ({
                        ...prev,
                        content: prev.content + (prev.content ? '\n' : '') + suggestion
                      }));
                    }}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={submitThought}
              disabled={!inputState.content.trim() || inputState.isProcessing}
              className="min-w-[120px]"
            >
              {inputState.isProcessing ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 