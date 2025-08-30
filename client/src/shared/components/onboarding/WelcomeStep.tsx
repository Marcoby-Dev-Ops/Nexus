import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Building2, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { logger } from '@/shared/utils/logger';

interface WelcomeStepProps {
  onNext: (data: Record<string, unknown>) => void;
  data: Record<string, unknown>;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, data }) => {
  const { updateProfile } = useUserProfile();
  const [currentSection, setCurrentSection] = useState<'user' | 'company' | 'foundational'>('user');
  const [formData, setFormData] = useState({
    // User Profile
    firstName: (data.userProfile?.firstName  as string) || '',
    lastName: (data.userProfile?.lastName as string) || '',
    role: (data.userProfile?.role as string) || '',
    experience: (data.userProfile?.experience as string) || '',
    decisionAuthority: (data.userProfile?.decisionAuthority as string) || '',
    learningStyle: (data.userProfile?.learningStyle as string) || '',
    timeAvailability: (data.userProfile?.timeAvailability as string) || '',
    phone: (data.userProfile?.phone as string) || '',
    
    // Company Profile
    companyName: (data.companyProfile?.name as string) || '',
    businessType: (data.companyProfile?.businessType as string) || '',
    industry: (data.industry as string) || (data.companyProfile?.industry as string) || '',
    companySize: (data.companySize as string) || (data.companyProfile?.size as string) || '',
    founded: (data.companyProfile?.founded as string) || '',
    fundingStage: (data.companyProfile?.fundingStage as string) || '',
    revenueRange: (data.companyProfile?.revenueRange as string) || '',
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

  const handleNext = async () => {
    if (currentSection === 'user') {
      // Save user profile data immediately when user section is completed
      try {
        const userProfileData = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          display_name: `${formData.firstName} ${formData.lastName}`,
          job_title: formData.role,
          // Store additional user preferences in a JSONB field or separate table
          preferences: {
            experience: formData.experience,
            decisionAuthority: formData.decisionAuthority,
            learningStyle: formData.learningStyle,
            timeAvailability: formData.timeAvailability
          }
        };

        const result = await updateProfile(userProfileData);
        if (result.success) {
          logger.info('User profile saved successfully during onboarding');
        } else {
          logger.warn('Failed to save user profile during onboarding:', result.error);
        }
      } catch (error) {
        logger.error('Error saving user profile during onboarding:', error);
      }

      setCurrentSection('company');
    } else if (currentSection === 'company') {
      setCurrentSection('foundational');
    } else {
      // Complete profile creation with enhanced error handling and feedback
      try {
        const completeProfileData = {
          userProfile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            fullName: `${formData.firstName} ${formData.lastName}`,
            role: formData.role,
            experience: formData.experience,
            decisionAuthority: formData.decisionAuthority,
            learningStyle: formData.learningStyle,
            timeAvailability: formData.timeAvailability,
            phone: formData.phone
          },
          companyProfile: {
            name: formData.companyName,
            businessType: formData.businessType,
            industry: formData.industry,
            size: formData.companySize,
            founded: formData.founded,
            fundingStage: formData.fundingStage,
            revenueRange: formData.revenueRange,
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
        };

        // Log the data being saved for debugging
        logger.info('Saving complete profile data:', completeProfileData);
        
        // Call onNext to save the data
        onNext(completeProfileData);
        
        logger.info('Profile setup completed successfully');
      } catch (error) {
        logger.error('Error completing profile setup:', error);
        // You might want to show an error message to the user here
      }
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
          {currentSection === 'user' ? 'Tell Us About You' : currentSection === 'company' ? 'Tell Us About Your Company' : 'Business Structure'}
        </h1>
        
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
            <span className="ml-2 text-sm font-medium">Business Structure</span>
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

              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  autoComplete="tel"
                />
              </div>
            </CardContent>
          </Card>
        ) : currentSection === 'company' ? (
          <Card>
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

              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup - Early-stage company seeking growth</SelectItem>
                    <SelectItem value="small-business">Small Business - Established business with &lt;50 employees</SelectItem>
                    <SelectItem value="medium-business">Medium Business - Growing company with 50-500 employees</SelectItem>
                    <SelectItem value="enterprise">Enterprise - Large organization with 500+ employees</SelectItem>
                    <SelectItem value="non-profit">Non-Profit - Mission-driven organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="marketing-advertising">Marketing & Advertising</SelectItem>
                      <SelectItem value="legal-services">Legal Services</SelectItem>
                      <SelectItem value="non-profit">Non-profit</SelectItem>
                      <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                      <SelectItem value="hospitality-tourism">Hospitality & Tourism</SelectItem>
                      <SelectItem value="transportation-logistics">Transportation & Logistics</SelectItem>
                      <SelectItem value="energy-utilities">Energy & Utilities</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="media-entertainment">Media & Entertainment</SelectItem>
                      <SelectItem value="fashion-apparel">Fashion & Apparel</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="pharmaceuticals">Pharmaceuticals</SelectItem>
                      <SelectItem value="telecommunications">Telecommunications</SelectItem>
                      <SelectItem value="aerospace-defense">Aerospace & Defense</SelectItem>
                      <SelectItem value="biotechnology">Biotechnology</SelectItem>
                      <SelectItem value="environmental-services">Environmental Services</SelectItem>
                      <SelectItem value="sports-fitness">Sports & Fitness</SelectItem>
                      <SelectItem value="beauty-personal-care">Beauty & Personal Care</SelectItem>
                      <SelectItem value="home-garden">Home & Garden</SelectItem>
                      <SelectItem value="pet-services">Pet Services</SelectItem>
                      <SelectItem value="professional-services">Professional Services</SelectItem>
                      <SelectItem value="creative-arts">Creative Arts</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fundingStage">Funding Stage</Label>
                  <Select value={formData.fundingStage} onValueChange={(value) => handleInputChange('fundingStage', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select funding stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bootstrap">Bootstrap (Self-funded)</SelectItem>
                      <SelectItem value="seed">Seed Stage</SelectItem>
                      <SelectItem value="series-a">Series A</SelectItem>
                      <SelectItem value="series-b">Series B</SelectItem>
                      <SelectItem value="series-c">Series C+</SelectItem>
                      <SelectItem value="public">Public Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="revenueRange">Annual Revenue Range</Label>
                  <Select value={formData.revenueRange} onValueChange={(value) => handleInputChange('revenueRange', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select revenue range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-100k">$0 - $100K</SelectItem>
                      <SelectItem value="100k-500k">$100K - $500K</SelectItem>
                      <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                      <SelectItem value="1m-5m">$1M - $5M</SelectItem>
                      <SelectItem value="5m-10m">$5M - $10M</SelectItem>
                      <SelectItem value="10m+">$10M+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Current Tools You Use as an Organization</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {['Invoicing', 'CRM', 'Service Delivery', 'Email', 'Accounting', 'Project Management', 'Team Communication', 'File Storage'].map((tool) => (
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
                <Label>What's Your Top Business Priority Right Now?</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {[
                    'Get more customers', 
                    'Keep existing customers happy', 
                    'Make more money from each customer', 
                    'Reduce costs and save money', 
                    'Get work done faster', 
                    'Help my team work better together'
                  ].map((priority) => (
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
                <Label>What's Slowing You Down the Most?</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {[
                    'Too much manual work', 
                    'Information scattered everywhere', 
                    'Can\'t find what I need quickly', 
                    'Team communication is messy', 
                    'Not enough time in the day', 
                    'Don\'t know what to focus on'
                  ].map((challenge) => (
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
              <p className="text-sm text-muted-foreground">
                Help us understand the structure of your business to enhance insights and recommendations from Nexus
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
               <div>
                 <Label htmlFor="targetMarket">Who are your main customers?</Label>
                 <Select value={formData.targetMarket} onValueChange={(value) => handleInputChange('targetMarket', value)}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select your main customer type" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="small-business">Small Businesses (1-50 employees)</SelectItem>
                     <SelectItem value="medium-business">Medium Businesses (51-200 employees)</SelectItem>
                     <SelectItem value="large-business">Large Businesses (201-1000 employees)</SelectItem>
                     <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
                     <SelectItem value="startups">Startups & Early-stage companies</SelectItem>
                     <SelectItem value="individuals">Individual consumers</SelectItem>
                     <SelectItem value="government">Government & Public sector</SelectItem>
                     <SelectItem value="non-profit">Non-profit organizations</SelectItem>
                     <SelectItem value="mixed">Mixed customer types</SelectItem>
                     <SelectItem value="other">Other</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div>
                 <Label htmlFor="businessModel">How do you make money?</Label>
                 <Select value={formData.businessModel} onValueChange={(value) => handleInputChange('businessModel', value)}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select how you make money" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="b2b">Selling to other businesses</SelectItem>
                     <SelectItem value="b2c">Selling directly to customers</SelectItem>
                     <SelectItem value="subscription">Monthly/yearly subscriptions</SelectItem>
                     <SelectItem value="consulting">Consulting or services</SelectItem>
                     <SelectItem value="ecommerce">Online sales</SelectItem>
                     <SelectItem value="marketplace">Connecting buyers and sellers</SelectItem>
                     <SelectItem value="other">Other</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div>
                 <Label htmlFor="growthStage">How long have you been in business?</Label>
                 <Select value={formData.growthStage} onValueChange={(value) => handleInputChange('growthStage', value)}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select your business stage" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="idea">Just starting - still planning</SelectItem>
                     <SelectItem value="startup">New business - less than 2 years</SelectItem>
                     <SelectItem value="growth">Growing - 2-5 years</SelectItem>
                     <SelectItem value="mature">Established - 5+ years</SelectItem>
                     <SelectItem value="scale">Expanding to new markets</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div>
                 <Label htmlFor="competitiveAdvantage">What makes you different from competitors?</Label>
                 <Input
                   id="competitiveAdvantage"
                   value={formData.competitiveAdvantage}
                   onChange={(e) => handleInputChange('competitiveAdvantage', e.target.value)}
                   placeholder="e.g., Better customer service, Lower prices, Unique features, Local expertise"
                 />
               </div>

               <div>
                 <Label>What are your biggest challenges right now?</Label>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                   {[
                     'Finding new customers', 
                     'Keeping existing customers', 
                     'Managing cash flow', 
                     'Hiring good people', 
                     'Keeping up with technology', 
                     'Competition from bigger companies',
                     'Government regulations',
                     'Supply chain issues',
                     'Marketing and advertising'
                   ].map((challenge) => (
                     <button
                       key={challenge}
                       type="button"
                       onClick={() => {
                         const newPainPoints = formData.painPoints.includes(challenge)
                           ? formData.painPoints.filter(p => p !== challenge)
                           : [...formData.painPoints, challenge];
                         handleInputChange('painPoints', newPainPoints);
                       }}
                       className={`p-2 text-sm rounded border transition-colors ${
                         formData.painPoints.includes(challenge)
                           ? 'bg-primary/10 border-primary text-primary'
                           : 'bg-background border-border hover:border-primary/50'
                       }`}
                     >
                       {challenge}
                     </button>
                   ))}
                 </div>
               </div>

               <div>
                 <Label>What would success look like for your business?</Label>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                   {[
                     'More customers', 
                     'Higher profits', 
                     'Better work-life balance', 
                     'Expanding to new locations', 
                     'Hiring more employees', 
                     'Selling the business',
                     'Becoming the market leader',
                     'Creating passive income',
                     'Making a positive impact'
                   ].map((goal) => (
                     <button
                       key={goal}
                       type="button"
                       onClick={() => {
                         const newSuccessFactors = formData.successFactors.includes(goal)
                           ? formData.successFactors.filter(s => s !== goal)
                           : [...formData.successFactors, goal];
                         handleInputChange('successFactors', newSuccessFactors);
                       }}
                       className={`p-2 text-sm rounded border transition-colors ${
                         formData.successFactors.includes(goal)
                           ? 'bg-primary/10 border-primary text-primary'
                           : 'bg-background border-border hover:border-primary/50'
                       }`}
                     >
                       {goal}
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
            {currentSection === 'user' ? 'Continue to Company Profile' : currentSection === 'company' ? 'Continue to Business Structure' : 'Complete Profile Setup'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
