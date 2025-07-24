import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lightbulb, Target, Brain, Zap, TrendingUp, MessageSquare, Database, Users, Settings, HelpCircle, X, Play, BookOpen, Star } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { useAuth } from '@/core/auth/AuthProvider';

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  category: 'onboarding' | 'core' | 'advanced' | 'expert';
  estimatedTime: string;
  isCompleted: boolean;
  isCurrent: boolean;
  tips: string[];
  nextSteps: string[];
}

interface UserJourneyGuideProps {
  isVisible: boolean;
  onClose: () => void;
  onComplete: (stepId: string) => void;
}

export const UserJourneyGuide: React.FC<UserJourneyGuideProps> = ({
  isVisible,
  onClose,
  onComplete
}) => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<string>('welcome');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Define the complete user journey
  const journeySteps: JourneyStep[] = [
    // Onboarding Phase
    {
      id: 'welcome',
      title: 'Welcome to Nexus',
      description: 'Your business brain is ready to help you succeed',
      icon: <Brain className="h-5 w-5" />,
      path: '/home',
      category: 'onboarding',
      estimatedTime: '2 min',
      isCompleted: false,
      isCurrent: true,
      tips: [
        'Take a moment to explore your personalized dashboard',
        'Notice how your business brain is already analyzing your data',
        'Every action you take helps the system learn your preferences'
      ],
      nextSteps: [
        'Complete your profile for personalized insights',
        'Connect your first business tool',
        'Try asking your AI assistant a question'
      ]
    },
    {
      id: 'profile-setup',
      title: 'Complete Your Profile',
      description: 'Help your business brain understand your role and goals',
      icon: <Users className="h-5 w-5" />,
      path: '/settings/profile',
      category: 'onboarding',
      estimatedTime: '3 min',
      isCompleted: false,
      isCurrent: false,
      tips: [
        'Add your role and department for better AI recommendations',
        'Set your communication preferences',
        'Upload a profile photo for team recognition'
      ],
      nextSteps: [
        'Connect your first business integration',
        'Explore your personalized dashboard',
        'Start capturing your first thoughts'
      ]
    },
    {
      id: 'first-integration',
      title: 'Connect Your First Tool',
      description: 'Link a business system to start seeing AI insights',
      icon: <Database className="h-5 w-5" />,
      path: '/integrations',
      category: 'onboarding',
      estimatedTime: '5 min',
      isCompleted: false,
      isCurrent: false,
      tips: [
        'Start with your most-used tool (email, CRM, or accounting)',
        'Microsoft 365 integration provides immediate email intelligence',
        'PayPal integration gives instant financial insights'
      ],
      nextSteps: [
        'See your data come to life in the dashboard',
        'Ask your AI assistant about your business',
        'Start using the FIRE cycle for decision making'
      ]
    },

    // Core Systems Phase
    {
      id: 'home-dashboard',
      title: 'Explore Your Home Dashboard',
      description: 'See what\'s going on in your world at a glance',
      icon: <Target className="h-5 w-5" />,
      path: '/dashboard/home',
      category: 'core',
      estimatedTime: '5 min',
      isCompleted: false,
      isCurrent: false,
      tips: [
        'Check your business health score daily',
        'Review AI-generated insights and alerts',
        'Use the quick actions for common tasks'
      ],
      nextSteps: [
        'Set up your workspace for daily productivity',
        'Start using the FIRE cycle for strategic thinking',
        'Connect more tools for comprehensive insights'
      ]
    },
    {
      id: 'workspace-setup',
      title: 'Configure Your Workspace',
      description: 'Set up your daily productivity and action management',
      icon: <Zap className="h-5 w-5" />,
      path: '/tasks/workspace/actions',
      category: 'core',
      estimatedTime: '10 min',
      isCompleted: false,
      isCurrent: false,
      tips: [
        'Create your first action items',
        'Set up automation opportunities',
        'Configure your calendar integration'
      ],
      nextSteps: [
        'Start using the FIRE cycle for strategic planning',
        'Connect your knowledge base',
        'Explore advanced AI features'
      ]
    },
    {
      id: 'fire-cycle-intro',
      title: 'Learn the FIRE Cycle',
      description: 'Master the strategic thinking framework for business success',
      icon: <Brain className="h-5 w-5" />,
      path: '/business/fire-cycle',
      category: 'core',
      estimatedTime: '15 min',
      isCompleted: false,
      isCurrent: false,
      tips: [
        'Focus: Identify your most important priorities',
        'Insight: Analyze patterns and opportunities',
        'Roadmap: Plan your path to success',
        'Execute: Take action with confidence'
      ],
      nextSteps: [
        'Create your first strategic initiative',
        'Use AI insights to inform your decisions',
        'Track your progress and celebrate wins'
      ]
    },

    // Advanced Features Phase
    {
      id: 'ai-assistant',
      title: 'Master Your AI Assistant',
      description: 'Learn to communicate effectively with your business brain',
      icon: <MessageSquare className="h-5 w-5" />,
      path: '/chat',
      category: 'advanced',
      estimatedTime: '10 min',
      isCompleted: false,
      isCurrent: false,
      tips: [
        'Try asking: "What should I focus on today?"',
        'Use slash commands for quick actions',
        'Ask for business insights based on your data'
      ],
      nextSteps: [
        'Set up advanced AI automations',
        'Create custom business intelligence reports',
        'Integrate AI into your daily workflow'
      ]
    },
    {
      id: 'knowledge-base',
      title: 'Build Your Knowledge Base',
      description: 'Capture and organize your business intelligence',
      icon: <BookOpen className="h-5 w-5" />,
      path: '/integrations/knowledge',
      category: 'advanced',
      estimatedTime: '15 min',
      isCompleted: false,
      isCurrent: false,
      tips: [
        'Capture thoughts and ideas as they come',
        'Use AI to categorize and organize information',
        'Connect insights across different data sources'
      ],
      nextSteps: [
        'Create automated knowledge workflows',
        'Share insights with your team',
        'Build a comprehensive business intelligence system'
      ]
    },

    // Expert Level Phase
    {
      id: 'advanced-analytics',
      title: 'Advanced Business Analytics',
      description: 'Leverage comprehensive business intelligence',
      icon: <TrendingUp className="h-5 w-5" />,
      path: '/analytics',
      category: 'expert',
      estimatedTime: '20 min',
      isCompleted: false,
      isCurrent: false,
      tips: [
        'Set up custom KPIs for your business',
        'Create automated reporting dashboards',
        'Use predictive analytics for planning'
      ],
      nextSteps: [
        'Build custom business intelligence workflows',
        'Integrate with external data sources',
        'Create executive-level reporting'
      ]
    },
    {
      id: 'team-collaboration',
      title: 'Team Collaboration',
      description: 'Scale your success with team management',
      icon: <Users className="h-5 w-5" />,
              path: '/tasks/workspace/team',
      category: 'expert',
      estimatedTime: '30 min',
      isCompleted: false,
      isCurrent: false,
      tips: [
        'Invite team members to your workspace',
        'Set up role-based permissions',
        'Create shared workflows and processes'
      ],
      nextSteps: [
        'Implement team-wide AI assistance',
        'Create collaborative business processes',
        'Scale your business operations'
      ]
    }
  ];

  // Update current step based on location
  useEffect(() => {
    const matchingStep = journeySteps.find(step => 
      location.pathname.startsWith(step.path) || 
      location.pathname === step.path
    );
    
    if (matchingStep) {
      setCurrentStep(matchingStep.id);
    }
  }, [location.pathname]);

  // Check completion status
  useEffect(() => {
    const newCompletedSteps = new Set<string>();
    
    // Check profile completion
    if (profile?.first_name && profile?.last_name) {
      newCompletedSteps.add('profile-setup');
    }
    
    // Check integration completion (simplified)
    if (profile?.preferences?.integrations) {
      newCompletedSteps.add('first-integration');
    }
    
    setCompletedSteps(newCompletedSteps);
  }, [profile]);

  const getCurrentStep = () => {
    return journeySteps.find(step => step.id === currentStep) || journeySteps[0];
  };

  const getNextSteps = () => {
    const currentIndex = journeySteps.findIndex(step => step.id === currentStep);
    return journeySteps.slice(currentIndex + 1, currentIndex + 4);
  };

  const getProgressPercentage = () => {
    const completedCount = completedSteps.size;
    const totalSteps = journeySteps.length;
    return Math.round((completedCount / totalSteps) * 100);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-background z-10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Your Nexus Journey</CardTitle>
                <CardDescription>
                  Let's make sure you get the most out of your business brain
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Journey Progress</span>
              <span>{getProgressPercentage()}% Complete</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Step */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Focus</h3>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getCurrentStep().icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{getCurrentStep().title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {getCurrentStep().estimatedTime}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {getCurrentStep().description}
                    </p>
                    
                    {/* Tips */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">💡 Pro Tips: </h5>
                      <ul className="text-xs space-y-1">
                        {getCurrentStep().tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Star className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4">
                      <Button asChild className="w-full">
                        <Link to={getCurrentStep().path}>
                          <Play className="h-4 w-4 mr-2" />
                          Continue This Step
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What's Next</h3>
            <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
              {getNextSteps().map((step) => (
                <Card key={step.id} className="hover: shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{step.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {step.description}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {step.estimatedTime}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="grid grid-cols-2 md: grid-cols-4 gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to="/features">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Explore Features
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/help">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Get Help
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/chat">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ask AI
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 