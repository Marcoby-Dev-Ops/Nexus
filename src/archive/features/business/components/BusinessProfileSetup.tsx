import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/components/ui/Toast';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { businessProfileService, BusinessProfile } from '@/shared/lib/business/businessProfileService';
import {
  Building2,
  Users,
  Target,
  DollarSign,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Plus,
  X
} from 'lucide-react';

interface BusinessProfileSetupProps {
  onComplete?: () => void;
}

export const BusinessProfileSetup: React.FC<BusinessProfileSetupProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<BusinessProfile>>({});
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { title: 'Company Identity', icon: <Building2 className="w-5 h-5" /> },
    { title: 'What We Do', icon: <Lightbulb className="w-5 h-5" /> },
    { title: 'Who We Serve', icon: <Users className="w-5 h-5" /> },
    { title: 'How We Serve', icon: <Target className="w-5 h-5" /> },
    { title: 'Current Clients', icon: <Users className="w-5 h-5" /> },
    { title: 'Revenue & Pricing', icon: <DollarSign className="w-5 h-5" /> },
    { title: 'Goals & Strategy', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  useEffect(() => {
    loadExistingProfile();
  }, [user]);

  const loadExistingProfile = async () => {
    if (!user?.org_id) return;
    
    const existingProfile = await businessProfileService.getBusinessProfile(user.org_id);
    if (existingProfile) {
      setProfile(existingProfile);
    }
  };

  const handleSave = async () => {
    if (!user?.org_id) return;
    
    setIsLoading(true);
    const success = await businessProfileService.saveBusinessProfile(user.org_id, profile);
    
    if (success) {
      toast({
        title: 'Success',
        description: 'Business profile saved successfully!',
        variant: 'default'
      });
      onComplete?.();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to save business profile',
        variant: 'destructive'
      });
    }
    setIsLoading(false);
  };

  const addToArray = (field: keyof BusinessProfile, value: string) => {
    if (!value.trim()) return;
    
    setProfile(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[] || []), value.trim()]
    }));
  };

  const removeFromArray = (field: keyof BusinessProfile, index: number) => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev[field] as string[])?.filter((_, i) => i !== index) || []
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Company Identity
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <Input
                  value={profile.company_name || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="e.g., Marcoby"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <Input
                  value={profile.industry || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Technology Consulting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Business Model</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={profile.business_model || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, business_model: e.target.value }))}
                >
                  <option value="">Select business model</option>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                  <option value="SaaS">SaaS</option>
                  <option value="Consulting">Consulting</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Marketplace">Marketplace</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company Size</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={profile.company_size || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, company_size: e.target.value as any }))}
                >
                  <option value="">Select size</option>
                  <option value="solopreneur">Solopreneur</option>
                  <option value="startup">Startup (2-10)</option>
                  <option value="small">Small (11-50)</option>
                  <option value="medium">Medium (51-200)</option>
                  <option value="enterprise">Enterprise (200+)</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Mission Statement</label>
              <Textarea
                value={profile.mission_statement || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, mission_statement: e.target.value }))}
                placeholder="What is your company's purpose and mission?"
                rows={3}
              />
            </div>
          </div>
        );

      case 1: // What We Do
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Primary Services</label>
              <ArrayInput
                items={profile.primary_services || []}
                onAdd={(value) => addToArray('primary_services', value)}
                onRemove={(index) => removeFromArray('primary_services', index)}
                placeholder="e.g., IT Consulting, Cloud Migration"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Unique Value Proposition</label>
              <Textarea
                value={profile.unique_value_proposition || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, unique_value_proposition: e.target.value }))}
                placeholder="What makes your business unique? Why do clients choose you?"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Competitive Advantages</label>
              <ArrayInput
                items={profile.competitive_advantages || []}
                onAdd={(value) => addToArray('competitive_advantages', value)}
                onRemove={(index) => removeFromArray('competitive_advantages', index)}
                placeholder="e.g., 15+ years experience, proprietary methodology"
              />
            </div>
          </div>
        );

      case 2: // Who We Serve
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Target Markets</label>
              <ArrayInput
                items={profile.target_markets || []}
                onAdd={(value) => addToArray('target_markets', value)}
                onRemove={(index) => removeFromArray('target_markets', index)}
                placeholder="e.g., Small Businesses, Healthcare, Manufacturing"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Ideal Customer Pain Points</label>
              <ArrayInput
                items={profile.ideal_customer_profile?.pain_points || []}
                onAdd={(value) => {
                  setProfile(prev => ({
                    ...prev,
                    ideal_customer_profile: {
                      ...prev.ideal_customer_profile,
                      pain_points: [...(prev.ideal_customer_profile?.pain_points || []), value]
                    }
                  }));
                }}
                onRemove={(index) => {
                  setProfile(prev => ({
                    ...prev,
                    ideal_customer_profile: {
                      ...prev.ideal_customer_profile,
                      pain_points: prev.ideal_customer_profile?.pain_points?.filter((_, i) => i !== index) || []
                    }
                  }));
                }}
                placeholder="e.g., Outdated technology, Security concerns"
              />
            </div>
          </div>
        );

      case 3: // How We Serve
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Service Delivery Methods</label>
              <ArrayInput
                items={profile.service_delivery_methods || []}
                onAdd={(value) => addToArray('service_delivery_methods', value)}
                onRemove={(index) => removeFromArray('service_delivery_methods', index)}
                placeholder="e.g., On-site consulting, Remote support, Training"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Communication Channels</label>
              <ArrayInput
                items={profile.communication_channels || []}
                onAdd={(value) => addToArray('communication_channels', value)}
                onRemove={(index) => removeFromArray('communication_channels', index)}
                placeholder="e.g., Email, Phone, Slack, Teams"
              />
            </div>
          </div>
        );

      case 4: // Current Clients
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Total Clients</label>
                <Input
                  type="number"
                  value={profile.total_clients || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, total_clients: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Active Clients</label>
                <Input
                  type="number"
                  value={profile.active_clients || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, active_clients: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 20"
                />
              </div>
            </div>
          </div>
        );

      case 5: // Revenue & Pricing
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Monthly Recurring Revenue</label>
                <Input
                  type="number"
                  value={profile.monthly_recurring_revenue || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, monthly_recurring_revenue: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 15000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Average Deal Size</label>
                <Input
                  type="number"
                  value={profile.average_deal_size || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, average_deal_size: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 2500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Payment Methods</label>
              <ArrayInput
                items={profile.payment_methods || []}
                onAdd={(value) => addToArray('payment_methods', value)}
                onRemove={(index) => removeFromArray('payment_methods', index)}
                placeholder="e.g., Credit Card, ACH, Check"
              />
            </div>
          </div>
        );

      case 6: // Goals & Strategy
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Short-term Goals (6-12 months)</label>
              <ArrayInput
                items={profile.short_term_goals || []}
                onAdd={(value) => addToArray('short_term_goals', value)}
                onRemove={(index) => removeFromArray('short_term_goals', index)}
                placeholder="e.g., Increase revenue by 30%, Hire 2 developers"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Long-term Goals (1-3 years)</label>
              <ArrayInput
                items={profile.long_term_goals || []}
                onAdd={(value) => addToArray('long_term_goals', value)}
                onRemove={(index) => removeFromArray('long_term_goals', index)}
                placeholder="e.g., Expand to new markets, Launch SaaS product"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Current Challenges</label>
              <ArrayInput
                items={profile.current_challenges || []}
                onAdd={(value) => addToArray('current_challenges', value)}
                onRemove={(index) => removeFromArray('current_challenges', index)}
                placeholder="e.g., Finding qualified talent, Scaling operations"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Business Profile Setup
          </CardTitle>
          <p className="text-muted-foreground">
            Help Nexus understand your business so it can provide intelligent advice and insights.
          </p>
        </CardHeader>
        
        <CardContent>
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStep
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted bg-background'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Current Step */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">{steps[currentStep].title}</h3>
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              {currentStep < steps.length - 1 ? (
                <Button onClick={() => setCurrentStep(currentStep + 1)}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Complete Setup'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for array inputs
const ArrayInput: React.FC<{
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}> = ({ items, onAdd, onRemove, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {item}
            <button onClick={() => onRemove(index)} className="ml-1">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}; 