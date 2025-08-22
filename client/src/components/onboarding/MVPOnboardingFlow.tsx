import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Users, 
  Building2, 
  BarChart3,
  Activity,
  ArrowRight,
  Play,
  CheckCircle,
  AlertTriangle,
  Star,
  Rocket,
  Briefcase,
  MessageSquare,
  FileText,
  PieChart,
  Calendar,
  Plus,
  Target,
  Globe,
  DollarSign,
  Settings,
  Lightbulb,
  Clock,
  ArrowLeft
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { useAuth } from '@/hooks/index';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { OnboardingService } from '@/shared/services/OnboardingService';
import { useMaturityFramework } from '@/hooks/useMaturityFramework';

/**
 * MVP Onboarding Flow - "Tool as a Skill-Bridge" Philosophy
 * 
 * Success Criteria:
 * - Users can onboard, connect tools, and take an action within 10 minutes
 * - Feedback shows Nexus helps them act on ideas without having to learn every skill first
 */

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  isRequired: boolean;
  component: React.ComponentType<OnboardingStepProps>;
}

interface OnboardingStepProps {
  onNext: (data: any) => void;
  onSkip: () => void;
  data: any;
  currentStep: number;
  totalSteps: number;
}

const MVPOnboardingFlow: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const onboardingService = new OnboardingService();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Your Business Brain',
      description: 'Experience how Nexus transforms business operations',
      estimatedTime: '1 min',
      isRequired: true,
      component: WelcomeStep
    },
    {
      id: 'business-units',
      title: 'Set Up Your Business Units',
      description: 'Configure your core business functions',
      estimatedTime: '2 min',
      isRequired: true,
      component: BusinessUnitsStep
    },
    {
      id: 'integrations',
      title: 'Connect Your Tools',
      description: 'Bring your existing tools into one hub',
      estimatedTime: '3 min',
      isRequired: false,
      component: IntegrationsStep
    },
    {
      id: 'maturity-assessment',
      title: 'Business Maturity Assessment',
      description: 'Assess your current business maturity level',
      estimatedTime: '3 min',
      isRequired: true,
      component: MaturityAssessmentStep
    },
    {
      id: 'goals-kpis',
      title: 'Define Your Goals',
      description: 'Set clear objectives and success metrics',
      estimatedTime: '2 min',
      isRequired: true,
      component: GoalsKPIsStep
    },
    {
      id: 'first-action',
      title: 'Take Your First Action',
      description: 'Experience immediate value with AI assistance',
      estimatedTime: '2 min',
      isRequired: true,
      component: FirstActionStep
    }
  ];

  const handleNext = async (stepData: any) => {
    const currentStepData = steps[currentStep];
    
    // Save step data
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);
    
    // Mark step as completed
    setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
    
    // Save to database
    if (user?.id) {
      // TODO: Implement saveStep functionality
      console.log('Saving step data:', currentStepData.id, updatedData);
    }
    
    // Move to next step or complete
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(updatedData);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const CurrentStepComponent = currentStepData.component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Nexus Setup</h1>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {currentStepData.estimatedTime}
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent
                onNext={handleNext}
                onSkip={handleSkip}
                data={formData}
                currentStep={currentStep}
                totalSteps={steps.length}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              {!currentStepData.isRequired && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
              )}
              <Button 
                onClick={() => handleNext({})}
                className="min-w-[120px]"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Setup
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 1: Welcome Step
const WelcomeStep: React.FC<OnboardingStepProps> = ({ onNext }) => {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Brain className="w-24 h-24 mx-auto text-primary mb-6" />
        </motion.div>
        
        <h1 className="text-3xl font-bold">
          Welcome to Your Business Brain
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Nexus is your AI-powered business operating system that lets you execute your vision 
          without mastering every skill. You focus on goals, we handle the expertise.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 mx-auto mb-4 text-blue-600" />
            <h3 className="font-semibold mb-2">Clarity First</h3>
            <p className="text-sm text-muted-foreground">
              Every feature makes it obvious what to do next
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-4 text-green-600" />
            <h3 className="font-semibold mb-2">Delegation by Design</h3>
            <p className="text-sm text-muted-foreground">
              Easily hand off tasks to team members or AI agents
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Zap className="w-8 h-8 mx-auto mb-4 text-purple-600" />
            <h3 className="font-semibold mb-2">Execute Immediately</h3>
            <p className="text-sm text-muted-foreground">
              Turn ideas into actions without learning every domain
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">What You'll Set Up</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Building2 className="w-5 h-5 text-primary" />
            <span>Business Units (Sales, Marketing, Ops, Finance)</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Globe className="w-5 h-5 text-primary" />
            <span>Key Integrations</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Target className="w-5 h-5 text-primary" />
            <span>Goals & KPIs</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Play className="w-5 h-5 text-primary" />
            <span>First Action</span>
          </div>
        </div>
      </div>

      <Button 
        onClick={() => onNext({})}
        size="lg"
        className="mt-8"
      >
        <Rocket className="w-4 h-4 mr-2" />
        Start Setup
      </Button>
    </div>
  );
};

