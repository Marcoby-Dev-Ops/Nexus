import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { supabase } from '@/core/supabase';
import { useToast } from '@/shared/components/ui/Toast';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/Select';
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
  const { user } = useAuth();
  const company = user?.company;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [enrichmentStatus, setEnrichmentStatus] = useState<EnrichmentStatus>({
    isEnriching: false,
    success: false,
    enrichedFields: [],
  });
  const [data, setData] = useState<OrganizationData>({
    name: company?.name || getPendingCompanyName(),
    domain: company?.domain || '',
    industry: company?.industry || '',
    size: company?.size || '',
    tagline: '',
    motto: '',
    mission_statement: '',
    vision_statement: '',
    about_md: '',
  });
  const [companyExists, setCompanyExists] = useState<null | { id: string; name: string; owner_id: string }>(null);

  // --- Domain Verification State ---
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
  const [verificationCode] = useState<string>(() => {
    // Generate a code on mount (in real app, get from backend)
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('pending_verification_code');
      if (existing) return existing;
      const code = 'nexus-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('pending_verification_code', code);
      return code;
    }
    return '';
  });
  const [verifying, setVerifying] = useState(false);

  // Validation helpers
  function isValidDomain(domain: string): boolean {
    return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain);
  }
  function isValidUrl(url: string): boolean {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  const [domainError, setDomainError] = useState<string | null>(null);
  const [websiteError, setWebsiteError] = useState<string | null>(null);

  // Note: OAuth connections are now handled in a separate IntegrationsSetupStep
  // This component focuses only on company profile data

  const handleEnrichment = async () => {
    setEnrichmentStatus({
      isEnriching: true,
      success: false,
      enrichedFields: [],
    });

    try {
      // Get the user's session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      const response = await fetch('/api/company-enrichment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          domain: data.domain,
          companyName: data.name,
          // Note: OAuth tokens are now handled in IntegrationsSetupStep
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

      // Update form data with enriched values (do not force domain/website)
      setData(prev => ({
        ...prev,
        ...enrichedData,
      }));

      setEnrichmentStatus({
        isEnriching: false,
        success: true,
        enrichedFields,
      });

      toast({
        title: 'Success',
        description: `Successfully enriched ${enrichedFields.length} fields`,
        variant: 'default',
      });

      setShowPreview(true);
    } catch {
      // Log error for debugging but don't expose to user
      setEnrichmentStatus({
        isEnriching: false,
        success: false,
        error: 'Failed to enrich company data. Please check your domain and try again.',
        enrichedFields: [],
      });
      toast({
        title: 'Error',
        description: 'Failed to enrich company data',
        variant: 'destructive',
      });
    }
  };

  // Check for existing company by name on mount or when name changes
  useEffect(() => {
    const checkCompany = async () => {
      if (!data.name.trim()) {
        setCompanyExists(null);
        return;
      }
      const { data: found, error } = await supabase
        .from('companies')
        .select('id, name')
        .ilike('name', data.name.trim());
      if (!error && found && found.length > 0) {
        // Since there's no owner_id field, we'll just use the first match
        setCompanyExists({ id: found[0].id, name: found[0].name, owner_id: 'unknown' });
      } else {
        setCompanyExists(null);
      }
    };
    checkCompany();
  }, [data.name]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isValidDomain(data.domain)) {
      setDomainError("Enter a valid domain (e.g. marcoby.com)");
      return;
    }
    if (!isValidUrl(safeString(data.website))) {
      setWebsiteError("Enter a valid URL (e.g. https://marcoby.com)");
      return;
    }
    setLoading(true);

    try {
      if (companyExists) {
        // Company exists, offer to join (pending approval)
        // Prevent claiming if not owner
        if (companyExists.owner_id === user?.id) {
          toast({
            title: 'You are the owner of this company.',
            description: 'You can update the company profile.',
            variant: 'default',
          });
        } else {
          // Request to join (could be implemented as a pending request in DB)
          toast({
            title: 'Join Request Sent',
            description: 'Your request to join this company is pending approval by the owner.',
            variant: 'default',
          });
          // TODO: Implement backend logic for join requests
          setLoading(false);
          return;
        }
      } else {
        // Create new company and assign user as owner
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
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
            owner_id: user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (createError) throw createError;

        // Update user profile with new company info
        if (!user) throw new Error('No authenticated user');
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            company_id: newCompany.id,
            role: 'owner',
            department: data.industry,
            job_title: data.size,
            updated_at: new Date().toISOString(),
          });
        if (profileError) throw profileError;

        // Upsert AI company profile details
        await supabase
          .from('ai_company_profiles')
          .upsert({
            company_id: newCompany.id,
            user_id: user.id,
            profile_data: {
              tagline: data.tagline,
              motto: data.motto,
              mission_statement: data.mission_statement,
              vision_statement: data.vision_statement,
              about_md: data.about_md,
            },
          });

        // Trigger embedding generation (fire & forget)
        try {
          await supabase.functions.invoke('ai_embed_company_profile', {
            body: { company_id: newCompany.id },
          });
        } catch {
          // Embedding failed but not critical
        }

        toast({
          title: 'Success',
          description: 'Organization created and you are the owner.',
          variant: 'default',
        });

        // Remove pending company name from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pending_company_name');
        }

        onNext({ enriched_data: data });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update organization information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to ensure string value for input fields
  function safeString(val: string | undefined): string {
    return typeof val === 'string' ? val : '';
  }

  // Helper to get pending company name from signup
  function getPendingCompanyName() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pending_company_name') || '';
    }
    return '';
  }

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
              value={safeString(data.name)}
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
                value={safeString(data.domain) || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setData({ ...data, domain: value });
                  setDomainError(isValidDomain(value) ? null : "Enter a valid domain (e.g. marcoby.com)");
                  setVerificationStatus('unverified');
                }}
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
            {domainError && <p className="text-xs text-destructive mt-1">{domainError}</p>}
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your company's domain to automatically fetch additional information
            </p>
            {/* --- Domain Verification UI --- */}
            {data.domain && (
              <div className="mt-4 p-4 bg-primary/5 rounded">
                <h4 className="font-semibold mb-2">Verify Domain Ownership</h4>
                <p>
                  Add the following TXT record to your DNS for <b>{data.domain}</b>:
                </p>
                <pre className="bg-background p-2 rounded mt-2 select-all">
                  nexus-verification={verificationCode}
                </pre>
                <Button
                  type="button"
                  onClick={async () => {
                    setVerifying(true);
                    // TODO: Call backend to check DNS TXT record
                    setTimeout(() => {
                      // Simulate result for now
                      setVerificationStatus('pending');
                      setVerifying(false);
                    }, 1200);
                  }}
                  disabled={verifying}
                  className="mt-2"
                >
                  {verifying ? 'Verifying...' : 'Verify Now'}
                </Button>
                {verificationStatus === 'pending' && (
                  <p className="text-warning mt-2">Verification not found. Please try again after DNS propagation.</p>
                )}
                {verificationStatus === 'verified' && (
                  <p className="text-success mt-2">Domain verified!</p>
                )}
              </div>
            )}
            {!data.domain && (
              <div className="mt-4 p-4 bg-warning/5 rounded">
                <h4 className="font-semibold mb-2">No Domain Provided</h4>
                <p>
                  You can create your company now, but will need to verify ownership later to unlock all features.
                </p>
              </div>
            )}
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
              value={typeof data.industry === 'string' ? data.industry : ''}
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
              value={typeof data.size === 'string' ? data.size : ''}
              onValueChange={(value) => setData({ ...data, size: value })}
              disabled={false}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select company size</SelectItem>
                <SelectItem value="startup">Startup (1-50 employees)</SelectItem>
                <SelectItem value="small">Small (51-200 employees)</SelectItem>
                <SelectItem value="medium">Medium (201-1000 employees)</SelectItem>
                <SelectItem value="large">Large (1001-5000 employees)</SelectItem>
                <SelectItem value="enterprise">Enterprise (5000+ employees)</SelectItem>
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

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-foreground/90">
              Company Website
            </label>
            <Input
              id="website"
              type="text"
              value={safeString(data.website)}
              onChange={(e) => {
                const value = e.target.value;
                setData({ ...data, website: value });
                setWebsiteError(isValidUrl(safeString(value)) ? null : "Enter a valid URL (e.g. https://marcoby.com)");
              }}
              required
              className="flex-1"
            />
            {websiteError && <p className="text-xs text-destructive mt-1">{websiteError}</p>}
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

        {/* OAuth connections moved to separate IntegrationsSetupStep */}

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