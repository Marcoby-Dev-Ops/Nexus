/**
 * Clean Chat Page
 * 
 * Main chat interface that leverages RAG through Nexus Knowledge domain.
 * Provides access to the Executive Assistant and specialized business agents.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationStore } from '@/shared/stores/organizationStore';
import { useUserProfile, useUserCompany } from '@/shared/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  MessageSquare, 
  Brain, 
  Rocket, 
  Target, 
  Building, 
  Users, 
  TrendingUp,
  ArrowLeft,
  Settings
} from 'lucide-react';

// Import the proper AI ChatPage component
import AIChatPage from '@/pages/ai/ChatPage';

interface ChatContext {
  type: 'general' | 'journey' | 'brain' | 'assistant' | 'specific';
  journeyId?: string;
  topic?: string;
  mode?: string;
  preloadedContext?: any;
}

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeOrgId } = useOrganizationStore();
  const { profile } = useUserProfile();
  const { company } = useUserCompany();
  const location = useLocation();
  
  const [chatContext, setChatContext] = useState<ChatContext>({ type: 'general' });
  const [isInitialized, setIsInitialized] = useState(false);

  // Parse URL parameters to determine chat context
  useEffect(() => {
    const context = searchParams.get('context');
    const journey = searchParams.get('journey');
    const topic = searchParams.get('topic');
    const mode = searchParams.get('mode');

    let chatContext: ChatContext = { type: 'general' };

    if (journey) {
      chatContext = {
        type: 'journey',
        journeyId: journey,
        preloadedContext: {
          journeyType: journey,
          suggestedJourney: getJourneyType(journey)
        }
      };
    } else if (context === 'brain') {
      chatContext = {
        type: 'brain',
        preloadedContext: {
          focus: 'brain_operations',
          knowledgeBase: 'nexus_brain'
        }
      };
    } else if (context === 'assistant') {
      chatContext = {
        type: 'assistant',
        mode: mode || 'general',
        preloadedContext: {
          assistantMode: mode || 'general'
        }
      };
    } else if (topic) {
      chatContext = {
        type: 'specific',
        topic,
        preloadedContext: {
          topic,
          focus: topic
        }
      };
    }

    setChatContext(chatContext);
    setIsInitialized(true);
  }, [searchParams]);

  const getJourneyType = (journeyId: string) => {
    const journeyTypes = {
      'business-identity-setup': {
        name: 'Business Identity Setup',
        description: 'Define your business vision, mission, and unique value proposition',
        category: 'onboarding'
      },
      'quantum-building-blocks': {
        name: 'Quantum Building Blocks Setup',
        description: 'Configure the 7 fundamental building blocks that compose your business',
        category: 'onboarding'
      },
      'customer-acquisition': {
        name: 'Customer Acquisition Journey',
        description: 'Systematically grow your customer base through targeted marketing and sales strategies',
        category: 'growth'
      },
      'content-marketing': {
        name: 'Content Marketing & Blog Journey',
        description: 'Build authority and attract customers through valuable content creation and distribution',
        category: 'growth'
      },
      'sales-optimization': {
        name: 'Sales Optimization Journey',
        description: 'Increase sales performance through process optimization and team development',
        category: 'optimization'
      },
      'product-development': {
        name: 'Product Development Journey',
        description: 'Develop and launch new products or improve existing ones based on market needs',
        category: 'innovation'
      },
      'operational-efficiency': {
        name: 'Operational Efficiency Journey',
        description: 'Streamline operations and reduce costs while maintaining quality',
        category: 'optimization'
      },
      'digital-transformation': {
        name: 'Digital Transformation Journey',
        description: 'Modernize business processes and technology infrastructure',
        category: 'innovation'
      }
    };

    return journeyTypes[journeyId as keyof typeof journeyTypes] || {
      name: 'Business Journey',
      description: 'Custom business journey',
      category: 'custom'
    };
  };

  const getContextIcon = () => {
    switch (chatContext.type) {
      case 'journey':
        return <Rocket className="h-5 w-5" />;
      case 'brain':
        return <Brain className="h-5 w-5" />;
      case 'assistant':
        return <MessageSquare className="h-5 w-5" />;
      case 'specific':
        return <Target className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getContextTitle = () => {
    switch (chatContext.type) {
      case 'journey':
        return chatContext.preloadedContext?.suggestedJourney?.name || 'Business Journey';
      case 'brain':
        return 'Nexus Brain Chat';
      case 'assistant':
        return 'AI Assistant';
      case 'specific':
        return `Chat about ${chatContext.topic}`;
      default:
        return 'Chat with Nexus';
    }
  };

  const getContextDescription = () => {
    switch (chatContext.type) {
      case 'journey':
        return chatContext.preloadedContext?.suggestedJourney?.description || 'Let\'s work on your business journey together';
      case 'brain':
        return 'Access the full Nexus knowledge base and business intelligence';
      case 'assistant':
        return 'Get help with any business task or question';
      case 'specific':
        return `Focused conversation about ${chatContext.topic}`;
      default:
        return 'Your AI-powered business assistant. Ask me anything about your business, goals, or challenges.';
    }
  };

  const handleBackToGeneral = () => {
    navigate('/chat');
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat Interface - Clean AIChatPage with RAG integration */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AIChatPage />
      </div>

      {/* Quick Actions removed: moved to AI chat sidebar for immersion */}
    </div>
  );
};

export default ChatPage;
