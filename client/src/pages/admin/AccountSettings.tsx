import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
// import { IntegrationService } from '@/services/integrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Separator } from '@/shared/components/ui/Separator';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  X,
  Edit,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { useSearchParams } from 'react-router-dom';

// Import our new form patterns
import { useFormWithValidation } from '@/shared/hooks/useFormWithValidation';
import { FormField, FormSection } from '@/shared/components/forms/FormField';
import { userProfileSchema, type UserProfileFormData } from '@/shared/validation/schemas';
import type { z } from 'zod';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { logger } from '@/shared/utils/logger';
import { companyApi } from '@/services/api/CompanyApi';
import { useCompany } from '@/shared/contexts/CompanyContext';
import { useUserPreferences } from '@/shared/contexts/UserPreferencesContext';
import { userPreferencesSchema, type UserPreferencesFormData } from '@/shared/validation/schemas';
import { Switch } from '@/shared/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Label } from '@/shared/components/ui/Label';

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  
  // Use UserContext for profile data
  const { profile, loading: profileLoading, updateProfile, refreshProfile } = useUserProfile();
  const { company, refreshCompany } = useCompany();
  const { preferences, loading: preferencesLoading, updatePreferences } = useUserPreferences();
  
  const [searchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Debug: Log profile state
  useEffect(() => {
    logger.info('Profile state changed', { 
      hasProfile: !!profile, 
      profileLoading, 
      profileId: profile?.id,
      firstName: profile?.first_name,
      lastName: profile?.last_name,
      profileType: typeof profile,
      profileKeys: profile ? Object.keys(profile) : []
    });
  }, [profile, profileLoading]);

  // Track when initial loading is complete
  useEffect(() => {
    if (!profileLoading && !hasInitialized) {
      logger.info('Initial profile loading complete', { 
        hasProfile: !!profile, 
        profileId: profile?.id 
      });
      setHasInitialized(true);
    }
  }, [profileLoading, hasInitialized, profile]);

  // Integrations removed from this page

  // Initialize form with profile data - handle both loading and loaded states
  const { form, handleSubmit, isSubmitting, isValid, errors } = useFormWithValidation<UserProfileFormData>({
    schema: userProfileSchema as unknown as z.ZodType<UserProfileFormData, any, any>,
    defaultValues: {
      firstName: '',
      lastName: '',
      displayName: '',
      jobTitle: '',
      company: '',
      role: 'user' as "user" | "owner" | "admin" | "manager",
      department: '',
      businessEmail: '',
      personalEmail: '',
      bio: '',
      location: '',
      website: '',
      phone: '',
    },
    onSubmit: async (data: UserProfileFormData) => {
      logger.info('Form submission started', { 
        hasProfile: !!profile, 
        profileId: profile?.id,
        formData: data 
      });

      if (!profile?.id) {
        logger.error('Cannot save: No profile ID available');
        return;
      }

      // Normalize empty strings to undefined for optional fields
      const toUndef = (v: string | undefined) => (v === '' ? undefined : v);
      
      // Handle company and department linkage to organizations
      let companyId = profile.company_id;
      const companyNameInput = (data.company || '').trim();
      const departmentNameInput = (data.department || '').trim();

      if (companyNameInput) {
        try {
          // Find existing company or create new one
          // TODO: Implement list companies API endpoint
          // const existing = await companyApi.list({ name: companyNameInput });
          if (existing.success && existing.data && existing.data.length > 0) {
            companyId = existing.data[0].id;
            logger.info('Found existing company', { companyId, companyName: companyNameInput });
          } else {
            // Create new company
            const created = await companyApi.create({ 
              name: companyNameInput, 
              owner_id: user?.id 
            });
            if (created.success && created.data) {
              companyId = created.data.id;
              logger.info('Created new company', { companyId, companyName: companyNameInput });
            }
          }
        } catch (err) {
          logger.error('Error ensuring company linkage', { error: err, companyNameInput });
        }
      }

      if (companyId && departmentNameInput) {
        // Department feature not yet implemented - skip for now
        logger.info('Department feature not yet implemented, skipping department creation', { 
          departmentNameInput, 
          companyId 
        });
      }

      const updates = {
        first_name: data.firstName,
        last_name: data.lastName,
        display_name: toUndef(data.displayName),
        job_title: toUndef(data.jobTitle),
        role: data.role as "user" | "owner" | "admin" | "manager",
        department: toUndef(data.department),
        company_id: companyId,
        business_email: toUndef(data.businessEmail),
        personal_email: toUndef(data.personalEmail),
        bio: toUndef(data.bio),
        location: toUndef(data.location),
        linkedin_url: toUndef(data.website),
        phone: toUndef(data.phone),
      } as const;

      logger.info('Attempting to update profile', { updates });

      try {
        const result = await updateProfile(updates);
        logger.info('Profile update result', { success: result.success, error: result.error });
        
        if (result.success) {
          // Ensure we fetch the latest profile and company data from DB/cache
          await Promise.all([refreshProfile(), refreshCompany()]);
          setIsEditing(false);
          logger.info('Profile updated successfully, editing mode disabled');
        } else {
          logger.error('Profile update failed', { error: result.error });
          throw new Error(result.error || 'Update failed');
        }
      } catch (error) {
        logger.error('Exception during profile update', { error });
        throw error;
      }
    },
    successMessage: 'Profile updated successfully',
    errorMessage: 'Failed to update profile',
  });

  // Initialize preferences form
  const { 
    form: preferencesForm, 
    handleSubmit: handlePreferencesSubmit, 
    isSubmitting: isPreferencesSubmitting, 
    isValid: isPreferencesValid, 
    errors: preferencesErrors 
  } = useFormWithValidation<UserPreferencesFormData>({
    schema: userPreferencesSchema as unknown as z.ZodType<UserPreferencesFormData, any, any>,
    defaultValues: {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      notifications_enabled: true,
      email_notifications: true,
      push_notifications: false,
      sidebar_collapsed: false,
    },
    onSubmit: async (data: UserPreferencesFormData) => {
      logger.info('Preferences form submission started', { formData: data });

      try {
        const result = await updatePreferences(data);
        logger.info('Preferences update result', { success: result.success, error: result.error });

        if (result.success) {
          logger.info('Preferences updated successfully');
        } else {
          logger.error('Preferences update failed', { error: result.error });
          throw new Error(result.error || 'Update failed');
        }
      } catch (error) {
        logger.error('Exception during preferences update', { error });
        throw error;
      }
    },
    successMessage: 'Preferences updated successfully',
    errorMessage: 'Failed to update preferences',
  });

  // Update form values when profile data becomes available
  useEffect(() => {
    logger.info('Form reset effect triggered', { 
      hasProfile: !!profile, 
      profileLoading, 
      profileId: profile?.id,
      hasInitialized
    });
    
    if (profile && !profileLoading) {
      // Use company name from linked company if available, otherwise fall back to profile.company
      const companyName = company?.name || (typeof profile.company === 'string' ? profile.company : '') || '';
      
      logger.info('Setting form values for profile', { 
        firstName: profile.first_name,
        lastName: profile.last_name,
        jobTitle: profile.job_title,
        role: profile.role,
        companyName
      });
      
      // Set each field individually to ensure they update
      form.setValue('firstName', profile.first_name || '');
      form.setValue('lastName', profile.last_name || '');
      form.setValue('displayName', profile.display_name || '');
      form.setValue('jobTitle', profile.job_title || '');
      form.setValue('company', companyName);
      form.setValue('role', (profile.role as "user" | "owner" | "admin" | "manager") || 'user');
      form.setValue('department', profile.department || '');
      form.setValue('businessEmail', profile.business_email || '');
      form.setValue('personalEmail', profile.personal_email || '');
      form.setValue('bio', profile.bio || '');
      form.setValue('location', profile.location || '');
      form.setValue('website', profile.linkedin_url || '');
      form.setValue('phone', profile.phone || '');
      
      logger.info('Form values set successfully');
    }
  }, [profile, profileLoading, company, form]);

  // Update preferences form values when preferences data becomes available
  useEffect(() => {
    logger.info('Preferences form reset effect triggered', {
      hasPreferences: !!preferences,
      preferencesLoading,
      preferencesId: preferences?.id
    });

    if (preferences && !preferencesLoading) {
      logger.info('Setting preferences form values', {
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone
      });

      preferencesForm.setValue('theme', preferences.theme);
      preferencesForm.setValue('language', preferences.language);
      preferencesForm.setValue('timezone', preferences.timezone);
      preferencesForm.setValue('notifications_enabled', preferences.notifications_enabled);
      preferencesForm.setValue('email_notifications', preferences.email_notifications);
      preferencesForm.setValue('push_notifications', preferences.push_notifications);
      preferencesForm.setValue('sidebar_collapsed', preferences.sidebar_collapsed);

      logger.info('Preferences form values set successfully');
    }
  }, [preferences, preferencesLoading, preferencesForm]);

  // Handle URL parameter for tab navigation
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'preferences'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Integrations removed from this page

  // Show loading state while profile or preferences are being loaded
  if (profileLoading || preferencesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if profile failed to load - only after initial loading is complete
  if (!profile && !profileLoading && hasInitialized) {
    logger.warn('No profile available, showing error state', { 
      profileLoading, 
      hasProfile: !!profile,
      hasInitialized
    });
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Failed to load profile</h3>
              <p className="text-muted-foreground">Please refresh the page and try again.</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const calculateProfileCompletion = () => {
    const formValues = form.getValues();
    const fields = [
      formValues.firstName,
      formValues.lastName,
      formValues.displayName,
      formValues.jobTitle,
      formValues.company,
      formValues.role,
      formValues.department,
      formValues.businessEmail,
      formValues.personalEmail,
    ];
    const filledFields = fields.filter(field => field?.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  // (moved into useCallback above)

  // Integration helper functions removed

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (profile) {
      const companyName = typeof profile.company === 'string' ? profile.company : profile.company?.name || '';
      
      try {
        const formValues = {
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          displayName: profile.display_name || '',
          jobTitle: profile.job_title || '',
          company: companyName,
          role: (profile.role as "user" | "owner" | "admin" | "manager") || 'user',
          department: profile.department || '',
          businessEmail: profile.business_email || '',
          personalEmail: profile.personal_email || '',
          bio: profile.bio || '',
          location: profile.location || '',
          website: profile.linkedin_url || '',
          phone: profile.phone || '',
        };
        
        form.reset(formValues, {
          keepDirty: false,
          keepErrors: false,
          keepIsSubmitted: false,
          keepTouched: false,
        });
      } catch (error) {
        logger.error('Error resetting form values', error);
      }
    }
  };

  // Debug: Log that we're about to render the main component
  logger.info('Rendering AccountSettings main component', { 
    profileId: profile?.id,
    profileLoading,
    isEditing,
    activeTab
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your profile, integrations, and preferences
            </p>
          </div>
        </div>

         <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
           <TabsList className="grid w-full grid-cols-2">
             <TabsTrigger value="profile">Profile</TabsTrigger>
             <TabsTrigger value="preferences">Preferences</TabsTrigger>
           </TabsList>

          <TabsContent value="profile" className="space-y-6">
             <Card key={profile?.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal and professional information
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-muted-foreground">
                      {calculateProfileCompletion()}% Complete
                    </div>
                    <Progress value={calculateProfileCompletion()} className="w-20" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormSection
                    title="Personal Information"
                    description="Your basic personal details"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        name="firstName"
                        label="First Name"
                        control={form.control}
                        error={errors.firstName?.message}
                        required
                      >
                         {(field) => (
                           <Input
                             {...field}
                             placeholder="Enter your first name"
                             disabled={!isEditing}
                           />
                         )}
                      </FormField>

                      <FormField
                        name="lastName"
                        label="Last Name"
                        control={form.control}
                        error={errors.lastName?.message}
                        required
                      >
                         {(field) => (
                           <Input
                             {...field}
                             placeholder="Enter your last name"
                             disabled={!isEditing}
                           />
                         )}
                      </FormField>
                    </div>

                    <FormField
                      name="displayName"
                      label="Display Name"
                      control={form.control}
                      error={errors.displayName?.message}
                      description="How your name appears to others"
                    >
                      {(field) => (
                         <Input
                           {...field}
                           placeholder="Enter your display name"
                           disabled={!isEditing}
                         />
                       )}
                    </FormField>
                  </FormSection>

                  <FormSection
                    title="Professional Information"
                    description="Your work and company details"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        name="jobTitle"
                        label="Job Title"
                        control={form.control}
                        error={errors.jobTitle?.message}
                      >
                         {(field) => (
                           <Input
                             {...field}
                             placeholder="e.g., Senior Developer"
                             disabled={!isEditing}
                           />
                         )}
                      </FormField>

                      <FormField
                        name="company"
                        label="Company"
                        control={form.control}
                        error={errors.company?.message}
                      >
                         {(field) => (
                           <Input
                             {...field}
                             placeholder="Enter your company name"
                             disabled={!isEditing}
                           />
                         )}
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        name="role"
                        label="Role"
                        control={form.control}
                        error={errors.role?.message}
                      >
                        {(field) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger disabled={!isEditing}>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </FormField>

                      <FormField
                        name="department"
                        label="Department"
                        control={form.control}
                        error={errors.department?.message}
                      >
                        {(field) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger disabled={!isEditing}>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="engineering">Engineering</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="hr">Human Resources</SelectItem>
                              <SelectItem value="operations">Operations</SelectItem>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="design">Design</SelectItem>
                              <SelectItem value="support">Customer Support</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </FormField>
                    </div>
                  </FormSection>

                  <FormSection
                    title="Contact Information"
                    description="Your email addresses and contact details"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        name="businessEmail"
                        label="Business Email"
                        control={form.control}
                        error={errors.businessEmail?.message}
                        hint="Your work email address"
                      >
                         {(field) => (
                           <Input
                             {...field}
                             type="email"
                             placeholder="work@company.com"
                             disabled={!isEditing}
                           />
                         )}
                      </FormField>

                      <FormField
                        name="personalEmail"
                        label="Personal Email"
                        control={form.control}
                        error={errors.personalEmail?.message}
                        hint="Your personal email address"
                      >
                         {(field) => (
                           <Input
                             {...field}
                             type="email"
                             placeholder="personal@email.com"
                             disabled={!isEditing}
                           />
                         )}
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        name="phone"
                        label="Phone Number"
                        control={form.control}
                        error={errors.phone?.message}
                      >
                         {(field) => (
                           <Input
                             {...field}
                             type="tel"
                             placeholder="+1 (555) 123-4567"
                             disabled={!isEditing}
                           />
                         )}
                      </FormField>

                      <FormField
                        name="website"
                        label="Website/LinkedIn"
                        control={form.control}
                        error={errors.website?.message}
                        hint="Your personal website or LinkedIn profile"
                      >
                         {(field) => (
                           <Input
                             {...field}
                             type="url"
                             placeholder="https://linkedin.com/in/yourprofile"
                             disabled={!isEditing}
                           />
                         )}
                      </FormField>
                    </div>
                  </FormSection>

                  <FormSection
                    title="Additional Information"
                    description="Tell us more about yourself"
                  >
                    <FormField
                      name="location"
                      label="Location"
                      control={form.control}
                      error={errors.location?.message}
                    >
                      {(field) => (
                        <Input
                          {...field}
                          placeholder="City, Country"
                          disabled={!isEditing}
                        />
                      )}
                    </FormField>

                    <FormField
                      name="bio"
                      label="Bio"
                      control={form.control}
                      error={errors.bio?.message}
                      hint="A brief description about yourself (max 500 characters)"
                    >
                      {(field) => (
                        <Textarea
                          {...field}
                          placeholder="Tell us about yourself..."
                          rows={4}
                          disabled={!isEditing}
                        />
                      )}
                    </FormField>
                  </FormSection>

                                     <div className="flex justify-end space-x-2 pt-6">
                     {isEditing ? (
                       <>
                         {/* Debug info */}
                         <div className="flex-1 text-sm text-muted-foreground">
                           Form valid: {isValid ? 'Yes' : 'No'} | 
                           Errors: {Object.keys(errors).length} | 
                           Submitting: {isSubmitting ? 'Yes' : 'No'}
                         </div>
                         <Button
                           type="button"
                           variant="outline"
                           onClick={handleCancelEdit}
                           disabled={isSubmitting}
                         >
                           Cancel
                         </Button>
                         <Button
                           type="submit"
                           disabled={isSubmitting || !isValid}
                           onClick={() => {
                             logger.info('Save button clicked', { 
                               isSubmitting, 
                               isValid, 
                               errors: Object.keys(errors),
                               formValues: form.getValues()
                             });
                           }}
                         >
                           {isSubmitting ? 'Saving...' : `Save Changes ${!isValid ? '(Invalid)' : ''}`}
                         </Button>
                       </>
                     ) : (
                       <Button
                         type="button"
                         onClick={handleEditToggle}
                         className="flex items-center space-x-2"
                       >
                         <Edit className="h-4 w-4" />
                         <span>Edit Profile</span>
                       </Button>
                     )}
                   </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Customize your experience and notification settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <FormSection
                    title="Interface Settings"
                    description="Customize your user interface"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        name="theme"
                        label="Theme"
                        control={preferencesForm.control}
                        error={preferencesErrors.theme?.message}
                      >
                        {(field) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </FormField>

                      <FormField
                        name="language"
                        label="Language"
                        control={preferencesForm.control}
                        error={preferencesErrors.language?.message}
                      >
                        {(field) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="fr">Français</SelectItem>
                              <SelectItem value="de">Deutsch</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </FormField>
                    </div>

                    <FormField
                      name="timezone"
                      label="Timezone"
                      control={preferencesForm.control}
                      error={preferencesErrors.timezone?.message}
                    >
                      {(field) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </FormField>
                  </FormSection>

                  <FormSection
                    title="Notification Settings"
                    description="Manage your notification preferences"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifications_enabled">Enable Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications about important updates
                          </p>
                        </div>
                        <FormField
                          name="notifications_enabled"
                          control={preferencesForm.control}
                          error={preferencesErrors.notifications_enabled?.message}
                        >
                          {(field) => (
                            <Switch
                              id="notifications_enabled"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        </FormField>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email_notifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive email updates about your account
                          </p>
                        </div>
                        <FormField
                          name="email_notifications"
                          control={preferencesForm.control}
                          error={preferencesErrors.email_notifications?.message}
                        >
                          {(field) => (
                            <Switch
                              id="email_notifications"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        </FormField>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="push_notifications">Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Get real-time notifications in your browser
                          </p>
                        </div>
                        <FormField
                          name="push_notifications"
                          control={preferencesForm.control}
                          error={preferencesErrors.push_notifications?.message}
                        >
                          {(field) => (
                            <Switch
                              id="push_notifications"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        </FormField>
                      </div>
                    </div>
                  </FormSection>

                  <FormSection
                    title="Interface Preferences"
                    description="Customize your dashboard layout"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="sidebar_collapsed">Collapsed Sidebar</Label>
                          <p className="text-sm text-muted-foreground">
                            Start with the sidebar collapsed by default
                          </p>
                        </div>
                        <FormField
                          name="sidebar_collapsed"
                          control={preferencesForm.control}
                          error={preferencesErrors.sidebar_collapsed?.message}
                        >
                          {(field) => (
                            <Switch
                              id="sidebar_collapsed"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        </FormField>
                      </div>
                    </div>
                  </FormSection>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="submit"
                      disabled={!isPreferencesValid || isPreferencesSubmitting}
                      className="flex items-center space-x-2"
                    >
                      {isPreferencesSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Preferences</span>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountSettings; 
