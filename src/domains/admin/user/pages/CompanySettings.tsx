import React, { useState, useEffect } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Separator } from '@/shared/components/ui/Separator';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Switch } from '@/shared/components/ui/Switch';
import { Building2, Camera, X, AlertCircle, Save, Edit, CheckCircle, Settings, Activity, Users, UserPlus } from 'lucide-react';
import { supabase } from '@/core/supabase';

interface CompanyData {
  name: string;
  industry: string;
  size: string;
  website: string;
  location: string;
  founded: string;
  description: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: string;
  avatar?: string;
}

interface CompanySettings {
  autoSync: boolean;
  teamAnalytics: boolean;
  aiInsights: boolean;
}

const CompanySettings: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    industry: '',
    size: '',
    website: '',
    location: '',
    founded: '',
    description: '',
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    autoSync: false,
    teamAnalytics: false,
    aiInsights: false,
  });

  const handleCompanyInputChange = (field: keyof CompanyData, value: string) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement company save logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Company information updated successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update company information.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize mock company data
  useEffect(() => {
    setCompanyData({
      name: 'Acme Corporation',
      industry: 'technology',
      size: '11-50',
      website: 'https://acme.com',
      location: 'San Francisco, CA',
      founded: '2020',
      description: 'A leading technology company focused on innovation and growth.',
    });
    
    setTeamMembers([
      { id: '1', name: 'John Doe', role: 'CEO', status: 'Active', avatar: undefined },
      { id: '2', name: 'Jane Smith', role: 'CTO', status: 'Active', avatar: undefined },
      { id: '3', name: 'Bob Johnson', role: 'CFO', status: 'Active', avatar: undefined },
    ]);
    
    setCompanySettings({
      autoSync: true,
      teamAnalytics: false,
      aiInsights: true,
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-muted-foreground">
          Manage your company information, team members, and business settings
        </p>
      </div>

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

      {/* Company Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Update your company details and business information
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
          {/* Company Logo Section */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
                <Button variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG or SVG. Max size 2MB.
              </p>
            </div>
          </div>

          <Separator />

          {/* Company Form Fields */}
          <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyData.name}
                onChange={(e) => handleCompanyInputChange('name', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select 
                value={companyData.industry} 
                onValueChange={(value) => handleCompanyInputChange('industry', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize">Company Size</Label>
              <Select 
                value={companyData.size} 
                onValueChange={(value) => handleCompanyInputChange('size', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="500+">500+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={companyData.website}
                onChange={(e) => handleCompanyInputChange('website', e.target.value)}
                disabled={!isEditing}
                placeholder="https: //company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={companyData.location}
                onChange={(e) => handleCompanyInputChange('location', e.target.value)}
                disabled={!isEditing}
                placeholder="City, Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="founded">Founded</Label>
              <Input
                id="founded"
                type="number"
                value={companyData.founded}
                onChange={(e) => handleCompanyInputChange('founded', e.target.value)}
                disabled={!isEditing}
                placeholder="2020"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              value={companyData.description}
              onChange={(e) => handleCompanyInputChange('description', e.target.value)}
              disabled={!isEditing}
              placeholder="Tell us about your company..."
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
        </CardContent>
      </Card>

      {/* Team Members Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            Manage your team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Active Members</h4>
                <p className="text-sm text-muted-foreground">
                  {teamMembers.length} team members
                </p>
              </div>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </div>

            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{member.status}</Badge>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Company Settings
          </CardTitle>
          <CardDescription>
            Configure company-wide settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Data Sync</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically sync data across integrations
                </p>
              </div>
              <Switch 
                checked={companySettings.autoSync} 
                onCheckedChange={(checked) => setCompanySettings(prev => ({ ...prev, autoSync: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Team Analytics</h4>
                <p className="text-sm text-muted-foreground">
                  Share analytics with team members
                </p>
              </div>
              <Switch 
                checked={companySettings.teamAnalytics} 
                onCheckedChange={(checked) => setCompanySettings(prev => ({ ...prev, teamAnalytics: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">AI Insights</h4>
                <p className="text-sm text-muted-foreground">
                  Enable AI-powered business insights
                </p>
              </div>
              <Switch 
                checked={companySettings.aiInsights} 
                onCheckedChange={(checked) => setCompanySettings(prev => ({ ...prev, aiInsights: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySettings; 