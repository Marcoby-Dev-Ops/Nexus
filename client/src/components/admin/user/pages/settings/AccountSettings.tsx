import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Label } from '@/shared/components/ui/Label';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  User, 
  Shield, 
  Key, 
  Trash2
} from 'lucide-react';

// Import our new service patterns
// logger intentionally omitted (unused in this file)
import { useFormWithValidation } from '@/shared/hooks/useFormWithValidation';
import { FormField } from '@/shared/components/forms/FormField';
import { userProfileSchema, type UserProfileFormData } from '@/shared/validation/schemas';
import { useUserProfile } from '@/shared/contexts/UserContext';

const AccountSettings: React.FC = () => {
  useAuth(); // ensure auth hook runs but we don't need the user object here
  
  // Use UserContext for profile data
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const [isUpdating, setIsUpdating] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  // Initialize form with our new pattern
  const { form, handleSubmit, isSubmitting } = useFormWithValidation({
    schema: userProfileSchema,
    defaultValues: {
      firstName: '',
      lastName: '',
      displayName: '',
      jobTitle: '',
      company: '',
      role: undefined,
      department: '',
      businessEmail: '',
      personalEmail: '',
      bio: '',
      location: '',
      website: '',
      phone: '',
      chatTone: 'friendly',
    },
    onSubmit: async (data: UserProfileFormData) => {
      if (!profile?.id) return;

      const updates: any = {
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
        // Persist chat tone preference into preferences JSON
        preferences: {
          ...(profile?.preferences || {}),
          chatTone: data.chatTone
        }
      };

      setIsUpdating(true);
      try {
        const result = await updateProfile(updates as any);
        if (result.success) {
          setIsEditing(false);
        } else {
          throw new Error(result.error || 'Failed to update profile');
        }
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
        role: profile.role || undefined,
        department: profile.department || '',
        businessEmail: (profile as any).business_email || '',
        personalEmail: (profile as any).personal_email || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.linkedin_url || '',
        phone: (profile as any).phone || '',
        chatTone: (profile?.preferences as any)?.chatTone || 'friendly',
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
        role: profile.role || undefined,
        department: profile.department || '',
        businessEmail: (profile as any).business_email || '',
        personalEmail: (profile as any).personal_email || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.linkedin_url || '',
        phone: (profile as any).phone || '',
        chatTone: (profile?.preferences as any)?.chatTone || 'friendly',
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
                name="firstName"
                label="First Name"
                control={form.control}
                disabled={!isEditing}
              >
                {(field) => <Input {...(field as any)} placeholder="Enter your first name" />}
              </FormField>
              <FormField
                name="lastName"
                label="Last Name"
                control={form.control}
                disabled={!isEditing}
              >
                {(field) => <Input {...(field as any)} placeholder="Enter your last name" />}
              </FormField>
            </div>
            
            <FormField
              name="displayName"
              label="Display Name"
              control={form.control}
              disabled={!isEditing}
            >
              {(field) => <Input {...(field as any)} placeholder="Enter your display name" />}
            </FormField>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="jobTitle"
                label="Job Title"
                control={form.control}
                disabled={!isEditing}
              >
                {(field) => <Input {...(field as any)} placeholder="Enter your job title" />}
              </FormField>
              <FormField
                name="department"
                label="Department"
                control={form.control}
                disabled={!isEditing}
              >
                {(field) => <Input {...(field as any)} placeholder="Enter your department" />}
              </FormField>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="businessEmail"
                label="Business Email"
                control={form.control}
                disabled={!isEditing}
              >
                {(field) => <Input {...(field as any)} type="email" placeholder="Enter your business email" />}
              </FormField>
              <FormField
                name="personalEmail"
                label="Personal Email"
                control={form.control}
                disabled={!isEditing}
              >
                {(field) => <Input {...(field as any)} type="email" placeholder="Enter your personal email" />}
              </FormField>
            </div>
            
            <FormField
              name="phone"
              label="Phone Number"
              control={form.control}
              disabled={!isEditing}
            >
              {(field) => <Input {...(field as any)} type="tel" placeholder="Enter your phone number" />}
            </FormField>

            {/* Chat Preferences */}
            <div className="mt-4">
              <Label className="text-sm">Chat Preferences</Label>
              <div className="mt-2">
                <Select
                  onValueChange={(val) => form.setValue('chatTone', val)}
                  value={form.getValues('chatTone')}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="playful">Playful</SelectItem>
                    <SelectItem value="concise">Concise</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">Choose how the AI assistant should phrase replies to you.</p>
              </div>
            </div>

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
