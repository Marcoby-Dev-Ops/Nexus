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
import { useCompany } from '@/shared/contexts/CompanyContext';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { companyService } from '@/services/core/CompanyService';
import { userService } from '@/services/core/UserService';
import { logger } from '@/shared/utils/logger';

const companyProfileSchema = z.object({
  // Core Identity
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().min(2, 'Industry is required'),
  size: z.string().min(1, 'Company size is required'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  
  // Business Context
  headquarters: z.string().max(200, 'Headquarters must be 200 characters or less').optional(),
  founded: z.string().regex(/^\d{4}$/, 'Please enter a valid 4-digit year').optional().or(z.literal('')),
  growth_stage: z.string().optional(),
  
  
  // Contact Information
  business_phone: z.string()
    .regex(/^(\+?[1-9]\d{0,3}[-.\s]?)?\(?([0-9]{1,4})\)?[-.\s]?([0-9]{1,4})[-.\s]?([0-9]{1,9})$/, 'Please enter a valid phone number with country code (e.g., +1 555 123-4567)')
    .optional()
    .or(z.literal('')),
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
  "Startup",
  "Early Stage",
  "Growth Stage",
  "Mature",
  "Enterprise",
  "Scale-up"
];

export function CompanyProfilePage() {
  const { user } = useAuth();
  const { completeStep } = useOnboardingService();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use CompanyContext for company data
  const { company, loading: isLoadingCompany, refreshCompany, updateCompany } = useCompany();
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

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: '',
      industry: '',
      size: '',
      website: '',
      description: '',
      headquarters: '',
      founded: '',
      growth_stage: '',
      business_phone: '',
    }
  });

  // Sync form with company data
  useEffect(() => {
    if (company) {
      const companyData = company as any;
      console.log('CompanyProfilePage - Syncing form with company data:', {
        companyData,
        mappedData: {
          name: companyData.name || '',
          industry: companyData.industry || '',
          size: companyData.size || '',
          website: companyData.website || '',
          description: companyData.description || '',
          headquarters: companyData.headquarters || '',
          founded: companyData.founded || '',
          growth_stage: companyData.growth_stage || '',
          business_phone: formatPhoneNumber(companyData.business_phone) || '',
        }
      });
      
      console.log('Form data being submitted:', {
        formData: {
          name: companyData.name || '',
          industry: companyData.industry || '',
          size: companyData.size || '',
          website: companyData.website || '',
          description: companyData.description || '',
          headquarters: companyData.headquarters || '',
          founded: companyData.founded || '',
          growth_stage: companyData.growth_stage || '',
          business_phone: formatPhoneNumber(companyData.business_phone) || '',
        }
      });
      
      reset({
        name: companyData.name || '',
        industry: companyData.industry || '',
        size: companyData.size || '',
        website: companyData.website || '',
        description: companyData.description || '',
        headquarters: companyData.headquarters || '',
        founded: companyData.founded || '',
        growth_stage: companyData.growth_stage || '',
        business_phone: formatPhoneNumber(companyData.business_phone) || '',
      });
    }
  }, [company, reset]);

  const onSubmit = async (data: any) => {
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
        const ownedCompanyResult = await companyService.getCompanyByOwner(profile.id);
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
      const companyData = {
        name: data.name,
        industry: data.industry,
        size: data.size,
        description: data.description,
        website: data.website,
        headquarters: data.headquarters,
        founded: data.founded,
        growth_stage: data.growth_stage,
        business_phone: data.business_phone,
      };

      console.log('CompanyProfilePage - Prepared company data', { companyData });

      if (isCreating) {
        console.log('CompanyProfilePage - Creating new company');
        const createResult = await companyService.create({
          ...companyData,
          owner_id: profile?.id // Set the current user as owner
        });
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
        await updateCompany(companyData);
        console.log('CompanyProfilePage - Company updated successfully');
      }

      // Refresh company data
      await refreshCompany(true);
      
      toast({
        title: "Success",
        description: `Company ${isCreating ? 'created' : 'updated'} successfully`,
      });

      // Navigate to dashboard after successful save
      navigate('/dashboard');
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                <div>
                  <label htmlFor="headquarters" className="block text-sm font-medium mb-1">Headquarters</label>
                  <Controller
                    name="headquarters"
                    control={control}
                    render={({ field }) => <Input id="headquarters" {...field} placeholder="San Francisco, CA" />}
                  />
                  {errors.headquarters && <p className="text-sm text-destructive mt-1">{errors.headquarters.message}</p>}
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
