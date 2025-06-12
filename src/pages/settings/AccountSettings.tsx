import React from 'react';
import { User, Mail, Phone, Calendar, MapPin, Globe, Save } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { useAuth } from '../../contexts/AuthContext';
import { Separator } from '../../components/ui/Separator';

/**
 * AccountSettings - Personal account settings page
 * 
 * Allows users to view and update their account information
 */
const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation would update user profile
    console.log('Updating user profile...');
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
                  placeholder="First Name" 
                  defaultValue={user?.profile?.first_name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Last Name" 
                  defaultValue={user?.profile?.last_name || ''}
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
                placeholder="Phone Number" 
                defaultValue={user?.profile?.phone || ''}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="birthday">Date of Birth</Label>
              <Input 
                id="birthday" 
                type="date" 
                defaultValue={user?.profile?.birth_date || ''}
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
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                placeholder="Address" 
                defaultValue={user?.profile?.address || ''}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  placeholder="City" 
                  defaultValue={user?.profile?.city || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input 
                  id="postalCode" 
                  placeholder="Postal Code" 
                  defaultValue={user?.profile?.postal_code || ''}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select defaultValue={user?.profile?.country || ''}>
                  <SelectTrigger id="country">
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
                <Select defaultValue={user?.profile?.timezone || 'UTC'}>
                  <SelectTrigger id="timezone">
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
              <Select defaultValue={user?.profile?.preferences?.language || 'en'}>
                <SelectTrigger id="language">
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
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default AccountSettings; 