import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/index';
import { DatabaseService } from '@/core/database/DatabaseService';
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
import { UserKnowledgeViewer } from '@/components/ai/UserKnowledgeViewer';
import { ProfileVerificationBanner } from '@/components/admin/user/components/ProfileVerificationBanner';

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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Helper function to convert database profile to UserProfile format
  const convertDbProfileToUserProfile = (dbProfile: DatabaseProfile | null | undefined): Partial<UserProfile> => {
    if (!dbProfile) return {};
    
    return {
      id: dbProfile.id || '',
      firstname: dbProfile.first_name || undefined,
      lastname: dbProfile.last_name || undefined,
      displayname: dbProfile.display_name || dbProfile.name || undefined,
      avatarurl: dbProfile.avatar_url || undefined,
      bio: dbProfile.bio || undefined,
      phone: dbProfile.phone || undefined,
      mobile: dbProfile.mobile || undefined,
      workphone: dbProfile.work_phone || undefined,
      personalemail: dbProfile.personal_email || undefined,
      role: (dbProfile.role as 'owner' | 'admin' | 'manager' | 'user') || 'user',
      department: dbProfile.department || undefined,
      jobtitle: dbProfile.job_title || undefined,
      employeeid: dbProfile.employee_id || undefined,
      hiredate: dbProfile.hire_date || undefined,
      managerid: dbProfile.manager_id || undefined,
      directreports: dbProfile.direct_reports || undefined,
      timezone: dbProfile.timezone || 'UTC',
      location: dbProfile.location || undefined,
      worklocation: (dbProfile.work_location as 'office' | 'remote' | 'hybrid') || undefined,
      address: typeof dbProfile.address === 'object' && dbProfile.address !== null ? dbProfile.address : undefined,
      linkedinurl: dbProfile.linkedin_url || undefined,
      githuburl: dbProfile.github_url || undefined,
      twitterurl: dbProfile.twitter_url || undefined,
      skills: dbProfile.skills || undefined,
      certifications: dbProfile.certifications || undefined,
      languages: Array.isArray(dbProfile.languages) 
        ? dbProfile.languages.map((lang: unknown) => ({ 
            language: typeof lang === 'string' ? lang : String(lang), 
            proficiency: 'intermediate' as const 
          }))
        : undefined,
      emergencycontact: dbProfile.emergency_contact || undefined,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en',
        ...(typeof dbProfile.preferences === 'object' && dbProfile.preferences !== null ? dbProfile.preferences: {})
      },
      status: (dbProfile.status as 'active' | 'inactive' | 'pending' | 'suspended') || undefined,
      lastlogin: dbProfile.last_login || undefined,
      onboardingcompleted: dbProfile.onboarding_completed || false,
      profilecompletion_percentage: dbProfile.profile_completion_percentage || undefined,
      createdat: dbProfile.created_at || new Date().toISOString(),
      updatedat: dbProfile.updated_at || new Date().toISOString(),
      companyid: dbProfile.company_id || undefined
    };
  };

  const [formData, setFormData] = useState<Partial<UserProfile>>(() => convertDbProfileToUserProfile(user?.profile as DatabaseProfile));

  // Calculate profile completion percentage
  const calculateCompletionPercentage = useCallback(() => {
    if (!user?.profile) return 0;
    
    const fields = [
      'first_name', 'last_name', 'avatar_url', 'bio', 'phone', 
      'job_title', 'department', 'location', 'timezone', 'work_location'
    ];
    
    const completedFields = fields.filter(field => {
      const value = user.profile?.[field as keyof typeof user.profile];
      return value && value !== '';
    }).length;
    
    return Math.round((completedFields / fields.length) * 100);
  }, [user]);

  const handleInputChange = (field: keyof UserProfile, value: string | number | boolean | string[] | undefined) => {
    setFormData((prev: Partial<UserProfile>) => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (parentField: keyof UserProfile, nestedField: string, value: string | number | boolean) => {
    setFormData((prev: Partial<UserProfile>) => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] as Record<string, unknown>),
        [nestedField]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Use DatabaseService to update the profile
      await DatabaseService.updateUserProfile(user.id, formData);
      
      setSaveMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setSaveMessage('Failed to update profile. Please try again.');
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(convertDbProfileToUserProfile(user?.profile as DatabaseProfile));
    setIsEditing(false);
  };

  const addSkill = (skill: string) => {
    if (!skill.trim()) return;
    const currentSkills = formData.skills || [];
    if (!currentSkills.includes(skill.trim())) {
      handleInputChange('skills', [...currentSkills, skill.trim()]);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = formData.skills || [];
    handleInputChange('skills', currentSkills.filter(skill => skill !== skillToRemove));
  };

  const completionPercentage = calculateCompletionPercentage();
  const profile = user?.profile;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
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
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Spinner />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <Alert className={saveMessage.includes('success') ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}

      {/* Profile vs Settings Distinction */}
      <Card className="bg-primary/5 border-border">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Profile vs Account Settings</h3>
              <p className="text-sm text-primary mt-1">
                <strong>Profile: </strong> Your professional identity, bio, and public information visible to team members.
              </p>
              <p className="text-sm text-primary">
                <strong>Account Settings: </strong> Private account details, security settings, and system preferences.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 border-border text-primary hover: bg-primary/10"
                onClick={() => navigate('/settings')}
              >
                Go to Account Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg: grid-cols-4 gap-6">
        {/* Sidebar - Profile Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Verification Banner */}
          <ProfileVerificationBanner className="mb-6" />
          
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {user?.initials || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Name and Title */}
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">
                    {user?.full_name || profile?.display_name || 'User'}
                  </h2>
                  {profile?.job_title && (
                    <p className="text-muted-foreground font-medium">
                      {profile.job_title}
                    </p>
                  )}
                  {profile?.department && (
                    <Badge variant="secondary" className="text-xs">
                      {profile.department}
                    </Badge>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center justify-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center justify-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>

                {/* Work Location Badge */}
                {profile?.work_location && (
                  <div className="flex justify-center">
                    <Badge variant="outline" className="text-xs">
                      {profile.work_location === 'remote' ? (
                        <>
                          <Home className="h-3 w-3 mr-1" />
                          Remote
                        </>
                      ) : profile.work_location === 'hybrid' ? (
                        <>
                          <Coffee className="h-3 w-3 mr-1" />
                          Hybrid
                        </>
                      ) : (
                        <>
                          <Briefcase className="h-3 w-3 mr-1" />
                          Office
                        </>
                      )}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Shield className="h-4 w-4 mr-2 text-primary" />
                Profile Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-primary">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Complete your profile to unlock all features and improve your experience.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Company Info */}
          {user?.company && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-primary" />
                  Company
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{user.company.name}</h3>
                    {user.company.industry && (
                      <p className="text-sm text-muted-foreground">
                        {user.company.industry}
                      </p>
                    )}
                  </div>
                  {user.company.size && (
                    <Badge variant="outline" className="text-xs">
                      {user.company.size}
                    </Badge>
                  )}
                  {profile?.role && (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium capitalize">{profile.role}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg: col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="knowledge">
                <Brain className="h-4 w-4 mr-2" />
                Knowledge
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {profile?.bio && (
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              {profile?.skills && profile.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Skills & Expertise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
                {/* Employment Info */}
                {(user?.profile as DatabaseProfile)?.hire_date && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium text-foreground">Joined</p>
                      <p className="text-lg font-bold text-primary">
                        {new Date((user?.profile as DatabaseProfile).hire_date!).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {profile?.timezone && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium text-foreground">Timezone</p>
                      <p className="text-lg font-bold text-primary">
                        {profile.timezone.replace('_', ' ')}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Status Badge */}
                {(user?.profile as DatabaseProfile)?.status && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium text-foreground">Status</p>
                      <Badge variant={(user?.profile as DatabaseProfile).status === 'active' ? 'default' : 'secondary'} className="text-lg">
                        {(user?.profile as DatabaseProfile).status}
                      </Badge>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Your basic personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={isEditing ? (formData.first_name || '') : (profile?.first_name || '')}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={isEditing ? (formData.last_name || '') : (profile?.last_name || '')}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2 md: col-span-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        value={isEditing ? (formData.display_name || '') : (profile?.display_name || '')}
                        onChange={(e) => handleInputChange('display_name', e.target.value)}
                        disabled={!isEditing}
                        placeholder="How you'd like to be known"
                      />
                    </div>
                    <div className="space-y-2 md: col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={isEditing ? (formData.bio || '') : (profile?.bio || '')}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={isEditing ? (formData.phone || '') : (profile?.phone || '')}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="personal_email">Personal Email</Label>
                      <Input
                        id="personal_email"
                        type="email"
                        value={isEditing ? (formData.personal_email || '') : (profile?.personal_email || '')}
                        onChange={(e) => handleInputChange('personal_email', e.target.value)}
                        disabled={!isEditing}
                        placeholder="personal@example.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Professional Information Tab */}
            <TabsContent value="professional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Work Information</CardTitle>
                  <CardDescription>
                    Job details and organizational information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        value={isEditing ? (formData.job_title || '') : (profile?.job_title || '')}
                        onChange={(e) => handleInputChange('job_title', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={isEditing ? (formData.department || '') : (profile?.department || '')}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Engineering"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={isEditing ? (formData.location || '') : (profile?.location || '')}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        disabled={!isEditing}
                        placeholder="New York, NY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="work_location">Work Location Type</Label>
                      <Select
                        value={isEditing ? (formData.work_location || 'office') : (profile?.work_location || 'office')}
                        onValueChange={(value) => handleInputChange('work_location', value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Skills & Expertise
                  </CardTitle>
                  <CardDescription>
                    Add your skills and areas of expertise
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {(isEditing ? formData.skills: profile?.skills)?.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        {isEditing && (
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-1 hover: text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    )) || []}
                  </div>
                  
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkill(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addSkill(input.value);
                          input.value = '';
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>
                    Customize your experience and display settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={isEditing ? (formData.timezone || 'UTC') : (profile?.timezone || 'UTC')}
                        onValueChange={(value) => handleInputChange('timezone', value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={isEditing ? (formData.preferences?.language || 'en') : (
                          typeof profile?.preferences === 'object' && 
                          profile?.preferences !== null &&
                          'language' in profile.preferences ? 
                          String((profile.preferences as Record<string, unknown>).language || 'en') : 'en'
                        )}
                        onValueChange={(value) => handleNestedInputChange('preferences', 'language', value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Knowledge Tab */}
            <TabsContent value="knowledge" className="space-y-6">
              <UserKnowledgeViewer />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile; 