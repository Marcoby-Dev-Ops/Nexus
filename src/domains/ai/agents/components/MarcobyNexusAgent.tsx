/**
 * MarcobyNexusAgent.tsx
 * Comprehensive AI Agent System for Marcoby Nexus
 * Implements the FIRE CYCLE and See/Think/Act framework
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Zap, Brain, Target, TrendingUp, Building2, Lightbulb, ArrowRight, Clock, Star } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useAuth } from '@/core/auth/AuthProvider';
import { agentRegistry } from '@/domains/ai/lib/agentRegistry';

interface MarcobyNexusAgentProps {
  onClose?: () => void;
  sessionId?: string;
  className?: string;
}

interface AgentCapability {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'fire-cycle' | 'see-think-act' | 'specialist' | 'automation';
  confidence: number;
  lastUsed?: Date;
}

interface BusinessContext {
  company: {
    name: string;
    industry: string;
    size: string;
    stage: string;
  };
  user: {
    role: string;
    experience: string;
    responsibilities: string[];
  };
  goals: {
    primary: string;
    secondary: string[];
    timeframe: string;
    metrics: string[];
  };
  challenges: {
    current: string[];
    anticipated: string[];
    resolved: string[];
  };
}

interface FireCyclePhase {
  phase: 'focus' | 'insight' | 'roadmap' | 'execute';
  status: 'active' | 'completed' | 'pending';
  progress: number;
  insights: string[];
  actions: string[];
}

export const MarcobyNexusAgent: React.FC<MarcobyNexusAgentProps> = ({ 
  onClose, 
  sessionId = '', 
  className = '' 
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('executive');
  const [businessContext, setBusinessContext] = useState<BusinessContext | null>(null);
  const [fireCyclePhase, setFireCyclePhase] = useState<FireCyclePhase>({
    phase: 'focus',
    status: 'active',
    progress: 25,
    insights: [],
    actions: []
  });
  const [capabilities, setCapabilities] = useState<AgentCapability[]>([
    {
      id: 'focus-analysis',
      name: 'Focus Analysis',
      description: 'Define your North Star and key outcomes',
      icon: <Target className="w-4 h-4" />,
      category: 'fire-cycle',
      confidence: 0.95
    },
    {
      id: 'insight-generation',
      name: 'Insight Generation',
      description: 'Surface opportunities and risks from your data',
      icon: <Lightbulb className="w-4 h-4" />,
      category: 'fire-cycle',
      confidence: 0.92
    },
    {
      id: 'roadmap-planning',
      name: 'Roadmap Planning',
      description: 'Set strategy and clear next actions',
      icon: <TrendingUp className="w-4 h-4" />,
      category: 'fire-cycle',
      confidence: 0.89
    },
    {
      id: 'execution-automation',
      name: 'Execution Automation',
      description: 'Take action and automate processes',
      icon: <Zap className="w-4 h-4" />,
      category: 'fire-cycle',
      confidence: 0.87
    },
    {
      id: 'data-visualization',
      name: 'Data Visualization',
      description: 'See all business data in one place',
      icon: <Building2 className="w-4 h-4" />,
      category: 'see-think-act',
      confidence: 0.94
    },
    {
      id: 'strategic-analysis',
      name: 'Strategic Analysis',
      description: 'Think through complex business decisions',
      icon: <Brain className="w-4 h-4" />,
      category: 'see-think-act',
      confidence: 0.91
    },
    {
      id: 'action-execution',
      name: 'Action Execution',
      description: 'Act on insights and recommendations',
      icon: <ArrowRight className="w-4 h-4" />,
      category: 'see-think-act',
      confidence: 0.88
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Simulate AI processing with FIRE cycle integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update FIRE cycle based on message content
      const newPhase = analyzeFireCyclePhase(userMessage);
      setFireCyclePhase(newPhase);

      // Update capabilities based on usage
      setCapabilities(prev => prev.map(cap => 
        cap.id === 'focus-analysis' 
          ? { ...cap, lastUsed: new Date(), confidence: Math.min(1, cap.confidence + 0.01) }
          : cap
      ));

    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error sending message: ', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeFireCyclePhase = (message: string): FireCyclePhase => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('goal') || lowerMessage.includes('focus') || lowerMessage.includes('priority')) {
      return {
        phase: 'focus',
        status: 'active',
        progress: 50,
        insights: ['Goal clarity identified', 'Priority alignment needed'],
        actions: ['Define specific metrics', 'Set timeline']
      };
    } else if (lowerMessage.includes('data') || lowerMessage.includes('analysis') || lowerMessage.includes('insight')) {
      return {
        phase: 'insight',
        status: 'active',
        progress: 75,
        insights: ['Data patterns detected', 'Opportunity identified'],
        actions: ['Deep dive analysis', 'Risk assessment']
      };
    } else if (lowerMessage.includes('plan') || lowerMessage.includes('strategy') || lowerMessage.includes('roadmap')) {
      return {
        phase: 'roadmap',
        status: 'active',
        progress: 90,
        insights: ['Strategy framework ready', 'Action plan developed'],
        actions: ['Execute plan', 'Monitor progress']
      };
    } else if (lowerMessage.includes('execute') || lowerMessage.includes('action') || lowerMessage.includes('implement')) {
      return {
        phase: 'execute',
        status: 'active',
        progress: 100,
        insights: ['Execution ready', 'Automation opportunities'],
        actions: ['Launch automation', 'Track results']
      };
    }
    
    return fireCyclePhase;
  };

  const getAgentDisplayName = () => {
    const agent = agentRegistry.find(a => a.id === selectedAgent);
    return agent?.name || 'Marcoby Nexus';
  };

  const getFireCycleColor = (phase: string) => {
    switch (phase) {
      case 'focus': return 'text-blue-500';
      case 'insight': return 'text-purple-500';
      case 'roadmap': return 'text-orange-500';
      case 'execute': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Floating Action Button */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover: from-blue-700 hover:to-purple-700"
          >
            <Brain className="w-6 h-6 text-white" />
          </Button>
        </motion.div>
      )}

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="w-96 h-[600px] bg-background border rounded-lg shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{getAgentDisplayName()}</h3>
                    <p className="text-xs text-muted-foreground">Your business command center</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>

              {/* FIRE Cycle Progress */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">FIRE Cycle</span>
                  <span className={`font-semibold ${getFireCycleColor(fireCyclePhase.phase)}`}>
                    {fireCyclePhase.phase.toUpperCase()}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getFireCycleColor(fireCyclePhase.phase).replace('text-', 'bg-')}`}
                    style={{ width: `${fireCyclePhase.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Capabilities Grid */}
            <div className="p-4 border-b bg-muted/30">
              <h4 className="text-sm font-medium mb-3">Available Capabilities</h4>
              <div className="grid grid-cols-2 gap-2">
                {capabilities.slice(0, 4).map((capability) => (
                  <div
                    key={capability.id}
                    className="p-2 bg-background rounded border text-xs cursor-pointer hover: bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {capability.icon}
                      <span className="font-medium">{capability.name}</span>
                    </div>
                    <p className="text-muted-foreground leading-tight">
                      {capability.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(capability.confidence * 100)}%
                      </Badge>
                      {capability.lastUsed && (
                        <Clock className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Welcome Message */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm">
                      Hello! I'm your Marcoby Nexus business command center. I can help you with: </p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• <strong>Focus:</strong> Define your North Star and key outcomes</li>
                      <li>• <strong>Insight:</strong> Surface opportunities and risks from your data</li>
                      <li>• <strong>Roadmap:</strong> Set strategy and clear next actions</li>
                      <li>• <strong>Execute:</strong> Take action and automate processes</li>
                    </ul>
                    <p className="text-sm mt-2 text-muted-foreground">
                      What would you like to work on today?
                    </p>
                  </div>
                </div>
              </div>

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-sm text-muted-foreground">Processing...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about your business..."
                    className="w-full px-4 py-2 border rounded-lg focus: outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || loading}
                  className="h-10 w-10 p-0 bg-gradient-to-r from-blue-600 to-purple-600 hover: from-blue-700 hover:to-purple-700"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 