import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { useCompanyProvisioning } from '@/shared/hooks/useCompanyProvisioning.ts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Progress } from '@/shared/components/ui/Progress.tsx';
import { 
  User, 
  Building2, 
  Zap, 
  Brain, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Target,
  Users,
  Mail,
  Calendar,
  Settings,
  Play,
  MessageSquare,
  DollarSign
} from 'lucide-react';

interface AppWithOnboardingProps {
  children: React.ReactNode;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<OnboardingStepProps>;
  icon: React.ReactNode;
  estimatedTime: string;
}

interface OnboardingStepProps {
  onNext: (data: any) => void;
  onSkip: () => void;
  data: any;
  currentStep: number;
  totalSteps: number;
}

// Step 1: Basic Information (Slack-inspired)
const BasicInfoStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const { user } = useAuth();
  const { createDefaultCompany } = useCompanyProvisioning();
  const [firstName, setFirstName] = useState(data.firstName || '');
  const [lastName, setLastName] = useState(data.lastName || '');
  const [displayName, setDisplayName] = useState(data.displayName || '');
  const [jobTitle, setJobTitle] = useState(data.jobTitle || '');
  const [company, setCompany] = useState(data.company || '');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  // Debug logging
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[BasicInfoStep] Form state: ', { firstName, lastName, displayName, jobTitle, company });

  const handleNext = async () => {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[BasicInfoStep] Submitting form with data: ', { firstName, lastName, displayName, jobTitle, company });
    
    // Create company if user doesn't have one
    if (user?.id && !isCreatingCompany) {
      setIsCreatingCompany(true);
      try {
        const result = await createDefaultCompany();
        if (result.success) {
          console.log('[BasicInfoStep] Company created successfully:', result.companyId);
        } else {
          console.warn('[BasicInfoStep] Failed to create company:', result.error);
        }
      } catch (error) {
        console.error('[BasicInfoStep] Error creating company:', error);
      } finally {
        setIsCreatingCompany(false);
      }
    }
    
    onNext({
      firstName,
      lastName,
      displayName: displayName || `${firstName} ${lastName}`.trim(),
      jobTitle,
      company
    });
  };

  const canProceed = firstName.trim() && lastName.trim();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2">Welcome to Nexus</h2>
        <p className="text-muted-foreground text-lg">Let's get to know you and your business</p>
        <div className="flex justify-center mt-4">
          <Badge variant="secondary" className="text-sm">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[BasicInfoStep] First name changed: ', e.target.value);
                  setFirstName(e.target.value);
                }}
                className="w-full p-3 border rounded-lg focus: ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="John"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[BasicInfoStep] Last name changed: ', e.target.value);
                  setLastName(e.target.value);
                }}
                className="w-full p-3 border rounded-lg focus: ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="Smith"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[BasicInfoStep] Display name changed: ', e.target.value);
                setDisplayName(e.target.value);
              }}
              className="w-full p-3 border rounded-lg focus: ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="How you'd like to be called"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => {
                // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[BasicInfoStep] Job title changed: ', e.target.value);
                setJobTitle(e.target.value);
              }}
              className="w-full p-3 border rounded-lg focus: ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="e.g., CEO, Manager, Developer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => {
                // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[BasicInfoStep] Company changed: ', e.target.value);
                setCompany(e.target.value);
              }}
              className="w-full p-3 border rounded-lg focus: ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Your company name"
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onSkip}>
          Skip for now
        </Button>
        <Button onClick={handleNext} disabled={!canProceed || isCreatingCompany}>
          {isCreatingCompany ? 'Setting up...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

// Step 2: Business Context (Tableau/Power BI inspired)
const BusinessContextStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const [industry, setIndustry] = useState(data.industry || '');
  const [companySize, setCompanySize] = useState(data.companySize || '');
  const [primaryGoals, setPrimaryGoals] = useState<string[]>(data.primaryGoals || []);
  const [businessChallenges, setBusinessChallenges] = useState<string[]>(data.businessChallenges || []);

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 
    'Education', 'Consulting', 'Real Estate', 'Marketing', 'Other'
  ];

  const companySizes = [
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-1000 employees', '1000+ employees'
  ];

  const goalOptions = [
    'Increase revenue', 'Improve efficiency', 'Better customer insights',
    'Automate processes', 'Scale operations', 'Reduce costs'
  ];

  const challengeOptions = [
    'Data fragmentation', 'Manual processes', 'Poor visibility',
    'Team collaboration', 'Customer retention', 'Growth scaling'
  ];

  const handleGoalToggle = (goal: string) => {
    setPrimaryGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleChallengeToggle = (challenge: string) => {
    setBusinessChallenges(prev => 
      prev.includes(challenge) 
        ? prev.filter(c => c !== challenge)
        : [...prev, challenge]
    );
  };

  const handleNext = () => {
    onNext({
      industry,
      companySize,
      primaryGoals,
      businessChallenges
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2">Tell us about your business</h2>
        <p className="text-muted-foreground text-lg">This helps us personalize your experience</p>
        <div className="flex justify-center mt-4">
          <Badge variant="secondary" className="text-sm">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full p-3 border rounded-lg focus: ring-2 focus:ring-primary"
            >
              <option value="">Select your industry</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Company Size</label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="w-full p-3 border rounded-lg focus: ring-2 focus:ring-primary"
            >
              <option value="">Select company size</option>
              {companySizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Primary Business Goals</label>
            <div className="grid grid-cols-2 gap-2">
              {goalOptions.map(goal => (
                <button
                  key={goal}
                  onClick={() => handleGoalToggle(goal)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    primaryGoals.includes(goal)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover: border-primary/50'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Business Challenges</label>
            <div className="grid grid-cols-2 gap-2">
              {challengeOptions.map(challenge => (
                <button
                  key={challenge}
                  onClick={() => handleChallengeToggle(challenge)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    businessChallenges.includes(challenge)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover: border-primary/50'
                  }`}
                >
                  {challenge}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center">
        <button
          onClick={onSkip}
          className="px-6 py-2 text-muted-foreground hover: text-foreground transition-colors"
        >
          Skip for now
        </button>
        <Button
          onClick={handleNext}
          className="px-8 py-3"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Step 3: Integration Discovery (Zapier-inspired)
const IntegrationDiscoveryStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(data.selectedIntegrations || []);

  const availableIntegrations = [
    {
      id: 'microsoft-365',
      name: 'Microsoft 365',
      description: 'Email, calendar, and document intelligence',
      icon: <Mail className="w-5 h-5" />,
      category: 'Productivity'
    },
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      description: 'Gmail, Calendar, Drive, and collaboration tools',
      icon: <Calendar className="w-5 h-5" />,
      category: 'Productivity'
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'CRM, marketing, and sales data',
      icon: <Users className="w-5 h-5" />,
      category: 'Sales & Marketing'
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Financial data and accounting insights',
      icon: <BarChart3 className="w-5 h-5" />,
      category: 'Finance'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Team communication and collaboration',
      icon: <MessageSquare className="w-5 h-5" />,
      category: 'Communication'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing and revenue data',
      icon: <DollarSign className="w-5 h-5" />,
      category: 'Finance'
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
    onNext({
      selectedIntegrations
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2">Connect your business tools</h2>
        <p className="text-muted-foreground text-lg">Choose the tools you use to get personalized insights</p>
        <div className="flex justify-center mt-4">
          <Badge variant="secondary" className="text-sm">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Available Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
            {availableIntegrations.map(integration => (
              <button
                key={integration.id}
                onClick={() => handleIntegrationToggle(integration.id)}
                className={`p-4 text-left rounded-lg border transition-all hover: shadow-md ${
                  selectedIntegrations.includes(integration.id)
                    ? 'border-primary bg-primary/10 text-primary shadow-md'
                    : 'border-border hover: border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {integration.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{integration.description}</p>
                    <Badge variant="outline" className="text-xs">{integration.category}</Badge>
                  </div>
                  {selectedIntegrations.includes(integration.id) && (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center">
        <button
          onClick={onSkip}
          className="px-6 py-2 text-muted-foreground hover: text-foreground transition-colors"
        >
          Skip for now
        </button>
        <Button
          onClick={handleNext}
          className="px-8 py-3"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Step 4: AI Capability Demo (ChatGPT-inspired)
const AICapabilityStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>(data.selectedUseCases || []);

  const useCases = [
    {
      id: 'business-analysis',
      title: 'Business Analysis',
      description: 'Get insights from your business data',
      icon: <BarChart3 className="w-5 h-5" />,
      examples: ['Revenue trends', 'Customer insights', 'Performance metrics']
    },
    {
      id: 'automation',
      title: 'Process Automation',
      description: 'Automate repetitive business tasks',
      icon: <Zap className="w-5 h-5" />,
      examples: ['Email workflows', 'Data processing', 'Report generation']
    },
    {
      id: 'decision-support',
      title: 'Decision Support',
      description: 'AI-powered recommendations for business decisions',
      icon: <Target className="w-5 h-5" />,
      examples: ['Resource allocation', 'Strategy planning', 'Risk assessment']
    },
    {
      id: 'communication',
      title: 'Smart Communication',
      description: 'Enhanced team collaboration and communication',
      icon: <Users className="w-5 h-5" />,
      examples: ['Meeting summaries', 'Action item tracking', 'Knowledge sharing']
    }
  ];

  const handleUseCaseToggle = (useCaseId: string) => {
    setSelectedUseCases(prev => 
      prev.includes(useCaseId) 
        ? prev.filter(id => id !== useCaseId)
        : [...prev, useCaseId]
    );
  };

  const handleNext = () => {
    onNext({
      selectedUseCases
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Brain className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2">Discover AI capabilities</h2>
        <p className="text-muted-foreground text-lg">Choose how you'd like to use AI in your business</p>
        <div className="flex justify-center mt-4">
          <Badge variant="secondary" className="text-sm">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Use Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
            {useCases.map(useCase => (
              <button
                key={useCase.id}
                onClick={() => handleUseCaseToggle(useCase.id)}
                className={`p-4 text-left rounded-lg border transition-all hover: shadow-md ${
                  selectedUseCases.includes(useCase.id)
                    ? 'border-primary bg-primary/10 text-primary shadow-md'
                    : 'border-border hover: border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {useCase.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{useCase.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{useCase.description}</p>
                    <div className="space-y-1">
                      {useCase.examples.map(example => (
                        <div key={example} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {example}
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedUseCases.includes(useCase.id) && (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center">
        <button
          onClick={onSkip}
          className="px-6 py-2 text-muted-foreground hover: text-foreground transition-colors"
        >
          Skip for now
        </button>
        <Button
          onClick={handleNext}
          className="px-8 py-3"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Step 5: Success & Next Steps (Linear-inspired)
const SuccessStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip: _onSkip, data: _data, currentStep, totalSteps }) => {
  const handleComplete = () => {
    onNext({
      onboardingCompleted: true
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2">You're all set!</h2>
        <p className="text-muted-foreground text-lg">Welcome to your AI-powered business operating system</p>
        <div className="flex justify-center mt-4">
          <Badge variant="secondary" className="text-sm">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            What's Next
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <Play className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Explore Your Dashboard</h3>
                <p className="text-sm text-muted-foreground">See your business metrics and AI insights in one place</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <Zap className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Connect Your Tools</h3>
                <p className="text-sm text-muted-foreground">Set up integrations to get real-time business intelligence</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <Brain className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Try AI Assistant</h3>
                <p className="text-sm text-muted-foreground">Ask questions about your business and get intelligent answers</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <Settings className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Customize Your Experience</h3>
                <p className="text-sm text-muted-foreground">Configure dashboards and workflows to match your needs</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button
          onClick={handleComplete}
          className="px-8 py-3"
          size="lg"
        >
          Get Started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Onboarding Flow Component
const OnboardingFlow: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});

  const steps: OnboardingStep[] = [
    {
      id: 'basic-info',
      title: 'Personal Information',
      description: 'Tell us about yourself',
      component: BasicInfoStep,
      icon: <User className="w-5 h-5" />,
      estimatedTime: '2 min'
    },
    {
      id: 'business-context',
      title: 'Business Context',
      description: 'Help us understand your business',
      component: BusinessContextStep,
      icon: <Building2 className="w-5 h-5" />,
      estimatedTime: '3 min'
    },
    {
      id: 'integration-discovery',
      title: 'Connect Your Tools',
      description: 'Discover available integrations',
      component: IntegrationDiscoveryStep,
      icon: <Zap className="w-5 h-5" />,
      estimatedTime: '2 min'
    },
    {
      id: 'ai-capabilities',
      title: 'AI Capabilities',
      description: 'Explore AI use cases',
      component: AICapabilityStep,
      icon: <Brain className="w-5 h-5" />,
      estimatedTime: '2 min'
    },
    {
      id: 'success',
      title: 'You\'re All Set!',
      description: 'Welcome to Nexus',
      component: SuccessStep,
      icon: <CheckCircle2 className="w-5 h-5" />,
      estimatedTime: '1 min'
    }
  ];

  const handleStepComplete = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev: number) => prev + 1);
    } else {
      onComplete(data);
    }
  };

  const handleSkip = () => {
    onComplete(formData);
  };

  const CurrentStepComponent = steps[currentStep].component;
  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Nexus Setup</h1>
            </div>
            <Badge variant="outline">
              {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          
          <Progress value={(currentStep / (steps.length - 1)) * 100} className="mb-4" />
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{currentStepData.title}</span>
            <span>{currentStepData.estimatedTime}</span>
          </div>
        </div>

        <CurrentStepComponent
          onNext={handleStepComplete}
          onSkip={handleSkip}
          data={formData}
          currentStep={currentStep + 1}
          totalSteps={steps.length}
        />
      </div>
    </div>
  );
};

/**
 * AppWithOnboarding
 * 
 * Checks if user needs onboarding and shows appropriate flow
 * Only used on protected routes where user is authenticated
 */
export const AppWithOnboarding: React.FC<AppWithOnboardingProps> = ({ children }) => {
  const { user, session, initialized, loading } = useAuth();
  const { createDefaultCompany } = useCompanyProvisioning();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Check if user needs onboarding
  useEffect(() => {
    // Skip if still loading or not initialized
    if (loading || !initialized) {
      return;
    }

    // TEMPORARY: Force onboarding for testing (remove this later)
    const forceOnboarding = window.location.search.includes('force-onboarding=true');
    if (forceOnboarding) {
      setShowOnboarding(true);
      return;
    }

    // If user is not authenticated, don't show onboarding
    if (!user || !session) {
      return;
    }

    // For now, we'll skip the profile check since profile doesn't exist in the new auth system
    // This can be re-implemented when we add profile support back
  }, [user?.id, session?.access_token, loading, initialized, onboardingCompleted]);

  const handleOnboardingComplete = async (_data: any) => {
    // Ensure user has a company association after onboarding
    if (user?.id) {
      try {
        const result = await createDefaultCompany();
        if (result.success) {
          console.log('[AppWithOnboarding] Company association ensured after onboarding');
        } else {
          console.warn('[AppWithOnboarding] Failed to ensure company association:', result.error);
        }
      } catch (error) {
        console.error('[AppWithOnboarding] Error ensuring company association:', error);
      }
    }
    
    setShowOnboarding(false);
    setOnboardingCompleted(true);
  };

  // Show loading while auth is initializing
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Render main app
  return <>{children}</>;
};

/**
 * Simple wrapper for public routes that doesn't trigger auth context
 */
export const PublicRouteWrapper: React.FC<AppWithOnboardingProps> = ({ children }) => {
  return <>{children}</>;
}; 