import React, { useState, useEffect } from 'react';
import { useZustandAuth } from '@/shared/hooks/useZustandAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
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
  const [firstName, setFirstName] = useState(data.firstName || '');
  const [lastName, setLastName] = useState(data.lastName || '');
  const [displayName, setDisplayName] = useState(data.displayName || '');
  const [jobTitle, setJobTitle] = useState(data.jobTitle || '');
  const [company, setCompany] = useState(data.company || '');

  // Debug logging
  console.log('[BasicInfoStep] Form state:', { firstName, lastName, displayName, jobTitle, company });

  const handleNext = () => {
    console.log('[BasicInfoStep] Submitting form with data:', { firstName, lastName, displayName, jobTitle, company });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  console.log('[BasicInfoStep] First name changed:', e.target.value);
                  setFirstName(e.target.value);
                }}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
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
                  console.log('[BasicInfoStep] Last name changed:', e.target.value);
                  setLastName(e.target.value);
                }}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
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
                console.log('[BasicInfoStep] Display name changed:', e.target.value);
                setDisplayName(e.target.value);
              }}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="How you'd like to be called"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => {
                console.log('[BasicInfoStep] Job title changed:', e.target.value);
                setJobTitle(e.target.value);
              }}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="e.g., CEO, Manager, Developer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => {
                console.log('[BasicInfoStep] Company changed:', e.target.value);
                setCompany(e.target.value);
              }}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Your company name"
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onSkip}>
          Skip for now
        </Button>
        <Button onClick={handleNext} disabled={!canProceed}>
          Continue
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
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary"
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
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary"
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
                      : 'border-border hover:border-primary/50'
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
                      : 'border-border hover:border-primary/50'
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
          className="px-6 py-2 text-muted-foreground hover:text-foreground transition-colors"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableIntegrations.map(integration => (
              <button
                key={integration.id}
                onClick={() => handleIntegrationToggle(integration.id)}
                className={`p-4 text-left rounded-lg border transition-all hover:shadow-md ${
                  selectedIntegrations.includes(integration.id)
                    ? 'border-primary bg-primary/10 text-primary shadow-md'
                    : 'border-border hover:border-primary/50'
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
          className="px-6 py-2 text-muted-foreground hover:text-foreground transition-colors"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {useCases.map(useCase => (
              <button
                key={useCase.id}
                onClick={() => handleUseCaseToggle(useCase.id)}
                className={`p-4 text-left rounded-lg border transition-all hover:shadow-md ${
                  selectedUseCases.includes(useCase.id)
                    ? 'border-primary bg-primary/10 text-primary shadow-md'
                    : 'border-border hover:border-primary/50'
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
          className="px-6 py-2 text-muted-foreground hover:text-foreground transition-colors"
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
  const { profile, updateProfile } = useZustandAuth();

  const steps: OnboardingStep[] = [
    {
      id: 'basic-info',
      title: 'Personal Information',
      description: 'Tell us about yourself',
      component: BasicInfoStep,
      icon: <User className="w-5 h-5" />,
      estimatedTime: '2 minutes'
    },
    {
      id: 'business-context',
      title: 'Business Context',
      description: 'Tell us about your business',
      component: BusinessContextStep,
      icon: <Building2 className="w-5 h-5" />,
      estimatedTime: '3 minutes'
    },
    {
      id: 'integrations',
      title: 'Connect Tools',
      description: 'Choose your business tools',
      component: IntegrationDiscoveryStep,
      icon: <Zap className="w-5 h-5" />,
      estimatedTime: '2 minutes'
    },
    {
      id: 'ai-capabilities',
      title: 'AI Capabilities',
      description: 'Discover AI features',
      component: AICapabilityStep,
      icon: <Brain className="w-5 h-5" />,
      estimatedTime: '2 minutes'
    },
    {
      id: 'success',
      title: 'You\'re All Set!',
      description: 'Welcome to Nexus',
      component: SuccessStep,
      icon: <CheckCircle2 className="w-5 h-5" />,
      estimatedTime: '1 minute'
    }
  ];

  const handleStepComplete = (data: any) => {
    const newData = { ...formData, ...data };
    setFormData(newData);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      completeOnboarding(newData);
    }
  };

  const handleSkip = () => {
    completeOnboarding(formData);
  };

  const completeOnboarding = async (data: any) => {
    try {
      // Update profile with collected data
      if (profile) {
        await updateProfile({
          first_name: data.firstName,
          last_name: data.lastName,
          display_name: data.displayName,
          job_title: data.jobTitle,
          onboarding_completed: true,
          profile_completion_percentage: 90, // Comprehensive onboarding
          preferences: {
            industry: data.industry,
            company_size: data.companySize,
            primary_goals: data.primaryGoals,
            business_challenges: data.businessChallenges,
            selected_integrations: data.selectedIntegrations,
            ai_use_cases: data.selectedUseCases
          }
        });
      }
      
      onComplete(data);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onComplete(data); // Continue anyway
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-background border-b">
          <div className="max-w-4xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {steps[currentStep].estimatedTime}
              </span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="pt-20">
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
 */
export const AppWithOnboarding: React.FC<AppWithOnboardingProps> = ({ children }) => {
  const { user, session, profile, loading: authLoading, initialized } = useZustandAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Check if onboarding is needed - optimized to prevent multiple calls
  useEffect(() => {
    // Skip if still loading or not initialized
    if (authLoading || !initialized) {
      console.log('[AppWithOnboarding] Auth still initializing, skipping onboarding check');
      return;
    }

    // TEMPORARY: Force onboarding for testing (remove this later)
    const forceOnboarding = window.location.search.includes('force-onboarding=true');
    if (forceOnboarding) {
      console.log('[AppWithOnboarding] Force triggering onboarding for testing');
      setShowOnboarding(true);
      return;
    }

    // If user is not authenticated, don't show onboarding
    if (!user || !session) {
      console.log('[AppWithOnboarding] User not authenticated, not showing onboarding');
      return;
    }

    // If user is authenticated but profile is still loading, wait
    if (!profile) {
      console.log('[AppWithOnboarding] User authenticated but profile still loading');
      return;
    }

    // User is authenticated and has a profile - check onboarding needs
    const completionPercentage = profile.profile_completion_percentage ?? 0;
    const needsOnboarding = !profile.onboarding_completed || completionPercentage < 50;
    
    console.log('[AppWithOnboarding] Profile check:', {
      profileId: profile.id,
      onboardingCompleted: profile.onboarding_completed,
      profileCompletionPercentage: completionPercentage,
      needsOnboarding,
      currentShowOnboarding: showOnboarding,
      currentOnboardingCompleted: onboardingCompleted
    });
    
    if (needsOnboarding && !onboardingCompleted) {
      console.log('[AppWithOnboarding] Setting showOnboarding to true');
      setShowOnboarding(true);
    } else {
      console.log('[AppWithOnboarding] Onboarding not needed or already completed');
    }
  }, [user?.id, session?.access_token, profile?.id, authLoading, initialized, onboardingCompleted]);

  const handleOnboardingComplete = (_data: any) => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
  };

  // Show loading while auth is initializing
  if (authLoading || !initialized) {
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