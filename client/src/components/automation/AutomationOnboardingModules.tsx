import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Separator } from '@/shared/components/ui/Separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import {
  Zap,
  Workflow,
  Target,
  CheckCircle,
  Clock,
  ArrowRight,
  Play,
  SkipForward,
  X,
  Settings,
  Code,
  GitBranch
} from 'lucide-react';

interface AutomationOnboardingModuleProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (moduleId: string) => void;
  onSkip: (moduleId: string) => void;
  featureId?: string;
}

interface AutomationFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  examples: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
}

const automationFeatures: AutomationFeature[] = [
  {
    id: 'workflow-basics',
    name: 'Workflow Basics',
    description: 'Learn the fundamentals of creating and managing automation workflows',
    icon: <Workflow className="w-5 h-5" />,
    benefits: [
      'Understand workflow triggers and actions',
      'Learn to create simple automations',
      'Master workflow testing and debugging'
    ],
    examples: [
      'Email automation when leads sign up',
      'CRM updates from form submissions',
      'Scheduled report generation'
    ],
    difficulty: 'beginner',
    estimatedTime: 15
  },
  {
    id: 'recipe-deployment',
    name: 'Recipe Deployment',
    description: 'Deploy pre-built automation recipes and customize them for your needs',
    icon: <Zap className="w-5 h-5" />,
    benefits: [
      'Deploy proven automation patterns',
      'Customize recipes for your business',
      'Monitor and optimize performance'
    ],
    examples: [
      'Lead capture to CRM automation',
      'Invoice reminder system',
      'Customer onboarding workflow'
    ],
    difficulty: 'beginner',
    estimatedTime: 20
  },
  {
    id: 'advanced-workflows',
    name: 'Advanced Workflows',
    description: 'Build complex multi-step workflows with conditional logic',
    icon: <Code className="w-5 h-5" />,
    benefits: [
      'Create conditional workflows',
      'Integrate multiple systems',
      'Build error handling and retries'
    ],
    examples: [
      'Multi-stage lead nurturing',
      'Complex approval workflows',
      'Data synchronization between systems'
    ],
    difficulty: 'intermediate',
    estimatedTime: 30
  },
  {
    id: 'workflow-monitoring',
    name: 'Workflow Monitoring',
    description: 'Monitor, debug, and optimize your automation workflows',
    icon: <Target className="w-5 h-5" />,
    benefits: [
      'Track workflow performance',
      'Debug failed executions',
      'Optimize for efficiency'
    ],
    examples: [
      'Performance analytics dashboard',
      'Error alerting system',
      'Workflow optimization insights'
    ],
    difficulty: 'intermediate',
    estimatedTime: 25
  }
];

export function AutomationOnboardingModules({
  isOpen,
  onClose,
  onComplete,
  onSkip,
  featureId
}: AutomationOnboardingModuleProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showInteractiveDemo, setShowInteractiveDemo] = useState(false);
  const [demoInput, setDemoInput] = useState('');
  const [demoResponse, setDemoResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentFeature = featureId 
    ? automationFeatures.find(f => f.id === featureId)
    : automationFeatures[0];

  const handleDemoSubmit = async () => {
    if (!demoInput.trim()) return;
    
    setIsProcessing(true);
    setDemoResponse('');
    
    // Simulate processing
    setTimeout(() => {
      setDemoResponse(`Demo response for: "${demoInput}"`);
      setIsProcessing(false);
    }, 2000);
  };

  const handleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
  };

  const handleModuleComplete = () => {
    if (currentFeature) {
      onComplete(currentFeature.id);
    }
  };

  const handleModuleSkip = () => {
    if (currentFeature) {
      onSkip(currentFeature.id);
    }
  };

  const getCurrentFeature = () => {
    return currentFeature || automationFeatures[0];
  };

  if (!isOpen) return null;

  const feature = getCurrentFeature();
  const progress = (completedSteps.size / 3) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {feature.icon}
            {feature.name} - Automation Learning
          </DialogTitle>
          <DialogDescription>
            Master automation workflows with interactive tutorials
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
            <TabsTrigger value="next">Next Steps</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {feature.icon}
                  {feature.name}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {feature.estimatedTime} min
                  </Badge>
                  <Badge variant="outline">
                    <Target className="w-3 h-3 mr-1" />
                    {feature.difficulty}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">What you'll learn:</h4>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
                <CardDescription>
                  Explore the main capabilities of {feature.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {feature.examples.map((example, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Example {index + 1}</h4>
                      <p className="text-sm text-muted-foreground">{example}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Demo</CardTitle>
                <CardDescription>
                  Try out {feature.name} with a hands-on example
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Demo Input</label>
                    <Input
                      value={demoInput}
                      onChange={(e) => setDemoInput(e.target.value)}
                      placeholder="Enter your demo input..."
                      className="mt-1"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleDemoSubmit}
                    disabled={isProcessing || !demoInput.trim()}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Demo
                      </>
                    )}
                  </Button>

                  {demoResponse && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Demo Response:</h4>
                      <p className="text-sm">{demoResponse}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="next" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>
                  Continue your automation journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Ready to start?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      You're ready to begin using {feature.name}. Click below to start your first automation.
                    </p>
                    <Button onClick={handleModuleComplete} className="w-full">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Module
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Need more time?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      You can skip this module and return to it later from your dashboard.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleModuleSkip}
                      className="w-full"
                    >
                      <SkipForward className="w-4 h-4 mr-2" />
                      Skip for Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 
