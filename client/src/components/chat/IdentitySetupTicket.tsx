/**
 * Identity Setup Ticket - Chat-Based Setup Flow
 * 
 * Resumes an active Identity Setup session with progress tracking,
 * block-by-block completion, and conversational AI guidance.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle, Clock, ChevronLeft, X, 
  Building2, Target, Heart, Users, 
  Package, BookOpen, Settings, TrendingUp,
  Sparkles, ArrowRight, Eye, FileText
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { useAuth } from '@/hooks/index';
import { useUserProfile } from '@/shared/contexts/UserContext';

interface IdentityBlock {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'completed' | 'in_progress' | 'pending';
  progress: number;
  data?: any;
  requirements: string[];
}

interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  blockId?: string;
  isSystem?: boolean;
}

interface IdentitySetupTicketProps {
  ticketId?: string;
  onComplete?: (identityData: any) => void;
  onClose?: () => void;
}

const IdentitySetupTicket: React.FC<IdentitySetupTicketProps> = ({ 
  ticketId, 
  onComplete, 
  onClose 
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [blocks, setBlocks] = useState<IdentityBlock[]>([
    {
      id: 'mission-vision',
      name: 'Mission & Vision',
      description: 'Define your business purpose and future direction',
      icon: Target,
      status: 'completed',
      progress: 100,
      data: {
        mission: 'Empower entrepreneurs to build successful businesses through intelligent automation and strategic guidance.',
        vision: 'To be the leading platform that democratizes business success, making entrepreneurship accessible to everyone.'
      },
      requirements: ['Clear mission statement', 'Inspiring vision statement']
    },
    {
      id: 'values-culture',
      name: 'Values & Culture',
      description: 'Establish your core values and cultural foundation',
      icon: Heart,
      status: 'in_progress',
      progress: 45,
      data: {
        values: ['Client Obsession', 'Innovation', 'Transparency']
      },
      requirements: ['3-5 core values', 'Value descriptions']
    },
    {
      id: 'products-services',
      name: 'Products & Services',
      description: 'Define your offerings and value propositions',
      icon: Package,
      status: 'pending',
      progress: 0,
      requirements: ['Core products/services', 'Value propositions', 'Target markets']
    },
    {
      id: 'team-structure',
      name: 'Team & Structure',
      description: 'Outline your organizational structure and roles',
      icon: Users,
      status: 'pending',
      progress: 0,
      requirements: ['Key roles', 'Organizational structure', 'Team culture']
    },
    {
      id: 'operations-processes',
      name: 'Operations & Processes',
      description: 'Define your operational workflows and systems',
      icon: Settings,
      status: 'pending',
      progress: 0,
      requirements: ['Core processes', 'Workflow systems', 'Quality standards']
    },
    {
      id: 'knowledge-base',
      name: 'Knowledge & Learning',
      description: 'Establish your knowledge management approach',
      icon: BookOpen,
      status: 'pending',
      progress: 0,
      requirements: ['Knowledge areas', 'Learning systems', 'Documentation standards']
    },
    {
      id: 'growth-strategy',
      name: 'Growth & Strategy',
      description: 'Define your expansion and scaling approach',
      icon: TrendingUp,
      status: 'pending',
      progress: 0,
      requirements: ['Growth strategies', 'Market expansion', 'Scaling plans']
    }
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'ai',
      content: `Welcome back to your Identity Setup session! 🎯\n\nWe're currently working on **Block 2: Values & Culture**. You've already defined Marcoby's mission and vision. Now let's capture your core values.\n\nYou mentioned "Client Obsession" as one of your values. Should we lock that in, or would you like to adjust it?`,
      timestamp: new Date(),
      blockId: 'values-culture'
    }
  ]);

  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [overallProgress, setOverallProgress] = useState(21); // 1.5/7 blocks complete

  const currentBlock = blocks.find(block => block.status === 'in_progress');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentInput,
      timestamp: new Date(),
      blockId: currentBlock?.id
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(currentInput, currentBlock);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const generateAIResponse = (userInput: string, block: IdentityBlock | undefined): ChatMessage => {
    if (!block) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "I'm not sure which block we're working on. Let me check your progress...",
        timestamp: new Date()
      };
    }

    // Simple response logic - in real implementation, this would be AI-driven
    if (block.id === 'values-culture') {
      if (userInput.toLowerCase().includes('client obsession')) {
        return {
          id: Date.now().toString(),
          type: 'ai',
          content: `Perfect! "Client Obsession" is locked in as a core value. 🎯\n\nWhat other values define Marcoby's culture? Think about what drives your team and how you want to be known in the market.\n\nSome examples: Innovation, Transparency, Excellence, Collaboration, Integrity...`,
          timestamp: new Date(),
          blockId: block.id
        };
      } else {
        return {
          id: Date.now().toString(),
          type: 'ai',
          content: `Great input! I've captured that as part of your values. 📝\n\nLet's add a few more core values to complete this block. What other principles guide your business decisions and team behavior?`,
          timestamp: new Date(),
          blockId: block.id
        };
      }
    }

    return {
      id: Date.now().toString(),
      type: 'ai',
      content: "I understand. Let me help you move forward with this block...",
      timestamp: new Date(),
      blockId: block.id
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getBlockIcon = (icon: React.ComponentType<any>) => {
    const IconComponent = icon;
    return <IconComponent className="w-4 h-4" />;
  };

  const getBlockStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-primary animate-pulse" />;
      default:
        return <div className="w-4 h-4 border-2 border-muted rounded-full" />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Progress Overview */}
      <div className="w-80 border-r border-border bg-muted/20 p-4 overflow-y-auto">
        {/* Ticket Header */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Identity Setup
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose || (() => navigate('/dashboard'))}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs">
                  {currentBlock?.status === 'in_progress' ? 'In Progress' : 'Active'}
                </Badge>
                <span className="text-muted-foreground">
                  Block {blocks.findIndex(b => b.status === 'in_progress') + 1} of 7
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Building Blocks Progress */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Building Blocks</h3>
          {blocks.map((block, index) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                block.status === 'in_progress' 
                  ? 'bg-primary/10 border-primary/20 ring-2 ring-primary/20' 
                  : block.status === 'completed'
                  ? 'bg-success/10 border-success/20'
                  : 'bg-muted/30 border-muted hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                  {getBlockIcon(block.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium truncate">{block.name}</h4>
                    {getBlockStatusIcon(block.status)}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {block.description}
                  </p>
                  {block.status === 'in_progress' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{block.progress}%</span>
                      </div>
                      <Progress value={block.progress} className="h-1" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Eye className="w-4 h-4 mr-2" />
            View Requirements
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Export Progress
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {currentBlock?.name} - Identity Setup
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentBlock?.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentBlock?.progress}% Complete
              </Badge>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <Card className={`${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50'
                  }`}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        {message.type === 'ai' && (
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Sparkles className="w-3 h-3 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <Card className="bg-muted/50 max-w-[80%]">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-primary" />
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response... (Press Enter to send, Shift+Enter for new line)"
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isTyping}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || isTyping}
              className="self-end"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentitySetupTicket;
