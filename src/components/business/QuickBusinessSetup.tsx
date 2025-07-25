import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Input } from '@/shared/components/ui/Input.tsx';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { useToast } from '@/shared/ui/components/Toast';
import { Building2, Users, DollarSign, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { supabase } from "@/lib/supabase";
import { useOrganizationStore } from '@/shared/stores/organizationStore.ts';

interface MarcobyProfile {
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

export const QuickBusinessSetup: React.FC = () => {
  const { toast, showToast } = useToast() as any;
  const { user } = useAuth();
  const { activeOrgId, loadMemberships } = useOrganizationStore();
  const [profile, setProfile] = useState<MarcobyProfile>({
    companyName: 'Marcoby',
    industry: 'Technology Consulting',
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

  const addToArray = (field: keyof MarcobyProfile, value: string, setter: (val: string) => void) => {
    if (!value.trim()) return;
    
    setProfile(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()]
    }));
    setter('');
  };

  const removeFromArray = (field: keyof MarcobyProfile, index: number) => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      if (!user) throw new Error('You must be logged in to save your business profile');

      // Determine organisation context (take first membership for now)
      const orgId = activeOrgId;
      if (!orgId) throw new Error('No organisation selected.');

      // Persist to Supabase (upsert per-org)
      const { error } = await supabase
        .from('business_profiles')
        .upsert(
          {
            org_id: orgId,
            company_name: profile.companyName,
            industry: profile.industry,
            business_model: profile.businessModel,
            primary_services: profile.primaryServices,
            unique_value_proposition: profile.valueProposition,
            target_markets: profile.targetMarkets,
            ideal_client_profile: profile.idealCustomerProfile,
            current_clients: [profile.totalClients.toString()],
            revenue_model: profile.monthlyRevenue.toString(),
            pricing_strategy: profile.averageDealSize.toString(),
            strategic_objectives: Array.isArray(profile.shortTermGoals) ? profile.shortTermGoals : [profile.shortTermGoals],
            financial_goals: Array.isArray(profile.currentChallenges) ? profile.currentChallenges : [profile.currentChallenges],
          },
          { onConflict: 'org_id' }
        );

      if (error) throw error;

      // Also cache locally so advisor can work offline / before round-trip fetch
      localStorage.setItem('marcoby_business_profile', JSON.stringify(profile));

      // Generate AI context for business understanding and cache
      const businessContext = generateBusinessContext(profile);
      localStorage.setItem('business_ai_context', businessContext);

      (showToast || toast)({
        title: 'Success!',
        description: 'Marcoby business profile saved. Nexus now understands your business!',
        variant: 'default'
      });
    } catch (err: any) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to save business profile', err);
      (showToast || toast)({
        title: 'Error',
        description: err?.message ?? 'Failed to save business profile',
        variant: 'destructive'
      });
    }
  };

  const generateBusinessContext = (profile: MarcobyProfile): string => {
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

Use this context to provide specific, actionable business advice tailored to Marcoby's situation as a ${profile.businessModel} in the ${profile.industry} space.
    `.trim();
  };

  const generateInsights = (profile: MarcobyProfile): string => {
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
  };

  React.useEffect(() => {
    if (user) {
      loadMemberships(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Marcoby Business Profile Setup
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
          <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <Input
                value={profile.companyName}
                onChange={(e) => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Marcoby"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Industry</label>
              <Input
                value={profile.industry}
                onChange={(e) => setProfile(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="Technology Consulting"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Business Model</label>
              <select
                className="w-full p-2 border rounded-md"
                value={profile.businessModel}
                onChange={(e) => setProfile(prev => ({ ...prev, businessModel: e.target.value }))}
              >
                <option value="B2B Consulting">B2B Consulting</option>
                <option value="B2C Services">B2C Services</option>
                <option value="SaaS">SaaS</option>
                <option value="E-commerce">E-commerce</option>
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
            <label className="block text-sm font-medium mb-2">Primary Services</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                placeholder="e.g., IT Consulting, Cloud Migration"
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
            <label className="block text-sm font-medium mb-2">Unique Value Proposition</label>
            <Textarea
              value={profile.valueProposition}
              onChange={(e) => setProfile(prev => ({ ...prev, valueProposition: e.target.value }))}
              placeholder="What makes Marcoby unique? Why do clients choose you over competitors?"
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
            <label className="block text-sm font-medium mb-2">Target Markets</label>
            <div className="flex gap-2 mb-2">
              <Input
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
            <label className="block text-sm font-medium mb-2">Ideal Customer Profile</label>
            <Textarea
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
          <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Total Clients</label>
              <Input
                type="number"
                value={profile.totalClients || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, totalClients: parseInt(e.target.value) || 0 }))}
                placeholder="25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Active Clients</label>
              <Input
                type="number"
                value={profile.activeClients || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, activeClients: parseInt(e.target.value) || 0 }))}
                placeholder="18"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Monthly Revenue ($)</label>
              <Input
                type="number"
                value={profile.monthlyRevenue || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, monthlyRevenue: parseInt(e.target.value) || 0 }))}
                placeholder="15000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Average Deal Size ($)</label>
              <Input
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
            <label className="block text-sm font-medium mb-2">Short-term Goals (6-12 months)</label>
            <div className="flex gap-2 mb-2">
              <Input
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
            <label className="block text-sm font-medium mb-2">Current Challenges</label>
            <div className="flex gap-2 mb-2">
              <Input
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
          <Button onClick={handleSave} className="w-full" size="lg">
            Save Marcoby Profile & Enable AI Business Intelligence
          </Button>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            This will enable Nexus to understand your business and provide personalized advice
          </p>
        </CardContent>
      </Card>
    </div>
  );
}; 