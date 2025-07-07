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
  TrendingUp,
  Globe,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '../../lib/core/supabase';
import { useToast } from '@/components/ui/Toast';
import { microsoftTeamsService } from '@/lib/services/microsoftTeamsService';
import { linkedinService } from '@/lib/services/linkedinService';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import type { Company } from '@/types/supabase';
import { InformationCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface OrganizationData {
  name: string;
  domain: string;
  industry: string;
  size: string;
  tagline?: string;
  motto?: string;
  mission_statement?: string;
  vision_statement?: string;
  about_md?: string;
  description?: string;
  logo?: string;
  website?: string;
  social_profiles?: string[];
  founded?: string;
  headquarters?: string;
  specialties?: string[];
  employee_count?: number;
  followers_count?: number;
  microsoft_365?: {
    tenant_id?: string;
    organization_name?: string;
    verified_domain?: boolean;
    subscription_type?: string;
    user_count?: number;
  };
}

interface EnrichmentStatus {
  isEnriching: boolean;
  success: boolean;
  error?: string;
  enrichedFields: string[];
}

interface OrganizationSetupStepProps {
  onNext: (data: { enriched_data: OrganizationData }) => void;
  onBack: () => void;
}

export const OrganizationSetupStep: React.FC<OrganizationSetupStepProps> = ({ onNext, onBack }) => {
  const { user, updateCompany, updateProfile, completeOnboarding } = useAuth();
  const company = user?.company;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [enrichmentStatus, setEnrichmentStatus] = useState<EnrichmentStatus>({
    isEnriching: false,
    success: false,
    enrichedFields: [],
  });
  const [data, setData] = useState<OrganizationData>({
    name: company?.name || '',
    domain: company?.domain || '',
    industry: company?.industry || '',
    size: company?.size || '',
    tagline: '',
    motto: '',
    mission_statement: '',
    vision_statement: '',
    about_md: '',
  });

  const handleEnrichment = async () => {
    setEnrichmentStatus({
      isEnriching: true,
      success: false,
      enrichedFields: [],
    });

    try {
      const response = await fetch('/api/company-enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: data.domain,
          companyName: data.name,
          microsoftToken: await (microsoftTeamsService as any).getStoredTokens(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enrich company data');
      }

      const enrichedData = await response.json();
      const enrichedFields: string[] = [];

      // Track which fields were enriched
      if (enrichedData.name && enrichedData.name !== data.name) enrichedFields.push('name');
      if (enrichedData.industry && enrichedData.industry !== data.industry) enrichedFields.push('industry');
      if (enrichedData.size && enrichedData.size !== data.size) enrichedFields.push('size');
      if (enrichedData.description) enrichedFields.push('description');
      if (enrichedData.logo) enrichedFields.push('logo');
      if (enrichedData.website) enrichedFields.push('website');
      if (enrichedData.social_profiles?.length) enrichedFields.push('social_profiles');
      if (enrichedData.founded) enrichedFields.push('founded');
      if (enrichedData.headquarters) enrichedFields.push('headquarters');
      if (enrichedData.specialties?.length) enrichedFields.push('specialties');
      if (enrichedData.employee_count) enrichedFields.push('employee_count');
      if (enrichedData.followers_count) enrichedFields.push('followers_count');
      if (enrichedData.microsoft_365) enrichedFields.push('microsoft_365');

      // Update form data with enriched values
      setData(prev => ({
        ...prev,
        ...enrichedData,
      }));

      setEnrichmentStatus({
        isEnriching: false,
        success: true,
        enrichedFields,
      });

      showToast({
        title: 'Success',
        description: `Successfully enriched ${enrichedFields.length} fields`,
        type: 'success',
      });

      setShowPreview(true);
    } catch (error) {
      console.error('Error enriching company data:', error);
      setEnrichmentStatus({
        isEnriching: false,
        success: false,
        error: 'Failed to enrich company data. Please check your domain and try again.',
        enrichedFields: [],
      });
      showToast({
        title: 'Error',
        description: 'Failed to enrich company data',
        type: 'error',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update company info in Supabase
      const { error: updateError } = await supabase
        .from('companies')
        .upsert({
          id: company?.id,
          name: data.name,
          domain: data.domain,
          industry: data.industry,
          size: data.size,
          description: data.description,
          logo: data.logo,
          website: data.website,
          social_profiles: data.social_profiles,
          founded: data.founded,
          headquarters: data.headquarters,
          specialties: data.specialties,
          employee_count: data.employee_count,
          followers_count: data.followers_count,
          microsoft_365: data.microsoft_365,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        throw updateError;
      }

      // Update user profile with company info
      if (!user) throw new Error('No authenticated user');
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          company_id: company?.id,
          role: user.role,
          department: data.industry,
          job_title: data.size,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        throw profileError;
      }

      // Upsert AI company profile details
      await supabase
        .from('ai_company_profiles')
        .upsert({
          company_id: company?.id,
          tagline: data.tagline,
          motto: data.motto,
          mission_statement: data.mission_statement,
          vision_statement: data.vision_statement,
          about_md: data.about_md,
        });

      // Trigger embedding generation (fire & forget)
      try {
        await supabase.functions.invoke('ai_embed_company_profile', {
          body: { company_id: company?.id },
        });
      } catch (err) {
        console.warn('Embedding invoke failed', err);
      }

      showToast({
        title: 'Success',
        description: 'Organization information updated successfully',
        type: 'success',
      });

      onNext({ enriched_data: data });

    } catch (error) {
      console.error('Error submitting organization data:', error);
      showToast({
        title: 'Error',
        description: 'Failed to update organization information',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftConnect = async () => {
    try {
      await microsoftTeamsService.initiateAuth();
    } catch (error) {
      console.error('Error connecting Microsoft:', error);
      showToast({
        title: 'Error',
        description: 'Failed to connect Microsoft account',
        type: 'error',
      });
    }
  };

  const handleLinkedInConnect = async () => {
    try {
      await linkedinService.initiateAuth();
    } catch (error) {
      console.error('Error connecting LinkedIn:', error);
      showToast({
        title: 'Error',
        description: 'Failed to connect LinkedIn account',
        type: 'error',
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Organization Setup</h2>
      
      {/* Privacy Notice */}
      <div className="mb-6 p-4 bg-primary/5 rounded-lg">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-primary mr-2" />
          <div>
            <h3 className="text-sm font-medium text-primary/80">Data Privacy Notice</h3>
            <p className="text-sm text-primary/90 mt-1">
              We collect and process your company information to provide personalized services.
              Your data is encrypted and stored securely. We only use this information to improve
              your experience and provide relevant insights.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground/90">
              Company Name
            </label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-foreground/90">
              Company Domain
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <Input
                id="domain"
                type="text"
                value={data.domain}
                onChange={(e) => setData({ ...data, domain: e.target.value })}
                placeholder="example.com"
                required
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleEnrichment}
                disabled={!data.domain || enrichmentStatus.isEnriching}
                className="ml-3"
              >
                {enrichmentStatus.isEnriching ? 'Enriching...' : 'Enrich Data'}
              </Button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your company's domain to automatically fetch additional information
            </p>
          </div>

          {/* Enrichment Status */}
          {enrichmentStatus.isEnriching && (
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground">Enriching company data...</p>
            </div>
          )}

          {enrichmentStatus.error && (
            <div className="p-4 bg-destructive/5 rounded-lg">
              <div className="flex">
                <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-destructive">{enrichmentStatus.error}</p>
              </div>
                  </div>
          )}

          {enrichmentStatus.success && (
            <div className="p-4 bg-success/5 rounded-lg">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-success mr-2" />
                <div>
                  <p className="text-sm text-success">Successfully enriched company data</p>
                  <p className="text-xs text-success mt-1">
                    Enriched fields: {enrichmentStatus.enrichedFields.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-foreground/90">
              Industry
            </label>
            <Select
              value={data.industry}
              onValueChange={(value) => setData({ ...data, industry: value })}
              disabled={false}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select an industry</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="size" className="block text-sm font-medium text-foreground/90">
              Company Size
            </label>
            <Select
              value={data.size}
              onValueChange={(value) => setData({ ...data, size: value })}
              disabled={false}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select company size</SelectItem>
                <SelectItem value="1-10">1-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-500">201-500 employees</SelectItem>
                <SelectItem value="501-1000">501-1000 employees</SelectItem>
                <SelectItem value="1001+">1001+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tagline */}
          <div>
            <label htmlFor="tagline" className="block text-sm font-medium text-foreground/90">
              Company Tagline
            </label>
            <Input
              id="tagline"
              type="text"
              value={data.tagline || ''}
              onChange={(e) => setData({ ...data, tagline: e.target.value })}
              placeholder="e.g., Automate the 20% that eats 80% of your day"
              className="mt-1"
            />
          </div>
        </div>

        {/* Data Preview */}
        {showPreview && (
          <div className="mt-6 p-4 bg-background rounded-lg">
            <h3 className="text-lg font-medium mb-4">Enriched Data Preview</h3>
            <div className="grid grid-cols-2 gap-4">
              {data.description && (
                <div>
                  <label className="block text-sm font-medium text-foreground/90">Description</label>
                  <p className="mt-1 text-sm text-muted-foreground">{data.description}</p>
                </div>
              )}
              {data.website && (
                <div>
                  <label className="block text-sm font-medium text-foreground/90">Website</label>
                  <p className="mt-1 text-sm text-muted-foreground">{data.website}</p>
                </div>
              )}
              {data.headquarters && (
                <div>
                  <label className="block text-sm font-medium text-foreground/90">Headquarters</label>
                  <p className="mt-1 text-sm text-muted-foreground">{data.headquarters}</p>
                </div>
              )}
              {data.founded && (
                <div>
                  <label className="block text-sm font-medium text-foreground/90">Founded</label>
                  <p className="mt-1 text-sm text-muted-foreground">{data.founded}</p>
                </div>
              )}
              {data.specialties && data.specialties.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground/90">Specialties</label>
                  <p className="mt-1 text-sm text-muted-foreground">{data.specialties.join(', ')}</p>
                </div>
              )}
              {data.employee_count && (
                <div>
                  <label className="block text-sm font-medium text-foreground/90">Employee Count</label>
                  <p className="mt-1 text-sm text-muted-foreground">{data.employee_count}</p>
                </div>
              )}
            </div>
                  </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Connect Accounts</h3>
              <p className="text-sm text-muted-foreground">
                Connect your Microsoft 365 and LinkedIn accounts to automatically fetch company information
              </p>
                  </div>
            <div className="space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleMicrosoftConnect}
                className="flex items-center"
              >
                <img src="/microsoft-logo.svg" alt="Microsoft" className="w-5 h-5 mr-2" />
                Connect Microsoft
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={handleLinkedInConnect}
                className="flex items-center"
              >
                <img src="/linkedin-logo.svg" alt="LinkedIn" className="w-5 h-5 mr-2" />
                Connect LinkedIn
              </Button>
            </div>
          </div>
      </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" isLoading={loading}>
            Continue
          </Button>
        </div>
      </form>
    </Card>
  );
}; 