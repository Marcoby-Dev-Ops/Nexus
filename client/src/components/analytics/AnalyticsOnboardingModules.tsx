import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Progress } from '@/shared/components/ui/Progress';
import { Textarea } from '@/shared/components/ui/Textarea';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Users, 
  Activity, 
  CheckCircle, 
  Sparkles, 
  Lightbulb, 
  Loader2, 
  X,
  Database,
  PieChart,
  LineChart,
  Calendar,
  Zap
} from 'lucide-react';

interface AnalyticsOnboardingModuleProps {
  moduleId: string;
  onComplete: (moduleId: string) => void;
  onSkip: (moduleId: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const AnalyticsOnboardingModules: React.FC<AnalyticsOnboardingModuleProps> = ({
  moduleId, onComplete, onSkip, isVisible, onClose
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showInteractiveDemo, setShowInteractiveDemo] = useState(false);
  const [demoInput, setDemoInput] = useState('');
  const [demoResponse, setDemoResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const analyticsFeatures = [
    {
      id: 'data-warehouse',
      name: 'Data Warehouse',
      description: 'Centralized data storage and management for all your business integrations',
      icon: Database,
      benefits: [
        'Unified data from all integrations',
        'Real-time data synchronization',
        'Advanced querying capabilities',
        'Data quality monitoring'
      ],
      examples: [
        'View customer data from HubSpot, Salesforce, and your CRM',
        'Track sales performance across multiple platforms',
        'Monitor marketing campaign effectiveness'
      ],
      difficulty: 'beginner',
      estimatedTime: '5-10 minutes'
    },
    {
      id: 'unified-analytics',
      name: 'Unified Analytics',
      description: 'Cross-platform insights and business intelligence',
      icon: BarChart3,
      benefits: [
        'Cross-platform data analysis',
        'Custom dashboard creation',
        'Real-time reporting',
        'Predictive analytics'
      ],
      examples: [
        'Create custom dashboards for different departments',
        'Set up automated reports',
        'Track key performance indicators'
      ],
      difficulty: 'intermediate',
      estimatedTime: '10-15 minutes'
    },
    {
      id: 'fire-cycle-analytics',
      name: 'Fire Cycle Analytics',
      description: 'Monitor and optimize your business cycles for maximum efficiency',
      icon: TrendingUp,
      benefits: [
        'Cycle performance tracking',
        'Success rate optimization',
        'Bottleneck identification',
        'Process improvement insights'
      ],
      examples: [
        'Track customer acquisition cycles',
        'Monitor product development timelines',
        'Analyze team collaboration patterns'
      ],
      difficulty: 'intermediate',
      estimatedTime: '8-12 minutes'
    },
    {
      id: 'integration-tracking',
      name: 'Integration Tracking',
      description: 'Monitor the health and performance of all your data integrations',
      icon: Activity,
      benefits: [
        'Integration health monitoring',
        'Sync status tracking',
        'Error detection and alerts',
        'Performance optimization'
      ],
      examples: [
        'Monitor Google Workspace sync status',
        'Track CRM data synchronization',
        'Set up alerts for failed integrations'
      ],
      difficulty: 'beginner',
      estimatedTime: '5-8 minutes'
    }
  ];

  const handleDemoSubmit = async () => {
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setDemoResponse('Your analytics query has been processed successfully! You can now view your data in the dashboard.');
      setIsProcessing(false);
    }, 2000);
  };

  const handleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
    if (stepIndex < 3) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const handleModuleComplete = () => {
    onComplete(moduleId);
  };

  const handleModuleSkip = () => {
    onSkip(moduleId);
  };

  const getCurrentFeature = () => {
    return analyticsFeatures.find(feature => feature.id === moduleId) || analyticsFeatures[0];
  };

  const currentFeature = getCurrentFeature();
  const progress = ((completedSteps.size + (currentStep > 0 ? 1 : 0)) / 4) * 100;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <currentFeature.icon className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold">{currentFeature.name}</h2>
                <p className="text-muted-foreground">{currentFeature.description}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Progress value={progress} className="mb-6" />

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
              <TabsTrigger value="next">Next Steps</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    What You'll Learn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentFeature.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Real-World Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentFeature.examples.map((example, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <span className="text-sm">{example}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{currentFeature.difficulty}</Badge>
                  <Badge variant="outline">{currentFeature.estimatedTime}</Badge>
                </div>
                <Button onClick={() => setCurrentStep(1)}>
                  Start Learning
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Key Features</CardTitle>
                  <CardDescription>
                    Explore the main capabilities of {currentFeature.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {currentFeature.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm">{benefit}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Learn how to use this feature effectively
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(0)}>
                  Previous
                </Button>
                <Button onClick={() => setCurrentStep(2)}>
                  Try Demo
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="demo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Interactive Demo</CardTitle>
                  <CardDescription>
                    Try out {currentFeature.name} with sample data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Sample Query</label>
                      <Textarea
                        placeholder="Enter your analytics query..."
                        value={demoInput}
                        onChange={(e) => setDemoInput(e.target.value)}
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
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Run Query'
                      )}
                    </Button>

                    {demoResponse && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">Success!</span>
                        </div>
                        <p className="text-sm text-green-700">{demoResponse}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Previous
                </Button>
                <Button onClick={() => setCurrentStep(3)}>
                  Continue
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="next" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                  <CardDescription>
                    You're ready to start using {currentFeature.name}!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Target className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium">Set up your first dashboard</h4>
                        <p className="text-sm text-muted-foreground">
                          Create custom views for your data
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Users className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">Invite team members</h4>
                        <p className="text-sm text-muted-foreground">
                          Share insights with your team
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <div>
                        <h4 className="font-medium">Schedule regular reviews</h4>
                        <p className="text-sm text-muted-foreground">
                          Set up automated reporting
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Previous
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleModuleSkip}>
                    Skip
                  </Button>
                  <Button onClick={handleModuleComplete}>
                    Complete Module
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOnboardingModules; 
