import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useUser } from '@/hooks/useUser';
import { useOnboardingService } from '@/shared/hooks/useOnboardingService';
import { onboardingService, ONBOARDING_PHASES } from '@/shared/services/OnboardingService';
import { supabase } from '@/lib/supabase';
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
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { FirstTimeWelcome } from '@/shared/components/FirstTimeWelcome';
import { OnboardingCompletionChecker } from '@/shared/components/OnboardingCompletionChecker';

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
  user?: any; // Pass user from parent to avoid multiple useUser calls
}

// Step 0: Welcome Step
const WelcomeStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const handleNext = useCallback(() => {
    onNext({});
  }, [onNext]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2">Welcome to Nexus</h2>
        <p className="text-muted-foreground text-lg">Your AI-powered business operating system</p>
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
            Welcome to Your Business Transformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Nexus is designed to help innovators, thinkers, and self-starters start, standardize, operate, and grow businesses without requiring formal business education.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">AI-Powered Insights</h3>
                <p className="text-sm text-muted-foreground">Get intelligent recommendations for your business decisions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Automated Workflows</h3>
                <p className="text-sm text-muted-foreground">Streamline your business processes with smart automation</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <BarChart3 className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Real-time Analytics</h3>
                <p className="text-sm text-muted-foreground">Monitor your business performance with live dashboards</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button onClick={handleNext} className="px-8 py-3">
          Get Started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Step 1: Basic Information (Slack-inspired)
const BasicInfoStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps, user }) => {
  const { saveStep, isProcessing } = useOnboardingService();
  
  // Debug authentication state - only run once on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[BasicInfoStep] Auth session:', { session, user });
    };
    
    checkAuth();
  }, [user]);

  const [firstName, setFirstName] = useState(data.firstName || '');
  const [lastName, setLastName] = useState(data.lastName || '');
  const [displayName, setDisplayName] = useState(data.displayName || '');
  const [jobTitle, setJobTitle] = useState(data.jobTitle || '');
  const [company, setCompany] = useState(data.company || '');

  const handleNext = useCallback(async () => {
    if (!user?.id) {
      console.error('[BasicInfoStep] User not authenticated');
      return;
    }

    // Test authentication first
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[BasicInfoStep] Current session:', session);
      
      if (!session) {
        console.error('[BasicInfoStep] No active session found');
        return;
      }
    } catch (error) {
      console.error('[BasicInfoStep] Session check failed:', error);
      return;
    }

    const stepData = {
      userId: user.id,
      firstName,
      lastName,
      displayName: displayName || `${firstName} ${lastName}`.trim(),
      jobTitle,
      company
    };

    console.log('[BasicInfoStep] Step data to save:', stepData);

    // Save step data to database
    const success = await saveStep('basic-info', stepData);
    
    if (success) {
      console.log('[BasicInfoStep] Step data saved successfully');
      onNext(stepData);
    } else {
      console.error('[BasicInfoStep] Failed to save step data');
    }
  }, [user?.id, firstName, lastName, displayName, jobTitle, company, saveStep, onNext]);

  const canProceed = firstName.trim() && lastName.trim();

  const handleFirstNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[BasicInfoStep] First name changed: ', e.target.value);
    setFirstName(e.target.value);
  }, []);

  const handleLastNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[BasicInfoStep] Last name changed: ', e.target.value);
    setLastName(e.target.value);
  }, []);

  const handleDisplayNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[BasicInfoStep] Display name changed: ', e.target.value);
    setDisplayName(e.target.value);
  }, []);

  const handleJobTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[BasicInfoStep] Job title changed: ', e.target.value);
    setJobTitle(e.target.value);
  }, []);

  const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[BasicInfoStep] Company changed: ', e.target.value);
    setCompany(e.target.value);
  }, []);

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
                onChange={handleFirstNameChange}
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
                onChange={handleLastNameChange}
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
              onChange={handleDisplayNameChange}
              className="w-full p-3 border rounded-lg focus: ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="How you'd like to be called"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={handleJobTitleChange}
              className="w-full p-3 border rounded-lg focus: ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="e.g., CEO, Manager, Developer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <input
              type="text"
              value={company}
              onChange={handleCompanyChange}
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
        <Button onClick={handleNext} disabled={!canProceed || isProcessing}>
          {isProcessing ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

// Step 2: Business Context (Tableau/Power BI inspired)
const BusinessContextStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps, user }) => {
  const { saveStep, isProcessing } = useOnboardingService();
  const [industry, setIndustry] = useState(data.industry || '');
  const [companySize, setCompanySize] = useState(data.companySize || '');
  const [primaryGoals, setPrimaryGoals] = useState<string[]>(data.primaryGoals || []);
  const [businessChallenges, setBusinessChallenges] = useState<string[]>(data.businessChallenges || []);

  const industries = [
    { value: "technology", label: "Technology & Telecommunications" },
    { value: "healthcare", label: "Healthcare & Life Sciences" },
    { value: "financial-services", label: "Financial Services" },
    { value: "professional-services", label: "Professional Services" },
    { value: "retail-ecommerce", label: "Retail & eCommerce" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "construction-trades", label: "Construction & Trades" },
    { value: "real-estate", label: "Real Estate & Property Management" },
    { value: "logistics", label: "Transportation, Logistics & Warehousing" },
    { value: "media-marketing", label: "Media, Marketing & Advertising" },
    { value: "hospitality-travel", label: "Hospitality, Restaurants & Travel" },
    { value: "education", label: "Education" },
    { value: "nonprofit", label: "Nonprofit & Associations" },
    { value: "public-sector", label: "Government & Public Sector" },
    { value: "energy-utilities", label: "Energy, Utilities & Environmental" },
    { value: "agriculture", label: "Agriculture & Food Production" },
    { value: "other", label: "Other" }
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

  const MAX_GOALS = 3;
  const MAX_CHALLENGES = 3;

  const handleGoalToggle = (goal: string) => {
    setPrimaryGoals(prev => {
      if (prev.includes(goal)) {
        return prev.filter(g => g !== goal);
      } else if (prev.length < MAX_GOALS) {
        return [...prev, goal];
      }
      return prev; // Don't add if at limit
    });
  };

  const handleChallengeToggle = (challenge: string) => {
    setBusinessChallenges(prev => {
      if (prev.includes(challenge)) {
        return prev.filter(c => c !== challenge);
      } else if (prev.length < MAX_CHALLENGES) {
        return [...prev, challenge];
      }
      return prev; // Don't add if at limit
    });
  };

  const handleNext = async () => {
    if (!user?.id) {
      console.error('[BusinessContextStep] User not authenticated');
      return;
    }

         const stepData = {
       userId: user.id,
       industry,
       companySize,
       primaryGoals,
       businessChallenges
     };

    // Save step data to database
    const success = await saveStep('business-context', stepData);
    
    if (success) {
      console.log('[BusinessContextStep] Step data saved successfully');
      onNext(stepData);
    } else {
      console.error('[BusinessContextStep] Failed to save step data');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2 text-foreground">Tell us about your business</h2>
        <p className="text-muted-foreground text-lg">This helps us personalize your experience</p>
        <div className="flex justify-center mt-4">
          <Badge variant="secondary" className="text-sm">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="w-5 h-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
                                 <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full p-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              >
                <option value="" className="text-muted-foreground">Select your industry</option>
                {industries.map(ind => (
                  <option key={ind.value} value={ind.value} className="text-foreground">{ind.label}</option>
                ))}
              </select>
            </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Company Size</label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="w-full p-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            >
              <option value="" className="text-muted-foreground">Select company size</option>
              {companySizes.map(size => (
                <option key={size} value={size} className="text-foreground">{size}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Primary Business Goals 
              <span className="text-xs text-muted-foreground ml-2">
                (Select up to {MAX_GOALS})
              </span>
            </label>
            {primaryGoals.length >= MAX_GOALS && (
              <p className="text-sm text-amber-600 mb-2">
                You've selected your top {MAX_GOALS} goals. Unselect one to choose another.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {goalOptions.map(goal => (
                <button
                  key={goal}
                  onClick={() => handleGoalToggle(goal)}
                  disabled={!primaryGoals.includes(goal) && primaryGoals.length >= MAX_GOALS}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    primaryGoals.includes(goal)
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : primaryGoals.length >= MAX_GOALS
                      ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                      : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Business Challenges
              <span className="text-xs text-muted-foreground ml-2">
                (Select up to {MAX_CHALLENGES})
              </span>
            </label>
            {businessChallenges.length >= MAX_CHALLENGES && (
              <p className="text-sm text-amber-600 mb-2">
                You've selected your top {MAX_CHALLENGES} challenges. Unselect one to choose another.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {challengeOptions.map(challenge => (
                <button
                  key={challenge}
                  onClick={() => handleChallengeToggle(challenge)}
                  disabled={!businessChallenges.includes(challenge) && businessChallenges.length >= MAX_CHALLENGES}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    businessChallenges.includes(challenge)
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : businessChallenges.length >= MAX_CHALLENGES
                      ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                      : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5'
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
          disabled={isProcessing}
        >
          {isProcessing ? 'Saving...' : 'Continue'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Step 3: Integration Discovery (Zapier-inspired)
const IntegrationDiscoveryStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps, user }) => {
  const { saveStep, isProcessing } = useOnboardingService();
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

  const handleNext = async () => {
    if (!user?.id) {
      console.error('[IntegrationDiscoveryStep] User not authenticated');
      return;
    }

    const stepData = {
      userId: user.id,
      selectedIntegrations
    };

    // Save step data to database
    const success = await saveStep('integration-discovery', stepData);
    
    if (success) {
      console.log('[IntegrationDiscoveryStep] Step data saved successfully');
      onNext(stepData);
    } else {
      console.error('[IntegrationDiscoveryStep] Failed to save step data');
    }
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
const AICapabilityStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps, user }) => {
  const { saveStep, isProcessing } = useOnboardingService();
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

  const handleNext = async () => {
    if (!user?.id) {
      console.error('[AICapabilityStep] User not authenticated');
      return;
    }

    const stepData = {
      userId: user.id,
      selectedUseCases
    };

    // Save step data to database
    const success = await saveStep('ai-capabilities', stepData);
    
    if (success) {
      console.log('[AICapabilityStep] Step data saved successfully');
      onNext(stepData);
    } else {
      console.error('[AICapabilityStep] Failed to save step data');
    }
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



const AuthVerificationStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps, user }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [verificationDetails, setVerificationDetails] = useState<{
    emailVerified: boolean;
    phoneVerified: boolean;
    accountConfirmed: boolean;
  } | null>(null);

  // Check verification status on component mount
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user?.id) return;

      try {
        // Get user verification status from Supabase auth
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Failed to get user verification status:', error);
          return;
        }

        if (session?.user) {
          const authUser = session.user;
          const details = {
            emailVerified: !!authUser.email_confirmed_at,
            phoneVerified: !!authUser.phone_confirmed_at,
            accountConfirmed: !!authUser.confirmed_at
          };
          
          setVerificationDetails(details);
          
          // If email is verified, set status to success
          if (details.emailVerified) {
            setVerificationStatus('success');
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    checkVerificationStatus();
  }, [user?.id]);

  const handleVerification = async () => {
    setIsVerifying(true);
    
    try {
      // Check current verification status
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new Error('Failed to get user verification status');
      }

      if (session?.user) {
        const authUser = session.user;
        const isEmailVerified = !!authUser.email_confirmed_at;
        const isAccountConfirmed = !!authUser.confirmed_at;

        if (isEmailVerified && isAccountConfirmed) {
          setVerificationStatus('success');
          
          // Auto-proceed after successful verification
          setTimeout(() => {
            onNext({
              ...data,
              authVerified: true,
              verificationCompletedAt: new Date().toISOString(),
              emailVerified: isEmailVerified,
              accountConfirmed: isAccountConfirmed
            });
          }, 1000);
        } else {
          // If not verified, show error or prompt for verification
          setVerificationStatus('error');
          console.error('User account not fully verified');
        }
      } else {
        setVerificationStatus('error');
        throw new Error('No user found');
      }
    } catch (error) {
      setVerificationStatus('error');
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Security</h2>
        <p className="text-gray-600">
          Let's verify your account to ensure maximum security for your business data.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          <div className="flex items-start">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
              verificationDetails?.emailVerified ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {verificationDetails?.emailVerified ? (
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Email Verification</p>
              <p className="text-sm text-gray-600">
                {verificationDetails?.emailVerified 
                  ? 'Your email address has been verified' 
                  : 'Please verify your email address'
                }
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 text-sm font-medium">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">Set up additional security for your account</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-gray-600 text-sm font-medium">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Security Preferences</p>
              <p className="text-sm text-gray-600">Configure your security settings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleVerification}
          disabled={isVerifying || verificationStatus === 'success'}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            verificationStatus === 'success' 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : verificationStatus === 'error'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {isVerifying ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Verifying...
            </div>
          ) : verificationStatus === 'success' ? (
            <div className="flex items-center justify-center">
              <svg className="h-4 w-4 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Verified
            </div>
          ) : verificationStatus === 'error' ? (
            'Verification Failed'
          ) : (
            'Verify Account'
          )}
        </button>
        
        <button
          onClick={handleSkip}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Skip for Now
        </button>
      </div>

      {verificationStatus === 'success' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-800">Account verified successfully!</p>
          </div>
        </div>
      )}

      {verificationStatus === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm text-red-800">Verification failed. Please try again.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const AccountActivationStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps, user }) => {
  const [isActivating, setIsActivating] = useState(false);
  const [preferences, setPreferences] = useState({
    notifications: true,
    analytics: true,
    marketing: false,
    updates: true
  });

  const handleActivation = async () => {
    setIsActivating(true);
    
    try {
      // Simulate activation process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onNext({
        ...data,
        accountActivated: true,
        preferences,
        activationCompletedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Activation failed:', error);
    } finally {
      setIsActivating(false);
    }
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Activation</h2>
        <p className="text-gray-600">
          Activate your account and configure your preferences to get the most out of Nexus.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive important updates about your account</p>
            </div>
            <button
              onClick={() => handlePreferenceChange('notifications', !preferences.notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.notifications ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.notifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Analytics & Insights</p>
              <p className="text-sm text-gray-600">Help us improve by sharing usage analytics</p>
            </div>
            <button
              onClick={() => handlePreferenceChange('analytics', !preferences.analytics)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.analytics ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.analytics ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Product Updates</p>
              <p className="text-sm text-gray-600">Stay informed about new features and improvements</p>
            </div>
            <button
              onClick={() => handlePreferenceChange('updates', !preferences.updates)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.updates ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.updates ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Marketing Communications</p>
              <p className="text-sm text-gray-600">Receive tips, best practices, and industry insights</p>
            </div>
            <button
              onClick={() => handlePreferenceChange('marketing', !preferences.marketing)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.marketing ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.marketing ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleActivation}
          disabled={isActivating}
          className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isActivating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Activating...
            </div>
          ) : (
            'Activate Account'
          )}
        </button>
        
        <button
          onClick={onSkip}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
};

const CompanyInfoStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const [formData, setFormData] = useState({
    companyName: data.companyName || '',
    industry: data.industry || '',
    companySize: data.companySize || '',
    website: data.website || '',
    description: data.description || ''
  });

  const companySizes = [
    { value: 'startup', label: 'Startup (1-10 employees)' },
    { value: 'small', label: 'Small Business (11-50 employees)' },
    { value: 'medium', label: 'Medium Business (51-200 employees)' },
    { value: 'large', label: 'Large Business (201-1000 employees)' },
    { value: 'enterprise', label: 'Enterprise (1000+ employees)' }
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Retail',
    'Manufacturing',
    'Education',
    'Real Estate',
    'Consulting',
    'Marketing',
    'Legal',
    'Non-profit',
    'Other'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    onNext({
      ...data,
      ...formData
    });
  };

  const isFormValid = formData.companyName && formData.industry && formData.companySize;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Information</h2>
        <p className="text-gray-600">
          Tell us about your business so we can personalize your experience.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry *
          </label>
          <select
            value={formData.industry}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select your industry</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Size *
          </label>
          <select
            value={formData.companySize}
            onChange={(e) => handleInputChange('companySize', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select company size</option>
            {companySizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website (Optional)
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="https://yourcompany.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Briefly describe your business..."
          />
        </div>
      </div>

      <div className="flex space-x-4 mt-8">
        <button
          onClick={handleNext}
          disabled={!isFormValid}
          className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
        
        <button
          onClick={onSkip}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
};

const IndustrySelectionStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(data.selectedIndustries || []);
  const [customIndustry, setCustomIndustry] = useState(data.customIndustry || '');

  const industryOptions = [
    { id: 'tech', name: 'Technology', description: 'Software, hardware, and digital services' },
    { id: 'healthcare', name: 'Healthcare', description: 'Medical, pharmaceutical, and wellness' },
    { id: 'finance', name: 'Finance', description: 'Banking, insurance, and financial services' },
    { id: 'retail', name: 'Retail', description: 'E-commerce, brick-and-mortar, and consumer goods' },
    { id: 'manufacturing', name: 'Manufacturing', description: 'Production, logistics, and supply chain' },
    { id: 'education', name: 'Education', description: 'Schools, training, and learning platforms' },
    { id: 'real-estate', name: 'Real Estate', description: 'Property management and development' },
    { id: 'consulting', name: 'Consulting', description: 'Professional services and advisory' },
    { id: 'marketing', name: 'Marketing', description: 'Advertising, PR, and digital marketing' },
    { id: 'legal', name: 'Legal', description: 'Law firms and legal services' },
    { id: 'non-profit', name: 'Non-profit', description: 'Charitable organizations and NGOs' }
  ];

  const handleIndustryToggle = (industryId: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industryId)
        ? prev.filter(id => id !== industryId)
        : [...prev, industryId]
    );
  };

  const handleNext = () => {
    onNext({
      ...data,
      selectedIndustries,
      customIndustry: customIndustry.trim()
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
          <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Industry Context</h2>
        <p className="text-gray-600">
          Select the industries that best describe your business to get tailored insights and recommendations.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {industryOptions.map((industry) => (
          <div
            key={industry.id}
            onClick={() => handleIndustryToggle(industry.id)}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedIndustries.includes(industry.id)
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                  selectedIndustries.includes(industry.id)
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                }`}>
                  {selectedIndustries.includes(industry.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{industry.name}</h3>
                  <p className="text-sm text-gray-600">{industry.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Other Industry (Optional)
        </label>
        <input
          type="text"
          value={customIndustry}
          onChange={(e) => setCustomIndustry(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Enter other industry..."
        />
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleNext}
          className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Continue
        </button>
        
        <button
          onClick={onSkip}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
};

const GoalDefinitionStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.selectedGoals || []);

  const goalOptions = [
    { id: 'increase-revenue', name: 'Increase Revenue', description: 'Grow sales and improve profitability' },
    { id: 'reduce-costs', name: 'Reduce Costs', description: 'Optimize operations and cut expenses' },
    { id: 'improve-efficiency', name: 'Improve Efficiency', description: 'Streamline processes and workflows' },
    { id: 'enhance-customer-experience', name: 'Enhance Customer Experience', description: 'Improve customer satisfaction and retention' },
    { id: 'expand-market', name: 'Expand Market', description: 'Enter new markets or segments' },
    { id: 'develop-products', name: 'Develop Products', description: 'Create new products or services' },
    { id: 'improve-quality', name: 'Improve Quality', description: 'Enhance product or service quality' },
    { id: 'increase-productivity', name: 'Increase Productivity', description: 'Boost team and individual performance' },
    { id: 'digital-transformation', name: 'Digital Transformation', description: 'Modernize technology and processes' },
    { id: 'sustainability', name: 'Sustainability', description: 'Implement eco-friendly practices' }
  ];

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleNext = () => {
    onNext({
      ...data,
      selectedGoals
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Goals</h2>
        <p className="text-gray-600">
          Select your primary business objectives to help us tailor your AI-powered solutions.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {goalOptions.map((goal) => (
          <div
            key={goal.id}
            onClick={() => handleGoalToggle(goal.id)}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedGoals.includes(goal.id)
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                  selectedGoals.includes(goal.id)
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                }`}>
                  {selectedGoals.includes(goal.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{goal.name}</h3>
                  <p className="text-sm text-gray-600">{goal.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleNext}
          className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Continue
        </button>
        
        <button
          onClick={onSkip}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
};

const ChallengeIdentificationStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>(data.selectedChallenges || []);

  const challengeOptions = [
    { id: 'manual-processes', name: 'Manual Processes', description: 'Time-consuming manual tasks and workflows' },
    { id: 'data-silos', name: 'Data Silos', description: 'Information scattered across different systems' },
    { id: 'customer-retention', name: 'Customer Retention', description: 'Difficulty retaining and satisfying customers' },
    { id: 'cost-control', name: 'Cost Control', description: 'Managing and reducing operational costs' },
    { id: 'scaling-growth', name: 'Scaling Growth', description: 'Challenges in scaling operations efficiently' },
    { id: 'team-productivity', name: 'Team Productivity', description: 'Improving team efficiency and collaboration' },
    { id: 'market-competition', name: 'Market Competition', description: 'Staying competitive in the market' },
    { id: 'technology-integration', name: 'Technology Integration', description: 'Integrating new technologies and tools' },
    { id: 'decision-making', name: 'Decision Making', description: 'Making data-driven decisions quickly' },
    { id: 'quality-control', name: 'Quality Control', description: 'Maintaining consistent quality standards' }
  ];

  const handleChallengeToggle = (challengeId: string) => {
    setSelectedChallenges(prev => 
      prev.includes(challengeId)
        ? prev.filter(id => id !== challengeId)
        : [...prev, challengeId]
    );
  };

  const handleNext = () => {
    onNext({
      ...data,
      selectedChallenges
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
          <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Challenges</h2>
        <p className="text-gray-600">
          Identify the key challenges your business faces so we can provide targeted solutions.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {challengeOptions.map((challenge) => (
          <div
            key={challenge.id}
            onClick={() => handleChallengeToggle(challenge.id)}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedChallenges.includes(challenge.id)
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                  selectedChallenges.includes(challenge.id)
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                }`}>
                  {selectedChallenges.includes(challenge.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{challenge.name}</h3>
                  <p className="text-sm text-gray-600">{challenge.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleNext}
          className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Continue
        </button>
        
        <button
          onClick={onSkip}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
};

// Placeholder components for remaining missing steps
const ToolConnectionStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const handleContinue = () => {
    // Pass empty data since this is a placeholder step
    onNext({});
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tool Connections</h2>
        <p className="text-gray-600">
          Connect your existing business tools to enable seamless data flow.
        </p>
      </div>
      <div className="text-center">
        <p className="text-gray-600 mb-6">Tool connection functionality coming soon...</p>
        <button onClick={handleContinue} className="bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Continue
        </button>
      </div>
    </div>
  );
};

const DataSourceStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Sources</h2>
        <p className="text-gray-600">
          Configure your data sources and pipelines for business intelligence.
        </p>
      </div>
      <div className="text-center">
        <p className="text-gray-600 mb-6">Data source configuration coming soon...</p>
        <button onClick={() => onNext(data)} className="bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Continue
        </button>
      </div>
    </div>
  );
};

const PermissionStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
          <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Permissions</h2>
        <p className="text-gray-600">
          Grant necessary permissions for integrations and data access.
        </p>
      </div>
      <div className="text-center">
        <p className="text-gray-600 mb-6">Permission management coming soon...</p>
        <button onClick={() => onNext(data)} className="bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Continue
        </button>
      </div>
    </div>
  );
};

const UseCaseConfigurationStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
          <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Use Case Configuration</h2>
        <p className="text-gray-600">
          Configure AI use cases for your business needs.
        </p>
      </div>
      <div className="text-center">
        <p className="text-gray-600 mb-6">Use case configuration coming soon...</p>
        <button onClick={() => onNext(data)} className="bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Continue
        </button>
      </div>
    </div>
  );
};

const BrainTrainingStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
          <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Brain Training</h2>
        <p className="text-gray-600">
          Train your Unified Business Brain with your business context.
        </p>
      </div>
      <div className="text-center">
        <p className="text-gray-600 mb-6">Brain training functionality coming soon...</p>
        <button onClick={() => onNext(data)} className="bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Continue
        </button>
      </div>
    </div>
  );
};

const IntelligenceCalibrationStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 mb-4">
          <svg className="h-8 w-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Intelligence Calibration</h2>
        <p className="text-gray-600">
          Calibrate AI for your business context and requirements.
        </p>
      </div>
      <div className="text-center">
        <p className="text-gray-600 mb-6">Intelligence calibration coming soon...</p>
        <button onClick={() => onNext(data)} className="bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Continue
        </button>
      </div>
    </div>
  );
};

const SetupVerificationStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Verification</h2>
        <p className="text-gray-600">
          Verify all components are properly configured for your business.
        </p>
      </div>
      <div className="text-center">
        <p className="text-gray-600 mb-6">Setup verification coming soon...</p>
        <button onClick={() => onNext(data)} className="bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Continue
        </button>
      </div>
    </div>
  );
};

const SuccessConfirmationStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Success Confirmation</h2>
        <p className="text-gray-600">
          Confirm successful onboarding completion.
        </p>
      </div>
      <div className="text-center">
        <p className="text-gray-600 mb-6">Success confirmation coming soon...</p>
        <button onClick={() => onNext(data)} className="bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Continue
        </button>
      </div>
    </div>
  );
};

const ExperienceIntroductionStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
          <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Experience Introduction</h2>
        <p className="text-gray-600">
          Introduce your new business operating system.
        </p>
      </div>
      <div className="text-center">
        <p className="text-gray-600 mb-6">Experience introduction coming soon...</p>
        <button onClick={() => onNext(data)} className="bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Continue
        </button>
      </div>
    </div>
  );
};

const FirstActionGuidanceStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const handleComplete = async () => {
    onNext({});
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2">Take Your First Action</h2>
        <p className="text-muted-foreground text-lg">Start using your AI-powered business operating system</p>
        <div className="flex justify-center mt-4">
          <Badge variant="secondary" className="text-sm">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Ready to Transform Your Business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your Unified Business Brain is now active and ready to help you make expert-level business decisions. Let's take your first action together.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Brain className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">AI-Powered Analysis</h3>
                <p className="text-sm text-muted-foreground">Every action is analyzed with business context</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Expert Guidance</h3>
                <p className="text-sm text-muted-foreground">Get insights from 20+ years of business expertise</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Automated Workflows</h3>
                <p className="text-sm text-muted-foreground">Streamline your business processes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleComplete} className="w-full sm:w-auto">
          Begin Your Transformation
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Onboarding Flow Component


// 5-Phase Onboarding Orchestration Component
const FivePhaseOnboardingFlow: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const { user } = useUser();
  const { 
    getOnboardingProgress, 
    completeOnboardingPhase, 
    getPhaseConfiguration,
    validateStepData,
    saveStep,
    isProcessing, 
    error, 
    progress, 
    currentPhase, 
    currentStep 
  } = useOnboardingService();

  const [currentPhaseData, setCurrentPhaseData] = useState<any>(null);
  const [currentStepData, setCurrentStepData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isRecovering, setIsRecovering] = useState(false);
  const [showRecoveryNotification, setShowRecoveryNotification] = useState(false);

  // Component mapping for step rendering
  const stepComponents: Record<string, React.ComponentType<OnboardingStepProps>> = {
    'WelcomeStep': WelcomeStep,
    'BasicInfoStep': BasicInfoStep,
    'AuthVerificationStep': AuthVerificationStep,
    'AccountActivationStep': AccountActivationStep,
    'CompanyInfoStep': CompanyInfoStep,
    'IndustrySelectionStep': IndustrySelectionStep,
    'GoalDefinitionStep': GoalDefinitionStep,
    'ChallengeIdentificationStep': ChallengeIdentificationStep,
    'BusinessContextStep': BusinessContextStep,
    'IntegrationDiscoveryStep': IntegrationDiscoveryStep,
    'ToolConnectionStep': ToolConnectionStep,
    'DataSourceStep': DataSourceStep,
    'PermissionStep': PermissionStep,
    'AICapabilityStep': AICapabilityStep,
    'UseCaseConfigurationStep': UseCaseConfigurationStep,
    'BrainTrainingStep': BrainTrainingStep,
    'IntelligenceCalibrationStep': IntelligenceCalibrationStep,
    'SetupVerificationStep': SetupVerificationStep,
    'SuccessConfirmationStep': SuccessConfirmationStep,
    'ExperienceIntroductionStep': ExperienceIntroductionStep,
    'FirstActionGuidanceStep': FirstActionGuidanceStep
  };

  // Local storage keys
  const STORAGE_KEYS = {
    FORM_DATA: 'nexus-onboarding-form-data',
    PHASE_DATA: 'nexus-onboarding-phase-data',
    STEP_DATA: 'nexus-onboarding-step-data',
    PROGRESS: 'nexus-onboarding-progress',
    LAST_SAVED: 'nexus-onboarding-last-saved'
  };

  // Save data to localStorage
  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, []);

  // Load data from localStorage
  const loadFromLocalStorage = useCallback((key: string) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  }, []);

  // Clear localStorage data
  const clearLocalStorage = useCallback(() => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }, []);

  // Auto-save form data
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      saveToLocalStorage(STORAGE_KEYS.FORM_DATA, formData);
    }
  }, [formData, saveToLocalStorage]);

  // Auto-save phase and step data
  useEffect(() => {
    if (currentPhaseData) {
      saveToLocalStorage(STORAGE_KEYS.PHASE_DATA, currentPhaseData);
    }
    if (currentStepData) {
      saveToLocalStorage(STORAGE_KEYS.STEP_DATA, currentStepData);
    }
  }, [currentPhaseData, currentStepData, saveToLocalStorage]);

  // Load onboarding progress on mount with recovery
  useEffect(() => {
    if (user?.id) {
      loadOnboardingProgress();
    }
  }, [user?.id]);

  const loadOnboardingProgress = async () => {
    if (!user?.id) return;

    setIsRecovering(true);

    try {
      // Try to load from localStorage first
      const savedFormData = loadFromLocalStorage(STORAGE_KEYS.FORM_DATA);
      const savedPhaseData = loadFromLocalStorage(STORAGE_KEYS.PHASE_DATA);
      const savedStepData = loadFromLocalStorage(STORAGE_KEYS.STEP_DATA);
      const savedProgress = loadFromLocalStorage(STORAGE_KEYS.PROGRESS);

      // Load current progress from database
      const progressData = await getOnboardingProgress(user.id);
      
      if (progressData) {
        // Merge saved data with database data
        const mergedFormData = { ...savedFormData, ...progressData.formData };
        setFormData(mergedFormData);
        
        // Load current phase configuration
        const phaseConfig = await getPhaseConfiguration(progressData.currentPhase);
        if (phaseConfig) {
          setCurrentPhaseData(phaseConfig);
          
          // Find current step
          const currentStepConfig = phaseConfig.steps.find((step: any) => step.id === progressData.currentStep);
          setCurrentStepData(currentStepConfig);
        }
      } else if (savedPhaseData && savedStepData) {
        // Recover from localStorage if database doesn't have progress
        console.log('Recovering onboarding progress from localStorage');
        setFormData(savedFormData || {});
        setCurrentPhaseData(savedPhaseData);
        setCurrentStepData(savedStepData);
        setShowRecoveryNotification(true);
      } else {
        // Start fresh onboarding
        await startFreshOnboarding();
      }
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
      // Try to recover from localStorage
      const savedFormData = loadFromLocalStorage(STORAGE_KEYS.FORM_DATA);
      const savedPhaseData = loadFromLocalStorage(STORAGE_KEYS.PHASE_DATA);
      const savedStepData = loadFromLocalStorage(STORAGE_KEYS.STEP_DATA);
      
      if (savedPhaseData && savedStepData) {
        console.log('Recovering from localStorage after error');
        setFormData(savedFormData || {});
        setCurrentPhaseData(savedPhaseData);
        setCurrentStepData(savedStepData);
      } else {
        await startFreshOnboarding();
      }
    } finally {
      setIsRecovering(false);
    }
  };

  const startFreshOnboarding = async () => {
    try {
      // Start with the first phase
      const firstPhase = ONBOARDING_PHASES[0];
      const phaseConfig = await getPhaseConfiguration(firstPhase.id);
      
      if (phaseConfig) {
        setCurrentPhaseData(phaseConfig);
        setCurrentStepData(phaseConfig.steps[0]);
        setFormData({});
      }
    } catch (error) {
      console.error('Error starting fresh onboarding:', error);
    }
  };

  const handleStepComplete = async (stepData: any) => {
    if (!user?.id || !currentStepData) {
      console.error('Missing user or current step data');
      return;
    }

    try {
      // Update form data first
      const updatedFormData = { ...formData, ...stepData };
      setFormData(updatedFormData);

      // Validate step data (skip validation for placeholder steps)
      if (currentStepData.id !== 'tool-connection-setup' && 
          currentStepData.id !== 'data-source-configuration' && 
          currentStepData.id !== 'permission-granting') {
        const validation = await validateStepData(currentStepData.id, stepData);
        if (validation && !validation.valid) {
          console.error('Step validation failed:', validation.errors);
          return;
        }
      }

      // Save step data to database (with timeout)
      try {
        const savePromise = saveStep(currentStepData.id, updatedFormData);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Save timeout')), 10000)
        );
        await Promise.race([savePromise, timeoutPromise]);
      } catch (error) {
        console.error('Failed to save step data:', error);
        // Continue anyway - data is saved in localStorage
      }

      // Check if this is the last step in the current phase
      const currentPhaseIndex = currentPhaseData.steps.findIndex((step: any) => step.id === currentStepData.id);
      const isLastStepInPhase = currentPhaseIndex === currentPhaseData.steps.length - 1;

      if (isLastStepInPhase) {
        // Complete the phase
        try {
          const phaseResult = await completeOnboardingPhase(user.id, currentPhaseData.id, updatedFormData);
          if (phaseResult) {
            // Save progress to localStorage
            saveToLocalStorage(STORAGE_KEYS.PROGRESS, {
              currentPhase: phaseResult.nextPhase || currentPhaseData.id,
              currentStep: phaseResult.nextStep,
              formData: updatedFormData,
              completedAt: new Date().toISOString()
            });

            // Check if this was the last phase
            if (phaseResult.nextPhase) {
              // Load next phase
              await loadOnboardingProgress();
            } else {
              // Onboarding complete
              clearLocalStorage();
              onComplete(updatedFormData);
            }
          }
        } catch (error: unknown) {
          console.error('Failed to complete phase:', error);
          // Save progress to localStorage as backup
          saveToLocalStorage(STORAGE_KEYS.PROGRESS, {
            currentPhase: currentPhaseData.id,
            currentStep: currentStepData.id,
            formData: updatedFormData,
            error: error instanceof Error ? error.message : 'Unknown error',
            lastAttempt: new Date().toISOString()
          });
        }
      } else {
        // Move to next step in current phase
        const nextStep = currentPhaseData.steps[currentPhaseIndex + 1];
        setCurrentStepData(nextStep);
        
        // Save progress to localStorage
        saveToLocalStorage(STORAGE_KEYS.PROGRESS, {
          currentPhase: currentPhaseData.id,
          currentStep: nextStep.id,
          formData: updatedFormData,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error in handleStepComplete:', error);
      // Log error but continue to prevent getting stuck
    }
  };

  const handleSkipStep = () => {
    if (!currentStepData || currentStepData.isRequired) return;
    
    // Skip optional step
    handleStepComplete({});
  };

  if (isRecovering) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Recovering your progress...</p>
        </div>
      </div>
    );
  }

  if (!currentPhaseData || !currentStepData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Recovery Notification */}
      {showRecoveryNotification && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Progress Recovered</p>
              <p className="text-xs text-blue-600">Your onboarding progress has been restored from your browser's local storage.</p>
            </div>
            <button
              onClick={() => setShowRecoveryNotification(false)}
              className="ml-auto text-blue-400 hover:text-blue-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Phase Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{currentPhaseData.title}</h1>
            <p className="text-muted-foreground">{currentPhaseData.description}</p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="mb-2">
              Phase {ONBOARDING_PHASES.findIndex((p: any) => p.id === currentPhaseData.id) + 1} of {ONBOARDING_PHASES.length}
            </Badge>
            <p className="text-sm text-muted-foreground">{currentPhaseData.estimatedDuration}</p>
          </div>
        </div>
        
        {/* Phase Objectives */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Phase Objectives:</h3>
          <div className="flex flex-wrap gap-2">
            {currentPhaseData.objectives.map((objective: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {objective}
              </Badge>
            ))}
          </div>
        </div>

        {/* Step Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step Progress</span>
            <span className="text-sm text-muted-foreground">
              {currentPhaseData.steps.findIndex((s: any) => s.id === currentStepData.id) + 1} of {currentPhaseData.steps.length}
            </span>
          </div>
          <Progress 
            value={(currentPhaseData.steps.findIndex((s: any) => s.id === currentStepData.id) + 1) / currentPhaseData.steps.length * 100} 
            className="h-2"
          />
        </div>
      </div>

      {/* Current Step */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStepData.title}
            {currentStepData.isRequired && (
              <Badge variant="destructive" className="text-xs">Required</Badge>
            )}
          </CardTitle>
          <p className="text-muted-foreground">{currentStepData.description}</p>
        </CardHeader>
        <CardContent>
          {/* Render step component dynamically */}
          {(() => {
            const StepComponent = stepComponents[currentStepData.component];
            if (!StepComponent) {
              return (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Step component "{currentStepData.component}" not found
                  </p>
                </div>
              );
            }
            
            return (
              <StepComponent
                onNext={handleStepComplete}
                onSkip={handleSkipStep}
                data={formData}
                currentStep={currentPhaseData.steps.findIndex((s: any) => s.id === currentStepData.id) + 1}
                totalSteps={currentPhaseData.steps.length}
                user={user}
              />
            );
          })()}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isProcessing && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * AppWithOnboarding
 * 
 * Checks if user needs onboarding and shows appropriate flow
 * Only used on protected routes where user is authenticated
 */
export const AppWithOnboarding = React.memo<AppWithOnboardingProps>(({ children }) => {
  const { user, loading: authLoading, profile } = useUser();
  const { getOnboardingStatus, completeOnboarding } = useOnboardingService();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [showFirstTimeWelcome, setShowFirstTimeWelcome] = useState(false);
  const [showCompletionChecker, setShowCompletionChecker] = useState(false);
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);
  const mountedRef = useRef(true);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for force-onboarding URL parameter
  const isForceOnboarding = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('force-onboarding') === 'true';
  }, []);

  // Check if user is first-time user
  const checkFirstTimeUser = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await onboardingService.isFirstTimeUser(user.id);
      if (result.success && result.data) {
        setIsFirstTimeUser(result.data);
        if (result.data) {
          setShowFirstTimeWelcome(true);
        }
      }
    } catch (error) {
      console.error('Error checking first-time user status:', error);
    }
  }, [user?.id]);

  const checkOnboardingStatus = useCallback(async () => {
    if (!user?.id || !mountedRef.current) {
      setIsCheckingOnboarding(false);
      return;
    }

    // Clear any existing timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    // Debounce the check to prevent rapid calls
    checkTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      // If force-onboarding is enabled, always show onboarding
      if (isForceOnboarding) {
        if (mountedRef.current) {
          setShowOnboarding(true);
          setOnboardingCompleted(false);
          setIsCheckingOnboarding(false);
        }
        return;
      }

      try {
        // First check if user is first-time user
        await checkFirstTimeUser();

        // Then check onboarding completion
        const status = await getOnboardingStatus(user.id);
        if (mountedRef.current) {
          if (status) {
            const isCompleted = status.isCompleted;
            setShowOnboarding(!isCompleted);
            setOnboardingCompleted(isCompleted);
            
            // If not completed, show completion checker
            if (!isCompleted) {
              setShowCompletionChecker(true);
            }
          } else {
            setShowOnboarding(true);
            setShowCompletionChecker(true);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        if (mountedRef.current) {
          setShowOnboarding(true);
          setShowCompletionChecker(true);
        }
      } finally {
        if (mountedRef.current) {
          setIsCheckingOnboarding(false);
        }
      }
    }, 100); // 100ms debounce
  }, [user?.id, isForceOnboarding, getOnboardingStatus, checkFirstTimeUser]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!authLoading && user) {
      checkOnboardingStatus();
    }

    return () => {
      mountedRef.current = false;
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [authLoading, user, checkOnboardingStatus]);

  const handleFirstTimeWelcomeComplete = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Mark first-time experience as complete
      await onboardingService.markFirstTimeExperienceComplete(user.id);
      setShowFirstTimeWelcome(false);
      
      // Check onboarding completion after first-time welcome
      setShowCompletionChecker(true);
    } catch (error) {
      console.error('Error completing first-time welcome:', error);
      setShowFirstTimeWelcome(false);
      setShowCompletionChecker(true);
    }
  }, [user?.id]);

  const handleFirstTimeWelcomeSkip = useCallback(() => {
    setShowFirstTimeWelcome(false);
    setShowCompletionChecker(true);
  }, []);

  const handleCompletionCheckerComplete = useCallback(() => {
    setShowCompletionChecker(false);
    setShowOnboarding(false);
    setOnboardingCompleted(true);
  }, []);

  const handleCompletionCheckerIncomplete = useCallback((requirements: string[]) => {
    setMissingRequirements(requirements);
    setShowCompletionChecker(false);
    setShowOnboarding(true);
  }, []);

  const handleOnboardingComplete = useCallback(async (data: any) => {
    if (!user?.id || !mountedRef.current) {
      console.error('User not authenticated during onboarding completion');
      return;
    }

    try {
      // Complete onboarding with all collected data
      const success = await completeOnboarding({
        ...data,
        userId: user.id,
        completedAt: new Date().toISOString()
      });

      if (success && mountedRef.current) {
        console.log('Onboarding completed successfully');
        setShowOnboarding(false);
        setOnboardingCompleted(true);
        setShowCompletionChecker(false);
        
        // If force-onboarding was active, remove the parameter and reload
        if (isForceOnboarding && typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('force-onboarding');
          window.location.href = url.toString();
        } else {
          // Refresh the page to ensure all components are properly initialized
          window.location.reload();
        }
      } else {
        console.error('Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }, [user?.id, completeOnboarding, isForceOnboarding]);

  // Show loading while checking onboarding status
  if (authLoading || isCheckingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show first-time welcome if user is first-time
  if (showFirstTimeWelcome && user) {
    return (
      <FirstTimeWelcome
        userName={profile?.first_name || profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
        onComplete={handleFirstTimeWelcomeComplete}
        onSkip={handleFirstTimeWelcomeSkip}
      />
    );
  }

  // Show completion checker if onboarding is not complete
  if (showCompletionChecker && user) {
    return (
      <OnboardingCompletionChecker
        onComplete={handleCompletionCheckerComplete}
        onIncomplete={handleCompletionCheckerIncomplete}
      />
    );
  }

  // Show onboarding if not completed
  if (showOnboarding && user) {
    return (
      <div className="min-h-screen bg-background">
        <FivePhaseOnboardingFlow onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // Show main app if onboarding is completed or user is not authenticated
  return <>{children}</>;
});

AppWithOnboarding.displayName = 'AppWithOnboarding';

/**
 * Simple wrapper for public routes that doesn't trigger auth context
 */
export const PublicRouteWrapper: React.FC<AppWithOnboardingProps> = ({ children }) => {
  return <>{children}</>;
}; 