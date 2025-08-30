/**
 * Identity Setup Ticket Page
 * 
 * Page wrapper for the Identity Setup Ticket using the Brain Tickets system
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import JourneyTicketService, { type JourneyTicket } from '@/services/playbook/JourneyTicketService';
import { useAuth } from '@/hooks/index';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Textarea } from '@/shared/components/ui/textarea';
import { 
  Building2, Target, Heart, Users, 
  Package, BookOpen, Settings, TrendingUp,
  Sparkles, ArrowRight, Eye, FileText,
  CheckCircle, Clock, ChevronLeft, X
} from 'lucide-react';

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

const IdentitySetupTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  
  const [ticket, setTicket] = useState<JourneyTicket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [blocks, setBlocks] = useState<IdentityBlock[]>([
    {
      id: 'mission-vision',
      name: 'Mission & Vision',
      description: 'Define your business purpose and future direction',
      icon: Target,
      status: 'pending',
      progress: 0,
      requirements: ['Clear mission statement', 'Inspiring vision statement']
    },
    {
      id: 'values-culture',
      name: 'Values & Culture',
      description: 'Establish your core values and cultural foundation',
      icon: Heart,
      status: 'pending',
      progress: 0,
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
      id: 'target-audience',
      name: 'Target Audience',
      description: 'Identify your ideal customers and market segments',
      icon: Users,
      status: 'pending',
      progress: 0,
      requirements: ['Target customer profiles', 'Market segments', 'Customer needs']
    },
    {
      id: 'competitive-advantage',
      name: 'Competitive Advantage',
      description: 'Define what makes your business unique',
      icon: TrendingUp,
      status: 'pending',
      progress: 0,
      requirements: ['Unique value propositions', 'Competitive differentiators', 'Market positioning']
    },
    {
      id: 'brand-identity',
      name: 'Brand Identity',
      description: 'Create your visual and verbal brand identity',
      icon: Eye,
      status: 'pending',
      progress: 0,
      requirements: ['Brand personality', 'Visual identity guidelines', 'Brand voice']
    },
    {
      id: 'business-model',
      name: 'Business Model',
      description: 'Define how your business creates and captures value',
      icon: Settings,
      status: 'pending',
      progress: 0,
      requirements: ['Revenue streams', 'Cost structure', 'Value delivery']
    }
  ]);

  const journeyTicketService = new JourneyTicketService();

  useEffect(() => {
    initializeTicket();
  }, []);

  const initializeTicket = async () => {
    if (!user?.id || !profile?.organization_id) return;

    try {
      // Check if there's already an active identity setup ticket
      // First check for identity_setup type, then fall back to business_identity
      let existingTickets = await journeyTicketService.getTickets({
        organization_id: profile.organization_id,
        user_id: user.id,
        ticket_type: 'identity_setup',
        status: 'open'
      });

      // If no identity_setup tickets, check for business_identity tickets
      if (!existingTickets.success || !existingTickets.data || existingTickets.data.length === 0) {
        existingTickets = await journeyTicketService.getTickets({
          organization_id: profile.organization_id,
          user_id: user.id,
          ticket_type: 'business_identity',
          status: 'open'
        });
      }

              if (existingTickets.success && existingTickets.data && existingTickets.data.length > 0) {
          const existingTicket = existingTickets.data[0];
          
          // If this is a business_identity ticket, convert it to identity_setup
          if (existingTicket.ticket_type === 'business_identity') {
            const convertedTicket = await journeyTicketService.updateTicket(existingTicket.id, {
              ticket_type: 'identity_setup',
              category: 'business_setup',
              tags: ['identity', 'setup', 'business']
            });
            
            if (convertedTicket.success && convertedTicket.data) {
              setTicket(convertedTicket.data);
              loadTicketData(convertedTicket.data);
            } else {
              setTicket(existingTicket);
              loadTicketData(existingTicket);
            }
          } else {
            setTicket(existingTicket);
            loadTicketData(existingTicket);
          }
        } else {
        // Create new identity setup ticket
        const newTicket = await journeyTicketService.createTicket({
          organization_id: profile.organization_id,
          user_id: user.id,
          title: 'Business Identity Setup',
          description: 'Setting up business identity and core values',
          ticket_type: 'identity_setup',
          priority: 'medium',
          category: 'business_setup',
          source: 'identity_setup_page',
          tags: ['identity', 'setup', 'business']
        });

        if (newTicket.success && newTicket.data) {
          setTicket(newTicket.data);
          addSystemMessage('Welcome to your Business Identity Setup! 🎯\n\nWe\'ll work through 7 key areas to define who your business is. Let\'s start with your Mission & Vision.');
        }
      }
    } catch (error) {
      console.error('Error initializing ticket:', error);
    }
  };

  const loadTicketData = (ticketData: JourneyTicket) => {
    // Load existing progress from ticket data
    if (ticketData.ai_insights?.blocks) {
      setBlocks(ticketData.ai_insights.blocks);
    }
    
    if (ticketData.ai_insights?.messages) {
      setMessages(ticketData.ai_insights.messages);
    }
    
    if (ticketData.ai_insights?.progress) {
      setOverallProgress(ticketData.ai_insights.progress);
    }

    // If this is a converted business_identity ticket, try to extract progress from analysis
    if (ticketData.ai_insights?.analysis?.intent === 'business_identity') {
      // Set some initial progress based on existing conversation
      setOverallProgress(15); // Start with some progress since there was previous conversation
      
      // Add a system message about resuming
      if (messages.length === 0) {
        addSystemMessage('Welcome back! I can see you\'ve already started working on your business identity. Let\'s continue where we left off and complete your setup.');
      }
    }
  };

  const addSystemMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content,
      timestamp: new Date(),
      isSystem: true
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || !ticket || !user?.id) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsTyping(true);

    try {
      // Update the ticket with the new message
      const updatedTicket = await journeyTicketService.updateTicket(ticket.id, {
        ai_insights: {
          ...ticket.ai_insights,
          messages: [...messages, userMessage],
          last_activity: new Date().toISOString()
        }
      });

      if (updatedTicket.success && updatedTicket.data) {
        setTicket(updatedTicket.data);
        
        // Simulate AI response (in a real implementation, this would call an AI service)
        setTimeout(() => {
          const aiResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: generateAIResponse(currentInput),
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, aiResponse]);
          setIsTyping(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    // Simple response generation - in production, this would call an AI service
    const responses = [
      "That's a great point! Let's explore that further. What specific aspects would you like to focus on?",
      "I see what you're getting at. How does this align with your overall business goals?",
      "Excellent insight! This will help us build a stronger foundation. What's the next step you'd like to take?",
      "That's exactly the kind of thinking we need for your business identity. Let's dive deeper into this area."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleComplete = async () => {
    if (!ticket) return;

    try {
      await journeyTicketService.updateTicket(ticket.id, {
        status: 'resolved',
        completed_at: new Date().toISOString(),
        ai_insights: {
          ...ticket.ai_insights,
          completed: true,
          completion_date: new Date().toISOString()
        }
      });

      navigate('/dashboard', { 
        state: { 
          identityCompleted: true,
          ticketId: ticket.id
        } 
      });
    } catch (error) {
      console.error('Error completing ticket:', error);
    }
  };

  const handleClose = () => {
    navigate('/dashboard');
  };

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading identity setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Identity Setup</h1>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          <div className="text-sm text-gray-500">
            Ticket #{ticket.id}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {blocks.map((block) => (
              <Card key={block.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      block.status === 'completed' ? 'bg-green-100 text-green-600' :
                      block.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <block.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-gray-900">{block.name}</h3>
                      <p className="text-xs text-gray-500">{block.description}</p>
                    </div>
                    {block.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  {block.status === 'in_progress' && (
                    <Progress value={block.progress} className="h-1 mt-2" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <Button 
            onClick={handleComplete}
            className="w-full"
            disabled={overallProgress < 100}
          >
            Complete Setup
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-2">
              <Textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 resize-none"
                rows={1}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button onClick={handleSendMessage} disabled={!currentInput.trim()}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentitySetupTicketPage;
