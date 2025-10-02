import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/index';
import { useOnboardingService } from '@/shared/hooks/useUnifiedPlaybook';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { useToast } from '@/shared/components/ui/use-toast';
import { useCompany, useBusinessIdentity } from '@/shared/contexts/CompanyContext';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { companyApi } from '@/services/api/CompanyApi';
import { userService } from '@/services/core/UserService';
import { logger } from '@/shared/utils/logger';
import { getIndustryValue } from '@/lib/identity/industry-options';

import { companyProfileSchema as sharedCompanyProfileSchema } from '@/shared/validation/schemas';

// Extend the shared company profile schema with form-specific fields that map to
// business identity and structured address storage.
const companyProfileSchema = sharedCompanyProfileSchema.extend({
  headquarters: z.object({
    address: z.string().max(200, 'Address must be 200 characters or less').optional().or(z.literal('')),
    city: z.string().max(100, 'City must be 100 characters or less').optional().or(z.literal('')),
    state: z.string().max(100, 'State must be 100 characters or less').optional().or(z.literal('')),
    zipCode: z.string().max(20, 'ZIP Code must be 20 characters or less').optional().or(z.literal('')),
    country: z.string().max(100, 'Country must be 100 characters or less').optional().or(z.literal('')),
  }).optional(),
  founded: z.string().regex(/^\d{4}$/, 'Please enter a valid 4-digit year').optional().or(z.literal('')),
  growth_stage: z.string().optional().or(z.literal('')),
  business_phone: z.string().optional().or(z.literal('')),
});

type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;

// Helper function to format phone numbers with international support
const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // If already has + prefix, preserve it
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Remove all non-digits for processing
  const digits = phone.replace(/\D/g, '');
  
  // Handle different digit lengths
  if (digits.length === 11 && digits.startsWith('1')) {
    // US/Canada number with country code
    const number = digits.slice(1);
    return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
  } else if (digits.length === 10) {
    // US/Canada number without country code
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length > 11) {
    // International number - add + prefix
    return `+${digits}`;
  }
  
  // Return original if not standard format
  return phone;
};

const industryOptions = [
  "Technology",
  "Healthcare",
  "Finance",
  "Retail",
  "Manufacturing",
  "Education",
  "Real Estate",
  "Consulting",
  "Marketing & Advertising",
  "Legal Services",
  "Non-profit",
  "Food & Beverage",
  "Hospitality & Tourism",
  "Transportation & Logistics",
  "Energy & Utilities",
  "Construction",
  "Media & Entertainment",
  "Fashion & Apparel",
  "Automotive",
  "Agriculture",
  "Pharmaceuticals",
  "Telecommunications",
  "Aerospace & Defense",
  "Biotechnology",
  "Environmental Services",
  "Sports & Fitness",
  "Beauty & Personal Care",
  "Home & Garden",
  "Pet Services",
  "Professional Services",
  "Creative Arts",
  "Government",
  "Other"
];
const sizeOptions = ["1-10 employees", "11-50 employees", "51-200 employees", "201-500 employees", "501-1000 employees", "1000+ employees"];

const growthStageOptions = [
  'Startup',
  'Growth',
  'Mature',
  'Enterprise'
];

