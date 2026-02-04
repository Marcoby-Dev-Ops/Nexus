import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { useToast } from '@/shared/components/ui/use-toast';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { logger } from '@/shared/utils/logger';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { userContactsService } from '@/services/core/UserContactsService';
import { IconButton } from '@/shared/components/ui/Button';
import { Switch } from '@/shared/components/ui/Switch';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/RadioGroup';

const UIEmailSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  label: z.string().optional(),
  is_primary: z.boolean().optional(),
  is_shared: z.boolean().optional(),
});

const UIPhoneSchema = z.object({
  id: z.string().uuid().optional(),
  phone: z.string().min(3, 'Phone is too short'),
  label: z.string().optional(),
  is_primary: z.boolean().optional(),
});

const userProfileSchema = z.object({
  // Personal Information
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  display_name: z.string().optional(),
  email: z.string().email(), // Read-only signup email
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  
  // Dynamic Contact Information
  emails: z.array(UIEmailSchema).optional().default([]),
  phones: z.array(UIPhoneSchema).optional().default([]),
  
  // Helper fields for primary selection
  primaryEmailIndex: z.string().optional(),
  primaryPhoneIndex: z.string().optional(),

  // Work Information
  job_title: z.string().optional(),
  department: z.string().optional(),
  work_phone: z.string().optional(),
  work_location: z.enum(['office', 'remote', 'hybrid', '']).optional().nullable().transform(val => val === '' ? null : val),
  
  // Location
  location: z.string().optional(),
  timezone: z.string().optional(),

  // Social Links
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  linkedin_url: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  github_url: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  twitter_url: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
});

type UserProfileFormData = z.infer<typeof userProfileSchema>;

const timezones = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'
];

