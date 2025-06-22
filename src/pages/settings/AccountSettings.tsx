import React, { useState, useEffect } from 'react';
import { User, MapPin, Globe, Save } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { Separator } from '../../components/ui/Separator';

/**
 * AccountSettings - Personal account settings page
 * 
 * Allows users to view and update their account information
 */
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];

const AccountSettings: React.FC = () => {
  const { user, updateProfile, updateCompany } = useAuth();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // 1. Update profile table first (important fields)
      const profileUpdates: Record<string, any> = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        address: {
          line1: formData.businessAddress1,
          line2: formData.businessAddress2,
          city: formData.city,
          postal_code: formData.postalCode,
          country: formData.country,
        },
        timezone: formData.timezone,
        preferences: { language: formData.language },
      };

      await updateProfile(profileUpdates as any);

      // 2. Attempt to update auth user metadata (non-critical)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          language: formData.language,
          timezone: formData.timezone,
        },
      });

      if (authError) {
        // Log but don't block profile save
        console.warn('Auth metadata update failed', authError);
      }

      // Update organization if name changed and user has company_id
      if (formData.orgName && formData.orgName !== user.company?.name) {
        await updateCompany({ name: formData.orgName });
      }

      addNotification({
        message: 'Profile updated successfully',
        type: 'success',
      });
    } catch (err) {
      addNotification({
        message: err instanceof Error ? err.message : 'Failed to update profile',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Account Settings</h2>
        <p className="text-muted-foreground">Manage your personal information and preferences</p>
      </div>
      
      <Separator />
      
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
              <Input 
                id="email" 
                type="email" 
                placeholder="Email Address" 
                defaultValue={user?.email || ''}
                disabled
              />
              <p className="text-xs text-muted-foreground">Your email address cannot be changed</p>
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
              <Label htmlFor="businessAddress1">Business Address Line 1</Label>
              <Input 
                id="businessAddress1" 
                name="businessAddress1"
                placeholder="Street, Building No." 
                value={formData.businessAddress1}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress2">Business Address Line 2</Label>
              <Input 
                id="businessAddress2" 
                name="businessAddress2"
                placeholder="Suite, Floor, etc." 
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
                <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="fr">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Berlin">Berlin</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Preferences
            </CardTitle>
            <CardDescription>Your language and notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border pt-4 flex justify-end">
            <Button isLoading={loading} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        {/* Organization */}
        {user?.company && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Organization
              </CardTitle>
              <CardDescription>Update your company / organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
};

export default AccountSettings; 