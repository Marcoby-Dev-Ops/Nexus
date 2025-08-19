import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Building2, ArrowRight, CheckCircle, Brain } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';

interface WelcomeStepProps {
  onNext: (data: Record<string, unknown>) => void;
  data: Record<string, unknown>;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, data }) => {
  const [currentSection, setCurrentSection] = useState<'user' | 'company' | 'foundational'>('user');
  const [formData, setFormData] = useState({
    // User Profile
    firstName: (data.userProfile?.firstName as string) || '',
    lastName: (data.userProfile?.lastName as string) || '',
    role: (data.userProfile?.role as string) || '',
    experience: (data.userProfile?.experience as string) || '',
    decisionAuthority: (data.userProfile?.decisionAuthority as string) || '',
    learningStyle: (data.userProfile?.learningStyle as string) || '',
    timeAvailability: (data.userProfile?.timeAvailability as string) || '',
    
    // Company Profile
    companyName: (data.companyProfile?.name as string) || '',
    industry: (data.industry as string) || (data.companyProfile?.industry as string) || '',
    companySize: (data.companySize as string) || (data.companyProfile?.size as string) || '',
    founded: (data.companyProfile?.founded as string) || '',
    tools: (data.tools as string[]) || (data.companyProfile?.tools as string[]) || [],
    priorities: (data.priorities as string[]) || (data.companyProfile?.priorities as string[]) || [],
    challenges: (data.challenges as string[]) || (data.companyProfile?.challenges as string[]) || [],
    
    // Foundational Knowledge
    businessModel: (data.foundationalKnowledge?.businessModel as string) || '',
    revenueModel: (data.foundationalKnowledge?.revenueModel as string) || '',
    growthStage: (data.foundationalKnowledge?.growthStage as string) || '',
    marketPosition: (data.foundationalKnowledge?.marketPosition as string) || '',
    targetMarket: (data.foundationalKnowledge?.targetMarket as string) || '',
    competitiveAdvantage: (data.foundationalKnowledge?.competitiveAdvantage as string) || '',
    currentMetrics: (data.foundationalKnowledge?.currentMetrics as string[]) || [],
    painPoints: (data.foundationalKnowledge?.painPoints as string[]) || [],
    successFactors: (data.foundationalKnowledge?.successFactors as string[]) || []
  });

  // Auto-navigate to the appropriate section based on existing data
  useEffect(() => {
    if (data.foundationalKnowledge?.businessModel && data.foundationalKnowledge?.growthStage) {
      setCurrentSection('foundational');
    } else if (data.companyProfile?.name && data.companyProfile?.industry && data.companyProfile?.size) {
      setCurrentSection('company');
    } else if (data.userProfile?.firstName && data.userProfile?.lastName && data.userProfile?.role) {
      setCurrentSection('user');
    }
  }, [data]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentSection === 'user') {
      setCurrentSection('company');
    } else if (currentSection === 'company') {
      setCurrentSection('foundational');
    } else {
      // Complete profile creation
      onNext({
        userProfile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          fullName: `${formData.firstName} ${formData.lastName}`,
          role: formData.role,
          experience: formData.experience,
          decisionAuthority: formData.decisionAuthority,
          learningStyle: formData.learningStyle,
          timeAvailability: formData.timeAvailability
        },
        companyProfile: {
          name: formData.companyName,
          industry: formData.industry,
          size: formData.companySize,
          founded: formData.founded,
          tools: formData.tools,
          priorities: formData.priorities,
          challenges: formData.challenges
        },
        foundationalKnowledge: {
          businessModel: formData.businessModel,
          revenueModel: formData.revenueModel,
          growthStage: formData.growthStage,
          marketPosition: formData.marketPosition,
          targetMarket: formData.targetMarket,
          competitiveAdvantage: formData.competitiveAdvantage,
          currentMetrics: formData.currentMetrics,
          painPoints: formData.painPoints,
          successFactors: formData.successFactors
        },
        // Legacy fields for compatibility
        industry: formData.industry,
        companySize: formData.companySize,
        tools: formData.tools,
        priorities: formData.priorities,
        challenges: formData.challenges
      });
    }
  };

  const isUserSectionValid = formData.firstName && formData.lastName && formData.role;
  const isCompanySectionValid = formData.companyName && formData.industry && formData.companySize;
  const isFoundationalSectionValid = formData.businessModel && formData.growthStage;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div 
          className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {currentSection === 'user' ? (
            <User className="w-10 h-10 text-primary" />
          ) : (
            <Building2 className="w-10 h-10 text-primary" />
          )}
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {currentSection === 'user' ? 'Tell Us About You' : currentSection === 'company' ? 'Tell Us About Your Company' : 'Establish Your AI Foundation'}
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          {currentSection === 'user' 
            ? 'Help our AI system understand your background and preferences'
            : currentSection === 'company'
            ? 'This information helps our AI understand your business context'
            : 'This establishes your foundation in our knowledge system for personalized insights'
          }
        </p>
        
        {/* Progress Indicator */}
        <div className="flex justify-center items-center space-x-4 mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentSection === 'user' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
            }`}>
              {currentSection === 'user' ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <span className="ml-2 text-sm font-medium">User Profile</span>
          </div>
          <div className="w-8 h-1 bg-muted"></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentSection === 'company' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {currentSection === 'company' ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">Company Profile</span>
          </div>
          <div className="w-8 h-1 bg-muted"></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentSection === 'foundational' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {currentSection === 'foundational' ? <CheckCircle className="w-5 h-5" /> : '3'}
            </div>
            <span className="ml-2 text-sm font-medium">AI Foundation</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <motion.div
        key={currentSection}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {currentSection === 'user' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                User Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="role">Your Role *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">Founder/CEO</SelectItem>
                    <SelectItem value="executive">Executive/Manager</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="experience">Business Experience</Label>
                <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
                    <SelectItem value="experienced">Experienced (6-10 years)</SelectItem>
                    <SelectItem value="expert">Expert (10+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="decisionAuthority">Decision-Making Authority</Label>
                <Select value={formData.decisionAuthority} onValueChange={(value) => handleInputChange('decisionAuthority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your decision-making level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full decision-making authority</SelectItem>
                    <SelectItem value="major">Major decisions (budget, strategy)</SelectItem>
                    <SelectItem value="departmental">Departmental decisions</SelectItem>
                    <SelectItem value="influencer">Influence decisions but don't make final calls</SelectItem>
                    <SelectItem value="none">No decision-making authority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="learningStyle">Preferred Learning Style</Label>
                <Select value={formData.learningStyle} onValueChange={(value) => handleInputChange('learningStyle', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How do you prefer to learn?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visual">Visual (diagrams, charts, videos)</SelectItem>
                    <SelectItem value="hands-on">Hands-on (tutorials, practice)</SelectItem>
                    <SelectItem value="reading">Reading (documentation, guides)</SelectItem>
                    <SelectItem value="mentoring">Mentoring (one-on-one guidance)</SelectItem>
                    <SelectItem value="mixed">Mixed approach</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeAvailability">Time Available for Implementation</Label>
                <Select value={formData.timeAvailability} onValueChange={(value) => handleInputChange('timeAvailability', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How much time can you dedicate?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time focus</SelectItem>
                    <SelectItem value="part-time">Part-time (10-20 hours/week)</SelectItem>
                    <SelectItem value="limited">Limited (5-10 hours/week)</SelectItem>
                    <SelectItem value="minimal">Minimal (1-5 hours/week)</SelectItem>
                    <SelectItem value="delegate">Will delegate to team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ) : currentSection === 'company' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Company Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Enter your company name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology/SaaS</SelectItem>
                      <SelectItem value="ecommerce">E-commerce/Retail</SelectItem>
                      <SelectItem value="consulting">Consulting/Professional Services</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance/Fintech</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="companySize">Company Size *</Label>
                  <Select value={formData.companySize} onValueChange={(value) => handleInputChange('companySize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo Entrepreneur</SelectItem>
                      <SelectItem value="small">Small (2-10 employees)</SelectItem>
                      <SelectItem value="medium">Medium (11-50 employees)</SelectItem>
                      <SelectItem value="large">Large (51-200 employees)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (200+ employees)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="founded">Year Founded</Label>
                <Input
                  id="founded"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.founded}
                  onChange={(e) => handleInputChange('founded', e.target.value)}
                  placeholder="e.g., 2020"
                />
              </div>

              <div>
                <Label>Current Tools & Platforms</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {['Slack', 'Notion', 'QuickBooks', 'Salesforce', 'HubSpot', 'Zapier', 'Google Workspace', 'Microsoft 365'].map((tool) => (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => {
                        const newTools = formData.tools.includes(tool)
                          ? formData.tools.filter(t => t !== tool)
                          : [...formData.tools, tool];
                        handleInputChange('tools', newTools);
                      }}
                      className={`p-2 text-sm rounded border transition-colors ${
                        formData.tools.includes(tool)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Business Priorities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {['Increase Revenue', 'Improve Efficiency', 'Reduce Costs', 'Enhance Customer Experience', 'Scale Operations', 'Innovate Products'].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => {
                        const newPriorities = formData.priorities.includes(priority)
                          ? formData.priorities.filter(p => p !== priority)
                          : [...formData.priorities, priority];
                        handleInputChange('priorities', newPriorities);
                      }}
                      className={`p-2 text-sm rounded border transition-colors ${
                        formData.priorities.includes(priority)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Current Challenges</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {['Time Management', 'Manual Processes', 'Limited Resources', 'Customer Acquisition', 'Team Collaboration', 'Data Management'].map((challenge) => (
                    <button
                      key={challenge}
                      type="button"
                      onClick={() => {
                        const newChallenges = formData.challenges.includes(challenge)
                          ? formData.challenges.filter(c => c !== challenge)
                          : [...formData.challenges, challenge];
                        handleInputChange('challenges', newChallenges);
                      }}
                      className={`p-2 text-sm rounded border transition-colors ${
                        formData.challenges.includes(challenge)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      {challenge}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                AI Foundation Knowledge
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                This information establishes your foundation in our AI knowledge system for personalized insights and recommendations
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessModel">Business Model *</Label>
                  <Select value={formData.businessModel} onValueChange={(value) => handleInputChange('businessModel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your business model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="b2b">B2B (Business to Business)</SelectItem>
                      <SelectItem value="b2c">B2C (Business to Consumer)</SelectItem>
                      <SelectItem value="b2b2c">B2B2C (Business to Business to Consumer)</SelectItem>
                      <SelectItem value="marketplace">Marketplace</SelectItem>
                      <SelectItem value="subscription">Subscription/Recurring</SelectItem>
                      <SelectItem value="consulting">Consulting/Services</SelectItem>
                      <SelectItem value="ecommerce">E-commerce/Retail</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="revenueModel">Revenue Model</Label>
                  <Select value={formData.revenueModel} onValueChange={(value) => handleInputChange('revenueModel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your revenue model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">Subscription/Recurring</SelectItem>
                      <SelectItem value="one-time">One-time Sales</SelectItem>
                      <SelectItem value="commission">Commission/Fees</SelectItem>
                      <SelectItem value="advertising">Advertising</SelectItem>
                      <SelectItem value="freemium">Freemium</SelectItem>
                      <SelectItem value="licensing">Licensing</SelectItem>
                      <SelectItem value="mixed">Mixed Revenue Streams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="growthStage">Growth Stage *</Label>
                  <Select value={formData.growthStage} onValueChange={(value) => handleInputChange('growthStage', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your growth stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea/Concept</SelectItem>
                      <SelectItem value="startup">Startup/Early Stage</SelectItem>
                      <SelectItem value="growth">Growth Stage</SelectItem>
                      <SelectItem value="mature">Mature/Established</SelectItem>
                      <SelectItem value="scale">Scaling/Expansion</SelectItem>
                      <SelectItem value="decline">Decline/Transition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="marketPosition">Market Position</Label>
                  <Select value={formData.marketPosition} onValueChange={(value) => handleInputChange('marketPosition', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your market position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leader">Market Leader</SelectItem>
                      <SelectItem value="challenger">Market Challenger</SelectItem>
                      <SelectItem value="follower">Market Follower</SelectItem>
                      <SelectItem value="niche">Niche Player</SelectItem>
                      <SelectItem value="disruptor">Disruptor/Innovator</SelectItem>
                      <SelectItem value="new-entrant">New Entrant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="targetMarket">Target Market</Label>
                <Input
                  id="targetMarket"
                  value={formData.targetMarket}
                  onChange={(e) => handleInputChange('targetMarket', e.target.value)}
                  placeholder="e.g., Small businesses in healthcare, Enterprise SaaS companies"
                />
              </div>

              <div>
                <Label htmlFor="competitiveAdvantage">Competitive Advantage</Label>
                <Input
                  id="competitiveAdvantage"
                  value={formData.competitiveAdvantage}
                  onChange={(e) => handleInputChange('competitiveAdvantage', e.target.value)}
                  placeholder="e.g., Proprietary technology, First-mover advantage, Cost leadership"
                />
              </div>

              <div>
                <Label>Current Key Metrics (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {['Revenue', 'Customer Acquisition Cost', 'Customer Lifetime Value', 'Churn Rate', 'Conversion Rate', 'Market Share', 'Employee Count', 'Customer Satisfaction', 'Profit Margins'].map((metric) => (
                    <button
                      key={metric}
                      type="button"
                      onClick={() => {
                        const newMetrics = formData.currentMetrics.includes(metric)
                          ? formData.currentMetrics.filter(m => m !== metric)
                          : [...formData.currentMetrics, metric];
                        handleInputChange('currentMetrics', newMetrics);
                      }}
                      className={`p-2 text-sm rounded border transition-colors ${
                        formData.currentMetrics.includes(metric)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      {metric}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Critical Pain Points (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {['Customer Acquisition', 'Retention', 'Scaling Operations', 'Cash Flow', 'Talent Acquisition', 'Technology Debt', 'Market Competition', 'Regulatory Compliance', 'Product Development'].map((painPoint) => (
                    <button
                      key={painPoint}
                      type="button"
                      onClick={() => {
                        const newPainPoints = formData.painPoints.includes(painPoint)
                          ? formData.painPoints.filter(p => p !== painPoint)
                          : [...formData.painPoints, painPoint];
                        handleInputChange('painPoints', newPainPoints);
                      }}
                      className={`p-2 text-sm rounded border transition-colors ${
                        formData.painPoints.includes(painPoint)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      {painPoint}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Success Factors (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {['Strong Team', 'Market Timing', 'Innovation', 'Customer Focus', 'Operational Efficiency', 'Financial Discipline', 'Strategic Partnerships', 'Technology Excellence', 'Brand Recognition'].map((factor) => (
                    <button
                      key={factor}
                      type="button"
                      onClick={() => {
                        const newSuccessFactors = formData.successFactors.includes(factor)
                          ? formData.successFactors.filter(s => s !== factor)
                          : [...formData.successFactors, factor];
                        handleInputChange('successFactors', newSuccessFactors);
                      }}
                      className={`p-2 text-sm rounded border transition-colors ${
                        formData.successFactors.includes(factor)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      {factor}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        {currentSection === 'company' && (
          <Button 
            variant="outline" 
            onClick={() => setCurrentSection('user')}
          >
            ← Back to User Profile
          </Button>
        )}
        {currentSection === 'foundational' && (
          <Button 
            variant="outline" 
            onClick={() => setCurrentSection('company')}
          >
            ← Back to Company Profile
          </Button>
        )}
        <div className="ml-auto">
          <Button 
            onClick={handleNext}
            disabled={currentSection === 'user' ? !isUserSectionValid : currentSection === 'company' ? !isCompanySectionValid : !isFoundationalSectionValid}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {currentSection === 'user' ? 'Continue to Company Profile' : currentSection === 'company' ? 'Continue to Foundational Knowledge' : 'Complete Profile Setup'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
