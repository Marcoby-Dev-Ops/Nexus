/**
 * N8nAssistantPanel.tsx
 * Enhanced AI Assistant Panel that connects to n8n workflows
 * Provides department-specific assistants and workflow automation
 */
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, AlertCircle, Settings, Workflow } from 'lucide-react';
import { Spinner } from '@/shared/components/ui/Spinner';
// Mock hooks for now - these would be implemented in the actual n8n integration
const useDepartmentAssistant = (_department: string) => ({
  askAssistant: async (message: string, context: any) => ({ 
    success: true, 
    data: { output: 'Mock response' },
    error: null,
    executionId: 'mock-execution-id'
  }),
  isLoading: false,
  error: null,
  isConnected: true,
  clearError: () => {},
  checkHealth: () => {}
});

const useWorkflowBuilder = () => ({
  buildWorkflow: async (requirements: string) => ({ 
    success: true, 
    data: { workflowId: 'mock-workflow' },
    error: null
  }),
  isLoading: false
});

type Department = 'sales' | 'finance' | 'operations' | 'marketing' | 'general';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  department?: Department;
  executionId?: string;
}

interface N8nAssistantPanelProps {
  department: Department;
  onClose?: () => void;
  className?: string;
}

export const N8nAssistantPanel: React.FC<N8nAssistantPanelProps> = ({
  department,
  onClose,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello! I'm your ${department} department assistant powered by n8n workflows. How can I help you today?`,
      role: 'assistant',
      timestamp: new Date(),
      department
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    askAssistant,
    isLoading,
    error,
    isConnected,
    clearError,
    checkHealth
  } = useDepartmentAssistant(department);
  
  const workflowBuilder = useWorkflowBuilder();

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check n8n connection on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
      department
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      const response = await askAssistant(inputValue.trim(), {
        department,
        userId: 'current-user', // Replace with actual user ID
        previousMessages: messages.slice(-5) // Send last 5 messages for context
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.success 
          ? (response.data?.output || response.data || 'Task completed successfully!')
          : (response.error || 'Sorry, I encountered an error.'),
        role: 'assistant',
        timestamp: new Date(),
        department,
        executionId: response.executionId
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble connecting to the workflow service. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        department
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateWorkflow = async (requirements: string) => {
    const response = await workflowBuilder.buildWorkflow(requirements);
    
    const workflowMessage: Message = {
      id: Date.now().toString(),
      content: response.success 
        ? `✅ Workflow creation initiated: ${requirements}`
        : `❌ Failed to create workflow: ${response.error}`,
      role: 'assistant',
      timestamp: new Date(),
      department
    };
    
    setMessages(prev => [...prev, workflowMessage]);
    setShowWorkflowBuilder(false);
  };

  const getDepartmentColor = (dept: Department) => {
    const colors = {
      sales: 'text-success dark:text-success',
      finance: 'text-primary dark:text-primary',
      operations: 'text-secondary dark:text-secondary',
      marketing: 'text-pink-600 dark:text-pink-400',
      general: 'text-muted-foreground dark:text-muted-foreground'
    };
    return colors[dept] || colors.general;
  };

  const getDepartmentBg = (dept: Department) => {
    const colors = {
      sales: 'bg-success/5',
      finance: 'bg-primary/5',
      operations: 'bg-secondary/5',
      marketing: 'bg-accent/5',
      general: 'bg-background'
    };
    return colors[dept] || colors.general;
  };

  return (
    <div className={`flex flex-col h-full bg-card dark:bg-background ${className}`}>
      {/* Header */}
      <div className={`${getDepartmentBg(department)} px-4 py-4 border-b border-border dark: border-border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Bot className={`h-6 w-6 ${getDepartmentColor(department)}`} />
            <div>
              <h3 className="font-semibold text-foreground dark: text-primary-foreground capitalize">
                {department} Assistant
              </h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground dark:text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`} />
                <span>{isConnected ? 'Connected to n8n' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowWorkflowBuilder(!showWorkflowBuilder)}
              className="p-4 text-muted-foreground hover: text-muted-foreground dark:hover:text-muted-foreground/60 transition-colors"
              title="Workflow Builder"
            >
              <Workflow className="h-5 w-5" />
            </button>
            <button
              onClick={checkHealth}
              className="p-4 text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground/60 transition-colors"
              title="Check Connection"
            >
              <Settings className="h-5 w-5" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-4 text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground/60 transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-4 bg-destructive/5 dark: bg-destructive/20 border-b border-destructive/20 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-destructive dark:text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-destructive hover:text-destructive dark:hover:text-destructive"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Workflow Builder */}
      {showWorkflowBuilder && (
        <div className="px-4 py-4 bg-primary/5 border-b border-border">
          <WorkflowBuilder 
            department={department}
            onCreateWorkflow={handleCreateWorkflow}
            isLoading={workflowBuilder.isLoading}
            onClose={() => setShowWorkflowBuilder(false)}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-4 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : `${getDepartmentBg(department)} text-foreground dark: text-primary-foreground`
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
                {message.executionId && (
                  <span className="ml-2">• Execution: {message.executionId.slice(-6)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border dark: border-border p-4">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask your ${department} assistant anything...`}
            className="flex-1 resize-none border border-border rounded-lg px-4 py-4 bg-card text-foreground placeholder-muted-foreground focus: outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className={`px-4 py-4 rounded-lg transition-colors ${
              isLoading || !inputValue.trim()
                ? 'bg-muted cursor-not-allowed'
                : `bg-primary hover: bg-primary/90 text-primary-foreground`
            }`}
          >
            {isLoading ? (
              <Spinner size={20} />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Workflow Builder Component
interface WorkflowBuilderProps {
  department: Department;
  onCreateWorkflow: (requirements: string) => void;
  isLoading: boolean;
  onClose: () => void;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  department,
  onCreateWorkflow,
  isLoading,
  onClose
}) => {
  const [requirements, setRequirements] = useState('');

  const handleSubmit = () => {
    if (!requirements.trim()) return;
    onCreateWorkflow(requirements.trim());
    setRequirements('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-primary">
          Create New Workflow for {department.charAt(0).toUpperCase() + department.slice(1)}
        </h4>
        <button
          onClick={onClose}
          className="text-primary hover: text-primary/80"
        >
          ×
        </button>
      </div>
      <textarea
        value={requirements}
        onChange={(e) => setRequirements(e.target.value)}
        placeholder="Describe what you want this workflow to do..."
        className="w-full border border-border rounded-lg px-4 py-4 bg-card text-foreground placeholder-muted-foreground focus: outline-none focus:ring-2 focus:ring-primary"
        rows={3}
      />
      <div className="flex justify-end space-x-2">
        <button
          onClick={onClose}
          className="px-4 py-4 text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !requirements.trim()}
          className="px-4 py-4 bg-primary text-primary-foreground rounded hover: bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Workflow'}
        </button>
      </div>
    </div>
  );
};

export default N8nAssistantPanel; 