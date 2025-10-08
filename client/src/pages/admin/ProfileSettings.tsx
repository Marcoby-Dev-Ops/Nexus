import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { Separator } from '@/shared/components/ui/Separator';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and profile details.
        </p>
      </div>

      <div className="space-y-4">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Picture
            </CardTitle>
            <CardDescription>
              Update your profile picture and avatar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline">Upload New Picture</Button>
                <Button variant="ghost" size="sm">Remove Picture</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your basic personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" placeholder="Doe" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input id="display-name" placeholder="John Doe" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Update your contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                defaultValue="john.doe@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, Country"
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>
              Your professional details and experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title</Label>
              <Input id="job-title" placeholder="Software Engineer" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Tech Corp" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="50"
                placeholder="5"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skills">Skills & Expertise</Label>
              <Textarea
                id="skills"
                placeholder="React, TypeScript, Node.js, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings; 
