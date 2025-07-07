import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  Video, 
  Users, 
  Target,
  Lightbulb,
  TrendingUp,
  Settings,
  Zap,
  Brain,
  BarChart2,
  FileText,
  Calendar,
  CheckSquare,
  Inbox
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserJourney {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Getting Started' | 'Core Features' | 'Advanced' | 'Integrations';
  steps: JourneyStep[];
  prerequisites?: string[];
  outcomes: string[];
  icon: React.ReactNode;
}

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  action: string;
  route?: string;
  component?: string;
  estimatedTime: string;
  tips?: string[];
  videoUrl?: string;
  completed?: boolean;
}

interface UserGuideSystemProps {
  onClose?: () => void;
}

export const UserGuideSystem: React.FC<UserGuideSystemProps> = ({ onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedJourney, setSelectedJourney] = useState<UserJourney | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<string>('Getting Started');

  // Define comprehensive user journeys
  const userJourneys: UserJourney[] = [
    {
      id: 'getting-started',
      title: 'Your First 30 Minutes with Nexus',
      description: 'Essential setup and orientation to get immediate value from Nexus',
      estimatedTime: '30 min',
      difficulty: 'Beginner',
      category: 'Getting Started',
      icon: <PlayCircle className="h-5 w-5" />,
      outcomes: [
        'Complete profile setup',
        'Connect first integration',
        'Create your first AI-powered task',
        'Understand the Trinity system (Think → See → Act)'
      ],
      steps: [
        {
          id: 'profile-setup',
          title: 'Complete Your Profile',
          description: 'Set up your business profile for personalized AI assistance',
          action: 'Go to Profile Settings',
          route: '/settings',
          estimatedTime: '5 min',
          tips: [
            'Add your role and department for better AI recommendations',
            'Upload a profile photo for team recognition',
            'Set your communication preferences'
          ]
        },
        {
          id: 'first-integration',
          title: 'Connect Your First Business Tool',
          description: 'Link a key business system to start seeing AI insights',
          action: 'Visit Integrations',
          route: '/integrations',
          estimatedTime: '10 min',
          tips: [
            'Start with your most-used tool (email, CRM, or accounting)',
            'Microsoft 365 integration provides immediate email intelligence',
            'PayPal integration gives instant financial insights'
          ]
        },
        {
          id: 'ai-chat-intro',
          title: 'Meet Your AI Assistant',
          description: 'Learn how to communicate with Nexus AI for maximum productivity',
          action: 'Open AI Chat',
          route: '/chat',
          estimatedTime: '10 min',
          tips: [
            'Try asking: "What should I focus on today?"',
            'Use slash commands for quick actions',
            'Ask for business insights based on your connected data'
          ]
        },
        {
          id: 'dashboard-tour',
          title: 'Explore Your Business Dashboard',
          description: 'Understand your personalized business health metrics',
          action: 'View Dashboard',
          route: '/dashboard',
          estimatedTime: '5 min',
          tips: [
            'Check your business health score',
            'Review AI-generated insights',
            'Bookmark important metrics'
          ]
        }
      ]
    },
    {
      id: 'productivity-mastery',
      title: 'Productivity & Task Management',
      description: 'Master task management, calendar integration, and workflow automation',
      estimatedTime: '45 min',
      difficulty: 'Intermediate',
      category: 'Core Features',
      icon: <CheckSquare className="h-5 w-5" />,
      outcomes: [
        'Set up automated task creation',
        'Master calendar integration',
        'Create productivity workflows',
        'Track and optimize your time'
      ],
      steps: [
        {
          id: 'task-setup',
          title: 'Set Up Smart Task Management',
          description: 'Configure AI-powered task creation and prioritization',
          action: 'Open Tasks',
          route: '/tasks',
          estimatedTime: '15 min'
        },
        {
          id: 'calendar-sync',
          title: 'Sync Your Calendar',
          description: 'Connect calendar for intelligent scheduling and time blocking',
          action: 'View Calendar',
          route: '/calendar',
          estimatedTime: '10 min'
        },
        {
          id: 'automation-setup',
          title: 'Create Your First Automation',
          description: 'Build workflows that save time on repetitive tasks',
          action: 'Browse Automation Recipes',
          route: '/automation-recipes',
          estimatedTime: '20 min'
        }
      ]
    },
    {
      id: 'business-intelligence',
      title: 'Business Intelligence & Analytics',
      description: 'Unlock powerful insights from your business data',
      estimatedTime: '60 min',
      difficulty: 'Intermediate',
      category: 'Core Features',
      icon: <BarChart2 className="h-5 w-5" />,
      outcomes: [
        'Understand business health scoring',
        'Set up custom KPIs',
        'Create automated reports',
        'Master the data warehouse'
      ],
      steps: [
        {
          id: 'health-score',
          title: 'Understand Your Business Health Score',
          description: 'Learn how Nexus calculates and improves your business metrics',
          action: 'View Analytics',
          route: '/analytics',
          estimatedTime: '20 min'
        },
        {
          id: 'data-warehouse',
          title: 'Explore the Data Warehouse',
          description: 'Access comprehensive business intelligence and reporting',
          action: 'Open Data Warehouse',
          route: '/analytics/data-warehouse',
          estimatedTime: '25 min'
        },
        {
          id: 'custom-kpis',
          title: 'Set Up Custom KPIs',
          description: 'Define and track metrics specific to your business',
          action: 'Configure KPIs',
          route: '/analytics',
          estimatedTime: '15 min'
        }
      ]
    },
    {
      id: 'ai-hub',
      title: 'AI-Powered Business Transformation',
      description: 'Advanced AI features for business optimization and growth',
      estimatedTime: '90 min',
      difficulty: 'Advanced',
      category: 'Advanced',
      icon: <Brain className="h-5 w-5" />,
      outcomes: [
        'Master Trinity architecture (Think → See → Act)',
        'Set up advanced AI workflows',
        'Implement business process optimization',
        'Create custom AI assistants'
      ],
      steps: [
        {
          id: 'trinity-mastery',
          title: 'Master the Trinity System',
          description: 'Deep dive into Think → See → Act methodology',
          action: 'AI Capabilities',
          route: '/ai-capabilities',
          estimatedTime: '30 min'
        },
        {
          id: 'ai-hub-advanced',
          title: 'Advanced AI Hub Features',
          description: 'Explore sophisticated AI tools and capabilities',
          action: 'Open AI Hub',
          route: '/ai-hub',
          estimatedTime: '30 min'
        },
        {
          id: 'api-learning',
          title: 'API Learning & Integration',
          description: 'Create custom integrations using AI-powered learning',
          action: 'Try API Learning',
          route: '/api-learning',
          estimatedTime: '30 min'
        }
      ]
    },
    {
      id: 'team-collaboration',
      title: 'Team Setup & Collaboration',
      description: 'Configure team access, permissions, and collaborative workflows',
      estimatedTime: '45 min',
      difficulty: 'Intermediate',
      category: 'Advanced',
      icon: <Users className="h-5 w-5" />,
      prerequisites: ['Admin access required'],
      outcomes: [
        'Add team members',
        'Configure permissions',
        'Set up collaborative workflows',
        'Monitor team productivity'
      ],
      steps: [
        {
          id: 'team-setup',
          title: 'Add Team Members',
          description: 'Invite colleagues and configure their access levels',
          action: 'Team Settings',
          route: '/settings',
          estimatedTime: '20 min'
        },
        {
          id: 'document-sharing',
          title: 'Configure Document Management',
          description: 'Set up shared document workflows',
          action: 'Document Center',
          route: '/documents',
          estimatedTime: '10 min'
        }
      ]
    },
    {
      id: 'integration-mastery',
      title: 'Integration Ecosystem Mastery',
      description: 'Connect and optimize all your business tools with Nexus',
      estimatedTime: '75 min',
      difficulty: 'Advanced',
      category: 'Integrations',
      icon: <Zap className="h-5 w-5" />,
      outcomes: [
        'Connect all major business tools',
        'Set up data synchronization',
        'Create cross-platform workflows',
        'Monitor integration health'
      ],
      steps: [
        {
          id: 'core-integrations',
          title: 'Connect Core Business Tools',
          description: 'Set up essential integrations (CRM, Email, Accounting)',
          action: 'View Integrations',
          route: '/integrations',
          estimatedTime: '30 min'
        },
        {
          id: 'advanced-integrations',
          title: 'Advanced Integration Features',
          description: 'Configure webhooks, custom fields, and automation triggers',
          action: 'Integration Settings',
          route: '/settings',
          estimatedTime: '25 min'
        },
        {
          id: 'integration-monitoring',
          title: 'Monitor Integration Health',
          description: 'Set up alerts and monitoring for your connected tools',
          action: 'Integration Dashboard',
          route: '/integrations',
          estimatedTime: '20 min'
        }
      ]
    }
  ];

  // Load completed steps from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nexus-user-guide-progress');
    if (saved) {
      setCompletedSteps(JSON.parse(saved));
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (stepId: string, completed: boolean) => {
    const updated = { ...completedSteps, [stepId]: completed };
    setCompletedSteps(updated);
    localStorage.setItem('nexus-user-guide-progress', JSON.stringify(updated));
  };

  // Calculate overall progress
  const calculateProgress = () => {
    const totalSteps = userJourneys.reduce((acc, journey) => acc + journey.steps.length, 0);
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    return Math.round((completedCount / totalSteps) * 100);
  };

  // Get journey completion status
  const getJourneyProgress = (journey: UserJourney) => {
    const completed = journey.steps.filter(step => completedSteps[step.id]).length;
    return { completed, total: journey.steps.length, percentage: Math.round((completed / journey.steps.length) * 100) };
  };

  // Filter journeys by category
  const filteredJourneys = userJourneys.filter(journey => journey.category === activeCategory);

  // Handle step action
  const handleStepAction = (step: JourneyStep) => {
    if (step.route) {
      navigate(step.route);
      saveProgress(step.id, true);
      if (onClose) onClose();
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-success/10 text-success dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-warning/10 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-destructive/10 text-destructive dark:bg-red-900 dark:text-red-200';
      default: return 'bg-muted text-foreground dark:bg-background dark:text-foreground';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Nexus User Guide</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Master Nexus with guided journeys designed for your role and experience level. 
          Track your progress and unlock the full potential of AI-powered business automation.
        </p>
        
        {/* Overall Progress */}
        <div className="bg-card border border-border rounded-lg p-4 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {Object.values(completedSteps).filter(Boolean).length} of {userJourneys.reduce((acc, j) => acc + j.steps.length, 0)} steps completed
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="Getting Started">Getting Started</TabsTrigger>
          <TabsTrigger value="Core Features">Core Features</TabsTrigger>
          <TabsTrigger value="Advanced">Advanced</TabsTrigger>
          <TabsTrigger value="Integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJourneys.map((journey) => {
              const progress = getJourneyProgress(journey);
              return (
                <Card key={journey.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {journey.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{journey.title}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getDifficultyColor(journey.difficulty)}>
                              {journey.difficulty}
                            </Badge>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {journey.estimatedTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      {journey.description}
                    </p>
                    
                    {/* Prerequisites */}
                    {journey.prerequisites && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Prerequisites:</p>
                        <ul className="text-xs text-muted-foreground">
                          {journey.prerequisites.map((req, idx) => (
                            <li key={idx}>• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {progress.completed}/{progress.total} steps
                        </span>
                      </div>
                      <Progress value={progress.percentage} className="h-2" />
                    </div>
                    
                    {/* Outcomes */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">You'll learn:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {journey.outcomes.slice(0, 3).map((outcome, idx) => (
                          <li key={idx} className="flex items-center">
                            <Target className="h-3 w-3 mr-2 text-primary flex-shrink-0" />
                            {outcome}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full" 
                          variant={progress.percentage === 100 ? "outline" : "default"}
                          onClick={() => setSelectedJourney(journey)}
                        >
                          {progress.percentage === 100 ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Review Journey
                            </>
                          ) : progress.percentage > 0 ? (
                            <>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Continue Journey
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Start Journey
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            {journey.icon}
                            <span>{journey.title}</span>
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          <div>
                            <p className="text-muted-foreground mb-4">{journey.description}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <Badge className={getDifficultyColor(journey.difficulty)}>
                                {journey.difficulty}
                              </Badge>
                              <div className="flex items-center text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {journey.estimatedTime}
                              </div>
                            </div>
                          </div>
                          
                          {/* Steps */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Journey Steps</h3>
                            {journey.steps.map((step, index) => {
                              const isCompleted = completedSteps[step.id];
                              return (
                                <div key={step.id} className="border border-border rounded-lg p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-sm font-medium text-muted-foreground">
                                          Step {index + 1}
                                        </span>
                                        {isCompleted && (
                                          <CheckCircle className="h-4 w-4 text-success" />
                                        )}
                                        <div className="flex items-center text-xs text-muted-foreground">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {step.estimatedTime}
                                        </div>
                                      </div>
                                      <h4 className="font-medium mb-1">{step.title}</h4>
                                      <p className="text-sm text-muted-foreground mb-3">
                                        {step.description}
                                      </p>
                                      
                                      {step.tips && (
                                        <div className="mb-3">
                                          <p className="text-xs font-medium text-muted-foreground mb-1">
                                            💡 Tips:
                                          </p>
                                          <ul className="text-xs text-muted-foreground space-y-1">
                                            {step.tips.map((tip, tipIdx) => (
                                              <li key={tipIdx}>• {tip}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <Button
                                      size="sm"
                                      variant={isCompleted ? "outline" : "default"}
                                      onClick={() => handleStepAction(step)}
                                      className="flex items-center"
                                    >
                                      {isCompleted ? (
                                        <>
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Revisit
                                        </>
                                      ) : (
                                        <>
                                          {step.action}
                                          <ArrowRight className="h-3 w-3 ml-1" />
                                        </>
                                      )}
                                    </Button>
                                    
                                    {!isCompleted && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => saveProgress(step.id, true)}
                                      >
                                        Mark Complete
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Outcomes */}
                          <div>
                            <h3 className="font-semibold mb-3">What You'll Achieve</h3>
                            <ul className="space-y-2">
                              {journey.outcomes.map((outcome, idx) => (
                                <li key={idx} className="flex items-center text-sm">
                                  <TrendingUp className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                                  {outcome}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};