import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Separator } from '@/shared/components/ui/Separator';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { 
  User, 
  Mail, 
  Shield, 
  Key, 
  Trash2, 
  Save, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Import our new service patterns
import { logger } from '@/shared/utils/logger';
import { useFormWithValidation } from '@/shared/hooks/useFormWithValidation';
import { FormField, FormSection } from '@/shared/components/forms/FormField';
import { userProfileSchema, type UserProfileFormData } from '@/shared/validation/schemas';
import { useUserProfile } from '@/shared/contexts/UserContext';

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  
  // Use UserContext for profile data
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const [isUpdating, setIsUpdating] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

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
      if (!profile?.id) return;

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

      setIsUpdating(true);
      try {
        const result = await updateProfile(updates);
        if (result.success) {
          setIsEditing(false);
        } else {
          throw new Error(result.error || 'Failed to update profile');
        }
      } catch (error) {
        throw new Error('Failed to update profile');
      } finally {
        setIsUpdating(false);
      }
    },
    successMessage: 'Profile updated successfully!',
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        displayName: profile.display_name || '',
        jobTitle: profile.job_title || '',
        company: profile.company || '',
        role: profile.role || '',
        department: profile.department || '',
        businessEmail: profile.business_email || '',
        personalEmail: profile.personal_email || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.linkedin_url || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, form]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to current values
    if (profile) {
      form.reset({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        displayName: profile.display_name || '',
        jobTitle: profile.job_title || '',
        company: profile.company || '',
        role: profile.role || '',
        department: profile.department || '',
        businessEmail: profile.business_email || '',
        personalEmail: profile.personal_email || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.linkedin_url || '',
        phone: profile.phone || '',
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                form={form}
                name="firstName"
                label="First Name"
                placeholder="Enter your first name"
                disabled={!isEditing}
              />
              <FormField
                form={form}
                name="lastName"
                label="Last Name"
                placeholder="Enter your last name"
                disabled={!isEditing}
              />
            </div>
            
            <FormField
              form={form}
              name="displayName"
              label="Display Name"
              placeholder="Enter your display name"
              disabled={!isEditing}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                form={form}
                name="jobTitle"
                label="Job Title"
                placeholder="Enter your job title"
                disabled={!isEditing}
              />
              <FormField
                form={form}
                name="department"
                label="Department"
                placeholder="Enter your department"
                disabled={!isEditing}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                form={form}
                name="businessEmail"
                label="Business Email"
                type="email"
                placeholder="Enter your business email"
                disabled={!isEditing}
              />
              <FormField
                form={form}
                name="personalEmail"
                label="Personal Email"
                type="email"
                placeholder="Enter your personal email"
                disabled={!isEditing}
              />
            </div>
            
            <FormField
              form={form}
              name="phone"
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              disabled={!isEditing}
            />

            <div className="flex gap-2 pt-4">
              {!isEditing ? (
                <Button type="button" onClick={handleEditToggle}>
                  Edit Information
                </Button>
              ) : (
                <>
                  <Button type="submit" disabled={isSubmitting || isUpdating}>
                    {isSubmitting || isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Password</h4>
              <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
            </div>
            <Button variant="outline">Change Password</Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Not enabled</Badge>
              <Button variant="outline">Enable 2FA</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Manage your API keys and integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No API Keys</h3>
            <p className="text-muted-foreground mb-4">
              You haven't generated any API keys yet.
            </p>
            <Button>Generate API Key</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <h4 className="font-medium text-destructive">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSettings; 
