import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { useUserProfile } from '@/shared/hooks/useUserProfile';
import { useIntegrations } from '@/hooks/integrations/useIntegrations';
import { integrationService } from '@/services/integrations/integrationService.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Input } from '@/shared/components/ui/Input.tsx';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs.tsx';
import { Separator } from '@/shared/components/ui/Separator';
import { Progress } from '@/shared/components/ui/Progress.tsx';
import { 
  X,
  Plus,
  Edit,
  CheckCircle,
  Zap,
  Database,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { supabase, sessionUtils } from '@/lib/supabase';
import { tokenManager } from '@/services/tokenManager';
import { useSearchParams } from 'react-router-dom';

// Import our new form patterns
import { useFormWithValidation } from '@/shared/hooks/useFormWithValidation';
import { FormField, FormSection } from '@/shared/components/forms/FormField';
import { userProfileSchema, type UserProfileFormData } from '@/shared/validation/schemas';

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const { updateProfile } = useUserProfile();
  const { refreshIntegrations } = useIntegrations();
  
  const [searchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Enhanced integration status checking
  const [integrationDetails, setIntegrationDetails] = useState<any[]>([]);

  // Initialize form with our new pattern
  const { form, handleSubmit, isSubmitting, isValid, errors } = useFormWithValidation({
    schema: userProfileSchema,
    defaultValues: {
      firstName: '',
      lastName: '',
      displayName: '',
      jobTitle: '',
      company: '',
      role: '',
      department: '',
      businessEmail: '',
      personalEmail: '',
      bio: '',
      location: '',
      website: '',
      phone: '',
    },
    onSubmit: async (data: UserProfileFormData) => {
      if (!user?.id) return;

      const updates = {
        first_name: data.firstName,
        last_name: data.lastName,
        display_name: data.displayName,
        job_title: data.jobTitle,
        role: data.role,
        department: data.department,
        business_email: data.businessEmail,
        personal_email: data.personalEmail,
        bio: data.bio,
        location: data.location,
        linkedin_url: data.website,
        phone: data.phone,
      };

      const result = await updateProfile(updates);
      
      if (result.success) {
        setIsEditing(false);
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    },
    successMessage: 'Profile updated successfully!',
  });

  // Handle URL parameter for tab navigation
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'integrations', 'preferences'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Load profile data into form
  useEffect(() => {
    if (user?.profile) {
      form.reset({
        firstName: user.profile.first_name || '',
        lastName: user.profile.last_name || '',
        displayName: user.profile.display_name || '',
        jobTitle: user.profile.job_title || '',
        company: user.profile.company || '',
        role: user.profile.role || '',
        department: user.profile.department || '',
        businessEmail: user.profile.business_email || '',
        personalEmail: user.profile.personal_email || '',
        bio: user.profile.bio || '',
        location: user.profile.location || '',
        website: user.profile.linkedin_url || '',
        phone: user.profile.phone || '',
      });
    }
  }, [user?.profile, form]);

  // Load integrations from auth store and force refresh to ensure latest data
  useEffect(() => {
    const loadIntegrations = async () => {
      if (user?.id) {
        setLoadingIntegrations(true);
        try {
          // Force refresh integrations to get the latest data
          await refreshIntegrations();
        } catch (error) {
          console.error('Failed to refresh integrations: ', error);
        } finally {
          setLoadingIntegrations(false);
        }
      }
    };

    loadIntegrations();
  }, [user?.id, refreshIntegrations]);

  // Check integration health when integrations change
  useEffect(() => {
    if (user?.integrations) {
      checkIntegrationHealth();
    }
  }, [user?.integrations]);

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

  const checkIntegrationHealth = async () => {
    if (!user?.integrations) return;
    
    const details = await Promise.all(
      user.integrations.map(async (integration) => {
        try {
          // Check if tokens exist and are valid
          const hasTokens = await tokenManager.hasTokens(integration.integration_type || '');
          
          // Get OAuth token details if they exist
          let tokenStatus = 'not_connected';
          let lastRefresh = null;
          
          if (hasTokens) {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                // Check token validity with integration service
                const tokenInfo = await integrationService.checkTokenHealth(integration.integration_type || '');
                tokenStatus = tokenInfo.isValid ? 'valid' : 'expired';
                lastRefresh = tokenInfo.lastRefresh;
              }
            } catch (error) {
              tokenStatus = 'error';
            }
          }
          
          return {
            ...integration,
            tokenStatus,
            lastRefresh,
            hasTokens,
          };
        } catch (error) {
          return {
            ...integration,
            tokenStatus: 'error',
            hasTokens: false,
          };
        }
      })
    );
    
    setIntegrationDetails(details);
  };

  const getTokenStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <X className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTokenStatusText = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Connected';
      case 'expired':
        return 'Token Expired';
      case 'error':
        return 'Connection Error';
      default:
        return 'Not Connected';
    }
  };

  const getTokenStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (user?.profile) {
      form.reset({
        firstName: user.profile.first_name || '',
        lastName: user.profile.last_name || '',
        displayName: user.profile.display_name || '',
        jobTitle: user.profile.job_title || '',
        company: user.profile.company || '',
        role: user.profile.role || '',
        department: user.profile.department || '',
        businessEmail: user.profile.business_email || '',
        personalEmail: user.profile.personal_email || '',
        bio: user.profile.bio || '',
        location: user.profile.location || '',
        website: user.profile.linkedin_url || '',
        phone: user.profile.phone || '',
      });
    }
  };

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
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
                        {({ field }) => (
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
                        {({ field }) => (
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
                      {({ field }) => (
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
                        {({ field }) => (
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
                        {({ field }) => (
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
                        {({ field }) => (
                          <Input
                            {...field}
                            placeholder="e.g., Developer, Manager"
                            disabled={!isEditing}
                          />
                        )}
                      </FormField>

                      <FormField
                        name="department"
                        label="Department"
                        control={form.control}
                        error={errors.department?.message}
                      >
                        {({ field }) => (
                          <Input
                            {...field}
                            placeholder="e.g., Engineering, Marketing"
                            disabled={!isEditing}
                          />
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
                        {({ field }) => (
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
                        {({ field }) => (
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
                        {({ field }) => (
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
                        {({ field }) => (
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
                      {({ field }) => (
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
                      {({ field }) => (
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
                        >
                          {isSubmitting ? 'Saving...' : 'Save Changes'}
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

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Integrations</CardTitle>
                <CardDescription>
                  Manage your third-party integrations and connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingIntegrations ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : integrationDetails.length > 0 ? (
                  <div className="space-y-4">
                    {integrationDetails.map((integration) => (
                      <div
                        key={integration.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Zap className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{integration.integration_type}</h3>
                            <p className="text-sm text-muted-foreground">
                              {integration.description || 'No description available'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getTokenStatusIcon(integration.tokenStatus)}
                          <Badge className={getTokenStatusColor(integration.tokenStatus)}>
                            {getTokenStatusText(integration.tokenStatus)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Integrations</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't connected any integrations yet.
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Integration
                    </Button>
                  </div>
                )}
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
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Email Notifications</h4>
                          <p className="text-sm text-muted-foreground">
                            Receive email updates about your account
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Push Notifications</h4>
                          <p className="text-sm text-muted-foreground">
                            Get real-time notifications in your browser
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Profile Visibility</h4>
                          <p className="text-sm text-muted-foreground">
                            Control who can see your profile information
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Data Sharing</h4>
                          <p className="text-sm text-muted-foreground">
                            Manage how your data is shared with third parties
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountSettings; 