export function CompanyProfilePage() {
  const { user } = useAuth();
  const { completeStep } = useOnboardingService();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use CompanyContext for company data
  const { company, loading: isLoadingCompany, refreshCompany, updateCompany } = useCompany();
  const { businessIdentity, updateBusinessIdentity, refreshBusinessIdentity } = useBusinessIdentity();
  const { profile } = useUserProfile();
  const [isUpdating, setIsUpdating] = useState(false);

  // Debug logging for company state
  useEffect(() => {
    logger.info('CompanyProfilePage - Company state changed', {
      hasCompany: !!company,
      companyId: company?.id,
      companyName: company?.name,
      isLoading: isLoadingCompany
    });
  }, [company, isLoadingCompany]);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: '',
      industry: '',
      size: '',
      website: '',
      description: '',
      headquarters: { address: '', city: '', state: '', zipCode: '', country: '' },
      founded: '',
      growth_stage: '',
      business_phone: '',
    }
  });

  // Sync form with company data
  useEffect(() => {
    if (company) {
      const companyData = company as any;

      // Prefer business identity values when available so both pages stay in sync.
      const identityFoundation = (businessIdentity as any)?.foundation || {};

      // company records use `address` (object) while the form exposes a single `headquarters` string.
      const existingHeadquarters =
        // First prefer identity.foundation.headquarters.address
        (identityFoundation.headquarters && (identityFoundation.headquarters.address || ''))
        // Next prefer companies.address.address
        || (companyData.address && (companyData.address.address || companyData.address))
        // Fallback to legacy top-level field if present
        || companyData.headquarters
        || '';

      // For founded, the identity stores a date (YYYY-MM-DD). The profile form uses a 4-digit year.
      const identityFounded = identityFoundation.foundedDate || '';
      const foundedYear = identityFounded ? String(identityFounded).slice(0, 4) : (companyData.founded || '');

      const mapped = {
        name: companyData.name || '',
        industry: companyData.industry || '',
        size: companyData.size || '',
        website: companyData.website || '',
        description: companyData.description || '',
        headquarters: (identityFoundation.headquarters && {
          address: identityFoundation.headquarters.address || '',
          city: identityFoundation.headquarters.city || '',
          state: identityFoundation.headquarters.state || '',
          zipCode: identityFoundation.headquarters.zipCode || '',
          country: identityFoundation.headquarters.country || '',
        }) || (companyData.address && {
          address: companyData.address.address || '',
          city: companyData.address.city || '',
          state: companyData.address.state || '',
          zipCode: companyData.address.zipCode || '',
          country: companyData.address.country || '',
        }) || { address: '', city: '', state: '', zipCode: '', country: '' },
        founded: foundedYear,
        // Prefer identity.companyStage if present (maps to companyStage in foundation)
        growth_stage: identityFoundation.companyStage || companyData.growth_stage || '',
        business_phone: identityFoundation.phone || formatPhoneNumber(companyData.business_phone) || '',
      };

      console.log('CompanyProfilePage - Syncing form with company and identity data:', { companyData, identityFoundation, mapped });

      reset(mapped);
    }
  }, [company, businessIdentity, reset]);

  const onSubmit = async (data: CompanyProfileFormData) => {
    console.log('CompanyProfilePage - Form submission started', { 
      hasCompany: !!company, 
      companyId: company?.id,
      formData: data,
      userId: profile?.id 
    });
    
    console.log('Raw form data received:', data);

    try {
      setIsUpdating(true);
      
      // Check if user already owns a company
      let existingCompany = company;
      if (!existingCompany && profile?.id) {
        console.log('CompanyProfilePage - Checking for existing company owned by user');
        const ownedCompanyResult = await companyApi.getCompanyByOwner(profile.id);
        if (ownedCompanyResult.success && ownedCompanyResult.data) {
          existingCompany = ownedCompanyResult.data;
          console.log('CompanyProfilePage - Found existing owned company', { 
            companyId: existingCompany.id,
            companyName: existingCompany.name 
          });
        }
      }

      const isCreating = !existingCompany?.id;
      console.log('CompanyProfilePage - Operation mode', { isCreating, existingCompanyId: existingCompany?.id });
      
      // Transform form data to match API expectations
      // The API expects an `address` field (JSON) on companies. The form exposes a single
      // `headquarters` string. Map that to `address.address` so the server updates the
      // existing JSONB `address` column instead of attempting to write a non-existent
      // `headquarters` column.
      // Build the payload for updating the `companies` table — do NOT include
      // `founded` as a top-level field because the companies table does not
      // have a `founded` column. Instead, send the founded year to the
      // business identity store below.
      const companyData = {
        name: data.name,
        industry: getIndustryValue(data.industry),
        size: data.size,
        description: data.description,
        website: data.website,
        // companies.address expects a structured object; pass the headquarters object
        address: data.headquarters,
        // Do NOT include growth_stage or business_phone as top-level columns - they do not exist on companies.
      };

      console.log('CompanyProfilePage - Prepared company data', { companyData });

      if (isCreating) {
        console.log('CompanyProfilePage - Creating new company');
        const createResult = await companyApi.create({
          ...(companyData as any),
          owner_id: profile?.id // Set the current user as owner (server expects owner_id)
        } as any);
        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to create company');
        }
        console.log('CompanyProfilePage - Company created successfully', createResult);
        
        // Update user profile to associate with new company
        if (createResult.data?.id && profile?.id) {
          await userService.upsertAuthProfile(profile.id, {
            company_id: createResult.data.id,
            role: 'owner'
          });
        }
      } else {
        console.log('CompanyProfilePage - Updating existing company', { companyId: existingCompany!.id });
        // Update core company fields
        await updateCompany(companyData);

        // Keep business identity in sync: update foundation.headquarters and foundation.foundedDate
        if (updateBusinessIdentity) {
          const identityUpdates: any = { foundation: {} };

          if (data.headquarters) {
            identityUpdates.foundation.headquarters = {
              address: data.headquarters.address,
              city: data.headquarters.city,
              state: data.headquarters.state,
              zipCode: data.headquarters.zipCode,
              country: data.headquarters.country,
            };
          }

          if (data.founded) {
            // Convert a 4-digit year into YYYY-01-01 format for the identity's foundedDate
            const year = String(data.founded).slice(0, 4);
            identityUpdates.foundation.foundedDate = `${year}-01-01`;
          }

          // Map business phone into the identity (foundation.phone)
          if (data.business_phone) {
            identityUpdates.foundation.phone = data.business_phone;
          }

          // Map growth_stage to foundation.companyStage when present
          if (data.growth_stage) {
            identityUpdates.foundation.companyStage = data.growth_stage;
          }

          // Only call if we have something to update
          if (Object.keys(identityUpdates.foundation).length > 0) {
            try {
              // Ensure industry is canonical when syncing to identity as well
              if (data.industry) {
                identityUpdates.foundation.industry = getIndustryValue(data.industry);
              }

              await updateBusinessIdentity(identityUpdates);
              // Ensure identity is fresh before we reset the form / refresh company
              if (refreshBusinessIdentity) {
                try {
                  await refreshBusinessIdentity(true);
                } catch (refreshErr) {
                  console.warn('Failed to refresh business identity after update', refreshErr);
                }
              }
            } catch (err) {
              console.warn('Failed to update business identity from profile page', err);
            }
          }
        }

        console.log('CompanyProfilePage - Company updated successfully');
      }

      // Refresh company data
      await refreshCompany(true);
      
      toast({
        title: "Success",
        description: `Company ${isCreating ? 'created' : 'updated'} successfully`,
      });

  // Stay on the profile page after successful save (no redirect)
    } catch (error) {
      console.error('CompanyProfilePage - Form submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save company',
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Show loading state while fetching company data
  if (isLoadingCompany) {
    return (
      <div className="space-y-6">
        <Card className="w-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading company information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{company?.id ? 'Company Profile' : 'Tell Us About Your Company'}</CardTitle>
          <CardDescription>
            {company?.id 
              ? 'This organizational context shapes how Nexus interacts with all users in your company. Update to keep insights accurate and relevant.'
              : 'This organizational context will help Nexus provide the right business context for all users in your company.'
            }
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Company Identity Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Company Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Company Name *</label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => <Input id="name" {...field} placeholder="e.g., Acme Inc." />}
                  />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium mb-1">Website</label>
                  <Controller
                    name="website"
                    control={control}
                    render={({ field }) => <Input id="website" {...field} placeholder="https://www.example.com" />}
                  />
                  {errors.website && <p className="text-sm text-destructive mt-1">{errors.website.message}</p>}
                </div>
                <div>
                  <label htmlFor="business_phone" className="block text-sm font-medium mb-1">Business Phone</label>
                  <Controller
                    name="business_phone"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="business_phone" 
                        {...field} 
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        onChange={(e) => {
                          // Allow international format with + prefix
                          let value = e.target.value;
                          
                          // If starts with +, preserve international format
                          if (value.startsWith('+')) {
                            field.onChange(value);
                            return;
                          }
                          
                          // Auto-format US numbers as user types
                          const digits = value.replace(/\D/g, '');
                          if (digits.length >= 6) {
                            value = `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
                          } else if (digits.length >= 3) {
                            value = `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
                          } else if (digits.length > 0) {
                            value = `+1 ${digits}`;
                          }
                          field.onChange(value);
                        }}
                      />
                    )}
                  />
                  {errors.business_phone && <p className="text-sm text-destructive mt-1">{errors.business_phone.message}</p>}
                </div>
              </div>
            </div>
            {/* Business Context Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Business Context</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="industry" className="block text-sm font-medium mb-1">Industry *</label>
                  <Controller
                    name="industry"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={async (value) => {
                          // Update the form control
                          field.onChange(value)

                          // Keep the business identity in sync live when possible
                          // Use canonical industry value before updating company/identity
                          try {
                            const canonical = getIndustryValue(value)
                            // Update top-level company record if it differs
                            if (company && company.id) {
                              // updateCompany is available from context — prefer it when present
                              try {
                                await updateCompany({ industry: canonical } as any)
                              } catch (e) {
                                // Fall back to the companyService flow handled elsewhere
                                console.warn('Failed to update company.industry via context', e)
                              }
                            }

                            // Also update business identity foundation.industry if available
                            if (updateBusinessIdentity) {
                              try {
                                await updateBusinessIdentity({ foundation: { industry: canonical } } as any)
                              } catch (e) {
                                console.warn('Failed to update business identity industry from profile select', e)
                              }
                            }
                          } catch (err) {
                            console.warn('Error syncing industry selection', err)
                          }
                        }}
                        value={field.value}
                      >
                        <SelectTrigger><SelectValue placeholder="Select an industry" /></SelectTrigger>
                        <SelectContent>
                          {industryOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.industry && <p className="text-sm text-destructive mt-1">{errors.industry.message}</p>}
                </div>
                <div>
                  <label htmlFor="size" className="block text-sm font-medium mb-1">Company Size *</label>
                  <Controller
                    name="size"
                    control={control}
                    render={({ field }) => {
                      console.log('Size field value:', field.value, 'Available options:', sizeOptions);
                      return (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select a size" /></SelectTrigger>
                          <SelectContent>
                            {sizeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      );
                    }}
                  />
                  {errors.size && <p className="text-sm text-destructive mt-1">{errors.size.message}</p>}
                </div>
                <div>
                  <label htmlFor="growth_stage" className="block text-sm font-medium mb-1">Growth Stage</label>
                  <Controller
                    name="growth_stage"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select growth stage" /></SelectTrigger>
                        <SelectContent>
                          {growthStageOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.growth_stage && <p className="text-sm text-destructive mt-1">{errors.growth_stage.message}</p>}
                </div>
                <div>
                  <label htmlFor="founded" className="block text-sm font-medium mb-1">Founded Year</label>
                  <Controller
                    name="founded"
                    control={control}
                    render={({ field }) => <Input id="founded" {...field} placeholder="2020" maxLength={4} />}
                  />
                  {errors.founded && <p className="text-sm text-destructive mt-1">{errors.founded.message}</p>}
                </div>
                <div className="col-span-1 md:col-span-2">
                  <h4 className="text-sm font-medium mb-2">Headquarters</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="headquarters.address" className="block text-sm font-medium mb-1">Street Address</label>
                      <Controller
                        name="headquarters.address"
                        control={control}
                        render={({ field }) => <Input id="headquarters.address" {...field} placeholder="123 Main St" />}
                      />
                    </div>
                    <div>
                      <label htmlFor="headquarters.city" className="block text-sm font-medium mb-1">City</label>
                      <Controller
                        name="headquarters.city"
                        control={control}
                        render={({ field }) => <Input id="headquarters.city" {...field} placeholder="San Francisco" />}
                      />
                    </div>
                    <div>
                      <label htmlFor="headquarters.state" className="block text-sm font-medium mb-1">State/Province</label>
                      <Controller
                        name="headquarters.state"
                        control={control}
                        render={({ field }) => <Input id="headquarters.state" {...field} placeholder="CA" />}
                      />
                    </div>
                    <div>
                      <label htmlFor="headquarters.zipCode" className="block text-sm font-medium mb-1">ZIP/Postal Code</label>
                      <Controller
                        name="headquarters.zipCode"
                        control={control}
                        render={({ field }) => <Input id="headquarters.zipCode" {...field} placeholder="94105" />}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="headquarters.country" className="block text-sm font-medium mb-1">Country</label>
                      <Controller
                        name="headquarters.country"
                        control={control}
                        render={({ field }) => <Input id="headquarters.country" {...field} placeholder="United States" />}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Business Description Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Business Description</h3>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Company Description</label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => <Textarea id="description" {...field} placeholder="What does your company do? This helps Nexus understand your business context." />}
                />
                {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || isUpdating}>
                {isSubmitting || isUpdating ? 'Saving...' : (company?.id ? 'Save Changes' : 'Create Profile')}
              </Button>
              {company && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => refreshCompany(true)}
                  disabled={isLoadingCompany}
                >
                  {isLoadingCompany ? 'Refreshing...' : 'Refresh'}
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 
