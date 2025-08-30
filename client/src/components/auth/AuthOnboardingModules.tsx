import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Separator } from '@/shared/components/ui/Separator';
import { 
  User, 
  Shield, 
  Bell, 
  Eye, 
  Download, 
  Settings,
  CheckCircle,
  Clock,
  ArrowRight,
  Play,
  SkipForward,
  X
} from 'lucide-react';

interface AuthOnboardingModuleProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (moduleId: string) => void;
  onSkip: (moduleId: string) => void;
  moduleId: string | null;
}

interface AuthFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  examples: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
}

const authFeatures: AuthFeature[] = [
  {
    id: 'account-setup',
    name: 'Account Setup',
    description: 'Learn how to create and configure your account for optimal use',
    icon: <User className="w-5 h-5" />,
    benefits: [
      'Secure account creation',
      'Email verification process',
      'Initial profile setup',
      'Welcome tour navigation'
    ],
    examples: [
      'Creating a new account with email',
      'Setting up your display name',
      'Choosing your timezone',
      'Completing the welcome tour'
    ],
    difficulty: 'beginner',
    estimatedTime: 5,
  },
  {
    id: 'profile-management',
    name: 'Profile Management',
    description: 'Set up your profile and personal information for better collaboration',
    icon: <User className="w-5 h-5" />,
    benefits: [
      'Professional profile presentation',
      'Contact information management',
      'Work history and skills',
      'Avatar and branding'
    ],
    examples: [
      'Adding your job title and company',
      'Setting up business and personal emails',
      'Writing a professional bio',
      'Uploading a profile picture'
    ],
    difficulty: 'beginner',
    estimatedTime: 10,
  },
  {
    id: 'security-settings',
    name: 'Security Settings',
    description: 'Configure password, 2FA, and security preferences for account protection',
    icon: <Shield className="w-5 h-5" />,
    benefits: [
      'Enhanced account security',
      'Two-factor authentication',
      'Password management',
      'Session control'
    ],
    examples: [
      'Changing your password',
      'Enabling two-factor authentication',
      'Managing active sessions',
      'Setting session timeout'
    ],
    difficulty: 'intermediate',
    estimatedTime: 15,
  },
  {
    id: 'notification-preferences',
    name: 'Notification Preferences',
    description: 'Customize your notification settings to stay informed without overwhelm',
    icon: <Bell className="w-5 h-5" />,
    benefits: [
      'Personalized notifications',
      'Reduced notification noise',
      'Important updates focus',
      'Email and push notification control'
    ],
    examples: [
      'Configuring email notifications',
      'Setting up push notifications',
      'Managing marketing emails',
      'Creating notification schedules'
    ],
    difficulty: 'beginner',
    estimatedTime: 8,
  },
  {
    id: 'privacy-settings',
    name: 'Privacy Settings',
    description: 'Control your data and privacy preferences for complete control',
    icon: <Eye className="w-5 h-5" />,
    benefits: [
      'Data privacy control',
      'Profile visibility management',
      'Analytics opt-out options',
      'Location services control'
    ],
    examples: [
      'Setting profile visibility',
      'Controlling data collection',
      'Managing location services',
      'Privacy policy review'
    ],
    difficulty: 'intermediate',
    estimatedTime: 12,
  },
  {
    id: 'data-management',
    name: 'Data Management',
    description: 'Learn about data export and account deletion for data control',
    icon: <Download className="w-5 h-5" />,
    benefits: [
      'Data export capabilities',
      'Account deletion options',
      'Data backup strategies',
      'GDPR compliance'
    ],
    examples: [
      'Exporting your data',
      'Understanding data retention',
      'Account deactivation',
      'Complete account deletion'
    ],
    difficulty: 'advanced',
    estimatedTime: 20,
  },
];

export function AuthOnboardingModules({ 
  isOpen, 
  onClose, 
  onComplete, 
  onSkip, 
  moduleId 
}: AuthOnboardingModuleProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showInteractiveDemo, setShowInteractiveDemo] = useState(false);
  const [demoInput, setDemoInput] = useState('');
  const [demoResponse, setDemoResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentFeature = authFeatures.find(f => f.id === moduleId);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim()) return;

    setIsProcessing(true);
    setDemoResponse('');

    // Simulate processing
    setTimeout(() => {
      setDemoResponse(`Great! You've successfully completed the demo for "${currentFeature?.name}". This shows you how the feature works in practice.`);
      setIsProcessing(false);
    }, 2000);
  };

  const handleStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps(prev => [...prev, stepIndex]);
    }
  };

  const handleModuleComplete = () => {
    if (moduleId) {
      onComplete(moduleId);
    }
  };

  const handleModuleSkip = () => {
    if (moduleId) {
      onSkip(moduleId);
    }
  };

  const getCurrentFeature = () => {
    return currentFeature || authFeatures[0];
  };

  if (!isOpen || !currentFeature) {
    return null;
  }

  const progress = (completedSteps.length / 4) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentFeature.icon}
                <div>
                  <CardTitle>{currentFeature.name}</CardTitle>
                  <CardDescription>{currentFeature.description}</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
                <TabsTrigger value="next">Next Steps</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentFeature.difficulty}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {currentFeature.estimatedTime} minutes
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Key Benefits</h4>
                      <ul className="space-y-2">
                        {currentFeature.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">What You'll Learn</h4>
                      <ul className="space-y-2">
                        {currentFeature.examples.map((example, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Feature Walkthrough</h4>
                  
                  <div className="space-y-4">
                    {currentFeature.benefits.map((benefit, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <div>
                              <h5 className="font-medium">{benefit}</h5>
                              <p className="text-sm text-muted-foreground">
                                {currentFeature.examples[index]}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={completedSteps.includes(index) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleStepComplete(index)}
                          >
                            {completedSteps.includes(index) ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {completedSteps.length} of {currentFeature.benefits.length} completed
                      </span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="demo" className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Interactive Demo</h4>
                  <p className="text-sm text-muted-foreground">
                    Try out the {currentFeature.name.toLowerCase()} feature with this interactive demo.
                  </p>

                  <div className="p-4 border rounded-lg bg-muted/50">
                    <form onSubmit={handleDemoSubmit} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Demo Input</label>
                        <textarea
                          value={demoInput}
                          onChange={(e) => setDemoInput(e.target.value)}
                          placeholder="Enter your demo input here..."
                          className="w-full p-3 border rounded-md mt-1"
                          rows={3}
                        />
                      </div>
                      
                      <Button type="submit" disabled={isProcessing || !demoInput.trim()}>
                        {isProcessing ? 'Processing...' : 'Run Demo'}
                      </Button>
                    </form>

                    {demoResponse && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">{demoResponse}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="next" className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Next Steps</h4>
                  <p className="text-sm text-muted-foreground">
                    You're ready to start using {currentFeature.name.toLowerCase()}! Here's what you can do next:
                  </p>

                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium mb-2">1. Apply What You've Learned</h5>
                      <p className="text-sm text-muted-foreground">
                        Go to your settings and configure {currentFeature.name.toLowerCase()} according to your preferences.
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium mb-2">2. Explore Related Features</h5>
                      <p className="text-sm text-muted-foreground">
                        Check out other auth features to complete your account setup.
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium mb-2">3. Get Help if Needed</h5>
                      <p className="text-sm text-muted-foreground">
                        Visit our help center for detailed guides and troubleshooting.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button onClick={handleModuleComplete} className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Module
                    </Button>
                    <Button variant="outline" onClick={handleModuleSkip}>
                      <SkipForward className="w-4 h-4 mr-2" />
                      Skip for Now
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
