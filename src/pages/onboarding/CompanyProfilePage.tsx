import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/use-toast';

const companyProfileSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().min(2, 'Industry is required'),
  size: z.string().min(1, 'Company size is required'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  client_base_description: z.string().max(500, 'Client description must be 500 characters or less').optional(),
});

type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;

const industryOptions = ["Technology", "Healthcare", "Finance", "Retail", "Manufacturing", "Education", "Other"];
const sizeOptions = ["1-10 employees", "11-50 employees", "51-200 employees", "201-500 employees", "501-1000 employees", "1000+ employees"];

export function CompanyProfilePage() {
  const { user, updateCompany } = useAuth();
  const { completeStep } = useOnboarding();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: '',
      industry: '',
      size: '',
      website: '',
      description: '',
      client_base_description: '',
    }
  });

  useEffect(() => {
    if (user?.company) {
      reset({
        name: user.company.name || '',
        industry: user.company.industry || '',
        size: user.company.size || '',
        website: user.company.website || '',
        description: user.company.description || '',
        client_base_description: user.company.client_base_description || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: CompanyProfileFormData) => {
    try {
      await updateCompany(data);
      completeStep('company_profile');
      toast({
        title: 'Profile Updated!',
        description: 'Your company information has been saved successfully.',
      });
      navigate('/dashboard');
    } catch (error) {
      console.error("Failed to update company profile:", error);
      toast({
        title: 'Error',
        description: 'Failed to save your information. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Tell Us About Your Company</CardTitle>
          <CardDescription>
            This information will help Nexus tailor its insights and recommendations specifically for your business.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Company Name</label>
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="industry" className="block text-sm font-medium mb-1">Industry</label>
                <Controller
                  name="industry"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <label htmlFor="size" className="block text-sm font-medium mb-1">Company Size</label>
                <Controller
                  name="size"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select a size" /></SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.size && <p className="text-sm text-destructive mt-1">{errors.size.message}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Company Description</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => <Textarea id="description" {...field} placeholder="What does your company do?" />}
              />
              {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label htmlFor="client_base_description" className="block text-sm font-medium mb-1">Target Audience</label>
              <Controller
                name="client_base_description"
                control={control}
                render={({ field }) => <Textarea id="client_base_description" {...field} placeholder="Describe your typical customer or client." />}
              />
              {errors.client_base_description && <p className="text-sm text-destructive mt-1">{errors.client_base_description.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save and Continue'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 