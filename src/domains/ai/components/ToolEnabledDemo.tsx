/**
 * ToolEnabledDemo.tsx
 * Demonstrates the tool-enabled AI agent capabilities
 * Shows how Nex can access real business data and perform actions
 */

import React, { useState } from 'react';
import { 
  Zap, 
  Database, 
  Send, 
  Bot, 
  User, 
  CheckCircle, 
  ExternalLink,
  BarChart3,
  Calendar,
  FileText,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toolEnabledAgent } from '@/domains/ai/lib/aiAgentWithTools';
import { executiveAgent } from '@/domains/ai/lib/agentRegistry';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';

interface DemoMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolUsed?: string;
  toolResult?: any;
}

export const ToolEnabledDemo: React.FC = () => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      id: '1',
      role: 'system',
      content: 'Welcome to the Tool-Enabled AI Demo! Try asking Nex to perform real business actions.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const demoQueries = [
    {
      icon: <BarChart3 className="w-4 h-4" />,
      text: "Show me our sales metrics for this month",
      description: "Access real sales data from CRM"
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      text: "Schedule a team meeting for next week",
      description: "Create calendar events automatically"
    },
    {
      icon: <FileText className="w-4 h-4" />,
      text: "Generate a proposal for a new client",
      description: "Create business content using AI"
    },
    {
      icon: <Settings className="w-4 h-4" />,
      text: "Create a workflow to automate our onboarding process",
      description: "Build custom n8n workflows"
    }
  ];

  const handleSendMessage = async (message?: string) => {
    const messageText = message || input.trim();
    if (!messageText || isLoading || !user) return;

    setInput('');
    setIsLoading(true);

    // Add user message
    const userMessage: DemoMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Use tool-enabled agent
      const result = await toolEnabledAgent.sendMessageWithTools(
        'demo-conversation',
        messageText,
        executiveAgent,
        `demo-session-${Date.now()}`,
        { currentStep: 'demo' }
      );

      // Add AI response
      const aiMessage: DemoMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        toolUsed: result.toolUsed,
        toolResult: result.toolResult
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Demo error:', error);
      const errorMessage: DemoMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error. In a real environment, I would have access to your business systems through n8n workflows.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Tool-Enabled AI Agent Demo</h2>
            <p className="text-muted-foreground">Nex with real business capabilities through n8n workflows</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Database className="w-4 h-4" />
              Business Intelligence
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Access real sales metrics and financial data</li>
              <li>• Analyze performance trends</li>
              <li>• Generate business insights</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Action Execution
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Create tasks and schedule meetings</li>
              <li>• Send notifications to team members</li>
              <li>• Build custom workflows</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Try These Demo Queries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoQueries.map((query, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(query.text)}
              disabled={isLoading}
              className="p-4 text-left border border-border rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-all disabled:opacity-50"
            >
              <div className="flex items-start gap-4">
                <div className="p-1 bg-primary/10 rounded">
                  {query.icon}
                </div>
                <div>
                  <div className="font-medium text-foreground">{query.text}</div>
                  <div className="text-xs text-muted-foreground">{query.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="border border-border rounded-xl overflow-hidden bg-background">
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : message.role === 'system'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-gradient-to-br from-purple-500 to-blue-500 text-primary-foreground'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              
              <div className={`flex-1 max-w-[80%] ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                <div className={`rounded-xl p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : message.role === 'system'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-card border border-border'
                }`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                  
                  {/* Tool Usage Indicator */}
                  {message.toolUsed && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Zap className="w-3 h-3" />
                        <span>Used tool: {message.toolUsed.replace(/_/g, ' ')}</span>
                        {message.toolResult && (
                          <div className="ml-auto">
                            <CheckCircle className="w-3 h-3 text-success" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-primary-foreground flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="ml-2">Nex is working with business tools...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Nex to access business data or perform actions..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            💡 This demo shows how Nex would interact with your business systems through n8n workflows
          </div>
        </div>
      </div>

      {/* Tool Capabilities */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Available Tools
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {toolEnabledAgent.getAvailableTools().map((tool) => (
            <div key={tool} className="p-2 bg-background rounded border border-border">
              <span className="font-mono">{tool.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 