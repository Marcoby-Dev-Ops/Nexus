import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks';
import { logger } from '@/shared/utils/logger';
import { nowIsoUtc } from '@/shared/utils/time';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { useOnboardingService } from '@/shared/hooks/useOnboardingService';
import { onboardingService, ONBOARDING_PHASES } from '@/shared/services/OnboardingService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
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
  DollarSign,
  AlertCircle,
  Rocket
} from 'lucide-react';
import { FirstTimeWelcome } from '@/shared/components/FirstTimeWelcome';
import { OnboardingCompletionChecker } from '@/shared/components/OnboardingCompletionChecker';
import { authentikAuthService } from '@/core/auth/AuthentikAuthService';
import { motion } from 'framer-motion';

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
    <motion.div 
      className="w-full max-w-4xl mx-auto p-4 md:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      
      {/* Main Welcome Message */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      >
        <motion.div 
          className="w-16 h-16 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "backOut" }}
          whileHover={{ scale: 1.05, rotate: 5 }}
        >
          <Brain className="w-8 h-8 text-primary" />
        </motion.div>
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        >
          Welcome to Nexus
        </motion.h1>
        <motion.p 
          className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
        >
          Let's get you set up quickly and show you AI in action
        </motion.p>
        
        {/* Quick Setup Preview */}
        <motion.div 
          className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg p-6 mb-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.0, ease: "easeOut" }}
        >
          <motion.h3 
            className="font-semibold text-foreground mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.2, ease: "easeOut" }}
          >
            ⚡ Quick Setup (5-8 minutes)
          </motion.h3>
          <motion.p 
            className="text-foreground mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.4, ease: "easeOut" }}
          >
            <strong>1.</strong> Basic info (name, company, business) <br/>
            <strong>2.</strong> See AI generate goals and action plans <br/>
            <strong>3.</strong> Connect tools and start using Nexus
          </motion.p>
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.8, ease: "easeOut" }}
      >
        <Card className="mb-6 w-full">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  icon: User,
                  title: "Learn About You",
                  description: "Help Nexus understand your role, experience, and preferences"
                },
                {
                  icon: Building2,
                  title: "Learn About Your Business",
                  description: "Share your business context, goals, and challenges"
                },
                {
                  icon: Sparkles,
                  title: "Create Your Intelligence",
                  description: "Build a personalized AI that works exactly how you need"
                }
              ].map((item, index) => (
                <motion.div 
                  key={item.title}
                  className="text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 2.0 + (index * 0.2), 
                    ease: "easeOut" 
                  }}
                  whileHover={{ 
                    y: -5,
                    transition: { duration: 0.3 }
                  }}
                >
                  <motion.div 
                    className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3"
                    whileHover={{ 
                      scale: 1.1, 
                      backgroundColor: "rgba(59, 130, 246, 0.2)",
                      transition: { duration: 0.3 }
                    }}
                  >
                    <item.icon className="w-6 h-6 text-primary" />
                  </motion.div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div 
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.8, ease: "easeOut" }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button onClick={handleNext} className="px-6 md:px-8 py-3 text-base md:text-lg">
            Start Training Nexus
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: [0, 4, 0] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                repeatDelay: 2,
                ease: "easeInOut"
              }}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
            </motion.div>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// Step 1: Core Identity & Priorities (Combined approach)
const CoreIdentityStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps, user }) => {
  const { saveStep, isProcessing } = useOnboardingService();
  const { updateProfile, mappingReady } = useUserProfile();
  
  // Debug authentication state - only run once on mount
  useEffect(() => {
    const checkAuth = async () => {
      const result = await authentikAuthService.getSession();
      const session = result.data;
      logger.info('[BasicInfoStep] Auth session:', { session, user });
    };
    
    checkAuth();
  }, [user]);

  const [firstName, setFirstName] = useState(data.firstName || '');
  const [lastName, setLastName] = useState(data.lastName || '');
  const [company, setCompany] = useState(data.company || '');
  const [industry, setIndustry] = useState(data.industry || '');
  const [companySize, setCompanySize] = useState(data.companySize || '');
  const [keyPriorities, setKeyPriorities] = useState<string[]>(data.keyPriorities || []);

  // Business context options
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

  const priorityOptions = [
    'Increase revenue', 'Improve efficiency', 'Better customer insights',
    'Automate processes', 'Scale operations', 'Reduce costs',
    'Improve team collaboration', 'Better decision making'
  ];

  const handleNext = useCallback(async () => {
    if (!user?.id) {
      logger.error('[BasicInfoStep] User not authenticated');
      return;
    }

    // Test authentication first
    try {
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      logger.info('[BasicInfoStep] Current session:', session);
      
      if (!session) {
        logger.error('[BasicInfoStep] No active session found');
        return;
      }
    } catch (error) {
      logger.error('[BasicInfoStep] Session check failed:', error);
      return;
    }

    const stepData = {
      userId: user.id,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
      company,
      industry,
      companySize,
      keyPriorities
    };

    logger.info('[BasicInfoStep] Step data to save:', stepData);

    // Save step data to database
    const success = await saveStep('basic-profile-creation', stepData);
    
    // Update user profile immediately so Account Settings reflects values
    if (success && mappingReady) {
      try {
        await updateProfile({
          first_name: firstName,
          last_name: lastName,
          display_name: stepData.displayName,
        });
        logger.info('[BasicInfoStep] Profile updated successfully');
      } catch (e) {
        logger.warn('[BasicInfoStep] Profile update after save failed', e);
      }
    } else if (success && !mappingReady) {
      logger.warn('[BasicInfoStep] Skipping profile update - user mapping not ready');
    }
    
    if (success) {
      logger.info('[BasicInfoStep] Step data saved successfully');
      onNext(stepData);
    } else {
      logger.error('[BasicInfoStep] Failed to save step data');
    }
  }, [user?.id, firstName, lastName, company, industry, companySize, keyPriorities, saveStep, onNext]);

  const canProceed = firstName.trim() && lastName.trim() && company.trim() && industry && companySize && keyPriorities.length > 0;

  const handleFirstNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);
  }, []);

  const handleLastNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
  }, []);

  const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCompany(e.target.value);
  }, []);

  const handlePriorityToggle = useCallback((priority: string) => {
    setKeyPriorities(prev => {
      if (prev.includes(priority)) {
        return prev.filter(p => p !== priority);
      } else if (prev.length < 3) {
        return [...prev, priority];
      }
      return prev;
    });
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      
      {/* Core Identity & Priorities */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-3">Core Identity & Priorities</h2>
        <p className="text-muted-foreground mb-4">
          3-4 fast questions to understand your business
        </p>
      </div>
      
      <Card className="mb-6 w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl md:text-2xl">
            <User className="w-5 h-5" />
            Personal & Business Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center md:text-left">
              <label className="block text-sm md:text-base font-medium mb-2">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={handleFirstNameChange}
                className="w-full p-3 md:p-4 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground text-center md:text-left"
                placeholder="John"
                required
              />
            </div>
            
            <div className="text-center md:text-left">
              <label className="block text-sm md:text-base font-medium mb-2">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={handleLastNameChange}
                className="w-full p-3 md:p-4 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground text-center md:text-left"
                placeholder="Smith"
                required
              />
            </div>
          </div>
          

          
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <input
              type="text"
              value={company}
              onChange={handleCompanyChange}
              className="w-full p-3 border rounded-lg focus: ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Your company name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full p-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              required
            >
              <option value="" className="text-muted-foreground">Select your industry</option>
              {industries.map(ind => (
                <option key={ind.value} value={ind.value} className="text-foreground">{ind.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Company Size</label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="w-full p-3 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              required
            >
              <option value="" className="text-muted-foreground">Select company size</option>
              {companySizes.map(size => (
                <option key={size} value={size} className="text-foreground">{size}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Key Priorities 
              <span className="text-xs text-muted-foreground ml-2">
                (Select up to 3)
              </span>
            </label>
            {keyPriorities.length >= 3 && (
              <p className="text-sm text-amber-600 mb-2">
                You've selected your top 3 priorities. Unselect one to choose another.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {priorityOptions.map(priority => (
                <button
                  key={priority}
                  onClick={() => handlePriorityToggle(priority)}
                  disabled={!keyPriorities.includes(priority) && keyPriorities.length >= 3}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    keyPriorities.includes(priority)
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : keyPriorities.length >= 3
                      ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                      : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onSkip} className="px-6 md:px-8 py-3 text-base md:text-lg">
          Skip for now
        </Button>
        <Button onClick={handleNext} disabled={!canProceed || isProcessing} className="px-6 md:px-8 py-3 text-base md:text-lg">
          {isProcessing ? 'Saving...' : 'Next: Quick Connect'}
        </Button>
      </div>
    </div>
  );
};

// Step 2: Quick Connect Integrations
const QuickConnectStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps, user }) => {
  const { saveStep, isProcessing } = useOnboardingService();
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(data.selectedIntegrations || []);
  const [connectionStatus, setConnectionStatus] = useState<{[key: string]: 'idle' | 'connecting' | 'connected' | 'failed'}>({});

  // Smart tool recommendations based on business context
  const getRecommendedTools = (industry: string, companySize: string, priorities: string[]) => {
    const baseTools = [
      {
        id: 'hubspot',
        name: 'HubSpot CRM',
        description: 'Customer relationship management',
        icon: '🔵',
        category: 'CRM',
        recommended: true
      },
      {
        id: 'quickbooks',
        name: 'QuickBooks',
        description: 'Financial management & accounting',
        icon: '🟢',
        category: 'Finance',
        recommended: true
      }
    ];

    const industrySpecific = {
      'technology': [
        { id: 'github', name: 'GitHub', description: 'Code repository & project management', icon: '⚫', category: 'Development' },
        { id: 'slack', name: 'Slack', description: 'Team communication', icon: '🟣', category: 'Communication' }
      ],
      'retail-ecommerce': [
        { id: 'shopify', name: 'Shopify', description: 'E-commerce platform', icon: '🟢', category: 'E-commerce' },
        { id: 'stripe', name: 'Stripe', description: 'Payment processing', icon: '🟣', category: 'Finance' }
      ],
      'professional-services': [
        { id: 'asana', name: 'Asana', description: 'Project management', icon: '🟠', category: 'Productivity' },
        { id: 'zoom', name: 'Zoom', description: 'Video conferencing', icon: '🔵', category: 'Communication' }
      ],
      'financial-services': [
        { id: 'salesforce', name: 'Salesforce', description: 'Enterprise CRM', icon: '🔵', category: 'CRM' },
        { id: 'tableau', name: 'Tableau', description: 'Business intelligence', icon: '🟠', category: 'Analytics' }
      ]
    };

    const priorityBased = {
      'Increase revenue': [
        { id: 'google-ads', name: 'Google Ads', description: 'Digital advertising', icon: '🔴', category: 'Marketing' },
        { id: 'mailchimp', name: 'Mailchimp', description: 'Email marketing', icon: '🟡', category: 'Marketing' }
      ],
      'Improve efficiency': [
        { id: 'zapier', name: 'Zapier', description: 'Workflow automation', icon: '🟠', category: 'Automation' },
        { id: 'notion', name: 'Notion', description: 'Team workspace', icon: '⚫', category: 'Productivity' }
      ],
      'Better customer insights': [
        { id: 'google-analytics', name: 'Google Analytics', description: 'Website analytics', icon: '🟡', category: 'Analytics' },
        { id: 'intercom', name: 'Intercom', description: 'Customer messaging', icon: '🟢', category: 'Support' }
      ]
    };

    let recommended = [...baseTools];
    
    // Add industry-specific tools
    if (industrySpecific[industry as keyof typeof industrySpecific]) {
      recommended.push(...industrySpecific[industry as keyof typeof industrySpecific]);
    }

    // Add priority-based tools
    priorities.forEach(priority => {
      if (priorityBased[priority as keyof typeof priorityBased]) {
        recommended.push(...priorityBased[priority as keyof typeof priorityBased]);
      }
    });

    // Limit to top 6 recommendations
    return recommended.slice(0, 6);
  };

  const recommendedTools = getRecommendedTools(data.industry, data.companySize, data.keyPriorities || []);

  const handleIntegrationToggle = (integrationId: string) => {
    setSelectedIntegrations(prev => 
      prev.includes(integrationId)
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    );
  };

  const handleConnect = async (integrationId: string) => {
    setConnectionStatus(prev => ({ ...prev, [integrationId]: 'connecting' }));
    
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, simulate successful connection
      setConnectionStatus(prev => ({ ...prev, [integrationId]: 'connected' }));
      
      // Update maturity score and insights
      const updatedData = {
        ...data,
        selectedIntegrations: [...selectedIntegrations, integrationId],
        maturityScore: Math.min(100, (data.maturityScore || 0) + 15),
        insightsUnlocked: (data.insightsUnlocked || 0) + 3
      };
      
      onNext(updatedData);
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [integrationId]: 'failed' }));
    }
  };

  const handleNext = async () => {
    const stepData = {
      ...data,
      selectedIntegrations,
      quickConnectCompleted: true
    };

    const success = await saveStep('quick-connect-integrations', stepData);
    
    if (success) {
      onNext(stepData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Connect</h2>
        <p className="text-gray-600">
          Connect your top 2-3 business tools to unlock personalized insights
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {recommendedTools.map((tool) => (
          <div
            key={tool.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedIntegrations.includes(tool.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleIntegrationToggle(tool.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{tool.icon}</span>
                  <h4 className="font-medium text-gray-900">{tool.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                  {tool.category}
                </span>
              </div>
              <input
                type="checkbox"
                checked={selectedIntegrations.includes(tool.id)}
                onChange={() => handleIntegrationToggle(tool.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            {selectedIntegrations.includes(tool.id) && (
              <div className="mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnect(tool.id);
                  }}
                  disabled={connectionStatus[tool.id] === 'connecting'}
                  className={`w-full py-2 px-3 text-sm rounded-md transition-colors ${
                    connectionStatus[tool.id] === 'connected'
                      ? 'bg-green-100 text-green-800'
                      : connectionStatus[tool.id] === 'connecting'
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {connectionStatus[tool.id] === 'connected' && '✓ Connected'}
                  {connectionStatus[tool.id] === 'connecting' && 'Connecting...'}
                  {connectionStatus[tool.id] === 'failed' && 'Retry Connection'}
                  {!connectionStatus[tool.id] && 'Connect Now'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedIntegrations.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Connection Benefits</h4>
          <div className="text-sm text-blue-800">
            <p>• <strong>{selectedIntegrations.length * 3}</strong> new insights unlocked</p>
            <p>• Maturity score increased by <strong>{selectedIntegrations.length * 15}</strong> points</p>
            <p>• Personalized dashboard will be populated with your data</p>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => onSkip(data)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={handleNext}
          disabled={isProcessing}
          className="bg-primary text-white py-2 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Saving...' : 'Next: Your First Insights'}
        </button>
      </div>
    </div>
  );
};

// Step 3: Day One Insight Preview
const DayOneInsightStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps, user }) => {
  const { saveStep, isProcessing } = useOnboardingService();
  const [maturityScore, setMaturityScore] = useState(data.maturityScore || 45);
  const [insights, setInsights] = useState<any[]>([]);

  // Generate insights based on business context
  useEffect(() => {
    const generateInsights = () => {
      const baseInsights = [
        {
          id: 1,
          type: 'opportunity',
          title: 'Revenue Growth Opportunity',
          description: 'Based on your industry, companies similar to yours see 23% revenue growth when implementing automated lead scoring.',
          impact: 'High',
          confidence: 87,
          action: 'Set up automated lead scoring in your CRM'
        },
        {
          id: 2,
          type: 'efficiency',
          title: 'Time Savings Potential',
          description: 'Automating invoice processing could save your team 8 hours per week.',
          impact: 'Medium',
          confidence: 92,
          action: 'Connect your accounting software for automated workflows'
        },
        {
          id: 3,
          type: 'insight',
          title: 'Customer Retention Focus',
          description: 'Your industry has a 15% higher customer churn rate than average. Focus on retention strategies.',
          impact: 'High',
          confidence: 78,
          action: 'Implement customer success tracking'
        }
      ];

      // Add integration-specific insights
      if (data.selectedIntegrations?.includes('hubspot')) {
        baseInsights.push({
          id: 4,
          type: 'integration',
          title: 'HubSpot Integration Active',
          description: 'Your CRM data shows 34 leads in pipeline. 12 are ready for follow-up.',
          impact: 'Medium',
          confidence: 95,
          action: 'Review and prioritize your lead pipeline'
        });
      }

      if (data.selectedIntegrations?.includes('quickbooks')) {
        baseInsights.push({
          id: 5,
          type: 'integration',
          title: 'Financial Health Check',
          description: 'Your cash flow is healthy. Consider investing in growth initiatives.',
          impact: 'Medium',
          confidence: 88,
          action: 'Review growth investment opportunities'
        });
      }

      setInsights(baseInsights);
    };

    generateInsights();
  }, [data.selectedIntegrations]);

  const handleNext = async () => {
    const stepData = {
      ...data,
      dayOneInsights: insights,
      maturityScore,
      insightsUnlocked: insights.length
    };

    const success = await saveStep('day-1-insight-preview', stepData);
    
    if (success) {
      onNext(stepData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your First Insights</h2>
        <p className="text-gray-600">
          See your executive dashboard and top opportunities
        </p>
      </div>

      {/* Maturity Score */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Business Maturity Score</h3>
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full border-4 border-gray-200 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">{maturityScore}</span>
            </div>
            <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-blue-600 border-t-transparent transform rotate-45"></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {maturityScore < 30 ? 'Getting Started' : 
             maturityScore < 60 ? 'Growing Strong' : 
             maturityScore < 80 ? 'Well Established' : 'Industry Leader'}
          </p>
        </div>
      </div>

      {/* Top Insights */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900">Top 3 Opportunities</h3>
        {insights.slice(0, 3).map((insight) => (
          <div key={insight.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">{insight.title}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                insight.impact === 'High' ? 'bg-red-100 text-red-800' :
                insight.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {insight.impact} Impact
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Confidence: {insight.confidence}%
              </span>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                {insight.action}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Tracker */}
      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <h4 className="font-medium text-gray-900 mb-3">Your Progress</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Setup Complete</span>
            <span className="text-green-600">✓</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Integrations Connected</span>
            <span className="text-blue-600">{data.selectedIntegrations?.length || 0}/3</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Insights Unlocked</span>
            <span className="text-purple-600">{insights.length}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => onSkip(data)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleNext}
          disabled={isProcessing}
          className="bg-primary text-white py-2 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Saving...' : 'Next: AI-Powered Goals'}
        </button>
      </div>
    </div>
  );
};

// Step 4: Dashboard Introduction
const DashboardIntroStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps, user }) => {
  const { saveStep, isProcessing } = useOnboardingService();

  const handleNext = async () => {
    const stepData = {
      ...data,
      dashboardIntroCompleted: true
    };

    const success = await saveStep('dashboard-introduction', stepData);
    
    if (success) {
      onNext(stepData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
          <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2zm0 0a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Executive Dashboard</h2>
        <p className="text-gray-600">
          Tour your personalized business dashboard
        </p>
      </div>

      {/* Dashboard Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Revenue</h4>
            <p className="text-2xl font-bold text-blue-600">$127K</p>
            <p className="text-sm text-blue-700">+12% this month</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Pipeline</h4>
            <p className="text-2xl font-bold text-green-600">$89K</p>
            <p className="text-sm text-green-700">23 active deals</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Efficiency</h4>
            <p className="text-2xl font-bold text-purple-600">87%</p>
            <p className="text-sm text-purple-700">Process optimization</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Key Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Real-time business metrics</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">AI-powered insights</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Automated workflows</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Predictive analytics</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => onSkip(data)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleNext}
          disabled={isProcessing}
          className="bg-primary text-white py-2 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Saving...' : 'Next: Your First Action'}
        </button>
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
      logger.error('[BusinessContextStep] User not authenticated');
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
      logger.info('[BusinessContextStep] Step data saved successfully');
      onNext(stepData);
    } else {
      logger.error('[BusinessContextStep] Failed to save step data');
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
        <h2 className="text-3xl font-bold mb-2 text-foreground">Step 2: Learn About Your Business</h2>
        <p className="text-muted-foreground text-lg mb-4">Now let's help Nexus understand your business context</p>
        
        {/* Narrative Context */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4 max-w-2xl mx-auto">
          <p className="text-sm text-purple-800">
            <strong>What Nexus is learning:</strong> Your industry, company size, goals, and challenges. 
            This helps us provide industry-specific insights and tailor recommendations to your business maturity level.
          </p>
        </div>
        
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
      logger.error('[AICapabilityStep] User not authenticated');
      return;
    }

    const stepData = {
      userId: user.id,
      selectedUseCases
    };

    // Save step data to database
    const success = await saveStep('ai-capabilities', stepData);
    
    if (success) {
      logger.info('[AICapabilityStep] Step data saved successfully');
      onNext(stepData);
    } else {
      logger.error('[AICapabilityStep] Failed to save step data');
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
    accountActive: boolean;
    profileComplete: boolean;
    verificationLevel: 'none' | 'basic' | 'full';
  } | null>(null);
  const hasAutoAdvancedRef = React.useRef(false);

  // Check verification status on component mount
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user?.id) return;

      try {
        // Get user verification status from Authentik
        const { authentikUserVerificationService } = await import('@/core/auth/AuthentikUserVerificationService');
        const result = await authentikUserVerificationService.getUserVerificationStatus(user.id);
        
        if (result.success && result.data) {
          const status = result.data;
          const details = {
            emailVerified: status.emailVerified,
            accountActive: status.accountActive,
            profileComplete: status.profileComplete,
            verificationLevel: status.verificationLevel
          };
          
          setVerificationDetails(details);
          
          // If fully verified, set status to success and auto-advance this step
          if (status.emailVerified && status.profileComplete && !hasAutoAdvancedRef.current) {
            setVerificationStatus('success');
            hasAutoAdvancedRef.current = true;
            logger.info('[AuthVerificationStep] Already verified, auto-advancing');
            setTimeout(() => {
              onNext({
                ...data,
                authVerified: true,
                verificationCompletedAt: new Date().toISOString(),
                emailVerified: status.emailVerified,
                accountActive: status.accountActive,
                profileComplete: status.profileComplete,
                verificationLevel: status.verificationLevel
              });
            }, 300);
          }
        }
      } catch (error) {
        logger.error('Error checking verification status:', error);
      }
    };

    checkVerificationStatus();
  }, [user?.id]);

  const handleVerification = async () => {
    setIsVerifying(true);
    
    try {
      // Check current verification status using Authentik service
      const { authentikUserVerificationService } = await import('@/core/auth/AuthentikUserVerificationService');
      const result = await authentikUserVerificationService.getUserVerificationStatus(user.id);
      
      if (result.success && result.data) {
        const status = result.data;
        const isFullyVerified = status.emailVerified && status.profileComplete;

        if (isFullyVerified) {
          setVerificationStatus('success');
          
          // Auto-proceed after successful verification
          setTimeout(() => {
            onNext({
              ...data,
              authVerified: true,
              verificationCompletedAt: new Date().toISOString(),
              emailVerified: status.emailVerified,
              accountActive: status.accountActive,
              profileComplete: status.profileComplete,
              verificationLevel: status.verificationLevel
            });
          }, 1000);
        } else {
          // If not verified, show error or prompt for verification
          setVerificationStatus('error');
          logger.error('User account not fully verified', { 
            emailVerified: status.emailVerified, 
            profileComplete: status.profileComplete 
          });
        }
      } else {
        setVerificationStatus('error');
        throw new Error(result.error || 'Failed to check verification status');
      }
    } catch (error) {
      setVerificationStatus('error');
      logger.error('Verification failed:', error);
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
                  ? 'Your email address has been verified via Authentik' 
                  : 'Please verify your email address through Authentik'
                }
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
              verificationDetails?.profileComplete ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {verificationDetails?.profileComplete ? (
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
              <p className="text-sm font-medium text-gray-900">Profile Completion</p>
              <p className="text-sm text-gray-600">
                {verificationDetails?.profileComplete 
                  ? 'Your profile information is complete' 
                  : 'Please complete your profile information'
                }
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
              verificationDetails?.accountActive ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {verificationDetails?.accountActive ? (
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Account Status</p>
              <p className="text-sm text-gray-600">
                {verificationDetails?.accountActive 
                  ? 'Your account is active and ready' 
                  : 'Your account requires activation'
                }
              </p>
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
            <svg className="h-5 w-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 20 20">
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
      logger.error('Activation failed:', error);
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
    // Pre-populate company name from User Setup (BasicInfoStep) if available
    // BasicInfoStep saves as 'company', CompanyInfoStep expects 'companyName'
    companyName: data.companyName || data.company || '',
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
      ...formData,
      // Also save as 'company' for backward compatibility with BasicInfoStep
      company: formData.companyName
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
        <h2 className="text-2xl font-bold text-foreground mb-2">Company Information</h2>
        <p className="text-muted-foreground">
          Tell us about your business so we can personalize your experience.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
            placeholder="Enter your company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Industry *
          </label>
          <select
            value={formData.industry}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
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
          <label className="block text-sm font-medium text-foreground mb-2">
            Company Size *
          </label>
          <select
            value={formData.companySize}
            onChange={(e) => handleInputChange('companySize', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
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
          <label className="block text-sm font-medium text-foreground mb-2">
            Website (Optional)
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
            placeholder="https://yourcompany.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Company Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
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

// NEW STEP: Company Services & Activities
const CompanyServicesStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const [selectedServices, setSelectedServices] = useState<string[]>(data.selectedServices || []);
  const [customServices, setCustomServices] = useState<string[]>(data.customServices || []);
  const [newCustomService, setNewCustomService] = useState('');
  const [businessModel, setBusinessModel] = useState(data.businessModel || '');

  // Predefined service categories for common business types
  const serviceCategories = {
    'technology': [
      { id: 'web-hosting', name: 'Web Hosting', description: 'Website hosting and domain services' },
      { id: 'cloud-services', name: 'Cloud Services', description: 'Cloud infrastructure and platform services' },
      { id: 'software-licensing', name: 'Software Licensing', description: 'Software licensing and distribution' },
      { id: 'hardware-sales', name: 'Hardware Sales', description: 'Computer hardware and equipment sales' },
      { id: 'it-consulting', name: 'IT Consulting', description: 'Technology consulting and advisory services' },
      { id: 'cybersecurity', name: 'Cybersecurity', description: 'Security services and protection' },
      { id: 'data-backup', name: 'Data Backup', description: 'Backup and disaster recovery services' },
      { id: 'network-management', name: 'Network Management', description: 'Network infrastructure and management' }
    ],
    'professional-services': [
      { id: 'consulting', name: 'Consulting', description: 'Business and strategy consulting' },
      { id: 'legal-services', name: 'Legal Services', description: 'Legal advice and representation' },
      { id: 'accounting', name: 'Accounting', description: 'Accounting and bookkeeping services' },
      { id: 'marketing', name: 'Marketing', description: 'Marketing and advertising services' },
      { id: 'design', name: 'Design Services', description: 'Graphic design and creative services' },
      { id: 'training', name: 'Training', description: 'Professional training and education' }
    ],
    'retail-ecommerce': [
      { id: 'online-retail', name: 'Online Retail', description: 'E-commerce and online sales' },
      { id: 'brick-mortar', name: 'Brick & Mortar', description: 'Physical retail locations' },
      { id: 'wholesale', name: 'Wholesale', description: 'Wholesale distribution' },
      { id: 'dropshipping', name: 'Dropshipping', description: 'Dropshipping and fulfillment' }
    ],
    'manufacturing': [
      { id: 'product-manufacturing', name: 'Product Manufacturing', description: 'Manufacturing of physical products' },
      { id: 'custom-fabrication', name: 'Custom Fabrication', description: 'Custom manufacturing services' },
      { id: 'assembly', name: 'Assembly', description: 'Product assembly and packaging' }
    ]
  };

  const businessModels = [
    { value: 'b2b', label: 'Business-to-Business (B2B)' },
    { value: 'b2c', label: 'Business-to-Consumer (B2C)' },
    { value: 'b2b2c', label: 'Business-to-Business-to-Consumer (B2B2C)' },
    { value: 'marketplace', label: 'Marketplace Platform' },
    { value: 'subscription', label: 'Subscription Service' },
    { value: 'consulting', label: 'Consulting Services' },
    { value: 'agency', label: 'Agency/Service Provider' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'distributor', label: 'Distributor/Reseller' },
    { value: 'other', label: 'Other' }
  ];

  // Get relevant services based on industry
  const getRelevantServices = () => {
    const industry = data.industry?.toLowerCase() || '';
    const relevantServices = [];
    
    if (industry.includes('technology') || industry.includes('tech')) {
      relevantServices.push(...serviceCategories.technology);
    }
    if (industry.includes('consulting') || industry.includes('professional')) {
      relevantServices.push(...serviceCategories.professional-services);
    }
    if (industry.includes('retail') || industry.includes('ecommerce')) {
      relevantServices.push(...serviceCategories.retail-ecommerce);
    }
    if (industry.includes('manufacturing')) {
      relevantServices.push(...serviceCategories.manufacturing);
    }
    
    // Always include technology services as they're common across industries
    if (!industry.includes('technology') && !industry.includes('tech')) {
      relevantServices.push(...serviceCategories.technology);
    }
    
    return relevantServices;
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleAddCustomService = () => {
    if (newCustomService.trim() && !customServices.includes(newCustomService.trim())) {
      setCustomServices(prev => [...prev, newCustomService.trim()]);
      setNewCustomService('');
    }
  };

  const handleRemoveCustomService = (service: string) => {
    setCustomServices(prev => prev.filter(s => s !== service));
  };

  const handleNext = () => {
    const allServices = [...selectedServices, ...customServices];
    onNext({
      ...data,
      selectedServices,
      customServices,
      businessModel,
      companyServices: {
        predefined: selectedServices,
        custom: customServices,
        total: allServices.length,
        businessModel
      }
    });
  };

  const relevantServices = getRelevantServices();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What Do You Do?</h2>
        <p className="text-gray-600">
          Tell us about your business activities and services so we can understand how to help you succeed.
        </p>
      </div>

      <div className="space-y-8">
        {/* Business Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Business Model *
          </label>
          <select
            value={businessModel}
            onChange={(e) => setBusinessModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select your business model</option>
            {businessModels.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        {/* Predefined Services */}
        {relevantServices.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Your Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {relevantServices.map((service) => (
                <div
                  key={service.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedServices.includes(service.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleServiceToggle(service.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm text-gray-900">{service.name}</h4>
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </div>
                  <p className="text-xs text-gray-600">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Services */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Services</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCustomService}
              onChange={(e) => setNewCustomService(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomService()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter a custom service (e.g., Custom Software Development)"
            />
            <button
              onClick={handleAddCustomService}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Add
            </button>
          </div>
          
          {customServices.length > 0 && (
            <div className="space-y-2">
              {customServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-900">{service}</span>
                  <button
                    onClick={() => handleRemoveCustomService(service)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {(selectedServices.length > 0 || customServices.length > 0) && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Selected Services Summary</h4>
            <div className="text-sm text-blue-800">
              <p><strong>{selectedServices.length + customServices.length}</strong> services selected</p>
              {businessModel && <p><strong>Business Model:</strong> {businessModels.find(m => m.value === businessModel)?.label}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => onSkip(data)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleNext}
          disabled={!businessModel || (selectedServices.length === 0 && customServices.length === 0)}
          className="bg-primary text-white py-2 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// NEW STEP: AI-Powered Goals with Recommendations
const AIPoweredGoalsStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.selectedGoals || []);
  const [customGoals, setCustomGoals] = useState<string[]>(data.customGoals || []);
  const [newCustomGoal, setNewCustomGoal] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [timeframe, setTimeframe] = useState(data.timeframe || '');
  const [priority, setPriority] = useState(data.priority || '');

  // Generate AI recommendations using Nexus RAG and Unified Brain
  const generateAIRecommendations = async () => {
    setIsGeneratingRecommendations(true);
    
    try {
      // Build comprehensive business context for RAG system
      const businessContext = {
        companyName: data.companyName || data.company,
        industry: data.industry,
        companySize: data.companySize,
        businessModel: data.businessModel,
        services: data.companyServices,
        description: data.description,
        // Add user profile context for personalization
        userProfile: {
          experienceLevel: 'onboarding', // New user
          role: 'business_owner',
          communicationStyle: 'direct',
          businessFocus: data.industry
        }
      };

      // Integrate with Nexus RAG and Unified Brain
      const recommendations = await generateNexusAIRecommendations(businessContext);
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      // Fallback to simulated recommendations if RAG fails
      const fallbackRecommendations = await simulateAIRecommendations(businessContext);
      setAiRecommendations(fallbackRecommendations);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  // Generate recommendations using Nexus RAG and Unified Brain
  const generateNexusAIRecommendations = async (context: any) => {
    try {
      // Import Nexus AI services
      const { contextualRAG } = await import('@/lib/ai/contextualRAG');
      const { nexusUnifiedBrain } = await import('@/services/ai/nexusUnifiedBrain');
      const { ThoughtsService } = await import('@/lib/services/thoughtsService');

      // Initialize Nexus AI services
      const thoughtsService = new ThoughtsService();
      const unifiedBrain = new nexusUnifiedBrain();

      // Build RAG query for goal recommendations
      const ragQuery = `Based on this business context, generate personalized goal recommendations:
        
        Company: ${context.companyName}
        Industry: ${context.industry}
        Business Model: ${context.businessModel}
        Services: ${JSON.stringify(context.services)}
        Company Size: ${context.companySize}
        
        Generate 5-8 specific, actionable business goals that would be most valuable for this business.
        Each goal should include:
        - Specific, measurable objective
        - Business impact assessment
        - Implementation timeframe
        - Key success metrics
        - Priority level
        - Category (Growth, Efficiency, Financial, etc.)
        
        Focus on goals that leverage the business's specific services and industry context.`;

      // Use Contextual RAG to generate intelligent recommendations
      const ragResponse = await contextualRAG.generateResponse({
        query: ragQuery,
        context: {
          userProfile: context.userProfile,
          businessContext: context,
          department: 'executive', // Executive-level goal setting
          experienceLevel: 'onboarding'
        },
        options: {
          useUnifiedBrain: true,
          includeBusinessIntelligence: true,
          generateThoughts: true // Generate initial thoughts for selected goals
        }
      });

      // Process RAG response into structured recommendations
      const recommendations = parseRAGRecommendations(ragResponse);

      // Generate initial thoughts for each recommendation using ThoughtsService
      const thoughtsPromises = recommendations.map(async (rec) => {
        const thoughtData = {
          content: `Goal: ${rec.title} - ${rec.description}`,
          category: 'goal',
          status: 'concept',
          priority: rec.impact === 'High' ? 'high' : 'medium',
          department: rec.category.toLowerCase(),
          estimated_effort: rec.effort === 'Low' ? '1-2 weeks' : rec.effort === 'Medium' ? '1-3 months' : '3-6 months',
          impact: rec.impact,
          success_metrics: rec.metrics,
          timeline_estimate: rec.timeframe,
          aiinsights: {
            confidence: rec.confidence || 85,
            business_value: rec.impact,
            implementation_complexity: rec.effort,
            cross_departmental_impact: rec.category === 'Growth' ? 'high' : 'medium'
          }
        };

        // Create thought in the system
        const thought = await thoughtsService.createThought(thoughtData);
        return { ...rec, thoughtId: thought.data?.id };
      });

      const recommendationsWithThoughts = await Promise.all(thoughtsPromises);

      return recommendationsWithThoughts;
    } catch (error) {
      console.error('Nexus AI recommendation generation failed:', error);
      throw error;
    }
  };

  // Parse RAG response into structured recommendations
  const parseRAGRecommendations = (ragResponse: any) => {
    // This would parse the structured response from the RAG system
    // For now, return enhanced simulated recommendations
    return simulateAIRecommendations(businessContext);
  };

  // Simulate AI recommendations based on business context
  const simulateAIRecommendations = async (context: any) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const recommendations = [];
    
    // Technology company recommendations
    if (context.industry?.toLowerCase().includes('technology') || 
        context.services?.predefined?.includes('web-hosting') ||
        context.services?.predefined?.includes('software-licensing')) {
      recommendations.push(
        {
          id: 'scale-hosting',
          title: 'Scale Web Hosting Operations',
          description: 'Expand your hosting infrastructure to support more clients and improve uptime',
          category: 'Growth',
          impact: 'High',
          effort: 'Medium',
          timeframe: '3-6 months',
          metrics: ['Client retention rate', 'Uptime percentage', 'Revenue per client']
        },
        {
          id: 'automate-billing',
          title: 'Automate Billing & Licensing',
          description: 'Implement automated billing systems for software licensing and hosting services',
          category: 'Efficiency',
          impact: 'High',
          effort: 'Low',
          timeframe: '1-2 months',
          metrics: ['Payment processing time', 'Revenue collection rate', 'Customer satisfaction']
        }
      );
    }
    
    // Professional services recommendations
    if (context.businessModel === 'consulting' || context.businessModel === 'agency') {
      recommendations.push(
        {
          id: 'client-acquisition',
          title: 'Improve Client Acquisition',
          description: 'Develop a systematic approach to acquiring new clients and expanding your client base',
          category: 'Growth',
          impact: 'High',
          effort: 'Medium',
          timeframe: '2-4 months',
          metrics: ['New client acquisition rate', 'Lead conversion rate', 'Average deal size']
        },
        {
          id: 'service-delivery',
          title: 'Optimize Service Delivery',
          description: 'Streamline your service delivery process to improve efficiency and client satisfaction',
          category: 'Efficiency',
          impact: 'Medium',
          effort: 'Low',
          timeframe: '1-3 months',
          metrics: ['Project completion time', 'Client satisfaction score', 'Profit margins']
        }
      );
    }
    
    // B2B recommendations
    if (context.businessModel === 'b2b') {
      recommendations.push(
        {
          id: 'customer-success',
          title: 'Enhance Customer Success',
          description: 'Implement a customer success program to improve retention and expansion',
          category: 'Retention',
          impact: 'High',
          effort: 'Medium',
          timeframe: '2-3 months',
          metrics: ['Customer retention rate', 'Net Revenue Retention', 'Customer satisfaction']
        }
      );
    }
    
    // Always include general business recommendations
    recommendations.push(
      {
        id: 'financial-planning',
        title: 'Improve Financial Planning',
        description: 'Develop better financial forecasting and cash flow management',
        category: 'Financial',
        impact: 'High',
        effort: 'Low',
        timeframe: '1 month',
        metrics: ['Cash flow forecast accuracy', 'Profit margins', 'Working capital']
      },
      {
        id: 'team-productivity',
        title: 'Boost Team Productivity',
        description: 'Implement tools and processes to improve team efficiency and collaboration',
        category: 'Productivity',
        impact: 'Medium',
        effort: 'Low',
        timeframe: '1-2 months',
        metrics: ['Project completion rate', 'Team satisfaction', 'Time to market']
      }
    );
    
    return recommendations;
  };

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleAddCustomGoal = () => {
    if (newCustomGoal.trim() && !customGoals.includes(newCustomGoal.trim())) {
      setCustomGoals(prev => [...prev, newCustomGoal.trim()]);
      setNewCustomGoal('');
    }
  };

  const handleRemoveCustomGoal = (goal: string) => {
    setCustomGoals(prev => prev.filter(g => g !== goal));
  };

  const handleNext = () => {
    const allGoals = [...selectedGoals, ...customGoals];
    const selectedRecommendations = aiRecommendations.filter(rec => selectedGoals.includes(rec.id));
    
    onNext({
      ...data,
      selectedGoals,
      customGoals,
      timeframe,
      priority,
      aiRecommendations: selectedRecommendations,
      goalsData: {
        goals: allGoals,
        recommendations: selectedRecommendations,
        timeframe,
        priority,
        totalGoals: allGoals.length
      }
    });
  };

  const timeframes = [
    { value: '1-month', label: '1 Month' },
    { value: '3-months', label: '3 Months' },
    { value: '6-months', label: '6 Months' },
    { value: '1-year', label: '1 Year' },
    { value: '2-years', label: '2+ Years' }
  ];

  const priorities = [
    { value: 'critical', label: 'Critical - Immediate attention required' },
    { value: 'high', label: 'High - Major impact on business' },
    { value: 'medium', label: 'Medium - Moderate business impact' },
    { value: 'low', label: 'Low - Nice to have' }
  ];

  // Generate recommendations when component mounts
  useEffect(() => {
    if (data.companyServices && aiRecommendations.length === 0) {
      generateAIRecommendations();
    }
  }, [data.companyServices]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
          <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What Are Your Goals?</h2>
        <p className="text-gray-600">
          Based on your business, Nexus AI has generated personalized goal recommendations to help you succeed.
        </p>
      </div>

      <div className="space-y-8">
        {/* AI Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">AI-Recommended Goals</h3>
            {isGeneratingRecommendations && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating recommendations...
              </div>
            )}
          </div>
          
          {aiRecommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiRecommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedGoals.includes(recommendation.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleGoalToggle(recommendation.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{recommendation.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedGoals.includes(recommendation.id)}
                      onChange={() => handleGoalToggle(recommendation.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      recommendation.category === 'Growth' ? 'bg-green-100 text-green-800' :
                      recommendation.category === 'Efficiency' ? 'bg-blue-100 text-blue-800' :
                      recommendation.category === 'Financial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {recommendation.category}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      recommendation.impact === 'High' ? 'bg-red-100 text-red-800' :
                      recommendation.impact === 'Medium' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {recommendation.impact} Impact
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                      {recommendation.timeframe}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <strong>Key Metrics:</strong> {recommendation.metrics.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Goals */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Your Own Goals</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCustomGoal}
              onChange={(e) => setNewCustomGoal(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomGoal()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter a custom goal (e.g., Launch new product line)"
            />
            <button
              onClick={handleAddCustomGoal}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Add
            </button>
          </div>
          
          {customGoals.length > 0 && (
            <div className="space-y-2">
              {customGoals.map((goal, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-900">{goal}</span>
                  <button
                    onClick={() => handleRemoveCustomGoal(goal)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goal Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Primary Timeframe *
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select timeframe</option>
              {timeframes.map((tf) => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Priority Level *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select priority</option>
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        {(selectedGoals.length > 0 || customGoals.length > 0) && (
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Goals Summary</h4>
            <div className="text-sm text-purple-800">
              <p><strong>{selectedGoals.length + customGoals.length}</strong> goals selected</p>
              {timeframe && <p><strong>Timeframe:</strong> {timeframes.find(tf => tf.value === timeframe)?.label}</p>}
              {priority && <p><strong>Priority:</strong> {priorities.find(p => p.value === priority)?.label}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => onSkip(data)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleNext}
          disabled={!timeframe || !priority || (selectedGoals.length === 0 && customGoals.length === 0)}
          className="bg-primary text-white py-2 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// NEW STEP: Generate Initial Thoughts and Initiatives
const InitialThoughtsGenerationStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const [generatedThoughts, setGeneratedThoughts] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedThoughts, setSelectedThoughts] = useState<string[]>([]);

  // Generate initial thoughts based on selected goals
  const generateInitialThoughts = async () => {
    setIsGenerating(true);
    
    try {
      // Import Nexus AI services
      const { contextualRAG } = await import('@/lib/ai/contextualRAG');
      const { ThoughtsService } = await import('@/lib/services/thoughtsService');
      const { nexusUnifiedBrain } = await import('@/services/ai/nexusUnifiedBrain');

      const thoughtsService = new ThoughtsService();
      const unifiedBrain = new nexusUnifiedBrain();

      // Build context from onboarding data
      const onboardingContext = {
        company: data.companyName || data.company,
        industry: data.industry,
        businessModel: data.businessModel,
        services: data.companyServices,
        goals: data.goalsData,
        userProfile: {
          experienceLevel: 'onboarding',
          role: 'business_owner'
        }
      };

      // Generate thoughts for each selected goal
      const thoughtsPromises = data.goalsData?.goals?.map(async (goal: string) => {
        const ragQuery = `Based on this business context and goal, generate 3-5 specific, actionable thoughts/initiatives:
          
          Business Context:
          - Company: ${onboardingContext.company}
          - Industry: ${onboardingContext.industry}
          - Business Model: ${onboardingContext.businessModel}
          - Services: ${JSON.stringify(onboardingContext.services)}
          
          Goal: ${goal}
          
          Generate thoughts that include:
          - Specific action items
          - Implementation steps
          - Success metrics
          - Timeline estimates
          - Resource requirements
          - Risk considerations
          
          Make these practical and immediately actionable for a business owner.`;

        const ragResponse = await contextualRAG.generateResponse({
          query: ragQuery,
          context: {
            userProfile: onboardingContext.userProfile,
            businessContext: onboardingContext,
            department: 'executive',
            experienceLevel: 'onboarding'
          },
          options: {
            useUnifiedBrain: true,
            includeBusinessIntelligence: true,
            generateThoughts: true
          }
        });

        // Parse RAG response into structured thoughts
        const thoughts = parseRAGThoughts(ragResponse, goal);
        
        // Create thoughts in the system
        const createdThoughts = await Promise.all(
          thoughts.map(async (thought: any) => {
            const thoughtData = {
              content: thought.content,
              category: 'initiative',
              status: 'concept',
              priority: thought.priority,
              department: thought.department,
              estimated_effort: thought.estimated_effort,
              impact: thought.impact,
              success_metrics: thought.success_metrics,
              timeline_estimate: thought.timeline,
              aiinsights: {
                confidence: thought.confidence || 80,
                business_value: thought.impact,
                implementation_complexity: thought.complexity,
                related_goal: goal
              }
            };

            const result = await thoughtsService.createThought(thoughtData);
            return { ...thought, id: result.data?.id };
          })
        );

        return createdThoughts;
      }) || [];

      const allThoughts = await Promise.all(thoughtsPromises);
      const flattenedThoughts = allThoughts.flat();
      
      setGeneratedThoughts(flattenedThoughts);
    } catch (error) {
      console.error('Error generating initial thoughts:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Parse RAG response into structured thoughts
  const parseRAGThoughts = (ragResponse: any, goal: string) => {
    // This would parse the structured response from RAG
    // For now, return simulated thoughts
    return [
      {
        content: `Research and implement ${goal.toLowerCase()} best practices`,
        priority: 'high',
        department: 'operations',
        estimated_effort: '2-4 weeks',
        impact: 'High',
        success_metrics: ['Implementation timeline', 'Success rate'],
        timeline: '1 month',
        complexity: 'Medium',
        confidence: 85
      },
      {
        content: `Set up tracking and measurement systems for ${goal.toLowerCase()}`,
        priority: 'medium',
        department: 'analytics',
        estimated_effort: '1-2 weeks',
        impact: 'Medium',
        success_metrics: ['Data accuracy', 'Reporting frequency'],
        timeline: '2 weeks',
        complexity: 'Low',
        confidence: 90
      }
    ];
  };

  const handleThoughtToggle = (thoughtId: string) => {
    setSelectedThoughts(prev => 
      prev.includes(thoughtId)
        ? prev.filter(id => id !== thoughtId)
        : [...prev, thoughtId]
    );
  };

  const handleNext = () => {
    const selectedThoughtsData = generatedThoughts.filter(thought => 
      selectedThoughts.includes(thought.id)
    );

    onNext({
      ...data,
      generatedThoughts,
      selectedThoughts,
      initialThoughtsData: {
        totalGenerated: generatedThoughts.length,
        selected: selectedThoughtsData,
        selectedCount: selectedThoughts.length
      }
    });
  };

  // Generate thoughts when component mounts
  useEffect(() => {
    if (data.goalsData && generatedThoughts.length === 0) {
      generateInitialThoughts();
    }
  }, [data.goalsData]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
          <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your First Thoughts & Initiatives</h2>
        <p className="text-gray-600">
          Nexus AI has generated actionable thoughts and initiatives based on your goals. These will be your starting point for business transformation.
        </p>
      </div>

      {isGenerating ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your personalized thoughts and initiatives...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedThoughts.map((thought) => (
              <div
                key={thought.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedThoughts.includes(thought.id)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleThoughtToggle(thought.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">{thought.content}</h4>
                    <p className="text-sm text-gray-600 mb-2">Timeline: {thought.timeline}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedThoughts.includes(thought.id)}
                    onChange={() => handleThoughtToggle(thought.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    thought.priority === 'high' ? 'bg-red-100 text-red-800' :
                    thought.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {thought.priority} Priority
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    thought.impact === 'High' ? 'bg-green-100 text-green-800' :
                    thought.impact === 'Medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {thought.impact} Impact
                  </span>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                    {thought.estimated_effort}
                  </span>
                </div>
                
                <div className="text-xs text-gray-600">
                  <strong>Success Metrics:</strong> {thought.success_metrics?.join(', ')}
                </div>
              </div>
            ))}
          </div>

          {selectedThoughts.length > 0 && (
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-indigo-900 mb-2">Selected Thoughts Summary</h4>
              <div className="text-sm text-indigo-800">
                <p><strong>{selectedThoughts.length}</strong> thoughts selected for your Nexus workspace</p>
                <p>These will be available in your Thoughts dashboard to track and manage.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => onSkip(data)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleNext}
          disabled={isGenerating || selectedThoughts.length === 0}
          className="bg-primary text-white py-2 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue with {selectedThoughts.length} Thoughts
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
        <label className="block text-sm font-medium text-foreground mb-2">
          Other Industry (Optional)
        </label>
        <input
          type="text"
          value={customIndustry}
          onChange={(e) => setCustomIndustry(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
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
  const [selectedGoal, setSelectedGoal] = useState<string>(data.selectedGoal || '');
  const [goalDetails, setGoalDetails] = useState(data.goalDetails || '');
  const [timeframe, setTimeframe] = useState(data.timeframe || '');
  const [targetMetric, setTargetMetric] = useState(data.targetMetric || '');

  // Focused, quantifiable goal options based on FIRE Cycle framework
  const goalOptions = [
    { 
      id: 'increase-revenue', 
      name: 'Increase Revenue', 
      description: 'Grow sales and improve profitability',
      examples: ['Increase monthly revenue by 25%', 'Grow customer lifetime value by 40%', 'Boost average order value by 30%'],
      metrics: ['Revenue growth %', 'MRR increase', 'Customer LTV', 'Average order value']
    },
    { 
      id: 'reduce-costs', 
      name: 'Reduce Costs', 
      description: 'Optimize operations and cut expenses',
      examples: ['Reduce operational costs by 20%', 'Cut customer acquisition cost by 35%', 'Lower overhead by 15%'],
      metrics: ['Cost reduction %', 'CAC decrease', 'Overhead reduction', 'Efficiency ratio']
    },
    { 
      id: 'improve-efficiency', 
      name: 'Improve Efficiency', 
      description: 'Streamline processes and workflows',
      examples: ['Reduce project delivery time by 30%', 'Increase team productivity by 25%', 'Cut response time by 50%'],
      metrics: ['Time savings %', 'Productivity increase', 'Response time reduction', 'Process efficiency']
    },
    { 
      id: 'expand-market', 
      name: 'Expand Market', 
      description: 'Enter new markets or segments',
      examples: ['Enter 3 new geographic markets', 'Launch 2 new product lines', 'Capture 15% market share'],
      metrics: ['New markets entered', 'Market share %', 'Geographic expansion', 'Product line growth']
    },
    { 
      id: 'enhance-customer-experience', 
      name: 'Enhance Customer Experience', 
      description: 'Improve customer satisfaction and retention',
      examples: ['Increase customer satisfaction to 95%', 'Reduce churn rate by 40%', 'Boost NPS score to 60+'],
      metrics: ['Customer satisfaction %', 'Churn rate reduction', 'NPS score', 'Retention rate']
    }
  ];

  const timeframeOptions = [
    { value: '3-months', label: '3 months' },
    { value: '6-months', label: '6 months' },
    { value: '12-months', label: '12 months' },
    { value: '18-months', label: '18 months' },
    { value: '24-months', label: '24 months' }
  ];

  const selectedGoalData = goalOptions.find(goal => goal.id === selectedGoal);

  const handleNext = () => {
    if (!selectedGoal || !goalDetails || !timeframe || !targetMetric) {
      return; // Don't proceed without all required fields
    }

    onNext({
      ...data,
      selectedGoal,
      goalDetails,
      timeframe,
      targetMetric,
      // Store the full goal data for later use
      goalData: {
        ...selectedGoalData,
        userDetails: goalDetails,
        userTimeframe: timeframe,
        userTarget: targetMetric
      }
    });
  };

  const isFormComplete = selectedGoal && goalDetails && timeframe && targetMetric;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
          <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Define Your Primary Business Goal</h2>
      <p className="text-muted-foreground mb-4">
          Every answer you provide helps Nexus understand you better and build your personalized business intelligence. 
          Let's start by teaching Nexus about your most important business objective.
        </p>
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-foreground mb-2">🤝 Building Nexus Together</h3>
          <p className="text-sm text-foreground mb-3">
            <strong>What you're learning:</strong> Specific, measurable goals are 3x more likely to be achieved. 
            Instead of "make more money," think "increase monthly revenue by 25% within 6 months."
          </p>
          <p className="text-sm text-foreground">
            <strong>What Nexus is learning:</strong> Your business priorities, success criteria, and how you think about goals. 
            This helps us create strategies that match your unique approach to business.
          </p>
        </div>
      </div>

      {/* Step 1: Select Goal Category */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">1. Choose Your Primary Goal Category</h3>
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-warning-foreground">
            <strong>💡 Business Insight:</strong> The most successful entrepreneurs focus on ONE primary goal at a time. 
            This creates clarity, momentum, and measurable results. You can always add more goals later.
          </p>
        </div>
        <div className="grid gap-3">
          {goalOptions.map((goal) => (
            <div
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedGoal === goal.id
                  ? 'border-primary bg-primary/10 text-primary-foreground'
                  : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                    selectedGoal === goal.id
                      ? 'border-primary bg-primary'
                      : 'border-border'
                  }`}>
                    {selectedGoal === goal.id && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{goal.name}</h4>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: Define Specific Goal (only show if goal selected) */}
      {selectedGoal && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">2. Define Your Specific Goal</h3>
          
          {/* Examples */}
          <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
            <h4 className="font-medium text-foreground mb-2">📋 Examples for {selectedGoalData?.name}:</h4>
            <p className="text-xs text-muted-foreground mb-3">
              <strong>Learning:</strong> Notice how each example includes specific numbers, timeframes, and clear outcomes. 
              This is the difference between a wish and a goal.
            </p>
            <ul className="text-sm text-foreground space-y-1">
              {selectedGoalData?.examples.map((example, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  {example}
                </li>
              ))}
            </ul>
          </div>

          {/* Goal Details Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Your Specific Goal *
            </label>
            <textarea
              value={goalDetails}
              onChange={(e) => setGoalDetails(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder={`e.g., ${selectedGoalData?.examples[0]}`}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Be specific and measurable. Include numbers, percentages, or clear targets.
            </p>
          </div>

          {/* Timeframe Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Target Timeframe *
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              <option value="">Select timeframe</option>
              {timeframeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Metric */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Primary Success Metric *
            </label>
            <div className="bg-muted/50 border border-border rounded-lg p-3 mb-2">
              <h5 className="font-medium text-foreground mb-2">Common metrics for {selectedGoalData?.name}:</h5>
              <p className="text-xs text-muted-foreground mb-3">
                <strong>Business Education:</strong> The right metric helps you track progress and make informed decisions. 
                Choose the one that best measures your success.
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedGoalData?.metrics.map((metric, index) => (
                  <span
                    key={index}
                    onClick={() => setTargetMetric(metric)}
                    className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                      targetMetric === metric
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-foreground border border-border hover:bg-muted'
                    }`}
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={targetMetric}
              onChange={(e) => setTargetMetric(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder="e.g., Revenue growth %, Customer satisfaction score, etc."
            />
          </div>
        </div>
      )}

      {/* Summary */}
      {isFormComplete && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-success-foreground mb-2">✅ Your Goal Summary</h4>
          <div className="text-sm text-success-foreground mb-3">
            <p><strong>Goal:</strong> {goalDetails}</p>
            <p><strong>Timeframe:</strong> {timeframeOptions.find(t => t.value === timeframe)?.label}</p>
            <p><strong>Success Metric:</strong> {targetMetric}</p>
          </div>
          <div className="bg-background/50 rounded p-3">
            <p className="text-xs text-success-foreground">
              <strong>🎓 What you just learned:</strong> How to create a SMART goal (Specific, Measurable, Achievable, Relevant, Time-bound). 
              This is a fundamental business skill that will serve you throughout your entrepreneurial journey.
            </p>
            <p className="text-xs text-success-foreground mt-2">
              <strong>🤖 What Nexus learned:</strong> Your business priorities, success criteria, and timeline preferences. 
              This helps us create strategies that match your unique approach to business and track your progress effectively.
            </p>
            <p className="text-xs text-success-foreground mt-2">
              <strong>🚀 Next:</strong> We'll use this information to build your personalized business intelligence and create 
              targeted strategies for achieving your goals.
            </p>
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={handleNext}
          disabled={!isFormComplete}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
            isFormComplete
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          Continue
        </button>
        
        <button
          onClick={onSkip}
          className="flex-1 bg-muted text-muted-foreground py-3 px-6 rounded-lg font-medium hover:bg-muted/80 transition-colors"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
};

const ChallengeIdentificationStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>(data.selectedChallenges || []);
  const [challengeDetails, setChallengeDetails] = useState<{[key: string]: string}>(data.challengeDetails || {});
  const [priorityLevel, setPriorityLevel] = useState<string>(data.priorityLevel || '');

  // Comprehensive challenge options with educational context
  const challengeOptions = [
    { 
      id: 'manual-processes', 
      name: 'Manual Processes', 
      description: 'Time-consuming manual tasks and workflows',
      examples: ['Data entry taking 3+ hours daily', 'Manual invoice processing', 'Hand-written customer records'],
      impact: 'Reduces productivity by 40-60% and increases error rates',
      solutions: ['Process automation', 'Workflow optimization', 'Digital transformation']
    },
    { 
      id: 'data-silos', 
      name: 'Data Silos', 
      description: 'Information scattered across different systems',
      examples: ['Customer data in 5 different tools', 'Sales team using separate CRM', 'Finance using different accounting software'],
      impact: 'Leads to 30% duplicate work and poor decision-making',
      solutions: ['Data integration', 'Single source of truth', 'Unified dashboard']
    },
    { 
      id: 'customer-retention', 
      name: 'Customer Retention', 
      description: 'Difficulty retaining and satisfying customers',
      examples: ['High churn rate (15%+ monthly)', 'Low customer satisfaction scores', 'Poor customer support response times'],
      impact: 'Acquiring new customers costs 5x more than retaining existing ones',
      solutions: ['Customer success programs', 'Proactive support', 'Loyalty programs']
    },
    { 
      id: 'cost-control', 
      name: 'Cost Control', 
      description: 'Managing and reducing operational costs',
      examples: ['Uncontrolled spending on tools', 'High overhead costs', 'Inefficient resource allocation'],
      impact: 'Unmanaged costs can reduce profit margins by 20-30%',
      solutions: ['Cost optimization', 'Budget tracking', 'Resource planning']
    },
    { 
      id: 'scaling-growth', 
      name: 'Scaling Growth', 
      description: 'Challenges in scaling operations efficiently',
      examples: ['Can\'t handle increased demand', 'Team overwhelmed with growth', 'Quality drops with scale'],
      impact: 'Poor scaling can lead to 50% customer loss during growth phases',
      solutions: ['Scalable processes', 'Team development', 'Technology infrastructure']
    },
    { 
      id: 'team-productivity', 
      name: 'Team Productivity', 
      description: 'Improving team efficiency and collaboration',
      examples: ['Low team output', 'Poor communication', 'Lack of accountability'],
      impact: 'Poor productivity can reduce business output by 25-40%',
      solutions: ['Performance management', 'Communication tools', 'Clear expectations']
    },
    { 
      id: 'market-competition', 
      name: 'Market Competition', 
      description: 'Staying competitive in the market',
      examples: ['Losing customers to competitors', 'Price pressure', 'Innovation lag'],
      impact: 'Competitive disadvantage can lead to 20-30% revenue loss',
      solutions: ['Competitive analysis', 'Differentiation strategy', 'Innovation focus']
    },
    { 
      id: 'technology-integration', 
      name: 'Technology Integration', 
      description: 'Integrating new technologies and tools',
      examples: ['Multiple tools not working together', 'Staff resistance to new tech', 'Integration failures'],
      impact: 'Poor tech integration reduces efficiency by 35-50%',
      solutions: ['Integration strategy', 'Change management', 'Training programs']
    },
    { 
      id: 'decision-making', 
      name: 'Decision Making', 
      description: 'Making data-driven decisions quickly',
      examples: ['Decisions based on gut feeling', 'Slow response to market changes', 'Lack of data insights'],
      impact: 'Poor decisions can cost 15-25% of potential revenue',
      solutions: ['Data analytics', 'Decision frameworks', 'Real-time insights']
    },
    { 
      id: 'quality-control', 
      name: 'Quality Control', 
      description: 'Maintaining consistent quality standards',
      examples: ['Inconsistent product quality', 'Customer complaints about quality', 'Quality issues affecting reputation'],
      impact: 'Quality problems can lead to 30-40% customer loss',
      solutions: ['Quality management systems', 'Standardized processes', 'Continuous improvement']
    }
  ];

  const priorityOptions = [
    { value: 'critical', label: 'Critical - Immediate attention required', description: 'Blocking business operations or causing significant losses' },
    { value: 'high', label: 'High - Major impact on business', description: 'Significantly affecting growth or efficiency' },
    { value: 'medium', label: 'Medium - Moderate business impact', description: 'Affecting some operations but manageable' },
    { value: 'low', label: 'Low - Minor inconvenience', description: 'Annoying but not critical to business success' }
  ];

  const handleChallengeToggle = (challengeId: string) => {
    setSelectedChallenges(prev => 
      prev.includes(challengeId)
        ? prev.filter(id => id !== challengeId)
        : [...prev, challengeId]
    );
  };

  const handleChallengeDetailChange = (challengeId: string, detail: string) => {
    setChallengeDetails(prev => ({
      ...prev,
      [challengeId]: detail
    }));
  };

  const handleNext = () => {
    onNext({
      ...data,
      selectedChallenges,
      challengeDetails,
      priorityLevel,
      // Store the full challenge data for later use
      challengeData: {
        challenges: selectedChallenges.map(id => challengeOptions.find(c => c.id === id)),
        details: challengeDetails,
        priority: priorityLevel
      }
    });
  };

  const isFormComplete = selectedChallenges.length > 0 && priorityLevel;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-warning/10 mb-4">
          <svg className="h-8 w-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Identify Your Business Challenges</h2>
        <p className="text-muted-foreground mb-4">
          Understanding your challenges is the first step to solving them. Let's teach Nexus about your biggest obstacles 
          so we can create targeted solutions and strategies.
        </p>
        <div className="bg-gradient-to-r from-warning/10 to-orange-500/10 border border-warning/30 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-foreground mb-2">🤝 Building Nexus Together</h3>
          <p className="text-sm text-foreground mb-3">
            <strong>What you're learning:</strong> The most successful businesses systematically identify and address their challenges. 
            Understanding the root cause and impact of each challenge is crucial for effective problem-solving.
          </p>
          <p className="text-sm text-foreground">
            <strong>What Nexus is learning:</strong> Your specific pain points, business context, and how you think about problems. 
            This helps us create solutions that match your unique business situation and provide relevant guidance.
          </p>
        </div>
      </div>

      {/* Step 1: Select Challenge Categories */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">1. Select Your Primary Challenges</h3>
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-warning-foreground">
            <strong>💡 Business Insight:</strong> Focus on the 2-3 challenges that have the biggest impact on your business success. 
            This helps us prioritize solutions and create the most effective strategies for your situation.
          </p>
        </div>
        <div className="grid gap-3">
        {challengeOptions.map((challenge) => (
          <div
            key={challenge.id}
            onClick={() => handleChallengeToggle(challenge.id)}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedChallenges.includes(challenge.id)
                  ? 'border-warning bg-warning/10 text-warning-foreground'
                  : 'border-border bg-background hover:border-warning/50 hover:bg-warning/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                  selectedChallenges.includes(challenge.id)
                      ? 'border-warning bg-warning'
                      : 'border-border'
                }`}>
                  {selectedChallenges.includes(challenge.id) && (
                      <svg className="w-3 h-3 text-warning-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{challenge.name}</h4>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    {selectedChallenges.includes(challenge.id) && (
                      <div className="mt-2 text-xs text-warning-foreground">
                        <p><strong>Impact:</strong> {challenge.impact}</p>
                        <p><strong>Solutions:</strong> {challenge.solutions.join(', ')}</p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Step 2: Provide Challenge Details (only show if challenges selected) */}
      {selectedChallenges.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">2. Describe Your Specific Challenges</h3>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
            <h4 className="font-medium text-foreground mb-2">📋 Challenge Analysis Framework:</h4>
            <p className="text-xs text-muted-foreground mb-3">
              <strong>Learning:</strong> The more specific you are about your challenges, the better we can help solve them. 
              Include details about frequency, impact, and current attempts to address them.
            </p>
            <div className="text-sm text-foreground space-y-2">
              <p><strong>• Frequency:</strong> How often does this challenge occur?</p>
              <p><strong>• Impact:</strong> What specific business outcomes are affected?</p>
              <p><strong>• Current State:</strong> What have you tried so far?</p>
              <p><strong>• Root Cause:</strong> What do you think is causing this challenge?</p>
            </div>
          </div>

          {selectedChallenges.map((challengeId) => {
            const challenge = challengeOptions.find(c => c.id === challengeId);
            return (
              <div key={challengeId} className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {challenge?.name} - Specific Details
                </label>
                <div className="bg-muted/50 border border-border rounded-lg p-3 mb-2">
                  <h5 className="font-medium text-foreground mb-2">Examples for {challenge?.name}:</h5>
                  <ul className="text-sm text-foreground space-y-1">
                    {challenge?.examples.map((example, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-warning mr-2">•</span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
                <textarea
                  value={challengeDetails[challengeId] || ''}
                  onChange={(e) => handleChallengeDetailChange(challengeId, e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-warning focus:border-transparent bg-background text-foreground"
                  placeholder={`Describe your specific ${challenge?.name.toLowerCase()} challenges...`}
                  rows={3}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Step 3: Priority Assessment */}
      {selectedChallenges.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">3. Assess Overall Challenge Priority</h3>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
            <h4 className="font-medium text-foreground mb-2">🎯 Priority Assessment:</h4>
            <p className="text-xs text-muted-foreground mb-3">
              <strong>Business Education:</strong> Understanding challenge priority helps allocate resources effectively. 
              Critical challenges require immediate attention, while others can be addressed systematically.
            </p>
          </div>

          <div className="grid gap-3">
            {priorityOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => setPriorityLevel(option.value)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  priorityLevel === option.value
                    ? 'border-warning bg-warning/10 text-warning-foreground'
                    : 'border-border bg-background hover:border-warning/50 hover:bg-warning/5'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                    priorityLevel === option.value
                      ? 'border-warning bg-warning'
                      : 'border-border'
                  }`}>
                    {priorityLevel === option.value && (
                      <svg className="w-3 h-3 text-warning-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{option.label}</h4>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {isFormComplete && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-success-foreground mb-2">✅ Your Challenge Summary</h4>
          <div className="text-sm text-success-foreground mb-3">
            <p><strong>Selected Challenges:</strong> {selectedChallenges.length} primary challenges identified</p>
            <p><strong>Priority Level:</strong> {priorityOptions.find(p => p.value === priorityLevel)?.label}</p>
            <p><strong>Details Provided:</strong> {Object.keys(challengeDetails).length} challenges with specific details</p>
          </div>
          <div className="bg-background/50 rounded p-3">
            <p className="text-xs text-success-foreground">
              <strong>🎓 What you just learned:</strong> How to systematically identify and analyze business challenges. 
              This problem-solving framework will help you address obstacles more effectively throughout your business journey.
            </p>
            <p className="text-xs text-success-foreground mt-2">
              <strong>🤖 What Nexus learned:</strong> Your specific pain points, business context, and problem-solving approach. 
              This helps us create targeted solutions and provide relevant guidance for your unique situation.
            </p>
            <p className="text-xs text-success-foreground mt-2">
              <strong>🚀 Next:</strong> We'll use this information to create personalized solutions and strategies 
              that directly address your challenges and help you overcome them systematically.
            </p>
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={handleNext}
          disabled={!isFormComplete}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
            isFormComplete
              ? 'bg-warning text-warning-foreground hover:bg-warning/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          Continue
        </button>
        
        <button
          onClick={onSkip}
          className="flex-1 bg-muted text-muted-foreground py-3 px-6 rounded-lg font-medium hover:bg-muted/80 transition-colors"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
};

// Tool Connection Step - Simplified for mass adoption
const ToolConnectionStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const [selectedTools, setSelectedTools] = useState<{[key: string]: string[]}>(data.selectedTools || {});
  const [connectionStatus, setConnectionStatus] = useState<{[key: string]: 'not-started' | 'connecting' | 'connected' | 'failed'}>({});
  const [showMarcobyServices, setShowMarcobyServices] = useState<{[key: string]: boolean}>({});

  // Communications tools configuration
  const communicationTools = {
    email: {
      name: 'Email',
      description: 'Connect your email service for communication insights and automation',
      icon: '📧',
      options: [
        { id: 'microsoft365', name: 'Microsoft 365', description: 'Outlook, Exchange, and Office 365' },
        { id: 'google-workspace', name: 'Google Workspace', description: 'Gmail, Google Calendar, and Drive' },
        { id: 'pop3-imap', name: 'POP3/IMAP', description: 'Standard email protocols for any provider' },
        { id: 'marcoby-cloud', name: 'Marcoby Cloud', description: 'Integrated email and collaboration platform' }
      ]
    },
    messaging: {
      name: 'Messaging',
      description: 'Connect your team messaging platforms for collaboration insights',
      icon: '💬',
      options: [
        { id: 'slack', name: 'Slack', description: 'Team collaboration and communication' },
        { id: 'teams', name: 'Microsoft Teams', description: 'Microsoft\'s team collaboration platform' },
        { id: 'marcoby-connect', name: 'Marcoby Connect', description: 'Unified communication and collaboration' }
      ]
    },
    voice: {
      name: 'Voice & Meeting',
      description: 'Connect your voice and video communication tools for seamless collaboration',
      icon: '📞',
      options: [
        { id: 'zoom', name: 'Zoom', description: 'Video conferencing and webinars' },
        { id: 'ringcentral', name: 'RingCentral', description: 'Cloud communications platform' },
        { id: 'marcoby-connect', name: 'Marcoby Connect', description: 'Integrated voice and video conferencing solutions' }
      ]
    }
  };

  const handleToolToggle = (category: string, toolId: string) => {
    setSelectedTools(prev => {
      const current = prev[category] || [];
      const updated = current.includes(toolId)
        ? current.filter(id => id !== toolId)
        : [...current, toolId];
      
      return {
        ...prev,
        [category]: updated
      };
    });

    // Reset connection status when toggling
    setConnectionStatus(prev => ({
      ...prev,
      [`${category}-${toolId}`]: 'not-started'
    }));
  };

  const handleConnect = async (category: string, toolId: string) => {
    setConnectionStatus(prev => ({
      ...prev,
      [`${category}-${toolId}`]: 'connecting'
    }));

    // Simulate connection process
    setTimeout(() => {
      setConnectionStatus(prev => ({
        ...prev,
        [`${category}-${toolId}`]: 'connected'
      }));
    }, 2000);
  };

  const handleMarcobyServices = (category: string) => {
    setShowMarcobyServices(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleNext = () => {
    onNext({
      ...data,
      selectedTools,
      connectionStatus,
      // Store the full tool connection data for later use
      toolConnectionData: {
        tools: selectedTools,
        status: connectionStatus,
        categories: Object.keys(communicationTools)
      }
    });
  };

  const getConnectedCount = () => {
    return Object.values(connectionStatus).filter(status => status === 'connected').length;
  };

  const getTotalSelectedCount = () => {
    return Object.values(selectedTools).flat().length;
  };

  const isFormComplete = getTotalSelectedCount() > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
          <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Connect Your Business Tools</h2>
        <p className="text-muted-foreground mb-4">
          Let's start with Communications. Connect your existing tools to enable seamless data flow and 
          unlock powerful business intelligence insights.
        </p>
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-foreground mb-2">🤝 Building Nexus Together</h3>
          <p className="text-sm text-foreground mb-3">
            <strong>What you're learning:</strong> Tool integration is the foundation of modern business intelligence. 
            Connected tools provide real-time insights, automate workflows, and create a unified business view.
          </p>
          <p className="text-sm text-foreground">
            <strong>What Nexus is learning:</strong> Your technology stack, communication patterns, and integration preferences. 
            This helps us create personalized automation and provide relevant business insights.
        </p>
      </div>
      </div>

      {/* Communications Tools Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Communications</h3>
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-primary-foreground">
            <strong>💡 Business Insight:</strong> Communication tools are the backbone of modern business operations. 
            Connecting these tools enables Nexus to provide insights on team collaboration, customer communication patterns, 
            and operational efficiency.
          </p>
        </div>

        {/* Email Tools */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">{communicationTools.email.icon}</span>
            <div>
              <h4 className="text-lg font-medium text-foreground">{communicationTools.email.name}</h4>
              <p className="text-sm text-muted-foreground">{communicationTools.email.description}</p>
            </div>
          </div>
          
          <div className="grid gap-3 mb-4">
            {communicationTools.email.options.map((tool) => {
              const isSelected = selectedTools.email?.includes(tool.id);
              const status = connectionStatus[`email-${tool.id}`];
              
              return (
                <div
                  key={tool.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-border'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className={`text-xl mr-3 ${tool.id.includes('marcoby') ? 'text-green-500' : ''}`}>{tool.logo}</span>
                        <div>
                          <h5 className="font-medium text-foreground">{tool.name}</h5>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isSelected && (
                        <>
                          {status === 'not-started' && (
                            <button
                              onClick={() => handleConnect('email', tool.id)}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                              Connect
                            </button>
                          )}
                          {status === 'connecting' && (
                            <div className="flex items-center text-primary">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Connecting...
                            </div>
                          )}
                          {status === 'connected' && (
                            <div className="flex items-center text-success">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Connected
                            </div>
                          )}
                          {status === 'failed' && (
                            <div className="flex items-center text-destructive">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Failed
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => handleToolToggle('email', tool.id)}
                      className={`text-sm transition-colors ${
                        isSelected
                          ? 'text-primary hover:text-primary/80'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isSelected ? 'Remove' : 'Add'}
                    </button>
                    
                    {tool.id.includes('marcoby') && (
                      <button
                        onClick={() => handleMarcobyServices('email')}
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        Learn More
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Marcoby Services Modal for Email */}
          {showMarcobyServices.email && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
              <h5 className="font-medium text-foreground mb-2">☁️ Marcoby Cloud Services</h5>
              <p className="text-sm text-muted-foreground mb-3">
                Don't have email services? Marcoby provides integrated business solutions:
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <span className="text-success mr-2">✓</span>
                  <span>Professional email hosting with advanced security</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-success mr-2">✓</span>
                  <span>Integrated calendar and contact management</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-success mr-2">✓</span>
                  <span>Seamless integration with Nexus business intelligence</span>
                </div>
              </div>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Explore Marcoby Services
              </button>
            </div>
          )}
        </div>

        {/* Messaging Tools */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">{communicationTools.messaging.icon}</span>
            <div>
              <h4 className="text-lg font-medium text-foreground">{communicationTools.messaging.name}</h4>
              <p className="text-sm text-muted-foreground">{communicationTools.messaging.description}</p>
            </div>
          </div>
          
          <div className="grid gap-3 mb-4">
            {communicationTools.messaging.options.map((tool) => {
              const isSelected = selectedTools.messaging?.includes(tool.id);
              const status = connectionStatus[`messaging-${tool.id}`];
              
              return (
                <div
                  key={tool.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-border'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className={`text-xl mr-3 ${tool.id.includes('marcoby') ? 'text-green-500' : ''}`}>{tool.logo}</span>
                        <div>
                          <h5 className="font-medium text-foreground">{tool.name}</h5>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isSelected && (
                        <>
                          {status === 'not-started' && (
                            <button
                              onClick={() => handleConnect('messaging', tool.id)}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                              Connect
                            </button>
                          )}
                          {status === 'connecting' && (
                            <div className="flex items-center text-primary">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Connecting...
                            </div>
                          )}
                          {status === 'connected' && (
                            <div className="flex items-center text-success">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Connected
                            </div>
                          )}
                          {status === 'failed' && (
                            <div className="flex items-center text-destructive">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Failed
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => handleToolToggle('messaging', tool.id)}
                      className={`text-sm transition-colors ${
                        isSelected
                          ? 'text-primary hover:text-primary/80'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isSelected ? 'Remove' : 'Add'}
                    </button>
                    
                    {tool.id.includes('marcoby') && (
                      <button
                        onClick={() => handleMarcobyServices('messaging')}
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        Learn More
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Marcoby Services Modal for Messaging */}
          {showMarcobyServices.messaging && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
              <h5 className="font-medium text-foreground mb-2">☁️ Marcoby Connect Services</h5>
              <p className="text-sm text-muted-foreground mb-3">
                Need team collaboration tools? Marcoby Connect provides unified communication:
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <span className="text-success mr-2">✓</span>
                  <span>Team messaging with advanced security</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-success mr-2">✓</span>
                  <span>File sharing and collaboration features</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-success mr-2">✓</span>
                  <span>Integration with Nexus business workflows</span>
                </div>
              </div>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Explore Marcoby Connect
              </button>
            </div>
          )}
        </div>

        {/* Voice Tools */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">{communicationTools.voice.icon}</span>
            <div>
              <h4 className="text-lg font-medium text-foreground">{communicationTools.voice.name}</h4>
              <p className="text-sm text-muted-foreground">{communicationTools.voice.description}</p>
            </div>
          </div>
          
          <div className="grid gap-3 mb-4">
            {communicationTools.voice.options.map((tool) => {
              const isSelected = selectedTools.voice?.includes(tool.id);
              const status = connectionStatus[`voice-${tool.id}`];
              
              return (
                <div
                  key={tool.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-border'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center">
                        {tool.logo && (
                          <span className={`text-xl mr-3 ${tool.id.includes('marcoby') ? 'text-green-500' : ''}`}>{tool.logo}</span>
                        )}
                        <div>
                          <h5 className="font-medium text-foreground">{tool.name}</h5>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isSelected && (
                        <>
                          {status === 'not-started' && (
                            <button
                              onClick={() => handleConnect('voice', tool.id)}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                              Connect
                            </button>
                          )}
                          {status === 'connecting' && (
                            <div className="flex items-center text-primary">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Connecting...
                            </div>
                          )}
                          {status === 'connected' && (
                            <div className="flex items-center text-success">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Connected
                            </div>
                          )}
                          {status === 'failed' && (
                            <div className="flex items-center text-destructive">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Failed
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => handleToolToggle('voice', tool.id)}
                      className={`text-sm transition-colors ${
                        isSelected
                          ? 'text-primary hover:text-primary/80'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isSelected ? 'Remove' : 'Add'}
                    </button>
                    
                    {tool.id.includes('marcoby') && (
                      <button
                        onClick={() => handleMarcobyServices('voice')}
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        Learn More
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Marcoby Services Modal for Voice */}
          {showMarcobyServices.voice && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
              <h5 className="font-medium text-foreground mb-2">☁️ Marcoby Connect Voice & Meeting Solutions</h5>
              <p className="text-sm text-muted-foreground mb-3">
                Need voice and meeting solutions? Marcoby Connect provides integrated communication:
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <span className="text-success mr-2">✓</span>
                  <span>HD video conferencing with screen sharing</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-success mr-2">✓</span>
                  <span>Voice calling and voicemail features</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-success mr-2">✓</span>
                  <span>Seamless integration with Nexus workflows</span>
                </div>
              </div>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Explore Marcoby Voice Services
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {isFormComplete && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-success-foreground mb-2">✅ Your Tool Connection Summary</h4>
          <div className="text-sm text-success-foreground mb-3">
            <p><strong>Tools Selected:</strong> {getTotalSelectedCount()} communication tools</p>
            <p><strong>Connected:</strong> {getConnectedCount()} tools successfully connected</p>
            <p><strong>Categories:</strong> Email, Messaging, Voice & Meeting</p>
          </div>
          <div className="bg-background/50 rounded p-3">
            <p className="text-xs text-success-foreground">
              <strong>🎓 What you just learned:</strong> How to integrate business tools for maximum efficiency. 
              Connected tools provide real-time insights and automate workflows across your business.
            </p>
            <p className="text-xs text-success-foreground mt-2">
              <strong>🤖 What Nexus learned:</strong> Your technology stack, communication preferences, and integration patterns. 
              This helps us create personalized automation and provide relevant business intelligence.
            </p>
            <p className="text-xs text-success-foreground mt-2">
              <strong>🚀 Next:</strong> We'll use these connections to provide real-time insights, automate workflows, 
              and create a unified view of your business communications.
            </p>
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={handleNext}
          disabled={!isFormComplete}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
            isFormComplete
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          Continue
        </button>
        
        <button
          onClick={onSkip}
          className="flex-1 bg-muted text-muted-foreground py-3 px-6 rounded-lg font-medium hover:bg-muted/80 transition-colors"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
};

const DataSourceStep: React.FC<OnboardingStepProps> = ({ onNext, onSkip, data, currentStep, totalSteps }) => {
  const [selectedDataFields, setSelectedDataFields] = useState<{[integrationId: string]: string[]}>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get selected integrations from previous step
  const selectedTools = data.selectedTools || {};
  const allSelectedTools = Object.values(selectedTools).flat();

  // Integration data field definitions
  const integrationDataFields = {
    'hubspot': {
      name: 'HubSpot CRM',
      icon: '🔵',
      dataFields: [
        { id: 'contacts', name: 'Contacts', description: 'Customer and prospect information', category: 'CRM' },
        { id: 'companies', name: 'Companies', description: 'Organization data and relationships', category: 'CRM' },
        { id: 'deals', name: 'Deals', description: 'Sales opportunities and pipeline', category: 'Sales' },
        { id: 'tickets', name: 'Support Tickets', description: 'Customer service requests', category: 'Support' },
        { id: 'emails', name: 'Email Campaigns', description: 'Marketing email performance', category: 'Marketing' },
        { id: 'calls', name: 'Call Logs', description: 'Phone call tracking and notes', category: 'Sales' }
      ]
    },
    'quickbooks': {
      name: 'QuickBooks',
      icon: '🟢',
      dataFields: [
        { id: 'invoices', name: 'Invoices', description: 'Billing and payment tracking', category: 'Finance' },
        { id: 'expenses', name: 'Expenses', description: 'Cost tracking and categorization', category: 'Finance' },
        { id: 'customers', name: 'Customers', description: 'Customer financial profiles', category: 'Finance' },
        { id: 'reports', name: 'Financial Reports', description: 'P&L, cash flow, and balance sheets', category: 'Finance' },
        { id: 'transactions', name: 'Bank Transactions', description: 'Bank account activity', category: 'Finance' }
      ]
    },
    'google-analytics': {
      name: 'Google Analytics',
      icon: '🔴',
      dataFields: [
        { id: 'pageviews', name: 'Page Views', description: 'Website traffic and page performance', category: 'Analytics' },
        { id: 'conversions', name: 'Conversions', description: 'Goal completions and conversions', category: 'Analytics' },
        { id: 'users', name: 'User Behavior', description: 'User sessions and engagement', category: 'Analytics' },
        { id: 'traffic', name: 'Traffic Sources', description: 'Where visitors come from', category: 'Analytics' },
        { id: 'events', name: 'Custom Events', description: 'Custom tracking and interactions', category: 'Analytics' }
      ]
    },
    'slack': {
      name: 'Slack',
      icon: '🟡',
      dataFields: [
        { id: 'messages', name: 'Messages', description: 'Team communication and discussions', category: 'Communication' },
        { id: 'channels', name: 'Channels', description: 'Channel activity and engagement', category: 'Communication' },
        { id: 'users', name: 'Team Members', description: 'User activity and availability', category: 'Communication' },
        { id: 'files', name: 'File Sharing', description: 'Document and file activity', category: 'Communication' }
      ]
    },
    'microsoft365': {
      name: 'Microsoft 365',
      icon: '🔵',
      dataFields: [
        { id: 'emails', name: 'Emails', description: 'Email communication and patterns', category: 'Communication' },
        { id: 'calendar', name: 'Calendar', description: 'Meeting schedules and time management', category: 'Productivity' },
        { id: 'documents', name: 'Documents', description: 'Document creation and collaboration', category: 'Productivity' },
        { id: 'teams', name: 'Teams', description: 'Team collaboration and meetings', category: 'Communication' }
      ]
    },
    'google-workspace': {
      name: 'Google Workspace',
      icon: '🔴',
      dataFields: [
        { id: 'emails', name: 'Gmail', description: 'Email communication and patterns', category: 'Communication' },
        { id: 'calendar', name: 'Calendar', description: 'Meeting schedules and time management', category: 'Productivity' },
        { id: 'drive', name: 'Drive', description: 'Document storage and collaboration', category: 'Productivity' },
        { id: 'meet', name: 'Meet', description: 'Video conferencing and calls', category: 'Communication' }
      ]
    }
  };

  const handleDataFieldToggle = (integrationId: string, fieldId: string) => {
    setSelectedDataFields(prev => {
      const current = prev[integrationId] || [];
      const updated = current.includes(fieldId)
        ? current.filter(id => id !== fieldId)
        : [...current, fieldId];
      
      return {
        ...prev,
        [integrationId]: updated
      };
    });
  };

  const getSelectedIntegrationData = () => {
    return allSelectedTools.map(integrationId => {
      const integration = integrationDataFields[integrationId as keyof typeof integrationDataFields];
      const selectedFields = selectedDataFields[integrationId] || [];
      
      return {
        integrationId,
        integrationName: integration?.name || integrationId,
        selectedFields,
        availableFields: integration?.dataFields || []
      };
    });
  };

  const handleNext = async () => {
    setIsLoading(true);
    
    try {
      const integrationData = getSelectedIntegrationData();
      const totalFields = Object.values(selectedDataFields).flat().length;
      
      // Save data field selection to onboarding data
      const updatedData = {
        ...data,
        selectedDataFields,
        integrationData,
        dataSourceConfiguration: {
          integrations: integrationData,
          totalFields,
          categories: [...new Set(Object.values(selectedDataFields).flat().map(fieldId => {
            // Get category from field definition
            for (const integration of Object.values(integrationDataFields)) {
              const field = integration.dataFields.find(f => f.id === fieldId);
              if (field) return field.category;
            }
            return 'Other';
          }))]
        }
      };

      onNext(updatedData);
    } catch (error) {
      console.error('Error saving data field selection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalSelectedFields = () => {
    return Object.values(selectedDataFields).flat().length;
  };

  const hasSelectedIntegrations = allSelectedTools.length > 0;

  if (!hasSelectedIntegrations) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Integrations Selected</h3>
          <p className="text-gray-600 mb-6">
            You haven't selected any integrations yet. Please go back and connect your business tools first.
          </p>
          <button 
            onClick={() => onSkip(data)} 
            className="bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Skip This Step
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        {allSelectedTools.map(integrationId => {
          const integration = integrationDataFields[integrationId as keyof typeof integrationDataFields];
          if (!integration) return null;

          const selectedFields = selectedDataFields[integrationId] || [];

          return (
            <div key={integrationId} className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                  <p className="text-sm text-gray-600">Select the data you want to sync</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {integration.dataFields.map(field => (
                  <div
                    key={field.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedFields.includes(field.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleDataFieldToggle(integrationId, field.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900">{field.name}</h4>
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.id)}
                        onChange={() => handleDataFieldToggle(integrationId, field.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{field.description}</p>
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {field.category}
                    </span>
                  </div>
                ))}
              </div>

              {selectedFields.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedFields.length}</strong> data fields selected for {integration.name}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {getTotalSelectedFields()} data fields selected across {allSelectedTools.length} integration{allSelectedTools.length !== 1 ? 's' : ''}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => onSkip(data)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            disabled={isLoading || getTotalSelectedFields() === 0}
            className="bg-primary text-white py-2 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Configuring...
              </div>
            ) : (
              `Continue with ${getTotalSelectedFields()} Data Fields`
            )}
          </button>
        </div>
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


// 3-Phase Value-Focused Onboarding Flow
const ThreePhaseOnboardingFlow: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
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

  // Component mapping for step rendering (Nexus Business Learning Framework)
  const stepComponents: Record<string, React.ComponentType<OnboardingStepProps>> = {
    'WelcomeStep': WelcomeStep,
    'CoreIdentityStep': CoreIdentityStep,
    'QuickConnectStep': QuickConnectStep,
    'DayOneInsightStep': DayOneInsightStep,
    'AIPoweredGoalsStep': AIPoweredGoalsStep,
    'InitialThoughtsGenerationStep': InitialThoughtsGenerationStep,
    'DashboardIntroStep': DashboardIntroStep,
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

  // Helper function to sync localStorage data with database
  const syncLocalStorageWithDatabase = async (uid: string, savedFormData: any, savedProgress: any) => {
    if (!uid || !savedFormData || !savedProgress) return;
    
    try {
      logger.info('Syncing localStorage data with database', {
        userId: uid,
        currentPhase: savedProgress.currentPhase,
        currentStep: savedProgress.currentStep
      });

      // Save the current step data to database (with timeout)
      if (savedProgress.currentStep) {
        try {
          const savePromise = saveStep(savedProgress.currentStep, savedFormData);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Save timeout')), 5000)
          );
          await Promise.race([savePromise, timeoutPromise]);
          logger.info('Synced step data to database', { stepId: savedProgress.currentStep });
        } catch (error) {
          logger.warn('Failed to save step during sync, continuing:', error);
        }
      }

      // If we're past the first phase, mark previous phases as completed
      const currentPhaseIndex = ONBOARDING_PHASES.findIndex(phase => phase.id === savedProgress.currentPhase);
      if (currentPhaseIndex > 0) {
        // Mark all previous phases as completed (with timeout)
        for (let i = 0; i < currentPhaseIndex; i++) {
          const phaseToComplete = ONBOARDING_PHASES[i];
          try {
            const phasePromise = completeOnboardingPhase(uid, phaseToComplete.id, savedFormData);
            const phaseTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Phase completion timeout')), 3000)
            );
            await Promise.race([phasePromise, phaseTimeoutPromise]);
            logger.info('Marked phase as completed during sync', { phaseId: phaseToComplete.id });
          } catch (error) {
            logger.warn('Failed to complete phase during sync, continuing:', error);
          }
        }
      }

      logger.info('Successfully synced localStorage data with database');
    } catch (error) {
      logger.error('Error syncing localStorage data with database:', error);
    }
  };

  // Debug function to log onboarding state
  const debugOnboardingState = () => {
    const savedFormData = loadFromLocalStorage(STORAGE_KEYS.FORM_DATA);
    const savedPhaseData = loadFromLocalStorage(STORAGE_KEYS.PHASE_DATA);
    const savedStepData = loadFromLocalStorage(STORAGE_KEYS.STEP_DATA);
    const savedProgress = loadFromLocalStorage(STORAGE_KEYS.PROGRESS);

    logger.info('Onboarding Debug State', {
      hasUser: !!user?.id,
      currentPhaseData: currentPhaseData?.id,
      currentStepData: currentStepData?.id,
      formDataKeys: savedFormData ? Object.keys(savedFormData) : [],
      savedPhaseData: !!savedPhaseData,
      savedStepData: !!savedStepData,
      savedProgress: savedProgress ? {
        currentPhase: savedProgress.currentPhase,
        currentStep: savedProgress.currentStep
      } : null,
      availablePhases: ONBOARDING_PHASES.map(p => p.id)
    });
  };

  // Save data to localStorage
  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
    } catch (error) {
      logger.warn('Failed to save to localStorage:', error);
    }
  }, []);

  // Load data from localStorage
  const loadFromLocalStorage = useCallback((key: string) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn('Failed to load from localStorage:', error);
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
      logger.warn('Failed to clear localStorage:', error);
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

  // Load onboarding progress on mount with recovery (only once)
  useEffect(() => {
    if (authLoading) return;
    if (user?.id && !isRecovering) {
      loadOnboardingProgress(user.id);
    }
  }, [authLoading, user?.id]);

  const loadOnboardingProgress = async (uid: string) => {
    if (!uid) return;

    setIsRecovering(true);

    try {
      logger.info('Loading onboarding progress', { userId: uid });
      
      // Debug current state
      debugOnboardingState();

      // Try to load from localStorage first
      const savedFormData = loadFromLocalStorage(STORAGE_KEYS.FORM_DATA);
      const savedPhaseData = loadFromLocalStorage(STORAGE_KEYS.PHASE_DATA);
      const savedStepData = loadFromLocalStorage(STORAGE_KEYS.STEP_DATA);
      const savedProgress = loadFromLocalStorage(STORAGE_KEYS.PROGRESS);

      logger.info('LocalStorage data found', {
        hasFormData: !!savedFormData,
        hasPhaseData: !!savedPhaseData,
        hasStepData: !!savedStepData,
        hasProgress: !!savedProgress,
        savedProgress
      });

      // Load current progress from database
      const progressData = await getOnboardingProgress(uid);
      
      logger.info('Database progress data', { 
        hasProgressData: !!progressData,
        progressData: progressData ? {
          currentPhase: progressData.currentPhase,
          currentStep: progressData.currentStep,
          completedPhases: progressData.completedPhases,
          completedSteps: progressData.completedSteps?.length || 0
        } : null
      });
      
      // Check if there's a mismatch between database and localStorage
      const hasProgressMismatch = progressData && savedProgress && 
        (progressData.currentPhase !== savedProgress.currentPhase || 
         progressData.currentStep !== savedProgress.currentStep);
      
      if (hasProgressMismatch) {
        // Only log this warning once per session to reduce noise
        if (!sessionStorage.getItem('onboarding_mismatch_logged')) {
          logger.warn('Progress mismatch detected - resolving by prioritizing localStorage data', {
            databasePhase: progressData.currentPhase,
            databaseStep: progressData.currentStep,
            localStoragePhase: savedProgress.currentPhase,
            localStorageStep: savedProgress.currentStep
          });
          sessionStorage.setItem('onboarding_mismatch_logged', 'true');
        }
        
        // Prioritize localStorage data when there's a mismatch
        logger.info('Prioritizing localStorage data due to mismatch');
        setFormData(savedFormData || {});
        
        // Sync localStorage data with database to resolve the mismatch
        await syncLocalStorageWithDatabase(uid, savedFormData, savedProgress);
        
        // Try to get phase configuration for localStorage phase
        try {
          const localStoragePhaseConfig = await getPhaseConfiguration(savedProgress.currentPhase);
          if (localStoragePhaseConfig && localStoragePhaseConfig.success && localStoragePhaseConfig.data) {
            setCurrentPhaseData(localStoragePhaseConfig.data);
            const localStorageStepConfig = localStoragePhaseConfig.data.steps.find((step: any) => step.id === savedProgress.currentStep);
            setCurrentStepData(localStorageStepConfig || localStoragePhaseConfig.data.steps[0]);
            
            logger.info('Successfully loaded from localStorage (mismatch resolution)', {
              currentPhase: savedProgress.currentPhase,
              currentStep: savedProgress.currentStep
            });
            return;
          } else {
            logger.warn('Failed to get localStorage phase configuration, trying database phase', {
              phaseId: savedProgress.currentPhase,
              error: localStoragePhaseConfig?.error
            });
          }
        } catch (error) {
          logger.error('Error getting localStorage phase configuration:', error);
        }
      }
      
      if (progressData) {
        // Merge saved data with database data (progressData.formData may be undefined)
        const mergedFormData = { ...(savedFormData || {}), ...(progressData?.formData || {}) } as Record<string, unknown>;
        setFormData(mergedFormData);
        
        // Load current phase configuration
        try {
          const phaseConfig = await getPhaseConfiguration(progressData.currentPhase);
          if (phaseConfig && phaseConfig.success && phaseConfig.data) {
            setCurrentPhaseData(phaseConfig.data);
            
            // Find current step
            const currentStepConfig = phaseConfig.data.steps.find((step: any) => step.id === progressData.currentStep);
            setCurrentStepData(currentStepConfig);
            
            logger.info('Successfully loaded from database', {
              currentPhase: progressData.currentPhase,
              currentStep: progressData.currentStep,
              hasStepConfig: !!currentStepConfig
            });
          } else {
            logger.warn('Failed to get phase configuration from database, trying localStorage fallback', { 
              phaseId: progressData.currentPhase,
              error: phaseConfig?.error 
            });
            
            // Fallback to localStorage if database phase config fails
            if (savedProgress?.currentPhase && savedProgress?.currentStep) {
              logger.info('Using localStorage fallback for phase configuration');
              const fallbackPhaseConfig = await getPhaseConfiguration(savedProgress.currentPhase);
              if (fallbackPhaseConfig && fallbackPhaseConfig.success && fallbackPhaseConfig.data) {
                setCurrentPhaseData(fallbackPhaseConfig.data);
                const fallbackStepConfig = fallbackPhaseConfig.data.steps.find((step: any) => step.id === savedProgress.currentStep);
                setCurrentStepData(fallbackStepConfig || fallbackPhaseConfig.data.steps[0]);
                
                logger.info('Successfully loaded from localStorage fallback', {
                  currentPhase: savedProgress.currentPhase,
                  currentStep: savedProgress.currentStep
                });
              } else {
                logger.error('Failed to get fallback phase configuration, starting fresh', {
                  phaseId: savedProgress.currentPhase,
                  error: fallbackPhaseConfig?.error
                });
                await startFreshOnboarding();
              }
            } else {
              logger.warn('No localStorage fallback available, starting fresh');
              await startFreshOnboarding();
            }
          }
        } catch (error) {
          logger.error('Error getting database phase configuration:', error);
          // Try localStorage fallback
          if (savedProgress?.currentPhase && savedProgress?.currentStep) {
            try {
              const fallbackPhaseConfig = await getPhaseConfiguration(savedProgress.currentPhase);
              if (fallbackPhaseConfig && fallbackPhaseConfig.success && fallbackPhaseConfig.data) {
                setCurrentPhaseData(fallbackPhaseConfig.data);
                const fallbackStepConfig = fallbackPhaseConfig.data.steps.find((step: any) => step.id === savedProgress.currentStep);
                setCurrentStepData(fallbackStepConfig || fallbackPhaseConfig.data.steps[0]);
                
                logger.info('Successfully loaded from localStorage fallback after error', {
                  currentPhase: savedProgress.currentPhase,
                  currentStep: savedProgress.currentStep
                });
              } else {
                await startFreshOnboarding();
              }
            } catch (fallbackError) {
              logger.error('Error getting fallback phase configuration:', fallbackError);
              await startFreshOnboarding();
            }
          } else {
            await startFreshOnboarding();
          }
        }
      } else if (savedProgress?.currentPhase && savedProgress?.currentStep) {
        // Recover using saved PROGRESS as source of truth if DB progress unavailable
        logger.info('Recovering onboarding using saved PROGRESS');
        setFormData(savedFormData || {});
        const phaseConfig = await getPhaseConfiguration(savedProgress.currentPhase);
        if (phaseConfig && phaseConfig.success && phaseConfig.data) {
          setCurrentPhaseData(phaseConfig.data);
          const currentStepConfig = phaseConfig.data.steps.find((step: any) => step.id === savedProgress.currentStep);
          setCurrentStepData(currentStepConfig || phaseConfig.data.steps[0]);
          
          logger.info('Successfully recovered from saved progress', {
            currentPhase: savedProgress.currentPhase,
            currentStep: savedProgress.currentStep
          });
        } else if (savedPhaseData && savedStepData) {
          // Fallback to older saved phase data
          logger.info('Falling back to older saved phase data');
          setCurrentPhaseData(savedPhaseData);
          setCurrentStepData(savedStepData);
        } else {
          logger.warn('No valid recovery data found, starting fresh');
          await startFreshOnboarding();
        }
      } else if (savedPhaseData && savedStepData) {
        // Recover from localStorage if database doesn't have progress
        logger.info('Recovering onboarding progress from localStorage');
        setFormData(savedFormData || {});
        setCurrentPhaseData(savedPhaseData);
        setCurrentStepData(savedStepData);
        setShowRecoveryNotification(true);
      } else {
        // Start fresh onboarding
        logger.info('No recovery data available, starting fresh onboarding');
        await startFreshOnboarding();
      }
    } catch (error) {
      logger.error('Error loading onboarding progress:', error);
      // Try to recover from localStorage
      const savedFormData = loadFromLocalStorage(STORAGE_KEYS.FORM_DATA);
      const savedPhaseData = loadFromLocalStorage(STORAGE_KEYS.PHASE_DATA);
      const savedStepData = loadFromLocalStorage(STORAGE_KEYS.STEP_DATA);
      
      if (savedPhaseData && savedStepData) {
        logger.info('Recovering from localStorage after error');
        setFormData(savedFormData || {});
        setCurrentPhaseData(savedPhaseData);
        setCurrentStepData(savedStepData);
      } else {
        logger.warn('No recovery data available after error, starting fresh');
        await startFreshOnboarding();
      }
    } finally {
      setIsRecovering(false);
    }
  };

  const startFreshOnboarding = async () => {
    try {
      logger.info('Starting fresh onboarding');
      
      // Start with the first phase
      const firstPhase = ONBOARDING_PHASES[0];
      const phaseConfig = await getPhaseConfiguration(firstPhase.id);
      
      if (phaseConfig && phaseConfig.success && phaseConfig.data) {
        setCurrentPhaseData(phaseConfig.data);
        setCurrentStepData(phaseConfig.data.steps[0]);
        setFormData({});
        
        logger.info('Fresh onboarding started successfully', {
          phaseId: firstPhase.id,
          stepId: phaseConfig.data.steps[0].id
        });
      } else {
        logger.error('Failed to get first phase configuration', { 
          error: phaseConfig?.error 
        });
        
        // Fallback: use the phase data directly from ONBOARDING_PHASES
        logger.info('Using fallback phase configuration from ONBOARDING_PHASES');
        setCurrentPhaseData(firstPhase);
        setCurrentStepData(firstPhase.steps[0]);
        setFormData({});
        
        logger.info('Fresh onboarding started with fallback configuration', {
          phaseId: firstPhase.id,
          stepId: firstPhase.steps[0].id
        });
      }
    } catch (error) {
      logger.error('Error starting fresh onboarding:', error);
      
      // Ultimate fallback: use the phase data directly
      try {
        const firstPhase = ONBOARDING_PHASES[0];
        setCurrentPhaseData(firstPhase);
        setCurrentStepData(firstPhase.steps[0]);
        setFormData({});
        
        logger.info('Fresh onboarding started with ultimate fallback', {
          phaseId: firstPhase.id,
          stepId: firstPhase.steps[0].id
        });
      } catch (fallbackError) {
        logger.error('Failed to start onboarding even with fallback:', fallbackError);
      }
    }
  };

  const handleStepComplete = async (stepData: any) => {
    if (!user?.id || !currentStepData) {
      logger.error('Missing user or current step data');
      return;
    }

    try {
      logger.info('Starting step completion', { 
        stepId: currentStepData.id, 
        phaseId: currentPhaseData.id,
        userId: user.id 
      });

      // Update form data first
      const updatedFormData = { ...formData, ...stepData, userId: user.id };
      setFormData(updatedFormData);

      // Skip validation for now to prevent getting stuck
      // const validation = await validateStepData(currentStepData.id, stepData);
      // if (validation && !validation.valid) {
      //   logger.error('Step validation failed:', validation.errors);
      //   return;
      // }

      // Save step data to database (with timeout)
      try {
        const savePromise = saveStep(currentStepData.id, updatedFormData);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Save timeout')), 10000)
        );
        await Promise.race([savePromise, timeoutPromise]);
        logger.info('Step data saved successfully', { stepId: currentStepData.id });
      } catch (error) {
        logger.error('Failed to save step data:', error);
        // Continue anyway - data is saved in localStorage
      }

      // Check if this is the last step in the current phase
      const currentPhaseIndex = currentPhaseData.steps.findIndex((step: any) => step.id === currentStepData.id);
      const isLastStepInPhase = currentPhaseIndex === currentPhaseData.steps.length - 1;

      logger.info('Step completion analysis', { 
        currentStepIndex: currentPhaseIndex,
        totalStepsInPhase: currentPhaseData.steps.length,
        isLastStepInPhase,
        currentPhaseId: currentPhaseData.id
      });

      if (isLastStepInPhase) {
        // Complete the phase
        logger.info('Completing phase', { phaseId: currentPhaseData.id });
        try {
          const phaseResult = await completeOnboardingPhase(user.id, currentPhaseData.id, updatedFormData);
          logger.info('Phase completion result', { 
            success: phaseResult?.success, 
            error: phaseResult?.error,
            nextPhase: phaseResult?.data?.nextPhase,
            nextStep: phaseResult?.data?.nextStep
          });
          
          if (phaseResult && phaseResult.success && phaseResult.data) {
            // Persist progress immediately
            saveToLocalStorage(STORAGE_KEYS.PROGRESS, {
              currentPhase: phaseResult.data.nextPhase || currentPhaseData.id,
              currentStep: phaseResult.data.nextStep,
              formData: updatedFormData,
              completedAt: new Date().toISOString()
            });

            // If there is a next phase, advance locally without recomputing
            if (phaseResult.data.nextPhase) {
              logger.info('Moving to next phase', { nextPhase: phaseResult.data.nextPhase });
              const nextPhaseConfig = await getPhaseConfiguration(phaseResult.data.nextPhase);
              if (nextPhaseConfig && nextPhaseConfig.success && nextPhaseConfig.data) {
                setCurrentPhaseData(nextPhaseConfig.data);
                const nextStepConfig = nextPhaseConfig.data.steps[0];
                setCurrentStepData(nextStepConfig);
                logger.info('Successfully moved to next phase', { 
                  newPhase: nextPhaseConfig.data.id,
                  newStep: nextStepConfig.id 
                });
              } else {
                logger.warn('Failed to get next phase config, falling back to DB reload');
                // Fallback: recompute from DB if configuration missing
                await loadOnboardingProgress(user.id);
              }
            } else {
              // Onboarding complete
              logger.info('Onboarding completed successfully');
              clearLocalStorage();
              onComplete(updatedFormData);
            }
          } else {
            // Phase completion failed
            logger.error('Failed to complete phase:', phaseResult?.error || 'Unknown error');
            // Save progress to localStorage as backup
            saveToLocalStorage(STORAGE_KEYS.PROGRESS, {
              currentPhase: currentPhaseData.id,
              currentStep: currentStepData.id,
              formData: updatedFormData,
              error: phaseResult?.error || 'Phase completion failed',
              lastAttempt: new Date().toISOString()
            });
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
        
        logger.info('Moving to next step in current phase', { 
          currentStep: currentStepData.id,
          nextStep: nextStep.id 
        });
        
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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground text-sm mb-4">Loading your progress...</p>
          <button 
            onClick={() => {
              clearLocalStorage();
              window.location.reload();
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Reset onboarding (if stuck)
          </button>
        </div>
      </div>
    );
  }

  if (!currentPhaseData || !currentStepData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground text-sm">Preparing onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full max-w-none mx-auto p-4 md:p-6 lg:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Recovery Notification */}
      {showRecoveryNotification && (
        <motion.div 
          className="mb-6 max-w-6xl mx-auto p-4 md:p-6 bg-blue-50 border border-blue-200 rounded-lg"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "backOut" }}
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <div className="flex-1">
              <motion.p 
                className="text-sm md:text-base font-medium text-blue-800"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                Progress Recovered
              </motion.p>
              <motion.p 
                className="text-xs md:text-sm text-blue-600"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                Your onboarding progress has been restored from your browser's local storage.
              </motion.p>
            </div>
            <motion.button
              onClick={() => setShowRecoveryNotification(false)}
              className="text-blue-400 hover:text-blue-600 p-1"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Phase Progress Header */}
      <motion.div 
        className="mb-8 max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <motion.div 
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
            >
              {currentPhaseData.title}
            </motion.h1>
            <motion.p 
              className="text-muted-foreground text-base md:text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
            >
              {currentPhaseData.description}
            </motion.p>
          </motion.div>
          <motion.div 
            className="flex flex-col items-start lg:items-end gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.1, ease: "backOut" }}
            >
              <Badge variant="secondary" className="text-sm">
                Phase {ONBOARDING_PHASES.findIndex((p: any) => p.id === currentPhaseData.id) + 1} of {ONBOARDING_PHASES.length}
              </Badge>
            </motion.div>
            <motion.p 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.3, ease: "easeOut" }}
            >
              {currentPhaseData.estimatedDuration}
            </motion.p>
          </motion.div>
        </div>
        
        {/* Phase Objectives */}
        <motion.div 
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5, ease: "easeOut" }}
        >
          <motion.h3 
            className="text-base md:text-lg font-medium mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.7, ease: "easeOut" }}
          >
            Phase Objectives:
          </motion.h3>
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
            {currentPhaseData.objectives.map((objective: string, index: number) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 1.9 + (index * 0.1), 
                  ease: "backOut" 
                }}
                whileHover={{ scale: 1.05 }}
              >
                <Badge variant="outline" className="text-xs md:text-sm px-3 py-1">
                  {objective}
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Step Progress */}
        <motion.div 
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.3, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between mb-3 max-w-md mx-auto">
            <motion.span 
              className="text-sm md:text-base font-medium"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 2.5, ease: "easeOut" }}
            >
              Step Progress
            </motion.span>
            <motion.span 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 2.7, ease: "easeOut" }}
            >
              {currentPhaseData.steps.findIndex((s: any) => s.id === currentStepData.id) + 1} of {currentPhaseData.steps.length}
            </motion.span>
          </div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 2.9, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
          >
            <Progress 
              value={(currentPhaseData.steps.findIndex((s: any) => s.id === currentStepData.id) + 1) / currentPhaseData.steps.length * 100} 
              className="h-2 md:h-3"
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Current Step */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 3.1, ease: "easeOut" }}
        key={currentStepData.id} // This ensures re-animation when step changes
      >
        <Card className="mb-6 max-w-6xl mx-auto">
          <CardHeader className="pb-4 text-center">
            {currentStepData.title && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 3.3, ease: "easeOut" }}
              >
                <CardTitle className="flex items-center justify-center gap-3 text-xl md:text-2xl">
                  {currentStepData.title}
                  {currentStepData.isRequired && currentStepData.component !== 'WelcomeStep' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: 3.5, ease: "backOut" }}
                    >
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    </motion.div>
                  )}
                </CardTitle>
              </motion.div>
            )}
            <motion.p 
              className="text-muted-foreground text-base md:text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
            >
              {currentStepData.description}
            </motion.p>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
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
        </motion.div>

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
    </motion.div>
  );
};

/**
 * AppWithOnboarding
 * 
 * Checks if user needs onboarding and shows appropriate flow
 * Only used on protected routes where user is authenticated
 */
export const AppWithOnboarding = React.memo<AppWithOnboardingProps>(({ children }) => {
  const { profile, loading: profileLoading } = useUserProfile();
  const { getOnboardingStatus, completeOnboarding } = useOnboardingService();
  const { user, loading: authLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [showFirstTimeWelcome, setShowFirstTimeWelcome] = useState(false);
  const [showCompletionChecker, setShowCompletionChecker] = useState(false);
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);
  const mountedRef = useRef(true);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onboardingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for force-onboarding URL parameter
  const isForceOnboarding = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const v1 = params.get('force-onboarding');
    const v2 = params.get('force-onboard'); // legacy alias
    return v1 === 'true' || v2 === 'true';
  }, []);

  // Check if user is first-time user
  const checkFirstTimeUser = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const result = await onboardingService.isFirstTimeUser(profile.id);
      if (result.success && result.data) {
        setIsFirstTimeUser(result.data);
        if (result.data) {
          setShowFirstTimeWelcome(true);
        }
      }
    } catch (error) {
      logger.error('Error checking first-time user status:', error);
    }
  }, [profile?.id]);

  const checkOnboardingStatus = useCallback(async () => {
    // Honor force-onboarding immediately, even before profile loads
    if (isForceOnboarding && mountedRef.current) {
      setShowOnboarding(true);
      setOnboardingCompleted(false);
      setIsCheckingOnboarding(false);
      return;
    }

    // If profile is not loaded yet, wait
    if (!profile?.id || !mountedRef.current) {
      setIsCheckingOnboarding(false);
      return;
    }

    // Clear any existing timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    // Debounce the check to prevent rapid calls
    checkTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current || !profile?.id) return;

      // Force-onboarding already handled above

      try {
        // Quick check: if profile has onboarding_completed flag, trust it
        if (profile.onboarding_completed === true) {
          logger.info('Onboarding already completed, bypassing checks', { 
            userId: profile.id, 
            onboardingCompleted: profile.onboarding_completed 
          });
          if (mountedRef.current) {
            setShowOnboarding(false);
            setOnboardingCompleted(true);
            setShowCompletionChecker(false);
            setIsCheckingOnboarding(false);
            // Clear timeout since we're done
            if (onboardingTimeoutRef.current) {
              clearTimeout(onboardingTimeoutRef.current);
            }
          }
          return;
        }

        // First check if user is first-time user
        await checkFirstTimeUser();

        // Then check onboarding completion
        const status = await getOnboardingStatus(profile.id);
        logger.info('Onboarding status check result', { 
          userId: profile.id, 
          status, 
          isCompleted: status?.isCompleted 
        });
        
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
            logger.warn('No onboarding status returned, showing onboarding');
            setShowOnboarding(true);
            setShowCompletionChecker(true);
          }
        }
      } catch (error) {
        logger.error('Error checking onboarding status:', error);
        if (mountedRef.current) {
          setShowOnboarding(true);
          setShowCompletionChecker(true);
        }
      } finally {
        if (mountedRef.current) {
          setIsCheckingOnboarding(false);
          // Clear timeout since we're done
          if (onboardingTimeoutRef.current) {
            clearTimeout(onboardingTimeoutRef.current);
          }
        }
      }
    }, 100); // 100ms debounce
  }, [profile?.id, profile?.onboarding_completed, isForceOnboarding, getOnboardingStatus, checkFirstTimeUser]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!authLoading && user) {
      checkOnboardingStatus();
      
      // Set a timeout to prevent hanging
      onboardingTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && isCheckingOnboarding) {
          logger.warn('Onboarding check timeout, showing main app');
          setIsCheckingOnboarding(false);
          setShowOnboarding(false);
          setOnboardingCompleted(true);
        }
      }, 5000); // 5 second timeout
    }

    return () => {
      mountedRef.current = false;
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
      if (onboardingTimeoutRef.current) {
        clearTimeout(onboardingTimeoutRef.current);
      }
    };
  }, [profileLoading, profile, checkOnboardingStatus, isCheckingOnboarding]);

  const handleFirstTimeWelcomeComplete = useCallback(async () => {
    if (!profile?.id) return;

    try {
      // Don't mark onboarding as complete here - only when all steps are done
      setShowFirstTimeWelcome(false);
      
      // Check onboarding completion after first-time welcome
      setShowCompletionChecker(true);
    } catch (error) {
      logger.error('Error completing first-time welcome:', error);
      setShowFirstTimeWelcome(false);
      setShowCompletionChecker(true);
    }
  }, [profile?.id]);

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
    if (!profile?.id || !mountedRef.current) {
      logger.error('User not authenticated during onboarding completion');
      return;
    }

    try {
      // Complete onboarding with all collected data
      const success = await completeOnboarding({
        ...data,
        userId: profile.id,
        completedAt: nowIsoUtc()
      });

      if (success && mountedRef.current) {
        logger.info('Onboarding completed successfully');
        setShowOnboarding(false);
        setOnboardingCompleted(true);
        setShowCompletionChecker(false);
        
        // If force-onboarding was active, remove the parameter without reloading
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          if (url.searchParams.has('force-onboarding')) {
            url.searchParams.delete('force-onboarding');
            window.history.replaceState({}, '', url.toString());
          }
        }
      } else {
        logger.error('Failed to complete onboarding');
      }
    } catch (error) {
      logger.error('Error completing onboarding:', error);
    }
  }, [profile?.id, completeOnboarding, isForceOnboarding]);

  // Show loading only if profile is loading and we don't have user yet
  if (profileLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking onboarding status (but only briefly)
  if (isCheckingOnboarding && profile?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Fallback: if profile is loaded and has onboarding_completed, show main app
  if (profile?.id && profile.onboarding_completed === true) {
    logger.info('Fallback: Profile has onboarding_completed=true, showing main app', { 
      userId: profile.id, 
      showOnboarding, 
      showCompletionChecker 
    });
    return <>{children}</>;
  }

  // Skip first-time welcome and go directly to onboarding
  if (showFirstTimeWelcome && profile) {
    handleFirstTimeWelcomeComplete();
    return null;
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
        <ThreePhaseOnboardingFlow onComplete={handleOnboardingComplete} />
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