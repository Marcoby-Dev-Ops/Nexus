import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { Badge } from '../ui/Badge';
import { 
  Building2, 
  Users, 
  Crown,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useEnhancedUser } from '../../contexts/EnhancedUserContext';

interface OrganizationData {
  organization_name: string;
  organization_type: 'solo' | 'startup' | 'small_business' | 'medium_business' | 'large_business' | 'enterprise';
  team_size: string;
  expected_users: string;
  industry: string;
  needs_team_licenses: boolean;
}

interface OrganizationSetupStepProps {
  onNext: (data: OrganizationData) => void;
  onBack?: () => void;
}

export const OrganizationSetupStep: React.FC<OrganizationSetupStepProps> = ({ onNext, onBack }) => {
  const { user, updateCompany } = useEnhancedUser();
  const [orgData, setOrgData] = useState<OrganizationData>({
    organization_name: '',
    organization_type: 'startup',
    team_size: '2-5',
    expected_users: '1-3',
    industry: '',
    needs_team_licenses: false
  });

  const organizationTypes = [
    {
      id: 'solo' as const,
      title: 'Solo/Freelancer',
      description: 'Just me working independently',
      icon: '👤',
      teamSize: '1',
      pricing: 'Individual plan'
    },
    {
      id: 'startup' as const,
      title: 'Startup',
      description: 'Small team, fast growth',
      icon: '🚀',
      teamSize: '2-10',
      pricing: 'Team plan'
    },
    {
      id: 'small_business' as const,
      title: 'Small Business',
      description: 'Established local/regional business',
      icon: '🏢',
      teamSize: '11-50',
      pricing: 'Business plan'
    },
    {
      id: 'medium_business' as const,
      title: 'Medium Business',
      description: 'Growing company with multiple departments',
      icon: '🏬',
      teamSize: '51-200',
      pricing: 'Professional plan'
    },
    {
      id: 'large_business' as const,
      title: 'Large Business',
      description: 'Multi-location, complex operations',
      icon: '🏭',
      teamSize: '201-1000',
      pricing: 'Enterprise plan'
    },
    {
      id: 'enterprise' as const,
      title: 'Enterprise',
      description: 'Large corporation, extensive needs',
      icon: '🌆',
      teamSize: '1000+',
      pricing: 'Custom enterprise'
    }
  ];

  const industries = [
    'Technology/SaaS', 'E-commerce/Retail', 'Healthcare', 'Financial Services',
    'Manufacturing', 'Professional Services', 'Education', 'Real Estate',
    'Marketing/Advertising', 'Media/Entertainment', 'Non-profit', 'Consulting',
    'Legal', 'Construction', 'Food & Beverage', 'Transportation', 'Other'
  ];

  const expectedUsersOptions = [
    '1-3 users', '4-10 users', '11-25 users', '26-50 users', 
    '51-100 users', '100+ users'
  ];

  const getSelectedOrgType = () => {
    return organizationTypes.find(type => type.id === orgData.organization_type);
  };

  const getUpsellMessage = () => {
    const selectedType = getSelectedOrgType();
    if (!selectedType) return null;

    if (['medium_business', 'large_business', 'enterprise'].includes(selectedType.id)) {
      return {
        title: '🎯 Perfect for your organization!',
        message: 'Larger teams get volume discounts and dedicated support',
        benefits: ['Volume licensing discounts', 'Dedicated customer success', 'Priority support', 'Custom integrations'],
        action: 'Get Team Pricing'
      };
    }

    if (['startup', 'small_business'].includes(selectedType.id)) {
      return {
        title: '💡 Planning to grow your team?',
        message: 'Add team members anytime with flexible licensing',
        benefits: ['Easy user management', 'Team collaboration features', 'Shared workspace', 'Admin controls'],
        action: 'Learn About Team Plans'
      };
    }

    return null;
  };

  const handleSubmit = async () => {
    // Update company information
    try {
      if (user?.profile?.company_id) {
        await updateCompany({
          name: orgData.organization_name,
          industry: orgData.industry,
          size: getSelectedOrgType()?.teamSize || '',
          settings: {
            organization_type: orgData.organization_type,
            expected_users: orgData.expected_users,
            needs_team_licenses: orgData.needs_team_licenses
          }
        });
      }
    } catch (error) {
      console.error('Error updating organization info:', error);
    }
    
    onNext(orgData);
  };

  const upsellInfo = getUpsellMessage();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <Building2 className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Tell Us About Your Organization</h2>
        <p className="text-muted-foreground">
          Let's set up Nexus for your company size and needs
        </p>
      </div>

      <div className="grid gap-6">
        {/* Organization Name */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Enter your company or organization name"
              value={orgData.organization_name}
              onChange={(e) => setOrgData(prev => ({ ...prev, organization_name: e.target.value }))}
              className="text-lg"
            />
          </CardContent>
        </Card>

        {/* Organization Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Organization Type
            </CardTitle>
            <p className="text-sm text-muted-foreground">Choose the option that best describes your organization</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizationTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                    orgData.organization_type === type.id 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-border'
                  }`}
                  onClick={() => setOrgData(prev => ({ 
                    ...prev, 
                    organization_type: type.id,
                    team_size: type.teamSize
                  }))}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <h3 className="font-semibold text-sm mb-1">{type.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{type.description}</p>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">{type.teamSize}</Badge>
                    <span className="text-xs text-primary font-medium">{type.pricing}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Industry Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Industry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {industries.map((industry) => (
                <Button
                  key={industry}
                  variant={orgData.industry === industry ? "default" : "outline"}
                  className="justify-start h-auto p-3 text-sm"
                  onClick={() => setOrgData(prev => ({ ...prev, industry }))}
                >
                  {industry}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expected Users (for non-solo) */}
        {orgData.organization_type !== 'solo' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Expected Nexus Users
              </CardTitle>
              <p className="text-sm text-muted-foreground">How many people will use Nexus in your organization?</p>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={orgData.expected_users}
                onValueChange={(value) => setOrgData(prev => ({ 
                  ...prev, 
                  expected_users: value,
                  needs_team_licenses: !value.startsWith('1-3')
                }))}
              >
                {expectedUsersOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Upsell Section */}
        {upsellInfo && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Crown className="h-5 w-5" />
                {upsellInfo.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{upsellInfo.message}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {upsellInfo.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-success" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full border-primary text-primary hover:bg-primary hover:text-white"
              >
                {upsellInfo.action}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-between">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={!orgData.organization_name || !orgData.industry}
          className="ml-auto"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}; 