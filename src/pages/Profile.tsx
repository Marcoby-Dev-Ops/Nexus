import React, { useState, useCallback } from 'react';
import { useEnhancedUser } from '@/contexts/EnhancedUserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Separator } from '@/components/ui/Separator';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Progress } from '@/components/ui/Progress';
import { Spinner } from '@/components/ui/Spinner';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  Globe, 
  Shield, 
  Settings,
  Camera,
  Check,
  X,
  Plus,
  Trash2,
  ExternalLink,
  Users,
  Award,
  Languages,
  AlertCircle,
  Save,
  RefreshCw,
  Edit,
  Clock,
  Briefcase,
  Home,
  Coffee
} from 'lucide-react';
import type { UserProfile } from '@/lib/types/userProfile';

export const Profile: React.FC = () => {
  const { user, updateProfile, loading } = useEnhancedUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>(user?.profile || {});

  // Calculate profile completion percentage
  const calculateCompletionPercentage = useCallback(() => {
    if (!user?.profile) return 0;
    
    const fields = [
      'first_name', 'last_name', 'avatar_url', 'bio', 'phone', 
      'job_title', 'department', 'location', 'timezone', 'work_location'
    ];
    
    const completedFields = fields.filter(field => {
      const value = user.profile?.[field as keyof UserProfile];
      return value && value !== '';
    }).length;
    
    return Math.round((completedFields / fields.length) * 100);
  }, [user?.profile]);

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (parentField: keyof UserProfile, nestedField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] as any),
        [nestedField]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setSaveMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage('Failed to update profile. Please try again.');
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(user?.profile || {});
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
            Manage your personal and professional information
          </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Profile Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={profile?.avatar_url} />
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
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profile?.hire_date && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium text-foreground">Joined</p>
                      <p className="text-lg font-bold text-primary">
                        {new Date(profile.hire_date).toLocaleDateString()}
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

                {profile?.status && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium text-foreground">Status</p>
                      <Badge variant={profile.status === 'active' ? 'default' : 'secondary'} className="text-lg">
                        {profile.status}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        value={isEditing ? (formData.display_name || '') : (profile?.display_name || '')}
                        onChange={(e) => handleInputChange('display_name', e.target.value)}
                        disabled={!isEditing}
                        placeholder="How you'd like to be known"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {(isEditing ? formData.skills : profile?.skills)?.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        {isEditing && (
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-1 hover:text-destructive"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        value={isEditing ? (formData.preferences?.language || 'en') : (profile?.preferences?.language || 'en')}
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
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile; 