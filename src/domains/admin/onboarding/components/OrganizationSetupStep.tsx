import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { supabase } from '@/core/supabase';
import { useToast } from '@/shared/components/ui/Toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/Dialog';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/Select';
import { InformationCircleIcon, CheckCircleIcon, XCircleIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { ArrowLeft, ArrowRight, Loader2, UsersIcon } from 'lucide-react';

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

interface ExistingCompany {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  description?: string | null;
  website?: string | null;
  created_at: string;
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
  
  // New state for existing company handling
  const [existingCompany, setExistingCompany] = useState<ExistingCompany | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joiningCompany, setJoiningCompany] = useState(false);
  
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

  // Check if company already exists
  const checkExistingCompany = async (companyName: string, domain?: string): Promise<ExistingCompany | null> => {
    try {
      if (domain) {
        // First try to find by exact domain match
        const { data: domainMatch, error: domainError } = await supabase
          .from('companies')
          .select('*')
          .eq('domain', domain)
          .single();

        if (domainMatch && !domainError) {
          return domainMatch as ExistingCompany;
        }
      }

      // Then try to find by name similarity
      const { data: nameMatch, error: nameError } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${companyName}%`)
        .limit(1)
        .single();

      if (nameMatch && !nameError) {
        return nameMatch as ExistingCompany;
      }

      return null;
    } catch (error) {
      console.error('Error checking existing company:', error);
      return null;
    }
  };

  // Handle joining existing company
  const handleJoinExistingCompany = async () => {
    if (!existingCompany || !user) return;
    
    setJoiningCompany(true);
    try {
      // Update user profile to link to existing company
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          company_id: existingCompany.id,
          role: 'user', // Default role when joining existing company
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      toast({
        title: 'Success',
        description: `You've joined ${existingCompany.name}!`,
        variant: 'default',
      });

      // Remove pending company name from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_company_name');
      }

      setShowJoinDialog(false);
      onNext({ enriched_data: data });
    } catch (error) {
      console.error('Error joining company:', error);
      toast({
        title: 'Error',
        description: 'Failed to join company. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setJoiningCompany(false);
    }
  };

  // Handle creating new company
  const handleCreateNewCompany = () => {
    setShowJoinDialog(false);
    setExistingCompany(null);
    // Continue with the existing flow
    handleSubmit(new Event('submit') as any);
  };

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
        description: `Found ${enrichedFields.length} fields from public data`,
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('=== FORM SUBMITTED ===');
    console.log('Form submitted, data:', data);

    // Make domain optional - only validate if provided
    if (data.domain && !isValidDomain(data.domain)) {
      setDomainError("Enter a valid domain (e.g. marcoby.com)");
      console.log('Domain validation failed');
      return;
    }
    // Make website optional - only validate if provided
    if (data.website && !isValidUrl(safeString(data.website))) {
      setWebsiteError("Enter a valid URL (e.g. https://marcoby.com)");
      console.log('Website validation failed');
      return;
    }
    
    console.log('Validation passed, checking for existing company');
    setLoading(true);

    try {
      // Check if company already exists
      const existing = await checkExistingCompany(data.name, data.domain);
      
      if (existing) {
        setExistingCompany(existing);
        setShowJoinDialog(true);
        setLoading(false);
        return;
      }

      // No existing company found, proceed with creation
      await createNewCompany();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: 'Error',
        description: 'Failed to update organization information',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const createNewCompany = async () => {
    try {
      // Create new company and assign user as owner
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          name: data.name,
          domain: data.domain || null, // Allow null domain
          industry: data.industry || null, // Allow null industry
          size: data.size || null, // Allow null size
          description: data.description,
          logo: data.logo,
          website: data.website || null, // Allow null website
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

      console.log('Company created:', newCompany);

      // Update user profile with new company info
      if (!user) throw new Error('No authenticated user');
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          company_id: newCompany.id,
          role: 'owner',
          department: data.industry || null,
          job_title: data.size || null,
          updated_at: new Date().toISOString(),
        });
      if (profileError) throw profileError;

      console.log('User profile updated');

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

      console.log('Calling onNext with data:', { enriched_data: data });
      onNext({ enriched_data: data });
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: 'Error',
        description: 'Failed to create organization',
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
    <>
      <Card className="w-full max-w-2xl mx-auto p-6">
        {/* Progress Indicator */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div>
              <h2 className="text-2xl font-bold">Organization Setup</h2>
              <p className="text-sm text-muted-foreground">Step 2 of 6</p>
            </div>
          </div>
        </div>
        
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
                Company Domain (Optional)
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
                  }}
                  placeholder="e.g., marcoby.com"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleEnrichment}
                  disabled={!data.domain || enrichmentStatus.isEnriching}
                  className="ml-3"
                >
                  {enrichmentStatus.isEnriching ? 'Looking up...' : 'Lookup Public Data'}
                </Button>
              </div>
              {domainError && <p className="text-xs text-destructive mt-1">{domainError}</p>}
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your company's domain to automatically lookup publicly available information (optional)
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
                    <p className="text-sm text-success">Found company data from public sources</p>
                    <p className="text-xs text-success mt-1">
                      Found fields: {enrichmentStatus.enrichedFields.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-foreground/90">
                Industry (Optional)
              </label>
              <Select
                value={typeof data.industry === 'string' ? data.industry : ''}
                onValueChange={(value) => setData({ ...data, industry: value })}
                disabled={false}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an industry (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select an industry (optional)</SelectItem>
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
                Company Size (Optional)
              </label>
              <Select
                value={typeof data.size === 'string' ? data.size : ''}
                onValueChange={(value) => setData({ ...data, size: value })}
                disabled={false}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select company size (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select company size (optional)</SelectItem>
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
                Company Website (Optional)
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
                placeholder="e.g., https://marcoby.com"
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

          <div className="flex justify-between items-center pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button 
                type="submit" 
                disabled={loading}
                className="min-w-[120px] bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Join Existing Company Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BuildingOfficeIcon className="h-5 w-5" />
              Company Already Exists
            </DialogTitle>
            <DialogDescription>
              We found an existing company that matches your information. Would you like to join this company or create a new one?
            </DialogDescription>
          </DialogHeader>
          
          {existingCompany && (
            <div className="space-y-4">
              <Alert>
                <BuildingOfficeIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>{existingCompany.name}</strong>
                  {existingCompany.domain && (
                    <span className="block text-sm text-muted-foreground">
                      Domain: {existingCompany.domain}
                    </span>
                  )}
                  {existingCompany.industry && (
                    <span className="block text-sm text-muted-foreground">
                      Industry: {existingCompany.industry}
                    </span>
                  )}
                  {existingCompany.description && (
                    <span className="block text-sm text-muted-foreground mt-2">
                      {existingCompany.description}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UsersIcon className="h-4 w-4" />
                <span>You'll join as a team member</span>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCreateNewCompany}
              disabled={joiningCompany}
              className="w-full sm:w-auto"
            >
              Create New Company
            </Button>
            <Button
              onClick={handleJoinExistingCompany}
              disabled={joiningCompany}
              className="w-full sm:w-auto"
            >
              {joiningCompany ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Join Company
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 