export function UserProfilePage() {
  const { user } = useAuth();
  const { profile, loading: isLoadingProfile, updateProfile, refreshProfile } = useUserProfile();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      display_name: '',
      email: '',
      bio: '',
      emails: [],
      phones: [],
      job_title: '',
      department: '',
      work_phone: '',
      work_location: '',
      location: '',
      timezone: '',
      website: '',
      linkedin_url: '',
      github_url: '',
      twitter_url: '',
    }
  });

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control,
    name: "emails",
  });

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control,
    name: "phones",
  });

  useEffect(() => {
    const loadContacts = async () => {
      if (!profile) return;

      let emails: Array<{ id?: string; email: string; label?: string; is_primary?: boolean; is_shared?: boolean }> = [];
      let phones: Array<{ id?: string; phone: string; label?: string; is_primary?: boolean }> = [];
      try {
        if (user?.id) {
          const userId = typeof user.id === 'string' ? user.id : String(user.id);
          const [emailsRes, phonesRes] = await Promise.all([
            userContactsService.listEmails(userId),
            userContactsService.listPhones(userId),
          ]);
          if (emailsRes.success) {
            emails = emailsRes.data.map(e => ({ id: e.id, email: e.email, label: e.label || undefined, is_primary: e.is_primary, is_shared: e.is_shared }));
          }
          if (phonesRes.success) {
            phones = phonesRes.data.map(p => ({ id: p.id, phone: p.phone_number, label: p.label || undefined, is_primary: p.is_primary }));
          }
        }
      } catch (_e) {}

      if (user?.email && !emails.some(e => e.email === user.email)) {
        emails = [{ email: user.email, label: 'Primary', is_primary: true }, ...emails];
      }

      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        display_name: profile.display_name || '',
        email: profile.email || user?.email || '',
        bio: profile.bio || '',
        emails,
        phones,
        job_title: profile.job_title || '',
        department: profile.department || '',
        work_phone: profile.work_phone || '',
        work_location: profile.work_location || '',
        location: profile.location || '',
        timezone: profile.timezone || 'UTC',
        website: profile.website || '',
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        twitter_url: profile.twitter_url || '',
      });
    };

    loadContacts();
  }, [profile, user, reset]);

  const onSubmit = async (data: UserProfileFormData) => {
    if (!profile?.id) {
        toast({ title: "Error", description: "User profile not found.", variant: "destructive" });
        return;
    }

    setIsUpdating(true);

    try {
        const { email, emails, phones, ...updateData } = data; // Exclude email; sync contacts separately
        await updateProfile(updateData);

        const userId = typeof user?.id === 'string' ? user?.id : String(user?.id || '');
        if (userId) {
          const [existingEmailsRes, existingPhonesRes] = await Promise.all([
            userContactsService.listEmails(userId),
            userContactsService.listPhones(userId),
          ]);

          const existingEmails = existingEmailsRes.success ? existingEmailsRes.data : [];
          const existingPhones = existingPhonesRes.success ? existingPhonesRes.data : [];

          const existingEmailById = new Map(existingEmails.map(e => [e.id, e]));
          const existingEmailByEmail = new Map(existingEmails.map(e => [e.email, e]));
          const formEmails = emails || [];
          const formEmailIds = new Set(formEmails.map(e => e.id).filter(Boolean) as string[]);

          await Promise.all(existingEmails
            .filter(e => !formEmailIds.has(e.id) && !formEmails.some(fe => fe.email === e.email))
            .map(e => userContactsService.deleteEmail(userId, e.id))
          );

          for (const fe of formEmails) {
            if (fe.id && existingEmailById.has(fe.id)) {
              const curr = existingEmailById.get(fe.id)!;
              const patch: any = {};
              if (fe.email && fe.email !== curr.email) patch.email = fe.email;
              if ((fe.label || null) !== (curr.label || null)) patch.label = fe.label || null;
              if ((!!fe.is_primary) !== (!!curr.is_primary)) patch.is_primary = !!fe.is_primary;
              if ((!!fe.is_shared) !== (!!curr.is_shared)) patch.is_shared = !!fe.is_shared;
              if (Object.keys(patch).length > 0) await userContactsService.updateEmail(userId, fe.id, patch);
            } else if (fe.email && existingEmailByEmail.has(fe.email)) {
              const curr = existingEmailByEmail.get(fe.email)!;
              const patch: any = {};
              if ((fe.label || null) !== (curr.label || null)) patch.label = fe.label || null;
              if ((!!fe.is_primary) !== (!!curr.is_primary)) patch.is_primary = !!fe.is_primary;
              if ((!!fe.is_shared) !== (!!curr.is_shared)) patch.is_shared = !!fe.is_shared;
              if (Object.keys(patch).length > 0) await userContactsService.updateEmail(userId, curr.id, patch);
            } else if (fe.email) {
              await userContactsService.addEmail(userId, { email: fe.email, label: fe.label, is_primary: !!fe.is_primary, is_shared: !!fe.is_shared });
            }
          }

          const existingPhoneById = new Map(existingPhones.map(p => [p.id, p]));
          const formPhones = phones || [];
          const formPhoneIds = new Set(formPhones.map(p => p.id).filter(Boolean) as string[]);

          await Promise.all(existingPhones
            .filter(p => !formPhoneIds.has(p.id) && !formPhones.some(fp => fp.phone === p.phone_number))
            .map(p => userContactsService.deletePhone(userId, p.id))
          );

          for (const fp of formPhones) {
            if (fp.id && existingPhoneById.has(fp.id)) {
              const curr = existingPhoneById.get(fp.id)!;
              const patch: any = {};
              if (fp.phone && fp.phone !== curr.phone_number) patch.phone = fp.phone;
              if ((fp.label || null) !== (curr.label || null)) patch.label = fp.label || null;
              if ((!!fp.is_primary) !== (!!curr.is_primary)) patch.is_primary = !!fp.is_primary;
              if (Object.keys(patch).length > 0) await userContactsService.updatePhone(userId, fp.id, patch);
            } else if (fp.phone) {
              await userContactsService.addPhone(userId, { phone: fp.phone, label: fp.label, is_primary: !!fp.is_primary });
            }
          }
        }

        toast({
            title: "Success",
            description: "Your profile has been updated successfully.",
        });
    } catch (error) {
      logger.error('UserProfilePage - Profile update error:', error instanceof Error ? error.message : String(error));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (isLoadingProfile) {
    return (
        <Card className="w-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your profile...</p>
            </div>
          </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>
            This information will be displayed publicly so be careful what you share.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            {/* Personal Info */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name">First Name *</label>
                  <Controller name="first_name" control={control} render={({ field }) => <Input id="first_name" {...field} />} />
                  {errors.first_name && <p>{errors.first_name.message}</p>}
                </div>
                <div>
                  <label htmlFor="last_name">Last Name *</label>
                  <Controller name="last_name" control={control} render={({ field }) => <Input id="last_name" {...field} />} />
                  {errors.last_name && <p>{errors.last_name.message}</p>}
                </div>
                <div>
                  <label htmlFor="display_name">Display Name</label>
                  <Controller name="display_name" control={control} render={({ field }) => <Input id="display_name" {...field} />} />
                  {errors.display_name && <p>{errors.display_name.message}</p>}
                </div>
                <div>
                  <label htmlFor="email">Email</label>
                  <Controller name="email" control={control} render={({ field }) => <Input id="email" {...field} disabled />} />
                </div>
              </div>
              <div>
                <label htmlFor="bio">Bio</label>
                <Controller name="bio" control={control} render={({ field }) => <Textarea id="bio" {...field} rows={4} />} />
                {errors.bio && <p>{errors.bio.message}</p>}
              </div>
            </section>

            {/* Work Info */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Work Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="job_title">Job Title</label>
                  <Controller name="job_title" control={control} render={({ field }) => <Input id="job_title" {...field} />} />
                  {errors.job_title && <p>{errors.job_title.message}</p>}
                </div>
                <div>
                  <label htmlFor="department">Department</label>
                  <Controller name="department" control={control} render={({ field }) => <Input id="department" {...field} />} />
                  {errors.department && <p>{errors.department.message}</p>}
                </div>
                <div>
                  <label htmlFor="work_phone">Work Phone</label>
                  <Controller name="work_phone" control={control} render={({ field }) => <Input id="work_phone" {...field} type="tel" />} />
                  {errors.work_phone && <p>{errors.work_phone.message}</p>}
                </div>
                <div>
                  <label htmlFor="work_location">Work Location</label>
                  <Controller name="work_location" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger><SelectValue placeholder="Select work location" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                  {errors.work_location && <p>{errors.work_location.message}</p>}
                </div>
              </div>
            </section>
            
            {/* Location */}
            <section className="space-y-4">
               <h3 className="text-lg font-semibold text-foreground border-b pb-2">Location & Timezone</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium mb-1">Location</label>
                        <Controller name="location" control={control} render={({ field }) => <Input id="location" {...field} placeholder="e.g., San Francisco, CA" />} />
                        {errors.location && <p className="text-sm text-destructive mt-1">{errors.location.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="timezone" className="block text-sm font-medium mb-1">Timezone</label>
                        <Controller name="timezone" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                            <SelectContent>
                                {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                            </SelectContent>
                            </Select>
                        )} />
                        {errors.timezone && <p className="text-sm text-destructive mt-1">{errors.timezone.message}</p>}
                    </div>
                </div>
            </section>

            {/* Social Links */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Online Presence</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="website" className="block text-sm font-medium mb-1">Website</label>
                  <Controller name="website" control={control} render={({ field }) => <Input id="website" {...field} placeholder="https://your-website.com" />} />
                  {errors.website && <p className="text-sm text-destructive mt-1">{errors.website.message}</p>}
                </div>
                <div>
                  <label htmlFor="linkedin_url" className="block text-sm font-medium mb-1">LinkedIn URL</label>
                  <Controller name="linkedin_url" control={control} render={({ field }) => <Input id="linkedin_url" {...field} />} />
                  {errors.linkedin_url && <p className="text-sm text-destructive mt-1">{errors.linkedin_url.message}</p>}
                </div>
                <div>
                  <label htmlFor="github_url" className="block text-sm font-medium mb-1">GitHub URL</label>
                  <Controller name="github_url" control={control} render={({ field }) => <Input id="github_url" {...field} />} />
                  {errors.github_url && <p className="text-sm text-destructive mt-1">{errors.github_url.message}</p>}
                </div>
                <div>
                  <label htmlFor="twitter_url" className="block text-sm font-medium mb-1">Twitter URL</label>
                  <Controller name="twitter_url" control={control} render={({ field }) => <Input id="twitter_url" {...field} />} />
                  {errors.twitter_url && <p className="text-sm text-destructive mt-1">{errors.twitter_url.message}</p>}
                </div>
              </div>
            </section>
          </CardContent>
          <CardFooter>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || isUpdating}>
                {isSubmitting || isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => refreshProfile()}
                disabled={isLoadingProfile}
              >
                {isLoadingProfile ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default UserProfilePage;
