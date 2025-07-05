import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Target, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  BarChart3,
  Users,
  Brain,
  Sparkles,
  PlayCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';

interface FounderOnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
}

interface FounderProfile {
  industry: string;
  companySize: string;
  biggestChallenge: string;
  monthlyRevenue: string;
  timeSpentOnAdmin: string;
}

interface ROICalculation {
  hoursPerWeek: number;
  hourlyValue: number;
  monthlySavings: number;
  annualSavings: number;
  timeToROI: string;
}

const INDUSTRY_SPECIFICS = {
  'ecommerce': {
    painPoints: ['Inventory management', 'Customer service', 'Order fulfillment', 'Marketing ROI'],
    aiSolutions: ['Automated order processing', 'Smart inventory alerts', 'AI customer service', 'Predictive analytics'],
    avgSavings: 18,
    quickWin: 'Automate order processing and inventory updates'
  },
  'saas': {
    painPoints: ['Customer churn', 'Lead qualification', 'Product analytics', 'Customer onboarding'],
    aiSolutions: ['Predictive churn analysis', 'Automated lead scoring', 'Smart customer insights', 'Intelligent support routing'],
    avgSavings: 22,
    quickWin: 'Automate lead scoring and customer health monitoring'
  },
  'consulting': {
    painPoints: ['Time tracking', 'Project management', 'Client communication', 'Resource allocation'],
    aiSolutions: ['Automated time tracking', 'Smart project insights', 'Client communication automation', 'Resource optimization'],
    avgSavings: 16,
    quickWin: 'Automate time tracking and project reporting'
  },
  'agency': {
    painPoints: ['Client reporting', 'Campaign management', 'Resource planning', 'Performance tracking'],
    aiSolutions: ['Automated client reports', 'Smart campaign optimization', 'Real-time performance insights', 'Predictive ROI modeling'],
    avgSavings: 20,
    quickWin: 'Automate client reporting and campaign optimization'
  },
  'other': {
    painPoints: ['Data management', 'Process optimization', 'Team coordination', 'Performance tracking'],
    aiSolutions: ['Automated data processing', 'Smart workflow optimization', 'Intelligent team coordination', 'Real-time analytics'],
    avgSavings: 15,
    quickWin: 'Automate data processing and reporting'
  }
};

