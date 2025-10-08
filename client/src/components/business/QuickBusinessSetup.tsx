import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/components/ui/use-toast';
import { Building2, Users, DollarSign, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks';
import { useOrganizationStore } from '@/shared/stores/organizationStore';
import { businessProfileService } from '@/shared/lib/business/businessProfileService';
import { logger } from '@/shared/utils/logger';

interface BusinessProfile {
  // Core Info
  companyName: string;
  industry: string;
  businessModel: string;
  
  // Services
  primaryServices: string[];
  valueProposition: string;
  
  // Market
  targetMarkets: string[];
  idealCustomerProfile: string;
  
  // Current State
  totalClients: number;
  activeClients: number;
  monthlyRevenue: number;
  averageDealSize: number;
  
  // Goals & Challenges
  shortTermGoals: string[];
  currentChallenges: string[];
}

interface BusinessProfileData {
  user_id: string;
  org_id: string;
  company_name: string;
  industry: string;
  business_model: string;
  primary_services: string[];
  unique_value_proposition: string;
  target_markets: string[];
  ideal_client_profile: string[];
  current_clients: string[];
  revenue_model: string;
  pricing_strategy: string;
  strategic_objectives: string[];
  financial_goals: string[];
}

export const QuickBusinessSetup: React.FC = () => {
  const { toast } = useToast();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  // only need to call loadMemberships here; avoid subscribing to activeOrgId
  const loadMemberships = useOrganizationStore((s) => s.loadMemberships);
  const [isLoading, setIsLoading] = useState(false);
  
  const [profile, setProfile] = useState<BusinessProfile>({
    companyName: '',
    industry: '',
    businessModel: 'B2B Consulting',
    primaryServices: [],
    valueProposition: '',
    targetMarkets: [],
    idealCustomerProfile: '',
    totalClients: 0,
    activeClients: 0,
    monthlyRevenue: 0,
    averageDealSize: 0,
    shortTermGoals: [],
    currentChallenges: []
  });

  const [newService, setNewService] = useState('');
  const [newMarket, setNewMarket] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newChallenge, setNewChallenge] = useState('');

  const addToArray = useCallback((field: keyof BusinessProfile, value: string, setter: (val: string) => void) => {
    if (!value.trim()) return;
    
    setProfile(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()]
    }));
    setter('');
  }, []);

  const removeFromArray = useCallback((field: keyof BusinessProfile, index: number) => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  }, []);

  const transformProfileToDatabaseFormat = useCallback((profile: BusinessProfile, userId: string, orgId: string): BusinessProfileData => {
    return {
      user_id: userId,
      org_id: orgId,
      company_name: profile.companyName,
      industry: profile.industry,
      business_model: profile.businessModel,
      primary_services: Array.isArray(profile.primaryServices) ? profile.primaryServices : (profile.primaryServices ? [String(profile.primaryServices)] : []),
      unique_value_proposition: profile.valueProposition,
      target_markets: Array.isArray(profile.targetMarkets) ? profile.targetMarkets : (profile.targetMarkets ? [String(profile.targetMarkets)] : []),
      ideal_client_profile: Array.isArray(profile.idealCustomerProfile) ? profile.idealCustomerProfile : (profile.idealCustomerProfile ? [String(profile.idealCustomerProfile)] : []),
      current_clients: [String(profile.totalClients || 0)],
      revenue_model: String(profile.monthlyRevenue || ''),
      pricing_strategy: String(profile.averageDealSize || ''),
      strategic_objectives: Array.isArray(profile.shortTermGoals) ? profile.shortTermGoals : (profile.shortTermGoals ? [String(profile.shortTermGoals)] : []),
      financial_goals: Array.isArray(profile.currentChallenges) ? profile.currentChallenges : (profile.currentChallenges ? [String(profile.currentChallenges)] : []),
    };
  }, []);

  const generateBusinessContext = useCallback((profile: BusinessProfile): string => {
    return `
BUSINESS CONTEXT FOR AI ASSISTANCE: Company: ${profile.companyName}
Industry: ${profile.industry}
Business Model: ${profile.businessModel}

SERVICES PROVIDED:
${profile.primaryServices.join(', ')}

VALUE PROPOSITION: ${profile.valueProposition}

TARGET MARKETS:
${profile.targetMarkets.join(', ')}

IDEAL CUSTOMER: ${profile.idealCustomerProfile}

CURRENT BUSINESS METRICS:
- Total Clients: ${profile.totalClients}
- Active Clients: ${profile.activeClients}
- Monthly Revenue: $${profile.monthlyRevenue.toLocaleString()}
- Average Deal Size: $${profile.averageDealSize.toLocaleString()}

BUSINESS GOALS: ${profile.shortTermGoals.join(', ')}

CURRENT CHALLENGES: ${profile.currentChallenges.join(', ')}

BUSINESS INTELLIGENCE INSIGHTS: ${generateInsights(profile)}

Use this context to provide specific, actionable business advice tailored to ${profile.companyName}'s situation as a ${profile.businessModel} in the ${profile.industry} space.
    `.trim();
  }, []);

  const generateInsights = useCallback((profile: BusinessProfile): string => {
    const insights = [];
    
    if (profile.totalClients > 0 && profile.monthlyRevenue > 0) {
      const revenuePerClient = profile.monthlyRevenue / profile.totalClients;
      insights.push(`Average revenue per client: $${revenuePerClient.toFixed(0)}/month`);
    }
    
    if (profile.totalClients > 20) {
      insights.push('Client base indicates readiness for scaling operations');
    }
    
    if (profile.activeClients / profile.totalClients < 0.8) {
      insights.push('Client retention may need attention - focus on engagement');
    }
    
    return insights.join('. ');
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to save your business profile',
        variant: 'destructive'
      });
      return;
    }

    if (!profile.companyName.trim()) {
      toast({
        title: 'Company Name Required',
        description: 'Please enter your company name to continue.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const businessProfileData = transformProfileToDatabaseFormat(profile, user.id, '');
      
      // Create organization and business profile in one transaction
      const result = await businessProfileService.createOrganizationWithProfile(
        user.id, // tenantId (using user.id as tenant for now)
        user.id, // userId
        profile.companyName, // orgName
        businessProfileData
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create organization and business profile');
      }

      // Cache locally for offline access
      localStorage.setItem('business_profile', JSON.stringify(profile));

      // Generate and cache AI context
      const businessContext = generateBusinessContext(profile);
      localStorage.setItem('business_ai_context', businessContext);

      // Update organization store with new organization
      if (result.data?.orgId) {
        localStorage.setItem('active_org_id', result.data.orgId);
        // Reload memberships to include the new organization
        await loadMemberships(user.id);
      }

      logger.info('Organization and business profile created successfully', { 
        userId: user.id, 
        orgId: result.data?.orgId,
        profileId: result.data?.profileId 
      });

      toast({
        title: 'Success!',
        description: 'Organization created and business profile saved. Nexus now understands your business!',
        variant: 'default'
      });
    } catch (error: unknown) {
      logger.error('Failed to create organization and business profile', { error, userId: user?.id });
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create organization and business profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, transformProfileToDatabaseFormat, generateBusinessContext, loadMemberships, toast]);

  // Check if user has valid authentication session
  const hasValidSession = () => {
    try {
      const sessionData = localStorage.getItem('authentik_session');
      if (!sessionData) return false;
      
      const session = JSON.parse(sessionData);
      // Check both possible locations for the access token
      return !!(session?.accessToken || session?.session?.accessToken);
    } catch {
      return false;
    }
  };

  React.useEffect(() => {
    // Wait for auth to be fully loaded and user to be authenticated
    if (authLoading) return;
    if (!user?.id) return;
    if (!isAuthenticated) return;
    if (!hasValidSession()) return;
    
    loadMemberships(user.id).catch((error: unknown) => {
      logger.error('Failed to load memberships', { error, userId: user.id });
    });
  }, [user?.id, authLoading, isAuthenticated, loadMemberships]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Business Profile Setup
          </CardTitle>
          <p className="text-muted-foreground">
            Tell Nexus about your business so it can provide intelligent, personalized advice.
          </p>
        </CardHeader>
      </Card>

      {/* Company Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium mb-2">Company Name</label>
              <Input
                id="companyName"
                value={profile.companyName}
                onChange={(e) => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>
            <div>
              <label htmlFor="industry" className="block text-sm font-medium mb-2">Industry</label>
              <Input
                id="industry"
                value={profile.industry}
                onChange={(e) => setProfile(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="e.g., Technology, Healthcare, Manufacturing"
              />
            </div>
            <div>
              <label htmlFor="businessModel" className="block text-sm font-medium mb-2">Business Model</label>
              <select
                id="businessModel"
                className="w-full p-2 border rounded-md"
                value={profile.businessModel}
                onChange={(e) => setProfile(prev => ({ ...prev, businessModel: e.target.value }))}
              >
                <option value="B2B Consulting">B2B Consulting</option>
                <option value="B2C Services">B2C Services</option>
                <option value="SaaS">SaaS</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Agency">Agency</option>
                <option value="Freelance">Freelance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            What You Do
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
            <label htmlFor="primaryServicesInput" className="block text-sm font-medium mb-2">Primary Services</label>
            <div className="flex gap-2 mb-2">
              <Input
                id="primaryServicesInput"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                placeholder="e.g., IT Consulting, Web Development, Marketing"
                onKeyPress={(e) => e.key === 'Enter' && addToArray('primaryServices', newService, setNewService)}
              />
              <Button onClick={() => addToArray('primaryServices', newService, setNewService)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.primaryServices.map((service, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer" 
                       onClick={() => removeFromArray('primaryServices', index)}>
                  {service} ×
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="valueProposition" className="block text-sm font-medium mb-2">Unique Value Proposition</label>
            <Textarea
              id="valueProposition"
              value={profile.valueProposition}
              onChange={(e) => setProfile(prev => ({ ...prev, valueProposition: e.target.value }))}
              placeholder="What makes your business unique? Why do clients choose you over competitors?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Target Market */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Who You Serve
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="targetMarketsInput" className="block text-sm font-medium mb-2">Target Markets</label>
            <div className="flex gap-2 mb-2">
              <Input
                id="targetMarketsInput"
                value={newMarket}
                onChange={(e) => setNewMarket(e.target.value)}
                placeholder="e.g., Healthcare, Small Business, Manufacturing"
                onKeyPress={(e) => e.key === 'Enter' && addToArray('targetMarkets', newMarket, setNewMarket)}
              />
              <Button onClick={() => addToArray('targetMarkets', newMarket, setNewMarket)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.targetMarkets.map((market, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer"
                       onClick={() => removeFromArray('targetMarkets', index)}>
                  {market} ×
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="idealCustomerProfile" className="block text-sm font-medium mb-2">Ideal Customer Profile</label>
            <Textarea
              id="idealCustomerProfile"
              value={profile.idealCustomerProfile}
              onChange={(e) => setProfile(prev => ({ ...prev, idealCustomerProfile: e.target.value }))}
              placeholder="Describe your ideal client: company size, industry, pain points, budget range..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Current Business Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="totalClients" className="block text-sm font-medium mb-2">Total Clients</label>
              <Input
                id="totalClients"
                type="number"
                value={profile.totalClients || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, totalClients: parseInt(e.target.value) || 0 }))}
                placeholder="25"
              />
            </div>
            <div>
              <label htmlFor="activeClients" className="block text-sm font-medium mb-2">Active Clients</label>
              <Input
                id="activeClients"
                type="number"
                value={profile.activeClients || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, activeClients: parseInt(e.target.value) || 0 }))}
                placeholder="18"
              />
            </div>
            <div>
              <label htmlFor="monthlyRevenue" className="block text-sm font-medium mb-2">Monthly Revenue ($)</label>
              <Input
                id="monthlyRevenue"
                type="number"
                value={profile.monthlyRevenue || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, monthlyRevenue: parseInt(e.target.value) || 0 }))}
                placeholder="15000"
              />
            </div>
            <div>
              <label htmlFor="averageDealSize" className="block text-sm font-medium mb-2">Average Deal Size ($)</label>
              <Input
                id="averageDealSize"
                type="number"
                value={profile.averageDealSize || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, averageDealSize: parseInt(e.target.value) || 0 }))}
                placeholder="2500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals & Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Goals & Challenges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <label htmlFor="shortTermGoalsInput" className="block text-sm font-medium mb-2">Short-term Goals (6-12 months)</label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="shortTermGoalsInput"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="e.g., Increase revenue by 30%, Hire assistant"
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('shortTermGoals', newGoal, setNewGoal)}
                />
              <Button onClick={() => addToArray('shortTermGoals', newGoal, setNewGoal)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.shortTermGoals.map((goal, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer"
                       onClick={() => removeFromArray('shortTermGoals', index)}>
                  {goal} ×
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="currentChallengesInput" className="block text-sm font-medium mb-2">Current Challenges</label>
            <div className="flex gap-2 mb-2">
              <Input
                id="currentChallengesInput"
                value={newChallenge}
                onChange={(e) => setNewChallenge(e.target.value)}
                placeholder="e.g., Time management, Lead generation, Administrative overhead"
                onKeyPress={(e) => e.key === 'Enter' && addToArray('currentChallenges', newChallenge, setNewChallenge)}
              />
              <Button onClick={() => addToArray('currentChallenges', newChallenge, setNewChallenge)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.currentChallenges.map((challenge, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer"
                       onClick={() => removeFromArray('currentChallenges', index)}>
                  {challenge} ×
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleSave} 
            className="w-full" 
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Business Profile & Enable AI Business Intelligence'}
          </Button>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            This will enable Nexus to understand your business and provide personalized advice
          </p>
        </CardContent>
      </Card>
    </div>
  );
}; 
