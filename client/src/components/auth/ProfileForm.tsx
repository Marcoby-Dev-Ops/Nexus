import React from 'react';
import { logger } from '@/shared/utils/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Separator } from '@/shared/components/ui/Separator';
import { FormField } from '@/shared/components/forms/FormField';
import { useFormWithValidation } from '@/shared/components/forms/useFormWithValidation';
import { userProfileSchema, type UserProfileFormData } from '@/shared/validation/schemas';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { 
  User, 
  Mail, 
  Building, 
  MapPin, 
  Phone, 
  Globe, 
  Edit, 
  Save, 
  X,
  Upload
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';

interface ProfileFormProps {
  onSave?: (data: UserProfileFormData) => void;
  onCancel?: () => void;
  isEditing?: boolean;
  onToggleEdit?: () => void;
}

export function ProfileForm({ 
  onSave, 
  onCancel, 
  isEditing = false, 
  onToggleEdit 
}: ProfileFormProps) {
  const { profile, loading, error, updateProfile } = useUserProfile();

  const { form, handleSubmit, isSubmitting, errors } = useFormWithValidation({
    schema: userProfileSchema,
    defaultValues: {
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      displayName: profile?.display_name || '',
      jobTitle: profile?.job_title || '',
      company: profile?.company || '',
      role: profile?.role || '',
      department: profile?.department || '',
      businessEmail: profile?.business_email || '',
      personalEmail: profile?.personal_email || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      website: profile?.linkedin_url || '',
      phone: profile?.phone || '',
    },
    onSubmit: async (data: UserProfileFormData) => {
      try {
        const updates = {
          first_name: data.firstName,
          last_name: data.lastName,
          display_name: data.displayName,
          job_title: data.jobTitle,
          company: data.company,
          role: data.role,
          department: data.department,
          business_email: data.businessEmail,
          personal_email: data.personalEmail,
          bio: data.bio,
          location: data.location,
          linkedin_url: data.website,
          phone: data.phone,
        };

        await updateProfile(updates);
        onSave?.(data);
      } catch (error) {
        logger.error('Failed to update profile:', error);
        throw error;
      }
    },
    successMessage: 'Profile updated successfully!',
  });

  // Update form when profile loads
  React.useEffect(() => {
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading profile...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Failed to load profile: {error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal and professional information
            </CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={onToggleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          // View Mode
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback>
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">
                  {profile?.full_name || 'User Name'}
                </h3>
                <p className="text-muted-foreground">{profile?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{profile?.role || 'user'}</Badge>
                  <Badge variant="outline">{profile?.department || 'General'}</Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profile?.email}</span>
                  </div>
                  {profile?.business_email && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile.business_email}</span>
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile.phone}</span>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Work Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profile?.company || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profile?.job_title || 'Not specified'}</span>
                  </div>
                  {profile?.bio && (
                    <div className="text-sm text-muted-foreground">
                      {profile.bio}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                label="First Name"
                placeholder="John"
                error={errors.firstName}
              />
              <FormField
                control={form.control}
                name="lastName"
                label="Last Name"
                placeholder="Doe"
                error={errors.lastName}
              />
            </div>

            <FormField
              control={form.control}
              name="displayName"
              label="Display Name"
              placeholder="How you want to be called"
              error={errors.displayName}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobTitle"
                label="Job Title"
                placeholder="CEO, Manager, etc."
                error={errors.jobTitle}
              />
              <FormField
                control={form.control}
                name="company"
                label="Company"
                placeholder="Your company name"
                error={errors.company}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                label="Role"
                error={errors.role}
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
                control={form.control}
                name="department"
                label="Department"
                error={errors.department}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessEmail"
                label="Business Email"
                type="email"
                placeholder="work@company.com"
                error={errors.businessEmail}
              />
              <FormField
                control={form.control}
                name="personalEmail"
                label="Personal Email"
                type="email"
                placeholder="personal@email.com"
                error={errors.personalEmail}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              label="Location"
              placeholder="City, State"
              error={errors.location}
            />

            <FormField
              control={form.control}
              name="website"
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/username"
              error={errors.website}
            />

            <FormField
              control={form.control}
              name="phone"
              label="Phone Number"
              placeholder="+1 (555) 123-4567"
              error={errors.phone}
            />

            <FormField
              control={form.control}
              name="bio"
              label="Bio"
              placeholder="Tell us about yourself..."
              multiline
              rows={4}
              error={errors.bio}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
} 
