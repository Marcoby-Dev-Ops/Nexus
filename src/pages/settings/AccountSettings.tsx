import React, { useState, useEffect } from 'react';
import { User, MapPin, Globe, Save, CheckCircle, AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/core/supabase';
import type { Database } from '@/lib/core/database.types';
import { Separator } from '@/components/ui/Separator';
import { analyticsService } from '@/lib/services/analyticsService';
import AddressAutocomplete from '@/components/forms/AddressAutocomplete';

/**
 * AccountSettings - Personal account settings page
 * 
 * Allows users to view and update their account information
 */
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];

const AccountSettings: React.FC = () => {
  const { user, session, updateProfile, updateCompany } = useAuth();
  const { addNotification } = useNotifications();

  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthday: '',
    businessAddress1: '',
    businessAddress2: '',
    city: '',
    postalCode: '',
    country: '',
    timezone: 'UTC',
    language: 'en',
    orgName: '',
  });

  // Populate defaults from user context
  useEffect(() => {
    if (!user) return;
    setFormData(prev => ({
      ...prev,
      firstName: user.profile?.first_name || '',
      lastName: user.profile?.last_name || '',
      phone: user.profile?.phone || '',
      businessAddress1: (user.profile as any)?.address?.line1 ?? '',
      businessAddress2: (user.profile as any)?.address?.line2 ?? '',
      city: (user.profile as any)?.address?.city ?? '',
      postalCode: (user.profile as any)?.address?.postal_code ?? '',
      country: (user.profile as any)?.address?.country ?? '',
      timezone: user.profile?.timezone || 'UTC',
      language: (user.profile?.preferences as any)?.language || 'en',
      orgName: user.company?.name ?? '',
    }));
  }, [user]);

  // Initialize analytics when user is available
  useEffect(() => {
    if (user) {
      analyticsService.init(user.id, {
        email: user.email,
        company_id: user.company?.id,
      });
    }
    return () => analyticsService.reset();
  }, [user]);

  const handleValueChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    analyticsService.track('profile_field_edited', { field_name: name });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleValueChange(e.target.name, e.target.value);
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      
      if (error) throw error;
      
      addNotification({
        message: 'Verification email sent successfully',
        type: 'success',
      });
    } catch (err) {
      addNotification({
        message: err instanceof Error ? err.message : 'Failed to send verification email',
        type: 'error',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      addNotification({
        message: 'No user session found. Please log in again.',
        type: 'error',
      });
      return;
    }
    
    setLoading(true);
    console.log('[AccountSettings] Starting profile update...', formData);

    try {
      // 1. Update profile table first (important fields)
      const profileUpdates: Record<string, any> = {
        first_name: formData.firstName || null,
        last_name: formData.lastName || null,
        phone: formData.phone || null,
        address: {
          line1: formData.businessAddress1 || null,
          line2: formData.businessAddress2 || null,
          city: formData.city || null,
          postal_code: formData.postalCode || null,
          country: formData.country || null,
        },
        timezone: formData.timezone || 'UTC',
        preferences: { language: formData.language || 'en' },
      };

      // Update display name if first/last name provided
      if (formData.firstName || formData.lastName) {
        profileUpdates.display_name = `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || null;
      }

      console.log('[AccountSettings] Profile updates:', profileUpdates);
      await updateProfile(profileUpdates as any);
      console.log('[AccountSettings] Profile updated successfully');

      // 2. Attempt to update auth user metadata (non-critical)
      try {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            full_name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || null,
            language: formData.language || 'en',
            timezone: formData.timezone || 'UTC',
          },
        });

        if (authError) {
          console.warn('[AccountSettings] Auth metadata update failed:', authError);
        } else {
          console.log('[AccountSettings] Auth metadata updated successfully');
        }
      } catch (authErr) {
        console.warn('[AccountSettings] Auth metadata update error:', authErr);
      }

      // 3. Update organization if name changed and user has company_id
      if (formData.orgName && formData.orgName !== user.company?.name) {
        try {
          await updateCompany({ name: formData.orgName });
          console.log('[AccountSettings] Company updated successfully');
        } catch (companyErr) {
          console.warn('[AccountSettings] Company update failed:', companyErr);
          // Don't fail the entire operation for company update
        }
      }

      // 4. Track analytics
      try {
        analyticsService.track('profile_updated', {
          user_id: user.id,
          updated_fields: Object.keys(profileUpdates),
        });
      } catch (analyticsErr) {
        console.warn('[AccountSettings] Analytics tracking failed:', analyticsErr);
      }

      addNotification({
        message: 'Profile updated successfully!',
        type: 'success',
      });
    } catch (err) {
      console.error('[AccountSettings] Profile update failed:', err);
      addNotification({
        message: err instanceof Error ? err.message : 'Failed to update profile. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user email is verified
  const isEmailVerified = session?.user?.email_confirmed_at;
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Account Settings</h2>
        <p className="text-muted-foreground">Manage your personal information and preferences</p>
      </div>
      
      <Separator />
      
      {!isEmailVerified && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <h3 className="font-medium text-warning">Email Verification Required</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please verify your email address to access all account features and save your profile information.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2 border-warning text-warning hover:bg-warning/10"
                  onClick={handleResendVerification}
                  disabled={loading}
                >
                  Resend Verification Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  name="firstName"
                  placeholder="First Name" 
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  name="lastName"
                  placeholder="Last Name" 
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Email Address" 
                  value={user?.email || ''}
                  disabled
                  className="flex-1"
                />
                <div className="flex items-center space-x-2">
                  {user?.email ? (
                    <div className="flex items-center space-x-1 text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">Loading...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {user?.email ? 'Your email address is verified and cannot be changed' : 'Loading email address...'}
                </p>
                {user?.email && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={loading}
                  >
                    Resend Verification
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                name="phone"
                placeholder="Phone Number" 
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location
            </CardTitle>
            <CardDescription>Your address and timezone information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <AddressAutocomplete
                label="Business Address"
                placeholder="Start typing your business address..."
                value={formData.businessAddress1}
                onInputChange={(value) => setFormData(prev => ({ ...prev, businessAddress1: value }))}
                onChange={(address) => {
                  setFormData(prev => ({
                    ...prev,
                    businessAddress1: address.formatted_address,
                    businessAddress2: address.street_number && address.route 
                      ? `${address.street_number} ${address.route}` 
                      : prev.businessAddress2,
                    city: address.locality || prev.city,
                    postalCode: address.postal_code || prev.postalCode,
                    country: address.country || prev.country,
                  }));
                }}
                showBusinessSuggestions={true}
                countryRestriction={['US', 'CA', 'GB', 'AU']}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress2">Business Address Line 2</Label>
              <Input 
                id="businessAddress2" 
                name="businessAddress2"
                placeholder="Suite, Floor, etc. (optional)" 
                value={formData.businessAddress2}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  name="city"
                  placeholder="City" 
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input 
                  id="postalCode" 
                  name="postalCode"
                  placeholder="Postal Code" 
                  value={formData.postalCode}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  name="country"
                  placeholder="Country" 
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => handleValueChange('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="PST">Pacific Standard Time</SelectItem>
                    <SelectItem value="EST">Eastern Standard Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Language & Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Language & Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => handleValueChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input 
                  id="orgName"
                  name="orgName"
                  placeholder="Organization Name"
                  value={formData.orgName}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <CardFooter className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {user?.profile ? 'Profile loaded' : 'Profile loading...'}
          </div>
          <Button type="submit" disabled={loading || !user}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save All'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
};

export default AccountSettings; 