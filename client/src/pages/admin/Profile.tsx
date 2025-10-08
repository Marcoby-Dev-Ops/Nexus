import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/index';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  User, 
  Mail, 
  Briefcase, 
  Edit,
} from 'lucide-react';

// Import our new service patterns
import { useFormWithValidation } from '@/shared/hooks/useFormWithValidation';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { FormField } from '@/shared/components/forms/FormField';
import { userProfileSchema, type UserProfileFormData } from '@/shared/validation/schemas';
import { logger } from '@/shared/utils/logger';

import UserKnowledgeViewer from '@/lib/ai/components/UserKnowledgeViewer';
import { ProfileVerificationBanner } from '@/components/admin/user/components/ProfileVerificationBanner';

// (Unused local interfaces removed to satisfy linting)

export const Profile: React.FC = () => {
  useAuth();
  useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  
  // Use the new UserService hooks
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const [isUpdating, setIsUpdating] = useState(false);



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
    },
  onSubmit: async (data: UserProfileFormData) => {
      if (!profile?.id) return;

      const updates = {
        first_name: data.firstName,
        last_name: data.lastName,
        display_name: data.displayName,
        job_title: data.jobTitle,
        role: data.role as 'owner' | 'admin' | 'manager' | 'user',
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
      } catch (err) {
        logger.error('Failed to update profile', err);
        throw new Error('Failed to update profile');
      } finally {
        setIsUpdating(false);
      }
    },
    successMessage: 'Profile updated successfully!',
  });

  // Update form when user profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        displayName: profile.display_name || '',
        jobTitle: profile.job_title || '',
        company: profile.company || '',
        role: (profile.role as 'owner' | 'admin' | 'manager' | 'user') || undefined,
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

  // Calculate profile completion percentage
  const calculateCompletionPercentage = useCallback(() => {
    if (!profile) return 0;
    
    const fields = [
      'first_name', 'last_name', 'avatar_url', 'bio', 'phone', 
      'job_title', 'department', 'location', 'timezone', 'work_location'
    ];
    
    const completedFields = fields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return value && value !== '';
    }).length;
    
    return Math.round((completedFields / fields.length) * 100);
  }, [profile]);

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

  const completionPercentage = calculateCompletionPercentage();

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Profile</h1>
          <p className="text-lg text-muted-foreground mt-1">
            Your professional identity and public information
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="outline" className="text-xs">
              Public Profile
            </Badge>
            <Badge variant="outline" className="text-xs">
              Professional Information
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSubmitting || isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isUpdating}
              >
                {isSubmitting || isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={handleEditToggle}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Completion Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Complete your profile to unlock additional features
          </p>
        </CardContent>
      </Card>

      {/* Profile Verification Banner */}
      <ProfileVerificationBanner />

      {/* Main Profile Content */}
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-xl">
                    {profile?.first_name?.[0] || profile?.last_name?.[0] || 'U'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {profile?.first_name} {profile?.last_name}
                    </h3>
                    <p className="text-muted-foreground">{profile?.job_title}</p>
                    <p className="text-sm text-muted-foreground">{profile?.department}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="firstName"
                    label="First Name"
                    control={form.control}
                    disabled={!isEditing}
                  >
                    {({ onChange, onBlur, value, ref, id, disabled }) => (
                      <Input
                        id={id}
                        value={value as string}
                        onChange={onChange}
                        onBlur={onBlur}
                        ref={ref}
                        disabled={disabled}
                        placeholder="Enter your first name"
                      />
                    )}
                  </FormField>
                  <FormField
                    name="lastName"
                    label="Last Name"
                    control={form.control}
                    disabled={!isEditing}
                  >
                    {({ onChange, onBlur, value, ref, id, disabled }) => (
                      <Input
                        id={id}
                        value={value as string}
                        onChange={onChange}
                        onBlur={onBlur}
                        ref={ref}
                        disabled={disabled}
                        placeholder="Enter your last name"
                      />
                    )}
                  </FormField>
                </div>

                <FormField
                  name="displayName"
                  label="Display Name"
                  control={form.control}
                  disabled={!isEditing}
                >
                  {({ onChange, onBlur, value, ref, id, disabled }) => (
                    <Input
                      id={id}
                      value={value as string}
                      onChange={onChange}
                      onBlur={onBlur}
                      ref={ref}
                      disabled={disabled}
                      placeholder="Enter your display name"
                    />
                  )}
                </FormField>

                <FormField
                  name="bio"
                  label="Bio"
                  control={form.control}
                  disabled={!isEditing}
                >
                  {({ onChange, onBlur, value, ref, id, disabled }) => (
                    <Textarea
                      id={id}
                      value={value as string}
                      onChange={onChange}
                      onBlur={onBlur}
                      ref={ref}
                      disabled={disabled}
                      placeholder="Tell us about yourself"
                    />
                  )}
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="businessEmail"
                    label="Business Email"
                    control={form.control}
                    disabled={!isEditing}
                  >
                    {({ onChange, onBlur, value, ref, id, disabled }) => (
                      <Input
                        id={id}
                        value={value as string}
                        onChange={onChange}
                        onBlur={onBlur}
                        ref={ref}
                        disabled={disabled}
                        type="email"
                        placeholder="Enter your business email"
                      />
                    )}
                  </FormField>
                  <FormField
                    name="personalEmail"
                    label="Personal Email"
                    control={form.control}
                    disabled={!isEditing}
                  >
                    {({ onChange, onBlur, value, ref, id, disabled }) => (
                      <Input
                        id={id}
                        value={value as string}
                        onChange={onChange}
                        onBlur={onBlur}
                        ref={ref}
                        disabled={disabled}
                        type="email"
                        placeholder="Enter your personal email"
                      />
                    )}
                  </FormField>
                </div>

                <FormField
                  name="phone"
                  label="Phone Number"
                  control={form.control}
                  disabled={!isEditing}
                >
                  {({ onChange, onBlur, value, ref, id, disabled }) => (
                    <Input
                      id={id}
                      value={value as string}
                      onChange={onChange}
                      onBlur={onBlur}
                      ref={ref}
                      disabled={disabled}
                      type="tel"
                      placeholder="Enter your phone number"
                    />
                  )}
                </FormField>

                <FormField
                  name="location"
                  label="Location"
                  control={form.control}
                  disabled={!isEditing}
                >
                  {({ onChange, onBlur, value, ref, id, disabled }) => (
                    <Input
                      id={id}
                      value={value as string}
                      onChange={onChange}
                      onBlur={onBlur}
                      ref={ref}
                      disabled={disabled}
                      placeholder="Enter your location"
                    />
                  )}
                </FormField>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="jobTitle"
                    label="Job Title"
                    control={form.control}
                    disabled={!isEditing}
                  >
                    {({ onChange, onBlur, value, ref, id, disabled }) => (
                      <Input
                        id={id}
                        value={value as string}
                        onChange={onChange}
                        onBlur={onBlur}
                        ref={ref}
                        disabled={disabled}
                        placeholder="Enter your job title"
                      />
                    )}
                  </FormField>
                  <FormField
                    name="department"
                    label="Department"
                    control={form.control}
                    disabled={!isEditing}
                  >
                    {({ onChange, onBlur, value, ref, id, disabled }) => (
                      <Input
                        id={id}
                        value={value as string}
                        onChange={onChange}
                        onBlur={onBlur}
                        ref={ref}
                        disabled={disabled}
                        placeholder="Enter your department"
                      />
                    )}
                  </FormField>
                </div>

                <FormField
                  name="website"
                  label="LinkedIn URL"
                  control={form.control}
                  disabled={!isEditing}
                >
                  {({ onChange, onBlur, value, ref, id, disabled }) => (
                    <Input
                      id={id}
                      value={value as string}
                      onChange={onChange}
                      onBlur={onBlur}
                      ref={ref}
                      disabled={disabled}
                      placeholder="Enter your LinkedIn URL"
                    />
                  )}
                </FormField>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professional" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="role"
                    label="Role"
                    control={form.control}
                    disabled={!isEditing}
                  >
                    {({ onChange, onBlur, value, ref, id, disabled }) => (
                      <Input
                        id={id}
                        value={(value as string) || ''}
                        onChange={onChange}
                        onBlur={onBlur}
                        ref={ref}
                        disabled={disabled}
                        placeholder="Enter your role"
                      />
                    )}
                  </FormField>
                  <FormField
                    name="company"
                    label="Company"
                    control={form.control}
                    disabled={!isEditing}
                  >
                    {({ onChange, onBlur, value, ref, id, disabled }) => (
                      <Input
                        id={id}
                        value={value as string}
                        onChange={onChange}
                        onBlur={onBlur}
                        ref={ref}
                        disabled={disabled}
                        placeholder="Enter your company"
                      />
                    )}
                  </FormField>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <UserKnowledgeViewer />
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
};

export default Profile; 
