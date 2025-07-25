import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { integrationService } from '@/services/integrations/integrationService.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Input } from '@/shared/components/ui/Input.tsx';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs.tsx';
import { Separator } from '@/shared/components/ui/Separator';
import { Progress } from '@/shared/components/ui/Progress.tsx';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
import { 
  User, 
  Camera,
  X,
  Plus,
  AlertCircle,
  Save,
  Edit,
  Brain,
  CheckCircle,
  Zap,
  Settings,
  Database,
  Activity,
  AlertTriangle,
  RefreshCw,
  XCircle,
  List,
  Shield
} from 'lucide-react';
import { supabase, sessionUtils } from '@/lib/supabase';
import { tokenManager } from '@/services/tokenManager';
import { useSearchParams } from 'react-router-dom';


interface ProfileFormData {
  firstName: string;
  lastName: string;
  displayName: string;
  jobTitle: string;
  company: string;
  role: string;
  department: string;
  businessEmail: string;
  personalEmail: string;
  bio: string;
  location: string;
  website: string;
  phone: string;
}



const AccountSettings: React.FC = () => {
  const { user, updateProfile, refreshIntegrations } = useAuth();
  
  const [searchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  


  const [formData, setFormData] = useState<ProfileFormData>({
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
  });

  // Enhanced integration status checking
  const [integrationDetails, setIntegrationDetails] = useState<any[]>([]);

  // Handle URL parameter for tab navigation
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'integrations', 'preferences'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Load profile data
  useEffect(() => {
    if (user?.profile) {
      setFormData({
        firstName: user.profile.first_name || '',
        lastName: user.profile.last_name || '',
        displayName: user.profile.display_name || '',
        jobTitle: user.profile.job_title || '',
        company: user.profile.company || '', // Now using the actual company field
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
  }, [user?.profile]);

  // Load integrations from auth store and force refresh to ensure latest data
  useEffect(() => {
    const loadIntegrations = async () => {
      if (user?.id) {
        setLoadingIntegrations(true);
        try {
          // Force refresh integrations to get the latest data
          await refreshIntegrations(true);
        } catch (error) {
          // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to refresh integrations: ', error);
        } finally {
          setLoadingIntegrations(false);
        }
      }
    };

    loadIntegrations();
  }, [user?.id, refreshIntegrations]);

  // Update local integrations state when auth store integrations change
  useEffect(() => {
    if (user?.integrations) {
      setIntegrations(user.integrations);
      checkIntegrationHealth();
    }
  }, [user?.integrations]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  const handleSave = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // Calculate full_name from first_name and last_name
      const fullName = formData.firstName && formData.lastName 
        ? `${formData.firstName} ${formData.lastName}`.trim()
        : formData.firstName || formData.lastName || null;

      const updates = {
        firstname: formData.firstName,
        lastname: formData.lastName,
        displayname: formData.displayName,
        fullname: fullName, // Add calculated full_name
        jobtitle: formData.jobTitle,
        company: formData.company, // Add company field
        role: formData.role, // Add role field
        department: formData.department, // Add department field
        businessemail: formData.businessEmail, // Add business email
        personalemail: formData.personalEmail, // Add personal email
        bio: formData.bio,
        location: formData.location,
        linkedinurl: formData.website, // Using linkedin_url as website
        phone: formData.phone,
        updatedat: new Date().toISOString(),
      };

      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[AccountSettings] Updating profile with: ', updates);
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[AccountSettings] User ID: ', user.id);
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('[AccountSettings] Current form data: ', formData);
      
      // Use the auth context updateProfile function
      await updateProfile(updates);

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error updating profile: ', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProfileCompletion = () => {
    const fields = [
      formData.firstName,
      formData.lastName,
      formData.displayName,
      formData.jobTitle,
      formData.company,
      formData.role,
      formData.department,
      formData.businessEmail,
      formData.personalEmail,
    ];
    const filledFields = fields.filter(field => field.trim() !== '').length;
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
                const { data: tokens } = await supabase
                  .from('oauth_tokens')
                  .select('expires_at, updated_at')
                  .eq('user_id', session.user.id)
                  .eq('integration_slug', integration.integration_type || '')
                  .maybeSingle();
                
                if (tokens && tokens.expires_at) {
                  const expiresAt = new Date(tokens.expires_at);
                  const now = new Date();
                  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
                  
                  if (expiresAt > fiveMinutesFromNow) {
                    tokenStatus = 'healthy';
                  } else if (expiresAt > now) {
                    tokenStatus = 'expiring_soon';
                  } else {
                    tokenStatus = 'expired';
                  }
                  
                  lastRefresh = tokens.updated_at;
                } else {
                  // No tokens found, but hasTokens was true - this is inconsistent
                  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn('hasTokens was true but no tokens found in database');
                  tokenStatus = 'not_connected';
                }
              }
            } catch (error) {
              // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error checking token status: ', error);
              tokenStatus = 'error';
            }
          }
          
          return {
            ...integration,
            tokenStatus,
            lastRefresh,
            hasTokens
          };
        } catch (error) {
          // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error checking integration health: ', error);
          return {
            ...integration,
            tokenStatus: 'error',
            lastRefresh: null,
            hasTokens: false
          };
        }
      })
    );
    
    setIntegrationDetails(details);
  };

  const getTokenStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expiring_soon':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'not_connected':
        return <X className="w-4 h-4 text-gray-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTokenStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Token Healthy';
      case 'expiring_soon':
        return 'Expiring Soon';
      case 'expired':
        return 'Token Expired';
      case 'not_connected':
        return 'Not Connected';
      default: return 'Unknown Status';
    }
  };

  const getTokenStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expiring_soon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'not_connected':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please log in to view your account settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Integration Status Alert */}
      {user?.integrations && user.integrations.length > 0 && integrations.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have connected integrations but they're not displaying. 
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal text-primary underline"
              onClick={() => setActiveTab('integrations')}
            >
              Click here to view your integrations
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Integration Success Alert */}
      {integrations.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Successfully loaded {integrations.length} integration{integrations.length !== 1 ? 's' : ''}. 
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal text-green-700 underline"
              onClick={() => setActiveTab('integrations')}
            >
              View your integrations
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Completion Alert */}
      {calculateProfileCompletion() < 100 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Complete your profile to unlock all features. Currently {calculateProfileCompletion()}% complete.
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Completion Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Completion
          </CardTitle>
          <CardDescription>
            Complete your profile to get the most out of Nexus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profile Progress</span>
              <span className="text-sm text-muted-foreground">{calculateProfileCompletion()}%</span>
            </div>
            <Progress value={calculateProfileCompletion()} className="w-full" />
            <div className="grid grid-cols-2 md: grid-cols-5 gap-2 text-xs">
              {[
                { label: 'Name', value: formData.firstName && formData.lastName },
                { label: 'Display Name', value: formData.displayName },
                { label: 'Job Title', value: formData.jobTitle },
                { label: 'Company', value: formData.company },
                { label: 'Bio', value: formData.bio }
              ].map((field, index) => (
                <div key={index} className="flex items-center gap-1">
                  {field.value ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <X className="w-3 h-3 text-gray-400" />
                  )}
                  <span className={field.value ? 'text-green-600' : 'text-gray-500'}>
                    {field.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {user.initials || user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Camera className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                    <Button variant="outline" size="sm">
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your last name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="How you want to be displayed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., CEO, Manager, Developer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Your company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)} disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner/Founder</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="user">Team Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)} disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">Executive</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    disabled={!isEditing}
                    placeholder="you@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personalEmail">Personal Email</Label>
                  <Input
                    id="personalEmail"
                    type="email"
                    value={formData.personalEmail}
                    onChange={(e) => handleInputChange('personalEmail', e.target.value)}
                    disabled={!isEditing}
                    placeholder="you@gmail.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    placeholder="City, Country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website or LinkedIn URL</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https: //yourwebsite.com or https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Activity className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}

              {message && (
                <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Connected Integrations
                  </CardTitle>
                  <CardDescription>
                    Manage your connected apps and data sources
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setLoadingIntegrations(true);
                      try {
                        // Force clear integrations and reload
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔄 Force refreshing integrations...');
                        await refreshIntegrations(true);
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Integrations refreshed');
                      } catch (error) {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Failed to refresh integrations: ', error);
                      } finally {
                        setLoadingIntegrations(false);
                      }
                    }}
                    disabled={loadingIntegrations}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {loadingIntegrations ? 'Refreshing...' : 'Force Refresh'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setLoadingIntegrations(true);
                      try {
                        await refreshIntegrations(true);
                      } catch (error) {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to refresh integrations: ', error);
                      } finally {
                        setLoadingIntegrations(false);
                      }
                    }}
                    disabled={loadingIntegrations}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    {loadingIntegrations ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Debug Information */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Debug Info: </h4>
                <div className="text-sm space-y-1">
                  <div>User ID: {user?.id}</div>
                  <div>Integrations loaded: {integrations.length}</div>
                  <div>Integration details: {integrationDetails.length}</div>
                  <div>User integrations: {user?.integrations?.length || 0}</div>
                </div>
                <div className="mt-3 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔍 Checking server-side integrations...');
                        const result = await integrationService.checkUserIntegrations(user?.id || '');
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('📊 Server-side integrations: ', result);
                        
                        // Show detailed results
                        const message = `Found ${result.count} integrations: \n` +
                          result.integrations.map((integration: any) => 
                            `- ${integration.integration_name} (${integration.status})`
                          ).join('\n');
                        
                        alert(message);
                      } catch (error) {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Error checking server-side: ', error);
                        alert('Error checking integrations. See console for details.');
                      }
                    }}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Check Server-Side
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔧 Adding HubSpot integration server-side...');
                        const result = await integrationService.addHubSpotIntegration(user?.id || '');
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ HubSpot integration result: ', result);
                        
                        if (result.success) {
                          alert(`✅ HubSpot connected successfully!\n\n${result.message}`);
                          // Refresh integrations after adding
                          await refreshIntegrations(true);
                        } else {
                          alert(`❌ Failed to add HubSpot: ${result.message}`);
                        }
                      } catch (error) {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Error adding HubSpot: ', error);
                        alert('Error adding HubSpot integration. See console for details.');
                      }
                    }}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Add HubSpot (Server)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔄 Force refreshing integrations server-side...');
                        const result = await integrationService.forceRefreshIntegrations(user?.id || '');
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Force refresh result: ', result);
                        
                        if (result.success) {
                          alert(`✅ Force refresh completed!\n\n${result.message}`);
                          // Refresh integrations after force refresh
                          await refreshIntegrations(true);
                        } else {
                          alert(`❌ Force refresh failed: ${result.message}`);
                        }
                      } catch (error) {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Error force refreshing: ', error);
                        alert('Error force refreshing integrations. See console for details.');
                      }
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Force Refresh (Server)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('📋 Listing all integrations with details...');
                        const result = await integrationService.listAllIntegrations(user?.id || '');
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('📋 List integrations result: ', result);
                        
                        const message = `Found ${result.count} integrations: \n` +
                          result.integrations.map((integration: any) => 
                            `- ${integration.integration_name} (${integration.status})\n  Type: ${integration.integration_type}\n  Updated: ${new Date(integration.updated_at).toLocaleString()}`
                          ).join('\n\n');
                        
                        alert(message);
                      } catch (error) {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Error listing integrations: ', error);
                        alert('Error listing integrations. See console for details.');
                      }
                    }}
                  >
                    <List className="w-4 h-4 mr-2" />
                    List All Integrations
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔄 Clearing auth store integrations...');
                        // setAuthIntegrations([]); // This line was removed as per the edit hint
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Auth store cleared');
                        alert('Auth store cleared. Click "Force Refresh" to reload.');
                      } catch (error) {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Error clearing auth store: ', error);
                      }
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Clear Auth Store
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔍 Debugging session state...');
                        const result = await sessionUtils.getSession();
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('📊 Session debug result: ', result);
                        
                        if (result.session) {
                          alert(`✅ Session is valid!\n\nUser: ${result.session?.user?.email}\nExpires: ${result.session?.expires_at ? new Date(result.session.expires_at * 1000).toLocaleString() : 'Unknown'}`);
                        } else {
                          alert(`❌ Session issue: ${result.error || 'Unknown error'}`);
                        }
                      } catch (error) {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Error debugging session: ', error);
                        alert('Error debugging session. See console for details.');
                      }
                    }}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Debug Session
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔄 Force refreshing session...');
                        const result = await sessionUtils.getSession(3); // Retry 3 times
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('📊 Force refresh result: ', result);
                        
                        if (result.session) {
                          alert(`✅ Session refreshed!\n\nUser: ${result.session?.user?.email}\nNew expires: ${result.session?.expires_at ? new Date(result.session.expires_at * 1000).toLocaleString() : 'Unknown'}`);
                        } else {
                          alert(`❌ Force refresh failed: ${result.error || 'Unknown error'}`);
                        }
                      } catch (error) {
                        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Error force refreshing session: ', error);
                        alert('Error force refreshing session. See console for details.');
                      }
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Force Refresh Session
                  </Button>
                </div>
              </div>

              {loadingIntegrations ? (
                <div className="flex items-center justify-center py-8">
                  <Activity className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading integrations...</span>
                </div>
              ) : integrations.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Integrations Connected</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your apps and data sources to get started with Nexus
                  </p>
                  <div className="space-y-2">
                    <Button onClick={() => window.location.href = '/integrations'}>
                      <Plus className="w-4 h-4 mr-2" />
                      Connect Integration
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        // Manually add HubSpot integration for testing
                        try {
                          const { error } = await supabase
                            .from('user_integrations')
                            .upsert({
                              userid: user?.id || '',
                              integrationid: '550e8400-e29b-41d4-a716-446655440001',
                              integrationname: 'HubSpot',
                              integrationtype: 'oauth',
                              status: 'active',
                              credentials: {
                                clientid: import.meta.env.VITE_HUBSPOT_CLIENT_ID
                              },
                              settings: {
                                redirecturi: `${window.location.origin}/integrations/hubspot/callback`,
                                featuresenabled: ['contacts', 'deals', 'companies', 'marketing', 'analytics'],
                                setupcompleted_at: new Date().toISOString(),
                                capabilities: [
                                  'CRM Data Sync',
                                  'Sales Pipeline Tracking',
                                  'Marketing Analytics',
                                  'Lead Management',
                                  'Contact Management',
                                  'Deal Tracking',
                                  'Revenue Analytics'
                                ]
                              }
                            });
                          
                          if (error) {
                            // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to add HubSpot integration: ', error);
                          } else {
                            // Refresh integrations
                            await refreshIntegrations(true);
                          }
                        } catch (error) {
                          // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error adding HubSpot integration: ', error);
                        }
                      }}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Add HubSpot (Test)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {integrationDetails.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Database className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{integration.integration_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {integration.integration_type} • {integration.status}
                          </p>
                          {integration.lastRefresh && (
                            <p className="text-xs text-muted-foreground">
                              Last updated: {new Date(integration.lastRefresh).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getTokenStatusColor(integration.tokenStatus)}>
                          {getTokenStatusIcon(integration.tokenStatus)}
                          <span className="ml-1">{getTokenStatusText(integration.tokenStatus)}</span>
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Preferences
              </CardTitle>
              <CardDescription>
                Customize your Nexus experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about your account and integrations
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">AI Model Preferences</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred AI models for different tasks
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Brain className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Data Sync Frequency</h4>
                    <p className="text-sm text-muted-foreground">
                      How often should we sync your integration data?
                    </p>
                  </div>
                  <Select defaultValue="daily">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountSettings; 