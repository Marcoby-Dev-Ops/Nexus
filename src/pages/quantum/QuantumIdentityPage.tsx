import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Building2, Users, Heart, Target, Eye, Edit, Save, X, Upload, Globe, FileText, Award, Target as TargetIcon, Lightbulb, Shield, Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Separator } from '@/shared/components/ui/Separator';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Label } from '@/shared/components/ui/Label';
import { useAuth } from '@/hooks/index';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { useToast } from '@/shared/components/ui/use-toast';
import { companyKnowledgeService, type CompanyKnowledgeData } from '@/services/CompanyKnowledgeService';
import { CompanyProfileAssistant } from '@/components/ai/CompanyProfileAssistant';

interface QuantumIdentityPageProps {
  className?: string;
}



const QuantumIdentityPage: React.FC<QuantumIdentityPageProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { setHeaderContent } = useHeaderContext();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [identityStrength, setIdentityStrength] = useState(75);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [companyData, setCompanyData] = useState<CompanyKnowledgeData>({
    companyName: '',
    legalName: '',
    ein: '',
    domain: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    industry: '',
    sector: '',
    companySize: '',
    foundedYear: '',
    businessType: '',
    mission: '',
    vision: '',
    motto: '',
    tagline: '',
    coreValues: [],
    cultureDescription: '',
    workStyle: '',
    brandDescription: '',
    targetAudience: '',
    uniqueValueProposition: '',
    competitiveAdvantages: '',
    revenueModel: '',
    pricingStrategy: '',
    keyPartners: '',
    keyActivities: '',
    keyResources: '',
    targetMarket: '',
    marketSize: '',
    competitors: '',
    marketPosition: '',
    shortTermGoals: '',
    longTermGoals: '',
    keyMetrics: '',
    challenges: '',
    opportunities: '',
    strengths: '',
    weaknesses: ''
  });

  // Load existing company knowledge data
  useEffect(() => {
    const loadCompanyKnowledge = async () => {
      if (profile?.company_id) {
        try {
          setIsLoading(true);
          const existingData = await companyKnowledgeService.getCompanyKnowledge(profile.company_id);
          if (existingData) {
            setCompanyData(existingData);
          }
          
          // Calculate knowledge strength
          const strength = await companyKnowledgeService.getKnowledgeStrength(profile.company_id);
          setIdentityStrength(strength);
        } catch (error) {
          console.error('Error loading company knowledge:', error);
          toast({
            title: 'Error',
            description: 'Failed to load company knowledge data.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadCompanyKnowledge();
  }, [profile?.company_id, toast]);

  // Set header content
  useEffect(() => {
    setHeaderContent('Business Identity', 'Define who you are, your mission, vision, and values');
    return () => setHeaderContent(null, null);
  }, []);

  // Determine active tab from URL
  useEffect(() => {
    if (location.pathname.includes('/profile')) {
      setActiveTab('profile');
    } else if (location.pathname.includes('/team')) {
      setActiveTab('team');
    } else if (location.pathname.includes('/brand')) {
      setActiveTab('brand');
    }
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Navigate to the appropriate route
    switch (value) {
      case 'profile':
        navigate('/quantum/identity/profile');
        break;
      case 'team':
        navigate('/quantum/identity/team');
        break;
      case 'brand':
        navigate('/quantum/identity/brand');
        break;
    }
  };

  const handleInputChange = (field: keyof CompanyKnowledgeData, value: string | string[]) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!profile?.company_id) {
      toast({
        title: 'Error',
        description: 'Company ID not found. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save to company knowledge base for RAG
      await companyKnowledgeService.saveCompanyKnowledge(profile.company_id, companyData);
      
      // Update knowledge strength
      const strength = await companyKnowledgeService.getKnowledgeStrength(profile.company_id);
      setIdentityStrength(strength);
      
      toast({
        title: 'Company Profile Updated',
        description: 'Your company knowledge base has been updated for AI analysis.',
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving company knowledge:', error);
      toast({
        title: 'Error',
        description: 'Failed to save company profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-600';
    if (strength >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength >= 80) return 'Strong';
    if (strength >= 60) return 'Good';
    return 'Needs Work';
  };

  const CompanyProfileForm = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Basic Information</span>
          </CardTitle>
          <CardDescription>
            Core company details and legal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={companyData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Your company name"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="legalName">Legal Name</Label>
              <Input
                id="legalName"
                value={companyData.legalName}
                onChange={(e) => handleInputChange('legalName', e.target.value)}
                placeholder="Legal business name"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="ein">EIN (Tax ID)</Label>
              <Input
                id="ein"
                value={companyData.ein}
                onChange={(e) => handleInputChange('ein', e.target.value)}
                placeholder="XX-XXXXXXX"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={companyData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                placeholder="yourcompany.com"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={companyData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourcompany.com"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="foundedYear">Founded Year</Label>
              <Input
                id="foundedYear"
                value={companyData.foundedYear}
                onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                placeholder="2020"
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Business Email</Label>
              <Input
                id="email"
                value={companyData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@yourcompany.com"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={companyData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={!isEditing}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={companyData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Business St"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={companyData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="San Francisco"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={companyData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="CA"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={companyData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="94105"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={companyData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="United States"
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mission & Vision */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TargetIcon className="h-5 w-5" />
            <span>Mission & Vision</span>
          </CardTitle>
          <CardDescription>
            Your company's purpose and future aspirations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mission">Mission Statement *</Label>
            <Textarea
              id="mission"
              value={companyData.mission}
              onChange={(e) => handleInputChange('mission', e.target.value)}
              placeholder="What is your company's purpose? Why do you exist?"
              rows={3}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="vision">Vision Statement</Label>
            <Textarea
              id="vision"
              value={companyData.vision}
              onChange={(e) => handleInputChange('vision', e.target.value)}
              placeholder="What is your aspirational future state?"
              rows={3}
              disabled={!isEditing}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="motto">Company Motto</Label>
              <Input
                id="motto"
                value={companyData.motto}
                onChange={(e) => handleInputChange('motto', e.target.value)}
                placeholder="Your company motto"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={companyData.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                placeholder="Your marketing tagline"
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Model */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Business Model</span>
          </CardTitle>
          <CardDescription>
            How your business creates, delivers, and captures value
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="industry">Industry *</Label>
              <Select value={companyData.industry} onValueChange={(value) => handleInputChange('industry', value)} disabled={!isEditing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="companySize">Company Size</Label>
              <Select value={companyData.companySize} onValueChange={(value) => handleInputChange('companySize', value)} disabled={!isEditing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="501-1000">501-1000 employees</SelectItem>
                  <SelectItem value="1000+">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="uniqueValueProposition">Unique Value Proposition *</Label>
            <Textarea
              id="uniqueValueProposition"
              value={companyData.uniqueValueProposition}
              onChange={(e) => handleInputChange('uniqueValueProposition', e.target.value)}
              placeholder="What makes your product/service unique? What value do you provide that competitors don't?"
              rows={3}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="revenueModel">Revenue Model</Label>
            <Textarea
              id="revenueModel"
              value={companyData.revenueModel}
              onChange={(e) => handleInputChange('revenueModel', e.target.value)}
              placeholder="How does your business generate revenue? (e.g., subscription, one-time sales, marketplace fees)"
              rows={2}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Market & Competition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Market & Competition</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="targetAudience">Target Audience *</Label>
            <Textarea
              id="targetAudience"
              value={companyData.targetAudience}
              onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              placeholder="Who are your ideal customers? Describe their characteristics, needs, and pain points."
              rows={3}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="competitors">Key Competitors</Label>
            <Textarea
              id="competitors"
              value={companyData.competitors}
              onChange={(e) => handleInputChange('competitors', e.target.value)}
              placeholder="Who are your main competitors? What are their strengths and weaknesses?"
              rows={3}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="marketPosition">Market Position</Label>
            <Textarea
              id="marketPosition"
              value={companyData.marketPosition}
              onChange={(e) => handleInputChange('marketPosition', e.target.value)}
              placeholder="How do you position yourself in the market? (e.g., premium, budget, innovative, traditional)"
              rows={2}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Goals & Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Goals & Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="shortTermGoals">Short-term Goals (6-12 months)</Label>
            <Textarea
              id="shortTermGoals"
              value={companyData.shortTermGoals}
              onChange={(e) => handleInputChange('shortTermGoals', e.target.value)}
              placeholder="What are your immediate business objectives?"
              rows={3}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="longTermGoals">Long-term Goals (1-5 years)</Label>
            <Textarea
              id="longTermGoals"
              value={companyData.longTermGoals}
              onChange={(e) => handleInputChange('longTermGoals', e.target.value)}
              placeholder="What are your strategic long-term objectives?"
              rows={3}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="keyMetrics">Key Performance Indicators</Label>
            <Textarea
              id="keyMetrics"
              value={companyData.keyMetrics}
              onChange={(e) => handleInputChange('keyMetrics', e.target.value)}
              placeholder="What metrics do you track to measure success? (e.g., revenue, customer satisfaction, market share)"
              rows={2}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`max-w-6xl mx-auto p-6 ${className}`}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading company knowledge...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/home')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Business Identity</h1>
            <p className="text-muted-foreground mt-2">
              The nucleus of your business - who you are, your mission, vision, values, and the people who make it happen
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Identity Strength</div>
              <div className={`text-lg font-semibold ${getStrengthColor(identityStrength)}`}>
                {getStrengthLabel(identityStrength)}
              </div>
            </div>
            <Progress value={identityStrength} className="w-24" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Company Profile</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Team & Culture</span>
          </TabsTrigger>
          <TabsTrigger value="brand" className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span>Brand & Values</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Company Profile Form */}
            <div className="lg:col-span-2">
              <CompanyProfileForm />
            </div>

            {/* AI Assistant Sidebar */}
            <div className="lg:col-span-1">
              <CompanyProfileAssistant
                onSuggestionAccepted={(fieldName, value) => {
                  setCompanyData(prev => ({
                    ...prev,
                    [fieldName]: value
                  }));
                }}
                onCompletionUpdate={(percentage) => {
                  setIdentityStrength(percentage);
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Team & Culture</span>
              </CardTitle>
              <CardDescription>
                People, roles, and organizational culture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Team & Culture Management</h3>
                <p className="text-muted-foreground mb-4">
                  Manage your team structure, roles, and organizational culture.
                </p>
                <p className="text-sm text-muted-foreground">
                  This feature is coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>Brand & Values</span>
              </CardTitle>
              <CardDescription>
                Brand positioning and core values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Brand & Values Management</h3>
                <p className="text-muted-foreground mb-4">
                  Define your brand positioning, core values, and brand guidelines.
                </p>
                <p className="text-sm text-muted-foreground">
                  This feature is coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuantumIdentityPage;