// Step 2: Business Units Step
const BusinessUnitsStep: React.FC<OnboardingStepProps> = ({ onNext, data }) => {
  const [selectedUnits, setSelectedUnits] = useState<string[]>(data.businessUnits || []);

  const businessUnits = [
    {
      id: 'sales',
      name: 'Sales',
      description: 'Revenue generation and pipeline management',
      icon: <TrendingUp className="w-6 h-6" />,
      benefits: ['Pipeline tracking', 'Deal analysis', 'Revenue forecasting']
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'Lead generation and brand awareness',
      icon: <Globe className="w-6 h-6" />,
      benefits: ['Campaign management', 'Lead tracking', 'Brand analytics']
    },
    {
      id: 'operations',
      name: 'Operations',
      description: 'Process optimization and efficiency',
      icon: <Settings className="w-6 h-6" />,
      benefits: ['Workflow automation', 'Process monitoring', 'Resource optimization']
    },
    {
      id: 'finance',
      name: 'Finance',
      description: 'Financial health and cash flow',
      icon: <DollarSign className="w-6 h-6" />,
      benefits: ['Cash flow tracking', 'Expense management', 'Financial reporting']
    }
  ];

  const handleUnitToggle = (unitId: string) => {
    setSelectedUnits(prev => 
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const handleNext = () => {
    onNext({ businessUnits: selectedUnits });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Set Up Your Business Units</h2>
        <p className="text-muted-foreground">
          Select the core functions of your business. You can always add more later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {businessUnits.map((unit) => (
          <Card 
            key={unit.id}
            className={`cursor-pointer transition-all ${
              selectedUnits.includes(unit.id) 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => handleUnitToggle(unit.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  {unit.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{unit.name}</h3>
                    <Checkbox 
                      checked={selectedUnits.includes(unit.id)}
                      onChange={() => handleUnitToggle(unit.id)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {unit.description}
                  </p>
                  <div className="space-y-1">
                    {unit.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button 
          onClick={handleNext}
          disabled={selectedUnits.length === 0}
          size="lg"
        >
          Continue with {selectedUnits.length} Business Unit{selectedUnits.length !== 1 ? 's' : ''}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Step 3: Integrations Step
const IntegrationsStep: React.FC<OnboardingStepProps> = ({ onNext, data }) => {
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(data.integrations || []);

  const integrations = [
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'CRM and marketing automation',
      icon: '🔵',
      category: 'CRM'
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Accounting and financial management',
      icon: '🟢',
      category: 'Finance'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Team communication and collaboration',
      icon: '🟡',
      category: 'Communication'
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      description: 'Website and marketing analytics',
      icon: '🔴',
      category: 'Analytics'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing and billing',
      icon: '🟣',
      category: 'Finance'
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Email marketing and automation',
      icon: '🟠',
      category: 'Marketing'
    }
  ];

  const handleIntegrationToggle = (integrationId: string) => {
    setSelectedIntegrations(prev => 
      prev.includes(integrationId)
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    );
  };

  const handleNext = () => {
    onNext({ integrations: selectedIntegrations });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Connect Your Tools</h2>
        <p className="text-muted-foreground">
          Bring your existing business tools into Nexus for unified insights and automation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <Card 
            key={integration.id}
            className={`cursor-pointer transition-all ${
              selectedIntegrations.includes(integration.id) 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => handleIntegrationToggle(integration.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{integration.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{integration.name}</h3>
                    <Checkbox 
                      checked={selectedIntegrations.includes(integration.id)}
                      onChange={() => handleIntegrationToggle(integration.id)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {integration.category}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Don't see your tool? You can add more integrations later.
        </p>
        <Button 
          onClick={handleNext}
          size="lg"
        >
          Continue with {selectedIntegrations.length} Integration{selectedIntegrations.length !== 1 ? 's' : ''}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Step 4: Goals & KPIs Step
const GoalsKPIsStep: React.FC<OnboardingStepProps> = ({ onNext, data }) => {
  const [selectedGoal, setSelectedGoal] = useState(data.selectedGoal || '');
  const [goalDetails, setGoalDetails] = useState(data.goalDetails || '');
  const [timeframe, setTimeframe] = useState(data.timeframe || '');

  const goalOptions = [
    {
      id: 'increase-revenue',
      title: 'Increase Revenue',
      description: 'Grow sales and improve profitability',
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      id: 'improve-efficiency',
      title: 'Improve Efficiency',
      description: 'Optimize processes and reduce costs',
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 'expand-market',
      title: 'Expand Market',
      description: 'Reach new customers and markets',
      icon: <Globe className="w-5 h-5" />
    },
    {
      id: 'build-team',
      title: 'Build Team',
      description: 'Scale operations and team growth',
      icon: <Users className="w-5 h-5" />
    }
  ];

  const timeframeOptions = [
    { value: '1-month', label: '1 Month' },
    { value: '3-months', label: '3 Months' },
    { value: '6-months', label: '6 Months' },
    { value: '1-year', label: '1 Year' }
  ];

  const handleNext = () => {
    onNext({
      selectedGoal,
      goalDetails,
      timeframe
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Define Your Primary Goal</h2>
        <p className="text-muted-foreground">
          Tell us what you want to achieve. Nexus will help you get there.
        </p>
      </div>

      <div className="space-y-6">
        {/* Goal Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">What's your primary business goal?</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goalOptions.map((goal) => (
              <Card 
                key={goal.id}
                className={`cursor-pointer transition-all ${
                  selectedGoal === goal.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedGoal(goal.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {goal.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{goal.title}</h3>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Goal Details */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Tell us more about your goal</Label>
          <Input
            placeholder="e.g., Increase monthly revenue by 25% through better lead qualification and sales process optimization"
            value={goalDetails}
            onChange={(e) => setGoalDetails(e.target.value)}
            className="h-20"
          />
        </div>

        {/* Timeframe */}
        <div className="space-y-4">
          <Label className="text-base font-medium">What's your timeframe?</Label>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger>
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              {timeframeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-center">
        <Button 
          onClick={handleNext}
          disabled={!selectedGoal || !goalDetails || !timeframe}
          size="lg"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Step 5: First Action Step
const FirstActionStep: React.FC<OnboardingStepProps> = ({ onNext, data }) => {
  const [selectedAction, setSelectedAction] = useState<string>('');

  const firstActions = [
    {
      id: 'review-pipeline',
      title: 'Review Sales Pipeline',
      description: 'Analyze your current deals and opportunities',
      category: 'sales',
      estimatedTime: '5 min',
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      id: 'optimize-campaign',
      title: 'Optimize Marketing Campaign',
      description: 'Improve your current marketing performance',
      category: 'marketing',
      estimatedTime: '10 min',
      icon: <Globe className="w-5 h-5" />
    },
    {
      id: 'analyze-finances',
      title: 'Analyze Financial Health',
      description: 'Review your cash flow and financial metrics',
      category: 'finance',
      estimatedTime: '8 min',
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      id: 'process-review',
      title: 'Review Business Processes',
      description: 'Identify optimization opportunities',
      category: 'operations',
      estimatedTime: '12 min',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  const handleNext = () => {
    onNext({ firstAction: selectedAction });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Take Your First Action</h2>
        <p className="text-muted-foreground">
          Experience immediate value with AI assistance. Choose an action to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {firstActions.map((action) => (
          <Card 
            key={action.id}
            className={`cursor-pointer transition-all ${
              selectedAction === action.id 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => setSelectedAction(action.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{action.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {action.estimatedTime}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {action.description}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {action.category}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-600" />
            <span className="font-medium">AI-Powered Analysis</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Nexus will analyze your data and provide personalized insights and recommendations.
          </p>
        </div>
        
        <Button 
          onClick={handleNext}
          disabled={!selectedAction}
          size="lg"
        >
          <Play className="w-4 h-4 mr-2" />
          Start My First Action
        </Button>
      </div>
    </div>
  );
};

// Maturity Assessment Step Component
const MaturityAssessmentStep: React.FC<OnboardingStepProps> = ({ onNext, data }) => {
  const { conductAssessment, loading } = useMaturityFramework();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [maturityScore, setMaturityScore] = useState<number>(0);
  const [liveUpdates, setLiveUpdates] = useState<boolean>(false);
  const [integrationMaturity, setIntegrationMaturity] = useState<{
    overallScore: number;
    domainScores: Array<{ domain: string; score: number; boost: number }>;
  } | null>(null);

  // ✅ NEW: Integration-maturity impact mapping
  const integrationMaturityImpact: Record<string, {
    domain: string;
    maturityBoost: number;
    requirements: string[];
    capabilities: string[];
  }> = {
    'hubspot': {
      domain: 'sales',
      maturityBoost: 0.8,
      requirements: ['crm_setup', 'pipeline_management'],
      capabilities: ['lead_tracking', 'deal_management', 'email_automation']
    },
    'quickbooks': {
      domain: 'finance',
      maturityBoost: 0.7,
      requirements: ['accounting_setup', 'chart_of_accounts'],
      capabilities: ['financial_reporting', 'expense_tracking', 'invoice_management']
    },
    'slack': {
      domain: 'operations',
      maturityBoost: 0.5,
      requirements: ['team_communication'],
      capabilities: ['real_time_collaboration', 'workflow_automation']
    },
    'google-analytics': {
      domain: 'marketing',
      maturityBoost: 0.6,
      requirements: ['website_tracking'],
      capabilities: ['performance_analytics', 'conversion_tracking']
    },
    'microsoft365': {
      domain: 'operations',
      maturityBoost: 0.4,
      requirements: ['office_suite'],
      capabilities: ['document_management', 'email_calendar']
    },
    'stripe': {
      domain: 'finance',
      maturityBoost: 0.6,
      requirements: ['payment_processing'],
      capabilities: ['payment_processing', 'subscription_management']
    }
  };

  // ✅ NEW: Calculate maturity from integrations
  const calculateMaturityFromIntegrations = useCallback(async (selectedTools: Record<string, string[]>) => {
    const domainScores: Array<{ domain: string; score: number; boost: number }> = [];
    const domainBoosts: Record<string, number> = {};
    
    // Calculate boosts for each domain based on connected tools
    for (const [category, tools] of Object.entries(selectedTools)) {
      for (const tool of tools) {
        const impact = integrationMaturityImpact[tool];
        if (impact) {
          if (!domainBoosts[impact.domain]) {
            domainBoosts[impact.domain] = 0;
          }
          domainBoosts[impact.domain] += impact.maturityBoost;
        }
      }
    }

    // Calculate domain scores (base score + integration boost)
    const domains = ['sales', 'marketing', 'operations', 'finance'];
    let totalScore = 0;
    
    domains.forEach(domain => {
      const baseScore = 1.0; // Base maturity level
      const boost = domainBoosts[domain] || 0;
      const domainScore = Math.min(5.0, baseScore + boost);
      
      domainScores.push({
        domain,
        score: domainScore,
        boost
      });
      
      totalScore += domainScore;
    });

    const overallScore = totalScore / domains.length;
    
    return {
      overallScore,
      domainScores
    };
  }, []);

  // ✅ NEW: Real-time maturity updates from integration connections
  useEffect(() => {
    if (data.selectedTools && Object.keys(data.selectedTools).length > 0) {
      const calculateLiveMaturity = async () => {
        const result = await calculateMaturityFromIntegrations(data.selectedTools);
        setMaturityScore(result.overallScore);
        setIntegrationMaturity(result);
        setLiveUpdates(true);
      };
      calculateLiveMaturity();
    }
  }, [data.selectedTools, calculateMaturityFromIntegrations]);

  const maturityQuestions = [
    {
      id: 'business-size',
      text: 'How many employees does your business have?',
      type: 'multiple_choice',
      options: ['1-5', '6-25', '26-100', '101-500', '500+']
    },
    {
      id: 'process-automation',
      text: 'How automated are your core business processes?',
      type: 'multiple_choice',
      options: ['Mostly manual', 'Partially automated', 'Mostly automated', 'Fully automated']
    },
    {
      id: 'data-tracking',
      text: 'How do you currently track business metrics?',
      type: 'multiple_choice',
      options: ['Spreadsheets', 'Basic tools', 'Integrated systems', 'Advanced analytics']
    },
    {
      id: 'team-structure',
      text: 'How is your team organized?',
      type: 'multiple_choice',
      options: ['Informal', 'Basic roles', 'Structured departments', 'Cross-functional teams']
    },
    {
      id: 'technology-stack',
      text: 'What technology tools do you use?',
      type: 'multiple_choice',
      options: ['Basic tools', 'Industry standard', 'Integrated platform', 'Advanced AI tools']
    }
  ];

  const handleAnswer = (questionId: string, answer: any) => {
    setResponses(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = async () => {
    if (currentQuestion < maturityQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Complete assessment
      try {
        // ✅ NEW: Include integration maturity data in assessment
        const assessmentData = {
          ...responses,
          integrationMaturity,
          liveMaturityScore: maturityScore
        };
        
        await conductAssessment(assessmentData);
        setAssessmentComplete(true);
        onNext({ maturityAssessment: assessmentData });
      } catch (error) {
        console.error('Assessment failed:', error);
        onNext({ maturityAssessment: responses });
      }
    }
  };

  const handleSkip = () => {
    onNext({ maturityAssessment: responses });
  };

  const currentQ = maturityQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / maturityQuestions.length) * 100;

  if (assessmentComplete) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-4">
          <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
          <h2 className="text-2xl font-bold">Assessment Complete!</h2>
          <p className="text-muted-foreground">
            We've analyzed your business maturity. Your current score: <strong>{maturityScore.toFixed(1)}/5.0</strong>
          </p>
          {integrationMaturity && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Integration Impact</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {integrationMaturity.domainScores.map((domain) => (
                  <div key={domain.domain} className="flex justify-between">
                    <span className="capitalize">{domain.domain}:</span>
                    <span className="font-medium">+{domain.boost.toFixed(1)} boost</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            You'll see personalized insights and recommendations on your dashboard.
          </p>
        </div>
        <Button onClick={() => onNext({ maturityAssessment: { ...responses, integrationMaturity, liveMaturityScore: maturityScore } })} size="lg">
          Continue to Goals
        </Button>
      </div>
    );
  }

  // ✅ NEW: Show live maturity progress during onboarding
  const renderLiveMaturityProgress = () => (
    <div className="mb-6 p-4 bg-primary/5 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">Live Maturity Score</span>
        <span className="text-2xl font-bold text-primary">{maturityScore.toFixed(1)}/5.0</span>
      </div>
      <Progress value={(maturityScore / 5) * 100} className="w-full" />
      {liveUpdates && (
        <p className="text-sm text-muted-foreground mt-2">
          ✨ Your score updates as you connect tools!
        </p>
      )}
      {integrationMaturity && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {integrationMaturity.domainScores.map((domain) => (
            <div key={domain.domain} className="flex justify-between">
              <span className="capitalize">{domain.domain}:</span>
              <span className="font-medium">{domain.score.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Business Maturity Assessment</h2>
        <p className="text-muted-foreground">
          Help us understand your current business setup to provide personalized recommendations.
        </p>
        <Progress value={progress} className="w-full" />
        <div className="text-sm text-muted-foreground">
          Question {currentQuestion + 1} of {maturityQuestions.length}
        </div>
      </div>

      {/* ✅ NEW: Live maturity progress */}
      {renderLiveMaturityProgress()}

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">{currentQ.text}</h3>
              
              <div className="space-y-3">
                {currentQ.options?.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      responses[currentQ.id] === option
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleAnswer(currentQ.id, option)}
                  >
                    <div className="font-medium">{option}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={handleSkip}>
                Skip Assessment
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!responses[currentQ.id] || loading}
              >
                {currentQuestion < maturityQuestions.length - 1 ? 'Next Question' : 'Complete Assessment'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MVPOnboardingFlow;
