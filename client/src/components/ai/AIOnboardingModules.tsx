import React, { useState } from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Progress } from '@/shared/components/ui/Progress';
import { Switch } from '@/shared/components/ui/Switch';
import { Label } from '@/shared/components/ui/Label';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import {
  Brain,
  MessageSquare,
  Settings,
  Activity,
  Users,
  Zap,
  Target,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  BarChart3,
  Shield,
  Lightbulb,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  BookOpen,
  GraduationCap,
  Rocket,
  Star,
  TrendingUp,
  Eye,
  Ear,
  FileText,
  Image,
  Video,
  Mic,
  Palette,
  Code,
  Database,
  Globe,
  Lock,
  Unlock,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Save,
  Loader2
} from 'lucide-react';

interface AIOnboardingModuleProps {
  moduleId: string;
  onComplete: (moduleId: string) => void;
  onSkip: (moduleId: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  estimatedTime: string;
  isCompleted: boolean;
}

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  examples: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

const AIOnboardingModules: React.FC<AIOnboardingModuleProps> = ({
  moduleId,
  onComplete,
  onSkip,
  isVisible,
  onClose
}) => {
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showInteractiveDemo, setShowInteractiveDemo] = useState(false);
  const [demoInput, setDemoInput] = useState('');
  const [demoResponse, setDemoResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // AI Features Overview
  const aiFeatures: AIFeature[] = [
    {
      id: 'chat-assistant',
      name: 'AI Chat Assistant',
      description: 'Your intelligent business partner for conversations and problem-solving',
      icon: <MessageSquare className="w-5 h-5" />,
      benefits: [
        'Get instant answers to business questions',
        'Brainstorm ideas and solutions',
        'Analyze data and generate insights',
        'Create content and documents'
      ],
      examples: [
        'Ask: "What are the key metrics I should track for my SaaS business?"',
        'Request: "Help me create a marketing strategy for Q4"',
        'Inquire: "How can I improve my customer retention rate?"'
      ],
      difficulty: 'beginner',
      estimatedTime: '5 min'
    },
    {
      id: 'agents',
      name: 'AI Agents',
      description: 'Specialized AI assistants for specific business functions',
      icon: <Users className="w-5 h-5" />,
      benefits: [
        'Department-specific expertise',
        'Automated task execution',
        'Continuous learning and improvement',
        'Scalable business operations'
      ],
      examples: [
        'Sales Agent: Qualifies leads and tracks opportunities',
        'Marketing Agent: Creates campaigns and analyzes performance',
        'Support Agent: Handles customer inquiries and escalations'
      ],
      difficulty: 'intermediate',
      estimatedTime: '10 min'
    },
    {
      id: 'models',
      name: 'AI Model Management',
      description: 'Configure and optimize AI models for your specific needs',
      icon: <Brain className="w-5 h-5" />,
      benefits: [
        'Choose the right model for each task',
        'Optimize performance and cost',
        'Customize model behavior',
        'Monitor and improve accuracy'
      ],
      examples: [
        'Select GPT-4 for creative tasks',
        'Use Claude for analytical work',
        'Configure temperature for response creativity'
      ],
      difficulty: 'advanced',
      estimatedTime: '15 min'
    },
    {
      id: 'performance',
      name: 'AI Performance Analytics',
      description: 'Track and optimize your AI system performance',
      icon: <BarChart3 className="w-5 h-5" />,
      benefits: [
        'Monitor AI accuracy and reliability',
        'Track usage and costs',
        'Identify improvement opportunities',
        'Optimize resource allocation'
      ],
      examples: [
        'View response time trends',
        'Analyze cost per interaction',
        'Track user satisfaction scores'
      ],
      difficulty: 'intermediate',
      estimatedTime: '8 min'
    },
    {
      id: 'capabilities',
      name: 'Advanced AI Capabilities',
      description: 'Explore cutting-edge AI features for business transformation',
      icon: <Rocket className="w-5 h-5" />,
      benefits: [
        'Multi-modal intelligence (text, image, voice)',
        'Contextual data completion',
        'Cross-departmental insights',
        'Predictive analytics'
      ],
      examples: [
        'Upload images for analysis',
        'Voice-to-text transcription',
        'Predictive business insights'
      ],
      difficulty: 'advanced',
      estimatedTime: '12 min'
    }
  ];

  // Interactive Demo Functions
  const handleDemoSubmit = async () => {
    if (!demoInput.trim()) return;
    
    setIsProcessing(true);
    setDemoResponse('');
    
    // Simulate AI processing
    setTimeout(() => {
      const responses = [
        "Based on your question, here are the key insights...",
        "I can help you with that! Here's what I found...",
        "Great question! Let me analyze this for you...",
        "Here's my recommendation based on best practices..."
      ];
      setDemoResponse(responses[Math.floor(Math.random() * responses.length)]);
      setIsProcessing(false);
    }, 2000);
  };

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const handleModuleComplete = () => {
    onComplete(moduleId);
  };

  const handleModuleSkip = () => {
    onSkip(moduleId);
  };

  const getCurrentFeature = () => {
    return aiFeatures.find(feature => feature.id === moduleId) || aiFeatures[0];
  };

  const currentFeature = getCurrentFeature();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              {currentFeature.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{currentFeature.name} Onboarding</h2>
              <p className="text-sm text-muted-foreground">
                Learn how to use {currentFeature.name.toLowerCase()} effectively
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleModuleSkip}>
              Skip
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
                <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {currentFeature.icon}
                      {currentFeature.name}
                    </CardTitle>
                    <CardDescription>
                      {currentFeature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {currentFeature.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {currentFeature.estimatedTime}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Key Benefits
                      </h4>
                      <ul className="space-y-2">
                        {currentFeature.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Example Use Cases
                      </h4>
                      <div className="space-y-2">
                        {currentFeature.examples.map((example, index) => (
                          <div key={index} className="p-3 bg-muted/50 rounded-lg text-sm">
                            {example}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Deep Dive</CardTitle>
                    <CardDescription>
                      Explore the specific capabilities and settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {moduleId === 'chat-assistant' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Conversation Types</h4>
                            <ul className="space-y-1 text-sm">
                              <li>• Business Analysis</li>
                              <li>• Strategy Planning</li>
                              <li>• Problem Solving</li>
                              <li>• Content Creation</li>
                            </ul>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Response Modes</h4>
                            <ul className="space-y-1 text-sm">
                              <li>• Detailed Analysis</li>
                              <li>• Quick Answers</li>
                              <li>• Step-by-step Guide</li>
                              <li>• Creative Suggestions</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {moduleId === 'agents' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Executive Agent</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              High-level strategic decisions and business oversight
                            </p>
                            <Badge variant="secondary">Strategic</Badge>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Departmental Agent</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              Specialized knowledge for specific business areas
                            </p>
                            <Badge variant="secondary">Specialized</Badge>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Specialist Agent</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              Deep expertise in specific tasks or processes
                            </p>
                            <Badge variant="secondary">Expert</Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {moduleId === 'models' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Model Selection</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">GPT-4</span>
                                <Badge variant="outline">Creative</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Claude</span>
                                <Badge variant="outline">Analytical</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Gemini</span>
                                <Badge variant="outline">Multimodal</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Configuration</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Temperature</span>
                                <span className="text-sm">0.7</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Max Tokens</span>
                                <span className="text-sm">4000</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Top P</span>
                                <span className="text-sm">0.9</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {moduleId === 'performance' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Key Metrics</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Response Time</span>
                                <Badge variant="outline">1.2s avg</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Accuracy</span>
                                <Badge variant="outline">94%</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">User Satisfaction</span>
                                <Badge variant="outline">4.8/5</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Cost Tracking</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">This Month</span>
                                <span className="text-sm">$45.20</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Per Request</span>
                                <span className="text-sm">$0.02</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Budget Used</span>
                                <span className="text-sm">23%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {moduleId === 'capabilities' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Multimodal Features</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm">Text Analysis</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Image className="w-4 h-4" />
                                <span className="text-sm">Image Recognition</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mic className="w-4 h-4" />
                                <span className="text-sm">Voice Processing</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                <span className="text-sm">Video Analysis</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Advanced Capabilities</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                <span className="text-sm">Data Integration</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-sm">Predictive Analytics</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                <span className="text-sm">Real-time Processing</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                <span className="text-sm">Security & Privacy</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="demo" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Interactive Demo</CardTitle>
                    <CardDescription>
                      Try out the {currentFeature.name.toLowerCase()} with a sample interaction
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="demo-input">Ask a question or describe what you'd like to do:</Label>
                        <Textarea
                          id="demo-input"
                          placeholder={`Try: ${currentFeature.examples[0]}`}
                          value={demoInput}
                          onChange={(e) => setDemoInput(e.target.value)}
                          className="mt-2"
                          rows={3}
                        />
                      </div>

                      <Button 
                        onClick={handleDemoSubmit} 
                        disabled={!demoInput.trim() || isProcessing}
                        className="w-full"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Get AI Response
                          </>
                        )}
                      </Button>

                      {demoResponse && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-semibold mb-2">AI Response:</h4>
                          <p className="text-sm">{demoResponse}</p>
                        </div>
                      )}

                      <div className="p-4 bg-primary/5 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Pro Tips
                        </h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Be specific in your questions for better responses</li>
                          <li>• Use follow-up questions to dive deeper</li>
                          <li>• The AI learns from your interactions</li>
                          <li>• You can always adjust settings later</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="next-steps" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Next Steps</CardTitle>
                    <CardDescription>
                      Continue your AI journey with these recommended actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Rocket className="w-4 h-4" />
                          Immediate Actions
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li>• Try the feature in a real scenario</li>
                          <li>• Customize settings to your preferences</li>
                          <li>• Connect your business data sources</li>
                          <li>• Set up notifications and alerts</li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          Learning Path
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li>• Complete other AI module tutorials</li>
                          <li>• Explore advanced features</li>
                          <li>• Join the community forum</li>
                          <li>• Schedule a personalized demo</li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-lg">
                      <h4 className="font-semibold mb-2">Ready to get started?</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        You now have the knowledge to use {currentFeature.name} effectively. 
                        Start exploring and discover how AI can transform your business!
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={handleModuleComplete} className="flex-1">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete Tutorial
                        </Button>
                        <Button variant="outline" onClick={handleModuleSkip}>
                          Skip for Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIOnboardingModules; 