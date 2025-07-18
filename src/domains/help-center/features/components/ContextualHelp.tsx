import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/shared/components/ui/Dialog';
import { 
  HelpCircle, 
  BookOpen, 
  Video, 
  ExternalLink, 
  Lightbulb, 
  ArrowRight,
  X,
  PlayCircle,
  MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ContextualHelpProps {
  topic: string;
  title?: string;
  description?: string;
  tips?: string[];
  relatedJourneys?: string[];
  quickActions?: Array<{
    label: string;
    action: string;
    route?: string;
  }>;
  variant?: 'icon' | 'card' | 'inline';
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface HelpContent {
  [key: string]: {
    title: string;
    description: string;
    tips: string[];
    relatedJourneys: string[];
    quickActions: Array<{
      label: string;
      action: string;
      route?: string;
    }>;
    videoUrl?: string;
    documentationUrl?: string;
  };
}

// Comprehensive help content database
const helpContent: HelpContent = {
  'dashboard': {
    title: 'Business Dashboard',
    description: 'Your central command center for business insights and AI-powered recommendations.',
    tips: [
      'Check your business health score daily for early warning signs',
      'Click on any metric to drill down into detailed analytics',
      'Use the AI chat to ask questions about your data',
      'Set up alerts for important KPI changes'
    ],
    relatedJourneys: ['getting-started', 'business-intelligence'],
    quickActions: [
      { label: 'View Analytics', action: 'Open detailed analytics', route: '/analytics' },
      { label: 'AI Chat', action: 'Ask AI about your data', route: '/chat' },
      { label: 'Customize Dashboard', action: 'Personalize your view', route: '/settings' }
    ]
  },
  'integrations': {
    title: 'Business Integrations',
    description: 'Connect your business tools to unlock AI-powered automation and insights.',
    tips: [
      'Start with your most-used business tool for immediate value',
      'Microsoft 365 provides instant email and calendar intelligence',
      'PayPal integration gives real-time financial insights',
      'Each integration unlocks new AI capabilities'
    ],
    relatedJourneys: ['getting-started', 'integration-mastery'],
    quickActions: [
      { label: 'Connect Microsoft 365', action: 'Set up email integration', route: '/integrations' },
      { label: 'Connect PayPal', action: 'Add financial data', route: '/integrations' },
      { label: 'View All Integrations', action: 'Browse available tools', route: '/integrations' }
    ]
  },
  'ai-chat': {
    title: 'AI Assistant',
    description: 'Your intelligent business partner that learns from your data and provides personalized insights.',
    tips: [
      'Ask specific questions about your business metrics',
      'Use slash commands for quick actions (/help, /analyze, /create)',
      'Request insights: "What should I focus on today?"',
      'Ask for recommendations: "How can I improve my cash flow?"'
    ],
    relatedJourneys: ['getting-started', 'ai-hub'],
    quickActions: [
      { label: 'Start Chat', action: 'Begin conversation', route: '/chat' },
      { label: 'View AI Hub', action: 'Explore AI features', route: '/ai-hub' },
      { label: 'Learn Slash Commands', action: 'Master quick actions', route: '/user-guide' }
    ]
  },
  'analytics': {
    title: 'Business Intelligence',
    description: 'Comprehensive analytics and KPI tracking powered by your connected business data.',
    tips: [
      'Monitor your business health score for overall performance',
      'Set up custom KPIs specific to your business goals',
      'Use predictive analytics to forecast trends',
      'Export reports for stakeholder meetings'
    ],
    relatedJourneys: ['business-intelligence'],
    quickActions: [
      { label: 'Data Warehouse', action: 'Deep dive into data', route: '/analytics/data-warehouse' },
      { label: 'Custom KPIs', action: 'Set up metrics', route: '/analytics' },
      { label: 'Export Report', action: 'Generate report', route: '/analytics' }
    ]
  },
  'documents': {
    title: 'Document Management',
    description: 'AI-powered document organization, search, and collaboration.',
    tips: [
      'Upload documents for AI-powered analysis and insights',
      'Use semantic search to find documents by content',
      'Get document summaries and key points extraction',
      'Set up automated document workflows'
    ],
    relatedJourneys: ['team-collaboration'],
    quickActions: [
      { label: 'Upload Document', action: 'Add new file', route: '/documents' },
      { label: 'Search Documents', action: 'Find content', route: '/documents' },
      { label: 'AI Analysis', action: 'Get insights', route: '/documents' }
    ]
  },
  'automation': {
    title: 'Workflow Automation',
    description: 'Pre-built automation recipes and custom workflow creation.',
    tips: [
      'Start with pre-built recipes for common business tasks',
      'Customize workflows to match your specific processes',
      'Test automations in sandbox mode before going live',
      'Monitor automation performance and ROI'
    ],
    relatedJourneys: ['productivity-mastery', 'ai-hub'],
    quickActions: [
      { label: 'Browse Recipes', action: 'Find automation templates', route: '/automation-recipes' },
      { label: 'Create Custom', action: 'Build your own', route: '/api-learning' },
      { label: 'Monitor Performance', action: 'Check automation health', route: '/analytics' }
    ]
  }
};

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  topic,
  title,
  description,
  tips,
  relatedJourneys,
  quickActions,
  variant = 'icon',
  placement = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Get help content for the topic
  const content = helpContent[topic] || {
    title: title || 'Help',
    description: description || 'Get help with this feature.',
    tips: tips || [],
    relatedJourneys: relatedJourneys || [],
    quickActions: quickActions || []
  };

  const handleQuickAction = (action: { label: string; action: string; route?: string }) => {
    if (action.route) {
      navigate(action.route);
      setIsOpen(false);
    }
  };

  const handleJourneyNavigation = (journeyId: string) => {
    navigate(`/user-guide?journey=${journeyId}`);
    setIsOpen(false);
  };

  if (variant === 'icon') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <span>{content.title}</span>
            </DialogTitle>
            <DialogDescription>
              {content.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            
            {/* Tips */}
            {content.tips.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">💡 Quick Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {content.tips.map((tip, idx) => (
                    <li key={idx}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Quick Actions */}
            {content.quickActions.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">🚀 Quick Actions</h4>
                <div className="space-y-2">
                  {content.quickActions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleQuickAction(action)}
                    >
                      <ArrowRight className="h-3 w-3 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Related Journeys */}
            {content.relatedJourneys.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">📚 Learn More</h4>
                <div className="space-y-1">
                  {content.relatedJourneys.map((journeyId, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleJourneyNavigation(journeyId)}
                    >
                      <BookOpen className="h-3 w-3 mr-2" />
                      Complete {journeyId.replace('-', ' ')} journey
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate('/user-guide')}
              >
                <BookOpen className="h-3 w-3 mr-2" />
                View Complete User Guide
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <span>{content.title}</span>
            <Badge variant="outline" className="ml-auto">Help</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-3">
            {content.description}
          </p>
          
          {content.tips.length > 0 && (
            <div className="mb-3">
              <h5 className="font-medium text-xs mb-1">Quick Tips:</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                {content.tips.slice(0, 2).map((tip, idx) => (
                  <li key={idx}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => navigate('/user-guide')}
            >
              <BookOpen className="h-3 w-3 mr-1" />
              Learn More
            </Button>
            {content.quickActions[0] && (
              <Button
                size="sm"
                className="text-xs"
                onClick={() => handleQuickAction(content.quickActions[0])}
              >
                {content.quickActions[0].label}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center space-x-2 text-xs text-muted-foreground">
        <HelpCircle className="h-3 w-3" />
        <span>{content.description}</span>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={() => navigate('/user-guide')}
        >
          Learn more
        </Button>
      </div>
    );
  }

  return null;
};

// Export helper hook for easy integration
export const useContextualHelp = (topic: string) => {
  const navigate = useNavigate();
  
  const showHelp = () => {
    navigate(`/user-guide?topic=${topic}`);
  };
  
  const getHelpContent = () => {
    return helpContent[topic];
  };
  
  return { showHelp, getHelpContent };
};