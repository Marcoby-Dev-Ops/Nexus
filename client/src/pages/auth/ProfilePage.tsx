import React, { useState } from 'react';
import { useAuth } from '@/hooks/index';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
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
  Settings
} from 'lucide-react';

export default function ProfilePage() {
  const { user, signOut, session, refreshAuth } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    company: '',
    jobTitle: '',
    phone: '',
    location: ''
  });

  // Load profile data from database when component mounts
  React.useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id || !session?.session?.accessToken) return;
      
      try {
        const response = await fetch(`/api/db/user_profiles/${user.id}?idColumn=user_id`, {
          headers: {
            'Authorization': `Bearer ${session.session.accessToken}`,
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setFormData({
              firstName: result.data.first_name || '',
              lastName: result.data.last_name || '',
              email: result.data.email || '',
              company: result.data.company_name || '',
              jobTitle: result.data.job_title || '',
              phone: result.data.phone || '',
              location: result.data.location || '',
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, [user?.id, session?.session?.accessToken]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      console.error('No user ID available');
      return;
    }



    if (!session?.session?.accessToken) {
      console.error('No access token available');
      return;
    }

    setSaving(true);
    try {
             // First update the user profile
       const profileResponse = await fetch(`/api/db/user_profiles/${user.id}?idColumn=user_id`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${session.session.accessToken}`,
         },
         body: JSON.stringify({
           first_name: formData.firstName,
           last_name: formData.lastName,
           email: formData.email,
           company_name: formData.company,
           job_title: formData.jobTitle,
           phone: formData.phone,
           location: formData.location,
         }),
       });

       const profileResult = await profileResponse.json();

               // If profile update was successful and company name changed, also update the company and organization
        if (profileResult.success && formData.company) {
          try {
            // Get the company and organization IDs from the user profile
            const profileDataResponse = await fetch(`/api/db/user_profiles/${user.id}?idColumn=user_id`, {
              headers: {
                'Authorization': `Bearer ${session.session.accessToken}`,
              },
            });
            
            if (profileDataResponse.ok) {
              const profileData = await profileDataResponse.json();
              if (profileData.success && profileData.data) {
                // Update the company name if company_id exists
                if (profileData.data.company_id) {
                  const updateCompanyResponse = await fetch(`/api/db/companies/${profileData.data.company_id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.session.accessToken}`,
                    },
                    body: JSON.stringify({
                      name: formData.company,
                    }),
                  });
                  
                  if (!updateCompanyResponse.ok) {
                    console.warn('Failed to update company name, but profile was updated');
                  }
                }
                
                // Update the organization name if organization_id exists
                if (profileData.data.organization_id) {
                  const updateOrgResponse = await fetch(`/api/db/organizations/${profileData.data.organization_id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.session.accessToken}`,
                    },
                    body: JSON.stringify({
                      name: formData.company,
                    }),
                  });
                  
                  if (!updateOrgResponse.ok) {
                    console.warn('Failed to update organization name, but profile was updated');
                  }
                }
              }
            }
          } catch (error) {
            console.warn('Error updating company/organization names:', error);
          }
        }

               const result = profileResult;

      if (result.success) {
        console.log('Profile updated successfully');
        setIsEditing(false);
        
        // Update the user data in the auth context with the new profile data
        if (result.data) {
                     // Update the user object with the new profile data
           const updatedUser = {
             ...user,
             firstName: result.data.first_name,
             lastName: result.data.last_name,
             email: result.data.email,
             company: result.data.company_name,
             jobTitle: result.data.job_title,
             phone: result.data.phone,
             location: result.data.location,
           };
          
          // Update the session with the new user data
          const updatedSession = {
            ...session,
            user: updatedUser,
          };
          
          // Store the updated session in localStorage
          localStorage.setItem('authentik_session', JSON.stringify(updatedSession));
          
          // Force a page reload to refresh the auth context
          window.location.reload();
        }
      } else {
        console.error('Failed to update profile:', result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <Button onClick={handleSignOut} variant="outline">
          Sign Out
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="text-lg">
                {/* Defensive: fallback to email if names are missing */}
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                {user.lastName?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">
                {/* Defensive: fallback to display_name or email if names are missing */}
                {(user.firstName || user.lastName)
                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                  : (user.displayName || user.email || 'User')}
              </h3>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>
            Manage your account security and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('🔍 Password change button clicked!');
                const authentikUrl = 'https://identity.marcoby.com';
                const fullUrl = `${authentikUrl}/if/flow/default-password-change/`;
                console.log('🔍 Opening URL:', fullUrl);
                window.open(fullUrl, '_blank');
              }}
            >
              Change
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('🔍 Notifications button clicked!');
                navigate('/notifications');
              }}
            >
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
