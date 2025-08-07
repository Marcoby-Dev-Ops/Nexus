import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/index';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Input } from '@/shared/components/ui/Input.tsx';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Progress } from '@/shared/components/ui/Progress.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs.tsx';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Globe, 
  Linkedin, 
  Github, 
  Twitter,
  Save,
  X,
  Edit,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Import our new service patterns
import { useService } from '@/shared/hooks/useService';
import { logger } from '@/shared/utils/logger';
import { useFormWithValidation } from '@/shared/hooks/useFormWithValidation';
import { FormField, FormSection } from '@/shared/components/forms/FormField';
import { userProfileSchema, type UserProfileFormData } from '@/shared/validation/schemas';

import { UserKnowledgeViewer } from '@/components/ai/UserKnowledgeViewer';
import { ProfileVerificationBanner } from '@/components/admin/user/components/ProfileVerificationBanner';

// Define UserProfile type locally since the import doesn't exist
interface UserProfile {
  id: string;
  company_id?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  mobile?: string;
  work_phone?: string;
  personal_email?: string;
  role: 'owner' | 'admin' | 'manager' | 'user';
  department?: string;
  job_title?: string;
  employee_id?: string;
  hire_date?: string;
  manager_id?: string;
  direct_reports?: string[];
  timezone: string;
  location?: string;
  work_location?: 'office' | 'remote' | 'hybrid';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  linkedin_url?: string;
  github_url?: string;
  twitter_url?: string;
  skills?: string[];
  certifications?: string[];
  languages?: { language: string; proficiency: 'basic' | 'intermediate' | 'advanced' | 'native' }[];
  emergency_contact?: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
    date_format?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    time_format?: '12h' | '24h';
    currency?: string;
    [key: string]: unknown;
  };
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  last_login?: string;
  onboardingcompleted: boolean;
  profile_completion_percentage?: number;
  createdat: string;
  updatedat: string;
}

interface DatabaseProfile {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  phone?: string | null;
  mobile?: string | null;
  work_phone?: string | null;
  personal_email?: string | null;
  role?: string | null;
  department?: string | null;
  job_title?: string | null;
  employee_id?: string | null;
  hire_date?: string | null;
  manager_id?: string | null;
  direct_reports?: string[] | null;
  timezone?: string | null;
  location?: string | null;
  work_location?: string | null;
  address?: Record<string, unknown> | null; // Json type from database
  linkedin_url?: string | null;
  github_url?: string | null;
  twitter_url?: string | null;
  skills?: string[] | null;
  certifications?: string[] | null;
  languages?: Record<string, unknown> | null; // Json type from database
  emergency_contact?: Record<string, unknown> | null;
  preferences?: Record<string, unknown> | null;
  status?: string | null;
  last_login?: string | null;
  onboarding_completed?: boolean | null;
  profile_completion_percentage?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  company_id?: string | null;
}

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  
  // Use the new UserService hooks
  const userService = useService('user');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      setIsLoadingProfile(true);
      try {
        const result = await userService.get(user.id);
        if (result.success && result.data) {
          setUserProfile(result.data);
        }
              } catch (error) {
          logger.error('Failed to fetch user profile:', error);
        } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user?.id, userService]);

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

      setIsUpdating(true);
      try {
        const result = await userService.update(user.id, updates);
        if (result.success) {
          setIsEditing(false);
          // Refresh user profile data
          const refreshResult = await userService.get(user.id);
          if (refreshResult.success && refreshResult.data) {
            setUserProfile(refreshResult.data);
          }
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

  // Update form when user profile loads
  useEffect(() => {
    if (userProfile) {
      form.reset({
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
        displayName: userProfile.display_name || '',
        jobTitle: userProfile.job_title || '',
        company: userProfile.company || '',
        role: userProfile.role || '',
        department: userProfile.department || '',
        businessEmail: userProfile.business_email || '',
        personalEmail: userProfile.personal_email || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        website: userProfile.linkedin_url || '',
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile, form]);

  // Calculate profile completion percentage
  const calculateCompletionPercentage = useCallback(() => {
    if (!userProfile) return 0;
    
    const fields = [
      'first_name', 'last_name', 'avatar_url', 'bio', 'phone', 
      'job_title', 'department', 'location', 'timezone', 'work_location'
    ];
    
    const completedFields = fields.filter(field => {
      const value = userProfile[field as keyof typeof userProfile];
      return value && value !== '';
    }).length;
    
    return Math.round((completedFields / fields.length) * 100);
  }, [userProfile]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to current values
    if (userProfile) {
      form.reset({
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
        displayName: userProfile.display_name || '',
        jobTitle: userProfile.job_title || '',
        company: userProfile.company || '',
        role: userProfile.role || '',
        department: userProfile.department || '',
        businessEmail: userProfile.business_email || '',
        personalEmail: userProfile.personal_email || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        website: userProfile.linkedin_url || '',
        phone: userProfile.phone || '',
      });
    }
  };

  const completionPercentage = calculateCompletionPercentage();

  if (isLoadingProfile) {
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
                    {userProfile?.first_name?.[0] || userProfile?.last_name?.[0] || 'U'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {userProfile?.first_name} {userProfile?.last_name}
                    </h3>
                    <p className="text-muted-foreground">{userProfile?.job_title}</p>
                    <p className="text-sm text-muted-foreground">{userProfile?.department}</p>
                  </div>
                </div>

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

                <FormField
                  form={form}
                  name="bio"
                  label="Bio"
                  placeholder="Tell us about yourself"
                  disabled={!isEditing}
                  multiline
                />
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

                <FormField
                  form={form}
                  name="location"
                  label="Location"
                  placeholder="Enter your location"
                  disabled={!isEditing}
                />
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

                <FormField
                  form={form}
                  name="website"
                  label="LinkedIn URL"
                  placeholder="Enter your LinkedIn URL"
                  disabled={!isEditing}
                />
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
                    form={form}
                    name="role"
                    label="Role"
                    placeholder="Enter your role"
                    disabled={!isEditing}
                  />
                  <FormField
                    form={form}
                    name="company"
                    label="Company"
                    placeholder="Enter your company"
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <UserKnowledgeViewer userId={user?.id || ''} />
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
};

export default Profile; 