export const FounderOnboarding: React.FC<FounderOnboardingProps> = ({ onComplete, onSkip }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<FounderProfile>({
    industry: '',
    companySize: '',
    biggestChallenge: '',
    monthlyRevenue: '',
    timeSpentOnAdmin: ''
  });
  const [roiCalculation, setROICalculation] = useState<ROICalculation | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const firstName = user?.profile?.first_name || 'there';

  const calculateROI = (profile: FounderProfile): ROICalculation => {
    const industryData = INDUSTRY_SPECIFICS[profile.industry as keyof typeof INDUSTRY_SPECIFICS] || INDUSTRY_SPECIFICS.other;
    
    // Calculate founder's hourly value based on revenue
    const monthlyRev = parseInt(profile.monthlyRevenue.replace(/[^0-9]/g, '')) || 50000;
    const hourlyValue = Math.max(100, monthlyRev / 160); // Assume 160 working hours/month, min $100/hr
    
    // Calculate time savings based on admin time
    const adminHours = parseInt(profile.timeSpentOnAdmin.replace(/[^0-9]/g, '')) || 20;
    const automationSavings = Math.min(adminHours * 0.7, industryData.avgSavings); // 70% of admin time, capped by industry avg
    
    const monthlySavings = automationSavings * 4 * hourlyValue; // 4 weeks
    const annualSavings = monthlySavings * 12;
    
    return {
      hoursPerWeek: automationSavings,
      hourlyValue,
      monthlySavings,
      annualSavings,
      timeToROI: monthlySavings > 29 ? '1 day' : '1 week'
    };
  };

  const handleStepComplete = (stepData: Partial<FounderProfile>) => {
    const updatedProfile = { ...profile, ...stepData };
    setProfile(updatedProfile);
    
    if (currentStep === 4) {
      // Final step - calculate ROI and show demo
      const roi = calculateROI(updatedProfile);
      setROICalculation(roi);
      setShowDemo(true);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const startDemo = () => {
    setDemoStep(1);
  };

  const completeDemo = () => {
    // Save founder profile for personalization
    localStorage.setItem('nexus_founder_profile', JSON.stringify({
      ...profile,
      roi: roiCalculation,
      completedAt: new Date().toISOString()
    }));
    onComplete();
  };

  const industryData = INDUSTRY_SPECIFICS[profile.industry as keyof typeof INDUSTRY_SPECIFICS] || INDUSTRY_SPECIFICS.other;

  if (showDemo) {
    return (
      <FounderDemo 
        profile={profile}
        roi={roiCalculation!}
        industryData={industryData}
        currentStep={demoStep}
        onNext={() => setDemoStep(demoStep + 1)}
        onComplete={completeDemo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-primary mr-2" />
            <CardTitle className="text-2xl">Hey {firstName}! 👋</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Let's see how much time Nexus can save you this month
          </p>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-4">
            {[0, 1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full mx-1 ${
                  step <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <IndustryStep onComplete={handleStepComplete} />
            )}
            {currentStep === 1 && (
              <CompanySizeStep onComplete={handleStepComplete} />
            )}
            {currentStep === 2 && (
              <ChallengeStep onComplete={handleStepComplete} industry={profile.industry} />
            )}
            {currentStep === 3 && (
              <RevenueStep onComplete={handleStepComplete} />
            )}
            {currentStep === 4 && (
              <TimeStep onComplete={handleStepComplete} />
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

// Individual step components
const IndustryStep: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const industries = [
    { id: 'ecommerce', label: 'E-commerce/Retail', icon: '🛒' },
    { id: 'saas', label: 'SaaS/Software', icon: '💻' },
    { id: 'consulting', label: 'Consulting/Services', icon: '💼' },
    { id: 'agency', label: 'Marketing/Agency', icon: '📈' },
    { id: 'other', label: 'Other Industry', icon: '🏢' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-center mb-6">
        What industry is your business in?
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {industries.map((industry) => (
          <Button
            key={industry.id}
            variant="outline"
            className="h-auto p-4 justify-start text-left hover:bg-primary/5"
            onClick={() => onComplete({ industry: industry.id })}
          >
            <span className="text-2xl mr-3">{industry.icon}</span>
            <span className="font-medium">{industry.label}</span>
          </Button>
        ))}
      </div>
    </motion.div>
  );
};

const CompanySizeStep: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const sizes = [
    { id: 'solo', label: 'Just me (Solo founder)', desc: '1 person' },
    { id: 'small', label: 'Small team', desc: '2-10 people' },
    { id: 'medium', label: 'Growing company', desc: '11-50 people' },
    { id: 'large', label: 'Established business', desc: '50+ people' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-center mb-6">
        How big is your team?
      </h3>
      <div className="space-y-3">
        {sizes.map((size) => (
          <Button
            key={size.id}
            variant="outline"
            className="w-full h-auto p-4 justify-between hover:bg-primary/5"
            onClick={() => onComplete({ companySize: size.id })}
          >
            <div className="text-left">
              <div className="font-medium">{size.label}</div>
              <div className="text-sm text-muted-foreground">{size.desc}</div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </motion.div>
  );
};

const ChallengeStep: React.FC<{ onComplete: (data: any) => void; industry: string }> = ({ onComplete, industry }) => {
  const industryData = INDUSTRY_SPECIFICS[industry as keyof typeof INDUSTRY_SPECIFICS] || INDUSTRY_SPECIFICS.other;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-center mb-6">
        What's your biggest operational challenge?
      </h3>
      <div className="space-y-3">
        {industryData.painPoints.map((challenge, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full h-auto p-4 justify-between hover:bg-primary/5"
            onClick={() => onComplete({ biggestChallenge: challenge })}
          >
            <span className="font-medium">{challenge}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </motion.div>
  );
};

const RevenueStep: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const ranges = [
    { id: 'startup', label: 'Pre-revenue/Starting out', value: '10000' },
    { id: 'small', label: '$10K - $50K/month', value: '30000' },
    { id: 'medium', label: '$50K - $200K/month', value: '125000' },
    { id: 'large', label: '$200K+ per month', value: '500000' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-center mb-6">
        What's your approximate monthly revenue?
      </h3>
      <div className="space-y-3">
        {ranges.map((range) => (
          <Button
            key={range.id}
            variant="outline"
            className="w-full h-auto p-4 justify-between hover:bg-primary/5"
            onClick={() => onComplete({ monthlyRevenue: range.value })}
          >
            <span className="font-medium">{range.label}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </motion.div>
  );
};

const TimeStep: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const timeRanges = [
    { id: 'low', label: '5-10 hours per week', value: '7' },
    { id: 'medium', label: '10-20 hours per week', value: '15' },
    { id: 'high', label: '20-30 hours per week', value: '25' },
    { id: 'extreme', label: '30+ hours per week', value: '35' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-center mb-6">
        How much time do you spend on admin/operational tasks?
      </h3>
      <div className="space-y-3">
        {timeRanges.map((range) => (
          <Button
            key={range.id}
            variant="outline"
            className="w-full h-auto p-4 justify-between hover:bg-primary/5"
            onClick={() => onComplete({ timeSpentOnAdmin: range.value })}
          >
            <span className="font-medium">{range.label}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </motion.div>
  );
};

// Demo component that shows personalized value
const FounderDemo: React.FC<{
  profile: FounderProfile;
  roi: ROICalculation;
  industryData: any;
  currentStep: number;
  onNext: () => void;
  onComplete: () => void;
}> = ({ profile, roi, industryData, currentStep, onNext, onComplete }) => {
  const [animatedSavings, setAnimatedSavings] = useState(0);

  useEffect(() => {
    if (currentStep === 1) {
      // Animate the savings counter
      const target = roi.monthlySavings;
      const increment = target / 50;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setAnimatedSavings(target);
          clearInterval(timer);
        } else {
          setAnimatedSavings(Math.floor(current));
        }
      }, 30);

      return () => clearInterval(timer);
    }
  }, [currentStep, roi.monthlySavings]);

  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center px-4 py-2 bg-success/10 border border-success/20 rounded-full">
                <Sparkles className="h-4 w-4 text-success mr-2" />
                <span className="text-success font-semibold">Your Personalized ROI Analysis</span>
              </div>

              <h2 className="text-3xl font-bold">
                Nexus could save you
              </h2>

              <div className="text-6xl font-bold text-primary">
                ${animatedSavings.toLocaleString()}
              </div>
              
              <p className="text-xl text-muted-foreground">
                per month by automating your {profile.biggestChallenge.toLowerCase()}
              </p>

              <div className="grid grid-cols-3 gap-6 my-8">
                <div className="p-4 bg-background rounded-lg border">
                  <div className="text-2xl font-bold text-primary">{roi.hoursPerWeek}h</div>
                  <div className="text-sm text-muted-foreground">saved per week</div>
                </div>
                <div className="p-4 bg-background rounded-lg border">
                  <div className="text-2xl font-bold text-success">${roi.hourlyValue}</div>
                  <div className="text-sm text-muted-foreground">your hourly value</div>
                </div>
                <div className="p-4 bg-background rounded-lg border">
                  <div className="text-2xl font-bold text-warning">{roi.timeToROI}</div>
                  <div className="text-sm text-muted-foreground">to break even</div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <h3 className="font-semibold mb-3">Here's how we'll do it:</h3>
                <div className="space-y-2 text-left">
                  {industryData.aiSolutions.map((solution: string, index: number) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-success mr-2 flex-shrink-0" />
                      <span className="text-sm">{solution}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={onNext} size="lg" className="w-full">
                <PlayCircle className="h-4 w-4 mr-2" />
                Show Me How It Works
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Demo steps showing actual automation
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <Badge className="mb-4">Live Demo</Badge>
            <h2 className="text-2xl font-bold mb-2">
              Watch Nexus automate your {profile.biggestChallenge.toLowerCase()}
            </h2>
            <p className="text-muted-foreground">
              This is exactly what would happen in your business
            </p>
          </div>

          {/* Simulated automation interface */}
          <div className="bg-background border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">AI Agent: {industryData.quickWin}</span>
              </div>
              <Badge variant="outline">Running</Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-success mr-2" />
                <span>Analyzed 247 data points from your systems</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-success mr-2" />
                <span>Identified 12 automation opportunities</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 text-success mr-2" />
                <span>Created 3 automated workflows</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Generating your first insights...</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
              <h3 className="font-semibold text-success mb-2">Time Saved Today</h3>
              <div className="text-2xl font-bold">{Math.round(roi.hoursPerWeek / 5)} hours</div>
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h3 className="font-semibold text-primary mb-2">Value Created</h3>
              <div className="text-2xl font-bold">${Math.round(roi.monthlySavings / 30)}</div>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={onComplete} size="lg" className="mr-4">
              Start Your Free Trial
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={onComplete}>
              See Full Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 