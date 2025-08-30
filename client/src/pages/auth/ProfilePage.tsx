import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Badge } from '@/shared/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { Separator } from '@/shared/components/ui/Separator';
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
  Shield,
  Bell,
  Key,
  Settings,
  GraduationCap
} from 'lucide-react';

// Import our new form patterns
import { useFormWithValidation } from '@/shared/components/forms/useFormWithValidation';
import { FormField } from '@/shared/components/forms/FormField';
import { userProfileSchema, type UserProfileFormData } from '@/shared/validation/schemas';

// Import auth onboarding components
import { AuthOnboardingDashboard } from '@/components/auth/AuthOnboardingDashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';

interface DatabaseProfile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  job_title?: string | null;
  company?: string | null;
  role?: string | null;
  department?: string | null;
  business_email?: string | null;
  personal_email?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  company_id?: string | null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock user profile data - replace with actual service call
  const [userProfile, setUserProfile] = useState<DatabaseProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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

      try {
        // Mock update - replace with actual service call
        console.log('Updating profile:', updates);
        setIsEditing(false);
      } catch (error) {
        throw new Error('Failed to update profile');
      }
    },
    successMessage: 'Profile updated successfully!',
  });

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Mock profile data - replace with actual service call
        const mockProfile: DatabaseProfile = {
          id: user?.id || '',
          user_id: user?.id || '',
          email: user?.email || '',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
          display_name: 'John',
          avatar_url: null,
          bio: 'Entrepreneur and business enthusiast',
          job_title: 'CEO',
          company: 'Nexus Inc',
          role: 'admin',
          department: 'Executive',
          business_email: 'john@nexus.com',
          personal_email: 'john.doe@email.com',
          location: 'San Francisco, CA',
          linkedin_url: 'https://linkedin.com/in/johndoe',
          phone: '+1 (555) 123-4567',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        setUserProfile(mockProfile);
        
        // Update form with profile data
        form.reset({
          firstName: mockProfile.first_name || '',
          lastName: mockProfile.last_name || '',
          displayName: mockProfile.display_name || '',
          jobTitle: mockProfile.job_title || '',
          company: mockProfile.company || '',
          role: mockProfile.role || '',
          department: mockProfile.department || '',
          businessEmail: mockProfile.business_email || '',
          personalEmail: mockProfile.personal_email || '',
          bio: mockProfile.bio || '',
          location: mockProfile.location || '',
          website: mockProfile.linkedin_url || '',
          phone: mockProfile.phone || '',
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (user?.id) {
      loadProfile();
    }
  }, [user?.id, form]);

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Overview
                </CardTitle>
                <CardDescription>
                  Your account information and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={userProfile?.avatar_url || ''} />
                    <AvatarFallback>
                      {userProfile?.first_name?.[0]}{userProfile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {userProfile?.full_name || 'User Name'}
                    </h3>
                    <p className="text-muted-foreground">{userProfile?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{userProfile?.role || 'user'}</Badge>
                      <Badge variant="outline">{userProfile?.department || 'General'}</Badge>
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
                        <span className="text-sm">{userProfile?.email}</span>
                      </div>
                      {userProfile?.business_email && (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{userProfile.business_email}</span>
                        </div>
                      )}
                      {userProfile?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{userProfile.phone}</span>
                        </div>
                      )}
                      {userProfile?.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{userProfile.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Work Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{userProfile?.company || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{userProfile?.job_title || 'Not specified'}</span>
                      </div>
                      {userProfile?.bio && (
                        <div className="text-sm text-muted-foreground">
                          {userProfile.bio}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Edit Profile
                </CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Change Password</h4>
                        <p className="text-sm text-muted-foreground">
                          Update your account password
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Active Sessions</h4>
                        <p className="text-sm text-muted-foreground">
                          Manage your active login sessions
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Customize your experience and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Email Notifications</h4>
                        <p className="text-sm text-muted-foreground">
                          Manage your email notification preferences
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Interface Preferences</h4>
                        <p className="text-sm text-muted-foreground">
                          Customize your dashboard and interface
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Customize
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Privacy Settings</h4>
                        <p className="text-sm text-muted-foreground">
                          Control your data and privacy
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auth Learning Center */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Auth Learning Center
                </CardTitle>
                <CardDescription>
                  Master your account management and security features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuthOnboardingDashboard
                  showProgress={true}
                  onModuleStart={(moduleId) => {
                    // eslint-disable-next-line no-console
                    console.log('Started auth module:', moduleId);
                  }}
                  onModuleComplete={(moduleId) => {
                    // eslint-disable-next-line no-console
                    console.log('Completed auth module:', moduleId);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 
